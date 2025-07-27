"""
Utility functions for AI services.
"""
import re
import json
import logging
from typing import Dict, Any, List, Optional, Union
from datetime import datetime

logger = logging.getLogger(__name__)


def clean_text(text: str) -> str:
    """Clean and normalize text input."""
    if not text:
        return ""
    
    # Remove extra whitespace and normalize
    text = re.sub(r'\s+', ' ', text.strip())
    
    # Remove special characters that might cause issues
    text = re.sub(r'[^\w\s\-.,!?;:()\[\]{}"\']', '', text)
    
    return text


def truncate_text(text: str, max_length: int = 8000, preserve_sentences: bool = True) -> str:
    """Truncate text to specified length while preserving readability."""
    if len(text) <= max_length:
        return text
    
    if preserve_sentences:
        # Try to truncate at sentence boundaries
        sentences = text.split('.')
        truncated = ""
        
        for sentence in sentences:
            if len(truncated + sentence + '.') <= max_length:
                truncated += sentence + '.'
            else:
                break
        
        if truncated:
            return truncated.strip()
    
    # Fallback to simple truncation
    return text[:max_length].strip()


def extract_keywords(text: str, max_keywords: int = 10) -> List[str]:
    """Extract keywords from text using simple frequency analysis."""
    if not text:
        return []
    
    # Convert to lowercase and split into words
    words = re.findall(r'\b[a-zA-Z]{3,}\b', text.lower())
    
    # Common stop words to exclude
    stop_words = {
        'the', 'and', 'are', 'for', 'with', 'this', 'that', 'from', 'they',
        'have', 'had', 'but', 'not', 'you', 'all', 'can', 'her', 'was',
        'one', 'our', 'out', 'day', 'get', 'has', 'him', 'his', 'how',
        'its', 'may', 'new', 'now', 'old', 'see', 'two', 'who', 'boy',
        'did', 'she', 'use', 'way', 'man', 'men', 'say', 'few', 'big',
        'end', 'lot', 'own', 'run', 'put', 'why', 'let', 'any', 'try'
    }
    
    # Filter out stop words and count frequency
    word_counts = {}
    for word in words:
        if word not in stop_words and len(word) > 3:
            word_counts[word] = word_counts.get(word, 0) + 1
    
    # Sort by frequency and return top keywords
    sorted_words = sorted(word_counts.items(), key=lambda x: x[1], reverse=True)
    return [word for word, _ in sorted_words[:max_keywords]]


def calculate_reading_level(text: str) -> str:
    """Calculate reading level based on text complexity."""
    if not text:
        return "Basic"
    
    words = text.split()
    sentences = text.count('.') + text.count('!') + text.count('?')
    
    if sentences == 0:
        sentences = 1
    
    avg_words_per_sentence = len(words) / sentences
    
    # Count syllables (rough estimation)
    total_syllables = 0
    for word in words:
        syllables = max(1, len(re.findall(r'[aeiouAEIOU]', word)))
        total_syllables += syllables
    
    avg_syllables_per_word = total_syllables / len(words) if words else 1
    
    # Simple classification based on complexity
    if avg_words_per_sentence < 15 and avg_syllables_per_word < 1.5:
        return "Basic"
    elif avg_words_per_sentence < 25 and avg_syllables_per_word < 2.0:
        return "Intermediate"
    else:
        return "Advanced"


def calculate_complexity_score(text: str) -> int:
    """Calculate complexity score from 1-9."""
    if not text:
        return 1
    
    words = text.split()
    sentences = max(1, text.count('.') + text.count('!') + text.count('?'))
    
    # Factors for complexity
    word_count = len(words)
    avg_word_length = sum(len(word) for word in words) / len(words) if words else 0
    avg_sentence_length = word_count / sentences
    
    # Technical terms indicator (words > 6 characters)
    technical_words = sum(1 for word in words if len(word) > 6)
    technical_ratio = technical_words / len(words) if words else 0
    
    # Calculate complexity score
    complexity = 1
    
    if word_count > 1000:
        complexity += 2
    elif word_count > 500:
        complexity += 1
    
    if avg_word_length > 6:
        complexity += 2
    elif avg_word_length > 4:
        complexity += 1
    
    if avg_sentence_length > 20:
        complexity += 2
    elif avg_sentence_length > 15:
        complexity += 1
    
    if technical_ratio > 0.3:
        complexity += 2
    elif technical_ratio > 0.2:
        complexity += 1
    
    return min(max(complexity, 1), 9)


def format_analysis_response(analysis: Dict[str, Any]) -> Dict[str, Any]:
    """Format and validate analysis response."""
    formatted = {
        "title": analysis.get("title", "Analysis"),
        "summary": analysis.get("summary", ""),
        "keyPoints": analysis.get("keyPoints", []),
        "methodology": analysis.get("methodology", "Not specified"),
        "findings": analysis.get("findings", []),
        "limitations": analysis.get("limitations", []),
        "implications": analysis.get("implications", []),
        "relatedTopics": analysis.get("relatedTopics", []),
        "complexity": analysis.get("complexity", 5),
        "readingLevel": analysis.get("readingLevel", "Intermediate"),
        "keywords": analysis.get("keywords", []),
        "timestamp": datetime.utcnow().isoformat()
    }
    
    # Ensure lists are actually lists
    list_fields = ["keyPoints", "findings", "limitations", "implications", "relatedTopics", "keywords"]
    for field in list_fields:
        if not isinstance(formatted[field], list):
            formatted[field] = [str(formatted[field])] if formatted[field] else []
    
    # Validate complexity score
    if not isinstance(formatted["complexity"], int) or not (1 <= formatted["complexity"] <= 9):
        formatted["complexity"] = 5
    
    # Validate reading level
    valid_levels = ["Basic", "Intermediate", "Advanced"]
    if formatted["readingLevel"] not in valid_levels:
        formatted["readingLevel"] = "Intermediate"
    
    return formatted


def create_fallback_response(text: str, title: Optional[str] = None) -> Dict[str, Any]:
    """Create fallback response when AI processing fails."""
    word_count = len(text.split())
    
    return {
        "title": title or "Fallback Analysis",
        "summary": truncate_text(text, 300) + "...",
        "keyPoints": [
            f"Document contains {word_count} words",
            "Basic text processing completed",
            "AI analysis temporarily unavailable"
        ],
        "methodology": "Fallback text analysis",
        "findings": ["Text statistics computed"],
        "limitations": ["Limited to basic text processing"],
        "implications": ["Manual review recommended"],
        "relatedTopics": extract_keywords(text, 5),
        "complexity": calculate_complexity_score(text),
        "readingLevel": calculate_reading_level(text),
        "keywords": extract_keywords(text),
        "timestamp": datetime.utcnow().isoformat(),
        "fallback": True
    }


def validate_json_response(response: Any, expected_type: type = dict) -> bool:
    """Validate if response is of expected type and structure."""
    if not isinstance(response, expected_type):
        return False
    
    if expected_type == dict:
        # Check for required fields in analysis response
        required_fields = ["title", "summary", "keyPoints"]
        return all(field in response for field in required_fields)
    
    return True


def safe_json_parse(text: str) -> Optional[Dict[str, Any]]:
    """Safely parse JSON with fallback handling."""
    try:
        return json.loads(text)
    except json.JSONDecodeError:
        # Try to extract JSON from text
        try:
            start = text.find('{')
            end = text.rfind('}') + 1
            if start != -1 and end != -1:
                return json.loads(text[start:end])
        except json.JSONDecodeError:
            pass
    
    return None


def log_api_call(service: str, operation: str, success: bool, duration: float = 0.0, error: str = None):
    """Log API call for monitoring."""
    log_data = {
        "service": service,
        "operation": operation,
        "success": success,
        "duration": f"{duration:.2f}s",
        "timestamp": datetime.utcnow().isoformat()
    }
    
    if error:
        log_data["error"] = error
    
    if success:
        logger.info(f"API Call Success: {json.dumps(log_data)}")
    else:
        logger.error(f"API Call Failed: {json.dumps(log_data)}")


def sanitize_input(text: str, max_length: int = 10000) -> str:
    """Sanitize user input for AI processing."""
    if not text:
        return ""
    
    # Clean the text
    sanitized = clean_text(text)
    
    # Truncate if necessary
    sanitized = truncate_text(sanitized, max_length)
    
    return sanitized
