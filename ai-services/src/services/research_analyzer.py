"""
Research Analyzer Service using Google Gemini AI
"""
import asyncio
import logging
import time
from typing import Dict, Any, Optional, List

from ..models.schemas import (
    ResearchAnalysisRequest,
    ResearchAnalysisResponse,
    AnalysisResult,
    QuizQuestion,
    DifficultyLevel,
    QuestionType,
    ReadingLevel
)
from ..utils import (
    get_gemini_client,
    sanitize_input,
    format_analysis_response,
    create_fallback_response,
    calculate_complexity_score,
    calculate_reading_level,
    extract_keywords,
    log_api_call
)

logger = logging.getLogger(__name__)


class ResearchAnalyzerService:
    """Advanced research paper analyzer using Gemini AI."""
    
    def __init__(self):
        """Initialize the research analyzer service."""
        self.gemini = get_gemini_client()
        self.analysis_prompt_template = self._load_analysis_prompt()
        self.question_prompt_template = self._load_question_prompt()
    
    async def analyze_paper(self, request: ResearchAnalysisRequest) -> ResearchAnalysisResponse:
        """Analyze a research paper and return comprehensive insights."""
        start_time = time.time()
        
        try:
            # Sanitize and prepare input
            sanitized_text = sanitize_input(request.text)
            
            # Generate analysis using Gemini
            analysis_result = await self._generate_analysis(
                sanitized_text, 
                request.title,
                request.language
            )
            
            # Generate quiz questions based on analysis
            questions = await self._generate_questions(
                sanitized_text,
                analysis_result,
                request.language
            )
            
            # Extract tags
            tags = self._extract_tags(analysis_result)
            
            processing_time = time.time() - start_time
            
            # Log successful API call
            log_api_call(
                "research_analyzer",
                "analyze_paper",
                True,
                processing_time
            )
            
            return ResearchAnalysisResponse(
                title=request.title or analysis_result.get("title", "Research Analysis"),
                analysis=AnalysisResult(**analysis_result),
                questions=questions,
                tags=tags,
                processing_time=processing_time,
                fallback=False
            )
            
        except Exception as e:
            processing_time = time.time() - start_time
            logger.error(f"Research analysis failed: {e}")
            
            # Log failed API call
            log_api_call(
                "research_analyzer",
                "analyze_paper", 
                False,
                processing_time,
                str(e)
            )
            
            # Return fallback response
            fallback_analysis = create_fallback_response(request.text, request.title)
            
            return ResearchAnalysisResponse(
                title=request.title or "Research Analysis (Fallback)",
                analysis=AnalysisResult(**fallback_analysis),
                questions=[],
                tags=fallback_analysis.get("keywords", []),
                processing_time=processing_time,
                fallback=True
            )
    
    async def _generate_analysis(
        self, 
        text: str, 
        title: Optional[str] = None,
        language: str = "english"
    ) -> Dict[str, Any]:
        """Generate comprehensive analysis using Gemini."""
        
        # Build analysis prompt
        prompt = self.analysis_prompt_template.format(
            title=f"Title: {title}\n" if title else "",
            text=text,
            language=language
        )
        
        # Define expected JSON schema
        schema = {
            "title": "string",
            "summary": "string",
            "keyPoints": ["array of strings"],
            "methodology": "string",
            "findings": ["array of strings"],
            "limitations": ["array of strings"],
            "implications": ["array of strings"],
            "relatedTopics": ["array of strings"],
            "complexity": "integer (1-9)",
            "readingLevel": "string (Basic/Intermediate/Advanced)",
            "keywords": ["array of strings"]
        }
        
        try:
            # Generate analysis with Gemini
            response = await self.gemini.generate_json(
                prompt,
                schema=schema,
                temperature=0.3  # Lower temperature for more consistent analysis
            )
            
            # Validate and format response
            if response and not response.get("error"):
                return self._validate_analysis_response(response, text)
            else:
                logger.warning("Gemini returned error or empty response")
                return self._create_basic_analysis(text, title)
                
        except Exception as e:
            logger.error(f"Gemini analysis generation failed: {e}")
            return self._create_basic_analysis(text, title)
    
    async def _generate_questions(
        self,
        text: str,
        analysis: Dict[str, Any],
        language: str = "english"
    ) -> List[QuizQuestion]:
        """Generate quiz questions based on the analysis."""
        
        try:
            # Build question generation prompt
            prompt = self.question_prompt_template.format(
                text=text[:1500],  # Truncate for context
                summary=analysis.get("summary", ""),
                key_points=", ".join(analysis.get("keyPoints", [])[:3]),
                findings=", ".join(analysis.get("findings", [])[:3]),
                language=language
            )
            
            # Generate questions with Gemini
            response = await self.gemini.generate_json(
                prompt,
                temperature=0.7  # Higher temperature for creative questions
            )
            
            if response and "questions" in response:
                return self._format_questions(response["questions"])
            elif isinstance(response, list):
                return self._format_questions(response)
            else:
                return self._create_fallback_questions(analysis)
                
        except Exception as e:
            logger.error(f"Question generation failed: {e}")
            return self._create_fallback_questions(analysis)
    
    def _validate_analysis_response(self, response: Dict[str, Any], original_text: str) -> Dict[str, Any]:
        """Validate and ensure all required fields are present in analysis."""
        
        word_count = len(original_text.split())
        
        # Ensure all required fields exist with defaults
        validated = {
            "title": response.get("title", "Research Analysis"),
            "summary": response.get("summary", original_text[:300] + "..."),
            "keyPoints": response.get("keyPoints", ["Analysis completed", "Key insights extracted"]),
            "methodology": response.get("methodology", "Not specified"),
            "findings": response.get("findings", ["Findings analyzed"]),
            "limitations": response.get("limitations", ["Limitations noted"]),
            "implications": response.get("implications", ["Implications considered"]),
            "relatedTopics": response.get("relatedTopics", []),
            "complexity": self._validate_complexity(response.get("complexity"), word_count),
            "readingLevel": self._validate_reading_level(response.get("readingLevel"), word_count),
            "keywords": response.get("keywords", extract_keywords(original_text))
        }
        
        # Ensure lists are actually lists
        list_fields = ["keyPoints", "findings", "limitations", "implications", "relatedTopics", "keywords"]
        for field in list_fields:
            if not isinstance(validated[field], list):
                validated[field] = [str(validated[field])] if validated[field] else []
            # Limit list length
            validated[field] = validated[field][:10]
        
        return validated
    
    def _validate_complexity(self, ai_complexity: Any, word_count: int) -> int:
        """Validate complexity score."""
        if isinstance(ai_complexity, int) and 1 <= ai_complexity <= 9:
            return ai_complexity
        return calculate_complexity_score(f"{'word ' * word_count}")
    
    def _validate_reading_level(self, ai_level: Any, word_count: int) -> str:
        """Validate reading level."""
        valid_levels = ["Basic", "Intermediate", "Advanced"]
        if isinstance(ai_level, str) and ai_level in valid_levels:
            return ai_level
        return calculate_reading_level(f"{'word ' * word_count}")
    
    def _create_basic_analysis(self, text: str, title: Optional[str]) -> Dict[str, Any]:
        """Create basic analysis when AI processing fails."""
        
        word_count = len(text.split())
        keywords = extract_keywords(text)
        
        return {
            "title": title or "Research Analysis",
            "summary": text[:500] + "..." if len(text) > 500 else text,
            "keyPoints": [
                f"Document contains {word_count} words",
                "Content successfully processed",
                "Key concepts identified"
            ],
            "methodology": "Text analysis and keyword extraction",
            "findings": [
                f"Primary keywords: {', '.join(keywords[:3])}",
                f"Document complexity: {calculate_complexity_score(text)}/9"
            ],
            "limitations": ["Automated analysis only", "Manual review recommended"],
            "implications": ["Further detailed analysis may be beneficial"],
            "relatedTopics": keywords[:5],
            "complexity": calculate_complexity_score(text),
            "readingLevel": calculate_reading_level(text),
            "keywords": keywords
        }
    
    def _format_questions(self, questions_data: List[Dict[str, Any]]) -> List[QuizQuestion]:
        """Format questions into QuizQuestion objects."""
        
        formatted_questions = []
        
        for i, q_data in enumerate(questions_data[:5]):  # Limit to 5 questions
            try:
                question = QuizQuestion(
                    id=f"q_{i+1}_{int(time.time())}",
                    question=q_data.get("question", f"Question {i+1}"),
                    type=QuestionType(q_data.get("type", "multiple-choice")),
                    difficulty=DifficultyLevel(q_data.get("difficulty", "medium")),
                    options=q_data.get("options", []),
                    correct_answer=q_data.get("correct_answer", q_data.get("answer", "")),
                    explanation=q_data.get("explanation"),
                    points=q_data.get("points", 1),
                    topic=q_data.get("topic", "Research Analysis")
                )
                formatted_questions.append(question)
            except Exception as e:
                logger.warning(f"Failed to format question {i+1}: {e}")
                continue
        
        return formatted_questions
    
    def _create_fallback_questions(self, analysis: Dict[str, Any]) -> List[QuizQuestion]:
        """Create fallback questions when generation fails."""
        
        return [
            QuizQuestion(
                id=f"fallback_1_{int(time.time())}",
                question="What is the main focus of this research?",
                type=QuestionType.MULTIPLE_CHOICE,
                difficulty=DifficultyLevel.MEDIUM,
                options=[
                    "Primary research topic",
                    "Secondary analysis",
                    "Literature review",
                    "Case study"
                ],
                correct_answer="Primary research topic",
                explanation="Based on the analysis, this represents the main research focus.",
                topic="Research Analysis"
            ),
            QuizQuestion(
                id=f"fallback_2_{int(time.time())}",
                question="What type of methodology was used in this research?",
                type=QuestionType.SHORT_ANSWER,
                difficulty=DifficultyLevel.MEDIUM,
                correct_answer=analysis.get("methodology", "Not specified"),
                explanation="The methodology describes the research approach taken.",
                topic="Research Methodology"
            )
        ]
    
    def _extract_tags(self, analysis: Dict[str, Any]) -> List[str]:
        """Extract relevant tags from analysis."""
        
        tags = ["research", "analysis", "academic"]
        
        # Add complexity tags
        complexity = analysis.get("complexity", 5)
        if complexity <= 3:
            tags.append("basic")
        elif complexity >= 7:
            tags.append("advanced")
        else:
            tags.append("intermediate")
        
        # Add reading level tag
        reading_level = analysis.get("readingLevel", "").lower()
        if reading_level:
            tags.append(reading_level)
        
        # Add related topics
        related_topics = analysis.get("relatedTopics", [])
        tags.extend([topic.lower().replace(" ", "-") for topic in related_topics[:3]])
        
        # Add keywords as tags
        keywords = analysis.get("keywords", [])
        tags.extend([kw.lower() for kw in keywords[:3]])
        
        return list(set(tags))  # Remove duplicates
    
    def _load_analysis_prompt(self) -> str:
        """Load the analysis prompt template."""
        return """Analyze the following research/academic text and provide a comprehensive analysis in JSON format.

{title}
Text to analyze:
{text}

Please provide a detailed analysis in valid JSON format with these exact fields:
{{
    "title": "Extracted or given title",
    "summary": "2-3 sentence summary of the main content",
    "keyPoints": ["key point 1", "key point 2", "key point 3", ...],
    "methodology": "Research methodology if mentioned, otherwise 'Not specified'",
    "findings": ["main finding 1", "main finding 2", ...],
    "limitations": ["limitation 1", "limitation 2", ...],
    "implications": ["implication 1", "implication 2", ...],
    "relatedTopics": ["related topic 1", "related topic 2", ...],
    "complexity": 5,
    "readingLevel": "Intermediate",
    "keywords": ["keyword1", "keyword2", ...]
}}

Focus on:
1. Main arguments and findings
2. Research methodology (if present)
3. Key concepts and terminology
4. Practical implications
5. Areas for further research
6. Overall complexity (1-9 scale)
7. Reading level (Basic/Intermediate/Advanced)

Language: {language}

Respond with valid JSON only:"""
    
    def _load_question_prompt(self) -> str:
        """Load the question generation prompt template."""
        return """Based on this research analysis, generate 3-5 educational quiz questions to test understanding.

Text excerpt: {text}
Summary: {summary}
Key Points: {key_points}
Main Findings: {findings}

Generate questions that test:
1. Comprehension of main concepts
2. Understanding of key findings
3. Critical thinking about implications
4. Knowledge of methodology

Respond with valid JSON in this format:
{{
    "questions": [
        {{
            "question": "What is the primary focus of this research?",
            "type": "multiple-choice",
            "difficulty": "medium",
            "options": ["option1", "option2", "option3", "option4"],
            "correct_answer": "option1",
            "explanation": "This is correct because...",
            "topic": "Research Focus"
        }},
        {{
            "question": "Explain the main methodology used.",
            "type": "short-answer", 
            "difficulty": "medium",
            "correct_answer": "Brief expected answer",
            "explanation": "The methodology involves...",
            "topic": "Research Methods"
        }}
    ]
}}

Language: {language}

Generate diverse question types (multiple-choice, true-false, short-answer).
Respond with valid JSON only:"""
