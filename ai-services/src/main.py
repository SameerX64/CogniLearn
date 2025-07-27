"""
CogniLearn AI Services - FastAPI Application
"""
import asyncio
import logging
import time
from contextlib import asynccontextmanager
from datetime import datetime
from typing import Dict, Any

import uvicorn
from fastapi import FastAPI, HTTPException, Request, Depends
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.trustedhost import TrustedHostMiddleware
from fastapi.responses import JSONResponse

# Import our modules
from src.config import settings, get_cors_config, is_production
from src.models import (
    ResearchAnalysisRequest,
    ResearchAnalysisResponse,
    QuizGenerationRequest,
    QuizGenerationResponse,
    CourseRecommendationRequest,
    CourseRecommendationResponse,
    HealthCheckResponse,
    ErrorResponse
)
from src.services import (
    ResearchAnalyzerService,
    QuizGeneratorService,
    CourseRecommendationService
)
from src.utils import initialize_gemini, log_api_call

# Configure logging
logging.basicConfig(
    level=getattr(logging, settings.LOG_LEVEL),
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler(settings.LOG_FILE),
        logging.StreamHandler()
    ]
)
logger = logging.getLogger(__name__)

# Global service instances
research_analyzer: ResearchAnalyzerService = None
quiz_generator: QuizGeneratorService = None
course_recommender: CourseRecommendationService = None

# Application startup/shutdown context
@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan management."""
    # Startup
    logger.info("Starting CogniLearn AI Services...")
    
    # Initialize Gemini AI
    gemini_initialized = await initialize_gemini(settings.GEMINI_API_KEY)
    if not gemini_initialized:
        logger.warning("Gemini AI initialization failed - services will use fallback modes")
    
    # Initialize services
    global research_analyzer, quiz_generator, course_recommender
    try:
        research_analyzer = ResearchAnalyzerService()
        quiz_generator = QuizGeneratorService()
        course_recommender = CourseRecommendationService()
        logger.info("All AI services initialized successfully")
    except Exception as e:
        logger.error(f"Service initialization failed: {e}")
        # Services will still work in fallback mode
    
    app.state.start_time = time.time()
    logger.info(f"🚀 {settings.APP_NAME} v{settings.APP_VERSION} started successfully")
    
    yield
    
    # Shutdown
    logger.info("Shutting down AI services...")


# Create FastAPI application
app = FastAPI(
    title=settings.APP_NAME,
    version=settings.APP_VERSION,
    description="AI-powered services for personalized learning",
    docs_url="/docs" if settings.DEBUG else None,
    redoc_url="/redoc" if settings.DEBUG else None,
    lifespan=lifespan
)

# Add middleware
cors_config = get_cors_config()
app.add_middleware(
    CORSMiddleware,
    allow_origins=cors_config["allow_origins"],
    allow_credentials=cors_config["allow_credentials"],
    allow_methods=cors_config["allow_methods"],
    allow_headers=cors_config["allow_headers"],
)

if is_production():
    app.add_middleware(
        TrustedHostMiddleware,
        allowed_hosts=["localhost", "127.0.0.1", "cognilearn.ai"]
    )

# Request logging middleware
@app.middleware("http")
async def log_requests(request: Request, call_next):
    """Log all incoming requests."""
    start_time = time.time()
    
    # Log request
    logger.info(f"🔍 {request.method} {request.url} - {request.client.host}")
    
    try:
        response = await call_next(request)
        process_time = time.time() - start_time
        
        # Log response
        logger.info(f"✅ {request.method} {request.url} - {response.status_code} - {process_time:.3f}s")
        
        return response
    except Exception as e:
        process_time = time.time() - start_time
        logger.error(f"❌ {request.method} {request.url} - Error: {str(e)} - {process_time:.3f}s")
        raise


# Dependency to get service instances
async def get_research_analyzer() -> ResearchAnalyzerService:
    """Get research analyzer service."""
    if research_analyzer is None:
        raise HTTPException(status_code=503, detail="Research analyzer service not available")
    return research_analyzer


async def get_quiz_generator() -> QuizGeneratorService:
    """Get quiz generator service."""
    if quiz_generator is None:
        raise HTTPException(status_code=503, detail="Quiz generator service not available")
    return quiz_generator


async def get_course_recommender() -> CourseRecommendationService:
    """Get course recommender service."""
    if course_recommender is None:
        raise HTTPException(status_code=503, detail="Course recommender service not available")
    return course_recommender


# Error handlers
@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    """Global exception handler."""
    logger.error(f"Unhandled exception: {exc}", exc_info=True)
    
    return JSONResponse(
        status_code=500,
        content=ErrorResponse(
            error="Internal server error",
            detail=str(exc) if settings.DEBUG else "An unexpected error occurred"
        ).dict()
    )


@app.exception_handler(HTTPException)
async def http_exception_handler(request: Request, exc: HTTPException):
    """HTTP exception handler."""
    return JSONResponse(
        status_code=exc.status_code,
        content=ErrorResponse(
            error=exc.detail,
            detail=getattr(exc, 'detail', None)
        ).dict()
    )


# API Routes
@app.get("/", response_model=Dict[str, str])
async def root():
    """Root endpoint."""
    return {
        "service": settings.APP_NAME,
        "version": settings.APP_VERSION,
        "status": "running",
        "docs": "/docs" if settings.DEBUG else "disabled"
    }


@app.get("/health", response_model=HealthCheckResponse)
async def health_check():
    """Health check endpoint."""
    uptime = time.time() - getattr(app.state, 'start_time', time.time())
    
    # Check service health
    services_health = {
        "research_analyzer": research_analyzer is not None,
        "quiz_generator": quiz_generator is not None,
        "course_recommender": course_recommender is not None,
    }
    
    # Try to check Gemini connectivity
    try:
        from src.utils import get_gemini_client
        gemini_client = get_gemini_client()
        gemini_health = await gemini_client.check_health()
        services_health["gemini_ai"] = gemini_health
    except Exception:
        services_health["gemini_ai"] = False
    
    overall_status = "healthy" if all(services_health.values()) else "degraded"
    
    return HealthCheckResponse(
        status=overall_status,
        version=settings.APP_VERSION,
        services=services_health,
        uptime=uptime
    )


@app.post("/api/research/analyze", response_model=ResearchAnalysisResponse)
async def analyze_research(
    request: ResearchAnalysisRequest,
    analyzer: ResearchAnalyzerService = Depends(get_research_analyzer)
):
    """Analyze research paper or academic text."""
    try:
        logger.info(f"📊 Research analysis request for: {request.title or 'Untitled'}")
        result = await analyzer.analyze_paper(request)
        logger.info(f"✅ Research analysis completed - Fallback: {result.fallback}")
        return result
    except Exception as e:
        logger.error(f"❌ Research analysis failed: {e}")
        raise HTTPException(status_code=500, detail=f"Analysis failed: {str(e)}")


@app.post("/api/quiz/generate", response_model=QuizGenerationResponse)
async def generate_quiz(
    request: QuizGenerationRequest,
    generator: QuizGeneratorService = Depends(get_quiz_generator)
):
    """Generate educational quiz."""
    try:
        logger.info(f"🎯 Quiz generation request for topic: {request.topic}")
        result = await generator.generate_quiz(request)
        logger.info(f"✅ Quiz generated - Questions: {len(result.quiz.questions)} - Fallback: {result.fallback}")
        return result
    except Exception as e:
        logger.error(f"❌ Quiz generation failed: {e}")
        raise HTTPException(status_code=500, detail=f"Quiz generation failed: {str(e)}")


@app.post("/api/courses/recommendations", response_model=CourseRecommendationResponse)
async def get_course_recommendations(
    request: CourseRecommendationRequest,
    recommender: CourseRecommendationService = Depends(get_course_recommender)
):
    """Get personalized course recommendations."""
    try:
        logger.info(f"🎓 Course recommendations request for user: {request.user_id}")
        result = await recommender.get_recommendations(request)
        logger.info(f"✅ Recommendations generated - Count: {result.total_count} - Fallback: {result.fallback}")
        return result
    except Exception as e:
        logger.error(f"❌ Course recommendations failed: {e}")
        raise HTTPException(status_code=500, detail=f"Recommendations failed: {str(e)}")


# Additional utility endpoints
@app.get("/api/status")
async def get_status():
    """Get detailed service status."""
    uptime = time.time() - getattr(app.state, 'start_time', time.time())
    
    status = {
        "service": settings.APP_NAME,
        "version": settings.APP_VERSION,
        "uptime_seconds": uptime,
        "uptime_readable": f"{uptime//3600:.0f}h {(uptime%3600)//60:.0f}m {uptime%60:.0f}s",
        "environment": "production" if is_production() else "development",
        "timestamp": datetime.utcnow().isoformat(),
        "services": {
            "research_analyzer": {
                "available": research_analyzer is not None,
                "description": "Research paper analysis and insight extraction"
            },
            "quiz_generator": {
                "available": quiz_generator is not None,
                "description": "AI-powered educational quiz generation"
            },
            "course_recommender": {
                "available": course_recommender is not None,
                "description": "Personalized course recommendations"
            }
        }
    }
    
    return status


@app.get("/api/info")
async def get_info():
    """Get API information and usage guidelines."""
    return {
        "name": settings.APP_NAME,
        "version": settings.APP_VERSION,
        "description": "AI-powered services for personalized learning experiences",
        "endpoints": {
            "/api/research/analyze": "Analyze research papers and extract insights",
            "/api/quiz/generate": "Generate educational quizzes on any topic",
            "/api/courses/recommendations": "Get personalized course recommendations",
            "/health": "Service health check",
            "/api/status": "Detailed service status",
            "/docs": "API documentation (development only)"
        },
        "features": [
            "Research paper analysis with key insights extraction",
            "AI-powered quiz generation with multiple question types",
            "Personalized course recommendations using hybrid algorithms",
            "Fallback mechanisms for high availability",
            "Comprehensive error handling and logging"
        ],
        "powered_by": "Google Gemini AI",
        "contact": "support@cognilearn.ai"
    }


if __name__ == "__main__":
    # Development server
    logger.info("🔧 Starting development server...")
    uvicorn.run(
        "main:app",
        host=settings.HOST,
        port=settings.PORT,
        reload=settings.DEBUG,
        log_level=settings.LOG_LEVEL.lower()
    )
