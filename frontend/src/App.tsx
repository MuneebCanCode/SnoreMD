import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, useSearchParams, useNavigate } from 'react-router-dom';
import { Authenticator } from '@aws-amplify/ui-react';
import '@aws-amplify/ui-react/styles.css';
import { Note, CreateNoteRequest } from './types';
import { apiClient } from './services/api';
import { NoteForm } from './components/NoteForm';
import { NoteList } from './components/NoteList';
import { NoteDetailView } from './components/NoteDetailView';
import { EditNoteView } from './components/EditNoteView';
import './styles/App.css';

function MainView({ user, signOut }: { user: any; signOut?: () => void }) {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const [patientId, setPatientId] = useState<string>('');
  const [notes, setNotes] = useState<Note[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [nextCursor, setNextCursor] = useState<string | undefined>(undefined);
  const [creating, setCreating] = useState<boolean>(false);

  // Initialize patient ID from URL query parameter
  useEffect(() => {
    const patientIdFromUrl = searchParams.get('patientId');
    if (patientIdFromUrl) {
      setPatientId(patientIdFromUrl);
    }
  }, [searchParams]);

  // Fetch notes when patientId changes
  useEffect(() => {
    if (patientId.trim()) {
      fetchNotes(patientId.trim());
    } else {
      // Clear notes if field is empty
      setNotes([]);
      setNextCursor(undefined);
    }
  }, [patientId]);

  // Listen for note updates from other tabs
  useEffect(() => {
    // Create a broadcast channel for cross-tab communication
    const channel = new BroadcastChannel('note-updates');
    
    channel.onmessage = (event) => {
      if (event.data.type === 'NOTE_UPDATED' && event.data.patientId === patientId.trim()) {
        // Refresh notes when a note is updated in another tab
        console.log('Note updated in another tab, refreshing...');
        fetchNotes(patientId.trim());
      }
    };

    return () => {
      channel.close();
    };
  }, [patientId]);

  // Auto-refresh when tab gains focus
  useEffect(() => {
    const handleFocus = () => {
      if (patientId.trim()) {
        console.log('Tab gained focus, refreshing notes...');
        fetchNotes(patientId.trim());
      }
    };

    window.addEventListener('focus', handleFocus);

    return () => {
      window.removeEventListener('focus', handleFocus);
    };
  }, [patientId]);

  const fetchNotes = async (pid: string, cursor?: string) => {
    setLoading(true);
    setError(null);

    try {
      const response = await apiClient.getNotes({ patientId: pid }, 20, cursor);
      
      if (cursor) {
        // Append to existing notes for pagination
        setNotes((prev) => [...prev, ...response.notes]);
      } else {
        // Replace notes for new search
        setNotes(response.notes);
      }
      
      setNextCursor(response.nextCursor);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch notes');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateNote = async (data: CreateNoteRequest) => {
    if (!patientId.trim()) {
      setError('Patient ID is required to create a note');
      throw new Error('Patient ID is required to create a note');
    }

    setCreating(true);
    setError(null);

    try {
      await apiClient.createNote(patientId.trim(), data);
      // Refresh notes after creation
      await fetchNotes(patientId.trim());
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create note');
      throw err; // Re-throw to let form handle it
    } finally {
      setCreating(false);
    }
  };

  const handleLoadMore = () => {
    if (nextCursor && !loading && patientId.trim()) {
      fetchNotes(patientId.trim(), nextCursor);
    }
  };

  const handlePatientIdChange = (value: string) => {
    setPatientId(value);
    setNotes([]);
    setNextCursor(undefined);
    
    // Update URL query parameter
    if (value.trim()) {
      setSearchParams({ patientId: value.trim() });
    } else {
      setSearchParams({});
    }
  };

  const handleHeaderClick = () => {
    // Navigate to home page and clear patient ID
    navigate('/');
    setPatientId('');
    setNotes([]);
    setNextCursor(undefined);
    setError(null);
  };

  return (
    <div className="app">
      <header className="app-header">
        <h1 onClick={handleHeaderClick} style={{ cursor: 'pointer' }}>
          Snore MD - Patient Notes
        </h1>
        <div className="header-user-info">
          <span className="user-email">{user?.signInDetails?.loginId || user?.username}</span>
          <button onClick={signOut} className="sign-out-button">
            Sign Out
          </button>
        </div>
      </header>

      <main className="app-main">
        <div className="patient-selector">
          <label htmlFor="patientId">Patient ID:</label>
          <input
            id="patientId"
            type="text"
            value={patientId}
            onChange={(e) => handlePatientIdChange(e.target.value)}
            placeholder="e.g., P0001"
          />
        </div>

        {error && <div className="error-message">{error}</div>}

        <div className="content-grid">
          <section className="note-form-section">
            <h2>Create New Note</h2>
            {patientId.trim() ? (
              <NoteForm
                patientId={patientId.trim()}
                onSubmit={handleCreateNote}
                loading={creating}
              />
            ) : (
              <p className="info-message">Enter a Patient ID to create a note</p>
            )}
          </section>

          <section className="note-list-section">
            <h2>
              {patientId.trim() ? `Notes for Patient: ${patientId}` : 'Patient Notes'}
            </h2>
            <NoteList
              notes={notes}
              loading={loading}
              hasMore={!!nextCursor}
              onLoadMore={handleLoadMore}
            />
          </section>
        </div>
      </main>
    </div>
  );
}

function App() {
  return (
    <Authenticator hideSignUp={false}>
      {({ signOut, user }) => (
        <Router>
          <Routes>
            <Route path="/" element={<MainView user={user} signOut={signOut} />} />
            <Route path="/note/:patientId/:noteId" element={<NoteDetailView />} />
            <Route path="/edit/:patientId/:noteId" element={<EditNoteView />} />
          </Routes>
        </Router>
      )}
    </Authenticator>
  );
}

export default App;
