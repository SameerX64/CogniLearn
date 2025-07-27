from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional, Dict, Any
import os
from dotenv import load_dotenv

# Load existing AI modules
from course_recommendation import CurriculumSequencer
from mentor_recommendation import suggest_mentors
from quiz_generator import QuizGenerator
from research_analyzer import ResearchAnalyzer

load_dotenv()

app = FastAPI(
    title="CogniLearn AI Services",
    description="AI-powered services for personalized learning",
    version="1.0.0"
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://localhost:3001"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize AI services
nvidia_api_key = os.getenv("NVIDIA_API_KEY")
openai_api_key = os.getenv("OPENAI_API_KEY")

# Global AI service instances
curriculum_sequencer = None
quiz_generator = None
research_analyzer = None

@app.on_event("startup")
async def startup_event():
    global curriculum_sequencer, quiz_generator, research_analyzer
    
    try:
        if nvidia_api_key:
            curriculum_sequencer = CurriculumSequencer(nvidia_api_key)
            print("✅ Curriculum Sequencer initialized")
        
        quiz_generator = QuizGenerator(nvidia_api_key or openai_api_key)
        print("✅ Quiz Generator initialized")
        
        research_analyzer = ResearchAnalyzer(nvidia_api_key or openai_api_key)
        print("✅ Research Analyzer initialized")
        
    except Exception as e:
        print(f"⚠️ Warning: AI services initialization error: {e}")

# Pydantic models
class UserData(BaseModel):
    expertise: List[Dict[str, Any]]
    interests: List[str]
    preferences: Dict[str, Any]
    enrolledCourses: List[str]
    learningGoals: List[str]

class RecommendationRequest(BaseModel):
    user: UserData
    limit: int = 10

class QuizGenerationRequest(BaseModel):
    topic: str
    difficulty: str = "medium"
    questionCount: int = 10
    type: str = "multiple-choice"
    source: str = "general"

class ResearchAnalysisRequest(BaseModel):
    text: str
    source: Optional[Dict[str, str]] = None
    title: Optional[str] = None

class MentorRequest(BaseModel):
    userNumber: int
    selectedSubjects: List[str]
    userData: List[Dict[str, Any]]
    numSuggestions: int = 5

# Health check
@app.get("/health")
async def health_check():
    return {
        "status": "healthy",
        "services": {
            "curriculum_sequencer": curriculum_sequencer is not None,
            "quiz_generator": quiz_generator is not None,
            "research_analyzer": research_analyzer is not None
        }
    }

# Course recommendations endpoint
@app.post("/api/recommendations")
async def get_course_recommendations(request: RecommendationRequest):
    try:
        if not curriculum_sequencer:
            raise HTTPException(status_code=503, detail="Curriculum sequencer not available")
        
        # Extract user preferences and expertise
        user_interests = request.user.interests
        user_expertise = {exp.get('subject', ''): exp.get('level', 1) for exp in request.user.expertise}
        
        # For now, return a simple recommendation based on interests
        # In a real implementation, you'd use the AI model
        recommendations = []
        
        # This is a placeholder - you'd implement the actual recommendation logic
        sample_courses = [
            "673b2a1234567890abcdef01",  # Sample MongoDB ObjectIds
            "673b2a1234567890abcdef02",
            "673b2a1234567890abcdef03",
            "673b2a1234567890abcdef04",
            "673b2a1234567890abcdef05"
        ]
        
        return {"recommendations": sample_courses[:request.limit]}
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Recommendation error: {str(e)}")

# Quiz generation endpoint
@app.post("/api/generate-quiz")
async def generate_quiz(request: QuizGenerationRequest):
    try:
        if not quiz_generator:
            raise HTTPException(status_code=503, detail="Quiz generator not available")
        
        # Generate quiz using AI
        quiz_data = await quiz_generator.generate_quiz(
            topic=request.topic,
            difficulty=request.difficulty,
            question_count=request.questionCount,
            question_type=request.type,
            source=request.source
        )
        
        return quiz_data
        
    except Exception as e:
        # Fallback quiz generation
        fallback_quiz = {
            "title": f"{request.topic} Quiz",
            "description": f"AI-generated quiz on {request.topic}",
            "category": "General",
            "questions": [
                {
                    "question": f"What is a key concept in {request.topic}?",
                    "type": "multiple-choice",
                    "options": [
                        {"text": "Option A", "isCorrect": True},
                        {"text": "Option B", "isCorrect": False},
                        {"text": "Option C", "isCorrect": False},
                        {"text": "Option D", "isCorrect": False}
                    ],
                    "explanation": "This is a placeholder question generated due to AI service unavailability.",
                    "difficulty": request.difficulty,
                    "points": 1,
                    "tags": [request.topic]
                }
            ],
            "sourceText": f"Generated quiz for {request.topic}"
        }
        return fallback_quiz

# Research analysis endpoint
@app.post("/api/analyze-research")
async def analyze_research(request: ResearchAnalysisRequest):
    try:
        if not research_analyzer:
            raise HTTPException(status_code=503, detail="Research analyzer not available")
        
        # Analyze research paper
        analysis = await research_analyzer.analyze_paper(
            text=request.text,
            title=request.title,
            source=request.source
        )
        
        return analysis
        
    except Exception as e:
        # Fallback analysis
        word_count = len(request.text.split())
        sentences = request.text.split('.')
        
        fallback_analysis = {
            "title": request.title or "Research Analysis",
            "analysis": {
                "summary": request.text[:500] + "..." if len(request.text) > 500 else request.text,
                "keyPoints": [
                    "Document contains analysis content",
                    f"Word count: {word_count}",
                    f"Sentence count: {len(sentences)}",
                    "Detailed analysis requires AI service"
                ],
                "methodology": "Text analysis pending AI service availability",
                "findings": ["Basic text statistics provided"],
                "limitations": ["AI analysis service temporarily unavailable"],
                "implications": ["Manual review recommended"],
                "relatedTopics": [],
                "complexity": min(max(word_count // 100, 1), 9),
                "readingLevel": "Intermediate"
            },
            "questions": [],
            "tags": ["research", "analysis", "fallback"]
        }
        
        return fallback_analysis

# Mentor recommendation endpoint
@app.post("/api/mentor-recommendations")
async def get_mentor_recommendations(request: MentorRequest):
    try:
        # Convert request data to pandas DataFrame format expected by the original function
        import pandas as pd
        
        user_data_df = pd.DataFrame(request.userData)
        
        mentors = suggest_mentors(
            user_number=request.userNumber,
            selected_subjects=request.selectedSubjects,
            user_data=user_data_df,
            num_suggestions=request.numSuggestions
        )
        
        # Convert DataFrame to dict for JSON response
        mentors_dict = mentors.to_dict('records') if not mentors.empty else []
        
        return {"mentors": mentors_dict}
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Mentor recommendation error: {str(e)}")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
