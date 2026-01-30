import { handler } from './createNote';
import { APIGatewayProxyEventV2 } from 'aws-lambda';
import { dynamoDBService } from '../services/dynamoService';
import { Note } from '../types';

jest.mock('../services/dynamoService');

describe('createNote handler', () => {
  const mockCreateNote = dynamoDBService.createNote as jest.MockedFunction<typeof dynamoDBService.createNote>;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  const createEvent = (
    patientId: string,
    body: any,
    headers: Record<string, string> = {}
  ): APIGatewayProxyEventV2 => ({
    version: '2.0',
    routeKey: 'POST /patients/{patientId}/notes',
    rawPath: `/patients/${patientId}/notes`,
    rawQueryString: '',
    headers,
    requestContext: {} as any,
    pathParameters: { patientId },
    body: JSON.stringify(body),
    isBase64Encoded: false,
  });

  it('should create note with valid input and return 201', async () => {
    const requestBody = {
      noteText: 'Test note',
      sleepStudyId: 'study-123',
      visibility: 'internal',
    };

    const mockNote: Note = {
      patientId: 'patient-001',
      noteId: 'note-123',
      noteText: 'Test note',
      sleepStudyId: 'study-123',
      visibility: 'internal',
      createdBy: 'user-001',
      createdAt: '2024-01-29T12:00:00.000Z',
      clinicId: 'clinic-001',
    };

    mockCreateNote.mockResolvedValueOnce(mockNote);

    const event = createEvent('patient-001', requestBody);
    const result = await handler(event);

    expect(typeof result).toBe('object');
    if (typeof result === 'object') {
      expect(result.statusCode).toBe(201);
      expect(result.headers?.['Access-Control-Allow-Origin']).toBe('*');
      expect(result.headers?.['Content-Type']).toBe('application/json');

      const body = JSON.parse(result.body || '{}');
      expect(body.patientId).toBe('patient-001');
      expect(body.noteText).toBe('Test note');
      expect(body.visibility).toBe('internal');
    }
  });

  it('should use default visibility when not provided', async () => {
    const requestBody = {
      noteText: 'Test note',
    };

    mockCreateNote.mockResolvedValueOnce({
      patientId: 'patient-001',
      noteId: 'note-123',
      noteText: 'Test note',
      visibility: 'internal',
      createdBy: 'user-001',
      createdAt: '2024-01-29T12:00:00.000Z',
      clinicId: 'clinic-001',
    });

    const event = createEvent('patient-001', requestBody);
    const result = await handler(event);

    if (typeof result === 'object') {
      expect(result.statusCode).toBe(201);
      const body = JSON.parse(result.body || '{}');
      expect(body.visibility).toBe('internal');
    }
  });

  it('should extract auth context from headers', async () => {
    const requestBody = {
      noteText: 'Test note',
    };

    mockCreateNote.mockResolvedValueOnce({
      patientId: 'patient-001',
      noteId: 'note-123',
      noteText: 'Test note',
      visibility: 'internal',
      createdBy: 'user-999',
      createdAt: '2024-01-29T12:00:00.000Z',
      clinicId: 'clinic-999',
    });

    const event = createEvent('patient-001', requestBody, {
      'x-user-id': 'user-999',
      'x-clinic-id': 'clinic-999',
    });
    const result = await handler(event);

    if (typeof result === 'object') {
      expect(result.statusCode).toBe(201);
      const body = JSON.parse(result.body || '{}');
      expect(body.createdBy).toBe('user-999');
      expect(body.clinicId).toBe('clinic-999');
    }
  });

  it('should return 400 for missing noteText', async () => {
    const requestBody = {};

    const event = createEvent('patient-001', requestBody);
    const result = await handler(event);

    if (typeof result === 'object') {
      expect(result.statusCode).toBe(400);
      expect(result.headers?.['Access-Control-Allow-Origin']).toBe('*');

      const body = JSON.parse(result.body || '{}');
      expect(body.error.code).toBe('VALIDATION_ERROR');
      expect(body.error.message).toContain('required');
    }
  });

  it('should return 400 for empty noteText', async () => {
    const requestBody = {
      noteText: '',
    };

    const event = createEvent('patient-001', requestBody);
    const result = await handler(event);

    if (typeof result === 'object') {
      expect(result.statusCode).toBe(400);
      const body = JSON.parse(result.body || '{}');
      expect(body.error.code).toBe('VALIDATION_ERROR');
    }
  });

  it('should return 400 for invalid visibility', async () => {
    const requestBody = {
      noteText: 'Test note',
      visibility: 'invalid',
    };

    const event = createEvent('patient-001', requestBody);
    const result = await handler(event);

    if (typeof result === 'object') {
      expect(result.statusCode).toBe(400);
      const body = JSON.parse(result.body || '{}');
      expect(body.error.code).toBe('VALIDATION_ERROR');
    }
  });

  it('should return 400 for missing patientId', async () => {
    const requestBody = {
      noteText: 'Test note',
    };

    const event = createEvent('', requestBody);
    const result = await handler(event);

    if (typeof result === 'object') {
      expect(result.statusCode).toBe(400);
      const body = JSON.parse(result.body || '{}');
      expect(body.error.code).toBe('VALIDATION_ERROR');
    }
  });

  it('should return 400 for invalid JSON', async () => {
    const event: APIGatewayProxyEventV2 = {
      version: '2.0',
      routeKey: 'POST /patients/{patientId}/notes',
      rawPath: '/patients/patient-001/notes',
      rawQueryString: '',
      headers: {},
      requestContext: {} as any,
      pathParameters: { patientId: 'patient-001' },
      body: 'invalid json',
      isBase64Encoded: false,
    };

    const result = await handler(event);

    if (typeof result === 'object') {
      expect(result.statusCode).toBe(400);
      const body = JSON.parse(result.body || '{}');
      expect(body.error.code).toBe('VALIDATION_ERROR');
      expect(body.error.message).toContain('JSON');
    }
  });

  it('should return 500 for DynamoDB errors', async () => {
    const requestBody = {
      noteText: 'Test note',
    };

    mockCreateNote.mockRejectedValueOnce(new Error('DynamoDB error'));

    const event = createEvent('patient-001', requestBody);
    const result = await handler(event);

    if (typeof result === 'object') {
      expect(result.statusCode).toBe(500);
      expect(result.headers?.['Access-Control-Allow-Origin']).toBe('*');

      const body = JSON.parse(result.body || '{}');
      expect(body.error.code).toBe('INTERNAL_ERROR');
    }
  });

  it('should trim noteText whitespace', async () => {
    const requestBody = {
      noteText: '  Test note  ',
    };

    mockCreateNote.mockResolvedValueOnce({
      patientId: 'patient-001',
      noteId: 'note-123',
      noteText: 'Test note',
      visibility: 'internal',
      createdBy: 'user-001',
      createdAt: '2024-01-29T12:00:00.000Z',
      clinicId: 'clinic-001',
    });

    const event = createEvent('patient-001', requestBody);
    const result = await handler(event);

    if (typeof result === 'object') {
      expect(result.statusCode).toBe(201);
      expect(mockCreateNote).toHaveBeenCalledWith(
        expect.objectContaining({
          noteText: 'Test note',
        })
      );
    }
  });
});
