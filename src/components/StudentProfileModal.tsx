import React, { useState } from 'react';
import {
  X,
  GraduationCap,
  Mail,
  Building,
  BookOpen,
  Smartphone,
  IndianRupee,
  RotateCcw,
  LogOut,
  HelpCircle,
  Download,
  ShieldCheck,
  Calendar,
  Edit2,
  Check,
} from 'lucide-react';
import { StudentUser } from '../types';
import { formatINR } from '../utils/formatters';

interface StudentProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: StudentUser;
  onUpdateUser?: (updated: StudentUser) => void;
  onOpenGuide?: () => void;
  onOpenSetupWizard?: () => void;
  onResetData: () => void;
  onLogout: () => void;
}

export const StudentProfileModal: React.FC<StudentProfileModalProps> = ({
  isOpen,
  onClose,
  user,
  onUpdateUser,
  onOpenGuide,
  onOpenSetupWizard,
  onResetData,
  onLogout,
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [name, setName] = useState(user.name);
  const [collegeName, setCollegeName] = useState(user.collegeName || '');
  const [course, setCourse] = useState(user.course || '');
  const [yearOfStudy, setYearOfStudy] = useState(user.yearOfStudy || '');
  const [upiId, setUpiId] = useState(user.upiId || '');

  if (!isOpen) return null;

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    const updated: StudentUser = {
      ...user,
      name: name.trim(),
      collegeName: collegeName.trim() || undefined,
      course: course.trim() || undefined,
      yearOfStudy: yearOfStudy.trim() || undefined,
      upiId: upiId.trim() || undefined,
    };
    if (onUpdateUser) {
      onUpdateUser(updated);
    }
    setIsEditing(false);
  };

  const handleExportData = () => {
    try {
      const allKeys = [
        'smm_pocket_money',
        'smm_wallets',
        'smm_transactions',
        'smm_room_expenses',
        'smm_roommates',
        'smm_meals',
        'smm_mess_config',
        'smm_udhaar',
        'smm_bills',
        'smm_goals',
      ];
      const exportObj: Record<string, any> = { user };
      allKeys.forEach((k) => {
        const item = localStorage.getItem(k);
        if (item) exportObj[k] = JSON.parse(item);
      });

      const blob = new Blob([JSON.stringify(exportObj, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `PocketBuddy_${user.name.replace(/\s+/g, '_')}_Backup.json`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Export failed:', err);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/70 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden my-6">
        {/* Header */}
        <div className="bg-slate-900 p-6 text-white relative border-b border-slate-800">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-1.5 rounded-full bg-white/10 hover:bg-white/20 text-white/80 hover:text-white transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-14 h-14 rounded-2xl bg-white/20 backdrop-blur-md border border-white/30 flex items-center justify-center font-black text-2xl text-white shadow-inner">
                {user.name ? user.name.charAt(0).toUpperCase() : 'S'}
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <h2 className="text-lg font-extrabold text-white tracking-tight">
                    {user.name || 'Student'}
                  </h2>
                  <span className="p-0.5 rounded-full bg-emerald-400 text-emerald-950" title="Active Student ID">
                    <ShieldCheck className="w-3.5 h-3.5" />
                  </span>
                </div>
                <p className="text-xs text-indigo-200 font-medium mt-0.5 flex items-center gap-1">
                  <GraduationCap className="w-3.5 h-3.5" />
                  {user.collegeName || 'Student Profile'}
                </p>
              </div>
            </div>

            <button
              onClick={() => setIsEditing(!isEditing)}
              className="px-2.5 py-1.5 rounded-xl bg-white/20 hover:bg-white/30 text-white text-xs font-bold transition flex items-center gap-1 cursor-pointer"
            >
              <Edit2 className="w-3 h-3" />
              <span>{isEditing ? 'Cancel' : 'Edit'}</span>
            </button>
          </div>

          <div className="mt-4 pt-3 border-t border-white/10 flex items-center justify-between text-xs text-indigo-200 font-medium">
            <span>Student ID: <code className="text-white font-bold bg-white/10 px-2 py-0.5 rounded">{user.id}</code></span>
            <span className="flex items-center gap-1">
              <Calendar className="w-3 h-3" />
              <span>Active</span>
            </span>
          </div>
        </div>

        {/* Profile Content */}
        <div className="p-6 space-y-4">
          {isEditing ? (
            <form onSubmit={handleSaveProfile} className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1">Full Name *</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-medium focus:ring-1 focus:ring-indigo-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1">College / Institute Name</label>
                <input
                  type="text"
                  placeholder="e.g. Delhi University / IIT / NIT"
                  value={collegeName}
                  onChange={(e) => setCollegeName(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-medium focus:ring-1 focus:ring-indigo-500 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1">Course / Stream</label>
                  <input
                    type="text"
                    placeholder="e.g. B.Tech / B.Com"
                    value={course}
                    onChange={(e) => setCourse(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-medium focus:ring-1 focus:ring-indigo-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1">Year / Semester</label>
                  <input
                    type="text"
                    placeholder="e.g. 2nd Year / Sem 4"
                    value={yearOfStudy}
                    onChange={(e) => setYearOfStudy(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-medium focus:ring-1 focus:ring-indigo-500 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1">UPI ID (For Room Settlements)</label>
                <input
                  type="text"
                  placeholder="e.g. student@okaxis"
                  value={upiId}
                  onChange={(e) => setUpiId(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-medium focus:ring-1 focus:ring-indigo-500 focus:outline-none"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsEditing(false)}
                  className="px-3 py-2 text-xs font-bold text-slate-500 hover:text-slate-800 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-indigo-600 text-white text-xs font-bold hover:bg-indigo-700 flex items-center gap-1 cursor-pointer"
                >
                  <Check className="w-3.5 h-3.5" />
                  <span>Save Profile</span>
                </button>
              </div>
            </form>
          ) : (
            <div className="space-y-2.5 text-xs">
              <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 border border-slate-200/80">
                <span className="text-slate-500 flex items-center gap-1.5 font-medium">
                  <Mail className="w-3.5 h-3.5 text-slate-400" />
                  Email / Login
                </span>
                <span className="font-bold text-slate-800">{user.email}</span>
              </div>

              <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 border border-slate-200/80">
                <span className="text-slate-500 flex items-center gap-1.5 font-medium">
                  <Building className="w-3.5 h-3.5 text-slate-400" />
                  College
                </span>
                <span className="font-bold text-slate-800">{user.collegeName || 'Not specified'}</span>
              </div>

              <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 border border-slate-200/80">
                <span className="text-slate-500 flex items-center gap-1.5 font-medium">
                  <BookOpen className="w-3.5 h-3.5 text-slate-400" />
                  Course &amp; Year
                </span>
                <span className="font-bold text-slate-800">
                  {user.course ? `${user.course} ${user.yearOfStudy ? `(${user.yearOfStudy})` : ''}` : 'Not specified'}
                </span>
              </div>

              <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 border border-slate-200/80">
                <span className="text-slate-500 flex items-center gap-1.5 font-medium">
                  <Smartphone className="w-3.5 h-3.5 text-slate-400" />
                  Room Split UPI ID
                </span>
                <span className="font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded-md border border-indigo-200">
                  {user.upiId || 'Not set'}
                </span>
              </div>

              <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 border border-slate-200/80">
                <span className="text-slate-500 flex items-center gap-1.5 font-medium">
                  <IndianRupee className="w-3.5 h-3.5 text-slate-400" />
                  Monthly Pocket Money
                </span>
                <span className="font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                  {formatINR(user.monthlyPocketMoney || 0)} / mo
                </span>
              </div>
            </div>
          )}

          {/* Quick Actions */}
          <div className="pt-2 border-t border-slate-100 space-y-2">
            {onOpenSetupWizard && (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onOpenSetupWizard();
                }}
                className="w-full py-2.5 px-3 rounded-xl bg-violet-50 hover:bg-violet-100 text-violet-700 border border-violet-200 text-xs font-bold transition flex items-center justify-center gap-2 cursor-pointer"
              >
                <Edit2 className="w-4 h-4 text-violet-600" />
                <span>Re-run Student Setup Wizard</span>
              </button>
            )}

            <button
              type="button"
              onClick={handleExportData}
              className="w-full py-2.5 px-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold transition flex items-center justify-center gap-2 cursor-pointer"
            >
              <Download className="w-4 h-4 text-slate-600" />
              <span>Export My Financial Data (.JSON)</span>
            </button>

            <div className="grid grid-cols-2 gap-2 pt-1">
              <button
                type="button"
                onClick={() => {
                  if (window.confirm('Are you sure you want to reset all your records to start fresh?')) {
                    onResetData();
                    onClose();
                  }
                }}
                className="py-2.5 px-3 rounded-xl bg-amber-50 hover:bg-amber-100 border border-amber-200 text-amber-800 text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Reset All Data</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  onClose();
                  onLogout();
                }}
                className="py-2.5 px-3 rounded-xl bg-rose-50 hover:bg-rose-100 border border-rose-200 text-rose-700 text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Log Out</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
