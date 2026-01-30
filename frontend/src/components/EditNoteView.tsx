import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Note, UpdateNoteRequest } from '../types';
import { apiClient } from '../services/api';
import '../styles/EditNoteView.css';

export const EditNoteView: React.FC = () => {
  const { noteId, patientId } = useParams<{ noteId: string; patientId: string }>();
  const navigate = useNavigate();
  
  const [note, setNote] = useState<Note | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [saving, setSaving] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  
  // Form state
  const [noteText, setNoteText] = useState<string>('');

  useEffect(() => {
    const fetchNote = async () => {
      if (!patientId || !noteId) {
        setError('Missing patient ID or note ID');
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const response = await apiClient.getNotes({ patientId }, 100);
        const foundNote = response.notes.find((n) => n.noteId === noteId);
        
        if (foundNote) {
          setNote(foundNote);
          setNoteText(foundNote.noteText);
        } else {
          setError('Note not found');
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch note');
      } finally {
        setLoading(false);
      }
    };

    fetchNote();
  }, [noteId, patientId]);

  const handleSaveChanges = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!patientId || !noteId) {
      setError('Missing patient ID or note ID');
      return;
    }

    if (!noteText.trim()) {
      setError('Note text is required');
      return;
    }

    try {
      setSaving(true);
      setError(null);
      setSuccessMessage(null);

      const updates: UpdateNoteRequest = {
        noteText: noteText.trim(),
      };

      const updatedNote = await apiClient.updateNote(patientId, noteId, updates);
      setNote(updatedNote);
      setSuccessMessage('Note updated successfully!');
      
      // Broadcast update to other tabs
      try {
        const channel = new BroadcastChannel('note-updates');
        channel.postMessage({
          type: 'NOTE_UPDATED',
          patientId: patientId,
          noteId: noteId,
        });
        channel.close();
      } catch (broadcastError) {
        console.log('BroadcastChannel not supported or failed:', broadcastError);
      }
      
      // Clear success message after 3 seconds
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update note');
    } finally {
      setSaving(false);
    }
  };

  const formatDate = (isoString: string): string => {
    const date = new Date(isoString);
    return date.toLocaleString('en-US', {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (loading) {
    return (
      <div className="edit-note-container">
        <div className="edit-note-loading">
          <div className="spinner"></div>
          <h1>Loading...</h1>
          <p>Please wait while we fetch the note details.</p>
        </div>
      </div>
    );
  }

  if (error && !note) {
    return (
      <div className="edit-note-container">
        <div className="edit-note-error">
          <h1>Note Not Found</h1>
          <p>{error}</p>
          <button onClick={() => navigate(patientId ? `/?patientId=${patientId}` : '/')} className="back-button">
            Back to Notes
          </button>
        </div>
      </div>
    );
  }

  if (!note) {
    return null;
  }

  const charCount = noteText.length;
  const maxChars = 5000;

  return (
    <div className="edit-note-container">
      <div className="edit-note-header">
        <button onClick={() => navigate(patientId ? `/?patientId=${patientId}` : '/')} className="back-button">
          ← Back to Notes
        </button>
        <h1>Edit Patient Note</h1>
      </div>

      <div className="edit-note-card">
        {successMessage && (
          <div className="success-message">
            {successMessage}
          </div>
        )}

        {error && (
          <div className="error-message">
            {error}
          </div>
        )}

        <div className="edit-note-info">
          <div className="info-grid">
            <div className="info-item">
              <span className="info-label">Patient ID:</span>
              <span className="info-value">{note.patientId}</span>
            </div>
            <div className="info-item">
              <span className="info-label">Clinic ID:</span>
              <span className="info-value">{note.clinicId}</span>
            </div>
            <div className="info-item">
              <span className="info-label">Clinician ID:</span>
              <span className="info-value">{note.createdBy}</span>
            </div>
            <div className="info-item">
              <span className="info-label">Created:</span>
              <span className="info-value">{formatDate(note.createdAt)}</span>
            </div>
            {note.sleepStudyId && (
              <div className="info-item">
                <span className="info-label">Sleep Study ID:</span>
                <span className="info-value">{note.sleepStudyId}</span>
              </div>
            )}
          </div>
        </div>

        <form onSubmit={handleSaveChanges} className="edit-note-form">
          <div className="form-group">
            <label htmlFor="noteText">
              Note Text <span className="required">*</span>
            </label>
            <textarea
              id="noteText"
              value={noteText}
              onChange={(e) => setNoteText(e.target.value)}
              placeholder="Enter patient follow-up notes..."
              required
              maxLength={maxChars}
              rows={10}
            />
            <div className="char-count">
              {charCount} / {maxChars} characters
            </div>
          </div>

          <div className="info-message" style={{ fontSize: '0.9rem', marginBottom: '1rem' }}>
            Note: Sleep Study ID is auto-generated and cannot be edited
          </div>

          <div className="form-actions">
            <button
              type="submit"
              className="save-button"
              disabled={saving || !noteText.trim()}
            >
              {saving ? 'Saving...' : 'Save Changes'}
            </button>
            <button
              type="button"
              className="cancel-button"
              onClick={() => navigate(patientId ? `/?patientId=${patientId}` : '/')}
              disabled={saving}
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
