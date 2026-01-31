import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, PutCommand, QueryCommand, UpdateCommand } from '@aws-sdk/lib-dynamodb';
import { v4 as uuidv4 } from 'uuid';
import { Note, GetNotesResponse } from '../types';

const client = new DynamoDBClient({});
const docClient = DynamoDBDocumentClient.from(client);

const TABLE_NAME = process.env.TABLE_NAME || 'PatientFollowupNotes';

export class DynamoDBService {
  /**
   * Create a new note in DynamoDB
   * Generates a unique noteId using UUID v4
   * Stores note with patientId as PK and noteId as SK
   */
  async createNote(note: Note): Promise<Note> {
    try {
      // Ensure noteId is generated if not provided
      const noteWithId = {
        ...note,
        noteId: note.noteId || uuidv4(),
      };

      const command = new PutCommand({
        TableName: TABLE_NAME,
        Item: noteWithId,
      });

      await docClient.send(command);
      return noteWithId;
    } catch (error) {
      console.error('Error creating note:', error);
      throw new Error('Failed to create note in DynamoDB');
    }
  }

  /**
   * Get notes for a patient with pagination
   * Uses CreatedAtIndex GSI to sort by createdAt in descending order
   * Returns notes with optional nextCursor for pagination
   */
  async getNotes(
    patientId: string,
    limit: number = 20,
    cursor?: string
  ): Promise<GetNotesResponse> {
    try {
      const command = new QueryCommand({
        TableName: TABLE_NAME,
        IndexName: 'CreatedAtIndex',
        KeyConditionExpression: 'patientId = :patientId',
        ExpressionAttributeValues: {
          ':patientId': patientId,
        },
        ScanIndexForward: false, // Sort descending (newest first)
        Limit: limit,
        ExclusiveStartKey: cursor ? JSON.parse(Buffer.from(cursor, 'base64').toString()) : undefined,
      });

      const result = await docClient.send(command);

      const notes = (result.Items || []) as Note[];
      const nextCursor = result.LastEvaluatedKey
        ? Buffer.from(JSON.stringify(result.LastEvaluatedKey)).toString('base64')
        : undefined;

      return {
        notes,
        nextCursor,
      };
    } catch (error) {
      console.error('Error getting notes:', error);
      throw new Error('Failed to retrieve notes from DynamoDB');
    }
  }

  /**
   * Update an existing note in DynamoDB
   * Updates noteText and sleepStudyId fields
   * Returns the updated note
   */
  async updateNote(
    patientId: string,
    noteId: string,
    updates: {
      noteText?: string;
      sleepStudyId?: string;
    }
  ): Promise<Note> {
    try {
      // Build update expression dynamically
      const updateExpressions: string[] = [];
      const expressionAttributeNames: Record<string, string> = {};
      const expressionAttributeValues: Record<string, any> = {};

      if (updates.noteText !== undefined) {
        updateExpressions.push('#noteText = :noteText');
        expressionAttributeNames['#noteText'] = 'noteText';
        expressionAttributeValues[':noteText'] = updates.noteText;
      }

      if (updates.sleepStudyId !== undefined) {
        updateExpressions.push('#sleepStudyId = :sleepStudyId');
        expressionAttributeNames['#sleepStudyId'] = 'sleepStudyId';
        expressionAttributeValues[':sleepStudyId'] = updates.sleepStudyId;
      }

      if (updateExpressions.length === 0) {
        throw new Error('No fields to update');
      }

      const command = new UpdateCommand({
        TableName: TABLE_NAME,
        Key: {
          patientId,
          noteId,
        },
        UpdateExpression: `SET ${updateExpressions.join(', ')}`,
        ExpressionAttributeNames: expressionAttributeNames,
        ExpressionAttributeValues: expressionAttributeValues,
        ReturnValues: 'ALL_NEW',
      });

      const result = await docClient.send(command);
      
      if (!result.Attributes) {
        throw new Error('Note not found');
      }

      return result.Attributes as Note;
    } catch (error) {
      console.error('Error updating note:', error);
      throw new Error('Failed to update note in DynamoDB');
    }
  }

  /**
   * Get notes for a clinic with pagination
   * Uses ClinicIndex GSI to sort by createdAt in descending order
   * Returns notes with optional nextCursor for pagination
   */
  async getNotesByClinic(
    clinicId: string,
    limit: number = 20,
    cursor?: string
  ): Promise<GetNotesResponse> {
    try {
      const command = new QueryCommand({
        TableName: TABLE_NAME,
        IndexName: 'ClinicIndex',
        KeyConditionExpression: 'clinicId = :clinicId',
        ExpressionAttributeValues: {
          ':clinicId': clinicId,
        },
        ScanIndexForward: false, // Sort descending (newest first)
        Limit: limit,
        ExclusiveStartKey: cursor ? JSON.parse(Buffer.from(cursor, 'base64').toString()) : undefined,
      });

      const result = await docClient.send(command);

      const notes = (result.Items || []) as Note[];
      const nextCursor = result.LastEvaluatedKey
        ? Buffer.from(JSON.stringify(result.LastEvaluatedKey)).toString('base64')
        : undefined;

      return {
        notes,
        nextCursor,
      };
    } catch (error) {
      console.error('Error getting notes by clinic:', error);
      throw new Error('Failed to retrieve notes by clinic from DynamoDB');
    }
  }

  /**
   * Get notes created by a clinician with pagination
   * Uses ClinicianIndex GSI to sort by createdAt in descending order
   * Returns notes with optional nextCursor for pagination
   */
  async getNotesByClinician(
    clinicianId: string,
    limit: number = 20,
    cursor?: string
  ): Promise<GetNotesResponse> {
    try {
      const command = new QueryCommand({
        TableName: TABLE_NAME,
        IndexName: 'ClinicianIndex',
        KeyConditionExpression: 'createdBy = :createdBy',
        ExpressionAttributeValues: {
          ':createdBy': clinicianId,
        },
        ScanIndexForward: false, // Sort descending (newest first)
        Limit: limit,
        ExclusiveStartKey: cursor ? JSON.parse(Buffer.from(cursor, 'base64').toString()) : undefined,
      });

      const result = await docClient.send(command);

      const notes = (result.Items || []) as Note[];
      const nextCursor = result.LastEvaluatedKey
        ? Buffer.from(JSON.stringify(result.LastEvaluatedKey)).toString('base64')
        : undefined;

      return {
        notes,
        nextCursor,
      };
    } catch (error) {
      console.error('Error getting notes by clinician:', error);
      throw new Error('Failed to retrieve notes by clinician from DynamoDB');
    }
  }
  /**
   * Get the highest Sleep Study ID sequence number for a patient
   * Used to generate sequential Sleep Study IDs
   * Returns the next sequence number to use
   */
  async getNextSleepStudySequence(patientId: string): Promise<number> {
    try {
      // Query all notes for this patient to find the highest sequence number
      const command = new QueryCommand({
        TableName: TABLE_NAME,
        IndexName: 'CreatedAtIndex',
        KeyConditionExpression: 'patientId = :patientId',
        ExpressionAttributeValues: {
          ':patientId': patientId,
        },
        ProjectionExpression: 'sleepStudyId',
      });

      const result = await docClient.send(command);
      const notes = result.Items || [];
      
      console.log(`Found ${notes.length} existing notes for patient ${patientId}`);

      // Extract sequence numbers from existing Sleep Study IDs
      let maxSequence = 0;
      for (const note of notes) {
        if (note.sleepStudyId) {
          // Extract sequence number from format: P0005-S001
          const match = note.sleepStudyId.match(/-S(\d+)$/);
          if (match) {
            const sequence = parseInt(match[1], 10);
            if (sequence > maxSequence) {
              maxSequence = sequence;
            }
          }
        }
      }

      console.log(`Highest existing sequence for patient ${patientId}: ${maxSequence}`);
      return maxSequence + 1;
    } catch (error) {
      console.error('Error getting next sleep study sequence:', error);
      throw new Error('Failed to get next sleep study sequence from DynamoDB');
    }
  }
}

// Export singleton instance
export const dynamoDBService = new DynamoDBService();
