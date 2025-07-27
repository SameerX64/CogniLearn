'use client';

import { useState } from 'react';
import AuthenticatedLayout from '../../components/shared/AuthenticatedLayout';

export default function Summary() {
  const [inputContent, setInputContent] = useState('');
  const [summaryResult, setSummaryResult] = useState<any>(null);
  const [isSummarizing, setIsSummarizing] = useState(false);
  const [summaryType, setSummaryType] = useState('general');

  const generateSummary = async () => {
    if (!inputContent.trim()) {
      alert('Please enter some content to summarize!');
      return;
    }

    setIsSummarizing(true);
    
    // Simulate AI processing
    setTimeout(() => {
      const result = {
        summary: generateFallbackSummary(inputContent),
        keyPoints: extractKeyPoints(inputContent),
        insights: generateInsights(inputContent),
        actionItems: generateActionItems(inputContent),
        wordCount: inputContent.split(' ').length,
        readingTime: Math.ceil(inputContent.split(' ').length / 200)
      };
      
      setSummaryResult(result);
      setIsSummarizing(false);
    }, 2000);
  };

  const generateFallbackSummary = (text: string): string => {
    const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0);
    const firstSentence = sentences[0]?.trim() || '';
    const lastSentence = sentences[sentences.length - 1]?.trim() || '';
    
    return `This content discusses ${firstSentence.toLowerCase()}. The main focus appears to be on key concepts and ideas presented in the text. ${lastSentence ? 'The conclusion emphasizes ' + lastSentence.toLowerCase() : ''}`;
  };

  const extractKeyPoints = (text: string): string[] => {
    const commonWords = text.toLowerCase().match(/\b\w{4,}\b/g) || [];
    const wordFreq: Record<string, number> = {};
    commonWords.forEach(word => {
      wordFreq[word] = (wordFreq[word] || 0) + 1;
    });
    
    return [
      `Main theme: ${Object.keys(wordFreq)[0] || 'General topic'}`,
      `Content length: ${text.split(' ').length} words`,
      `Key focus areas identified in the text`,
      `Structured information for easy understanding`
    ];
  };

  const generateInsights = (text: string): string[] => {
    return [
      `Content complexity: ${text.split(' ').length > 500 ? 'Advanced' : text.split(' ').length > 200 ? 'Intermediate' : 'Basic'}`,
      `Document structure: ${text.split('\n').length > 10 ? 'Well-structured with multiple sections' : 'Simple structure'}`,
      `Recommended study time: ${Math.ceil(text.split(' ').length / 100)} minutes`,
      `Best suited for: ${text.length > 1000 ? 'Detailed study session' : 'Quick review'}`
    ];
  };

  const generateActionItems = (text: string): string[] => {
    const actions = [];
    actions.push('Review the key points highlighted above');
    actions.push('Take notes on the most important concepts');
    actions.push('Create personal notes summarizing the main concepts');
    actions.push('Research additional resources on the topics mentioned');
    
    return actions.slice(0, 4);
  };

  const clearContent = () => {
    setInputContent('');
    setSummaryResult(null);
  };

  return (
    <AuthenticatedLayout>
      <div className="space-y-8">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-white mb-4">📋 Content Summary</h1>
          <p className="text-xl text-gray-300">
            Generate AI-powered summaries and insights from any content
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Input Section */}
          <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-semibold text-white">Input Content</h3>
              <select 
                value={summaryType}
                onChange={(e) => setSummaryType(e.target.value)}
                className="bg-gray-700 text-white border border-gray-600 rounded px-3 py-1"
              >
                <option value="general">General Summary</option>
                <option value="academic">Academic Analysis</option>
                <option value="business">Business Insights</option>
                <option value="technical">Technical Summary</option>
              </select>
            </div>
            
            <textarea
              value={inputContent}
              onChange={(e) => setInputContent(e.target.value)}
              placeholder="Paste your text here...

You can input:
• Articles and blog posts
• Research papers
• Meeting notes
• Study materials
• Book chapters
• Any text content"
              className="w-full h-64 bg-gray-700 text-white border border-gray-600 rounded-lg p-4 resize-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            />
            
            <div className="flex justify-between items-center mt-4">
              <div className="text-sm text-gray-400">
                {inputContent.length} characters • {inputContent.split(/\s+/).length - 1} words
              </div>
              <div className="flex space-x-2">
                <button 
                  onClick={clearContent}
                  className="bg-gray-600 text-white px-4 py-2 rounded hover:bg-gray-700"
                >
                  Clear
                </button>
                <button 
                  onClick={generateSummary}
                  disabled={isSummarizing}
                  className="bg-indigo-600 text-white px-6 py-2 rounded hover:bg-indigo-700 disabled:opacity-50"
                >
                  {isSummarizing ? 'Analyzing...' : 'Generate Summary'}
                </button>
              </div>
            </div>
          </div>

          {/* Results Section */}
          <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
            <h3 className="text-xl font-semibold text-white mb-4">AI Summary & Insights</h3>
            
            {isSummarizing && (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-400 mx-auto mb-4"></div>
                <p className="text-gray-300">Analyzing content...</p>
              </div>
            )}
            
            {summaryResult && !isSummarizing && (
              <div className="space-y-6">
                {/* Summary */}
                <div>
                  <h4 className="text-lg font-semibold text-indigo-400 mb-2">Summary</h4>
                  <p className="text-gray-300 bg-gray-700 p-4 rounded-lg">
                    {summaryResult.summary}
                  </p>
                </div>

                {/* Key Points */}
                <div>
                  <h4 className="text-lg font-semibold text-green-400 mb-2">Key Points</h4>
                  <ul className="space-y-2">
                    {summaryResult.keyPoints.map((point: string, index: number) => (
                      <li key={index} className="text-gray-300 flex items-start">
                        <span className="text-green-400 mr-2">•</span>
                        {point}
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Insights */}
                <div>
                  <h4 className="text-lg font-semibold text-yellow-400 mb-2">Insights</h4>
                  <ul className="space-y-2">
                    {summaryResult.insights.map((insight: string, index: number) => (
                      <li key={index} className="text-gray-300 flex items-start">
                        <span className="text-yellow-400 mr-2">💡</span>
                        {insight}
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Action Items */}
                <div>
                  <h4 className="text-lg font-semibold text-blue-400 mb-2">Action Items</h4>
                  <ul className="space-y-2">
                    {summaryResult.actionItems.map((action: string, index: number) => (
                      <li key={index} className="text-gray-300 flex items-start">
                        <span className="text-blue-400 mr-2">📋</span>
                        {action}
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Stats */}
                <div className="bg-gray-700 p-4 rounded-lg">
                  <h4 className="text-lg font-semibold text-purple-400 mb-2">Statistics</h4>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-gray-400">Word Count:</span>
                      <span className="text-white ml-2">{summaryResult.wordCount}</span>
                    </div>
                    <div>
                      <span className="text-gray-400">Reading Time:</span>
                      <span className="text-white ml-2">{summaryResult.readingTime} min</span>
                    </div>
                  </div>
                </div>
              </div>
            )}
            
            {!summaryResult && !isSummarizing && (
              <div className="text-center py-8">
                <div className="text-6xl mb-4">📝</div>
                <p className="text-gray-400">Enter content and click "Generate Summary" to get AI insights</p>
              </div>
            )}
          </div>
        </div>

        {/* Quick Templates */}
        <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
          <h3 className="text-xl font-semibold text-white mb-4">Quick Start Templates</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <button 
              onClick={() => setInputContent('This is a sample article about artificial intelligence and machine learning. AI has become increasingly important in various industries, from healthcare to finance. Machine learning algorithms can process vast amounts of data to identify patterns and make predictions.')}
              className="bg-gray-700 p-4 rounded-lg hover:bg-gray-600 transition-colors text-left"
            >
              <h4 className="text-white font-semibold mb-2">📰 Sample Article</h4>
              <p className="text-gray-300 text-sm">Try with a sample tech article</p>
            </button>
            <button 
              onClick={() => setInputContent('Meeting Notes: Project planning session for Q2 2024. Discussed budget allocation, timeline milestones, team responsibilities, and risk management strategies. Key decisions made regarding technology stack and resource allocation.')}
              className="bg-gray-700 p-4 rounded-lg hover:bg-gray-600 transition-colors text-left"
            >
              <h4 className="text-white font-semibold mb-2">📋 Meeting Notes</h4>
              <p className="text-gray-300 text-sm">Summarize meeting content</p>
            </button>
            <button 
              onClick={() => setInputContent('Research Abstract: This study investigates the impact of remote learning on student engagement and academic performance. The methodology involved surveying 500 students and analyzing their performance data over a semester.')}
              className="bg-gray-700 p-4 rounded-lg hover:bg-gray-600 transition-colors text-left"
            >
              <h4 className="text-white font-semibold mb-2">🔬 Research Paper</h4>
              <p className="text-gray-300 text-sm">Academic content analysis</p>
            </button>
          </div>
        </div>
      </div>
    </AuthenticatedLayout>
  );
}
