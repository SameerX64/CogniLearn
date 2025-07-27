"""
Quiz Generator Service using Google Gemini AI
"""
import asyncio
import logging
import time
from typing import Dict, Any, Optional, List

from ..models.schemas import (
    QuizGenerationRequest,
    QuizGenerationResponse,
    QuizResult,
    QuizQuestion,
    DifficultyLevel,
    QuestionType
)
from ..utils import (
    get_gemini_client,
    sanitize_input,
    log_api_call,
    extract_keywords
)

logger = logging.getLogger(__name__)


class QuizGeneratorService:
    """Advanced quiz generator using Gemini AI."""
    
    def __init__(self):
        """Initialize the quiz generator service."""
        self.gemini = get_gemini_client()
        self.quiz_prompt_template = self._load_quiz_prompt()
        self.difficulty_settings = {
            DifficultyLevel.EASY: {
                "complexity": "simple concepts and basic understanding",
                "question_style": "straightforward and clear",
                "cognitive_level": "recall and comprehension"
            },
            DifficultyLevel.MEDIUM: {
                "complexity": "moderate concepts requiring analysis",
                "question_style": "application and analysis based",
                "cognitive_level": "application and analysis"
            },
            DifficultyLevel.HARD: {
                "complexity": "complex concepts requiring synthesis",
                "question_style": "challenging and thought-provoking",
                "cognitive_level": "synthesis and evaluation"
            }
        }
    
    async def generate_quiz(self, request: QuizGenerationRequest) -> QuizGenerationResponse:
        """Generate a complete quiz based on the request parameters."""
        start_time = time.time()
        
        try:
            # Sanitize inputs
            topic = sanitize_input(request.topic, 200)
            content = sanitize_input(request.content or "", 8000) if request.content else ""
            
            # Generate quiz using Gemini
            quiz_data = await self._generate_quiz_content(
                topic=topic,
                content=content,
                difficulty=request.difficulty,
                question_count=request.question_count,
                question_types=request.question_types,
                language=request.language
            )
            
            # Format quiz result
            quiz_result = self._format_quiz_result(quiz_data, request)
            
            processing_time = time.time() - start_time
            
            # Log successful API call
            log_api_call(
                "quiz_generator",
                "generate_quiz",
                True,
                processing_time
            )
            
            return QuizGenerationResponse(
                quiz=quiz_result,
                processing_time=processing_time,
                fallback=False
            )
            
        except Exception as e:
            processing_time = time.time() - start_time
            logger.error(f"Quiz generation failed: {e}")
            
            # Log failed API call
            log_api_call(
                "quiz_generator",
                "generate_quiz",
                False,
                processing_time,
                str(e)
            )
            
            # Return fallback quiz
            fallback_quiz = self._create_fallback_quiz(request)
            
            return QuizGenerationResponse(
                quiz=fallback_quiz,
                processing_time=processing_time,
                fallback=True
            )
    
    async def _generate_quiz_content(
        self,
        topic: str,
        content: str,
        difficulty: DifficultyLevel,
        question_count: int,
        question_types: List[QuestionType],
        language: str
    ) -> Dict[str, Any]:
        """Generate quiz content using Gemini AI."""
        
        # Get difficulty settings
        diff_settings = self.difficulty_settings[difficulty]
        
        # Build prompt
        prompt = self.quiz_prompt_template.format(
            topic=topic,
            content=f"\nAdditional Content:\n{content}" if content else "",
            difficulty=difficulty.value,
            complexity=diff_settings["complexity"],
            question_style=diff_settings["question_style"],
            cognitive_level=diff_settings["cognitive_level"],
            question_count=question_count,
            question_types=", ".join([qt.value for qt in question_types]),
            language=language
        )
        
        # Define expected schema
        schema = {
            "title": "string",
            "description": "string", 
            "questions": [
                {
                    "question": "string",
                    "type": "string (multiple-choice, true-false, short-answer, essay)",
                    "difficulty": "string (easy, medium, hard)",
                    "options": ["array of strings (for multiple-choice)"],
                    "correct_answer": "string",
                    "explanation": "string",
                    "points": "integer",
                    "topic": "string"
                }
            ],
            "topics": ["array of topic strings"],
            "estimated_time": "integer (minutes)"
        }
        
        try:
            # Generate with Gemini
            response = await self.gemini.generate_json(
                prompt,
                schema=schema,
                temperature=0.8  # Higher creativity for question variety
            )
            
            if response and not response.get("error"):
                return self._validate_quiz_response(response, topic, difficulty, question_count)
            else:
                logger.warning("Gemini returned error or empty response")
                return self._create_basic_quiz(topic, difficulty, question_count, question_types)
                
        except Exception as e:
            logger.error(f"Gemini quiz generation failed: {e}")
            return self._create_basic_quiz(topic, difficulty, question_count, question_types)
    
    def _validate_quiz_response(
        self,
        response: Dict[str, Any],
        topic: str,
        difficulty: DifficultyLevel,
        question_count: int
    ) -> Dict[str, Any]:
        """Validate and clean quiz response."""
        
        validated = {
            "title": response.get("title", f"{topic} Quiz"),
            "description": response.get("description", f"Test your knowledge on {topic}"),
            "questions": [],
            "topics": response.get("topics", [topic]),
            "estimated_time": response.get("estimated_time", question_count * 2)
        }
        
        # Validate questions
        questions = response.get("questions", [])
        for i, q in enumerate(questions[:question_count]):
            try:
                validated_question = {
                    "question": q.get("question", f"Question {i+1}"),
                    "type": q.get("type", "multiple-choice"),
                    "difficulty": q.get("difficulty", difficulty.value),
                    "options": q.get("options", []) if q.get("type") == "multiple-choice" else None,
                    "correct_answer": q.get("correct_answer", ""),
                    "explanation": q.get("explanation", ""),
                    "points": max(1, int(q.get("points", 1))),
                    "topic": q.get("topic", topic)
                }
                
                # Validate question type
                if validated_question["type"] not in [qt.value for qt in QuestionType]:
                    validated_question["type"] = "multiple-choice"
                
                # Ensure multiple choice has options
                if validated_question["type"] == "multiple-choice" and not validated_question["options"]:
                    validated_question["options"] = ["Option A", "Option B", "Option C", "Option D"]
                    validated_question["correct_answer"] = "Option A"
                
                validated["questions"].append(validated_question)
                
            except Exception as e:
                logger.warning(f"Failed to validate question {i+1}: {e}")
                continue
        
        # Ensure we have at least one question
        if not validated["questions"]:
            validated["questions"] = self._create_basic_questions(topic, difficulty, 1)
        
        return validated
    
    def _create_basic_quiz(
        self,
        topic: str,
        difficulty: DifficultyLevel,
        question_count: int,
        question_types: List[QuestionType]
    ) -> Dict[str, Any]:
        """Create basic quiz when AI generation fails."""
        
        return {
            "title": f"{topic} Quiz (Basic)",
            "description": f"Basic quiz on {topic} - AI generation temporarily unavailable",
            "questions": self._create_basic_questions(topic, difficulty, question_count),
            "topics": [topic],
            "estimated_time": question_count * 2
        }
    
    def _create_basic_questions(
        self,
        topic: str,
        difficulty: DifficultyLevel,
        count: int
    ) -> List[Dict[str, Any]]:
        """Create basic fallback questions."""
        
        questions = []
        
        for i in range(min(count, 5)):  # Limit to 5 questions
            if i == 0:
                question = {
                    "question": f"What is the main concept covered in {topic}?",
                    "type": "multiple-choice",
                    "difficulty": difficulty.value,
                    "options": [
                        f"Core principles of {topic}",
                        "Unrelated concept",
                        "Historical background only",
                        "Future predictions"
                    ],
                    "correct_answer": f"Core principles of {topic}",
                    "explanation": f"This question tests basic understanding of {topic}.",
                    "points": 1,
                    "topic": topic
                }
            elif i == 1:
                question = {
                    "question": f"True or False: Understanding {topic} requires foundational knowledge.",
                    "type": "true-false",
                    "difficulty": difficulty.value,
                    "options": ["True", "False"],
                    "correct_answer": "True",
                    "explanation": f"Most subjects including {topic} build on foundational concepts.",
                    "points": 1,
                    "topic": topic
                }
            else:
                question = {
                    "question": f"Explain one key aspect of {topic}.",
                    "type": "short-answer",
                    "difficulty": difficulty.value,
                    "correct_answer": f"Key aspects include fundamental principles and applications of {topic}.",
                    "explanation": f"This tests deeper understanding of {topic} concepts.",
                    "points": 2,
                    "topic": topic
                }
            
            questions.append(question)
        
        return questions
    
    def _format_quiz_result(self, quiz_data: Dict[str, Any], request: QuizGenerationRequest) -> QuizResult:
        """Format quiz data into QuizResult object."""
        
        # Format questions
        questions = []
        total_points = 0
        
        for i, q_data in enumerate(quiz_data.get("questions", [])):
            try:
                question = QuizQuestion(
                    id=f"q_{i+1}_{int(time.time())}",
                    question=q_data["question"],
                    type=QuestionType(q_data["type"]),
                    difficulty=DifficultyLevel(q_data["difficulty"]),
                    options=q_data.get("options"),
                    correct_answer=q_data["correct_answer"],
                    explanation=q_data.get("explanation"),
                    points=q_data.get("points", 1),
                    topic=q_data.get("topic", request.topic)
                )
                questions.append(question)
                total_points += question.points
            except Exception as e:
                logger.warning(f"Failed to format question {i+1}: {e}")
                continue
        
        return QuizResult(
            id=f"quiz_{int(time.time())}",
            title=quiz_data.get("title", f"{request.topic} Quiz"),
            description=quiz_data.get("description"),
            questions=questions,
            total_points=total_points,
            difficulty=request.difficulty,
            estimated_time=quiz_data.get("estimated_time", len(questions) * 2),
            topics=quiz_data.get("topics", [request.topic])
        )
    
    def _create_fallback_quiz(self, request: QuizGenerationRequest) -> QuizResult:
        """Create fallback quiz when generation completely fails."""
        
        fallback_question = QuizQuestion(
            id=f"fallback_{int(time.time())}",
            question=f"What would you like to learn about {request.topic}?",
            type=QuestionType.SHORT_ANSWER,
            difficulty=request.difficulty,
            correct_answer="Various aspects and applications",
            explanation="This is a general question to assess interest and prior knowledge.",
            points=1,
            topic=request.topic
        )
        
        return QuizResult(
            id=f"fallback_quiz_{int(time.time())}",
            title=f"{request.topic} Quiz (Fallback)",
            description="Basic quiz - full AI generation temporarily unavailable",
            questions=[fallback_question],
            total_points=1,
            difficulty=request.difficulty,
            estimated_time=5,
            topics=[request.topic]
        )
    
    def _load_quiz_prompt(self) -> str:
        """Load the quiz generation prompt template."""
        return """Generate a comprehensive educational quiz on the following topic.

Topic: {topic}
{content}

Quiz Requirements:
- Difficulty Level: {difficulty} ({complexity})
- Question Style: {question_style}
- Cognitive Level: {cognitive_level}
- Number of Questions: {question_count}
- Question Types: {question_types}
- Language: {language}

Generate questions that test various levels of understanding:
1. Knowledge recall and basic comprehension
2. Application of concepts
3. Analysis and critical thinking
4. Synthesis and evaluation (for harder difficulties)

Respond with valid JSON in this exact format:
{{
    "title": "Engaging quiz title",
    "description": "Brief quiz description",
    "questions": [
        {{
            "question": "Clear, well-formed question text",
            "type": "multiple-choice",
            "difficulty": "{difficulty}",
            "options": ["Option A", "Option B", "Option C", "Option D"],
            "correct_answer": "Option A",
            "explanation": "Clear explanation of why this is correct",
            "points": 1,
            "topic": "Specific sub-topic"
        }},
        {{
            "question": "True or false question",
            "type": "true-false", 
            "difficulty": "{difficulty}",
            "options": ["True", "False"],
            "correct_answer": "True",
            "explanation": "Explanation of the correct answer",
            "points": 1,
            "topic": "Specific sub-topic"
        }},
        {{
            "question": "Open-ended question requiring explanation",
            "type": "short-answer",
            "difficulty": "{difficulty}",
            "correct_answer": "Expected answer or key points",
            "explanation": "What constitutes a good answer",
            "points": 2,
            "topic": "Specific sub-topic"
        }}
    ],
    "topics": ["topic1", "topic2", "topic3"],
    "estimated_time": 15
}}

Guidelines:
- Make questions clear and unambiguous
- Ensure correct answers are definitively correct
- Provide educational explanations
- Use varied question types as requested
- Keep consistent difficulty level
- Test practical understanding, not just memorization

Respond with valid JSON only:"""
