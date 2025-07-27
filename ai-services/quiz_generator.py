import asyncio
from typing import List, Dict, Any, Optional
from openai import OpenAI
import json
import os

class QuizGenerator:
    def __init__(self, api_key: str):
        self.client = OpenAI(
            base_url="https://integrate.api.nvidia.com/v1" if "nvapi" in api_key else "https://api.openai.com/v1",
            api_key=api_key
        )
        
    async def generate_quiz(
        self, 
        topic: str, 
        difficulty: str = "medium",
        question_count: int = 10,
        question_type: str = "multiple-choice",
        source: str = "general"
    ) -> Dict[str, Any]:
        """Generate a quiz using AI based on the given parameters."""
        
        try:
            # Build the prompt based on parameters
            prompt = self._build_quiz_prompt(topic, difficulty, question_count, question_type, source)
            
            # Get AI response
            response = self.client.chat.completions.create(
                model="meta/llama3-70b-instruct",
                messages=[{"role": "user", "content": prompt}],
                temperature=0.7,
                max_tokens=2000
            )
            
            # Parse the response
            quiz_text = response.choices[0].message.content
            quiz_data = self._parse_quiz_response(quiz_text, topic, difficulty)
            
            return quiz_data
            
        except Exception as e:
            print(f"Quiz generation error: {e}")
            # Return fallback quiz
            return self._create_fallback_quiz(topic, difficulty, question_count)
    
    def _build_quiz_prompt(self, topic: str, difficulty: str, question_count: int, question_type: str, source: str) -> str:
        """Build a comprehensive prompt for quiz generation."""
        
        difficulty_descriptions = {
            "easy": "basic, introductory level concepts",
            "medium": "intermediate level concepts requiring some understanding",
            "hard": "advanced concepts requiring deep understanding"
        }
        
        type_instructions = {
            "multiple-choice": "4 options each, with exactly one correct answer",
            "true-false": "simple true or false questions",
            "short-answer": "questions requiring brief written responses"
        }
        
        prompt = f"""Generate a {difficulty} level quiz on "{topic}" with {question_count} {question_type} questions.

Topic: {topic}
Difficulty: {difficulty} ({difficulty_descriptions.get(difficulty, 'moderate')})
Question Type: {question_type} ({type_instructions.get(question_type, 'varied questions')})
Number of Questions: {question_count}

Requirements:
1. Questions should be educational and test understanding of {topic}
2. Difficulty level should be {difficulty}
3. Include explanations for correct answers
4. Make questions practical and relevant
5. Avoid ambiguous wording

Format the response as JSON with this structure:
{{
    "title": "{topic} Quiz",
    "description": "Quiz description",
    "category": "appropriate category",
    "questions": [
        {{
            "question": "Question text",
            "type": "{question_type}",
            "options": [
                {{"text": "Option A", "isCorrect": false}},
                {{"text": "Option B", "isCorrect": true}},
                {{"text": "Option C", "isCorrect": false}},
                {{"text": "Option D", "isCorrect": false}}
            ],
            "explanation": "Why the correct answer is right",
            "difficulty": "{difficulty}",
            "points": 1,
            "tags": ["{topic}"]
        }}
    ]
}}

Generate the quiz now:"""
        
        return prompt
    
    def _parse_quiz_response(self, response_text: str, topic: str, difficulty: str) -> Dict[str, Any]:
        """Parse the AI response into structured quiz data."""
        
        try:
            # Try to extract JSON from the response
            start_idx = response_text.find('{')
            end_idx = response_text.rfind('}') + 1
            
            if start_idx != -1 and end_idx != -1:
                json_text = response_text[start_idx:end_idx]
                quiz_data = json.loads(json_text)
                return quiz_data
            else:
                # If no JSON found, create structured data from text
                return self._parse_text_response(response_text, topic, difficulty)
                
        except json.JSONDecodeError:
            # Fallback parsing
            return self._parse_text_response(response_text, topic, difficulty)
    
    def _parse_text_response(self, response_text: str, topic: str, difficulty: str) -> Dict[str, Any]:
        """Parse non-JSON text response into quiz format."""
        
        lines = response_text.split('\n')
        questions = []
        current_question = {}
        current_options = []
        
        for line in lines:
            line = line.strip()
            if not line:
                continue
                
            # Look for question patterns
            if line.startswith(('1.', '2.', '3.', '4.', '5.', 'Q1', 'Q2', 'Question')):
                if current_question and current_options:
                    current_question['options'] = current_options
                    questions.append(current_question)
                
                current_question = {
                    'question': line,
                    'type': 'multiple-choice',
                    'difficulty': difficulty,
                    'points': 1,
                    'tags': [topic]
                }
                current_options = []
            
            elif line.startswith(('A.', 'B.', 'C.', 'D.', 'a)', 'b)', 'c)', 'd)')):
                is_correct = '(correct)' in line.lower() or '*' in line
                option_text = line.split('.', 1)[1].strip() if '.' in line else line.split(')', 1)[1].strip()
                option_text = option_text.replace('(correct)', '').replace('*', '').strip()
                
                current_options.append({
                    'text': option_text,
                    'isCorrect': is_correct
                })
        
        # Add the last question
        if current_question and current_options:
            current_question['options'] = current_options
            questions.append(current_question)
        
        return {
            'title': f'{topic} Quiz',
            'description': f'AI-generated quiz on {topic}',
            'category': 'General',
            'questions': questions,
            'sourceText': response_text[:1000]
        }
    
    def _create_fallback_quiz(self, topic: str, difficulty: str, question_count: int) -> Dict[str, Any]:
        """Create a fallback quiz when AI generation fails."""
        
        questions = []
        for i in range(min(question_count, 3)):  # Limit fallback questions
            questions.append({
                'question': f'What is an important concept in {topic}? (Question {i+1})',
                'type': 'multiple-choice',
                'options': [
                    {'text': 'Concept A', 'isCorrect': True},
                    {'text': 'Concept B', 'isCorrect': False},
                    {'text': 'Concept C', 'isCorrect': False},
                    {'text': 'Concept D', 'isCorrect': False}
                ],
                'explanation': f'This is a placeholder question about {topic}. AI generation was unavailable.',
                'difficulty': difficulty,
                'points': 1,
                'tags': [topic, 'placeholder']
            })
        
        return {
            'title': f'{topic} Quiz (Fallback)',
            'description': f'Basic quiz template for {topic}',
            'category': 'General',
            'questions': questions,
            'sourceText': f'Fallback quiz generated for {topic}'
        }
