import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Note, UpdateNoteRequest } from '../types';
import { apiClient } from '../services/api';
import '../styles/NoteDetailView.css';

export const NoteDetailView: React.FC = () => {
  const { noteId, patientId } = useParams<{ noteId: string; patientId: string }>();
  const navigate = useNavigate();
  const [note, setNote] = useState<Note | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  
  // Edit mode state
  const [isEditing, setIsEditing] = useState<boolean>(false);
  const [saving, setSaving] = useState<boolean>(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [editNoteText, setEditNoteText] = useState<string>('');

  useEffect(() => {
    const fetchNote = async () => {
      if (!patientId || !noteId) {
        setError('Missing patient ID or note ID');
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        // Fetch all notes for the patient and find the specific note
        const response = await apiClient.getNotes({ patientId }, 100);
        const foundNote = response.notes.find((n) => n.noteId === noteId);
        
        if (foundNote) {
          setNote(foundNote);
          setEditNoteText(foundNote.noteText);
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

  const handleEditClick = () => {
    setIsEditing(true);
    setError(null);
    setSuccessMessage(null);
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    setError(null);
    setSuccessMessage(null);
    // Reset to original values
    if (note) {
      setEditNoteText(note.noteText);
    }
  };

  const handleSaveChanges = async () => {
    if (!patientId || !noteId) {
      setError('Missing patient ID or note ID');
      return;
    }

    if (!editNoteText.trim()) {
      setError('Note text is required');
      return;
    }

    try {
      setSaving(true);
      setError(null);
      setSuccessMessage(null);

      const updates: UpdateNoteRequest = {
        noteText: editNoteText.trim(),
      };

      const updatedNote = await apiClient.updateNote(patientId, noteId, updates);
      setNote(updatedNote);
      setEditNoteText(updatedNote.noteText);
      setIsEditing(false);
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
      <div className="note-detail-container">
        <div className="note-detail-error">
          <h1>Loading...</h1>
          <p>Please wait while we fetch the note details.</p>
        </div>
      </div>
    );
  }

  if (error || !note) {
    return (
      <div className="note-detail-container">
        <div className="note-detail-error">
          <h1>Note Not Found</h1>
          <p>{error || 'The requested note could not be found.'}</p>
          <button onClick={() => navigate(patientId ? `/?patientId=${patientId}` : '/')} className="back-button">
            Back to Notes
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="note-detail-container">
      <div className="note-detail-header">
        <button onClick={() => navigate(`/?patientId=${patientId}`)} className="back-button">
          ← Back to Notes
        </button>
        <h1>Patient Note Details</h1>
      </div>

      <div className="note-detail-card">
        {successMessage && (
          <div className="success-message-banner">
            {successMessage}
          </div>
        )}

        {error && !loading && (
          <div className="error-message-banner">
            {error}
          </div>
        )}

        <div className="note-detail-section">
          <div className="note-detail-badge-row">
            <span className="note-detail-date">{formatDate(note.createdAt)}</span>
            {!isEditing && (
              <button onClick={handleEditClick} className="edit-note-btn">
                ✏️ Edit Note
              </button>
            )}
          </div>
        </div>

        <div className="note-detail-section">
          <h2>Note Content</h2>
          {isEditing ? (
            <div className="edit-form-inline">
              <textarea
                value={editNoteText}
                onChange={(e) => setEditNoteText(e.target.value)}
                className="edit-textarea"
                rows={10}
                placeholder="Enter note text..."
              />
              <div className="char-count-inline">
                {editNoteText.length} / 5000 characters
              </div>
            </div>
          ) : (
            <div className="note-detail-text">
              {note.noteText}
            </div>
          )}
        </div>

        <div className="note-detail-section">
          <h2>Patient Information</h2>
          <div className="note-detail-grid">
            <div className="detail-item">
              <span className="detail-label">Patient ID:</span>
              <span className="detail-value">{note.patientId}</span>
            </div>
            <div className="detail-item">
              <span className="detail-label">Clinic ID:</span>
              <span className="detail-value">{note.clinicId}</span>
            </div>
            <div className="detail-item">
              <span className="detail-label">Clinician ID:</span>
              <span className="detail-value">{note.createdBy}</span>
            </div>
            <div className="detail-item">
              <span className="detail-label">Sleep Study ID:</span>
              <span className="detail-value">{note.sleepStudyId || 'N/A'}</span>
            </div>
          </div>
        </div>

        {isEditing && (
          <>
            <div className="info-message-banner" style={{ fontSize: '0.9rem', marginBottom: '1rem' }}>
              Note: Sleep Study ID is auto-generated and cannot be edited
            </div>
            <div className="note-detail-section">
              <div className="edit-actions">
              <button
                onClick={handleSaveChanges}
                className="save-changes-btn"
                disabled={saving || !editNoteText.trim()}
              >
                {saving ? '💾 Saving...' : '💾 Save Changes'}
              </button>
              <button
                onClick={handleCancelEdit}
                className="cancel-edit-btn"
                disabled={saving}
              >
                ✖ Cancel
              </button>
            </div>
          </div>
          </>
        )}

        <div className="note-detail-section">
          <h2>Note Metadata</h2>
          <div className="note-detail-grid">
            <div className="detail-item">
              <span className="detail-label">Note ID:</span>
              <span className="detail-value note-id">{note.noteId}</span>
            </div>
            <div className="detail-item">
              <span className="detail-label">Created:</span>
              <span className="detail-value">{formatDate(note.createdAt)}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
