'use client';

import { useState } from 'react';
import AuthenticatedLayout from '../../components/shared/AuthenticatedLayout';

export default function Resume() {
  const [resumeFile, setResumeFile] = useState<File | null>(null);
  const [resumeText, setResumeText] = useState('');
  const [resumeAnalysis, setResumeAnalysis] = useState<any>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisType, setAnalysisType] = useState('general');

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && file.type === 'application/pdf') {
      setResumeFile(file);
      
      // Simulate PDF text extraction
      const simulatedText = `John Doe
Software Engineer
Email: john.doe@email.com | Phone: (555) 123-4567

EXPERIENCE
Software Developer at TechCorp (2020-2023)
- Developed web applications using React and Node.js
- Collaborated with cross-functional teams
- Implemented automated testing procedures

EDUCATION
Bachelor of Science in Computer Science
University of Technology (2016-2020)

SKILLS
- JavaScript, Python, React, Node.js
- Database management (MySQL, MongoDB)
- Version control (Git)
- Agile methodologies`;
      
      setResumeText(simulatedText);
    } else {
      alert('Please upload a PDF file');
    }
  };

  const analyzeResume = async () => {
    if (!resumeText.trim()) {
      alert('Please upload a resume or enter resume text first!');
      return;
    }

    setIsAnalyzing(true);
    
    // Simulate AI analysis
    setTimeout(() => {
      const analysis = {
        overallScore: 85,
        strengths: [
          'Clear contact information and professional summary',
          'Relevant work experience with quantifiable achievements',
          'Good technical skills section',
          'Proper formatting and structure'
        ],
        improvements: [
          'Add more quantifiable metrics (percentages, numbers)',
          'Include relevant certifications or training',
          'Consider adding a professional summary section',
          'Expand on leadership and soft skills'
        ],
        suggestions: [
          'Tailor keywords to match job descriptions',
          'Include links to portfolio or GitHub projects',
          'Consider adding volunteer work or side projects',
          'Keep resume to 1-2 pages maximum'
        ],
        skillsGap: [
          'Cloud platforms (AWS, Azure)',
          'DevOps tools (Docker, Kubernetes)',
          'Advanced JavaScript frameworks',
          'Data analysis skills'
        ],
        atsScore: 78,
        keywordDensity: {
          'JavaScript': 3,
          'React': 2,
          'Node.js': 2,
          'Database': 1
        }
      };
      
      setResumeAnalysis(analysis);
      setIsAnalyzing(false);
    }, 3000);
  };

  const downloadImprovedResume = () => {
    alert('Feature coming soon: Download optimized resume template');
  };

  return (
    <AuthenticatedLayout>
      <div className="space-y-8">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-white mb-4">📄 Resume Analyzer</h1>
          <p className="text-xl text-gray-300">
            AI-powered resume analysis and improvement suggestions
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Upload Section */}
          <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
            <h3 className="text-xl font-semibold text-white mb-4">Upload Resume</h3>
            
            <div className="space-y-4">
              {/* File Upload */}
              <div className="border-2 border-dashed border-gray-600 rounded-lg p-8 text-center">
                <input
                  type="file"
                  accept=".pdf"
                  onChange={handleFileUpload}
                  className="hidden"
                  id="resume-upload"
                />
                <label 
                  htmlFor="resume-upload"
                  className="cursor-pointer block"
                >
                  <div className="text-4xl mb-4">📎</div>
                  <p className="text-gray-300 mb-2">
                    {resumeFile ? resumeFile.name : 'Click to upload PDF resume'}
                  </p>
                  <p className="text-gray-400 text-sm">
                    Supported format: PDF (Max 5MB)
                  </p>
                </label>
              </div>

              {/* Analysis Type */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Analysis Type
                </label>
                <select 
                  value={analysisType}
                  onChange={(e) => setAnalysisType(e.target.value)}
                  className="w-full bg-gray-700 text-white border border-gray-600 rounded px-3 py-2"
                >
                  <option value="general">General Analysis</option>
                  <option value="tech">Technology Roles</option>
                  <option value="business">Business Roles</option>
                  <option value="creative">Creative Roles</option>
                  <option value="ats">ATS Optimization</option>
                </select>
              </div>

              {/* Text Input Alternative */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Or paste resume text:
                </label>
                <textarea
                  value={resumeText}
                  onChange={(e) => setResumeText(e.target.value)}
                  placeholder="Paste your resume content here..."
                  className="w-full h-32 bg-gray-700 text-white border border-gray-600 rounded-lg p-3 resize-none"
                />
              </div>

              {/* Analyze Button */}
              <button 
                onClick={analyzeResume}
                disabled={isAnalyzing}
                className="w-full bg-purple-600 text-white py-3 rounded-lg hover:bg-purple-700 disabled:opacity-50 transition-colors"
              >
                {isAnalyzing ? 'Analyzing Resume...' : 'Analyze Resume'}
              </button>
            </div>
          </div>

          {/* Results Section */}
          <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
            <h3 className="text-xl font-semibold text-white mb-4">Analysis Results</h3>
            
            {isAnalyzing && (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-400 mx-auto mb-4"></div>
                <p className="text-gray-300">Analyzing your resume...</p>
                <p className="text-gray-400 text-sm mt-2">This may take a few moments</p>
              </div>
            )}
            
            {resumeAnalysis && !isAnalyzing && (
              <div className="space-y-6">
                {/* Overall Score */}
                <div className="bg-gray-700 p-4 rounded-lg">
                  <div className="flex justify-between items-center mb-2">
                    <h4 className="text-lg font-semibold text-white">Overall Score</h4>
                    <span className="text-2xl font-bold text-green-400">{resumeAnalysis.overallScore}/100</span>
                  </div>
                  <div className="w-full bg-gray-600 rounded-full h-3">
                    <div 
                      className="bg-green-400 h-3 rounded-full transition-all duration-500"
                      style={{ width: `${resumeAnalysis.overallScore}%` }}
                    ></div>
                  </div>
                  <p className="text-sm text-gray-300 mt-2">
                    ATS Compatibility: {resumeAnalysis.atsScore}%
                  </p>
                </div>

                {/* Strengths */}
                <div>
                  <h4 className="text-lg font-semibold text-green-400 mb-3">✅ Strengths</h4>
                  <ul className="space-y-2">
                    {resumeAnalysis.strengths.map((strength: string, index: number) => (
                      <li key={index} className="text-gray-300 flex items-start">
                        <span className="text-green-400 mr-2">•</span>
                        {strength}
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Areas for Improvement */}
                <div>
                  <h4 className="text-lg font-semibold text-yellow-400 mb-3">⚠️ Areas for Improvement</h4>
                  <ul className="space-y-2">
                    {resumeAnalysis.improvements.map((improvement: string, index: number) => (
                      <li key={index} className="text-gray-300 flex items-start">
                        <span className="text-yellow-400 mr-2">•</span>
                        {improvement}
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Skills Gap */}
                <div>
                  <h4 className="text-lg font-semibold text-red-400 mb-3">🎯 Skills to Consider Adding</h4>
                  <div className="grid grid-cols-2 gap-2">
                    {resumeAnalysis.skillsGap.map((skill: string, index: number) => (
                      <span key={index} className="bg-red-900 text-red-200 px-3 py-1 rounded-full text-sm">
                        {skill}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex space-x-4 pt-4">
                  <button 
                    onClick={downloadImprovedResume}
                    className="bg-indigo-600 text-white px-4 py-2 rounded hover:bg-indigo-700"
                  >
                    Download Improved Template
                  </button>
                  <button className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700">
                    Get Job Matches
                  </button>
                </div>
              </div>
            )}
            
            {!resumeAnalysis && !isAnalyzing && (
              <div className="text-center py-8">
                <div className="text-6xl mb-4">📊</div>
                <p className="text-gray-400">Upload your resume to get detailed AI analysis</p>
                <div className="mt-4 text-sm text-gray-500">
                  <p>Our AI will analyze:</p>
                  <p>• Content optimization • ATS compatibility</p>
                  <p>• Keyword density • Formatting suggestions</p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Tips Section */}
        <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
          <h3 className="text-xl font-semibold text-white mb-4">💡 Resume Tips</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center">
              <div className="text-3xl mb-2">🎯</div>
              <h4 className="font-semibold text-white mb-2">Tailor for Each Job</h4>
              <p className="text-gray-300 text-sm">Customize your resume keywords to match specific job descriptions</p>
            </div>
            <div className="text-center">
              <div className="text-3xl mb-2">📊</div>
              <h4 className="font-semibold text-white mb-2">Use Metrics</h4>
              <p className="text-gray-300 text-sm">Include numbers, percentages, and quantifiable achievements</p>
            </div>
            <div className="text-center">
              <div className="text-3xl mb-2">🤖</div>
              <h4 className="font-semibold text-white mb-2">ATS-Friendly</h4>
              <p className="text-gray-300 text-sm">Use standard formatting and relevant keywords for ATS systems</p>
            </div>
          </div>
        </div>
      </div>
    </AuthenticatedLayout>
  );
}
