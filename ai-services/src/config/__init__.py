"""
Configuration module for AI services.
"""
from .settings import settings, get_settings, get_gemini_config, get_cors_config, is_production

__all__ = [
    "settings",
    "get_settings", 
    "get_gemini_config",
    "get_cors_config",
    "is_production"
]
