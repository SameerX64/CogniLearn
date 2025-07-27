"""
Pydantic models for AI services requests and responses.
"""
from typing import Dict, Any, List, Optional, Union
from pydantic import BaseModel, Field, validator
from datetime import datetime
from enum import Enum


class DifficultyLevel(str, Enum):
    """Quiz difficulty levels."""
    EASY = "easy"
    MEDIUM = "medium"
    HARD = "hard"


class QuestionType(str, Enum):
    """Question types for quizzes."""
    MULTIPLE_CHOICE = "multiple-choice"
    TRUE_FALSE = "true-false"
    SHORT_ANSWER = "short-answer"
    ESSAY = "essay"


class ReadingLevel(str, Enum):
    """Reading levels for content."""
    BASIC = "Basic"
    INTERMEDIATE = "Intermediate"
    ADVANCED = "Advanced"


# Request Models
class ResearchAnalysisRequest(BaseModel):
    """Request model for research paper analysis."""
    text: str = Field(..., min_length=10, max_length=50000)
    title: Optional[str] = Field(None, max_length=500)
    source: Optional[Dict[str, Any]] = None
    language: str = Field(default="english")
    
    @validator('text')
    def validate_text(cls, v):
        if not v.strip():
            raise ValueError('Text cannot be empty')
        return v.strip()


class QuizGenerationRequest(BaseModel):
    """Request model for quiz generation."""
    topic: str = Field(..., min_length=2, max_length=200)
    content: Optional[str] = Field(None, max_length=10000)
    difficulty: DifficultyLevel = DifficultyLevel.MEDIUM
    question_count: int = Field(default=5, ge=1, le=20)
    question_types: List[QuestionType] = Field(default=[QuestionType.MULTIPLE_CHOICE])
    language: str = Field(default="english")


class CourseRecommendationRequest(BaseModel):
    """Request model for course recommendations."""
    user_id: str = Field(..., min_length=1)
    expertise_level: str = Field(..., min_length=1)
    interests: List[str] = Field(default=[])
    learning_goals: List[str] = Field(default=[])
    preferred_difficulty: Optional[DifficultyLevel] = None
    max_recommendations: int = Field(default=10, ge=1, le=50)


class MentorRecommendationRequest(BaseModel):
    """Request model for mentor recommendations."""
    user_id: str = Field(..., min_length=1)
    expertise_areas: List[str] = Field(default=[])
    learning_goals: List[str] = Field(default=[])
    experience_level: str = Field(default="beginner")
    max_recommendations: int = Field(default=5, ge=1, le=20)


# Response Models
class AnalysisResult(BaseModel):
    """Analysis result model."""
    title: str
    summary: str
    key_points: List[str] = Field(alias="keyPoints")
    methodology: str
    findings: List[str]
    limitations: List[str]
    implications: List[str]
    related_topics: List[str] = Field(alias="relatedTopics")
    complexity: int = Field(ge=1, le=9)
    reading_level: ReadingLevel = Field(alias="readingLevel")
    keywords: List[str] = Field(default=[])
    
    class Config:
        allow_population_by_field_name = True


class QuizQuestion(BaseModel):
    """Quiz question model."""
    id: str = Field(default_factory=lambda: f"q_{datetime.utcnow().timestamp()}")
    question: str
    type: QuestionType
    difficulty: DifficultyLevel
    options: Optional[List[str]] = None
    correct_answer: str
    explanation: Optional[str] = None
    points: int = Field(default=1, ge=1)
    topic: Optional[str] = None


class QuizResult(BaseModel):
    """Quiz generation result model."""
    id: str = Field(default_factory=lambda: f"quiz_{datetime.utcnow().timestamp()}")
    title: str
    description: Optional[str] = None
    questions: List[QuizQuestion]
    total_points: int
    difficulty: DifficultyLevel
    estimated_time: int  # in minutes
    topics: List[str] = Field(default=[])


class CourseInfo(BaseModel):
    """Course information model."""
    id: str
    title: str
    description: str
    difficulty: str
    duration: str
    instructor: Optional[str] = None
    rating: Optional[float] = Field(None, ge=0, le=5)
    topics: List[str] = Field(default=[])
    skills: List[str] = Field(default=[])
    prerequisites: List[str] = Field(default=[])


class RecommendationScore(BaseModel):
    """Recommendation with score."""
    item: Union[CourseInfo, Dict[str, Any]]
    score: float = Field(ge=0, le=1)
    reasons: List[str] = Field(default=[])


class ResearchAnalysisResponse(BaseModel):
    """Response model for research analysis."""
    id: str = Field(default_factory=lambda: f"analysis_{datetime.utcnow().timestamp()}")
    title: str
    analysis: AnalysisResult
    questions: List[QuizQuestion] = Field(default=[])
    tags: List[str] = Field(default=[])
    timestamp: datetime = Field(default_factory=datetime.utcnow)
    processing_time: Optional[float] = None
    fallback: bool = Field(default=False)


class QuizGenerationResponse(BaseModel):
    """Response model for quiz generation."""
    quiz: QuizResult
    timestamp: datetime = Field(default_factory=datetime.utcnow)
    processing_time: Optional[float] = None
    fallback: bool = Field(default=False)


class CourseRecommendationResponse(BaseModel):
    """Response model for course recommendations."""
    user_id: str
    recommendations: List[RecommendationScore]
    total_count: int
    timestamp: datetime = Field(default_factory=datetime.utcnow)
    processing_time: Optional[float] = None
    fallback: bool = Field(default=False)


class MentorRecommendationResponse(BaseModel):
    """Response model for mentor recommendations."""
    user_id: str
    recommendations: List[Dict[str, Any]]
    total_count: int
    timestamp: datetime = Field(default_factory=datetime.utcnow)
    processing_time: Optional[float] = None
    fallback: bool = Field(default=False)


class HealthCheckResponse(BaseModel):
    """Health check response model."""
    status: str
    version: str
    timestamp: datetime = Field(default_factory=datetime.utcnow)
    services: Dict[str, bool] = Field(default={})
    uptime: Optional[float] = None


class ErrorResponse(BaseModel):
    """Error response model."""
    error: str
    detail: Optional[str] = None
    timestamp: datetime = Field(default_factory=datetime.utcnow)
    request_id: Optional[str] = None
