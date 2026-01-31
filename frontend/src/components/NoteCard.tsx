import React from 'react';
import { Link } from 'react-router-dom';
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
          <Link to={`/note/${note.patientId}/${note.noteId}`} className="view-note-button">
            View Full Note
          </Link>
          <Link to={`/edit/${note.patientId}/${note.noteId}`} className="edit-note-button">
            Edit Note
          </Link>
        </div>
      </div>
    </div>
  );
};
