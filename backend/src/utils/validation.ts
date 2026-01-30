import { ValidationResult, CreateNoteRequest } from '../types';

/**
 * Validation service for input data
 * Validates note creation requests and individual fields
 */
export class ValidationService {
  /**
   * Validate complete note creation request
   */
  validateCreateNoteRequest(data: any): ValidationResult {
    // Check if data exists
    if (!data || typeof data !== 'object') {
      return {
        valid: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Request body is required',
        },
      };
    }

    // Validate noteText
    const noteTextResult = this.validateNoteText(data.noteText);
    if (!noteTextResult.valid) {
      return noteTextResult;
    }

    // Validate sleepStudyId if provided
    if (data.sleepStudyId !== undefined && typeof data.sleepStudyId !== 'string') {
      return {
        valid: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Sleep study ID must be a string',
        },
      };
    }

    return { valid: true };
  }

  /**
   * Validate patientId
   * Must be non-empty string
   */
  validatePatientId(patientId: any): ValidationResult {
    if (!patientId || typeof patientId !== 'string' || patientId.trim() === '') {
      return {
        valid: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Patient ID is required and must be a non-empty string',
        },
      };
    }

    return { valid: true };
  }

  /**
   * Validate noteText
   * Must be 1-5000 characters after trimming
   * Trims leading and trailing whitespace
   */
  validateNoteText(noteText: any): ValidationResult {
    // Check if noteText exists
    if (noteText === undefined || noteText === null) {
      return {
        valid: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Note text is required',
        },
      };
    }

    // Check if noteText is a string
    if (typeof noteText !== 'string') {
      return {
        valid: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Note text must be a string',
        },
      };
    }

    // Trim whitespace
    const trimmed = noteText.trim();

    // Check if empty after trimming
    if (trimmed.length === 0) {
      return {
        valid: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Note text cannot be empty',
        },
      };
    }

    // Check length constraints
    if (trimmed.length < 1) {
      return {
        valid: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Note text must be at least 1 character',
        },
      };
    }

    if (trimmed.length > 5000) {
      return {
        valid: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Note text cannot exceed 5000 characters',
        },
      };
    }

    return { valid: true };
  }

  /**
   * Validate visibility field
   * Must be 'internal' or 'shared'
   */
  validateVisibility(visibility: any): ValidationResult {
    if (visibility !== 'internal' && visibility !== 'shared') {
      return {
        valid: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: "Visibility must be either 'internal' or 'shared'",
        },
      };
    }

    return { valid: true };
  }

  /**
   * Trim noteText whitespace
   * Returns trimmed string
   */
  trimNoteText(noteText: string): string {
    return noteText.trim();
  }
}

// Export singleton instance
export const validationService = new ValidationService();
