'use client';

import { useState, useEffect } from 'react';
import AuthenticatedLayout from '../../components/shared/AuthenticatedLayout';

export default function Notes() {
  const [notes, setNotes] = useState('');
  const [savedNotes, setSavedNotes] = useState<Array<{id: string, title: string, content: string, date: string}>>([]);
  const [selectedNote, setSelectedNote] = useState<string | null>(null);

  useEffect(() => {
    // Load saved notes from localStorage
    const saved = localStorage.getItem('cognilearn_notes');
    if (saved) {
      setSavedNotes(JSON.parse(saved));
    }
  }, []);

  const saveNote = () => {
    if (!notes.trim()) return;
    
    const newNote = {
      id: Date.now().toString(),
      title: notes.split('\n')[0].substring(0, 50) + '...',
      content: notes,
      date: new Date().toLocaleDateString()
    };
    
    const updated = [...savedNotes, newNote];
    setSavedNotes(updated);
    localStorage.setItem('cognilearn_notes', JSON.stringify(updated));
    setNotes('');
    alert('Note saved successfully!');
  };

  const loadNote = (noteId: string) => {
    const note = savedNotes.find(n => n.id === noteId);
    if (note) {
      setNotes(note.content);
      setSelectedNote(noteId);
    }
  };

  const deleteNote = (noteId: string) => {
    const updated = savedNotes.filter(n => n.id !== noteId);
    setSavedNotes(updated);
    localStorage.setItem('cognilearn_notes', JSON.stringify(updated));
    if (selectedNote === noteId) {
      setNotes('');
      setSelectedNote(null);
    }
  };

  const generateAIInsights = () => {
    if (!notes.trim()) {
      alert('Please add some notes first!');
      return;
    }
    
    // Simulate AI insights
    const insights = [
      "🔍 Key concept identified: " + (notes.match(/\b[A-Z][a-z]+\b/g)?.[0] || "Main topic"),
      "💡 Suggestion: Consider adding examples to reinforce understanding",
      "📚 Related topics to explore: Advanced concepts in this field",
      "🎯 Focus area: Practice implementing these concepts"
    ];
    
    const insightText = "\n\n--- AI INSIGHTS ---\n" + insights.join('\n');
    setNotes(prev => prev + insightText);
  };

  return (
    <AuthenticatedLayout>
      <div className="space-y-8">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-white mb-4">📝 Smart Notes</h1>
          <p className="text-xl text-gray-300">
            Take notes with AI-powered organization and insights
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Notes List */}
          <div className="lg:col-span-1">
            <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold text-white">My Notes</h3>
                <button 
                  onClick={() => {setNotes(''); setSelectedNote(null);}}
                  className="bg-green-600 text-white px-3 py-1 rounded text-sm hover:bg-green-700"
                >
                  + New
                </button>
              </div>
              
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {savedNotes.map((note) => (
                  <div 
                    key={note.id}
                    className={`p-3 rounded cursor-pointer transition-colors ${
                      selectedNote === note.id ? 'bg-indigo-600' : 'bg-gray-700 hover:bg-gray-600'
                    }`}
                    onClick={() => loadNote(note.id)}
                  >
                    <h4 className="text-white text-sm font-medium truncate">{note.title}</h4>
                    <p className="text-gray-400 text-xs">{note.date}</p>
                    <button
                      onClick={(e) => {e.stopPropagation(); deleteNote(note.id);}}
                      className="text-red-400 text-xs hover:text-red-300 mt-1"
                    >
                      Delete
                    </button>
                  </div>
                ))}
                {savedNotes.length === 0 && (
                  <p className="text-gray-400 text-center py-4">No notes yet</p>
                )}
              </div>
            </div>
          </div>

          {/* Note Editor */}
          <div className="lg:col-span-3">
            <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-semibold text-white">
                  {selectedNote ? 'Edit Note' : 'Create New Note'}
                </h3>
                <div className="flex space-x-2">
                  <button 
                    onClick={saveNote}
                    className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
                  >
                    Save Note
                  </button>
                  <button 
                    onClick={generateAIInsights}
                    className="bg-purple-600 text-white px-4 py-2 rounded hover:bg-purple-700"
                  >
                    AI Insights
                  </button>
                </div>
              </div>
              
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Start taking notes... AI will help organize and provide insights.

Tips:
• Use clear headings for topics
• Add examples and key points
• Ask questions to explore later
• Use bullet points for lists"
                className="w-full h-96 bg-gray-700 text-white border border-gray-600 rounded-lg p-4 resize-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              />
              
              <div className="flex justify-between items-center mt-4">
                <div className="text-sm text-gray-400">
                  {notes.length} characters • {notes.split(/\s+/).length - 1} words
                </div>
                <div className="flex space-x-2">
                  <button className="bg-orange-600 text-white px-4 py-2 rounded hover:bg-orange-700">
                    Generate Summary
                  </button>
                  <button className="bg-yellow-600 text-white px-4 py-2 rounded hover:bg-yellow-700">
                    Export PDF
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
          <h3 className="text-xl font-semibold text-white mb-4">Quick Actions</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <button className="bg-indigo-600 text-white p-4 rounded-lg hover:bg-indigo-700 transition-colors">
              <div className="text-2xl mb-2">🎯</div>
              <div className="text-sm">Study Plan</div>
            </button>
            <button className="bg-blue-600 text-white p-4 rounded-lg hover:bg-blue-700 transition-colors">
              <div className="text-2xl mb-2">🔗</div>
              <div className="text-sm">Link Topics</div>
            </button>
            <button className="bg-green-600 text-white p-4 rounded-lg hover:bg-green-700 transition-colors">
              <div className="text-2xl mb-2">📊</div>
              <div className="text-sm">Progress</div>
            </button>
            <button className="bg-purple-600 text-white p-4 rounded-lg hover:bg-purple-700 transition-colors">
              <div className="text-2xl mb-2">🤖</div>
              <div className="text-sm">AI Chat</div>
            </button>
          </div>
        </div>
      </div>
    </AuthenticatedLayout>
  );
}
