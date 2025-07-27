"""
Utility modules for AI services.
"""
from .gemini_client import GeminiClient, get_gemini_client, initialize_gemini
from .helpers import (
    clean_text,
    truncate_text,
    extract_keywords,
    calculate_reading_level,
    calculate_complexity_score,
    format_analysis_response,
    create_fallback_response,
    validate_json_response,
    safe_json_parse,
    log_api_call,
    sanitize_input
)

__all__ = [
    "GeminiClient",
    "get_gemini_client",
    "initialize_gemini",
    "clean_text",
    "truncate_text", 
    "extract_keywords",
    "calculate_reading_level",
    "calculate_complexity_score",
    "format_analysis_response",
    "create_fallback_response",
    "validate_json_response",
    "safe_json_parse",
    "log_api_call",
    "sanitize_input"
]
