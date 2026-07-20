// tests/resumeAnalyzerConstants.test.js
//
// Verifies the shared upload error constants (#2403) keep the same status
// codes and messages that the resumeHandlers previously hardcoded.

import securityConfig from '../backend/config/security.js';

const MAX_BYTES = securityConfig.MAX_RESUME_FILE_SIZE_BYTES;
const MAX_TEXT = securityConfig.MAX_RESUME_TEXT_LENGTH;

let RESUME_UPLOAD_MESSAGES;
let RESUME_UPLOAD_DEFAULT;
let RESUME_UPLOAD_FALLBACK;
let RESUME_FILE_FILTER_MESSAGE_SUBSTRINGS;
let RESUME_TEXT_LENGTH;
let resolveResumeUploadError;

beforeAll(async () => {
  const constants = await import('../backend/resume-analyzer/constants.js');
  RESUME_UPLOAD_MESSAGES = constants.RESUME_UPLOAD_MESSAGES;
  RESUME_UPLOAD_DEFAULT = constants.RESUME_UPLOAD_DEFAULT;
  RESUME_UPLOAD_FALLBACK = constants.RESUME_UPLOAD_FALLBACK;
  RESUME_FILE_FILTER_MESSAGE_SUBSTRINGS = constants.RESUME_FILE_FILTER_MESSAGE_SUBSTRINGS;
  RESUME_TEXT_LENGTH = constants.RESUME_TEXT_LENGTH;
  resolveResumeUploadError = constants.resolveResumeUploadError;
});

describe('resume upload error constants (Issue #2403)', () => {
  describe('Table presence (one entry per known Multer code)', () => {
    for (const code of [
      'LIMIT_FILE_SIZE',
      'LIMIT_FILE_COUNT',
      'LIMIT_UNEXPECTED_FILE',
      'LIMIT_FIELD_KEY',
      'LIMIT_FIELD_VALUE',
      'LIMIT_FIELD_COUNT',
      'LIMIT_PART_COUNT',
    ]) {
      it(`defines an entry for ${code}`, () => {
        expect(RESUME_UPLOAD_MESSAGES[code]).toBeDefined();
      });
    }
  });

  describe('Status codes', () => {
    it('LIMIT_FILE_SIZE → 413', () => {
      expect(RESUME_UPLOAD_MESSAGES.LIMIT_FILE_SIZE.statusCode).toBe(413);
    });

    for (const code of [
      'LIMIT_FILE_COUNT',
      'LIMIT_UNEXPECTED_FILE',
      'LIMIT_FIELD_KEY',
      'LIMIT_FIELD_VALUE',
      'LIMIT_FIELD_COUNT',
      'LIMIT_PART_COUNT',
    ]) {
      it(`${code} → 400`, () => {
        expect(RESUME_UPLOAD_MESSAGES[code].statusCode).toBe(400);
      });
    }

    it('default fallback → 400', () => {
      expect(RESUME_UPLOAD_DEFAULT.statusCode).toBe(400);
    });

    it('generic fallback → 500', () => {
      expect(RESUME_UPLOAD_FALLBACK.statusCode).toBe(500);
    });
  });

  describe('Exact messages', () => {
    it('LIMIT_FILE_SIZE includes MAX_RESUME_FILE_SIZE_BYTES-derived MB size', () => {
      const out = resolveResumeUploadError({ code: 'LIMIT_FILE_SIZE', message: 'too big' });
      const expectedMb = MAX_BYTES / (1024 * 1024);
      expect(out.error).toBe(`File too large. Maximum size is ${expectedMb}MB.`);
      expect(out.statusCode).toBe(413);
    });

    it('LIMIT_FILE_COUNT', () => {
      const out = resolveResumeUploadError({ code: 'LIMIT_FILE_COUNT' });
      expect(out.error).toBe('Only one file can be uploaded at a time.');
      expect(out.statusCode).toBe(400);
    });

    it('LIMIT_UNEXPECTED_FILE', () => {
      const out = resolveResumeUploadError({ code: 'LIMIT_UNEXPECTED_FILE' });
      expect(out.error).toBe('Unexpected field name. Please use "resume" as the field name.');
      expect(out.statusCode).toBe(400);
    });

    it('LIMIT_FIELD_KEY', () => {
      const out = resolveResumeUploadError({ code: 'LIMIT_FIELD_KEY' });
      expect(out.error).toBe('Field name too long or contains invalid characters.');
      expect(out.statusCode).toBe(400);
    });

    it('LIMIT_FIELD_VALUE', () => {
      const out = resolveResumeUploadError({ code: 'LIMIT_FIELD_VALUE' });
      expect(out.error).toBe('Field value too large or contains invalid data.');
      expect(out.statusCode).toBe(400);
    });

    it('LIMIT_FIELD_COUNT', () => {
      const out = resolveResumeUploadError({ code: 'LIMIT_FIELD_COUNT' });
      expect(out.error).toBe('Too many fields in the request.');
      expect(out.statusCode).toBe(400);
    });

    it('LIMIT_PART_COUNT', () => {
      const out = resolveResumeUploadError({ code: 'LIMIT_PART_COUNT' });
      expect(out.error).toBe('Too many parts in the request.');
      expect(out.statusCode).toBe(400);
    });

    it('unknown Multer code → UPLOAD_ERROR_PREFIX', () => {
      const out = resolveResumeUploadError({ code: 'LIMIT_WEIRD_NEW_CODE', message: '?' });
      expect(out.error).toMatch(/^Upload error: /);
      expect(out.error).toContain('?');
      expect(out.statusCode).toBe(400);
    });

    it('file filter rejection by substring → 415 with original message', () => {
      const out = resolveResumeUploadError({ message: 'Invalid file type: pdf' });
      expect(out.statusCode).toBe(415);
      expect(out.error).toBe('Invalid file type: pdf');
    });

    it('WEBP/JPEG hint substring → 415', () => {
      const out = resolveResumeUploadError({
        message: 'Only JPEG, PNG, and WEBP images are allowed',
      });
      expect(out.statusCode).toBe(415);
    });

    it('unknown error with no code → 500 with err.message', () => {
      const out = resolveResumeUploadError({ message: 'boom' });
      expect(out.statusCode).toBe(500);
      expect(out.error).toBe('boom');
    });

    it('unknown error with no message → 500 with fallback string', () => {
      const out = resolveResumeUploadError({});
      expect(out.statusCode).toBe(500);
      expect(out.error).toBe('An unexpected error occurred during upload.');
    });
  });

  describe('Text length helper', () => {
    it('exposes MAX_RESUME_TEXT_LENGTH from security config', () => {
      expect(RESUME_TEXT_LENGTH.max).toBe(MAX_TEXT);
    });

    it('tooLongMessage uses current length and the configured ceiling', () => {
      expect(RESUME_TEXT_LENGTH.tooLongMessage(123456)).toBe(
        `Resume text is too long (123456 characters). Please limit your resume text to ${MAX_TEXT} characters.`
      );
    });
  });

  describe('File-filter substrings list is exhaustive of the existing strings', () => {
    it('contains the two substrings the previous in-handler code matched on', () => {
      expect(RESUME_FILE_FILTER_MESSAGE_SUBSTRINGS).toEqual(
        expect.arrayContaining(['Invalid file type', 'Only JPEG, PNG, and WEBP images are allowed'])
      );
    });
  });
});
