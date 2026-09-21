import React, { useState, useMemo } from 'react';
import {
  Plus,
  Search,
  Lock,
  Unlock,
  Pin,
  X,
  Trash2,
  Check,
  KeyRound,
  FileText,
  Eye,
  EyeOff,
  Palette,
} from 'lucide-react';
import { PersonalNote } from '../types';

interface CoolNotepadProps {
  notes: PersonalNote[];
  onAddNote: (note: PersonalNote) => void;
  onUpdateNote: (note: PersonalNote) => void;
  onDeleteNote: (id: string) => void;
}

// Warm aesthetic themes for notes and notepad
const COLOR_THEMES = {
  dark: {
    id: 'dark',
    name: 'Dark Graphite',
    cardBg: 'bg-[#221f1d] text-stone-100 border-[#36312d]',
    accentBg: 'bg-stone-800/80 text-stone-200',
    editorBg: 'bg-[#221f1d] text-stone-100',
    editorText: 'text-stone-100 placeholder:text-stone-500',
    editorBody: 'text-stone-200 placeholder:text-stone-500',
    dateText: 'text-stone-400',
    bodyText: 'text-stone-300',
    swatch: 'bg-[#221f1d] border-stone-600',
  },
  terracotta: {
    id: 'terracotta',
    name: 'Warm Terracotta',
    cardBg: 'bg-[#c4684d] text-white border-[#b25b42]',
    accentBg: 'bg-[#ab563e] text-white',
    editorBg: 'bg-[#c4684d] text-white',
    editorText: 'text-white placeholder:text-amber-200/60',
    editorBody: 'text-amber-50 placeholder:text-amber-200/50',
    dateText: 'text-amber-100/80',
    bodyText: 'text-amber-50/95',
    swatch: 'bg-[#c4684d] border-amber-300',
  },
  sage: {
    id: 'sage',
    name: 'Sage Green',
    cardBg: 'bg-[#98a886] text-stone-900 border-[#889976]',
    accentBg: 'bg-[#829270] text-white',
    editorBg: 'bg-[#98a886] text-stone-900',
    editorText: 'text-stone-900 placeholder:text-stone-700/60',
    editorBody: 'text-stone-900 placeholder:text-stone-700/60',
    dateText: 'text-stone-700',
    bodyText: 'text-stone-900',
    swatch: 'bg-[#98a886] border-stone-400',
  },
  olive: {
    id: 'olive',
    name: 'Earthy Olive',
    cardBg: 'bg-[#7e876a] text-stone-100 border-[#6f785b]',
    accentBg: 'bg-[#6a7356] text-stone-100',
    editorBg: 'bg-[#7e876a] text-stone-100',
    editorText: 'text-stone-100 placeholder:text-stone-300/60',
    editorBody: 'text-stone-100 placeholder:text-stone-300/60',
    dateText: 'text-stone-300',
    bodyText: 'text-stone-200',
    swatch: 'bg-[#7e876a] border-stone-500',
  },
  sand: {
    id: 'sand',
    name: 'Desert Sand',
    cardBg: 'bg-[#ebe3cf] text-stone-900 border-[#ded5be]',
    accentBg: 'bg-[#d8ceb6] text-stone-800',
    editorBg: 'bg-[#ebe3cf] text-stone-900',
    editorText: 'text-stone-900 placeholder:text-stone-600/60',
    editorBody: 'text-stone-800 placeholder:text-stone-600/60',
    dateText: 'text-stone-600',
    bodyText: 'text-stone-800',
    swatch: 'bg-[#ebe3cf] border-stone-400',
  },
} as const;

type ColorKey = keyof typeof COLOR_THEMES;

const NOTEPAD_CONTAINER_THEMES: Record<
  ColorKey,
  {
    id: ColorKey;
    name: string;
    headerBg: string;
    headerText: string;
    subText: string;
    border: string;
    btnBg: string;
    swatch: string;
  }
> = {
  dark: {
    id: 'dark',
    name: 'Graphite Dark',
    headerBg: 'bg-[#1e1b19]',
    headerText: 'text-white',
    subText: 'text-stone-400',
    border: 'border-stone-800/90',
    btnBg: 'bg-[#c4684d] hover:bg-[#b25b42] text-white',
    swatch: 'bg-[#1e1b19] border-stone-600',
  },
  terracotta: {
    id: 'terracotta',
    name: 'Warm Terracotta',
    headerBg: 'bg-[#ab563e]',
    headerText: 'text-white',
    subText: 'text-amber-100/80',
    border: 'border-[#964731]',
    btnBg: 'bg-stone-900 hover:bg-stone-800 text-white',
    swatch: 'bg-[#ab563e] border-amber-300',
  },
  sage: {
    id: 'sage',
    name: 'Sage Green',
    headerBg: 'bg-[#7e906f]',
    headerText: 'text-stone-950',
    subText: 'text-stone-800',
    border: 'border-[#6c7d5e]',
    btnBg: 'bg-stone-900 hover:bg-stone-800 text-white',
    swatch: 'bg-[#7e906f] border-stone-400',
  },
  olive: {
    id: 'olive',
    name: 'Earthy Olive',
    headerBg: 'bg-[#677054]',
    headerText: 'text-white',
    subText: 'text-stone-300',
    border: 'border-[#555d44]',
    btnBg: 'bg-[#c4684d] hover:bg-[#b25b42] text-white',
    swatch: 'bg-[#677054] border-stone-400',
  },
  sand: {
    id: 'sand',
    name: 'Desert Sand',
    headerBg: 'bg-[#ded5bd]',
    headerText: 'text-stone-900',
    subText: 'text-stone-700',
    border: 'border-[#cbbf9f]',
    btnBg: 'bg-stone-900 hover:bg-stone-800 text-white',
    swatch: 'bg-[#ded5bd] border-stone-400',
  },
};

export const CoolNotepad: React.FC<CoolNotepadProps> = ({
  notes = [],
  onAddNote,
  onUpdateNote,
  onDeleteNote,
}) => {
  const safeNotes = useMemo(() => (Array.isArray(notes) ? notes.filter(Boolean) : []), [notes]);

  // Overall Notepad Container Theme (5 selectable themes)
  const [notepadTheme, setNotepadTheme] = useState<ColorKey>(() => {
    try {
      const saved = localStorage.getItem('smm_notepad_main_theme');
      if (saved && saved in NOTEPAD_CONTAINER_THEMES) {
        return saved as ColorKey;
      }
    } catch {
      // fallback
    }
    return 'dark';
  });

  const handleSetNotepadTheme = (key: ColorKey) => {
    setNotepadTheme(key);
    try {
      localStorage.setItem('smm_notepad_main_theme', key);
    } catch {
      // ignore
    }
  };

  // Search
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchOpen, setIsSearchOpen] = useState(false);

  // Unlocked Notes in current session
  const [unlockedNoteIds, setUnlockedNoteIds] = useState<Set<string>>(new Set());

  // Password Unlock Modal
  const [unlockTargetNote, setUnlockTargetNote] = useState<PersonalNote | null>(null);
  const [enteredPassword, setEnteredPassword] = useState('');
  const [unlockError, setUnlockError] = useState('');

  // Add / Edit Modal
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [editingNote, setEditingNote] = useState<PersonalNote | null>(null);

  // Form State
  const [formTitle, setFormTitle] = useState('');
  const [formContent, setFormContent] = useState('');
  const [formColor, setFormColor] = useState<PersonalNote['colorScheme']>('terracotta');
  const [formHasPassword, setFormHasPassword] = useState(false);
  const [formPassword, setFormPassword] = useState('');
  const [formIsPinned, setFormIsPinned] = useState(false);
  const [showPasswordText, setShowPasswordText] = useState(false);
  const [isPasswordBarOpen, setIsPasswordBarOpen] = useState(false);

  // Delete Confirmation Modal
  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null);

  // Filter & sort notes
  const filteredNotes = useMemo(() => {
    return safeNotes
      .filter((note) => {
        if (!searchQuery.trim()) return true;
        const q = searchQuery.toLowerCase().trim();
        const titleMatch = (note.title || '').toLowerCase().includes(q);
        const contentMatch = (note.content || '').toLowerCase().includes(q);
        return titleMatch || contentMatch;
      })
      .sort((a, b) => {
        if (a.isPinned && !b.isPinned) return -1;
        if (!a.isPinned && b.isPinned) return 1;
        return (b.createdAt || '').localeCompare(a.createdAt || '');
      });
  }, [safeNotes, searchQuery]);

  // Open Editor for New Note
  const handleOpenAddNote = () => {
    setEditingNote(null);
    setFormTitle('');
    setFormContent('');
    // Default to the current notepad theme or warm terracotta
    setFormColor(notepadTheme in COLOR_THEMES ? notepadTheme : 'terracotta');
    setFormHasPassword(false);
    setFormPassword('');
    setFormIsPinned(false);
    setShowPasswordText(false);
    setIsPasswordBarOpen(false);
    setIsEditorOpen(true);
  };

  // Open Editor for Existing Note
  const handleOpenEditNote = (note: PersonalNote) => {
    // If password-protected and not unlocked yet, prompt for password first
    const isUnlocked = unlockedNoteIds.has(note.id);
    if (note.isPrivate && !isUnlocked) {
      setUnlockTargetNote(note);
      setEnteredPassword('');
      setUnlockError('');
      return;
    }

    setEditingNote(note);
    setFormTitle(note.title || '');
    setFormContent(note.content || '');
    setFormColor(note.colorScheme || 'dark');
    setFormHasPassword(!!note.isPrivate);
    setFormPassword(note.password || '');
    setFormIsPinned(!!note.isPinned);
    setShowPasswordText(false);
    setIsPasswordBarOpen(false);
    setIsEditorOpen(true);
  };

  // Close editor and lock private note
  const handleCloseEditor = () => {
    setIsPasswordBarOpen(false);
    if (editingNote?.isPrivate || formHasPassword) {
      if (editingNote) {
        setUnlockedNoteIds((prev) => {
          const next = new Set(prev);
          next.delete(editingNote.id);
          return next;
        });
      }
    }
    setIsEditorOpen(false);
  };

  // Save Note - ALWAYS LOCKS PASSWORD-PROTECTED NOTES SO TEXT IS NOT VISIBLE
  const handleSaveNote = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!formTitle.trim() && !formContent.trim()) {
      handleCloseEditor();
      return;
    }

    const todayDate = new Date().toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'short',
    });

    const hasPass = formHasPassword && formPassword.trim().length > 0;
    const isPrivate = hasPass;
    const password = hasPass ? formPassword.trim() : undefined;

    if (editingNote) {
      const updated: PersonalNote = {
        ...editingNote,
        title: formTitle.trim() || 'Untitled Note',
        content: formContent.trim(),
        colorScheme: formColor,
        isPrivate,
        password,
        isPinned: formIsPinned,
        updatedAt: new Date().toISOString(),
      };
      onUpdateNote(updated);
      // Lock it immediately so content is NOT visible on the card!
      if (isPrivate) {
        setUnlockedNoteIds((prev) => {
          const next = new Set(prev);
          next.delete(updated.id);
          return next;
        });
      }
    } else {
      const newId = `note-${Date.now()}`;
      const newNote: PersonalNote = {
        id: newId,
        title: formTitle.trim() || 'Untitled Note',
        content: formContent.trim(),
        colorScheme: formColor,
        date: todayDate,
        isPrivate,
        password,
        isPinned: formIsPinned,
        createdAt: new Date().toISOString(),
      };
      onAddNote(newNote);
      // New note with password starts LOCKED
      if (isPrivate) {
        setUnlockedNoteIds((prev) => {
          const next = new Set(prev);
          next.delete(newId);
          return next;
        });
      }
    }

    setIsEditorOpen(false);
  };

  // Verify Note Password
  const handleVerifyPassword = () => {
    if (!unlockTargetNote) return;
    const notePass = (unlockTargetNote.password || '1234').trim();
    const entered = enteredPassword.trim();
    
    if (entered === notePass || (!unlockTargetNote.password && entered === '1234')) {
      const target = unlockTargetNote;
      setUnlockedNoteIds((prev) => new Set(prev).add(target.id));
      setUnlockTargetNote(null);
      setEnteredPassword('');
      setUnlockError('');

      // Open in editor directly so they can view and edit the text
      setEditingNote(target);
      setFormTitle(target.title || '');
      setFormContent(target.content || '');
      setFormColor(target.colorScheme || 'dark');
      setFormHasPassword(!!target.isPrivate);
      setFormPassword(target.password || '');
      setFormIsPinned(!!target.isPinned);
      setIsEditorOpen(true);
    } else {
      setUnlockError('Incorrect password! Sahi password enter karein.');
    }
  };

  // Lock an unlocked note
  const handleLockNote = (e: React.MouseEvent, noteId: string) => {
    e.stopPropagation();
    setUnlockedNoteIds((prev) => {
      const next = new Set(prev);
      next.delete(noteId);
      return next;
    });
  };

  // Quick Pin Toggle
  const handleTogglePin = (e: React.MouseEvent, note: PersonalNote) => {
    e.stopPropagation();
    onUpdateNote({
      ...note,
      isPinned: !note.isPinned,
    });
  };

  const currentNotepadTheme =
    NOTEPAD_CONTAINER_THEMES[notepadTheme] || NOTEPAD_CONTAINER_THEMES.dark;

  return (
    <div id="cool-notepad-section" className="space-y-4 animate-fade-in pb-16">
      {/* ========================================================
          1. HEADER: Compact "Your Notes", Search & Add Note
          ======================================================== */}
      <div
        className="bg-[#1e1b19] text-stone-100 rounded-2xl sm:rounded-3xl py-2.5 px-4 sm:px-5 shadow-xs border border-stone-800/90 flex items-center justify-between gap-3 transition-colors duration-200"
      >
        <div className="flex items-center gap-2">
          <h1 className="text-lg sm:text-xl font-black tracking-tight leading-none text-white">
            Your Notes
          </h1>
          <span className="text-[11px] text-stone-400 font-medium hidden sm:inline">
            • Personal &amp; secure
          </span>
        </div>

        {/* Top Actions: Search + Add Note (+ Lock All if unlocked) */}
        <div className="flex items-center gap-2">
          {unlockedNoteIds.size > 0 && (
            <button
              type="button"
              onClick={() => setUnlockedNoteIds(new Set())}
              className="h-8.5 px-2.5 sm:px-3 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-400/40 text-[11px] font-bold transition cursor-pointer flex items-center gap-1"
              title="Lock all unlocked notes"
            >
              <Lock className="w-3 h-3" />
              <span className="hidden sm:inline">Lock All</span>
            </button>
          )}

          <button
            type="button"
            onClick={() => setIsSearchOpen(!isSearchOpen)}
            className="w-8.5 h-8.5 rounded-xl flex items-center justify-center transition border border-white/15 bg-black/25 hover:bg-black/40 cursor-pointer text-white"
            title="Search Notes"
          >
            <Search className="w-3.5 h-3.5" />
          </button>

          <button
            id="btn-add-note-header"
            type="button"
            onClick={handleOpenAddNote}
            className="h-8.5 px-3 sm:px-4 rounded-xl bg-[#c4684d] hover:bg-[#b25b42] active:scale-95 text-white text-xs font-bold transition shadow-xs cursor-pointer flex items-center gap-1.5 border border-white/10"
            title="Add New Note"
          >
            <Plus className="w-4 h-4 stroke-[2.5]" />
            <span>Add Note</span>
          </button>
        </div>
      </div>

      {/* Search Bar (Collapsible) */}
      {isSearchOpen && (
        <div className="relative animate-fade-in">
          <Search className="w-4 h-4 text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search notes..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            autoFocus
            className="w-full h-11 pl-10 pr-9 bg-white border border-stone-200 rounded-2xl text-xs sm:text-sm text-stone-800 placeholder:text-stone-400 focus:outline-none focus:border-[#c4684d] focus:ring-1 focus:ring-[#c4684d] shadow-2xs"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600 cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      )}

      {/* ========================================================
          2. NOTES CARD GRID: Mobile-Friendly Cards
          ======================================================== */}
      {filteredNotes.length === 0 ? (
        <div className="text-center py-14 px-4 bg-stone-100 rounded-3xl border border-dashed border-stone-300 space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-stone-200 text-stone-600 flex items-center justify-center mx-auto">
            <FileText className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-base font-bold text-stone-800">No notes yet</h3>
            <p className="text-xs text-stone-500 max-w-xs mx-auto mt-0.5">
              Tap the plus (+) button above to write your first note, choose a color, or set a password!
            </p>
          </div>
          <button
            type="button"
            onClick={handleOpenAddNote}
            className="h-10 px-5 rounded-2xl bg-[#c4684d] hover:bg-[#b25b42] text-white text-xs font-bold transition shadow-sm cursor-pointer inline-flex items-center gap-1.5"
          >
            <Plus className="w-4 h-4" />
            <span>Create Note</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
          {filteredNotes.map((note) => {
            const theme = COLOR_THEMES[note.colorScheme] || COLOR_THEMES.dark;
            const isUnlocked = unlockedNoteIds.has(note.id);
            const isLocked = note.isPrivate && !isUnlocked;

            return (
              <div
                key={note.id}
                onClick={() => handleOpenEditNote(note)}
                className={`group relative rounded-2xl p-4.5 sm:p-5 border shadow-xs transition duration-200 hover:-translate-y-0.5 hover:shadow-md cursor-pointer flex flex-col justify-between min-h-[160px] ${theme.cardBg}`}
              >
                {/* Top Row: Date, Pin & Lock/Delete Actions */}
                <div>
                  <div className="flex items-center justify-between gap-2 pb-2">
                    <div className="flex items-center gap-1.5">
                      {note.isPinned && (
                        <span className="inline-flex items-center gap-1 text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-black/20 text-white/90">
                          <Pin className="w-2.5 h-2.5 fill-current" />
                          <span>Pinned</span>
                        </span>
                      )}
                      <span className={`text-[11px] font-bold ${theme.dateText}`}>
                        {note.date || 'Recent'}
                      </span>
                    </div>

                    {/* Quick Card Controls */}
                    <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                      {note.isPrivate && (
                        <button
                          type="button"
                          onClick={(e) => {
                            if (isLocked) {
                              setUnlockTargetNote(note);
                              setEnteredPassword('');
                              setUnlockError('');
                            } else {
                              handleLockNote(e, note.id);
                            }
                          }}
                          className={`p-1.5 rounded-lg transition cursor-pointer flex items-center gap-1 ${
                            isLocked
                              ? 'bg-amber-500/25 text-amber-300 border border-amber-400/30 hover:bg-amber-500/40'
                              : 'bg-emerald-500/25 text-emerald-300 border border-emerald-400/30 hover:bg-rose-500/25 hover:text-rose-300'
                          }`}
                          title={isLocked ? 'Locked (Tap to unlock)' : 'Unlocked (Tap to lock)'}
                        >
                          {isLocked ? (
                            <Lock className="w-3.5 h-3.5" />
                          ) : (
                            <Unlock className="w-3.5 h-3.5" />
                          )}
                        </button>
                      )}

                      <button
                        type="button"
                        onClick={(e) => handleTogglePin(e, note)}
                        className={`p-1.5 rounded-lg transition cursor-pointer ${
                          note.isPinned
                            ? 'text-white'
                            : 'text-current opacity-40 hover:opacity-100 hover:bg-black/10'
                        }`}
                        title={note.isPinned ? 'Unpin note' : 'Pin to top'}
                      >
                        <Pin className={`w-3.5 h-3.5 ${note.isPinned ? 'fill-current' : ''}`} />
                      </button>

                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setDeleteTargetId(note.id);
                        }}
                        className="p-1.5 rounded-lg text-current opacity-40 hover:opacity-100 hover:bg-black/10 hover:text-rose-300 transition cursor-pointer"
                        title="Delete Note"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Note Title */}
                  <h3 className="text-base sm:text-lg font-black tracking-tight leading-snug mt-1">
                    {note.title}
                  </h3>

                  {/* Note Content / Password Lock Shield */}
                  <div className="mt-2.5">
                    {isLocked ? (
                      <div
                        onClick={(e) => {
                          e.stopPropagation();
                          setUnlockTargetNote(note);
                          setEnteredPassword('');
                          setUnlockError('');
                        }}
                        className="p-3.5 rounded-2xl bg-black/45 backdrop-blur-xs border border-white/15 flex items-center justify-between gap-2.5 shadow-inner hover:bg-black/60 transition cursor-pointer group/unlock"
                      >
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-xl bg-amber-400/20 text-amber-300 flex items-center justify-center shrink-0 border border-amber-400/30">
                            <Lock className="w-4 h-4" />
                          </div>
                          <div>
                            <div className="text-xs font-black text-white">Password Protected</div>
                            <div className="text-[10px] text-stone-300 font-medium mt-0.5">
                              Text hidden • Tap to enter password
                            </div>
                          </div>
                        </div>
                        <span className="px-3 py-1.5 rounded-xl bg-amber-400 group-hover/unlock:bg-amber-300 text-stone-950 text-xs font-black shadow-xs transition">
                          Unlock
                        </span>
                      </div>
                    ) : (
                      <p
                        className={`text-xs sm:text-sm font-medium leading-relaxed line-clamp-4 ${theme.bodyText}`}
                      >
                        {note.content || 'Empty note...'}
                      </p>
                    )}
                  </div>
                </div>

                {/* Bottom Card Footer */}
                {note.isPrivate && !isLocked && (
                  <div className="mt-3 pt-2.5 flex items-center justify-between border-t border-black/15 text-[11px] font-bold">
                    <span className="text-emerald-300 flex items-center gap-1">
                      <Unlock className="w-3.5 h-3.5" />
                      <span>Unlocked</span>
                    </span>
                    <button
                      type="button"
                      onClick={(e) => handleLockNote(e, note.id)}
                      className="px-2.5 py-1 rounded-lg bg-black/35 hover:bg-black/60 text-amber-300 hover:text-white transition flex items-center gap-1 text-[10px] font-bold cursor-pointer border border-amber-400/30"
                      title="Lock note again"
                    >
                      <Lock className="w-3 h-3" />
                      <span>Lock Note</span>
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* ========================================================
          3. ADD / EDIT NOTE MODAL (Clean, Full Notepad Canvas with Top Toolbar)
          ======================================================== */}
      {isEditorOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4 animate-fade-in">
          <div
            id="modal-note-editor"
            className={`w-full max-w-2xl rounded-3xl shadow-2xl border border-white/10 overflow-hidden flex flex-col h-[88vh] sm:h-[85vh] transition-colors duration-200 ${COLOR_THEMES[formColor].editorBg}`}
          >
            {/* SINGLE TOP TOOLBAR LINE:
                [Close ✕]  ----  [5 Color Dots] [Lock/Password] [Pin] [Delete] [Save Note]
            */}
            <div className="px-3 sm:px-5 py-3 border-b border-black/10 flex items-center justify-between gap-2 bg-black/10 backdrop-blur-xs shrink-0">
              {/* Left: Close Button */}
              <button
                type="button"
                onClick={handleCloseEditor}
                className="p-2 rounded-xl text-stone-300 hover:text-white hover:bg-black/20 transition cursor-pointer"
                title="Cancel & Close"
              >
                <X className="w-5 h-5" />
              </button>

              {/* Right: All controls in ONE horizontal line */}
              <div className="flex items-center gap-1.5 sm:gap-2">
                {/* 5 COLOR THEME DOTS */}
                <div className="flex items-center gap-1 p-1 rounded-2xl bg-black/20 border border-white/10">
                  {(Object.keys(COLOR_THEMES) as ColorKey[]).map((key) => {
                    const t = COLOR_THEMES[key];
                    const isSelected = formColor === key;
                    return (
                      <button
                        key={key}
                        type="button"
                        onClick={() => setFormColor(key)}
                        className={`w-5 h-5 sm:w-5.5 sm:h-5.5 rounded-full transition cursor-pointer border flex items-center justify-center ${
                          t.swatch
                        } ${
                          isSelected
                            ? 'ring-2 ring-white scale-110 shadow-xs'
                            : 'opacity-70 hover:opacity-100 hover:scale-105'
                        }`}
                        title={`${t.name} Note Color`}
                      >
                        {isSelected && <Check className="w-3 h-3 text-white" />}
                      </button>
                    );
                  })}
                </div>

                {/* PASSWORD LOCK SYMBOL */}
                <button
                  type="button"
                  onClick={() => setIsPasswordBarOpen(!isPasswordBarOpen)}
                  className={`p-2 rounded-xl transition cursor-pointer flex items-center gap-1 text-xs font-bold ${
                    formHasPassword
                      ? 'bg-amber-400 text-stone-950 ring-1 ring-amber-300 shadow-xs'
                      : 'text-stone-300 hover:text-white hover:bg-black/20'
                  }`}
                  title={
                    formHasPassword
                      ? 'Protected by Password (Click to edit or remove)'
                      : 'Lock Note with Password'
                  }
                >
                  <Lock className={`w-4 h-4 ${formHasPassword ? 'fill-current' : ''}`} />
                  <span className="hidden sm:inline text-[11px]">
                    {formHasPassword ? 'Locked' : 'Lock'}
                  </span>
                </button>

                {/* PIN TO TOP SYMBOL */}
                <button
                  type="button"
                  onClick={() => setFormIsPinned(!formIsPinned)}
                  className={`p-2 rounded-xl transition cursor-pointer ${
                    formIsPinned
                      ? 'bg-white/25 text-white ring-1 ring-white/30'
                      : 'text-stone-300 hover:text-white hover:bg-black/20'
                  }`}
                  title={formIsPinned ? 'Pinned to top' : 'Pin to top'}
                >
                  <Pin className={`w-4 h-4 ${formIsPinned ? 'fill-current' : ''}`} />
                </button>

                {/* DELETE BUTTON (if editing existing note) */}
                {editingNote && (
                  <button
                    type="button"
                    onClick={() => {
                      onDeleteNote(editingNote.id);
                      handleCloseEditor();
                    }}
                    className="p-2 rounded-xl text-rose-300 hover:text-rose-100 hover:bg-rose-950/40 transition cursor-pointer"
                    title="Delete Note"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}

                {/* SAVE NOTE BUTTON */}
                <button
                  type="button"
                  onClick={() => handleSaveNote()}
                  className="h-8 sm:h-9 px-3.5 sm:px-4 rounded-xl bg-white text-stone-950 hover:bg-stone-100 active:scale-95 text-xs sm:text-sm font-black transition shadow-md cursor-pointer flex items-center gap-1.5 shrink-0"
                >
                  <Check className="w-3.5 h-3.5 sm:w-4 sm:h-4 stroke-[3]" />
                  <span>Save</span>
                </button>
              </div>
            </div>

            {/* COMPACT 1-LINE PASSWORD INPUT (Shown when Lock icon is tapped) */}
            {isPasswordBarOpen && (
              <div className="px-4 py-2.5 bg-black/35 backdrop-blur-xs border-b border-white/10 flex items-center justify-between gap-3 animate-fade-in shrink-0">
                <div className="flex items-center gap-2 flex-1 max-w-sm">
                  <Lock className="w-4 h-4 text-amber-300 shrink-0" />
                  <div className="relative flex-1">
                    <input
                      type={showPasswordText ? 'text' : 'password'}
                      placeholder="Set 4-digit PIN or password"
                      value={formPassword}
                      onChange={(e) => {
                        const val = e.target.value;
                        setFormPassword(val);
                        setFormHasPassword(val.trim().length > 0);
                      }}
                      className="w-full h-8 px-3 pr-8 text-xs bg-black/50 border border-white/20 rounded-lg text-white font-mono placeholder:text-stone-400 focus:outline-none focus:border-amber-400"
                      autoFocus
                    />
                    <button
                      type="button"
                      onClick={() => setShowPasswordText(!showPasswordText)}
                      className="absolute right-2 top-1/2 -translate-y-1/2 text-stone-400 hover:text-white cursor-pointer"
                    >
                      {showPasswordText ? (
                        <EyeOff className="w-3.5 h-3.5" />
                      ) : (
                        <Eye className="w-3.5 h-3.5" />
                      )}
                    </button>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  {formHasPassword && (
                    <button
                      type="button"
                      onClick={() => {
                        setFormPassword('');
                        setFormHasPassword(false);
                        setIsPasswordBarOpen(false);
                      }}
                      className="text-[11px] font-bold text-rose-300 hover:text-rose-200 underline cursor-pointer"
                    >
                      Remove Lock
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => {
                      if (formPassword.trim().length > 0) {
                        setFormHasPassword(true);
                      }
                      setIsPasswordBarOpen(false);
                    }}
                    className="px-3 py-1 rounded-lg bg-amber-400 hover:bg-amber-300 text-stone-950 text-xs font-black cursor-pointer shadow-xs"
                  >
                    Done
                  </button>
                </div>
              </div>
            )}

            {/* FULL NOTEPAD CANVAS: Maximized for writing notes */}
            <form
              onSubmit={handleSaveNote}
              className="flex-1 flex flex-col p-4 sm:p-7 overflow-y-auto space-y-3"
            >
              <input
                type="text"
                placeholder="Note Title..."
                value={formTitle}
                onChange={(e) => setFormTitle(e.target.value)}
                className={`w-full text-2xl sm:text-3xl font-black tracking-tight bg-transparent border-none outline-none focus:outline-none ${COLOR_THEMES[formColor].editorText}`}
                autoFocus={!editingNote}
              />

              <textarea
                placeholder="Start typing your note here..."
                value={formContent}
                onChange={(e) => setFormContent(e.target.value)}
                className={`w-full flex-1 min-h-[220px] sm:min-h-[460px] text-sm sm:text-base leading-relaxed bg-transparent border-none outline-none focus:outline-none resize-none font-medium ${COLOR_THEMES[formColor].editorBody}`}
              />
            </form>
          </div>
        </div>
      )}

      {/* ========================================================
          4. PASSWORD PROMPT MODAL (When tapping a locked note)
          ======================================================== */}
      {unlockTargetNote && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-xs flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-[#1e1b19] text-stone-100 w-full max-w-xs rounded-3xl p-6 shadow-2xl border border-stone-700 text-center space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-amber-500/20 text-amber-400 flex items-center justify-center mx-auto">
              <Lock className="w-6 h-6" />
            </div>

            <div>
              <h3 className="text-base font-bold text-white">Enter Note Password</h3>
              <p className="text-xs text-stone-400 mt-1">
                "{unlockTargetNote.title}" is password-protected.
              </p>
            </div>

            {unlockError && (
              <div className="text-xs text-rose-400 font-semibold bg-rose-950/40 p-2 rounded-xl border border-rose-800/60">
                {unlockError}
              </div>
            )}

            <div>
              <input
                type="password"
                placeholder="Enter password"
                value={enteredPassword}
                onChange={(e) => setEnteredPassword(e.target.value)}
                autoFocus
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleVerifyPassword();
                }}
                className="w-full h-11 text-center text-lg tracking-widest font-black bg-stone-900 border border-stone-700 rounded-xl text-white focus:outline-none focus:border-[#c4684d]"
              />
            </div>

            <div className="flex items-center gap-2 pt-2">
              <button
                type="button"
                onClick={() => {
                  setUnlockTargetNote(null);
                  setEnteredPassword('');
                  setUnlockError('');
                }}
                className="flex-1 h-10 rounded-xl bg-stone-800 text-stone-300 hover:bg-stone-700 text-xs font-bold cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleVerifyPassword}
                className="flex-1 h-10 rounded-xl bg-[#c4684d] hover:bg-[#b25b42] text-white text-xs font-bold transition shadow-sm cursor-pointer"
              >
                Unlock
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteTargetId && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white text-stone-900 w-full max-w-xs rounded-3xl p-5 shadow-2xl border border-stone-200 text-center space-y-3">
            <div className="w-10 h-10 rounded-2xl bg-rose-100 text-rose-600 flex items-center justify-center mx-auto">
              <Trash2 className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-stone-900">Delete this note?</h4>
              <p className="text-xs text-stone-500 mt-0.5">This action cannot be undone.</p>
            </div>
            <div className="flex items-center gap-2 pt-2">
              <button
                type="button"
                onClick={() => setDeleteTargetId(null)}
                className="flex-1 h-9 rounded-xl border border-stone-200 text-stone-600 text-xs font-bold hover:bg-stone-100 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  onDeleteNote(deleteTargetId);
                  setDeleteTargetId(null);
                }}
                className="flex-1 h-9 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold cursor-pointer"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
