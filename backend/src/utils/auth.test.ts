import { AuthService } from './auth';

describe('AuthService', () => {
  let service: AuthService;

  beforeEach(() => {
    service = new AuthService();
  });

  describe('extractAuthContext', () => {
    it('should extract userId and clinicId from headers', () => {
      const headers = {
        'x-user-id': 'user-123',
        'x-clinic-id': 'clinic-456',
      };

      const result = service.extractAuthContext(headers);

      expect(result.userId).toBe('user-123');
      expect(result.clinicId).toBe('clinic-456');
    });

    it('should handle uppercase header names', () => {
      const headers = {
        'X-User-Id': 'user-123',
        'X-Clinic-Id': 'clinic-456',
      };

      const result = service.extractAuthContext(headers);

      expect(result.userId).toBe('user-123');
      expect(result.clinicId).toBe('clinic-456');
    });

    it('should use default userId when header is missing', () => {
      const headers = {
        'x-clinic-id': 'clinic-456',
      };

      const result = service.extractAuthContext(headers);

      expect(result.userId).toBe('user-001');
      expect(result.clinicId).toBe('clinic-456');
    });

    it('should use default clinicId when header is missing', () => {
      const headers = {
        'x-user-id': 'user-123',
      };

      const result = service.extractAuthContext(headers);

      expect(result.userId).toBe('user-123');
      expect(result.clinicId).toBe('clinic-001');
    });

    it('should use default values when both headers are missing', () => {
      const headers = {};

      const result = service.extractAuthContext(headers);

      expect(result.userId).toBe('user-001');
      expect(result.clinicId).toBe('clinic-001');
    });

    it('should handle empty header values', () => {
      const headers = {
        'x-user-id': '',
        'x-clinic-id': '',
      };

      const result = service.extractAuthContext(headers);

      expect(result.userId).toBe('user-001');
      expect(result.clinicId).toBe('clinic-001');
    });

    it('should handle undefined header values', () => {
      const headers = {
        'x-user-id': undefined,
        'x-clinic-id': undefined,
      };

      const result = service.extractAuthContext(headers);

      expect(result.userId).toBe('user-001');
      expect(result.clinicId).toBe('clinic-001');
    });
  });
});
