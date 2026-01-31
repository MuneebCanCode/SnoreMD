import { APIGatewayProxyEventV2, APIGatewayProxyResultV2 } from 'aws-lambda';
import { v4 as uuidv4 } from 'uuid';
import { dynamoDBService } from '../services/dynamoService';
import { validationService } from '../utils/validation';
import { authService } from '../utils/auth';
import { Note, CreateNoteRequest, ErrorResponse } from '../types';

/**
 * Lambda handler for creating patient notes
 * POST /patients/{patientId}/notes
 */
export async function handler(event: APIGatewayProxyEventV2): Promise<APIGatewayProxyResultV2> {
  const corsHeaders = {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type,X-User-Id,X-Clinic-Id',
    'Access-Control-Allow-Methods': 'POST,GET,OPTIONS',
  };

  try {
    // Extract patientId from path parameters
    const patientId = event.pathParameters?.patientId;

    // Validate patientId
    const patientIdValidation = validationService.validatePatientId(patientId);
    if (!patientIdValidation.valid) {
      return {
        statusCode: 400,
        headers: corsHeaders,
        body: JSON.stringify({
          error: patientIdValidation.error,
        } as ErrorResponse),
      };
    }

    // Parse request body
    let requestData: CreateNoteRequest;
    try {
      requestData = JSON.parse(event.body || '{}');
    } catch (error) {
      return {
        statusCode: 400,
        headers: corsHeaders,
        body: JSON.stringify({
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid JSON in request body',
          },
        } as ErrorResponse),
      };
    }

    // Validate request data
    const validation = validationService.validateCreateNoteRequest(requestData);
    if (!validation.valid) {
      return {
        statusCode: 400,
        headers: corsHeaders,
        body: JSON.stringify({
          error: validation.error,
        } as ErrorResponse),
      };
    }

    // Extract authentication context from headers
    const authContext = authService.extractAuthContext(event.headers || {});

    // Trim noteText
    const trimmedNoteText = validationService.trimNoteText(requestData.noteText);

    // Auto-generate Sleep Study ID in format: {PatientID}-S{SequenceNumber}
    // Get the next sequence number for this patient using atomic counter
    let sequenceNumber = 1;
    try {
      sequenceNumber = await dynamoDBService.getNextSleepStudySequence(patientId!);
      console.log(`Next sequence number for patient ${patientId}: ${sequenceNumber}`);
    } catch (sequenceError) {
      console.error('Error getting next sequence:', sequenceError);
      // If we can't get the sequence, default to 1 and continue
      sequenceNumber = 1;
    }
    
    const sleepStudyId = `${patientId}-S${sequenceNumber.toString().padStart(3, '0')}`; // S001, S002, etc.
    console.log(`Generated Sleep Study ID: ${sleepStudyId}`);

    // Create note object
    const note: Note = {
      patientId: patientId!,
      noteId: uuidv4(),
      noteText: trimmedNoteText,
      sleepStudyId: sleepStudyId,
      createdBy: authContext.userId,
      createdAt: new Date().toISOString(),
      clinicId: authContext.clinicId,
    };

    // Store note in DynamoDB
    const createdNote = await dynamoDBService.createNote(note);

    // Return created note with 201 status
    return {
      statusCode: 201,
      headers: corsHeaders,
      body: JSON.stringify(createdNote),
    };
  } catch (error) {
    console.error('Error in createNote handler:', error);

    return {
      statusCode: 500,
      headers: corsHeaders,
      body: JSON.stringify({
        error: {
          code: 'INTERNAL_ERROR',
          message: 'An unexpected error occurred',
        },
      } as ErrorResponse),
    };
  }
}
