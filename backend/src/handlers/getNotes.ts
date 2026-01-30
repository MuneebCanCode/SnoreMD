import { APIGatewayProxyEventV2, APIGatewayProxyResultV2 } from 'aws-lambda';
import { dynamoDBService } from '../services/dynamoService';
import { validationService } from '../utils/validation';
import { ErrorResponse, GetNotesResponse } from '../types';

/**
 * Lambda handler for retrieving patient notes
 * GET /patients/{patientId}/notes (legacy)
 * GET /notes?patientId=xxx
 * GET /notes?clinicId=xxx
 * GET /notes?clinicianId=xxx
 */
export async function handler(event: APIGatewayProxyEventV2): Promise<APIGatewayProxyResultV2> {
  const corsHeaders = {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type,X-User-Id,X-Clinic-Id',
    'Access-Control-Allow-Methods': 'POST,GET,OPTIONS',
  };

  try {
    // Parse query parameters
    const queryParams = event.queryStringParameters || {};
    
    // Extract search parameters
    const patientId = event.pathParameters?.patientId || queryParams.patientId;
    const clinicId = queryParams.clinicId;
    const clinicianId = queryParams.clinicianId;

    // Validate that at least one search parameter is provided
    if (!patientId && !clinicId && !clinicianId) {
      return {
        statusCode: 400,
        headers: corsHeaders,
        body: JSON.stringify({
          error: {
            code: 'VALIDATION_ERROR',
            message: 'At least one search parameter is required: patientId, clinicId, or clinicianId',
          },
        } as ErrorResponse),
      };
    }

    // Parse limit parameter (default: 20, max: 100)
    let limit = 20;
    if (queryParams.limit) {
      const parsedLimit = parseInt(queryParams.limit, 10);
      if (isNaN(parsedLimit) || parsedLimit < 1) {
        return {
          statusCode: 400,
          headers: corsHeaders,
          body: JSON.stringify({
            error: {
              code: 'VALIDATION_ERROR',
              message: 'Limit must be a positive number',
            },
          } as ErrorResponse),
        };
      }
      // Cap at 100
      limit = Math.min(parsedLimit, 100);
    }

    // Extract cursor for pagination
    const cursor = queryParams.cursor;

    // Query notes from DynamoDB based on search type
    let result: GetNotesResponse;

    if (patientId) {
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
      result = await dynamoDBService.getNotes(patientId, limit, cursor);
    } else if (clinicId) {
      result = await dynamoDBService.getNotesByClinic(clinicId, limit, cursor);
    } else if (clinicianId) {
      result = await dynamoDBService.getNotesByClinician(clinicianId, limit, cursor);
    } else {
      // This should never happen due to earlier validation
      throw new Error('No valid search parameter provided');
    }

    // Return notes with 200 status
    return {
      statusCode: 200,
      headers: corsHeaders,
      body: JSON.stringify(result),
    };
  } catch (error) {
    console.error('Error in getNotes handler:', error);

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
