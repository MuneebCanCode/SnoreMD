import { handler } from './getNotes';
import { APIGatewayProxyEventV2 } from 'aws-lambda';
import { dynamoDBService } from '../services/dynamoService';
import { Note } from '../types';

jest.mock('../services/dynamoService');

describe('getNotes handler', () => {
  const mockGetNotes = dynamoDBService.getNotes as jest.MockedFunction<typeof dynamoDBService.getNotes>;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  const createEvent = (
    patientId: string,
    queryParams: Record<string, string> = {}
  ): APIGatewayProxyEventV2 => ({
    version: '2.0',
    routeKey: 'GET /patients/{patientId}/notes',
    rawPath: `/patients/${patientId}/notes`,
    rawQueryString: '',
    headers: {},
    requestContext: {} as any,
    pathParameters: { patientId },
    queryStringParameters: queryParams,
    isBase64Encoded: false,
  });

  it('should return notes with 200 status', async () => {
    const mockNotes: Note[] = [
      {
        patientId: 'patient-001',
        noteId: 'note-1',
        noteText: 'Test note 1',
        visibility: 'internal',
        createdBy: 'user-001',
        createdAt: '2024-01-29T12:00:00.000Z',
        clinicId: 'clinic-001',
      },
      {
        patientId: 'patient-001',
        noteId: 'note-2',
        noteText: 'Test note 2',
        visibility: 'shared',
        createdBy: 'user-001',
        createdAt: '2024-01-28T12:00:00.000Z',
        clinicId: 'clinic-001',
      },
    ];

    mockGetNotes.mockResolvedValueOnce({
      notes: mockNotes,
      nextCursor: undefined,
    });

    const event = createEvent('patient-001');
    const result = await handler(event);

    if (typeof result === 'object') {
      expect(result.statusCode).toBe(200);
      expect(result.headers?.['Access-Control-Allow-Origin']).toBe('*');
      expect(result.headers?.['Content-Type']).toBe('application/json');

      const body = JSON.parse(result.body || '{}');
      expect(body.notes).toHaveLength(2);
      expect(body.notes[0].noteId).toBe('note-1');
      expect(body.nextCursor).toBeUndefined();
    }
  });

  it('should use default limit of 20', async () => {
    mockGetNotes.mockResolvedValueOnce({
      notes: [],
      nextCursor: undefined,
    });

    const event = createEvent('patient-001');
    await handler(event);

    expect(mockGetNotes).toHaveBeenCalledWith('patient-001', 20, undefined);
  });

  it('should respect custom limit parameter', async () => {
    mockGetNotes.mockResolvedValueOnce({
      notes: [],
      nextCursor: undefined,
    });

    const event = createEvent('patient-001', { limit: '10' });
    await handler(event);

    expect(mockGetNotes).toHaveBeenCalledWith('patient-001', 10, undefined);
  });

  it('should cap limit at 100', async () => {
    mockGetNotes.mockResolvedValueOnce({
      notes: [],
      nextCursor: undefined,
    });

    const event = createEvent('patient-001', { limit: '200' });
    await handler(event);

    expect(mockGetNotes).toHaveBeenCalledWith('patient-001', 100, undefined);
  });

  it('should handle pagination cursor', async () => {
    const cursor = 'test-cursor';

    mockGetNotes.mockResolvedValueOnce({
      notes: [],
      nextCursor: undefined,
    });

    const event = createEvent('patient-001', { cursor });
    await handler(event);

    expect(mockGetNotes).toHaveBeenCalledWith('patient-001', 20, cursor);
  });

  it('should return nextCursor when more results available', async () => {
    const nextCursor = 'next-page-cursor';

    mockGetNotes.mockResolvedValueOnce({
      notes: [],
      nextCursor,
    });

    const event = createEvent('patient-001');
    const result = await handler(event);

    if (typeof result === 'object') {
      expect(result.statusCode).toBe(200);
      const body = JSON.parse(result.body || '{}');
      expect(body.nextCursor).toBe(nextCursor);
    }
  });

  it('should return empty array when no notes exist', async () => {
    mockGetNotes.mockResolvedValueOnce({
      notes: [],
      nextCursor: undefined,
    });

    const event = createEvent('patient-999');
    const result = await handler(event);

    if (typeof result === 'object') {
      expect(result.statusCode).toBe(200);
      const body = JSON.parse(result.body || '{}');
      expect(body.notes).toEqual([]);
      expect(body.nextCursor).toBeUndefined();
    }
  });

  it('should return 400 for missing patientId', async () => {
    const event = createEvent('');
    const result = await handler(event);

    if (typeof result === 'object') {
      expect(result.statusCode).toBe(400);
      const body = JSON.parse(result.body || '{}');
      expect(body.error.code).toBe('VALIDATION_ERROR');
    }
  });

  it('should return 400 for invalid limit', async () => {
    const event = createEvent('patient-001', { limit: 'invalid' });
    const result = await handler(event);

    if (typeof result === 'object') {
      expect(result.statusCode).toBe(400);
      const body = JSON.parse(result.body || '{}');
      expect(body.error.code).toBe('VALIDATION_ERROR');
      expect(body.error.message).toContain('positive number');
    }
  });

  it('should return 400 for negative limit', async () => {
    const event = createEvent('patient-001', { limit: '-5' });
    const result = await handler(event);

    if (typeof result === 'object') {
      expect(result.statusCode).toBe(400);
      const body = JSON.parse(result.body || '{}');
      expect(body.error.code).toBe('VALIDATION_ERROR');
    }
  });

  it('should return 500 for DynamoDB errors', async () => {
    mockGetNotes.mockRejectedValueOnce(new Error('DynamoDB error'));

    const event = createEvent('patient-001');
    const result = await handler(event);

    if (typeof result === 'object') {
      expect(result.statusCode).toBe(500);
      expect(result.headers?.['Access-Control-Allow-Origin']).toBe('*');

      const body = JSON.parse(result.body || '{}');
      expect(body.error.code).toBe('INTERNAL_ERROR');
    }
  });

  it('should include CORS headers in all responses', async () => {
    mockGetNotes.mockResolvedValueOnce({
      notes: [],
      nextCursor: undefined,
    });

    const event = createEvent('patient-001');
    const result = await handler(event);

    if (typeof result === 'object') {
      expect(result.headers?.['Access-Control-Allow-Origin']).toBe('*');
      expect(result.headers?.['Access-Control-Allow-Headers']).toContain('Content-Type');
      expect(result.headers?.['Access-Control-Allow-Methods']).toContain('GET');
    }
  });
});
