import React, { useState, useEffect } from 'react';
import {
  X,
  Database,
  Users,
  Home,
  FileCode,
  Search,
  RefreshCw,
  Download,
  Copy,
  Check,
  Calendar,
  Phone,
  Mail,
  Shield,
  Layers,
  Sparkles,
} from 'lucide-react';

interface DatabaseUser {
  id: string;
  name: string;
  email: string;
  phone: string;
  collegeName: string;
  course: string;
  upiId: string;
  createdAt: string;
  registeredAtFormatted: string;
  joinedRoomsCount: number;
  ownedRoomsCount: number;
}

interface DatabaseRoomMember {
  name: string;
  role: string;
  email: string;
  phone: string;
  joinedAt: string;
}

interface DatabaseRoom {
  id: string;
  name: string;
  type: string;
  inviteCode: string;
  ownerId: string;
  ownerName: string;
  membersCount: number;
  members: DatabaseRoomMember[];
  expensesCount: number;
  totalExpensesAmount: number;
  createdAt: string;
}

interface DatabasePayload {
  success: boolean;
  totalUsers: number;
  totalRooms: number;
  users: DatabaseUser[];
  rooms: DatabaseRoom[];
  storageFiles: {
    usersFile: string;
    roomsFile: string;
  };
  lastUpdated: string;
}

interface DatabaseViewerModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const DatabaseViewerModal: React.FC<DatabaseViewerModalProps> = ({
  isOpen,
  onClose,
}) => {
  const [activeTab, setActiveTab] = useState<'users' | 'rooms' | 'raw'>('users');
  const [searchQuery, setSearchQuery] = useState('');
  const [dbData, setDbData] = useState<DatabasePayload | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copiedText, setCopiedText] = useState<string | null>(null);
  const [rawViewTarget, setRawViewTarget] = useState<'users' | 'rooms'>('users');

  const fetchDatabase = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/admin/database');
      if (!res.ok) {
        throw new Error(`Server returned HTTP ${res.status}`);
      }
      const data: DatabasePayload = await res.json();
      setDbData(data);
    } catch (err: any) {
      console.error('Error fetching database:', err);
      setError(err?.message || 'Could not load database records.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchDatabase();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleCopy = (text: string, label: string) => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(text);
      setCopiedText(label);
      setTimeout(() => setCopiedText(null), 2000);
    }
  };

  const handleDownloadJson = (filename: string, dataObj: any) => {
    const jsonStr = JSON.stringify(dataObj, null, 2);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // Filter users by search query
  const filteredUsers = (dbData?.users || []).filter((u) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      u.name?.toLowerCase().includes(q) ||
      u.email?.toLowerCase().includes(q) ||
      u.phone?.toLowerCase().includes(q) ||
      u.upiId?.toLowerCase().includes(q) ||
      u.collegeName?.toLowerCase().includes(q)
    );
  });

  // Filter rooms by search query
  const filteredRooms = (dbData?.rooms || []).filter((r) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      r.name?.toLowerCase().includes(q) ||
      r.inviteCode?.toLowerCase().includes(q) ||
      r.ownerName?.toLowerCase().includes(q)
    );
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/60 backdrop-blur-xs animate-fade-in">
      <div
        id="database-viewer-modal"
        className="bg-white w-full max-w-4xl rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[92vh]"
      >
        {/* Modal Header */}
        <div className="px-5 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-900 text-white">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-red-600/90 text-white flex items-center justify-center shadow-xs">
              <Database className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-extrabold text-base sm:text-lg text-white">
                  Database & Registered Users
                </h3>
                <span className="hidden sm:inline-block px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  Live JSON Storage
                </span>
              </div>
              <p className="text-xs text-slate-300 mt-0.5">
                Path: <code className="text-red-300 font-mono">data_store/users.json</code> & <code className="text-red-300 font-mono">data_store/rooms.json</code>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={fetchDatabase}
              disabled={isLoading}
              className="h-8 px-2.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white border border-slate-700 text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer"
              title="Refresh database"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin text-red-400' : ''}`} />
              <span className="hidden sm:inline">Refresh</span>
            </button>

            <button
              type="button"
              onClick={onClose}
              className="w-8 h-8 flex items-center justify-center text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
              aria-label="Close dialog"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Stats Summary Bar */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 p-4 bg-slate-50 border-b border-slate-200 text-slate-800">
          <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-2xs">
            <div className="text-[11px] font-medium text-slate-500 flex items-center gap-1.5">
              <Users className="w-3.5 h-3.5 text-red-600" />
              <span>Registered Users</span>
            </div>
            <div className="text-lg font-extrabold text-slate-900 mt-1">
              {dbData?.totalUsers ?? '...'}
            </div>
          </div>

          <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-2xs">
            <div className="text-[11px] font-medium text-slate-500 flex items-center gap-1.5">
              <Home className="w-3.5 h-3.5 text-blue-600" />
              <span>Created Rooms</span>
            </div>
            <div className="text-lg font-extrabold text-slate-900 mt-1">
              {dbData?.totalRooms ?? '...'}
            </div>
          </div>

          <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-2xs">
            <div className="text-[11px] font-medium text-slate-500 flex items-center gap-1.5">
              <Layers className="w-3.5 h-3.5 text-emerald-600" />
              <span>Storage Type</span>
            </div>
            <div className="text-xs font-bold text-slate-800 mt-1.5 truncate">
              Persistent JSON File
            </div>
          </div>

          <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-2xs">
            <div className="text-[11px] font-medium text-slate-500 flex items-center gap-1.5">
              <Shield className="w-3.5 h-3.5 text-purple-600" />
              <span>Security</span>
            </div>
            <div className="text-xs font-bold text-emerald-700 mt-1.5 flex items-center gap-1">
              <span>Encrypted Hashes</span>
            </div>
          </div>
        </div>

        {/* Navigation Tabs & Search Toolbar */}
        <div className="px-5 py-3 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white">
          <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-xl">
            <button
              type="button"
              onClick={() => setActiveTab('users')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                activeTab === 'users'
                  ? 'bg-white text-slate-900 shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Users className="w-3.5 h-3.5 text-red-600" />
              <span>Users ({dbData?.totalUsers || 0})</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('rooms')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                activeTab === 'rooms'
                  ? 'bg-white text-slate-900 shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Home className="w-3.5 h-3.5 text-blue-600" />
              <span>Rooms ({dbData?.totalRooms || 0})</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('raw')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                activeTab === 'raw'
                  ? 'bg-white text-slate-900 shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <FileCode className="w-3.5 h-3.5 text-slate-600" />
              <span>Raw JSON</span>
            </button>
          </div>

          {activeTab !== 'raw' && (
            <div className="relative flex-1 sm:max-w-xs">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={activeTab === 'users' ? 'Search by name, email, phone...' : 'Search rooms, invite codes...'}
                className="w-full bg-slate-50 border border-slate-300 rounded-lg pl-8 pr-3 py-1.5 text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-900 focus:bg-white"
              />
            </div>
          )}

          {activeTab === 'raw' && (
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-lg text-xs">
                <button
                  type="button"
                  onClick={() => setRawViewTarget('users')}
                  className={`px-2.5 py-1 rounded-md font-semibold transition cursor-pointer ${
                    rawViewTarget === 'users' ? 'bg-white shadow-2xs text-slate-900' : 'text-slate-500'
                  }`}
                >
                  users.json
                </button>
                <button
                  type="button"
                  onClick={() => setRawViewTarget('rooms')}
                  className={`px-2.5 py-1 rounded-md font-semibold transition cursor-pointer ${
                    rawViewTarget === 'rooms' ? 'bg-white shadow-2xs text-slate-900' : 'text-slate-500'
                  }`}
                >
                  rooms.json
                </button>
              </div>

              <button
                type="button"
                onClick={() =>
                  handleDownloadJson(
                    rawViewTarget === 'users' ? 'users.json' : 'rooms.json',
                    rawViewTarget === 'users' ? dbData?.users : dbData?.rooms
                  )
                }
                className="h-8 px-2.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer shadow-2xs"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Export JSON</span>
              </button>
            </div>
          )}
        </div>

        {/* Modal Body / Tab Content */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          {error && (
            <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-medium">
              ⚠️ {error}
            </div>
          )}

          {/* TAB 1: USERS */}
          {activeTab === 'users' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between text-xs text-slate-500 px-1">
                <span>Showing {filteredUsers.length} of {dbData?.totalUsers || 0} registered user accounts</span>
                <span className="text-[11px] text-slate-400">All registered credentials stored in data_store/users.json</span>
              </div>

              {filteredUsers.length === 0 ? (
                <div className="text-center py-12 bg-slate-50 rounded-2xl border border-slate-200 space-y-2">
                  <Users className="w-8 h-8 text-slate-400 mx-auto" />
                  <p className="text-xs font-bold text-slate-700">No users found</p>
                  <p className="text-[11px] text-slate-400">Try changing your search keywords.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {filteredUsers.map((u, idx) => {
                    const initials = (u.name || 'U').charAt(0).toUpperCase();
                    return (
                      <div
                        key={u.id || idx}
                        className="p-4 rounded-xl bg-white border border-slate-200 hover:border-slate-300 shadow-2xs space-y-3 transition"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex items-center gap-2.5">
                            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-red-600 to-rose-500 text-white font-black text-sm flex items-center justify-center shrink-0 shadow-xs">
                              {initials}
                            </div>
                            <div className="min-w-0">
                              <h4 className="text-sm font-bold text-slate-900 truncate">
                                {u.name}
                              </h4>
                              <p className="text-[11px] text-slate-500 truncate">
                                {u.collegeName || 'Student'}
                              </p>
                            </div>
                          </div>

                          <div className="flex flex-col items-end gap-1">
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-slate-100 text-slate-700">
                              #{idx + 1}
                            </span>
                          </div>
                        </div>

                        {/* Contact & ID Details */}
                        <div className="grid grid-cols-1 gap-1.5 text-xs pt-1 border-t border-slate-100">
                          {/* Email */}
                          <div className="flex items-center justify-between gap-2 text-slate-600">
                            <span className="flex items-center gap-1.5 text-[11px] text-slate-400">
                              <Mail className="w-3 h-3" />
                              <span>Email:</span>
                            </span>
                            <span className="font-semibold text-slate-800 truncate select-all">
                              {u.email || 'None'}
                            </span>
                          </div>

                          {/* Phone */}
                          <div className="flex items-center justify-between gap-2 text-slate-600">
                            <span className="flex items-center gap-1.5 text-[11px] text-slate-400">
                              <Phone className="w-3 h-3" />
                              <span>Mobile:</span>
                            </span>
                            <span className="font-semibold text-slate-800 select-all">
                              {u.phone || 'None'}
                            </span>
                          </div>

                          {/* UPI ID */}
                          <div className="flex items-center justify-between gap-2 text-slate-600">
                            <span className="flex items-center gap-1.5 text-[11px] text-slate-400">
                              <span className="font-bold text-[10px]">UPI</span>
                              <span>UPI ID:</span>
                            </span>
                            <span className="font-mono text-[11px] font-medium text-slate-800 select-all">
                              {u.upiId || 'Not configured'}
                            </span>
                          </div>

                          {/* Registration Date/Time */}
                          <div className="flex items-center justify-between gap-2 text-slate-600">
                            <span className="flex items-center gap-1.5 text-[11px] text-slate-400">
                              <Calendar className="w-3 h-3 text-red-500" />
                              <span>Registered:</span>
                            </span>
                            <span className="font-semibold text-slate-800 text-[11px]">
                              {u.registeredAtFormatted}
                            </span>
                          </div>
                        </div>

                        {/* Badges / Stats */}
                        <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[11px]">
                          <span className="text-slate-400 font-mono text-[10px]">
                            ID: {u.id}
                          </span>
                          <span className="inline-flex items-center gap-1 font-semibold text-slate-600 bg-slate-50 px-2 py-0.5 rounded-md border border-slate-200">
                            <Home className="w-3 h-3 text-blue-500" />
                            <span>{u.joinedRoomsCount} Room(s)</span>
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* TAB 2: ROOMS */}
          {activeTab === 'rooms' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between text-xs text-slate-500 px-1">
                <span>Showing {filteredRooms.length} of {dbData?.totalRooms || 0} rooms</span>
                <span className="text-[11px] text-slate-400">Stored in data_store/rooms.json</span>
              </div>

              {filteredRooms.length === 0 ? (
                <div className="text-center py-12 bg-slate-50 rounded-2xl border border-slate-200 space-y-2">
                  <Home className="w-8 h-8 text-slate-400 mx-auto" />
                  <p className="text-xs font-bold text-slate-700">No rooms found</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {filteredRooms.map((r) => (
                    <div
                      key={r.id}
                      className="p-4 rounded-xl bg-white border border-slate-200 shadow-2xs space-y-3"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <div className="flex items-center gap-2">
                            <h4 className="text-sm font-bold text-slate-900">{r.name}</h4>
                            <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-200">
                              {r.type}
                            </span>
                          </div>
                          <p className="text-[11px] text-slate-400 mt-0.5">
                            Created by: <strong className="text-slate-700">{r.ownerName}</strong>
                          </p>
                        </div>

                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => handleCopy(r.inviteCode, r.id)}
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-mono font-bold cursor-pointer transition shadow-2xs"
                            title="Copy Room Code"
                          >
                            <span>{r.inviteCode}</span>
                            {copiedText === r.id ? (
                              <Check className="w-3 h-3 text-emerald-600" />
                            ) : (
                              <Copy className="w-3 h-3 text-slate-400" />
                            )}
                          </button>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-2 p-2.5 rounded-lg bg-slate-50 border border-slate-100 text-xs">
                        <div>
                          <span className="text-[10px] text-slate-400 block">Members</span>
                          <span className="font-bold text-slate-800">{r.membersCount} roommates</span>
                        </div>
                        <div>
                          <span className="text-[10px] text-slate-400 block">Total Expenses</span>
                          <span className="font-bold text-emerald-700">₹{r.totalExpensesAmount.toLocaleString('en-IN')}</span>
                        </div>
                      </div>

                      {/* Members pill list */}
                      <div className="space-y-1">
                        <span className="text-[10px] font-semibold text-slate-400 block uppercase">
                          Room Members
                        </span>
                        <div className="flex flex-wrap gap-1">
                          {r.members.map((m, mIdx) => (
                            <span
                              key={mIdx}
                              className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-semibold ${
                                m.role === 'owner'
                                  ? 'bg-amber-100 text-amber-900 border border-amber-200'
                                  : 'bg-slate-100 text-slate-700'
                              }`}
                            >
                              <span>{m.name}</span>
                              {m.role === 'owner' && <span className="text-[9px] font-bold text-amber-700">👑 Admin</span>}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB 3: RAW JSON VIEWER */}
          {activeTab === 'raw' && (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs text-slate-500">
                <span>Live contents of <code className="font-mono text-red-600">{rawViewTarget === 'users' ? 'data_store/users.json' : 'data_store/rooms.json'}</code></span>
                <button
                  type="button"
                  onClick={() =>
                    handleCopy(
                      JSON.stringify(rawViewTarget === 'users' ? dbData?.users : dbData?.rooms, null, 2),
                      'raw-json'
                    )
                  }
                  className="inline-flex items-center gap-1 text-slate-700 hover:text-slate-900 font-semibold cursor-pointer"
                >
                  {copiedText === 'raw-json' ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-600" />
                      <span>Copied!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      <span>Copy Full JSON</span>
                    </>
                  )}
                </button>
              </div>

              <pre className="p-4 bg-slate-950 text-emerald-400 font-mono text-xs rounded-xl overflow-x-auto max-h-[50vh] border border-slate-800 leading-relaxed">
                {JSON.stringify(rawViewTarget === 'users' ? dbData?.users : dbData?.rooms, null, 2)}
              </pre>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-5 py-3 border-t border-slate-200 bg-slate-50 flex items-center justify-between text-xs text-slate-500">
          <span>
            API Endpoint: <a href="/api/admin/database" target="_blank" rel="noreferrer" className="text-red-600 font-semibold hover:underline">/api/admin/database</a>
          </span>
          <button
            type="button"
            onClick={onClose}
            className="py-1.5 px-4 rounded-lg bg-slate-900 hover:bg-slate-800 text-white font-bold transition cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
