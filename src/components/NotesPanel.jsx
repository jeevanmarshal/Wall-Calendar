import { useState, useEffect, useRef } from "react";
import { countDaysInRange, formatShortDate, isSameDay } from "../utils/dateHelpers";

const MAX_CHARS = 500;

function buildRangeLabel(start, end) {
  if (!start) return null;
  const startStr = formatShortDate(start);
  if (!end || isSameDay(start, end)) return startStr;
  return `${startStr} — ${formatShortDate(end)}`;
}

export default function NotesPanel({ 
  rangeStart, rangeEnd, 
  savedNotes, setSavedNotes, 
  displayYear, displayMonth,
  onNoteClick 
}) {
  const [draftText, setDraftText] = useState("");
  const [editingNoteId, setEditingNoteId] = useState(null);
  const [showSavedFlash, setShowSavedFlash] = useState(false);
  const [confirmDeleteId, setConfirmDeleteId] = useState(null);
  const flashTimer = useRef(null);

  useEffect(() => {
    return () => {
      if (flashTimer.current) clearTimeout(flashTimer.current);
    };
  }, []);

  function handleSaveNote() {
    const trimmed = draftText.trim();
    if (!trimmed) return;

    if (editingNoteId) {
      setSavedNotes(prev => prev.map(n => 
        n.id === editingNoteId ? { ...n, text: trimmed, updatedAt: new Date().toISOString() } : n
      ));
      setEditingNoteId(null);
    } else {
      const rangeLabel = buildRangeLabel(rangeStart, rangeEnd) || "General month note";
      const newNote = {
        id: Date.now(),
        label: rangeLabel,
        text: trimmed,
        // Save the raw date objects so they can be processed easily by Grid
        rangeStart: rangeStart ? { ...rangeStart } : null,
        rangeEnd: rangeEnd ? { ...rangeEnd } : null,
        displayMonth,
        displayYear,
        createdAt: new Date().toISOString(),
      };
      setSavedNotes(prev => [newNote, ...prev]);
    }

    setDraftText("");
    if (flashTimer.current) clearTimeout(flashTimer.current);
    setShowSavedFlash(true);
    flashTimer.current = setTimeout(() => setShowSavedFlash(false), 2000);
  }

  function handleEditClick(note) {
    setDraftText(note.text);
    setEditingNoteId(note.id);
  }

  function handleCancelEdit() {
    setDraftText("");
    setEditingNoteId(null);
  }

  function requestDelete(id) {
    setConfirmDeleteId(id);
  }

  function confirmDelete(id) {
    setSavedNotes(prev => prev.filter(n => n.id !== id));
    if (editingNoteId === id) {
      setEditingNoteId(null);
      setDraftText("");
    }
    setConfirmDeleteId(null);
  }

  function cancelDelete() {
    setConfirmDeleteId(null);
  }

  function handleClearAll() {
    if (window.confirm("Delete all saved notes? This can't be undone.")) {
      setSavedNotes([]);
      setEditingNoteId(null);
      setDraftText("");
    }
  }

  const rangeLabel = buildRangeLabel(rangeStart, rangeEnd);
  const dayCount = countDaysInRange(rangeStart, rangeEnd);
  const charsRemaining = MAX_CHARS - draftText.length;
  const nearLimit = charsRemaining <= 60;

  let textareaPlaceholder = rangeLabel
    ? `Jot down notes for ${rangeLabel}...`
    : "Pick a date or range, then write your notes here...";
  if (editingNoteId) textareaPlaceholder = "Edit your note here...";

  // Sort notes so general notes are separated or just sort by creation desc (already standard)

  return (
    <div className="notes-panel">
      <h2 className="notes-heading">Notes</h2>

      {rangeLabel ? (
        <div className="range-pill">
          <span className="range-pill-label">Selected</span>
          <span className="range-pill-dates">{rangeLabel}</span>
          {dayCount > 1 && (
            <span className="range-pill-count">{dayCount} days</span>
          )}
        </div>
      ) : (
        <div className="notes-empty-state">
          <svg className="notes-empty-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9z" />
          </svg>
          <p className="notes-empty-hint">
            No notes yet. Select a date range and add one!
          </p>
        </div>
      )}

      <textarea
        className="notes-textarea"
        value={draftText}
        placeholder={textareaPlaceholder}
        onChange={e => {
          if (e.target.value.length <= MAX_CHARS) {
            setDraftText(e.target.value);
          }
        }}
        onKeyDown={e => {
          if ((e.ctrlKey || e.metaKey) && e.key === "Enter") {
            e.preventDefault();
            handleSaveNote();
          }
        }}
      />

      <div className="notes-meta-row">
        <span className={`notes-saved-flash ${showSavedFlash ? "show" : ""}`}>
          ✓ Saved
        </span>
        <span className={`notes-char-count ${nearLimit ? "warning" : ""}`}>
          {charsRemaining}
        </span>
      </div>

      <div style={{ display: "flex", gap: "8px", alignSelf: "flex-end" }}>
        {editingNoteId && (
          <button className="notes-save-btn" onClick={handleCancelEdit} style={{ background: "transparent", color: "var(--ink-muted)", border: "1px solid var(--border)" }}>
            Cancel
          </button>
        )}
        <button
          className="notes-save-btn"
          onClick={handleSaveNote}
          disabled={!draftText.trim()}
          title="Save note (Ctrl+Enter)"
        >
          {editingNoteId ? "Update note" : "Save note"}
        </button>
      </div>

      {savedNotes.length > 0 && (
        <>
          <div className="notes-divider">
            <span className="notes-divider-label">Saved ({savedNotes.length})</span>
            <div className="notes-divider-line" />
            <button className="notes-clear-all" onClick={handleClearAll}>
              clear all
            </button>
          </div>

          <div className="saved-notes-list">
            {savedNotes.map(note => {
              const isConfirming = confirmDeleteId === note.id;
              return (
                <div 
                  key={note.id} 
                  id={`note-card-${note.id}`} 
                  className={`saved-note-card ${editingNoteId === note.id ? "editing" : ""} ${isConfirming ? "confirming" : ""}`}
                  onClick={() => onNoteClick && onNoteClick(note)}
                  style={{ cursor: onNoteClick ? "pointer" : "default" }}
                >
                  <div className="saved-note-date-label">{note.label}</div>
                  <div className="saved-note-body">{note.text}</div>
                  
                  {isConfirming ? (
                    <div className="saved-note-confirm">
                      <span className="confirm-text">Delete this note?</span>
                      <div className="confirm-actions">
                        <button className="confirm-btn yes" onClick={(e) => { e.stopPropagation(); confirmDelete(note.id); }}>Delete</button>
                        <button className="confirm-btn no" onClick={(e) => { e.stopPropagation(); cancelDelete(); }}>Cancel</button>
                      </div>
                    </div>
                  ) : (
                    <div className="saved-note-actions">
                      <button className="saved-note-btn edit" onClick={(e) => { e.stopPropagation(); handleEditClick(note); }} aria-label="Edit note">✏️</button>
                      <button className="saved-note-btn del" onClick={(e) => { e.stopPropagation(); requestDelete(note.id); }} aria-label="Delete note">✕</button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}
