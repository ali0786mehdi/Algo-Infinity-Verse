import {
  handleGuestLogin,
  handleSignup,
  handleLogin,
  handleLogout,
  handleDeactivateAccount,
  handleSession,
} from '../handlers/authHandlers.js';
import { handleAnalyzeResume } from '../handlers/resumeHandlers.js';
import { handleSubmitFeedback } from '../handlers/feedbackHandlers.js';
import { handleSubmitInterviewExperience } from '../handlers/interviewHandlers.js';
import {
  handleMemoryLog,
  handleMemoryDue,
  handleMemoryAll,
  handleMemoryDelete,
  handleMemoryStats,
  handleMemoryReset,
} from '../handlers/memoryHandlers.js';
import { handleUserPersonality } from '../handlers/personalityHandlers.js';

export function setupApiRoutes(req, res, pathname) {
  // Guest Login
  if (pathname === '/api/guest' && req.method === 'POST') {
    return handleGuestLogin(req, res);
  }

  // Session
  if (pathname === '/api/session' && req.method === 'GET') {
    return handleSession(req, res);
  }

  // Signup
  if (pathname === '/api/signup' && req.method === 'POST') {
    return handleSignup(req, res);
  }

  // Login
  if (pathname === '/api/login' && req.method === 'POST') {
    return handleLogin(req, res);
  }

  // Deactivate Account
  if (pathname === '/api/deactivate-account' && req.method === 'POST') {
    return handleDeactivateAccount(req, res);
  }

  // Logout
  if (pathname === '/api/logout' && req.method === 'POST') {
    return handleLogout(req, res);
  }

  // Resume Analysis
  if (pathname === '/api/analyze-resume' && req.method === 'POST') {
    return handleAnalyzeResume(req, res);
  }

  // Feedback
  if (pathname === '/api/feedback' && req.method === 'POST') {
    return handleSubmitFeedback(req, res);
  }

  // Interview Experiences
  if (pathname === '/api/interview-experiences' && req.method === 'POST') {
    return handleSubmitInterviewExperience(req, res);
  }

  // ============================================
  // MEMORY ROUTES (Spaced Repetition System)
  // ============================================

  // POST /api/memory/log - Log a memory review
  if (pathname === '/api/memory/log' && req.method === 'POST') {
    return handleMemoryLog(req, res);
  }

  // GET /api/memory/due - Get due cards
  if (pathname === '/api/memory/due' && req.method === 'GET') {
    return handleMemoryDue(req, res);
  }

  // GET /api/memory/all - Get all cards
  if (pathname === '/api/memory/all' && req.method === 'GET') {
    return handleMemoryAll(req, res);
  }

  // DELETE /api/memory/:topic - Delete a card
  // Note: pathname will be like /api/memory/Spanish%20Verbs
  if (pathname.startsWith('/api/memory/') && req.method === 'DELETE') {
    // Extract topic from pathname
    const rawTopic = pathname.replace('/api/memory/', '');
    if (rawTopic && rawTopic.length > 0) {
      // Add topic to request params
      req.params = req.params || {};

      try {
        // 1. Safely decode the topic (Fixes #2206)
        const decodedTopic = decodeURIComponent(rawTopic);

        const MAX_TOPIC_LENGTH = 100;

        // a. Reject empty or whitespace-only strings
        const trimmedTopic = decodedTopic.trim();
        if (trimmedTopic.length === 0) {
          return res.status(400).json({
            error: 'Invalid topic provided. Topic cannot be empty or contain only whitespace.'
          });
        }

        // b. Enforce maximum length
        if (trimmedTopic.length > MAX_TOPIC_LENGTH) {
          return res.status(400).json({
            error: `Topic exceeds maximum length of ${MAX_TOPIC_LENGTH} characters.`
          });
        }

        // c. Validate against supported character rules 
        // (Allows letters, numbers, spaces, hyphens, underscores, and periods)
        if (!/^[a-zA-Z0-9\s\-_.]+$/.test(trimmedTopic)) {
          return res.status(400).json({
            error: 'Topic contains unsupported characters. Only letters, numbers, spaces, hyphens, underscores, and periods are allowed.'
          });
        }
        // ==========================================

        // Assign the sanitized topic to params
        req.params.topic = trimmedTopic;
        return handleMemoryDelete(req, res);

      } catch (error) {
        if (error instanceof URIError) {
          return res.status(400).json({
            error: 'Invalid URL-encoded route parameter. Please provide a valid topic identifier.'
          });
        }
        throw error; // Rethrow any other unexpected system errors
      }
    }
  }

  // GET /api/memory/stats - Get statistics
  if (pathname === '/api/memory/stats' && req.method === 'GET') {
    return handleMemoryStats(req, res);
  }

  // POST /api/memory/reset - Reset all cards
  if (pathname === '/api/memory/reset' && req.method === 'POST') {
    return handleMemoryReset(req, res);
  }

  // Coding Personality
  if (pathname === '/api/user/personality' && req.method === 'GET') {
    return handleUserPersonality(req, res);
  }

  // Learning Session Replay & Timeline
  // handled by api/[...path].js catch-all for these routes.

  return null;
}
