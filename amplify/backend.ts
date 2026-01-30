import { defineBackend } from '@aws-amplify/backend';
import { auth } from './auth/resource';
import { data } from './data/resource';

/**
 * Amplify Gen 2 Backend Definition
 * Defines authentication and data resources for Snore MD Patient Notes
 */
export const backend = defineBackend({
  auth,
  data,
});
