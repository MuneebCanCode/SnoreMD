import React from 'react';
import { Note } from '../types';
import { NoteCard } from './NoteCard';

interface NoteListProps {
  notes: Note[];
  loading: boolean;
  hasMore: boolean;
  onLoadMore: () => void;
}

export const NoteList: React.FC<NoteListProps> = ({ notes, loading, hasMore, onLoadMore }) => {
  if (loading && notes.length === 0) {
    return (
      <div className="note-list-loading">
        <div className="spinner"></div>
        <p>Loading notes...</p>
      </div>
    );
  }

  if (notes.length === 0) {
    return (
      <div className="note-list-empty">
        <p>No notes found for this patient.</p>
      </div>
    );
  }

  return (
    <div className="note-list">
      <div className="notes-container">
        {notes.map((note) => (
          <NoteCard key={note.noteId} note={note} />
        ))}
      </div>

      {hasMore && (
        <button
          className="load-more-button"
          onClick={onLoadMore}
          disabled={loading}
        >
          {loading ? 'Loading...' : 'Load More'}
        </button>
      )}
    </div>
  );
};
