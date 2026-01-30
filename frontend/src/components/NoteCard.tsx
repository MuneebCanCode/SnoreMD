import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Note } from '../types';

interface NoteCardProps {
  note: Note;
}

export const NoteCard: React.FC<NoteCardProps> = ({ note }) => {
  const navigate = useNavigate();

  const formatDate = (isoString: string): string => {
    const date = new Date(isoString);
    return date.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const handleViewNote = () => {
    // Navigate to note detail view in the same tab
    navigate(`/note/${note.patientId}/${note.noteId}`);
  };

  const handleEditNote = () => {
    // Navigate to edit note view in the same tab
    navigate(`/edit/${note.patientId}/${note.noteId}`);
  };

  return (
    <div className="note-card">
      <div className="note-header">
        <span className="note-date">{formatDate(note.createdAt)}</span>
      </div>

      <div className="note-body">
        <p className="note-text note-text-preview">{note.noteText}</p>
      </div>

      <div className="note-footer">
        <div className="note-meta">
          <span className="meta-item">
            <strong>Clinic ID:</strong> {note.clinicId}
          </span>
          <span className="meta-item">
            <strong>Clinician ID:</strong> {note.createdBy}
          </span>
          <span className="meta-item">
            <strong>Patient ID:</strong> {note.patientId}
          </span>
          {note.sleepStudyId && (
            <span className="meta-item">
              <strong>Sleep Study:</strong> {note.sleepStudyId}
            </span>
          )}
        </div>
        <div className="note-actions">
          <button onClick={handleViewNote} className="view-note-button">
            View Full Note
          </button>
          <button onClick={handleEditNote} className="edit-note-button">
            Edit Note
          </button>
        </div>
      </div>
    </div>
  );
};
