import { DynamoDBDocumentClient, PutCommand, QueryCommand } from '@aws-sdk/lib-dynamodb';
import { Note } from '../types';

// Mock AWS SDK
jest.mock('@aws-sdk/lib-dynamodb');
jest.mock('@aws-sdk/client-dynamodb');

// Import after mocking
const { DynamoDBService } = require('./dynamoService');

describe('DynamoDBService', () => {
  let service: any;
  let mockSend: jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();
    mockSend = jest.fn();
    (DynamoDBDocumentClient.from as jest.Mock).mockReturnValue({
      send: mockSend,
    });
    service = new DynamoDBService();
  });

  describe('createNote', () => {
    it('should create a note with valid inputs', async () => {
      const note: Note = {
        patientId: 'patient-001',
        noteId: 'note-123',
        noteText: 'Test note',
        visibility: 'internal',
        createdBy: 'user-001',
        createdAt: '2024-01-29T12:00:00.000Z',
        clinicId: 'clinic-001',
      };

      mockSend.mockResolvedValueOnce({});

      const result = await service.createNote(note);

      expect(result).toEqual(note);
      expect(mockSend).toHaveBeenCalledTimes(1);
      expect(mockSend).toHaveBeenCalledWith(expect.any(PutCommand));
    });

    it('should generate noteId if not provided', async () => {
      const note: Note = {
        patientId: 'patient-001',
        noteId: '',
        noteText: 'Test note',
        visibility: 'internal',
        createdBy: 'user-001',
        createdAt: '2024-01-29T12:00:00.000Z',
        clinicId: 'clinic-001',
      };

      mockSend.mockResolvedValueOnce({});

      const result = await service.createNote(note);

      expect(result.noteId).toBeTruthy();
      expect(result.noteId).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i);
    });

    it('should handle DynamoDB errors gracefully', async () => {
      const note: Note = {
        patientId: 'patient-001',
        noteId: 'note-123',
        noteText: 'Test note',
        visibility: 'internal',
        createdBy: 'user-001',
        createdAt: '2024-01-29T12:00:00.000Z',
        clinicId: 'clinic-001',
      };

      mockSend.mockRejectedValueOnce(new Error('DynamoDB error'));

      await expect(service.createNote(note)).rejects.toThrow('Failed to create note in DynamoDB');
    });
  });

  describe('getNotes', () => {
    it('should retrieve notes with sorting', async () => {
      const mockNotes: Note[] = [
        {
          patientId: 'patient-001',
          noteId: 'note-2',
          noteText: 'Newer note',
          visibility: 'internal',
          createdBy: 'user-001',
          createdAt: '2024-01-29T12:00:00.000Z',
          clinicId: 'clinic-001',
        },
        {
          patientId: 'patient-001',
          noteId: 'note-1',
          noteText: 'Older note',
          visibility: 'internal',
          createdBy: 'user-001',
          createdAt: '2024-01-28T12:00:00.000Z',
          clinicId: 'clinic-001',
        },
      ];

      mockSend.mockResolvedValueOnce({
        Items: mockNotes,
        LastEvaluatedKey: undefined,
      });

      const result = await service.getNotes('patient-001', 20);

      expect(result.notes).toEqual(mockNotes);
      expect(result.nextCursor).toBeUndefined();
      expect(mockSend).toHaveBeenCalledTimes(1);
      expect(mockSend).toHaveBeenCalledWith(
        expect.objectContaining({
          input: expect.objectContaining({
            IndexName: 'CreatedAtIndex',
            ScanIndexForward: false,
          }),
        })
      );
    });

    it('should handle pagination with limit and cursor', async () => {
      const mockNotes: Note[] = [
        {
          patientId: 'patient-001',
          noteId: 'note-1',
          noteText: 'Test note',
          visibility: 'internal',
          createdBy: 'user-001',
          createdAt: '2024-01-29T12:00:00.000Z',
          clinicId: 'clinic-001',
        },
      ];

      const lastEvaluatedKey = { patientId: 'patient-001', noteId: 'note-1', createdAt: '2024-01-29T12:00:00.000Z' };

      mockSend.mockResolvedValueOnce({
        Items: mockNotes,
        LastEvaluatedKey: lastEvaluatedKey,
      });

      const result = await service.getNotes('patient-001', 1);

      expect(result.notes).toEqual(mockNotes);
      expect(result.nextCursor).toBeTruthy();
      expect(result.nextCursor).toBe(Buffer.from(JSON.stringify(lastEvaluatedKey)).toString('base64'));
    });

    it('should return empty array when no notes exist', async () => {
      mockSend.mockResolvedValueOnce({
        Items: [],
        LastEvaluatedKey: undefined,
      });

      const result = await service.getNotes('patient-999', 20);

      expect(result.notes).toEqual([]);
      expect(result.nextCursor).toBeUndefined();
    });

    it('should handle DynamoDB errors gracefully', async () => {
      mockSend.mockRejectedValueOnce(new Error('DynamoDB error'));

      await expect(service.getNotes('patient-001', 20)).rejects.toThrow('Failed to retrieve notes from DynamoDB');
    });

    it('should use default limit of 20', async () => {
      mockSend.mockResolvedValueOnce({
        Items: [],
        LastEvaluatedKey: undefined,
      });

      await service.getNotes('patient-001');

      expect(mockSend).toHaveBeenCalledWith(
        expect.objectContaining({
          input: expect.objectContaining({
            Limit: 20,
          }),
        })
      );
    });
  });
});
