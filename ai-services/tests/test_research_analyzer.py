"""
Test cases for Research Analyzer Service
"""
import pytest
import asyncio
from unittest.mock import Mock, patch

from src.services.research_analyzer import ResearchAnalyzerService
from src.models.schemas import ResearchAnalysisRequest


@pytest.fixture
def research_analyzer():
    """Create research analyzer instance for testing."""
    return ResearchAnalyzerService()


@pytest.fixture
def sample_request():
    """Sample research analysis request."""
    return ResearchAnalysisRequest(
        text="This is a sample research paper about machine learning algorithms. The study investigates various approaches to supervised learning and their effectiveness in different domains.",
        title="Machine Learning Algorithms Study",
        language="english"
    )


@pytest.mark.asyncio
async def test_analyze_paper_success(research_analyzer, sample_request):
    """Test successful paper analysis."""
    result = await research_analyzer.analyze_paper(sample_request)
    
    assert result is not None
    assert result.title == sample_request.title
    assert result.analysis is not None
    assert isinstance(result.analysis.complexity, int)
    assert 1 <= result.analysis.complexity <= 9
    assert result.analysis.reading_level in ["Basic", "Intermediate", "Advanced"]


@pytest.mark.asyncio
async def test_analyze_paper_fallback(research_analyzer):
    """Test fallback behavior when AI fails."""
    # Mock Gemini client to fail
    with patch.object(research_analyzer.gemini, 'generate_json', side_effect=Exception("API Error")):
        request = ResearchAnalysisRequest(
            text="Short text for testing fallback behavior.",
            title="Test Paper"
        )
        
        result = await research_analyzer.analyze_paper(request)
        
        assert result is not None
        assert result.fallback is True
        assert result.analysis is not None


@pytest.mark.asyncio
async def test_analyze_empty_text():
    """Test analysis with empty text."""
    analyzer = ResearchAnalyzerService()
    
    with pytest.raises(ValueError):
        ResearchAnalysisRequest(text="", title="Empty Test")


def test_complexity_validation(research_analyzer):
    """Test complexity score validation."""
    # Test valid complexity
    assert research_analyzer._validate_complexity(5, 1000) == 5
    
    # Test invalid complexity (too high)
    assert 1 <= research_analyzer._validate_complexity(15, 1000) <= 9
    
    # Test invalid complexity (not integer)
    result = research_analyzer._validate_complexity("invalid", 1000)
    assert isinstance(result, int)
    assert 1 <= result <= 9


def test_reading_level_validation(research_analyzer):
    """Test reading level validation."""
    # Test valid reading levels
    assert research_analyzer._validate_reading_level("Basic", 100) == "Basic"
    assert research_analyzer._validate_reading_level("Intermediate", 500) == "Intermediate"
    assert research_analyzer._validate_reading_level("Advanced", 2000) == "Advanced"
    
    # Test invalid reading level
    result = research_analyzer._validate_reading_level("Invalid", 500)
    assert result in ["Basic", "Intermediate", "Advanced"]


@pytest.mark.asyncio
async def test_question_generation(research_analyzer, sample_request):
    """Test quiz question generation."""
    # First analyze the paper
    analysis_result = await research_analyzer.analyze_paper(sample_request)
    
    # Check if questions were generated
    assert isinstance(analysis_result.questions, list)
    
    if analysis_result.questions:
        question = analysis_result.questions[0]
        assert hasattr(question, 'question')
        assert hasattr(question, 'type')
        assert hasattr(question, 'difficulty')


def test_tag_extraction(research_analyzer):
    """Test tag extraction from analysis."""
    sample_analysis = {
        "complexity": 6,
        "readingLevel": "Advanced",
        "relatedTopics": ["machine learning", "algorithms", "data science"],
        "keywords": ["python", "statistics", "neural networks"]
    }
    
    tags = research_analyzer._extract_tags(sample_analysis)
    
    assert "research" in tags
    assert "analysis" in tags
    assert "advanced" in tags  # From complexity and reading level
    assert len(tags) > 0


if __name__ == "__main__":
    pytest.main([__file__])
