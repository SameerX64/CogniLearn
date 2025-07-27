import asyncio
from typing import Dict, Any, Optional, List
from openai import OpenAI
import json
import re

class ResearchAnalyzer:
    def __init__(self, api_key: str):
        self.client = OpenAI(
            base_url="https://integrate.api.nvidia.com/v1" if "nvapi" in api_key else "https://api.openai.com/v1",
            api_key=api_key
        )
        
    async def analyze_paper(
        self, 
        text: str, 
        title: Optional[str] = None,
        source: Optional[Dict[str, str]] = None
    ) -> Dict[str, Any]:
        """Analyze a research paper or academic text using AI."""
        
        try:
            # Truncate text if too long (keep first 8000 characters for context)
            analysis_text = text[:8000] if len(text) > 8000 else text
            
            # Build analysis prompt
            prompt = self._build_analysis_prompt(analysis_text, title)
            
            # Get AI analysis
            response = self.client.chat.completions.create(
                model="meta/llama3-70b-instruct",
                messages=[{"role": "user", "content": prompt}],
                temperature=0.3,  # Lower temperature for more consistent analysis
                max_tokens=1500
            )
            
            # Parse the response
            analysis_result = self._parse_analysis_response(response.choices[0].message.content, text)
            
            # Generate questions based on the analysis
            questions = await self._generate_questions(analysis_text, analysis_result)
            
            return {
                "title": title or analysis_result.get("title", "Research Analysis"),
                "analysis": analysis_result,
                "questions": questions,
                "tags": self._extract_tags(analysis_result)
            }
            
        except Exception as e:
            print(f"Research analysis error: {e}")
            return self._create_fallback_analysis(text, title)
    
    def _build_analysis_prompt(self, text: str, title: Optional[str]) -> str:
        """Build a comprehensive prompt for research analysis."""
        
        prompt = f"""Analyze the following research/academic text and provide a comprehensive analysis:

{f"Title: {title}" if title else ""}

Text to analyze:
{text}

Please provide a detailed analysis in the following JSON format:
{{
    "title": "Extracted or given title",
    "summary": "2-3 sentence summary of the main content",
    "keyPoints": ["key point 1", "key point 2", "key point 3", ...],
    "methodology": "Research methodology if mentioned, or 'Not specified'",
    "findings": ["main finding 1", "main finding 2", ...],
    "limitations": ["limitation 1", "limitation 2", ...],
    "implications": ["implication 1", "implication 2", ...],
    "relatedTopics": ["related topic 1", "related topic 2", ...],
    "complexity": 1-9 (complexity score),
    "readingLevel": "Basic/Intermediate/Advanced"
}}

Focus on:
1. Main arguments and findings
2. Research methodology (if present)
3. Key concepts and terminology
4. Practical implications
5. Areas for further research
6. Overall complexity and reading level

Provide the analysis:"""
        
        return prompt
    
    def _parse_analysis_response(self, response_text: str, original_text: str) -> Dict[str, Any]:
        """Parse the AI response into structured analysis data."""
        
        try:
            # Try to extract JSON from the response
            start_idx = response_text.find('{')
            end_idx = response_text.rfind('}') + 1
            
            if start_idx != -1 and end_idx != -1:
                json_text = response_text[start_idx:end_idx]
                analysis = json.loads(json_text)
                
                # Validate and clean the analysis
                return self._validate_analysis(analysis, original_text)
            else:
                # Parse from structured text
                return self._parse_text_analysis(response_text, original_text)
                
        except json.JSONDecodeError:
            return self._parse_text_analysis(response_text, original_text)
    
    def _validate_analysis(self, analysis: Dict[str, Any], original_text: str) -> Dict[str, Any]:
        """Validate and ensure all required fields are present."""
        
        word_count = len(original_text.split())
        
        # Ensure all required fields exist
        validated = {
            "title": analysis.get("title", "Research Analysis"),
            "summary": analysis.get("summary", original_text[:300] + "..."),
            "keyPoints": analysis.get("keyPoints", ["Analysis completed", "Key insights extracted"]),
            "methodology": analysis.get("methodology", "Not specified"),
            "findings": analysis.get("findings", ["Findings analyzed"]),
            "limitations": analysis.get("limitations", ["Limitations noted"]),
            "implications": analysis.get("implications", ["Implications considered"]),
            "relatedTopics": analysis.get("relatedTopics", []),
            "complexity": self._calculate_complexity(analysis.get("complexity"), word_count),
            "readingLevel": analysis.get("readingLevel", self._determine_reading_level(word_count))
        }
        
        # Ensure lists are actually lists
        for key in ["keyPoints", "findings", "limitations", "implications", "relatedTopics"]:
            if not isinstance(validated[key], list):
                validated[key] = [str(validated[key])]
        
        return validated
    
    def _parse_text_analysis(self, response_text: str, original_text: str) -> Dict[str, Any]:
        """Parse non-JSON text response into analysis format."""
        
        lines = response_text.split('\n')
        analysis = {
            "title": "Research Analysis",
            "summary": "",
            "keyPoints": [],
            "methodology": "Not specified",
            "findings": [],
            "limitations": [],
            "implications": [],
            "relatedTopics": [],
            "complexity": 5,
            "readingLevel": "Intermediate"
        }
        
        current_section = None
        
        for line in lines:
            line = line.strip()
            if not line:
                continue
            
            # Identify sections
            line_lower = line.lower()
            if "summary" in line_lower:
                current_section = "summary"
            elif "key point" in line_lower or "main point" in line_lower:
                current_section = "keyPoints"
            elif "methodology" in line_lower:
                current_section = "methodology"
            elif "finding" in line_lower:
                current_section = "findings"
            elif "limitation" in line_lower:
                current_section = "limitations"
            elif "implication" in line_lower:
                current_section = "implications"
            elif "related" in line_lower or "topic" in line_lower:
                current_section = "relatedTopics"
            elif line.startswith(('-', '•', '*', '1.', '2.')):
                # List item
                item = re.sub(r'^[-•*0-9.\s]+', '', line).strip()
                if current_section and current_section in analysis:
                    if isinstance(analysis[current_section], list):
                        analysis[current_section].append(item)
            elif current_section == "summary":
                analysis["summary"] += line + " "
        
        # Calculate complexity and reading level
        word_count = len(original_text.split())
        analysis["complexity"] = self._calculate_complexity(None, word_count)
        analysis["readingLevel"] = self._determine_reading_level(word_count)
        
        return analysis
    
    def _calculate_complexity(self, ai_complexity: Optional[int], word_count: int) -> int:
        """Calculate complexity score based on AI assessment and text metrics."""
        
        if ai_complexity and 1 <= ai_complexity <= 9:
            return ai_complexity
        
        # Fallback calculation based on word count and other factors
        base_complexity = min(max(word_count // 200, 1), 9)
        return base_complexity
    
    def _determine_reading_level(self, word_count: int) -> str:
        """Determine reading level based on text metrics."""
        
        if word_count < 500:
            return "Basic"
        elif word_count < 2000:
            return "Intermediate"
        else:
            return "Advanced"
    
    async def _generate_questions(self, text: str, analysis: Dict[str, Any]) -> List[Dict[str, Any]]:
        """Generate quiz questions based on the research analysis."""
        
        try:
            prompt = f"""Based on this research analysis, generate 3-5 educational questions:

Text: {text[:1000]}...

Analysis Summary: {analysis.get('summary', '')}
Key Points: {', '.join(analysis.get('keyPoints', [])[:3])}

Generate questions that test understanding of:
1. Main concepts
2. Key findings
3. Implications
4. Critical thinking about the research

Format as JSON array:
[
    {{
        "question": "Question text",
        "type": "multiple-choice",
        "difficulty": "medium"
    }}
]"""

            response = self.client.chat.completions.create(
                model="meta/llama3-70b-instruct",
                messages=[{"role": "user", "content": prompt}],
                temperature=0.7,
                max_tokens=800
            )
            
            # Parse questions
            questions_text = response.choices[0].message.content
            try:
                questions = json.loads(questions_text)
                return questions if isinstance(questions, list) else []
            except:
                return self._create_fallback_questions(analysis)
                
        except Exception as e:
            print(f"Question generation error: {e}")
            return self._create_fallback_questions(analysis)
    
    def _create_fallback_questions(self, analysis: Dict[str, Any]) -> List[Dict[str, Any]]:
        """Create fallback questions when AI generation fails."""
        
        return [
            {
                "question": "What is the main focus of this research?",
                "type": "multiple-choice",
                "difficulty": "medium"
            },
            {
                "question": f"According to the analysis, what is a key finding?",
                "type": "short-answer",
                "difficulty": "medium"
            }
        ]
    
    def _extract_tags(self, analysis: Dict[str, Any]) -> List[str]:
        """Extract relevant tags from the analysis."""
        
        tags = ["research", "analysis"]
        
        # Add tags from related topics
        if analysis.get("relatedTopics"):
            tags.extend(analysis["relatedTopics"][:3])
        
        # Add complexity tag
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
        
        return list(set(tags))  # Remove duplicates
    
    def _create_fallback_analysis(self, text: str, title: Optional[str]) -> Dict[str, Any]:
        """Create a fallback analysis when AI processing fails."""
        
        word_count = len(text.split())
        sentences = text.split('.')
        
        return {
            "title": title or "Research Analysis (Fallback)",
            "analysis": {
                "title": title or "Research Analysis",
                "summary": text[:500] + "..." if len(text) > 500 else text,
                "keyPoints": [
                    f"Document contains {word_count} words",
                    f"Contains {len(sentences)} sentences",
                    "Full AI analysis temporarily unavailable"
                ],
                "methodology": "Analysis methodology not determined",
                "findings": ["Text analysis completed with basic statistics"],
                "limitations": ["Limited to basic text processing"],
                "implications": ["Manual review recommended for detailed insights"],
                "relatedTopics": [],
                "complexity": min(max(word_count // 200, 1), 9),
                "readingLevel": self._determine_reading_level(word_count)
            },
            "questions": [],
            "tags": ["fallback", "basic-analysis"]
        }
