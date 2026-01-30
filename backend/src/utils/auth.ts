import { AuthContext } from '../types';

/**
 * Authentication service for extracting user context from headers
 * This is a stub implementation for development
 * In production, this would validate Cognito JWT tokens
 */
export class AuthService {
  /**
   * Extract authentication context from request headers
   * Uses x-user-id and x-clinic-id headers
   * Falls back to default values if headers are missing
   */
  extractAuthContext(headers: Record<string, string | undefined>): AuthContext {
    // Extract userId from x-user-id header
    const userId = headers['x-user-id'] || headers['X-User-Id'] || 'user-001';

    // Extract clinicId from x-clinic-id header
    const clinicId = headers['x-clinic-id'] || headers['X-Clinic-Id'] || 'clinic-001';

    return {
      userId,
      clinicId,
    };
  }
}

// Export singleton instance
export const authService = new AuthService();
