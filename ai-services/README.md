# CogniLearn AI Services

[![Python 3.8+](https://img.shields.io/badge/python-3.8+-blue.svg)](https://www.python.org/downloads/)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.104+-green.svg)](https://fastapi.tiangolo.com/)
[![Google Gemini](https://img.shields.io/badge/Powered%20by-Google%20Gemini-orange.svg)](https://ai.google.dev/)

Professional AI microservices for the CogniLearn adaptive learning platform, powered by Google Gemini AI.

## 🌟 Features

### 🔬 **Research Analysis Service**
- **Academic Paper Analysis**: Extract key insights, methodology, and findings
- **Content Summarization**: Generate comprehensive summaries with key points
- **Complexity Assessment**: Automatic reading level and complexity scoring
- **Question Generation**: Create quiz questions based on research content
- **Keyword Extraction**: Identify important terms and concepts

### 🎯 **Quiz Generation Service**
- **AI-Powered Questions**: Generate diverse question types using Gemini AI
- **Adaptive Difficulty**: Create questions matching user skill level
- **Multiple Formats**: Support for multiple-choice, true/false, short-answer, and essay questions
- **Topic Flexibility**: Generate quizzes on any educational topic
- **Educational Explanations**: Provide detailed answer explanations

### 🎓 **Course Recommendation Service**
- **Hybrid Algorithm**: Combines content-based, collaborative, and AI-enhanced recommendations
- **Personalization**: Tailored suggestions based on user profile and learning goals
- **ML-Powered Matching**: Uses TF-IDF and cosine similarity for content matching
- **Gemini AI Enhancement**: Intelligent analysis of user preferences and learning patterns
- **Comprehensive Scoring**: Multi-factor recommendation scoring with explanations

## 🏗️ Architecture

```
ai-services/
├── src/
│   ├── config/              # Configuration management
│   │   ├── __init__.py
│   │   └── settings.py      # Pydantic settings with env support
│   ├── models/              # Data models and schemas
│   │   ├── __init__.py
│   │   └── schemas.py       # Pydantic models for requests/responses
│   ├── services/            # Core AI services
│   │   ├── __init__.py
│   │   ├── research_analyzer.py
│   │   ├── quiz_generator.py
│   │   └── course_recommendation.py
│   ├── utils/               # Utility functions
│   │   ├── __init__.py
│   │   ├── gemini_client.py # Gemini AI client wrapper
│   │   └── helpers.py       # Helper functions
│   ├── __init__.py
│   └── main.py              # FastAPI application
├── tests/                   # Test suite
│   ├── __init__.py
│   ├── conftest.py
│   └── test_*.py
├── data/                    # Data files and datasets
├── requirements.txt         # Python dependencies
├── .env.example            # Environment configuration example
└── README.md
```

## 🚀 Quick Start

### Prerequisites

- **Python 3.8+**
- **Google Gemini API Key** ([Get one here](https://ai.google.dev/))
- **Virtual Environment** (recommended)

### Installation

1. **Navigate to AI Services Directory**
   ```bash
   cd ai-services
   ```

2. **Create Virtual Environment**
   ```bash
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   ```

3. **Install Dependencies**
   ```bash
   pip install -r requirements.txt
   ```

4. **Configure Environment**
   ```bash
   cp .env.example .env
   # Edit .env with your Gemini API key and preferences
   ```

5. **Start the Service**
   ```bash
   python src/main.py
   ```

### Alternative: Run from Project Root

From the main project directory:
```bash
./start.sh  # This will start all services including AI services
```

## 🔧 Configuration

### Environment Variables

```env
# Google Gemini AI Configuration
GEMINI_API_KEY=your_gemini_api_key_here
GEMINI_MODEL=gemini-1.5-pro

# Server Configuration
HOST=localhost
PORT=8000
DEBUG=true

# AI Model Settings
MAX_TOKENS=2048
TEMPERATURE=0.7
TOP_P=0.9

# Request Limits
MAX_TEXT_LENGTH=10000
REQUEST_TIMEOUT=30
RATE_LIMIT_PER_MINUTE=60

# Logging
LOG_LEVEL=INFO
LOG_FILE=ai_services.log
```

### Model Configuration

The service supports multiple Gemini models:
- `gemini-1.5-pro` (Recommended) - Best performance and capabilities
- `gemini-1.5-flash` - Faster responses, good for simple tasks
- `gemini-1.0-pro` - Legacy model support

## 📊 API Documentation

### Base URL
```
http://localhost:8000
```

### Authentication
Currently uses API key-based authentication (configurable).

### Core Endpoints

#### 🔬 Research Analysis
```http
POST /api/research/analyze
Content-Type: application/json

{
  "text": "Research paper content...",
  "title": "Paper Title (optional)",
  "language": "english"
}
```

**Response:**
```json
{
  "id": "analysis_123456",
  "title": "Research Analysis",
  "analysis": {
    "title": "Extracted Title",
    "summary": "2-3 sentence summary",
    "keyPoints": ["point1", "point2", "point3"],
    "methodology": "Research methodology",
    "findings": ["finding1", "finding2"],
    "limitations": ["limitation1", "limitation2"],
    "implications": ["implication1", "implication2"],
    "relatedTopics": ["topic1", "topic2"],
    "complexity": 7,
    "readingLevel": "Advanced",
    "keywords": ["keyword1", "keyword2"]
  },
  "questions": [...],
  "tags": ["research", "advanced", "machine-learning"],
  "timestamp": "2024-01-01T00:00:00Z",
  "processing_time": 2.34,
  "fallback": false
}
```

#### 🎯 Quiz Generation
```http
POST /api/quiz/generate
Content-Type: application/json

{
  "topic": "Machine Learning",
  "content": "Additional context (optional)",
  "difficulty": "medium",
  "question_count": 5,
  "question_types": ["multiple-choice", "short-answer"],
  "language": "english"
}
```

#### 🎓 Course Recommendations
```http
POST /api/courses/recommendations
Content-Type: application/json

{
  "user_id": "user123",
  "expertise_level": "intermediate",
  "interests": ["machine learning", "data science"],
  "learning_goals": ["career advancement", "skill development"],
  "preferred_difficulty": "medium",
  "max_recommendations": 10
}
```

### Utility Endpoints

- `GET /health` - Service health check
- `GET /api/status` - Detailed service status
- `GET /api/info` - API information and guidelines
- `GET /docs` - Interactive API documentation (development only)

## 🧪 Testing

### Run Tests
```bash
# Install test dependencies
pip install pytest pytest-asyncio

# Run all tests
pytest

# Run with coverage
pytest --cov=src

# Run specific test file
pytest tests/test_research_analyzer.py -v
```

### Test Coverage
The test suite covers:
- ✅ Service initialization and configuration
- ✅ Request/response validation
- ✅ AI integration and fallback mechanisms
- ✅ Error handling and edge cases
- ✅ Data processing and formatting

## 🔒 Security Features

### Data Protection
- **Input Sanitization**: All user inputs are cleaned and validated
- **Request Limits**: Configurable rate limiting and text length limits
- **Error Handling**: Secure error responses without sensitive information
- **CORS Configuration**: Controlled cross-origin access

### AI Safety
- **Content Filtering**: Gemini safety settings prevent harmful content
- **Fallback Mechanisms**: Service continues working even if AI fails
- **Request Validation**: Comprehensive input validation using Pydantic
- **Timeout Protection**: Request timeouts prevent resource exhaustion

## 📈 Performance & Monitoring

### Metrics
- **Response Times**: All API calls are timed and logged
- **Success Rates**: Track AI service availability and fallback usage
- **Error Tracking**: Comprehensive error logging and monitoring
- **Resource Usage**: Monitor memory and CPU usage

### Optimization Features
- **Async Processing**: Full async/await support for high concurrency
- **Response Caching**: Intelligent caching of AI responses (configurable)
- **Batch Processing**: Support for bulk operations (planned)
- **Connection Pooling**: Efficient HTTP connection management

## 🛠️ Development

### Code Style
- **Black**: Code formatting
- **Pylint**: Code linting
- **Type Hints**: Full typing support
- **Docstrings**: Comprehensive documentation

### Adding New Services

1. **Create Service Class**
   ```python
   # src/services/my_service.py
   class MyService:
       def __init__(self):
           self.gemini = get_gemini_client()
       
       async def process(self, request: MyRequest) -> MyResponse:
           # Implementation
           pass
   ```

2. **Define Models**
   ```python
   # src/models/schemas.py
   class MyRequest(BaseModel):
       # Request fields
       pass
   
   class MyResponse(BaseModel):
       # Response fields
       pass
   ```

3. **Add Route**
   ```python
   # src/main.py
   @app.post("/api/my-service", response_model=MyResponse)
   async def my_endpoint(request: MyRequest):
       # Route implementation
       pass
   ```

## 🐛 Troubleshooting

### Common Issues

#### Gemini API Key Issues
```bash
# Check API key configuration
grep GEMINI_API_KEY .env

# Test API connectivity
curl -X GET http://localhost:8000/health
```

#### Service Not Starting
```bash
# Check logs
tail -f ai_services.log

# Verify dependencies
pip list | grep -E "(fastapi|google-generativeai)"

# Check port availability
lsof -i :8000
```

#### AI Responses Failing
- **Check API Quotas**: Ensure Gemini API has sufficient quota
- **Verify Model**: Confirm model name is correct in configuration
- **Review Logs**: Check for specific error messages
- **Test Fallback**: Services should work in fallback mode

## 📝 Contributing

1. **Fork the Repository**
2. **Create Feature Branch** (`git checkout -b feature/amazing-feature`)
3. **Add Tests** for new functionality
4. **Update Documentation** as needed
5. **Submit Pull Request**

### Development Setup
```bash
# Install development dependencies
pip install -r requirements.txt
pip install pytest pytest-asyncio black pylint

# Run code formatting
black src/

# Run linting
pylint src/

# Run tests
pytest --cov=src
```

## 📄 License

This project is part of the CogniLearn platform and is licensed under the MIT License.

## 🤝 Support

- **Documentation**: [API Docs](http://localhost:8000/docs)
- **Issues**: [GitHub Issues](../issues)
- **Email**: support@cognilearn.ai

## 🙏 Acknowledgments

- **Google Gemini AI** - Powerful language model capabilities
- **FastAPI** - Modern, fast web framework
- **Pydantic** - Data validation and serialization
- **scikit-learn** - Machine learning algorithms
- **pandas/numpy** - Data processing capabilities

---

**Built with ❤️ for personalized education through AI**
