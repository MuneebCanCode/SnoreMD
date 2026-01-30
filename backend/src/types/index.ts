export interface Note {
  patientId: string;
  noteId: string;
  noteText: string;
  sleepStudyId?: string;
  createdBy: string;
  createdAt: string;
  clinicId: string;
}

export interface CreateNoteRequest {
  noteText: string;
  sleepStudyId?: string;
}

export interface GetNotesResponse {
  notes: Note[];
  nextCursor?: string;
}

export interface ValidationResult {
  valid: boolean;
  error?: {
    code: string;
    message: string;
  };
}

export interface AuthContext {
  userId: string;
  clinicId: string;
}

export interface ErrorResponse {
  error: {
    code: string;
    message: string;
  };
}
