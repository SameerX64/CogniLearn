"""
Configuration settings for CogniLearn AI Services
"""
import os
from typing import Optional
from pydantic import BaseSettings


class Settings(BaseSettings):
    """Application settings with environment variable support."""
    
    # API Configuration
    GEMINI_API_KEY: str = ""
    GEMINI_MODEL: str = "gemini-1.5-pro"
    
    # FastAPI Configuration
    APP_NAME: str = "CogniLearn AI Services"
    APP_VERSION: str = "1.0.0"
    DEBUG: bool = False
    HOST: str = "localhost"
    PORT: int = 8000
    
    # AI Model Configuration
    MAX_TOKENS: int = 2048
    TEMPERATURE: float = 0.7
    TOP_P: float = 0.9
    
    # Request Limits
    MAX_TEXT_LENGTH: int = 10000
    REQUEST_TIMEOUT: int = 30
    RATE_LIMIT_PER_MINUTE: int = 60
    
    # Data Paths
    DATA_DIR: str = "./data"
    MODELS_DIR: str = "./models"
    CACHE_DIR: str = "./cache"
    
    # Database Configuration (if needed)
    DATABASE_URL: Optional[str] = None
    
    # Logging Configuration
    LOG_LEVEL: str = "INFO"
    LOG_FILE: str = "ai_services.log"
    
    # Security
    ALLOWED_ORIGINS: list = ["http://localhost:3000", "http://localhost:3001"]
    API_KEY_HEADER: str = "X-API-Key"
    
    class Config:
        env_file = ".env"
        case_sensitive = True


# Global settings instance
settings = Settings()


def get_settings() -> Settings:
    """Get application settings."""
    return settings


def update_setting(key: str, value) -> None:
    """Update a setting value."""
    setattr(settings, key, value)


def is_production() -> bool:
    """Check if running in production mode."""
    return os.getenv("ENVIRONMENT", "development").lower() == "production"


def get_gemini_config() -> dict:
    """Get Gemini API configuration."""
    return {
        "api_key": settings.GEMINI_API_KEY,
        "model": settings.GEMINI_MODEL,
        "max_tokens": settings.MAX_TOKENS,
        "temperature": settings.TEMPERATURE,
        "top_p": settings.TOP_P,
    }


def get_cors_config() -> dict:
    """Get CORS configuration."""
    return {
        "allow_origins": settings.ALLOWED_ORIGINS,
        "allow_credentials": True,
        "allow_methods": ["GET", "POST", "PUT", "DELETE"],
        "allow_headers": ["*"],
    }
