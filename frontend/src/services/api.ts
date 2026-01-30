import { Note, CreateNoteRequest, GetNotesResponse } from '../types';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:3000';

// Default auth headers for development
const DEFAULT_USER_ID = 'user-001';
const DEFAULT_CLINIC_ID = 'clinic-001';

/**
 * API client for backend communication
 */
export class ApiClient {
  /**
   * Create a new patient note
   */
  async createNote(patientId: string, data: CreateNoteRequest): Promise<Note> {
    try {
      const response = await fetch(`${API_BASE_URL}/patients/${patientId}/notes`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': DEFAULT_USER_ID,
          'x-clinic-id': DEFAULT_CLINIC_ID,
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error?.message || 'Failed to create note');
      }

      return await response.json();
    } catch (error) {
      if (error instanceof Error) {
        throw error;
      }
      throw new Error('Network error: Failed to create note');
    }
  }

  /**
   * Update an existing patient note
   */
  async updateNote(
    patientId: string,
    noteId: string,
    data: {
      noteText?: string;
      sleepStudyId?: string;
    }
  ): Promise<Note> {
    try {
      const response = await fetch(`${API_BASE_URL}/patients/${patientId}/notes/${noteId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': DEFAULT_USER_ID,
          'x-clinic-id': DEFAULT_CLINIC_ID,
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error?.message || 'Failed to update note');
      }

      return await response.json();
    } catch (error) {
      if (error instanceof Error) {
        throw error;
      }
      throw new Error('Network error: Failed to update note');
    }
  }

  /**
   * Get notes with flexible search options
   * Can search by patientId, clinicId, or clinicianId
   */
  async getNotes(
    searchParams: {
      patientId?: string;
      clinicId?: string;
      clinicianId?: string;
    },
    limit?: number,
    cursor?: string
  ): Promise<GetNotesResponse> {
    try {
      const params = new URLSearchParams();
      
      // Add search parameters
      if (searchParams.patientId) params.append('patientId', searchParams.patientId);
      if (searchParams.clinicId) params.append('clinicId', searchParams.clinicId);
      if (searchParams.clinicianId) params.append('clinicianId', searchParams.clinicianId);
      
      // Add pagination parameters
      if (limit) params.append('limit', limit.toString());
      if (cursor) params.append('cursor', cursor);

      // Use legacy endpoint if only patientId is provided (backward compatibility)
      let url: string;
      if (searchParams.patientId && !searchParams.clinicId && !searchParams.clinicianId) {
        url = `${API_BASE_URL}/patients/${searchParams.patientId}/notes${
          params.toString() ? `?${params.toString()}` : ''
        }`;
      } else {
        url = `${API_BASE_URL}/patients/${searchParams.patientId || 'search'}/notes${
          params.toString() ? `?${params.toString()}` : ''
        }`;
      }

      console.log('Fetching notes from:', url);
      console.log('Search params:', searchParams);

      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': DEFAULT_USER_ID,
          'x-clinic-id': DEFAULT_CLINIC_ID,
        },
      });

      console.log('Response status:', response.status);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Error response:', errorText);
        let error;
        try {
          error = JSON.parse(errorText);
        } catch {
          throw new Error(`Failed to fetch notes: ${response.status} ${errorText}`);
        }
        throw new Error(error.error?.message || error.message || 'Failed to fetch notes');
      }

      const data = await response.json();
      console.log('Received notes:', data);
      return data;
    } catch (error) {
      console.error('Error in getNotes:', error);
      if (error instanceof Error) {
        throw error;
      }
      throw new Error('Network error: Failed to fetch notes');
    }
  }
}

// Export singleton instance
export const apiClient = new ApiClient();
