import multer from 'multer';
import { sendJson, getSession } from '../utils/helpers.js';
import { extractResumeText } from '../resume-analyzer/parser.js';
import { calculateATS } from '../resume-analyzer/atsScore.js';
import { findMissingSkills } from '../resume-analyzer/skills.js';
import { getSuggestions } from '../resume-analyzer/suggestions.js';
import {
  RESUME_FILE_FILTER_MESSAGE_SUBSTRINGS,
  RESUME_TEXT_LENGTH,
  resolveResumeUploadError,
} from '../resume-analyzer/constants.js';
import securityConfig from '../config/security.js';

const MAX_RESUME_FILE_SIZE_BYTES = securityConfig.MAX_RESUME_FILE_SIZE_BYTES;

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: MAX_RESUME_FILE_SIZE_BYTES,
    files: 1,
  },
}).single('resume');

function handleMulterError(err) {
  return resolveResumeUploadError(err);
}

export async function handleAnalyzeResume(req, res) {
  const session = getSession(req);
  if (!session) {
    return sendJson(res, 401, { error: 'Login required.' });
  }

  try {
    await new Promise((resolve, reject) => {
      upload(req, res, (err) => {
        if (err) reject(err);
        else resolve();
      });
    });

    if (!req.file) {
      return sendJson(res, 400, { error: 'No resume file uploaded.' });
    }

    const text = await extractResumeText(req.file);

    if (text.length > RESUME_TEXT_LENGTH.max) {
      return sendJson(res, 400, {
        error: RESUME_TEXT_LENGTH.tooLongMessage(text.length),
      });
    }

    const atsScore = calculateATS(text);
    const missingSkills = findMissingSkills(text);
    const suggestions = getSuggestions(atsScore);

    return sendJson(res, 200, {
      atsScore,
      missingSkills,
      suggestions,
    });
  } catch (error) {
    console.error('Resume analysis error:', error);

    // Handle Multer-specific errors
    if (error.code && error.code.startsWith('LIMIT_')) {
      const handled = handleMulterError(error);
      return sendJson(res, handled.statusCode, { error: handled.error });
    }

    // Handle file filter errors
    if (
      error.message &&
      RESUME_FILE_FILTER_MESSAGE_SUBSTRINGS.some((s) => error.message.includes(s))
    ) {
      const handled = handleMulterError(error);
      return sendJson(res, handled.statusCode, { error: handled.error });
    }

    if (error.message === 'Resume text extraction timed out.') {
      return sendJson(res, 408, {
        error:
          'The request took too long to process. The resume file might be corrupted or too complex.',
      });
    }

    return sendJson(res, 500, {
      error: error.message || 'Failed to analyze resume.',
    });
  }
}

export function handleUploadError(error) {
  return handleMulterError(error);
}
