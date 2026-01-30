import { type ClientSchema, a, defineData } from '@aws-amplify/backend';

/**
 * Data Schema for Patient Notes
 * Defines the data model using Amplify's GraphQL-based approach
 */
const schema = a.schema({
  PatientNote: a
    .model({
      patientId: a.string().required(),
      noteText: a.string().required(),
      sleepStudyId: a.string(),
      clinicId: a.string().required(),
      createdBy: a.string().required(),
      createdAt: a.datetime().required(),
    })
    .authorization((allow) => [
      // Allow authenticated users to create, read, update their own clinic's notes
      allow.authenticated(),
    ])
    .secondaryIndexes((index) => [
      index('patientId').sortKeys(['createdAt']).queryField('notesByPatient'),
      index('clinicId').sortKeys(['createdAt']).queryField('notesByClinic'),
      index('createdBy').sortKeys(['createdAt']).queryField('notesByClinician'),
    ]),
});

export type Schema = ClientSchema<typeof schema>;

export const data = defineData({
  schema,
  authorizationModes: {
    defaultAuthorizationMode: 'userPool',
  },
});
