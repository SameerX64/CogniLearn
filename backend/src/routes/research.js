const express = require('express');
const { auth } = require('../middleware/auth');
const axios = require('axios');

const router = express.Router();

// AI service URL
const AI_SERVICE_URL = process.env.AI_SERVICE_URL || 'http://localhost:8000';

// Research analysis model
const mongoose = require('mongoose');

const researchAnalysisSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  title: String,
  originalText: String,
  source: {
    type: String,
    url: String,
    uploadedFile: String
  },
  analysis: {
    summary: String,
    keyPoints: [String],
    methodology: String,
    findings: [String],
    limitations: [String],
    implications: [String],
    relatedTopics: [String],
    complexity: Number,
    readingLevel: String
  },
  generatedQuestions: [{
    question: String,
    type: String,
    difficulty: String
  }],
  tags: [String],
  isPublic: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true
});

const ResearchAnalysis = mongoose.model('ResearchAnalysis', researchAnalysisSchema);

// Analyze research paper
router.post('/analyze', auth, async (req, res) => {
  try {
    const { text, source, title } = req.body;

    if (!text) {
      return res.status(400).json({
        error: 'Research text is required'
      });
    }

    if (text.length < 100) {
      return res.status(400).json({
        error: 'Text too short for meaningful analysis'
      });
    }

    try {
      // Call AI service for research analysis
      const aiResponse = await axios.post(`${AI_SERVICE_URL}/api/analyze-research`, {
        text,
        source,
        title
      });

      const analysis = aiResponse.data;

      // Save analysis to database
      const researchAnalysis = new ResearchAnalysis({
        userId: req.user._id,
        title: title || analysis.title || 'Research Analysis',
        originalText: text.substring(0, 10000), // Store first 10k characters
        source,
        analysis: analysis.analysis,
        generatedQuestions: analysis.questions || [],
        tags: analysis.tags || []
      });

      await researchAnalysis.save();

      res.json({
        message: 'Research analyzed successfully',
        analysisId: researchAnalysis._id,
        analysis: {
          summary: analysis.analysis.summary,
          keyPoints: analysis.analysis.keyPoints,
          methodology: analysis.analysis.methodology,
          findings: analysis.analysis.findings,
          limitations: analysis.analysis.limitations,
          implications: analysis.analysis.implications,
          relatedTopics: analysis.analysis.relatedTopics,
          complexity: analysis.analysis.complexity,
          readingLevel: analysis.analysis.readingLevel
        },
        questions: analysis.questions,
        tags: analysis.tags
      });
    } catch (aiError) {
      console.log('AI service unavailable, using fallback analysis');
      
      // Fallback: Basic text analysis
      const wordCount = text.split(/\s+/).length;
      const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0);
      const avgWordsPerSentence = Math.round(wordCount / sentences.length);
      
      const fallbackAnalysis = {
        summary: text.substring(0, 500) + '...',
        keyPoints: [
          'Text analysis requires AI service',
          'Manual review recommended',
          `Document contains ${wordCount} words`,
          `Average sentence length: ${avgWordsPerSentence} words`
        ],
        methodology: 'Manual analysis required',
        findings: ['AI service unavailable for detailed analysis'],
        limitations: ['Limited to basic text statistics'],
        implications: ['Full analysis requires AI service connectivity'],
        relatedTopics: [],
        complexity: Math.min(Math.max(Math.round(avgWordsPerSentence / 5), 1), 9),
        readingLevel: avgWordsPerSentence > 20 ? 'Advanced' : avgWordsPerSentence > 15 ? 'Intermediate' : 'Basic'
      };

      const researchAnalysis = new ResearchAnalysis({
        userId: req.user._id,
        title: title || 'Research Analysis (Fallback)',
        originalText: text.substring(0, 10000),
        source,
        analysis: fallbackAnalysis,
        generatedQuestions: [],
        tags: ['fallback-analysis']
      });

      await researchAnalysis.save();

      res.json({
        message: 'Basic analysis completed (AI service unavailable)',
        analysisId: researchAnalysis._id,
        analysis: fallbackAnalysis,
        questions: [],
        tags: ['fallback-analysis']
      });
    }
  } catch (error) {
    console.error('Analyze research error:', error);
    res.status(500).json({
      error: 'Failed to analyze research'
    });
  }
});

// Get user's analysis history
router.get('/history', auth, async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const [analyses, total] = await Promise.all([
      ResearchAnalysis.find({ userId: req.user._id })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit))
        .select('-originalText') // Exclude large text field
        .lean(),
      ResearchAnalysis.countDocuments({ userId: req.user._id })
    ]);

    res.json({
      analyses,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (error) {
    console.error('Get analysis history error:', error);
    res.status(500).json({
      error: 'Failed to fetch analysis history'
    });
  }
});

// Get specific analysis
router.get('/:id', auth, async (req, res) => {
  try {
    const analysis = await ResearchAnalysis.findOne({
      _id: req.params.id,
      userId: req.user._id
    });

    if (!analysis) {
      return res.status(404).json({
        error: 'Analysis not found'
      });
    }

    res.json({ analysis });
  } catch (error) {
    console.error('Get analysis error:', error);
    res.status(500).json({
      error: 'Failed to fetch analysis'
    });
  }
});

// Delete analysis
router.delete('/:id', auth, async (req, res) => {
  try {
    const analysis = await ResearchAnalysis.findOneAndDelete({
      _id: req.params.id,
      userId: req.user._id
    });

    if (!analysis) {
      return res.status(404).json({
        error: 'Analysis not found'
      });
    }

    res.json({
      message: 'Analysis deleted successfully'
    });
  } catch (error) {
    console.error('Delete analysis error:', error);
    res.status(500).json({
      error: 'Failed to delete analysis'
    });
  }
});

// Update analysis visibility
router.patch('/:id/visibility', auth, async (req, res) => {
  try {
    const { isPublic } = req.body;

    const analysis = await ResearchAnalysis.findOneAndUpdate(
      { _id: req.params.id, userId: req.user._id },
      { isPublic: !!isPublic },
      { new: true }
    );

    if (!analysis) {
      return res.status(404).json({
        error: 'Analysis not found'
      });
    }

    res.json({
      message: 'Visibility updated successfully',
      isPublic: analysis.isPublic
    });
  } catch (error) {
    console.error('Update visibility error:', error);
    res.status(500).json({
      error: 'Failed to update visibility'
    });
  }
});

module.exports = router;
