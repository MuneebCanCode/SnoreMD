import React from 'react';
import { Note } from '../types';

interface NoteCardProps {
  note: Note;
}

export const NoteCard: React.FC<NoteCardProps> = ({ note }) => {
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
    // Open note in a new tab
    window.open(`/note/${note.patientId}/${note.noteId}`, '_blank');
  };

  const handleEditNote = () => {
    // Open edit note in a new tab
    window.open(`/edit/${note.patientId}/${note.noteId}`, '_blank');
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
