const express = require('express');
const multer = require('multer');
const Stripe = require('stripe');

const config = require('../config');
const sessionStore = require('../store/sessionStore');
const { generateEnhancedResume } = require('../services/resumeUpdater');

const router = express.Router();
const stripe = new Stripe(config.stripeSecretKey, {
  apiVersion: '2024-09-30.acacia'
});

// Configure multer to store files in memory
const upload = multer({ storage: multer.memoryStorage() });

// Helper to extract text from uploaded resume file.
// For this MVP:
// - If text/plain, treat buffer as UTF-8 text.
// - For other types (pdf/doc/docx), we *do not* parse; instead, return a friendly error.
function extractTextFromFile(file) {
  if (!file) return '';

  if (file.mimetype === 'text/plain') {
    return file.buffer.toString('utf-8');
  }

  // NOTE:
  // Real-world app would parse PDF/DOC/DOCX here.
  // For this MVP we deliberately do NOT parse those formats
  // to keep dependencies small and behavior explicit.
  // The frontend should instruct users to paste plain text for best results.
  const supported = ['text/plain'];
  throw new Error(
    `Unsupported file type "${file.mimetype}". For this demo, please upload a .txt file or paste your resume text. Supported mimetypes: ${supported.join(
      ', '
    )}`
  );
}

// POST /api/resume/upload-and-prepare
router.post('/upload-and-prepare', upload.single('resumeFile'), async (req, res) => {
  try {
    const { resumeText, notes, jobDescription } = req.body;
    const file = req.file;

    if (!jobDescription || !jobDescription.trim()) {
      return res.status(400).json({
        error: 'VALIDATION_ERROR',
        message: 'Job description is required.'
      });
    }

    let finalResumeText = '';

    if (resumeText && resumeText.trim()) {
      finalResumeText = resumeText.trim();
    } else if (file) {
      try {
        finalResumeText = extractTextFromFile(file).trim();
      } catch (err) {
        return res.status(400).json({
          error: 'UNSUPPORTED_FILE',
          message: err.message || 'Unsupported file format.'
        });
      }
    }

    if (!finalResumeText) {
      return res.status(400).json({
        error: 'VALIDATION_ERROR',
        message: 'Please provide your resume as text or upload a supported text file.'
      });
    }

    const clientSessionId = `${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;

    sessionStore.saveResumeData(clientSessionId, {
      resumeText: finalResumeText,
      notes: notes || '',
      jobDescription: jobDescription.trim()
    });

    return res.json({ clientSessionId });
  } catch (err) {
    console.error('Error in upload-and-prepare:', err.message || err);
    return res.status(500).json({
      error: 'SERVER_ERROR',
      message: 'Unable to prepare resume data. Please try again.'
    });
  }
});

// POST /api/resume/generate
router.post('/generate', express.json(), async (req, res) => {
  try {
    const { checkoutSessionId, clientSessionId } = req.body || {};

    if (!checkoutSessionId || !clientSessionId) {
      return res.status(400).json({
        error: 'INVALID_REQUEST',
        message: 'checkoutSessionId and clientSessionId are required.'
      });
    }

    // Verify Stripe session exists and is paid
    let session;
    try {
      session = await stripe.checkout.sessions.retrieve(checkoutSessionId);
    } catch (err) {
      console.error('Error retrieving Stripe session:', err.message || err);
      return res.status(400).json({
        error: 'INVALID_SESSION',
        message: 'Could not verify payment session with Stripe.'
      });
    }

    if (!session || session.payment_status !== 'paid') {
      return res.status(403).json({
        error: 'UNPAID',
        message: 'Payment not confirmed. Please complete payment before generating resumes.'
      });
    }

    // Initialize credits if not already present
    sessionStore.initCreditsForPayment(checkoutSessionId, 3);

    // Consume a credit
    const creditResult = sessionStore.consumeCredit(checkoutSessionId);
    if (!creditResult.success) {
      return res.status(403).json({
        error: 'NO_CREDITS',
        message: 'You have used all 3 resume upgrades for this purchase.'
      });
    }

    // Retrieve resume data
    const resumeData = sessionStore.getResumeData(clientSessionId);
    if (!resumeData) {
      return res.status(400).json({
        error: 'INVALID_SESSION',
        message: 'Resume data not found for this session.'
      });
    }

    const enhancedResumeText = await generateEnhancedResume({
      resumeText: resumeData.resumeText,
      notes: resumeData.notes,
      jobDescription: resumeData.jobDescription
    });

    return res.json({
      enhancedResumeText,
      remainingCredits: creditResult.remainingCredits
    });
  } catch (err) {
    console.error('Error generating resume:', err.message || err);
    return res.status(500).json({
      error: 'SERVER_ERROR',
      message: 'Failed to generate enhanced resume. Please try again.'
    });
  }
});

module.exports = router;