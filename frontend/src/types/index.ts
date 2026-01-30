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

export interface UpdateNoteRequest {
  noteText?: string;
  sleepStudyId?: string;
}

export interface GetNotesResponse {
  notes: Note[];
  nextCursor?: string;
}
