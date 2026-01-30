import React, { useState } from 'react';
import { CreateNoteRequest } from '../types';

interface NoteFormProps {
  patientId: string;
  onSubmit: (data: CreateNoteRequest) => Promise<void>;
  loading: boolean;
}

export const NoteForm: React.FC<NoteFormProps> = ({ patientId, onSubmit, loading }) => {
  const [noteText, setNoteText] = useState<string>('');
  const [validationError, setValidationError] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const validateForm = (): boolean => {
    setValidationError(null);

    const trimmed = noteText.trim();

    if (trimmed.length === 0) {
      setValidationError('Note text is required');
      return false;
    }

    if (trimmed.length > 5000) {
      setValidationError('Note text cannot exceed 5000 characters');
      return false;
    }

    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setSubmitError(null);

    const data: CreateNoteRequest = {
      noteText: noteText.trim(),
    };

    try {
      await onSubmit(data);
      // Clear form on success
      setNoteText('');
      setValidationError(null);
    } catch (error) {
      setSubmitError(error instanceof Error ? error.message : 'Failed to create note');
    }
  };

  return (
    <form className="note-form" onSubmit={handleSubmit}>
      <div className="form-group">
        <label htmlFor="noteText">
          Note Text <span className="required">*</span>
        </label>
        <textarea
          id="noteText"
          value={noteText}
          onChange={(e) => setNoteText(e.target.value)}
          placeholder="Enter follow-up note..."
          rows={6}
          disabled={loading}
          className={validationError ? 'error' : ''}
        />
        <div className="char-count">
          {noteText.trim().length} / 5000 characters
        </div>
      </div>

      <div className="info-message" style={{ fontSize: '0.9rem', marginBottom: '1rem' }}>
        Sleep Study ID will be automatically generated (e.g., {patientId}-S001)
      </div>

      {validationError && <div className="error-message">{validationError}</div>}
      {submitError && <div className="error-message">{submitError}</div>}

      <button type="submit" disabled={loading} className="submit-button">
        {loading ? 'Creating...' : 'Create Note'}
      </button>
    </form>
  );
};
