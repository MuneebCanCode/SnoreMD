import { ValidationService } from './validation';

describe('ValidationService', () => {
  let service: ValidationService;

  beforeEach(() => {
    service = new ValidationService();
  });

  describe('validateNoteText', () => {
    it('should accept valid noteText', () => {
      const result = service.validateNoteText('Valid note text');
      expect(result.valid).toBe(true);
      expect(result.error).toBeUndefined();
    });

    it('should reject empty noteText', () => {
      const result = service.validateNoteText('');
      expect(result.valid).toBe(false);
      expect(result.error?.code).toBe('VALIDATION_ERROR');
      expect(result.error?.message).toContain('empty');
    });

    it('should reject whitespace-only noteText', () => {
      const result = service.validateNoteText('   ');
      expect(result.valid).toBe(false);
      expect(result.error?.code).toBe('VALIDATION_ERROR');
      expect(result.error?.message).toContain('empty');
    });

    it('should reject missing noteText', () => {
      const result = service.validateNoteText(undefined);
      expect(result.valid).toBe(false);
      expect(result.error?.code).toBe('VALIDATION_ERROR');
      expect(result.error?.message).toContain('required');
    });

    it('should reject null noteText', () => {
      const result = service.validateNoteText(null);
      expect(result.valid).toBe(false);
      expect(result.error?.code).toBe('VALIDATION_ERROR');
      expect(result.error?.message).toContain('required');
    });

    it('should reject noteText exceeding 5000 characters', () => {
      const longText = 'a'.repeat(5001);
      const result = service.validateNoteText(longText);
      expect(result.valid).toBe(false);
      expect(result.error?.code).toBe('VALIDATION_ERROR');
      expect(result.error?.message).toContain('5000');
    });

    it('should accept noteText with exactly 5000 characters', () => {
      const maxText = 'a'.repeat(5000);
      const result = service.validateNoteText(maxText);
      expect(result.valid).toBe(true);
    });

    it('should accept noteText with 1 character', () => {
      const result = service.validateNoteText('a');
      expect(result.valid).toBe(true);
    });

    it('should reject non-string noteText', () => {
      const result = service.validateNoteText(123);
      expect(result.valid).toBe(false);
      expect(result.error?.code).toBe('VALIDATION_ERROR');
      expect(result.error?.message).toContain('string');
    });
  });

  describe('validatePatientId', () => {
    it('should accept valid patientId', () => {
      const result = service.validatePatientId('patient-001');
      expect(result.valid).toBe(true);
      expect(result.error).toBeUndefined();
    });

    it('should reject empty patientId', () => {
      const result = service.validatePatientId('');
      expect(result.valid).toBe(false);
      expect(result.error?.code).toBe('VALIDATION_ERROR');
      expect(result.error?.message).toContain('required');
    });

    it('should reject whitespace-only patientId', () => {
      const result = service.validatePatientId('   ');
      expect(result.valid).toBe(false);
      expect(result.error?.code).toBe('VALIDATION_ERROR');
    });

    it('should reject missing patientId', () => {
      const result = service.validatePatientId(undefined);
      expect(result.valid).toBe(false);
      expect(result.error?.code).toBe('VALIDATION_ERROR');
    });

    it('should reject non-string patientId', () => {
      const result = service.validatePatientId(123);
      expect(result.valid).toBe(false);
      expect(result.error?.code).toBe('VALIDATION_ERROR');
    });
  });

  describe('validateVisibility', () => {
    it('should accept "internal" visibility', () => {
      const result = service.validateVisibility('internal');
      expect(result.valid).toBe(true);
      expect(result.error).toBeUndefined();
    });

    it('should accept "shared" visibility', () => {
      const result = service.validateVisibility('shared');
      expect(result.valid).toBe(true);
      expect(result.error).toBeUndefined();
    });

    it('should reject invalid visibility', () => {
      const result = service.validateVisibility('public');
      expect(result.valid).toBe(false);
      expect(result.error?.code).toBe('VALIDATION_ERROR');
      expect(result.error?.message).toContain('internal');
      expect(result.error?.message).toContain('shared');
    });

    it('should reject empty visibility', () => {
      const result = service.validateVisibility('');
      expect(result.valid).toBe(false);
      expect(result.error?.code).toBe('VALIDATION_ERROR');
    });
  });

  describe('validateCreateNoteRequest', () => {
    it('should accept valid request', () => {
      const request = {
        noteText: 'Valid note text',
        sleepStudyId: 'study-123',
        visibility: 'internal',
      };
      const result = service.validateCreateNoteRequest(request);
      expect(result.valid).toBe(true);
      expect(result.error).toBeUndefined();
    });

    it('should accept request without optional fields', () => {
      const request = {
        noteText: 'Valid note text',
      };
      const result = service.validateCreateNoteRequest(request);
      expect(result.valid).toBe(true);
    });

    it('should reject request with invalid noteText', () => {
      const request = {
        noteText: '',
      };
      const result = service.validateCreateNoteRequest(request);
      expect(result.valid).toBe(false);
      expect(result.error?.code).toBe('VALIDATION_ERROR');
    });

    it('should reject request with invalid visibility', () => {
      const request = {
        noteText: 'Valid note text',
        visibility: 'invalid',
      };
      const result = service.validateCreateNoteRequest(request);
      expect(result.valid).toBe(false);
      expect(result.error?.code).toBe('VALIDATION_ERROR');
    });

    it('should reject request with non-string sleepStudyId', () => {
      const request = {
        noteText: 'Valid note text',
        sleepStudyId: 123,
      };
      const result = service.validateCreateNoteRequest(request);
      expect(result.valid).toBe(false);
      expect(result.error?.code).toBe('VALIDATION_ERROR');
    });

    it('should reject null request', () => {
      const result = service.validateCreateNoteRequest(null);
      expect(result.valid).toBe(false);
      expect(result.error?.code).toBe('VALIDATION_ERROR');
    });

    it('should reject undefined request', () => {
      const result = service.validateCreateNoteRequest(undefined);
      expect(result.valid).toBe(false);
      expect(result.error?.code).toBe('VALIDATION_ERROR');
    });
  });

  describe('trimNoteText', () => {
    it('should trim leading whitespace', () => {
      const result = service.trimNoteText('   text');
      expect(result).toBe('text');
    });

    it('should trim trailing whitespace', () => {
      const result = service.trimNoteText('text   ');
      expect(result).toBe('text');
    });

    it('should trim both leading and trailing whitespace', () => {
      const result = service.trimNoteText('   text   ');
      expect(result).toBe('text');
    });

    it('should preserve internal whitespace', () => {
      const result = service.trimNoteText('  text with   spaces  ');
      expect(result).toBe('text with   spaces');
    });
  });
});
