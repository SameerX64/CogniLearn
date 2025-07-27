import pandas as pd
import numpy as np
from openai import OpenAI
from sentence_transformers import SentenceTransformer
from sklearn.cluster import KMeans
from typing import List, Dict, Any, Optional
import asyncio

class CurriculumSequencer:
    def __init__(self, api_key):
        # Initialize NVIDIA API client
        self.client = OpenAI(
            base_url="https://integrate.api.nvidia.com/v1",
            api_key=api_key
        )
        
        # Sentence transformer for semantic embeddings
        try:
            self.embedder = SentenceTransformer('all-mpnet-base-v2')
        except Exception as e:
            print(f"Warning: Could not load sentence transformer: {e}")
            self.embedder = None
        
        # Curriculum complexity levels
        self.levels = [
            "basic introduction", 
            "fundamental concepts",
            "essential techniques",
            "practical applications",
            "advanced theories",
            "expert-level content",
            "research-oriented material",
            "cutting-edge developments",
            "specialized mastery"
        ]

    def estimate_complexity(self, text):
        """Use Llama-3 via NVIDIA API for complexity estimation"""
        prompt = f"""
        Analyze this educational content and classify its complexity level (1-9):
        {text}
        
        Complexity Scale:
        1. Basic introduction
        2. Fundamental concepts
        3. Essential techniques
        4. Practical applications
        5. Advanced theories
        6. Expert-level content
        7. Research-oriented material
        8. Cutting-edge developments
        9. Specialized mastery
        
        Return ONLY the number corresponding to the complexity level.
        """
        
        try:
            completion = self.client.chat.completions.create(
                model="meta/llama3-70b-instruct",
                messages=[{"role": "user", "content": prompt}],
                temperature=0.3,
                top_p=0.9,
                max_tokens=10
            )
            response = completion.choices[0].message.content
            return int(response.strip())
        except Exception as e:
            print(f"Complexity estimation error: {e}")
            # Fallback complexity estimation
            word_count = len(text.split())
            if word_count < 100:
                return 1
            elif word_count < 300:
                return 3
            elif word_count < 500:
                return 5
            else:
                return 7

    async def generate_course_recommendations(
        self, 
        user_profile: Dict[str, Any],
        available_courses: List[Dict[str, Any]],
        limit: int = 10
    ) -> List[str]:
        """Generate personalized course recommendations for a user"""
        
        try:
            # Extract user characteristics
            user_expertise = user_profile.get('expertise', [])
            user_interests = user_profile.get('interests', [])
            user_preferences = user_profile.get('preferences', {})
            enrolled_courses = user_profile.get('enrolledCourses', [])
            learning_goals = user_profile.get('learningGoals', [])
            
            # Calculate user's average expertise level
            avg_expertise = 0
            if user_expertise:
                avg_expertise = sum(exp.get('level', 1) for exp in user_expertise) / len(user_expertise)
            
            # Score courses based on multiple factors
            course_scores = []
            
            for course in available_courses:
                if course.get('_id') in enrolled_courses:
                    continue  # Skip already enrolled courses
                
                score = await self._calculate_course_score(
                    course, user_expertise, user_interests, 
                    user_preferences, learning_goals, avg_expertise
                )
                
                course_scores.append({
                    'course_id': course.get('_id'),
                    'score': score,
                    'title': course.get('title', ''),
                    'category': course.get('category', ''),
                    'level': course.get('level', ''),
                    'complexity': course.get('complexity', 5)
                })
            
            # Sort by score and return top recommendations
            course_scores.sort(key=lambda x: x['score'], reverse=True)
            recommended_course_ids = [course['course_id'] for course in course_scores[:limit]]
            
            return recommended_course_ids
            
        except Exception as e:
            print(f"Course recommendation error: {e}")
            # Return fallback recommendations (random selection)
            non_enrolled = [c.get('_id') for c in available_courses if c.get('_id') not in enrolled_courses]
            return non_enrolled[:limit]
    
    async def _calculate_course_score(
        self,
        course: Dict[str, Any],
        user_expertise: List[Dict[str, Any]],
        user_interests: List[str],
        user_preferences: Dict[str, Any],
        learning_goals: List[str],
        avg_expertise: float
    ) -> float:
        """Calculate recommendation score for a specific course"""
        
        score = 0.0
        
        # 1. Interest alignment (30% weight)
        course_category = course.get('category', '').lower()
        course_tags = [tag.lower() for tag in course.get('tags', [])]
        course_skills = [skill.lower() for skill in course.get('skills', [])]
        
        interest_match = 0
        for interest in user_interests:
            interest_lower = interest.lower()
            if (interest_lower in course_category or 
                any(interest_lower in tag for tag in course_tags) or
                any(interest_lower in skill for skill in course_skills)):
                interest_match += 1
        
        if user_interests:
            score += (interest_match / len(user_interests)) * 30
        
        # 2. Expertise level matching (25% weight)
        course_complexity = course.get('complexity', 5)
        course_level = course.get('level', 'intermediate')
        
        # Convert level to numeric
        level_mapping = {'beginner': 3, 'intermediate': 5, 'advanced': 8}
        numeric_level = level_mapping.get(course_level, 5)
        
        # Find matching expertise
        expertise_match = False
        for exp in user_expertise:
            exp_subject = exp.get('subject', '').lower()
            if (exp_subject in course_category or 
                any(exp_subject in tag for tag in course_tags)):
                user_level = exp.get('level', 1)
                # Prefer courses slightly above user's level
                if user_level <= numeric_level <= user_level + 3:
                    score += 25
                    expertise_match = True
                    break
        
        if not expertise_match and avg_expertise > 0:
            # General level matching
            if avg_expertise <= numeric_level <= avg_expertise + 2:
                score += 15
        
        # 3. Learning goals alignment (20% weight)
        goals_match = 0
        for goal in learning_goals:
            goal_lower = goal.lower()
            if (goal_lower in course.get('title', '').lower() or
                goal_lower in course.get('description', '').lower() or
                any(goal_lower in tag for tag in course_tags)):
                goals_match += 1
        
        if learning_goals:
            score += (goals_match / len(learning_goals)) * 20
        
        # 4. Course quality metrics (15% weight)
        course_rating = course.get('ratings', {}).get('average', 0)
        score += (course_rating / 5.0) * 10  # Normalize to 10 points max
        
        enrollment_count = course.get('enrollment', {}).get('count', 0)
        if enrollment_count > 100:
            score += 5  # Popular courses bonus
        
        # 5. Preference matching (10% weight)
        user_difficulty = user_preferences.get('difficultyLevel', 'intermediate')
        if course_level == user_difficulty:
            score += 10
        
        # 6. Content freshness and relevance
        if course.get('isFeatured', False):
            score += 5
        
        if course.get('aiGenerated', False):
            score += 3  # Slight bonus for AI-generated content
        
        return score
    
    def sequence_curriculum(self, courses: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        """Sequence courses in optimal learning order"""
        
        if not courses:
            return courses
        
        # Extract complexity levels
        complexities = []
        for course in courses:
            if 'complexity' not in course:
                # Estimate complexity from description
                description = course.get('description', '') + ' ' + course.get('title', '')
                course['complexity'] = self.estimate_complexity(description)
            complexities.append(course['complexity'])
        
        # Sort by complexity (prerequisite order)
        sorted_courses = sorted(courses, key=lambda x: x['complexity'])
        
        # Apply clustering for similar complexity levels
        if len(courses) > 3 and self.embedder:
            try:
                # Get text embeddings
                texts = [f"{course.get('title', '')} {course.get('description', '')}" for course in sorted_courses]
                embeddings = self.embedder.encode(texts)
                
                # Cluster similar courses
                n_clusters = min(len(courses) // 2, 5)  # Max 5 clusters
                kmeans = KMeans(n_clusters=n_clusters, random_state=42, n_init=10)
                clusters = kmeans.fit_predict(embeddings)
                
                # Group by cluster while maintaining complexity order
                clustered_courses = []
                for cluster_id in range(n_clusters):
                    cluster_courses = [course for i, course in enumerate(sorted_courses) if clusters[i] == cluster_id]
                    cluster_courses.sort(key=lambda x: x['complexity'])
                    clustered_courses.extend(cluster_courses)
                
                return clustered_courses
                
            except Exception as e:
                print(f"Clustering error: {e}")
                return sorted_courses
        
        return sorted_courses
    
    async def get_adaptive_next_courses(
        self,
        user_id: str,
        completed_courses: List[Dict[str, Any]],
        current_performance: Dict[str, Any],
        available_courses: List[Dict[str, Any]]
    ) -> List[str]:
        """Get adaptive course recommendations based on performance"""
        
        try:
            # Analyze performance to adjust difficulty
            avg_score = current_performance.get('averageQuizScore', 75)
            completion_rate = current_performance.get('completionRate', 0.8)
            
            # Determine next difficulty level
            if avg_score >= 85 and completion_rate >= 0.9:
                # User is excelling, recommend harder content
                target_complexity_min = 6
                target_complexity_max = 9
            elif avg_score >= 70 and completion_rate >= 0.7:
                # User is doing well, maintain current level
                target_complexity_min = 4
                target_complexity_max = 7
            else:
                # User is struggling, recommend easier content
                target_complexity_min = 1
                target_complexity_max = 5
            
            # Filter courses by target complexity
            suitable_courses = []
            for course in available_courses:
                complexity = course.get('complexity', 5)
                if target_complexity_min <= complexity <= target_complexity_max:
                    suitable_courses.append(course)
            
            # Get recommendations from suitable courses
            user_profile = {
                'expertise': self._extract_expertise_from_completed(completed_courses),
                'interests': self._extract_interests_from_completed(completed_courses),
                'preferences': {'difficultyLevel': 'intermediate'},
                'enrolledCourses': [],
                'learningGoals': []
            }
            
            recommendations = await self.generate_course_recommendations(
                user_profile, suitable_courses, limit=5
            )
            
            return recommendations
            
        except Exception as e:
            print(f"Adaptive recommendation error: {e}")
            return []
    
    def _extract_expertise_from_completed(self, completed_courses: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        """Extract expertise areas from completed courses"""
        
        expertise = {}
        for course in completed_courses:
            category = course.get('category', 'General')
            complexity = course.get('complexity', 5)
            
            if category not in expertise:
                expertise[category] = []
            expertise[category].append(complexity)
        
        # Calculate average expertise level per category
        result = []
        for category, complexities in expertise.items():
            avg_level = sum(complexities) / len(complexities)
            result.append({
                'subject': category,
                'level': min(round(avg_level), 10)  # Cap at 10
            })
        
        return result
    
    def _extract_interests_from_completed(self, completed_courses: List[Dict[str, Any]]) -> List[str]:
        """Extract interests from completed courses"""
        
        interests = set()
        for course in completed_courses:
            interests.add(course.get('category', ''))
            interests.update(course.get('tags', []))
            interests.update(course.get('skills', []))
        
        return list(interests)
