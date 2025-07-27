"""
Course Recommendation Service using Google Gemini AI and ML algorithms
"""
import asyncio
import logging
import time
import pandas as pd
import numpy as np
from typing import Dict, Any, Optional, List
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity
from sklearn.preprocessing import StandardScaler

from ..models.schemas import (
    CourseRecommendationRequest,
    CourseRecommendationResponse,
    CourseInfo,
    RecommendationScore,
    DifficultyLevel
)
from ..utils import (
    get_gemini_client,
    log_api_call,
    extract_keywords
)

logger = logging.getLogger(__name__)


class CourseRecommendationService:
    """Advanced course recommendation service using Gemini AI and ML."""
    
    def __init__(self):
        """Initialize the course recommendation service."""
        self.gemini = get_gemini_client()
        self.tfidf_vectorizer = TfidfVectorizer(max_features=1000, stop_words='english')
        self.scaler = StandardScaler()
        self.course_data = self._load_course_data()
        self.user_profiles = self._load_user_profiles()
        self._prepare_features()
    
    async def get_recommendations(self, request: CourseRecommendationRequest) -> CourseRecommendationResponse:
        """Get personalized course recommendations."""
        start_time = time.time()
        
        try:
            # Get AI-enhanced user profile analysis
            user_analysis = await self._analyze_user_profile(request)
            
            # Generate recommendations using hybrid approach
            recommendations = await self._generate_hybrid_recommendations(
                request, user_analysis
            )
            
            processing_time = time.time() - start_time
            
            # Log successful API call
            log_api_call(
                "course_recommendation",
                "get_recommendations",
                True,
                processing_time
            )
            
            return CourseRecommendationResponse(
                user_id=request.user_id,
                recommendations=recommendations[:request.max_recommendations],
                total_count=len(recommendations),
                processing_time=processing_time,
                fallback=False
            )
            
        except Exception as e:
            processing_time = time.time() - start_time
            logger.error(f"Course recommendation failed: {e}")
            
            # Log failed API call
            log_api_call(
                "course_recommendation",
                "get_recommendations",
                False,
                processing_time,
                str(e)
            )
            
            # Return fallback recommendations
            fallback_recs = self._create_fallback_recommendations(request)
            
            return CourseRecommendationResponse(
                user_id=request.user_id,
                recommendations=fallback_recs,
                total_count=len(fallback_recs),
                processing_time=processing_time,
                fallback=True
            )
    
    async def _analyze_user_profile(self, request: CourseRecommendationRequest) -> Dict[str, Any]:
        """Use Gemini to analyze user profile and preferences."""
        
        try:
            prompt = f"""Analyze this user profile for course recommendations:

User Profile:
- Expertise Level: {request.expertise_level}
- Interests: {', '.join(request.interests)}
- Learning Goals: {', '.join(request.learning_goals)}
- Preferred Difficulty: {request.preferred_difficulty.value if request.preferred_difficulty else 'Not specified'}

Based on this profile, provide a JSON analysis with:
1. Learning style preferences
2. Recommended course categories
3. Skill gaps to address
4. Motivation factors
5. Optimal learning path suggestions

Respond with valid JSON:
{{
    "learning_style": "visual/auditory/kinesthetic/reading",
    "recommended_categories": ["category1", "category2", ...],
    "skill_gaps": ["skill1", "skill2", ...],
    "motivation_factors": ["factor1", "factor2", ...],
    "learning_path": ["beginner/intermediate/advanced sequence"],
    "focus_areas": ["area1", "area2", ...],
    "suggested_duration": "short/medium/long term"
}}"""
            
            response = await self.gemini.generate_json(prompt, temperature=0.7)
            
            if response and not response.get("error"):
                return response
            else:
                return self._create_basic_user_analysis(request)
                
        except Exception as e:
            logger.error(f"User profile analysis failed: {e}")
            return self._create_basic_user_analysis(request)
    
    async def _generate_hybrid_recommendations(
        self,
        request: CourseRecommendationRequest,
        user_analysis: Dict[str, Any]
    ) -> List[RecommendationScore]:
        """Generate recommendations using hybrid approach (content + collaborative + AI)."""
        
        # Get content-based recommendations
        content_recs = self._get_content_based_recommendations(request, user_analysis)
        
        # Get collaborative filtering recommendations
        collab_recs = self._get_collaborative_recommendations(request)
        
        # Get AI-enhanced recommendations
        ai_recs = await self._get_ai_recommendations(request, user_analysis)
        
        # Combine and rank recommendations
        combined_recs = self._combine_recommendations(
            content_recs, collab_recs, ai_recs
        )
        
        return combined_recs
    
    def _get_content_based_recommendations(
        self,
        request: CourseRecommendationRequest,
        user_analysis: Dict[str, Any]
    ) -> List[RecommendationScore]:
        """Get content-based recommendations using TF-IDF similarity."""
        
        try:
            # Create user interest vector
            user_text = " ".join(request.interests + request.learning_goals)
            user_keywords = extract_keywords(user_text)
            user_profile_text = " ".join(user_keywords)
            
            if not user_profile_text.strip():
                return []
            
            # Calculate similarities
            course_features = self.course_data['combined_features'].tolist()
            all_texts = course_features + [user_profile_text]
            
            tfidf_matrix = self.tfidf_vectorizer.fit_transform(all_texts)
            user_vector = tfidf_matrix[-1]
            course_vectors = tfidf_matrix[:-1]
            
            similarities = cosine_similarity(user_vector, course_vectors).flatten()
            
            # Create recommendations
            recommendations = []
            for idx, similarity in enumerate(similarities):
                if similarity > 0.1:  # Minimum similarity threshold
                    course = self.course_data.iloc[idx]
                    
                    # Adjust score based on user preferences
                    adjusted_score = self._adjust_score_for_preferences(
                        similarity, course, request, user_analysis
                    )
                    
                    if adjusted_score > 0.2:
                        course_info = CourseInfo(
                            id=str(course['id']),
                            title=course['title'],
                            description=course['description'],
                            difficulty=course['difficulty'],
                            duration=course['duration'],
                            instructor=course.get('instructor'),
                            rating=course.get('rating'),
                            topics=course.get('topics', []),
                            skills=course.get('skills', []),
                            prerequisites=course.get('prerequisites', [])
                        )
                        
                        reasons = self._generate_recommendation_reasons(
                            course, request, user_analysis, "content-based"
                        )
                        
                        recommendations.append(RecommendationScore(
                            item=course_info,
                            score=adjusted_score,
                            reasons=reasons
                        ))
            
            # Sort by score
            recommendations.sort(key=lambda x: x.score, reverse=True)
            return recommendations[:20]  # Top 20
            
        except Exception as e:
            logger.error(f"Content-based recommendations failed: {e}")
            return []
    
    def _get_collaborative_recommendations(self, request: CourseRecommendationRequest) -> List[RecommendationScore]:
        """Get collaborative filtering recommendations."""
        
        try:
            # Find similar users based on expertise and interests
            similar_users = self._find_similar_users(request)
            
            if not similar_users:
                return []
            
            # Get courses taken by similar users
            recommended_courses = {}
            
            for similar_user in similar_users[:10]:  # Top 10 similar users
                user_courses = similar_user.get('completed_courses', [])
                for course_id in user_courses:
                    if course_id not in recommended_courses:
                        recommended_courses[course_id] = 0
                    recommended_courses[course_id] += similar_user.get('similarity', 0.5)
            
            # Convert to RecommendationScore objects
            recommendations = []
            for course_id, score in recommended_courses.items():
                course_data = self.course_data[self.course_data['id'] == course_id]
                if not course_data.empty:
                    course = course_data.iloc[0]
                    
                    course_info = CourseInfo(
                        id=str(course['id']),
                        title=course['title'],
                        description=course['description'],
                        difficulty=course['difficulty'],
                        duration=course['duration'],
                        instructor=course.get('instructor'),
                        rating=course.get('rating'),
                        topics=course.get('topics', []),
                        skills=course.get('skills', []),
                        prerequisites=course.get('prerequisites', [])
                    )
                    
                    reasons = [
                        "Recommended by users with similar interests",
                        "Popular among learners with similar background"
                    ]
                    
                    recommendations.append(RecommendationScore(
                        item=course_info,
                        score=min(score, 1.0),
                        reasons=reasons
                    ))
            
            recommendations.sort(key=lambda x: x.score, reverse=True)
            return recommendations[:15]  # Top 15
            
        except Exception as e:
            logger.error(f"Collaborative recommendations failed: {e}")
            return []
    
    async def _get_ai_recommendations(
        self,
        request: CourseRecommendationRequest,
        user_analysis: Dict[str, Any]
    ) -> List[RecommendationScore]:
        """Get AI-enhanced recommendations using Gemini."""
        
        try:
            # Sample course titles for AI to consider
            sample_courses = self.course_data.sample(min(50, len(self.course_data)))['title'].tolist()
            
            prompt = f"""Based on this user profile and analysis, recommend the most suitable courses:

User Profile:
- Expertise: {request.expertise_level}
- Interests: {', '.join(request.interests)}
- Goals: {', '.join(request.learning_goals)}

User Analysis:
- Learning Style: {user_analysis.get('learning_style', 'mixed')}
- Focus Areas: {', '.join(user_analysis.get('focus_areas', []))}
- Skill Gaps: {', '.join(user_analysis.get('skill_gaps', []))}

Available Courses (sample):
{', '.join(sample_courses[:20])}

Recommend 5-10 courses that would be most beneficial. For each recommendation, provide:
1. Course title (from the list or similar)
2. Relevance score (0-1)
3. Reasons for recommendation

Respond with valid JSON:
{{
    "recommendations": [
        {{
            "title": "Course Title",
            "relevance_score": 0.85,
            "reasons": ["reason1", "reason2", "reason3"],
            "priority": "high/medium/low"
        }}
    ]
}}"""
            
            response = await self.gemini.generate_json(prompt, temperature=0.6)
            
            if response and "recommendations" in response:
                return self._format_ai_recommendations(response["recommendations"])
            else:
                return []
                
        except Exception as e:
            logger.error(f"AI recommendations failed: {e}")
            return []
    
    def _combine_recommendations(
        self,
        content_recs: List[RecommendationScore],
        collab_recs: List[RecommendationScore],
        ai_recs: List[RecommendationScore]
    ) -> List[RecommendationScore]:
        """Combine recommendations from different approaches."""
        
        # Weight the different recommendation types
        weights = {
            "content": 0.4,
            "collaborative": 0.3,
            "ai": 0.3
        }
        
        # Combine recommendations by course ID
        combined = {}
        
        # Process content-based recommendations
        for rec in content_recs:
            course_id = rec.item.id
            if course_id not in combined:
                combined[course_id] = {
                    "item": rec.item,
                    "scores": {"content": 0, "collaborative": 0, "ai": 0},
                    "reasons": set()
                }
            combined[course_id]["scores"]["content"] = rec.score
            combined[course_id]["reasons"].update(rec.reasons)
        
        # Process collaborative recommendations
        for rec in collab_recs:
            course_id = rec.item.id
            if course_id not in combined:
                combined[course_id] = {
                    "item": rec.item,
                    "scores": {"content": 0, "collaborative": 0, "ai": 0},
                    "reasons": set()
                }
            combined[course_id]["scores"]["collaborative"] = rec.score
            combined[course_id]["reasons"].update(rec.reasons)
        
        # Process AI recommendations
        for rec in ai_recs:
            course_id = rec.item.id
            if course_id not in combined:
                combined[course_id] = {
                    "item": rec.item,
                    "scores": {"content": 0, "collaborative": 0, "ai": 0},
                    "reasons": set()
                }
            combined[course_id]["scores"]["ai"] = rec.score
            combined[course_id]["reasons"].update(rec.reasons)
        
        # Calculate final scores
        final_recommendations = []
        for course_id, data in combined.items():
            scores = data["scores"]
            final_score = (
                scores["content"] * weights["content"] +
                scores["collaborative"] * weights["collaborative"] +
                scores["ai"] * weights["ai"]
            )
            
            if final_score > 0.1:  # Minimum threshold
                final_recommendations.append(RecommendationScore(
                    item=data["item"],
                    score=final_score,
                    reasons=list(data["reasons"])[:5]  # Limit reasons
                ))
        
        # Sort by final score
        final_recommendations.sort(key=lambda x: x.score, reverse=True)
        return final_recommendations
    
    def _adjust_score_for_preferences(
        self,
        base_score: float,
        course: pd.Series,
        request: CourseRecommendationRequest,
        user_analysis: Dict[str, Any]
    ) -> float:
        """Adjust recommendation score based on user preferences."""
        
        adjusted_score = base_score
        
        # Difficulty preference adjustment
        if request.preferred_difficulty:
            course_diff = course.get('difficulty', 'medium').lower()
            preferred_diff = request.preferred_difficulty.value.lower()
            
            if course_diff == preferred_diff:
                adjusted_score *= 1.2
            elif abs(self._difficulty_to_num(course_diff) - self._difficulty_to_num(preferred_diff)) == 1:
                adjusted_score *= 1.1
            else:
                adjusted_score *= 0.8
        
        # Expertise level adjustment
        expertise_boost = {
            "beginner": {"basic": 1.3, "intermediate": 1.0, "advanced": 0.7},
            "intermediate": {"basic": 0.8, "intermediate": 1.3, "advanced": 1.1},
            "advanced": {"basic": 0.6, "intermediate": 1.0, "advanced": 1.3}
        }
        
        course_level = course.get('difficulty', 'intermediate').lower()
        user_level = request.expertise_level.lower()
        
        if user_level in expertise_boost and course_level in expertise_boost[user_level]:
            adjusted_score *= expertise_boost[user_level][course_level]
        
        return min(adjusted_score, 1.0)
    
    def _difficulty_to_num(self, difficulty: str) -> int:
        """Convert difficulty to number for comparison."""
        mapping = {"easy": 1, "basic": 1, "medium": 2, "intermediate": 2, "hard": 3, "advanced": 3}
        return mapping.get(difficulty.lower(), 2)
    
    def _generate_recommendation_reasons(
        self,
        course: pd.Series,
        request: CourseRecommendationRequest,
        user_analysis: Dict[str, Any],
        method: str
    ) -> List[str]:
        """Generate reasons for recommendation."""
        
        reasons = []
        
        if method == "content-based":
            # Check interest overlap
            course_topics = course.get('topics', [])
            user_interests = request.interests
            
            common_interests = set(course_topics) & set(user_interests)
            if common_interests:
                reasons.append(f"Matches your interests in {', '.join(list(common_interests)[:2])}")
            
            # Check skill development
            course_skills = course.get('skills', [])
            skill_gaps = user_analysis.get('skill_gaps', [])
            
            skill_overlap = set(course_skills) & set(skill_gaps)
            if skill_overlap:
                reasons.append(f"Helps develop skills in {', '.join(list(skill_overlap)[:2])}")
            
            # Check difficulty match
            if course.get('difficulty', '').lower() == request.preferred_difficulty.value.lower() if request.preferred_difficulty else False:
                reasons.append("Matches your preferred difficulty level")
        
        # Add rating-based reason
        rating = course.get('rating')
        if rating and rating >= 4.5:
            reasons.append(f"Highly rated course ({rating}/5.0)")
        
        # Add popularity reason
        if course.get('enrollment_count', 0) > 1000:
            reasons.append("Popular course with many successful students")
        
        return reasons[:3]  # Limit to 3 reasons
    
    def _load_course_data(self) -> pd.DataFrame:
        """Load course data - placeholder for actual data loading."""
        # This would typically load from a database or CSV file
        # For now, create sample data
        
        sample_courses = [
            {
                "id": 1,
                "title": "Introduction to Machine Learning",
                "description": "Learn the fundamentals of machine learning algorithms and applications",
                "difficulty": "intermediate",
                "duration": "8 weeks",
                "instructor": "Dr. Smith",
                "rating": 4.6,
                "topics": ["machine learning", "algorithms", "data science"],
                "skills": ["python", "statistics", "data analysis"],
                "prerequisites": ["basic programming"],
                "enrollment_count": 2500
            },
            {
                "id": 2,
                "title": "Web Development Bootcamp",
                "description": "Complete web development course covering HTML, CSS, JavaScript, and React",
                "difficulty": "beginner",
                "duration": "12 weeks",
                "instructor": "Jane Doe",
                "rating": 4.8,
                "topics": ["web development", "javascript", "react"],
                "skills": ["html", "css", "javascript", "react"],
                "prerequisites": [],
                "enrollment_count": 5000
            },
            # Add more sample courses...
        ]
        
        df = pd.DataFrame(sample_courses)
        return df
    
    def _load_user_profiles(self) -> List[Dict[str, Any]]:
        """Load user profiles for collaborative filtering."""
        # Placeholder for actual user data loading
        return [
            {
                "user_id": "user1",
                "expertise_level": "intermediate",
                "interests": ["machine learning", "data science"],
                "completed_courses": [1, 3, 5],
                "similarity": 0.8
            }
        ]
    
    def _prepare_features(self):
        """Prepare features for recommendation algorithms."""
        try:
            # Combine text features for TF-IDF
            self.course_data['combined_features'] = (
                self.course_data['title'].fillna('') + ' ' +
                self.course_data['description'].fillna('') + ' ' +
                self.course_data['topics'].apply(lambda x: ' '.join(x) if isinstance(x, list) else str(x)).fillna('') + ' ' +
                self.course_data['skills'].apply(lambda x: ' '.join(x) if isinstance(x, list) else str(x)).fillna('')
            )
        except Exception as e:
            logger.error(f"Feature preparation failed: {e}")
            # Create basic features
            self.course_data['combined_features'] = self.course_data['title'].fillna('')
    
    def _find_similar_users(self, request: CourseRecommendationRequest) -> List[Dict[str, Any]]:
        """Find users similar to the current user."""
        # Placeholder implementation
        # In a real system, this would calculate user similarity based on
        # past courses, ratings, interests, etc.
        return []
    
    def _format_ai_recommendations(self, ai_recs: List[Dict[str, Any]]) -> List[RecommendationScore]:
        """Format AI recommendations into RecommendationScore objects."""
        
        formatted = []
        for rec in ai_recs:
            try:
                title = rec.get("title", "")
                score = float(rec.get("relevance_score", 0.5))
                reasons = rec.get("reasons", [])
                
                # Find matching course in database
                matching_courses = self.course_data[
                    self.course_data['title'].str.contains(title, case=False, na=False)
                ]
                
                if not matching_courses.empty:
                    course = matching_courses.iloc[0]
                    
                    course_info = CourseInfo(
                        id=str(course['id']),
                        title=course['title'],
                        description=course['description'],
                        difficulty=course['difficulty'],
                        duration=course['duration'],
                        instructor=course.get('instructor'),
                        rating=course.get('rating'),
                        topics=course.get('topics', []),
                        skills=course.get('skills', []),
                        prerequisites=course.get('prerequisites', [])
                    )
                    
                    formatted.append(RecommendationScore(
                        item=course_info,
                        score=score,
                        reasons=reasons
                    ))
            except Exception as e:
                logger.warning(f"Failed to format AI recommendation: {e}")
                continue
        
        return formatted
    
    def _create_basic_user_analysis(self, request: CourseRecommendationRequest) -> Dict[str, Any]:
        """Create basic user analysis when AI analysis fails."""
        
        return {
            "learning_style": "mixed",
            "recommended_categories": request.interests[:3] if request.interests else ["general"],
            "skill_gaps": request.learning_goals[:3] if request.learning_goals else ["foundational"],
            "motivation_factors": ["career advancement", "skill development"],
            "learning_path": [request.expertise_level],
            "focus_areas": request.interests + request.learning_goals,
            "suggested_duration": "medium term"
        }
    
    def _create_fallback_recommendations(self, request: CourseRecommendationRequest) -> List[RecommendationScore]:
        """Create fallback recommendations when main system fails."""
        
        # Return popular/highly-rated courses
        fallback_courses = self.course_data.head(5)  # Top 5 courses
        
        recommendations = []
        for _, course in fallback_courses.iterrows():
            course_info = CourseInfo(
                id=str(course['id']),
                title=course['title'],
                description=course['description'],
                difficulty=course['difficulty'],
                duration=course['duration'],
                instructor=course.get('instructor'),
                rating=course.get('rating'),
                topics=course.get('topics', []),
                skills=course.get('skills', []),
                prerequisites=course.get('prerequisites', [])
            )
            
            recommendations.append(RecommendationScore(
                item=course_info,
                score=0.7,  # Default score
                reasons=["Popular course", "High rating", "Fallback recommendation"]
            ))
        
        return recommendations
