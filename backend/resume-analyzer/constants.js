// backend/resume-analyzer/constants.js
//
// Shared, imported values for the resume analyzer module.
//
// Centralising these here:
//   - keeps Multer / file-filter error messages in one place so updates do
//     not require touching the handler (Issue #2403),
//   - makes them testable in isolation,
//   - lets other call sites (e.g. CLI tools, future background workers)
//     reuse the same wording consistently.

import securityConfig from '../config/security.js';

const MAX_RESUME_FILE_SIZE_BYTES = securityConfig.MAX_RESUME_FILE_SIZE_BYTES;
const MAX_RESUME_TEXT_LENGTH = securityConfig.MAX_RESUME_TEXT_LENGTH;

/**
 * Multer error-code → renderable error message. Values that depend on
 * runtime configuration (e.g. the message uses MAX_RESUME_FILE_SIZE_BYTES)
 * are returned as functions of the relevant arg so the handler does not
 * have to know the configuration keys.
 *
 * @type {Object<string, { statusCode: number, message: string | ((error: Error) => string) }>}
 */
export const RESUME_UPLOAD_MESSAGES = Object.freeze({
  LIMIT_FILE_SIZE: {
    statusCode: 413,
    message: () =>
      `File too large. Maximum size is ${MAX_RESUME_FILE_SIZE_BYTES / (1024 * 1024)}MB.`,
  },
  LIMIT_FILE_COUNT: {
    statusCode: 400,
    message: 'Only one file can be uploaded at a time.',
  },
  LIMIT_UNEXPECTED_FILE: {
    statusCode: 400,
    message: 'Unexpected field name. Please use "resume" as the field name.',
  },
  LIMIT_FIELD_KEY: {
    statusCode: 400,
    message: 'Field name too long or contains invalid characters.',
  },
  LIMIT_FIELD_VALUE: {
    statusCode: 400,
    message: 'Field value too large or contains invalid data.',
  },
  LIMIT_FIELD_COUNT: {
    statusCode: 400,
    message: 'Too many fields in the request.',
  },
  LIMIT_PART_COUNT: {
    statusCode: 400,
    message: 'Too many parts in the request.',
  },
});

/** Final catch-all for any unexpected Multer error code not in the table above. */
export const RESUME_UPLOAD_DEFAULT = Object.freeze({
  statusCode: 400,
  message: (error) => `Upload error: ${error?.message || 'Unknown upload failure'}`,
});

/** Generic 500 fallback used when the error is not a Multer / file-filter one. */
export const RESUME_UPLOAD_FALLBACK = Object.freeze({
  statusCode: 500,
  message: (error) => error?.message || 'An unexpected error occurred during upload.',
});

/** Substrings of `error.message` that indicate the file filter rejected an upload. */
export const RESUME_FILE_FILTER_MESSAGE_SUBSTRINGS = Object.freeze([
  'Invalid file type',
  'Only JPEG, PNG, and WEBP images are allowed',
]);

/**
 * Resolve a renderable upload error to { statusCode, error } for the
 * response payload. Mirrors the pre-existing handler behaviour so callers
 * see no behavioural change.
 *
 * @param {Error & { code?: string }} err the thrown upload error
 * @returns {{ statusCode: number, error: string }}
 */
export function resolveResumeUploadError(err) {
  if (
    err &&
    typeof err.code === 'string' &&
    Object.prototype.hasOwnProperty.call(RESUME_UPLOAD_MESSAGES, err.code)
  ) {
    const entry = RESUME_UPLOAD_MESSAGES[err.code];
    return {
      statusCode: entry.statusCode,
      error: typeof entry.message === 'function' ? entry.message(err) : entry.message,
    };
  }
  if (
    err &&
    typeof err.message === 'string' &&
    RESUME_FILE_FILTER_MESSAGE_SUBSTRINGS.some((s) => err.message.includes(s))
  ) {
    return { statusCode: 415, error: err.message };
  }
  const fallback =
    err && typeof err.code === 'string' && err.code.startsWith('LIMIT_')
      ? RESUME_UPLOAD_DEFAULT
      : RESUME_UPLOAD_FALLBACK;
  return {
    statusCode: fallback.statusCode,
    error: typeof fallback.message === 'function' ? fallback.message(err) : fallback.message,
  };
}

export const RESUME_TEXT_LENGTH = Object.freeze({
  max: MAX_RESUME_TEXT_LENGTH,
  tooLongMessage: (current) =>
    `Resume text is too long (${current} characters). Please limit your resume text to ${MAX_RESUME_TEXT_LENGTH} characters.`,
});
