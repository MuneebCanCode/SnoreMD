import { defineAuth } from '@aws-amplify/backend';

/**
 * Authentication Configuration
 * Uses Amazon Cognito for user authentication
 * Allows email-based sign-in with self-service sign-up
 */
export const auth = defineAuth({
  loginWith: {
    email: true,
  },
  userAttributes: {
    // Custom attributes for clinic and user roles
    'custom:clinicId': {
      dataType: 'String',
      mutable: true,
    },
    'custom:role': {
      dataType: 'String',
      mutable: true,
    },
  },
});
