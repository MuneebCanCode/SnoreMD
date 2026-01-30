import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { dynamoDBService } from '../services/dynamoService';
import { validationService } from '../utils/validation';

/**
 * Lambda handler for updating an existing patient note
 * PUT /patients/{patientId}/notes/{noteId}
 */
export const handler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  console.log('Update note request:', JSON.stringify(event, null, 2));

  try {
    // Extract patientId and noteId from path parameters
    const patientId = event.pathParameters?.patientId;
    const noteId = event.pathParameters?.noteId;

    if (!patientId || !noteId) {
      return {
        statusCode: 400,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
        body: JSON.stringify({
          error: {
            code: 'MISSING_PARAMETERS',
            message: 'Patient ID and Note ID are required',
          },
        }),
      };
    }

    // Parse request body
    if (!event.body) {
      return {
        statusCode: 400,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
        body: JSON.stringify({
          error: {
            code: 'MISSING_BODY',
            message: 'Request body is required',
          },
        }),
      };
    }

    const body = JSON.parse(event.body);
    const { noteText, sleepStudyId } = body;

    // Validate at least one field is being updated
    if (noteText === undefined && sleepStudyId === undefined) {
      return {
        statusCode: 400,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
        body: JSON.stringify({
          error: {
            code: 'NO_UPDATES',
            message: 'At least one field must be provided for update',
          },
        }),
      };
    }

    // Validate noteText if provided
    if (noteText !== undefined) {
      const noteTextValidation = validationService.validateNoteText(noteText);
      if (!noteTextValidation.valid) {
        return {
          statusCode: 400,
          headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
          },
          body: JSON.stringify({
            error: {
              code: 'INVALID_NOTE_TEXT',
              message: noteTextValidation.error?.message,
            },
          }),
        };
      }
    }

    // Update note in DynamoDB
    const updates: {
      noteText?: string;
      sleepStudyId?: string;
    } = {};

    if (noteText !== undefined) updates.noteText = noteText;
    if (sleepStudyId !== undefined) updates.sleepStudyId = sleepStudyId;

    const updatedNote = await dynamoDBService.updateNote(patientId, noteId, updates);

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
      body: JSON.stringify(updatedNote),
    };
  } catch (error) {
    console.error('Error updating note:', error);

    return {
      statusCode: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
      body: JSON.stringify({
        error: {
          code: 'INTERNAL_ERROR',
          message: error instanceof Error ? error.message : 'Failed to update note',
        },
      }),
    };
  }
};
