"""
AI Services module for CogniLearn platform.
"""
from .research_analyzer import ResearchAnalyzerService
from .quiz_generator import QuizGeneratorService  
from .course_recommendation import CourseRecommendationService

__all__ = [
    "ResearchAnalyzerService",
    "QuizGeneratorService",
    "CourseRecommendationService"
]
