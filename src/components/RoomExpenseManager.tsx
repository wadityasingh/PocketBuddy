import React, { useState, useMemo } from 'react';
import {
  Users,
  Plus,
  Share2,
  Copy,
  Check,
  Trash2,
  Edit2,
  Receipt,
  Home,
  UserPlus,
  Calendar,
  X,
  ExternalLink,
  ChevronDown,
  Settings,
  Handshake,
  ArrowUpRight,
  ArrowDownLeft,
  Building2,
  CheckCircle2,
  AlertCircle,
  ShoppingCart,
  Zap,
  Wifi,
  Droplets,
  Flame,
  Sparkles,
  HeartPulse,
  MoreVertical,
  LogOut,
  History,
  Clock,
  RefreshCw,
  Shield,
  AlertTriangle,
  UserMinus,
  Loader2,
  Lock,
  Info,
  Wallet,
  Bell,
} from 'lucide-react';
import {
  RoomGroup,
  RoomExpense,
  Roommate,
  RoomParticipant,
  RoomSplitMethod,
  StudentUser,
} from '../types';
import { formatINR, formatDate, formatDateTime, generateId } from '../utils/formatters';

interface RoomExpenseManagerProps {
  currentRoom: RoomGroup | null;
  allRooms: RoomGroup[];
  currentUser: StudentUser | null;
  currentUserName: string;
  currentUserUpi?: string;
  currentUserPhone?: string;
  onCreateRoom: (name: string, type?: string) => Promise<void>;
  onJoinRoom: (code: string) => Promise<void>;
  onSelectRoom: (roomId: string) => void;
  onAddOrUpdateExpense: (expense: RoomExpense) => Promise<void>;
  onDeleteExpense: (expenseId: string) => Promise<void>;
  onAddRoommate: (name: string, upiId?: string, phone?: string) => Promise<void>;
  onRemoveRoommate: (roommateId: string) => Promise<void>;
  onSettleDebt: (
    fromUserId: string,
    from: string,
    toUserId: string,
    to: string,
    amount: number,
    note?: string,
    mode?: 'UPI' | 'Cash'
  ) => Promise<void>;
  onAcceptSettlement?: (settleId: string) => Promise<void>;
  onRejectSettlement?: (settleId: string) => Promise<void>;
  onDeleteSettlement: (settleId: string) => Promise<void>;
  onDeleteRoom: (roomId: string) => Promise<any>;
  onLeaveRoom?: (roomId: string) => Promise<any>;
  onOpenAiCoach?: (initialQuery?: string) => void;
  onRefreshRooms?: () => Promise<void> | void;
}

export const RoomExpenseManager: React.FC<RoomExpenseManagerProps> = ({
  currentRoom,
  allRooms,
  currentUser,
  currentUserName,
  currentUserUpi,
  currentUserPhone,
  onCreateRoom,
  onJoinRoom,
  onSelectRoom,
  onAddOrUpdateExpense,
  onDeleteExpense,
  onAddRoommate,
  onRemoveRoommate,
  onSettleDebt,
  onAcceptSettlement,
  onRejectSettlement,
  onDeleteSettlement,
  onDeleteRoom,
  onLeaveRoom,
  onRefreshRooms,
}) => {
  const effectiveUserName = currentUser?.name || currentUserName || 'You';
  const effectiveUserId = currentUser?.id;

  // Modals state
  const [isAddExpenseOpen, setIsAddExpenseOpen] = useState(false);
  const [activeListTab, setActiveListTab] = useState<'expenses' | 'history'>('expenses');
  const [editingExpense, setEditingExpense] = useState<RoomExpense | null>(null);
  const [viewingExpense, setViewingExpense] = useState<RoomExpense | null>(null);
  const [isSettleModalOpen, setIsSettleModalOpen] = useState(false);
  const [isCreateRoomOpen, setIsCreateRoomOpen] = useState(false);
  const [isJoinRoomOpen, setIsJoinRoomOpen] = useState(false);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
  const [isAddRoommateOpen, setIsAddRoommateOpen] = useState(false);
  const [deleteConfirmExpense, setDeleteConfirmExpense] = useState<RoomExpense | null>(null);

  // In-app confirmation dialogs (eliminating window.confirm which is blocked in iframes)
  const [deleteConfirmRoom, setDeleteConfirmRoom] = useState<RoomGroup | null>(null);
  const [leaveConfirmRoom, setLeaveConfirmRoom] = useState<RoomGroup | null>(null);
  const [removeMemberConfirm, setRemoveMemberConfirm] = useState<{ id: string; name: string } | null>(null);
  const [isDeletingRoom, setIsDeletingRoom] = useState(false);
  const [isLeavingRoom, setIsLeavingRoom] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  // Copy feedback state
  const [copiedCode, setCopiedCode] = useState(false);
  const [copiedMessage, setCopiedMessage] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleManualRefresh = async () => {
    setIsRefreshing(true);
    try {
      if (onRefreshRooms) {
        await onRefreshRooms();
      }
    } catch (e) {
      console.warn('Manual refresh warning:', e);
    } finally {
      setTimeout(() => setIsRefreshing(false), 600);
    }
  };

  // Form states: Settle Up
  const [settlePayer, setSettlePayer] = useState('');
  const [settleReceiver, setSettleReceiver] = useState('');
  const [settleAmount, setSettleAmount] = useState('');
  const [settleMode, setSettleMode] = useState<'UPI' | 'Cash'>('UPI');
  const [settleNote, setSettleNote] = useState('');
  const [settleError, setSettleError] = useState('');
  const [settleDebtType, setSettleDebtType] = useState<'pay' | 'receive' | 'all'>('pay');
  const [isSubmittingSettle, setIsSubmittingSettle] = useState(false);

  // Expense detail modal state for viewing full notes, splits, breakdown
  const [selectedDetailExpense, setSelectedDetailExpense] = useState<RoomExpense | null>(null);

  // Form states: Create Room
  const [newRoomName, setNewRoomName] = useState('');
  const [newRoomType, setNewRoomType] = useState('Flat / Apartment');
  const [createRoomError, setCreateRoomError] = useState('');
  const [isCreatingRoom, setIsCreatingRoom] = useState(false);

  // Form states: Join Room
  const [joinCode, setJoinCode] = useState('');
  const [joinError, setJoinError] = useState('');
  const [isJoiningRoom, setIsJoiningRoom] = useState(false);

  // Form states: Add Roommate
  const [newMemberName, setNewMemberName] = useState('');
  const [newMemberUpi, setNewMemberUpi] = useState('');
  const [newMemberPhone, setNewMemberPhone] = useState('');
  const [addMemberError, setAddMemberError] = useState('');

  // Expense Form State
  const [expenseTitle, setExpenseTitle] = useState('');
  const [expenseAmount, setExpenseAmount] = useState('');
  const [expenseDate, setExpenseDate] = useState(new Date().toISOString().split('T')[0]);
  const [expensePaidBy, setExpensePaidBy] = useState('');
  const [expenseSplitType, setExpenseSplitType] = useState<RoomSplitMethod>('equal');
  const [selectedParticipantIds, setSelectedParticipantIds] = useState<string[]>([]);
  const [exactShares, setExactShares] = useState<Record<string, string>>({});
  const [expenseNotes, setExpenseNotes] = useState('');
  const [expenseFormError, setExpenseFormError] = useState('');

  const members: Roommate[] = useMemo(() => {
    if (!currentRoom || !Array.isArray(currentRoom.members)) return [];
    return currentRoom.members;
  }, [currentRoom]);

  const expenses: RoomExpense[] = useMemo(() => {
    if (!currentRoom || !Array.isArray(currentRoom.expenses)) return [];
    return currentRoom.expenses;
  }, [currentRoom]);

  const todayDateStr = useMemo(() => new Date().toISOString().split('T')[0], []);
  const yesterdayDateStr = useMemo(() => new Date(Date.now() - 86400000).toISOString().split('T')[0], []);

  const getMonthLabel = (mKey: string) => {
    try {
      const [year, month] = mKey.split('-').map(Number);
      if (!year || !month) return mKey;
      const d = new Date(year, month - 1, 1);
      return d.toLocaleDateString('en-IN', { month: 'long', year: 'numeric' });
    } catch {
      return mKey;
    }
  };

  // Group room expenses by Month and Date with Total Spent header (Matching History tab)
  const groupedExpenses = useMemo(() => {
    const sorted = [...expenses].sort((a, b) => (b.date || '').localeCompare(a.date || ''));

    const monthMap: Record<
      string,
      {
        monthKey: string;
        monthLabel: string;
        totalSpent: number;
        dateGroups: {
          dateKey: string;
          displayDate: string;
          totalSpent: number;
          items: RoomExpense[];
        }[];
      }
    > = {};
    const monthOrder: string[] = [];

    sorted.forEach((exp) => {
      const dKey = exp.date || 'no-date';
      const mKey = dKey !== 'no-date' && dKey.length >= 7 ? dKey.slice(0, 7) : 'undated';

      if (!monthMap[mKey]) {
        monthMap[mKey] = {
          monthKey: mKey,
          monthLabel: getMonthLabel(mKey),
          totalSpent: 0,
          dateGroups: [],
        };
        monthOrder.push(mKey);
      }

      const monthObj = monthMap[mKey];
      const amount = Number(exp.totalAmount || exp.amount || 0);
      monthObj.totalSpent += amount;

      let dateGroup = monthObj.dateGroups.find((dg) => dg.dateKey === dKey);
      if (!dateGroup) {
        let friendlyDate = dKey;
        if (dKey === todayDateStr) {
          friendlyDate = `Today, ${formatDate(dKey)}`;
        } else if (dKey === yesterdayDateStr) {
          friendlyDate = `Yesterday, ${formatDate(dKey)}`;
        } else if (dKey !== 'no-date') {
          friendlyDate = formatDate(dKey);
        } else {
          friendlyDate = 'Undated';
        }

        dateGroup = {
          dateKey: dKey,
          displayDate: friendlyDate,
          totalSpent: 0,
          items: [],
        };
        monthObj.dateGroups.push(dateGroup);
      }

      dateGroup.totalSpent += amount;
      dateGroup.items.push(exp);
    });

    return monthOrder.map((key) => monthMap[key]);
  }, [expenses, todayDateStr, yesterdayDateStr]);

  const settlements = useMemo(() => {
    if (!currentRoom || !Array.isArray(currentRoom.settlements)) return [];
    return currentRoom.settlements;
  }, [currentRoom]);

  const activities = useMemo(() => {
    if (!currentRoom || !Array.isArray(currentRoom.activities)) return [];
    return currentRoom.activities;
  }, [currentRoom]);

  // Member balance calculations (Accurate to the rupee/paise)
  const memberBalances = useMemo(() => {
    const balances: Record<
      string,
      { totalPaid: number; totalShare: number; settledPaid: number; settledReceived: number; net: number }
    > = {};

    const findMemberKey = (nameOrId?: string, userId?: string): string => {
      if (!nameOrId && !userId) return members[0]?.name || 'Unknown';
      const clean = (nameOrId || '').toLowerCase().replace(/\s*\(you\)\s*/g, '').trim();
      const found = members.find((m) => {
        const mClean = m.name.toLowerCase().replace(/\s*\(you\)\s*/g, '').trim();
        if (userId && (m.userId === userId || m.id === userId)) return true;
        if (clean && (mClean === clean || m.id.toLowerCase() === clean || (m.userId && m.userId.toLowerCase() === clean))) return true;
        if ((clean === 'you' || clean === effectiveUserName.toLowerCase()) && (m.isSelf || m.name.toLowerCase() === effectiveUserName.toLowerCase())) return true;
        return false;
      });
      return found ? found.name : nameOrId || 'Unknown';
    };

    members.forEach((m) => {
      balances[m.name] = {
        totalPaid: 0,
        totalShare: 0,
        settledPaid: 0,
        settledReceived: 0,
        net: 0,
      };
    });

    expenses.forEach((exp) => {
      const payerKey = findMemberKey(exp.paidBy, exp.paidByUserId);
      if (!balances[payerKey]) {
        balances[payerKey] = { totalPaid: 0, totalShare: 0, settledPaid: 0, settledReceived: 0, net: 0 };
      }
      balances[payerKey].totalPaid += Number(exp.totalAmount || exp.amount || 0);

      if (Array.isArray(exp.participants)) {
        exp.participants.forEach((p) => {
          const pKey = findMemberKey(p.name, p.userId);
          if (!balances[pKey]) {
            balances[pKey] = { totalPaid: 0, totalShare: 0, settledPaid: 0, settledReceived: 0, net: 0 };
          }
          balances[pKey].totalShare += Number(p.share || 0);
        });
      }
    });

    settlements.forEach((s) => {
      // Settle Up Confirmation: Only completed settlements count towards balances!
      // Pending, cancelled, or rejected settlements MUST NOT clear/reduce debts until accepted!
      if (!s || s.status === 'pending' || s.status === 'cancelled' || s.status === 'rejected') return;
      const fromKey = findMemberKey(s.from, s.fromUserId);
      const toKey = findMemberKey(s.to, s.toUserId);
      if (!balances[fromKey]) {
        balances[fromKey] = { totalPaid: 0, totalShare: 0, settledPaid: 0, settledReceived: 0, net: 0 };
      }
      if (!balances[toKey]) {
        balances[toKey] = { totalPaid: 0, totalShare: 0, settledPaid: 0, settledReceived: 0, net: 0 };
      }
      balances[fromKey].settledPaid += Number(s.amount || 0);
      balances[toKey].settledReceived += Number(s.amount || 0);
    });

    // Net: (totalPaid + settledPaid) - (totalShare + settledReceived)
    members.forEach((m) => {
      const b = balances[m.name];
      if (b) {
        b.net = b.totalPaid + b.settledPaid - (b.totalShare + b.settledReceived);
      }
    });

    return balances;
  }, [members, expenses, settlements, effectiveUserName]);

  // Pairwise debt settlements ("Who owes whom / Kisko dena hai, kisko lena hai")
  const debts = useMemo(() => {
    const debtors: { name: string; amount: number }[] = [];
    const creditors: { name: string; amount: number }[] = [];

    members.forEach((m) => {
      const b = memberBalances[m.name];
      if (!b) return;
      if (b.net < -0.9) {
        debtors.push({ name: m.name, amount: Math.abs(b.net) });
      } else if (b.net > 0.9) {
        creditors.push({ name: m.name, amount: b.net });
      }
    });

    debtors.sort((a, b) => b.amount - a.amount);
    creditors.sort((a, b) => b.amount - a.amount);

    const result: { from: string; to: string; amount: number }[] = [];
    let i = 0;
    let j = 0;

    // Clone arrays so we don't mutate original objects
    const dList = debtors.map((d) => ({ ...d }));
    const cList = creditors.map((c) => ({ ...c }));

    while (i < dList.length && j < cList.length) {
      const debtor = dList[i];
      const creditor = cList[j];
      const settledAmount = Math.min(debtor.amount, creditor.amount);

      if (settledAmount > 0.5) {
        result.push({
          from: debtor.name,
          to: creditor.name,
          amount: Math.round(settledAmount),
        });
      }

      debtor.amount -= settledAmount;
      creditor.amount -= settledAmount;

      if (debtor.amount < 0.9) i++;
      if (creditor.amount < 0.9) j++;
    }

    return result;
  }, [members, memberBalances]);

  const selfMember = useMemo(() => {
    return (
      members.find(
        (m) =>
          m.isSelf ||
          (effectiveUserId && (m.userId === effectiveUserId || m.id === effectiveUserId || m.id === 'rm_' + effectiveUserId)) ||
          (currentUser?.id && (m.userId === currentUser.id || m.id === currentUser.id || m.id === 'rm_' + currentUser.id))
      ) ||
      members.find(
        (m) =>
          Boolean(currentUser?.email && m.email && m.email.toLowerCase() === currentUser.email.toLowerCase())
      ) ||
      members.find((m) => m.name.toLowerCase() === effectiveUserName.toLowerCase()) ||
      members.find((m) => Boolean(currentUser?.name && m.name.toLowerCase() === currentUser.name.toLowerCase())) ||
      members.find((m) => m.name.toLowerCase() === 'you')
    );
  }, [members, effectiveUserId, effectiveUserName, currentUser]);

  // Active user's standing and compact balance summary
  const myStanding = useMemo(() => {
    const selfKey = selfMember?.name || effectiveUserName;
    return (
      memberBalances[selfKey] ||
      memberBalances[effectiveUserName] ||
      memberBalances['You'] ||
      memberBalances['you'] || {
        totalPaid: 0,
        totalShare: 0,
        settledPaid: 0,
        settledReceived: 0,
        net: 0,
      }
    );
  }, [memberBalances, selfMember, effectiveUserName]);

  const selfNames = useMemo(() => {
    const set = new Set<string>();
    set.add('you');
    if (effectiveUserName) set.add(effectiveUserName.toLowerCase().trim());
    if (currentUser?.name) set.add(currentUser.name.toLowerCase().trim());
    if (selfMember?.name) set.add(selfMember.name.toLowerCase().trim());
    return set;
  }, [effectiveUserName, selfMember, currentUser]);

  // Debts payable by logged-in user and receivable by logged-in user
  const myPayableDebts = useMemo(() => {
    return debts.filter((d) => selfNames.has(d.from.toLowerCase()));
  }, [debts, selfNames]);

  const myReceivableDebts = useMemo(() => {
    return debts.filter((d) => selfNames.has(d.to.toLowerCase()));
  }, [debts, selfNames]);

  const userOwesTotal = useMemo(() => {
    return myPayableDebts.reduce((sum, d) => sum + d.amount, 0);
  }, [myPayableDebts]);

  const userIsOwedTotal = useMemo(() => {
    return myReceivableDebts.reduce((sum, d) => sum + d.amount, 0);
  }, [myReceivableDebts]);

  // Total amount of all room expenses
  const totalRoomExpenses = useMemo(() => {
    return expenses.reduce((sum, e) => sum + Number(e.totalAmount || e.amount || 0), 0);
  }, [expenses]);

  // Check if current user is the room creator / admin
  const isRoomOwner = useMemo(() => {
    if (!currentUser?.id || !currentRoom) return false;
    if (currentRoom.ownerId === currentUser.id) return true;
    return (currentRoom.members || []).some(
      (m) =>
        (m.userId === currentUser.id || m.id === currentUser.id || m.id === 'rm_' + currentUser.id) &&
        (m.role === 'owner' || m.role === 'admin')
    );
  }, [currentUser, currentRoom]);

  const [isSubmittingExpense, setIsSubmittingExpense] = useState(false);
  const pendingExpenseIdRef = React.useRef<string>('');

  // Permission check: strictly only the creator of the expense or room owner can edit
  const canModifyExpense = (exp: RoomExpense): boolean => {
    if (!currentUser?.id) return false;
    if (isRoomOwner) return true;
    const creatorId = exp.createdByUserId || exp.paidByUserId;
    if (creatorId) {
      return creatorId === currentUser.id;
    }
    if (exp.createdBy) {
      return exp.createdBy.toLowerCase() === effectiveUserName.toLowerCase();
    }
    if (exp.paidBy) {
      return exp.paidBy.toLowerCase() === effectiveUserName.toLowerCase();
    }
    return false;
  };

  // Permission check: Expense Delete Permission
  // STRICTLY only the roommate who ADDED the expense can delete it.
  // Other roommates and room owners CANNOT delete it if they did not add it.
  const canDeleteExpense = (exp: RoomExpense): boolean => {
    if (!currentUser?.id) return false;
    // 1. Direct createdByUserId check
    if (exp.createdByUserId) {
      return exp.createdByUserId === currentUser.id;
    }
    // 2. CreatedBy name match
    if (exp.createdBy) {
      const c = exp.createdBy.toLowerCase().trim();
      if (c === (currentUser.name || '').toLowerCase().trim()) return true;
      if (c === effectiveUserName.toLowerCase().trim()) return true;
      if (selfNames.has(c)) return true;
    }
    // 3. Fallback for older expenses where createdBy was not stored separately
    if (!exp.createdBy && !exp.createdByUserId) {
      if (exp.paidByUserId) return exp.paidByUserId === currentUser.id;
      if (exp.paidBy) {
        const p = exp.paidBy.toLowerCase().trim();
        return (
          p === (currentUser.name || '').toLowerCase().trim() ||
          p === effectiveUserName.toLowerCase().trim() ||
          selfNames.has(p)
        );
      }
    }
    return false;
  };

  // Pending settlements where current user is receiver (creditor)
  const pendingIncomingSettlements = useMemo(() => {
    return settlements.filter((s) => {
      if (s.status !== 'pending') return false;
      const isReceiver =
        (s.creditorId && s.creditorId === currentUser?.id) ||
        (s.toUserId && s.toUserId === currentUser?.id) ||
        selfNames.has(s.to.toLowerCase());
      return isReceiver;
    });
  }, [settlements, currentUser, selfNames]);

  // Pending settlements where current user is the payer (debtor)
  const pendingOutgoingSettlements = useMemo(() => {
    return settlements.filter((s) => {
      if (s.status !== 'pending') return false;
      const isPayer =
        s.createdBy === currentUser?.id ||
        (s.debtorId && s.debtorId === currentUser?.id) ||
        (s.fromUserId && s.fromUserId === currentUser?.id) ||
        selfNames.has(s.from.toLowerCase());
      return isPayer;
    });
  }, [settlements, currentUser, selfNames]);

  const [processingSettleId, setProcessingSettleId] = useState<string | null>(null);

  const handleAcceptClick = async (settleId: string) => {
    if (!onAcceptSettlement) return;
    setProcessingSettleId(settleId);
    try {
      await onAcceptSettlement(settleId);
    } catch (err: any) {
      alert(err?.message || 'Failed to accept settlement');
    } finally {
      setProcessingSettleId(null);
    }
  };

  const handleRejectClick = async (settleId: string) => {
    if (!onRejectSettlement) return;
    setProcessingSettleId(settleId);
    try {
      await onRejectSettlement(settleId);
    } catch (err: any) {
      alert(err?.message || 'Failed to decline settlement');
    } finally {
      setProcessingSettleId(null);
    }
  };

  // Handlers for expense modal
  const openAddExpenseModal = () => {
    pendingExpenseIdRef.current = generateId('exp');
    setEditingExpense(null);
    setExpenseTitle('');
    setExpenseAmount('');
    setExpenseDate(new Date().toISOString().split('T')[0]);
    setExpensePaidBy(effectiveUserName);
    setExpenseSplitType('equal');
    setSelectedParticipantIds(members.map((m) => m.name));
    setExactShares({});
    setExpenseNotes('');
    setExpenseFormError('');
    setIsAddExpenseOpen(true);
  };

  const openEditExpenseModal = (exp: RoomExpense) => {
    if (!canModifyExpense(exp)) {
      alert('Only the roommate who added this expense can edit it.');
      return;
    }
    setEditingExpense(exp);
    setExpenseTitle(exp.title);
    setExpenseAmount(String(exp.totalAmount || exp.amount || ''));
    setExpenseDate(exp.date || new Date().toISOString().split('T')[0]);
    setExpensePaidBy(exp.paidBy || effectiveUserName);
    setExpenseSplitType(exp.splitType || 'equal');

    const participantNames = (exp.participants || []).map((p) => p.name);
    setSelectedParticipantIds(participantNames.length > 0 ? participantNames : members.map((m) => m.name));

    const initialExact: Record<string, string> = {};
    if (exp.participants) {
      exp.participants.forEach((p) => {
        initialExact[p.name] = String(p.share || 0);
      });
    }
    setExactShares(initialExact);
    setExpenseNotes(exp.notes || '');
    setExpenseFormError('');
    setIsAddExpenseOpen(true);
  };

  const handleSaveExpense = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmittingExpense) return;
    setExpenseFormError('');

    const title = expenseTitle.trim();
    if (!title) {
      setExpenseFormError('Please enter an expense title.');
      return;
    }

    const total = parseFloat(expenseAmount);
    if (isNaN(total) || total <= 0) {
      setExpenseFormError('Please enter a valid amount greater than zero.');
      return;
    }

    if (selectedParticipantIds.length === 0) {
      setExpenseFormError('Please select at least one roommate to split with.');
      return;
    }

    const payerMember = members.find(
      (m) => m.name.toLowerCase() === expensePaidBy.toLowerCase() || m.id === expensePaidBy
    );
    const paidByName = payerMember?.name || expensePaidBy || effectiveUserName;
    const paidByUserId = payerMember?.userId || payerMember?.id || effectiveUserId;

    let calculatedParticipants: RoomParticipant[] = [];

    // All expenses use Equal Split across selected roommates
    const count = selectedParticipantIds.length;
    const baseShare = Math.floor((total / count) * 100) / 100;
    const remainderCents = Math.round((total - baseShare * count) * 100);

    calculatedParticipants = selectedParticipantIds.map((name, idx) => {
      const member = members.find((m) => m.name.toLowerCase() === name.toLowerCase());
      const shareVal = idx < remainderCents ? Math.round((baseShare + 0.01) * 100) / 100 : baseShare;
      return {
        userId: member?.userId || member?.id || `user_${idx}`,
        name: member?.name || name,
        share: shareVal,
        hasPaid: (member?.name || name) === paidByName,
      };
    });

    const expenseId = editingExpense ? editingExpense.id : (pendingExpenseIdRef.current || generateId('exp'));
    const expensePayload: RoomExpense = {
      id: expenseId,
      roomId: currentRoom?.id,
      title,
      totalAmount: total,
      amount: total,
      paidBy: paidByName,
      paidByUserId: paidByUserId,
      createdBy: editingExpense?.createdBy || effectiveUserName,
      createdByUserId: editingExpense?.createdByUserId || effectiveUserId,
      splitType: 'equal',
      participants: calculatedParticipants,
      date: expenseDate,
      notes: editingExpense?.notes || undefined,
      createdAt: editingExpense?.createdAt || new Date().toISOString(),
      status: 'pending',
    };

    setIsSubmittingExpense(true);
    try {
      await onAddOrUpdateExpense(expensePayload);
      setIsAddExpenseOpen(false);
      setEditingExpense(null);
      if (viewingExpense && viewingExpense.id === expensePayload.id) {
        setViewingExpense(expensePayload);
      }
    } catch (err: any) {
      setExpenseFormError(err?.message || 'Failed to save expense.');
    } finally {
      setIsSubmittingExpense(false);
    }
  };

  // Settlement handling
  const handleOpenSettleWith = (arg1?: string, arg2?: any, arg3?: any) => {
    setSettleError('');
    const myName = selfMember?.name || effectiveUserName || currentUser?.name || 'You';

    if (arg3 === 'received' || arg2 === 'received') {
      // Creditor marking payment as received from roommate
      const debtorName = arg1 || '';
      const amtVal = typeof arg2 === 'number' ? arg2 : (typeof arg3 === 'number' ? arg3 : undefined);
      setSettleDebtType('receive');
      setSettlePayer(debtorName);
      setSettleReceiver(myName);
      setSettleAmount(amtVal !== undefined ? String(amtVal) : '');
    } else if (typeof arg2 === 'string') {
      // Settle between two roommates (Admin or peer settle)
      setSettleDebtType('all');
      setSettlePayer(arg1 || '');
      setSettleReceiver(arg2);
      setSettleAmount(typeof arg3 === 'number' ? String(arg3) : '');
    } else {
      // Debtor settling their debt to creditor
      const toName = arg1 || (myPayableDebts[0]?.to || '');
      const amtVal = typeof arg2 === 'number' ? arg2 : (myPayableDebts[0]?.amount);
      if (myPayableDebts.length > 0) {
        setSettleDebtType('pay');
        setSettlePayer(myName);
        setSettleReceiver(toName);
        setSettleAmount(amtVal !== undefined ? String(amtVal) : '');
      } else if (myReceivableDebts.length > 0) {
        setSettleDebtType('receive');
        setSettlePayer(myReceivableDebts[0].from);
        setSettleReceiver(myName);
        setSettleAmount(String(myReceivableDebts[0].amount));
      } else {
        setSettleDebtType('all');
        setSettlePayer(myName);
        setSettleReceiver(toName);
        setSettleAmount(amtVal !== undefined ? String(amtVal) : '');
      }
    }

    setSettleMode('UPI');
    setSettleNote('');
    setIsSettleModalOpen(true);
  };

  const handleConfirmSettlement = async (e: React.FormEvent) => {
    e.preventDefault();
    setSettleError('');

    const fromName = settlePayer.trim();
    const toName = settleReceiver.trim();

    if (!fromName || !toName) {
      setSettleError('Please select both the paying roommate and receiving roommate.');
      return;
    }

    if (fromName.toLowerCase() === toName.toLowerCase()) {
      setSettleError('Cannot settle a debt with yourself. Please select another roommate.');
      return;
    }

    const amt = parseFloat(settleAmount);
    if (isNaN(amt) || amt <= 0) {
      setSettleError('Please enter a valid settlement amount greater than 0.');
      return;
    }

    const fromMem = members.find((m) => m && m.name.toLowerCase() === fromName.toLowerCase());
    const toMem = members.find((m) => m && m.name.toLowerCase() === toName.toLowerCase());

    const isFromSelf = selfNames.has(fromName.toLowerCase());
    const isToSelf = selfNames.has(toName.toLowerCase());

    const fromUserId = fromMem?.userId || fromMem?.id || (isFromSelf ? (currentUser?.id || effectiveUserId) : fromName);
    const toUserId = toMem?.userId || toMem?.id || (isToSelf ? (currentUser?.id || effectiveUserId) : toName);

    setIsSubmittingSettle(true);
    try {
      await onSettleDebt(
        fromUserId,
        fromMem?.name || fromName,
        toUserId,
        toMem?.name || toName,
        amt,
        settleNote.trim() || `Settled debt of ₹${amt} from ${fromName} to ${toName}`,
        settleMode
      );

      setIsSettleModalOpen(false);
      setSettleAmount('');
      setSettleNote('');
      setSettleError('');
    } catch (err: any) {
      setSettleError(err?.message || 'Failed to record settlement.');
    } finally {
      setIsSubmittingSettle(false);
    }
  };

  // Copy helpers
  const handleCopyInviteCode = () => {
    if (!currentRoom?.inviteCode) return;
    navigator.clipboard.writeText(currentRoom.inviteCode);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  const handleCopyInviteMessage = () => {
    if (!currentRoom) return;
    const msg = `Join my room "${currentRoom.name}" on PocketBuddy to share flat expenses!\nRoom Code: ${currentRoom.inviteCode}`;
    navigator.clipboard.writeText(msg);
    setCopiedMessage(true);
    setTimeout(() => setCopiedMessage(false), 2000);
  };

  // Add Roommate handler (Enforcing 12-member capacity limit)
  const handleCreateRoommate = async (e: React.FormEvent) => {
    e.preventDefault();
    setAddMemberError('');
    if (!newMemberName.trim()) {
      setAddMemberError('Roommate name is required.');
      return;
    }
    if (members.length >= 12) {
      setAddMemberError('This room has reached its maximum capacity of 12 roommates.');
      return;
    }
    await onAddRoommate(newMemberName.trim(), newMemberUpi.trim() || undefined, newMemberPhone.trim() || undefined);
    setNewMemberName('');
    setNewMemberUpi('');
    setNewMemberPhone('');
    setIsAddRoommateOpen(false);
  };

  const renderCreateRoomModal = () => {
    if (!isCreateRoomOpen) return null;
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
        <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl border border-slate-200 text-left animate-in fade-in zoom-in-95 duration-150">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <h3 className="text-lg font-bold text-slate-900">Create New Room</h3>
            <button
              onClick={() => {
                setIsCreateRoomOpen(false);
                setCreateRoomError('');
              }}
              className="text-slate-400 hover:text-slate-600 p-1"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
          <form
            onSubmit={async (e) => {
              e.preventDefault();
              if (!newRoomName.trim() || isCreatingRoom) return;
              setCreateRoomError('');
              setIsCreatingRoom(true);
              try {
                await onCreateRoom(newRoomName.trim(), newRoomType);
                setIsCreateRoomOpen(false);
                setNewRoomName('');
              } catch (err: any) {
                console.error('Create room error:', err);
                setCreateRoomError(err?.message || 'Failed to create room. Please try again.');
              } finally {
                setIsCreatingRoom(false);
              }
            }}
            className="mt-4 space-y-4"
          >
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Room or Flat Name
              </label>
              <input
                type="text"
                required
                autoFocus
                placeholder="e.g., Roomies, Flat 304"
                value={newRoomName}
                onChange={(e) => setNewRoomName(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-red-600"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Living Type
              </label>
              <select
                value={newRoomType}
                onChange={(e) => setNewRoomType(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-red-600 bg-white"
              >
                <option value="Flat / Apartment">Flat / Apartment</option>
                <option value="Hostel">Hostel</option>
                <option value="PG">Paying Guest (PG)</option>
                <option value="Flat">Flat</option>
                <option value="Apartment">Apartment</option>
                <option value="Other">Other</option>
              </select>
            </div>

            {createRoomError && (
              <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl flex items-start gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{createRoomError}</span>
              </div>
            )}

            <div className="pt-2 flex gap-2 justify-end">
              <button
                type="button"
                onClick={() => {
                  setIsCreateRoomOpen(false);
                  setCreateRoomError('');
                }}
                className="px-4 py-2.5 rounded-xl text-sm font-medium text-slate-600 hover:bg-slate-100"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isCreatingRoom || !newRoomName.trim()}
                className="px-5 py-2.5 rounded-xl text-sm font-bold bg-red-600 hover:bg-red-700 disabled:opacity-60 disabled:cursor-not-allowed text-white shadow-xs shadow-red-600/30 flex items-center gap-2 cursor-pointer"
              >
                {isCreatingRoom ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Creating Room...</span>
                  </>
                ) : (
                  <span>Create Room</span>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  };

  const renderJoinRoomModal = () => {
    if (!isJoinRoomOpen) return null;
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
        <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl border border-slate-200 text-left animate-in fade-in zoom-in-95 duration-150">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <h3 className="text-lg font-bold text-slate-900">Join a Room</h3>
            <button
              onClick={() => {
                setIsJoinRoomOpen(false);
                setJoinError('');
              }}
              className="text-slate-400 hover:text-slate-600 p-1"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
          <form
            onSubmit={async (e) => {
              e.preventDefault();
              setJoinError('');
              const clean = joinCode.trim().toUpperCase();
              if (!clean || isJoiningRoom) return;
              setIsJoiningRoom(true);
              try {
                await onJoinRoom(clean);
                setIsJoinRoomOpen(false);
                setJoinCode('');
              } catch (err: any) {
                console.error('Join room error:', err);
                setJoinError(err?.message || 'Failed to join room. Please check the code.');
              } finally {
                setIsJoiningRoom(false);
              }
            }}
            className="mt-4 space-y-4"
          >
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                6-Character Room Invite Code
              </label>
              <input
                type="text"
                required
                autoFocus
                maxLength={10}
                placeholder="e.g., AB3K9X"
                value={joinCode}
                onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                className="w-full px-3.5 py-3 rounded-xl border border-slate-300 font-mono font-bold text-center tracking-widest text-lg focus:outline-none focus:ring-2 focus:ring-red-600 uppercase"
              />
              <p className="text-xs text-slate-500 mt-1.5">
                Ask any of your roommates for their 6-character room invite code.
              </p>
            </div>

            {joinError && (
              <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{joinError}</span>
              </div>
            )}

            <div className="pt-2 flex gap-2 justify-end">
              <button
                type="button"
                onClick={() => {
                  setIsJoinRoomOpen(false);
                  setJoinError('');
                }}
                className="px-4 py-2.5 rounded-xl text-sm font-medium text-slate-600 hover:bg-slate-100"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isJoiningRoom || !joinCode.trim()}
                className="px-5 py-2.5 rounded-xl text-sm font-bold bg-zinc-950 hover:bg-black disabled:opacity-60 disabled:cursor-not-allowed text-white shadow-xs flex items-center gap-2 cursor-pointer"
              >
                {isJoiningRoom ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Joining...</span>
                  </>
                ) : (
                  <span>Join Room</span>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  };

  // 1. EMPTY STATE: No room exists
  if (!currentRoom) {
    return (
      <div className="w-full max-w-xl mx-auto py-8 px-4 text-center">
        <div className="bg-gradient-to-b from-white via-rose-50/20 to-white rounded-3xl border border-rose-100/90 p-8 sm:p-10 shadow-[0_12px_40px_rgba(220,38,38,0.06)] text-center relative overflow-hidden">
          {/* Subtle background glow */}
          <div className="absolute -top-12 -right-12 w-40 h-40 bg-gradient-to-br from-rose-200/30 to-amber-100/30 rounded-full blur-2xl pointer-events-none" />

          <div className="relative z-10">
            <div className="w-16 h-16 mx-auto rounded-3xl bg-gradient-to-br from-red-500 via-red-600 to-rose-700 text-white flex items-center justify-center mb-5 shadow-lg shadow-red-600/30 ring-4 ring-rose-50/80">
              <Home className="w-8 h-8" />
            </div>
            <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">Room &amp; Flatmate Expenses</h2>
            <p className="text-sm text-slate-600 mt-2 max-w-md mx-auto leading-relaxed font-normal">
              Split rent, utilities, milk, groceries, and daily flat kharcha with your roommates. PocketBuddy calculates
              who owes whom automatically.
            </p>

            <div className="mt-7 flex flex-col sm:flex-row gap-3 justify-center">
              <button
                onClick={() => {
                  setCreateRoomError('');
                  setIsCreateRoomOpen(true);
                }}
                className="inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-2xl bg-gradient-to-r from-red-600 via-rose-600 to-red-700 hover:from-red-700 hover:to-rose-800 text-white font-extrabold text-sm transition-all shadow-[0_4px_16px_rgba(220,38,38,0.35)] min-h-[48px] cursor-pointer"
              >
                <Plus className="w-4 h-4 stroke-[2.5]" />
                Create a Room
              </button>
              <button
                onClick={() => {
                  setJoinError('');
                  setJoinCode('');
                  setIsJoinRoomOpen(true);
                }}
                className="inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-2xl bg-white hover:bg-rose-50/70 text-slate-800 border border-slate-200/90 hover:border-rose-300 font-bold text-sm transition-all min-h-[48px] cursor-pointer shadow-2xs"
              >
                <Users className="w-4 h-4" />
                Join with Room Code
              </button>
            </div>
          </div>
        </div>

        {renderCreateRoomModal()}
        {renderJoinRoomModal()}
      </div>
    );
  }

  // 2. ACTIVE ROOM: Clean, focused, high-craft roommate expense screen
  return (
    <div className="w-full max-w-4xl mx-auto space-y-3 sm:space-y-4">
      {/* A. ROOM HEADER (Compact & Responsive) */}
      <div className="bg-white/95 backdrop-blur-md rounded-2xl sm:rounded-3xl border border-rose-100/90 p-3.5 sm:p-5 shadow-[0_6px_24px_rgba(220,38,38,0.04)]">
        <div className="flex items-center justify-between gap-2.5">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-2xl bg-gradient-to-br from-rose-50 to-red-100 text-red-600 flex items-center justify-center shrink-0 border border-rose-200/80 shadow-2xs">
              <Building2 className="w-5 h-5 sm:w-6 sm:h-6" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5 flex-wrap">
                <h1 className="text-base sm:text-xl font-bold text-slate-900 truncate tracking-tight">
                  {currentRoom.name}
                </h1>
                {currentRoom.type && (
                  <span className="px-2 py-0.5 rounded-lg bg-rose-50 text-rose-700 text-[10px] sm:text-[11px] font-semibold border border-rose-200/60">
                    {currentRoom.type}
                  </span>
                )}
                {isRoomOwner && (
                  <span className="px-2 py-0.5 rounded-lg bg-amber-50 text-amber-800 text-[10px] sm:text-[11px] font-bold border border-amber-200 flex items-center gap-1">
                    <Shield className="w-2.5 h-2.5" />
                    Admin
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2 mt-0.5 text-[11px] sm:text-xs text-slate-500 flex-wrap">
                <span>
                  {members.length} {members.length === 1 ? 'member' : 'members'}
                </span>
                <span>•</span>
                <button
                  onClick={handleCopyInviteCode}
                  className="inline-flex items-center gap-1 font-mono font-semibold text-red-600 hover:text-red-700 bg-rose-50 px-2 py-0.5 rounded-md transition border border-rose-100"
                  title="Click to copy invite code"
                >
                  <span>Code: {currentRoom.inviteCode}</span>
                  {copiedCode ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                </button>
              </div>
            </div>
          </div>

          {/* Header Action Buttons */}
          <div className="flex items-center gap-1.5 shrink-0">
            <button
              onClick={handleManualRefresh}
              disabled={isRefreshing}
              className="p-1.5 sm:px-3 sm:py-2 rounded-xl border border-slate-200 text-slate-700 hover:bg-rose-50/60 text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer disabled:opacity-60 shadow-2xs"
              title="Refresh and sync shared room data"
            >
              <RefreshCw className={`w-3.5 h-3.5 text-red-600 ${isRefreshing ? 'animate-spin' : ''}`} />
              <span className="hidden sm:inline">Sync</span>
            </button>
            <button
              onClick={() => setIsShareModalOpen(true)}
              className="p-1.5 sm:px-3 sm:py-2 rounded-xl border border-slate-200 text-slate-700 hover:bg-rose-50/60 text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer shadow-2xs"
              title="Share Room Invite Code"
            >
              <Share2 className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-slate-600" />
              <span className="hidden sm:inline">Invite</span>
            </button>
            <button
              onClick={() => setIsSettingsModalOpen(true)}
              className="p-2 rounded-xl border border-slate-200 text-slate-700 hover:bg-rose-50/60 transition cursor-pointer shadow-2xs"
              title="Room Settings & Menu"
            >
              <Settings className="w-4 h-4 text-slate-600" />
            </button>
          </div>
        </div>
      </div>

      {/* B. MAIN ROOM ACTIONS (Consolidated in ONE place) */}
      <div className="bg-white/95 backdrop-blur-md rounded-2xl sm:rounded-3xl border border-rose-100/90 p-3 sm:p-4 shadow-[0_6px_24px_rgba(220,38,38,0.04)] space-y-2">
        <button
          onClick={openAddExpenseModal}
          className="w-full min-h-[44px] sm:min-h-[48px] py-3 px-4 rounded-xl sm:rounded-2xl bg-gradient-to-r from-red-600 via-rose-600 to-red-700 hover:from-red-700 hover:to-rose-800 text-white font-extrabold text-sm flex items-center justify-center gap-2 shadow-[0_4px_16px_rgba(220,38,38,0.3)] transition active:scale-[0.99] cursor-pointer"
        >
          <Plus className="w-4 h-4 stroke-[2.5]" />
          Add Expense
        </button>

        <div className="grid grid-cols-2 gap-2">
          <button
            onClick={() => {
              setAddMemberError('');
              setIsAddRoommateOpen(true);
            }}
            className="py-2.5 px-3 rounded-xl border border-slate-200 hover:bg-rose-50/60 text-slate-700 text-xs font-semibold flex items-center justify-center gap-1.5 transition cursor-pointer shadow-2xs"
          >
            <UserPlus className="w-3.5 h-3.5 text-red-600 shrink-0" />
            <span className="truncate">Add Roommate</span>
          </button>
          <button
            onClick={() => {
              setSettleError('');
              if (myPayableDebts.length > 0) {
                handleOpenSettleWith(myPayableDebts[0].to, myPayableDebts[0].amount);
              } else if (myReceivableDebts.length > 0) {
                handleOpenSettleWith(myReceivableDebts[0].from, myReceivableDebts[0].amount, 'received');
              } else {
                setSettleReceiver('');
                setSettleAmount('');
                setIsSettleModalOpen(true);
              }
            }}
            className="py-2.5 px-3 rounded-xl border border-slate-200 hover:bg-emerald-50/60 text-slate-700 text-xs font-semibold flex items-center justify-center gap-1.5 transition cursor-pointer shadow-2xs"
          >
            <Handshake className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
            <span className="truncate">
              Settle Up {myPayableDebts.length > 0 ? `(${myPayableDebts.length})` : (myReceivableDebts.length > 0 ? `(${myReceivableDebts.length})` : '')}
            </span>
          </button>
        </div>
      </div>

      {/* C. ROOMMATES / FLATMATE MEMBERS LIST STRIP */}
      <div className="bg-white rounded-xl sm:rounded-2xl border border-slate-200 p-3 sm:p-4 shadow-xs">
        <div className="flex items-center justify-between mb-2.5">
          <div className="flex items-center gap-1.5">
            <Users className="w-4 h-4 text-slate-700" />
            <span className="text-xs font-bold text-slate-900 uppercase tracking-wider">
              Roommates ({members.length})
            </span>
          </div>
          <button
            onClick={() => {
              setAddMemberError('');
              setIsAddRoommateOpen(true);
            }}
            className="text-xs font-bold text-red-600 hover:text-red-700 flex items-center gap-1 transition cursor-pointer"
          >
            <UserPlus className="w-3.5 h-3.5" />
            <span>+ Add Roommate</span>
          </button>
        </div>

        <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-thin">
          {members.map((m) => {
            const isSelf =
              selfNames.has(m.name.toLowerCase()) ||
              (m.userId && m.userId === (currentUser?.id || effectiveUserId));
            const isAdmin =
              m.role === 'owner' ||
              (currentRoom.ownerId && (m.userId === currentRoom.ownerId || m.id === currentRoom.ownerId));

            return (
              <div
                key={m.id || m.userId || m.name}
                className="flex items-center gap-2 px-3 py-2 rounded-xl bg-slate-50 border border-slate-200/90 shrink-0 hover:bg-slate-100/70 transition"
              >
                {m.photoUrl || (isSelf && currentUser?.photoUrl) ? (
                  <img
                    src={m.photoUrl || (isSelf && currentUser?.photoUrl)}
                    alt={m.name}
                    className="w-7 h-7 rounded-full object-cover shrink-0 border border-slate-200"
                  />
                ) : (
                  <div className="w-7 h-7 rounded-full bg-red-100 text-red-700 font-extrabold flex items-center justify-center text-xs shrink-0">
                    {m.name.charAt(0).toUpperCase()}
                  </div>
                )}
                <div className="min-w-0">
                  <div className="flex items-center gap-1">
                    <span className="text-xs font-bold text-slate-900 truncate max-w-[95px] sm:max-w-none">
                      {m.name}
                    </span>
                    {isSelf && (
                      <span className="px-1 py-0.2 rounded text-[9px] font-bold bg-red-100 text-red-800">
                        You
                      </span>
                    )}
                    {isAdmin && (
                      <span className="px-1 py-0.2 rounded text-[9px] font-bold bg-amber-100 text-amber-800 flex items-center gap-0.5">
                        <Shield className="w-2.5 h-2.5" />
                        Admin
                      </span>
                    )}
                  </div>
                  {(m.phone || m.upiId) && (
                    <span className="text-[10px] text-slate-500 block truncate max-w-[110px]">
                      {m.phone || m.upiId}
                    </span>
                  )}
                </div>
                {isRoomOwner && !isSelf && (
                  <button
                    onClick={() => setRemoveMemberConfirm({ id: m.id || m.userId || '', name: m.name })}
                    className="text-slate-400 hover:text-rose-600 p-1 rounded transition ml-1 cursor-pointer"
                    title={`Remove ${m.name}`}
                  >
                    <X className="w-3 h-3" />
                  </button>
                )}
              </div>
            );
          })}

          <button
            onClick={() => {
              setAddMemberError('');
              setIsAddRoommateOpen(true);
            }}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-dashed border-slate-300 text-slate-600 hover:border-red-400 hover:text-red-600 hover:bg-red-50/50 text-xs font-semibold shrink-0 transition cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add</span>
          </button>
        </div>
      </div>

      {/* Settle Up Confirmation Request for Receiver */}
      {pendingIncomingSettlements.length > 0 && (
        <div className="bg-gradient-to-r from-amber-500/10 via-amber-500/5 to-emerald-500/10 border-2 border-amber-300 rounded-2xl sm:rounded-3xl p-4 sm:p-5 shadow-sm space-y-3">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-amber-500 text-white flex items-center justify-center shrink-0 shadow-xs">
                <Bell className="w-4 h-4 animate-bounce" />
              </div>
              <div>
                <h4 className="text-sm font-black text-slate-900 leading-tight">
                  Settlement Confirmation Required
                </h4>
                <p className="text-[11px] text-amber-900/80 font-medium">
                  📱 SMS / Notification Alert: Roommate marked payment to you. Please confirm below once received.
                </p>
              </div>
            </div>
            <span className="px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 text-[10px] font-bold shrink-0">
              {pendingIncomingSettlements.length} Pending
            </span>
          </div>

          <div className="space-y-2.5">
            {pendingIncomingSettlements.map((s) => (
              <div
                key={s.id}
                className="bg-white rounded-xl sm:rounded-2xl p-3.5 border border-amber-200/90 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-3"
              >
                <div>
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <strong className="text-slate-900 text-xs sm:text-sm font-extrabold">{s.from}</strong>
                    <span className="text-slate-500 text-xs">marked</span>
                    <strong className="text-emerald-600 text-xs sm:text-sm font-black">₹{s.amount}</strong>
                    <span className="text-slate-500 text-xs">as paid via</span>
                    <span className="px-2 py-0.5 rounded-md bg-slate-100 font-bold text-slate-800 text-[10px] border border-slate-200">
                      {s.mode || 'UPI'}
                    </span>
                  </div>
                  <span className="text-[11px] text-slate-400 block mt-0.5">
                    {formatDate(s.date)} {s.note ? `• "${s.note}"` : ''}
                  </span>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <button
                    type="button"
                    disabled={processingSettleId === s.id}
                    onClick={() => handleAcceptClick(s.id)}
                    className="px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-700 hover:from-emerald-700 hover:to-teal-800 text-white text-xs font-bold transition shadow-xs flex items-center gap-1.5 cursor-pointer disabled:opacity-50 active:scale-95"
                  >
                    {processingSettleId === s.id ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <Check className="w-3.5 h-3.5 stroke-[3]" />
                    )}
                    <span>Accept & Settle</span>
                  </button>

                  <button
                    type="button"
                    disabled={processingSettleId === s.id}
                    onClick={() => handleRejectClick(s.id)}
                    className="px-3.5 py-2 rounded-xl bg-slate-50 hover:bg-rose-50 text-slate-700 hover:text-rose-600 border border-slate-200 text-xs font-semibold transition cursor-pointer disabled:opacity-50 active:scale-95"
                  >
                    <span>Not Received</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Payer Pending Banner */}
      {pendingOutgoingSettlements.length > 0 && pendingIncomingSettlements.length === 0 && (
        <div className="bg-amber-50/70 border border-amber-200 rounded-2xl p-3 sm:p-3.5 flex items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2.5 min-w-0">
            <Clock className="w-4 h-4 text-amber-600 shrink-0" />
            <div className="min-w-0">
              <span className="font-bold text-amber-900 block truncate">
                Pending Confirmation: You marked ₹{pendingOutgoingSettlements[0].amount} paid to {pendingOutgoingSettlements[0].to}
              </span>
              <span className="text-[11px] text-amber-700 block truncate">
                Waiting for {pendingOutgoingSettlements[0].to} to accept. Settlement will complete only after they confirm.
              </span>
            </div>
          </div>
          <button
            type="button"
            onClick={() => onDeleteSettlement(pendingOutgoingSettlements[0].id)}
            className="text-[11px] text-slate-500 hover:text-rose-600 font-semibold underline shrink-0 cursor-pointer"
            title="Cancel this pending settlement request"
          >
            Cancel Request
          </button>
        </div>
      )}

      {/* D. DASHBOARD SUMMARY (Total Expenses, To Pay, To Receive) */}
      <div className="grid grid-cols-3 gap-2 sm:gap-3.5">
        {/* 1. Total Expenses */}
        <div className="bg-gradient-to-br from-slate-50/60 via-white to-rose-50/20 rounded-2xl border border-rose-100/90 p-3 sm:p-4 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-[10px] sm:text-xs font-bold uppercase tracking-wider text-slate-500 truncate">
              Total
            </span>
            <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-xl bg-slate-100 text-slate-700 flex items-center justify-center shrink-0">
              <Receipt className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            </div>
          </div>
          <span className="text-base sm:text-2xl font-black text-slate-900 mt-1 sm:mt-2 block truncate">
            ₹{totalRoomExpenses.toLocaleString('en-IN')}
          </span>
          <span className="text-[10px] sm:text-xs text-slate-400 mt-0.5 hidden sm:block">
            Total room expenses
          </span>
        </div>

        {/* 2. To Pay */}
        <div className="bg-gradient-to-br from-rose-50/50 via-white to-red-50/20 rounded-2xl border border-rose-200/80 p-3 sm:p-4 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-[10px] sm:text-xs font-bold uppercase tracking-wider text-red-600 truncate">
              To Pay
            </span>
            <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-xl bg-red-50 text-red-600 flex items-center justify-center shrink-0">
              <ArrowUpRight className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            </div>
          </div>
          <span
            className={`text-base sm:text-2xl font-black mt-1 sm:mt-2 block truncate ${
              userOwesTotal > 0 ? 'text-red-600' : 'text-slate-800'
            }`}
          >
            ₹{userOwesTotal.toLocaleString('en-IN')}
          </span>
          <span className="text-[10px] sm:text-xs text-slate-400 mt-0.5 hidden sm:block">
            {userOwesTotal > 0 ? 'You owe roommates' : 'All settled'}
          </span>
        </div>

        {/* 3. To Receive */}
        <div className="bg-gradient-to-br from-emerald-50/50 via-white to-teal-50/20 rounded-2xl border border-emerald-200/80 p-3 sm:p-4 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-[10px] sm:text-xs font-bold uppercase tracking-wider text-emerald-700 truncate">
              To Receive
            </span>
            <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
              <ArrowDownLeft className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            </div>
          </div>
          <span
            className={`text-base sm:text-2xl font-black mt-1 sm:mt-2 block truncate ${
              userIsOwedTotal > 0 ? 'text-emerald-700' : 'text-slate-800'
            }`}
          >
            ₹{userIsOwedTotal.toLocaleString('en-IN')}
          </span>
          <span className="text-[10px] sm:text-xs text-slate-400 mt-0.5 hidden sm:block">
            {userIsOwedTotal > 0 ? 'Roommates owe you' : 'All settled'}
          </span>
        </div>
      </div>

      {/* D. WHO OWES WHOM? */}
      <div className="bg-white rounded-xl sm:rounded-2xl border border-slate-200 p-3 sm:p-5 shadow-xs space-y-2 sm:space-y-3">
        <div className="flex items-center justify-between pb-1.5 sm:pb-2 border-b border-slate-100">
          <div className="flex items-center gap-1.5">
            <Handshake className="w-4 h-4 text-red-600" />
            <h3 className="text-xs sm:text-base font-bold text-slate-900">
              Who Owes Whom?
            </h3>
          </div>
          <span className="text-[11px] sm:text-xs font-semibold text-slate-500">
            {debts.length === 0 ? 'All settled' : `${debts.length} pending`}
          </span>
        </div>

        {debts.length === 0 ? (
          <div className="py-4 px-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
            <span className="font-medium">All balances are settled! No roommate owes any money.</span>
          </div>
        ) : (
          <div className="space-y-2">
            {debts.map((d, idx) => {
              const isDebtor = selfNames.has(d.from.toLowerCase());
              const isCreditor = selfNames.has(d.to.toLowerCase());

              const debtorDisplayName = isDebtor ? 'You' : d.from;
              const creditorDisplayName = isCreditor ? 'You' : d.to;

              return (
                <div
                  key={idx}
                  className={`p-2.5 sm:p-3 rounded-xl border flex items-center justify-between gap-2 text-xs transition ${
                    isDebtor
                      ? 'bg-rose-50/50 border-rose-200'
                      : isCreditor
                      ? 'bg-emerald-50/50 border-emerald-200'
                      : 'bg-slate-50 border-slate-200'
                  }`}
                >
                  <div className="flex items-center gap-1.5 flex-wrap min-w-0 text-xs sm:text-sm">
                    {isDebtor ? (
                      <>
                        <span className="font-extrabold text-rose-600">You</span>
                        <span className="text-slate-500 font-medium text-[11px] sm:text-xs">pay</span>
                        <span className="font-bold text-slate-900 truncate max-w-[85px] sm:max-w-none">{creditorDisplayName}</span>
                        <span className="font-extrabold text-rose-600 shrink-0 ml-0.5">
                          ₹{d.amount.toLocaleString('en-IN')}
                        </span>
                      </>
                    ) : isCreditor ? (
                      <>
                        <span className="font-bold text-slate-900 truncate max-w-[85px] sm:max-w-none">{debtorDisplayName}</span>
                        <span className="text-slate-500 font-medium text-[11px] sm:text-xs">pays</span>
                        <span className="font-extrabold text-emerald-600">You</span>
                        <span className="font-extrabold text-emerald-600 shrink-0 ml-0.5">
                          ₹{d.amount.toLocaleString('en-IN')}
                        </span>
                      </>
                    ) : (
                      <>
                        <span className="font-bold text-slate-900 truncate max-w-[85px] sm:max-w-none">{debtorDisplayName}</span>
                        <span className="text-slate-500 font-medium text-[11px] sm:text-xs">pays</span>
                        <span className="font-bold text-slate-900 truncate max-w-[85px] sm:max-w-none">{creditorDisplayName}</span>
                        <span className="font-extrabold text-slate-900 shrink-0 ml-0.5">
                          ₹{d.amount.toLocaleString('en-IN')}
                        </span>
                      </>
                    )}
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0">
                    {isDebtor && (
                      <button
                        onClick={() => handleOpenSettleWith(d.to, d.amount)}
                        className="px-2.5 py-1 rounded-lg bg-red-600 hover:bg-red-700 text-white font-bold text-xs transition cursor-pointer shadow-2xs shrink-0 active:scale-95"
                      >
                        Settle
                      </button>
                    )}
                    {isCreditor && (
                      <button
                        onClick={() => handleOpenSettleWith(d.from, d.amount, 'received')}
                        className="px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs transition cursor-pointer shadow-2xs shrink-0 active:scale-95 flex items-center gap-1"
                        title="Mark payment as received from roommate"
                      >
                        <Check className="w-3 h-3" />
                        <span>Received</span>
                      </button>
                    )}
                    {!isDebtor && !isCreditor && (
                      <button
                        onClick={() => handleOpenSettleWith(d.from, d.to, d.amount)}
                        className="px-2 py-1 rounded-lg border border-slate-300 hover:bg-slate-100 text-slate-700 font-semibold text-xs transition cursor-pointer shrink-0 active:scale-95"
                        title="Record settlement between flatmates"
                      >
                        Settle
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* E. SHARED EXPENSES & ACTIVITY HISTORY */}
      <div className="bg-white rounded-2xl border border-slate-200 p-4 sm:p-5 shadow-sm space-y-3">
        <div className="flex items-center justify-between pb-1 border-b border-slate-100 flex-wrap gap-2">
          {/* Segmented Switch */}
          <div className="flex items-center gap-1 p-0.5 bg-slate-100 rounded-xl">
            <button
              onClick={() => setActiveListTab('expenses')}
              className={`px-2.5 py-1 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition ${
                activeListTab === 'expenses'
                  ? 'bg-white text-red-600 shadow-sm font-bold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Receipt className="w-3.5 h-3.5" />
              <span>Expenses ({expenses.length})</span>
            </button>
            <button
              onClick={() => setActiveListTab('history')}
              className={`px-2.5 py-1 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition ${
                activeListTab === 'history'
                  ? 'bg-white text-red-600 shadow-sm font-bold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <History className="w-3.5 h-3.5" />
              <span>Activity ({activities.length})</span>
            </button>
          </div>
        </div>

        {activeListTab === 'expenses' ? (
          expenses.length === 0 ? (
            <div className="py-8 text-center text-slate-500">
              <div className="w-10 h-10 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mx-auto mb-2">
                <Receipt className="w-5 h-5" />
              </div>
              <p className="text-sm font-medium text-slate-700">No shared expenses recorded yet</p>
              <p className="text-xs text-slate-500 mt-0.5">
                Tap "Add Expense" to record groceries, Wi-Fi, electricity, or flat bills.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {groupedExpenses.map((month) => (
                <div key={month.monthKey} className="space-y-2.5">
                  {/* Month Header with Total Spent */}
                  <div className="flex items-center justify-between pt-2 pb-1 border-b border-slate-200">
                    <div className="flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5 text-red-600" />
                      <span className="text-xs sm:text-sm font-extrabold text-slate-900 tracking-tight">
                        {month.monthLabel}
                      </span>
                    </div>
                    <span className="text-[11px] sm:text-xs font-semibold text-slate-500">
                      Monthly Spent: <strong className="text-slate-900 font-extrabold">₹{Math.round(month.totalSpent).toLocaleString('en-IN')}</strong>
                    </span>
                  </div>

                  {/* Date Groups in this month */}
                  {month.dateGroups.map((group) => (
                    <div key={group.dateKey} className="space-y-1.5">
                      {/* Date Header with Total Spent */}
                      <div className="flex items-center justify-between px-1 text-xs pt-1">
                        <span className="text-[11px] sm:text-xs font-bold text-slate-700">
                          {group.displayDate}
                        </span>
                        <span className="text-[11px] sm:text-xs font-semibold text-slate-500">
                          Total Spent: <strong className="font-extrabold text-rose-600">₹{Math.round(group.totalSpent).toLocaleString('en-IN')}</strong>
                        </span>
                      </div>

                      {/* Expense Cards in this date group - Compact, Clean and Easy to Scan */}
                      <div className="space-y-1.5">
                        {group.items.map((exp) => {
                          const isAllowed = canModifyExpense(exp);
                          const isPaidBySelf = selfNames.has(exp.paidBy.toLowerCase());

                          const participantsList = Array.isArray(exp.participants) ? exp.participants : [];
                          const totalAmt = exp.totalAmount || exp.amount || 0;

                          // Compact Split String: "TEST1 (You): ₹50 · TEST2: ₹50 · TEST3: ₹50"
                          const splitSummaryText = participantsList.length > 0
                            ? participantsList
                                .map((p) => {
                                  const isMe = selfNames.has(p.name.toLowerCase());
                                  const nameLabel = isMe ? `${p.name} (You)` : p.name;
                                  return `${nameLabel}: ₹${Math.round(p.share).toLocaleString('en-IN')}`;
                                })
                                .join(' · ')
                            : 'Equally split';

                          return (
                            <div
                              key={exp.id}
                              className="p-3 rounded-xl bg-white border border-slate-200/90 shadow-2xs hover:border-slate-300 transition space-y-1.5"
                            >
                              {/* Row 1: Title + Total Amount + Actions */}
                              <div className="flex items-center justify-between gap-2">
                                <span className="font-bold text-slate-900 text-sm sm:text-base leading-tight truncate">
                                  {exp.title}
                                </span>

                                <div className="flex items-center gap-2 shrink-0">
                                  <span className="text-sm sm:text-base font-black text-slate-900 leading-none">
                                    ₹{Math.round(totalAmt).toLocaleString('en-IN')}
                                  </span>

                                  <div className="flex items-center gap-0.5 border-l border-slate-200 pl-1.5 ml-0.5">
                                    <button
                                      onClick={() => setSelectedDetailExpense(exp)}
                                      className="p-1 rounded text-slate-400 hover:text-red-600 hover:bg-slate-100 transition cursor-pointer"
                                      title="View full details"
                                      aria-label="View expense details"
                                    >
                                      <Info className="w-3.5 h-3.5" />
                                    </button>

                                    {isAllowed && (
                                      <button
                                        onClick={() => openEditExpenseModal(exp)}
                                        className="p-1 rounded text-slate-400 hover:text-red-600 hover:bg-slate-100 transition cursor-pointer"
                                        title="Edit expense"
                                        aria-label="Edit expense"
                                      >
                                        <Edit2 className="w-3.5 h-3.5" />
                                      </button>
                                    )}
                                    {canDeleteExpense(exp) && (
                                      <button
                                        onClick={() => setDeleteConfirmExpense(exp)}
                                        className="p-1 rounded text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition cursor-pointer"
                                        title="Delete expense"
                                        aria-label="Delete expense"
                                      >
                                        <Trash2 className="w-3.5 h-3.5" />
                                      </button>
                                    )}
                                  </div>
                                </div>
                              </div>

                              {/* Row 2: Kisne pay kiya & kisne add kiya • Date and Time */}
                              <div className="text-xs text-slate-500 flex items-center gap-1.5 flex-wrap">
                                <span>
                                  Paid by <strong className="font-semibold text-slate-800">{exp.paidBy}{isPaidBySelf ? ' (You)' : ''}</strong>
                                </span>
                                {exp.createdBy && exp.createdBy.toLowerCase() !== exp.paidBy.toLowerCase() && (
                                  <>
                                    <span className="text-slate-300">•</span>
                                    <span>
                                      Added by <strong className="font-semibold text-slate-700">{exp.createdBy}</strong>
                                    </span>
                                  </>
                                )}
                                <span className="text-slate-300">•</span>
                                <span>{formatDateTime(exp.createdAt || exp.date)}</span>
                              </div>

                              {/* Row 3: Split money amount only */}
                              <div className="text-xs text-slate-600 pt-1 border-t border-slate-100 flex items-baseline gap-1.5 flex-wrap">
                                <span className="text-slate-400 font-semibold text-[11px]">Split:</span>
                                <span className="font-medium text-slate-800">{splitSummaryText}</span>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              ))}
            </div>
          )
        ) : (
          activities.length === 0 ? (
            <div className="py-8 text-center text-slate-500">
              <div className="w-10 h-10 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mx-auto mb-2">
                <History className="w-5 h-5" />
              </div>
              <p className="text-sm font-medium text-slate-700">No activity recorded yet</p>
              <p className="text-xs text-slate-500 mt-0.5">
                Roommate joins, expenses, edits, and settlements will appear here.
              </p>
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {activities.map((act) => {
                let ActIcon = Clock;
                let iconBg = 'bg-slate-100 text-slate-600';
                if (act.type === 'expense') {
                  ActIcon = Receipt;
                  iconBg = 'bg-red-50 text-red-600';
                } else if (act.type === 'settlement') {
                  ActIcon = Handshake;
                  iconBg = 'bg-emerald-50 text-emerald-600';
                } else if (act.type === 'join' || act.type === 'member') {
                  ActIcon = UserPlus;
                  iconBg = 'bg-amber-50 text-amber-600';
                } else if (act.type === 'edit') {
                  ActIcon = Edit2;
                  iconBg = 'bg-sky-50 text-sky-600';
                }

                return (
                  <div key={act.id} className="py-3 flex items-start gap-3">
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 mt-0.5 ${iconBg}`}>
                      <ActIcon className="w-4 h-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs sm:text-sm font-medium text-slate-800 break-words leading-relaxed">
                        {act.text}
                      </p>
                      <span className="text-[11px] text-slate-400 mt-0.5 block">
                        {act.time ? formatDateTime(act.time) : 'Recently'}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )
        )}
      </div>

      {/* ========================================================================= */}
      {/* MODALS */}
      {/* ========================================================================= */}

      {/* 1. ADD / EDIT EXPENSE MODAL */}
      {isAddExpenseOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-3 sm:p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-md w-full p-4 sm:p-5 shadow-2xl border border-slate-200/90 my-auto text-left animate-in fade-in zoom-in-95 duration-150 space-y-4">
            {/* PocketBuddy Branding & Modal Header */}
            <div className="flex items-start justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-xl bg-purple-50 border border-purple-100/80 text-purple-700 flex items-center justify-center shrink-0 shadow-2xs">
                  <Receipt className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-purple-700 bg-purple-100/70 px-1.5 py-0.5 rounded">
                      PocketBuddy
                    </span>
                    <span className="text-[11px] font-medium text-slate-400">Room Expenses</span>
                  </div>
                  <h3 className="text-base sm:text-lg font-bold text-slate-900 leading-tight mt-0.5">
                    {editingExpense ? 'Edit Shared Expense' : 'Add Shared Expense'}
                  </h3>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsAddExpenseOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-100 transition shrink-0"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveExpense} className="space-y-3.5">
              {/* Expense Title */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Expense Title *
                </label>
                <input
                  type="text"
                  required
                  placeholder="What did you buy? e.g. Groceries, Milk, WiFi"
                  value={expenseTitle}
                  onChange={(e) => setExpenseTitle(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl border border-slate-300 text-xs sm:text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-600 transition"
                />
              </div>

              {/* Total Amount & Date */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Total Amount *
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-sm">
                      ₹
                    </span>
                    <input
                      type="number"
                      step="0.01"
                      min="1"
                      required
                      placeholder="Total amount ₹"
                      value={expenseAmount}
                      onChange={(e) => setExpenseAmount(e.target.value)}
                      className="w-full pl-7 pr-3 py-2.5 rounded-xl border border-slate-300 text-xs sm:text-sm font-bold text-slate-900 placeholder:text-slate-400 placeholder:font-normal focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-600 transition"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Date *
                  </label>
                  <input
                    type="date"
                    required
                    value={expenseDate}
                    onChange={(e) => setExpenseDate(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-xl border border-slate-300 text-xs sm:text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-600 transition bg-white"
                  />
                </div>
              </div>

              {/* Paid By - Locked to logged in user */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-semibold text-slate-700">
                    Paid By *
                  </label>
                  <span className="inline-flex items-center gap-1 text-[10px] font-medium text-slate-400">
                    <Lock className="w-2.5 h-2.5" /> Logged-in user only
                  </span>
                </div>
                <div className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 text-xs sm:text-sm flex items-center justify-between text-slate-900">
                  <span className="font-semibold text-slate-900">
                    {selfMember?.name || effectiveUserName || 'You'} (You)
                  </span>
                  <span className="text-[10px] font-bold text-purple-700 bg-purple-100/80 px-2 py-0.5 rounded">
                    You Paid
                  </span>
                </div>
              </div>

              {/* Roommates Equal Split Section */}
              <div className="p-3 rounded-xl bg-slate-50/80 border border-slate-200/90 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-800">Select Roommates</span>
                  <button
                    type="button"
                    onClick={() => {
                      if (selectedParticipantIds.length === members.length) {
                        setSelectedParticipantIds([effectiveUserName]);
                      } else {
                        setSelectedParticipantIds(members.map((m) => m.name));
                      }
                    }}
                    className="text-[11px] text-purple-700 hover:text-purple-900 font-semibold transition"
                  >
                    {selectedParticipantIds.length === members.length ? 'Deselect All' : 'Select All'}
                  </button>
                </div>

                {/* Roommates Checkboxes */}
                <div className="space-y-1.5 max-h-40 overflow-y-auto pr-0.5">
                  {members.map((m) => {
                    const isSelected = selectedParticipantIds.includes(m.name);
                    const equalShareVal =
                      selectedParticipantIds.length > 0 && parseFloat(expenseAmount) > 0
                        ? Math.round((parseFloat(expenseAmount) / selectedParticipantIds.length) * 100) / 100
                        : 0;

                    return (
                      <label
                        key={m.id || m.name}
                        className={`flex items-center justify-between gap-2 px-2.5 py-2 rounded-lg border text-xs cursor-pointer transition ${
                          isSelected
                            ? 'bg-white border-purple-200 text-slate-900 shadow-2xs'
                            : 'bg-slate-100/50 border-slate-200 text-slate-500'
                        }`}
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setSelectedParticipantIds((prev) => [...prev, m.name]);
                              } else {
                                setSelectedParticipantIds((prev) => prev.filter((name) => name !== m.name));
                              }
                            }}
                            className="rounded border-slate-300 text-purple-600 focus:ring-purple-500"
                          />
                          <span className="font-medium truncate">
                            {m.name}{selfNames.has(m.name.toLowerCase()) ? ' (You)' : ''}
                          </span>
                        </div>
                        <span className={`font-semibold shrink-0 ${isSelected ? 'text-purple-700' : 'text-slate-400'}`}>
                          {isSelected
                            ? `₹${equalShareVal.toLocaleString('en-IN', { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`
                            : 'Excluded'}
                        </span>
                      </label>
                    );
                  })}
                </div>

                {/* Live Split Summary */}
                {parseFloat(expenseAmount) > 0 && selectedParticipantIds.length > 0 && (
                  <div className="pt-2 border-t border-slate-200/70 flex items-center justify-between text-xs text-slate-600">
                    <span>Each person pays:</span>
                    <span className="font-extrabold text-slate-900">
                      ₹{(Math.round((parseFloat(expenseAmount) / selectedParticipantIds.length) * 100) / 100).toLocaleString('en-IN', { minimumFractionDigits: 0, maximumFractionDigits: 2 })}
                      <span className="font-normal text-[11px] text-slate-500 ml-1">
                        ({selectedParticipantIds.length} {selectedParticipantIds.length === 1 ? 'person' : 'people'})
                      </span>
                    </span>
                  </div>
                )}
              </div>

              {/* Form Validation Error */}
              {expenseFormError && (
                <div className="p-2.5 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span className="leading-tight">{expenseFormError}</span>
                </div>
              )}

              {/* Action Buttons */}
              <div className="pt-2 flex items-center justify-end gap-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsAddExpenseOpen(false)}
                  className="px-3.5 py-2 rounded-xl text-xs font-medium text-slate-600 hover:bg-slate-100 transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingExpense}
                  className={`px-4 py-2 rounded-xl text-xs font-bold text-white shadow-sm flex items-center gap-1.5 transition cursor-pointer ${
                    isSubmittingExpense
                      ? 'bg-purple-400 cursor-not-allowed'
                      : 'bg-purple-600 hover:bg-purple-700 active:scale-[0.98]'
                  }`}
                >
                  {isSubmittingExpense && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  <span>{isSubmittingExpense ? 'Saving...' : editingExpense ? 'Update Expense' : 'Save Expense'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 2. EXPENSE SPLIT BREAKDOWN MODAL */}
      {viewingExpense && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-5 sm:p-6 shadow-xl border border-slate-200 text-left animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-start justify-between pb-3 border-b border-slate-100">
              <div className="min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="text-lg font-bold text-slate-900 truncate">
                    {viewingExpense.title}
                  </h3>
                </div>
                <p className="text-xs text-slate-500 mt-1">
                  Paid by <span className="font-semibold text-slate-800">{viewingExpense.paidBy}</span> on {formatDate(viewingExpense.date)}
                </p>
              </div>
              <button
                onClick={() => setViewingExpense(null)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Total Amount Big Banner */}
            <div className="my-4 p-4 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                Total Expense
              </span>
              <span className="text-xl font-black text-slate-900">
                ₹{(viewingExpense.totalAmount || viewingExpense.amount || 0).toLocaleString('en-IN')}
              </span>
            </div>

            {/* Participants Breakdown Table */}
            <div className="space-y-2">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 block">
                Split Breakdown
              </span>
              <div className="divide-y divide-slate-100 border border-slate-200 rounded-xl overflow-hidden">
                {(viewingExpense.participants || []).map((p) => {
                  const isPayer = p.name.toLowerCase() === viewingExpense.paidBy.toLowerCase();
                  return (
                    <div
                      key={p.userId || p.name}
                      className="p-3 flex items-center justify-between text-xs bg-white"
                    >
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-slate-800">{p.name}</span>
                        {isPayer && (
                          <span className="px-1.5 py-0.2 rounded bg-emerald-50 text-emerald-700 text-[10px] font-semibold">
                            Payer
                          </span>
                        )}
                      </div>
                      <div className="text-right">
                        <span className="font-bold text-slate-900">
                          ₹{Math.round(p.share).toLocaleString('en-IN')}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {viewingExpense.notes && (
              <div className="mt-3 p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs text-slate-600">
                <span className="font-semibold text-slate-700">Note: </span>
                {viewingExpense.notes}
              </div>
            )}

            {/* Action Buttons */}
            <div className="mt-5 pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
              {canModifyExpense(viewingExpense) || canDeleteExpense(viewingExpense) ? (
                <div className="flex items-center gap-2">
                  {canModifyExpense(viewingExpense) && (
                    <button
                      onClick={() => {
                        const exp = viewingExpense;
                        setViewingExpense(null);
                        openEditExpenseModal(exp);
                      }}
                      className="px-3 py-2 rounded-xl text-xs font-semibold text-red-600 hover:bg-red-50 border border-red-200 cursor-pointer"
                    >
                      Edit
                    </button>
                  )}
                  {canDeleteExpense(viewingExpense) && (
                    <button
                      onClick={() => {
                        const exp = viewingExpense;
                        setViewingExpense(null);
                        setDeleteConfirmExpense(exp);
                      }}
                      className="px-3 py-2 rounded-xl text-xs font-semibold text-rose-600 hover:bg-rose-50 border border-rose-200 cursor-pointer"
                    >
                      Delete
                    </button>
                  )}
                </div>
              ) : (
                <span className="text-[11px] text-slate-400">View only</span>
              )}

              <button
                onClick={() => setViewingExpense(null)}
                className="px-4 py-2 rounded-xl text-xs font-semibold bg-slate-800 hover:bg-slate-900 text-white"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 3. SECURE SETTLE UP MODAL */}
      {isSettleModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-3 sm:p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-md w-full p-4 sm:p-5 shadow-2xl border border-slate-200/90 my-auto text-left animate-in fade-in zoom-in-95 duration-150 space-y-4">
            {/* Header with PocketBuddy Branding */}
            <div className="flex items-start justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-xl bg-emerald-50 border border-emerald-100/80 text-emerald-600 flex items-center justify-center shrink-0 shadow-2xs">
                  <Handshake className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-700 bg-emerald-100/70 px-1.5 py-0.5 rounded">
                      PocketBuddy
                    </span>
                    <span className="text-[11px] font-medium text-slate-400">Debt Settlement</span>
                  </div>
                  <h3 className="text-base sm:text-lg font-bold text-slate-900 leading-tight mt-0.5">
                    Settle Up
                  </h3>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  setIsSettleModalOpen(false);
                  setSettleError('');
                }}
                className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-100 transition shrink-0"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Error Message Banner */}
            {settleError && (
              <div className="p-2.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-start gap-2 animate-in fade-in">
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                <div className="flex-1 font-medium leading-tight">{settleError}</div>
                <button
                  type="button"
                  onClick={() => setSettleError('')}
                  className="text-rose-500 hover:text-rose-700"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            )}

            {/* Settle Form with Multi-Debt & Full Roommate Support */}
            <div className="space-y-3.5">
              {/* Type Switcher Tabs */}
              <div className="flex rounded-xl bg-slate-100 p-1 gap-1 text-xs font-semibold">
                <button
                  type="button"
                  onClick={() => {
                    setSettleDebtType('pay');
                    const myName = selfMember?.name || effectiveUserName || 'You';
                    setSettlePayer(myName);
                    const toName = myPayableDebts[0]?.to || members.find((m) => !selfNames.has(m.name.toLowerCase()))?.name || '';
                    setSettleReceiver(toName);
                    setSettleAmount(myPayableDebts[0]?.amount ? String(myPayableDebts[0].amount) : '');
                    setSettleError('');
                  }}
                  className={`flex-1 py-1.5 px-2 rounded-lg transition text-center cursor-pointer ${
                    settleDebtType === 'pay'
                      ? 'bg-white text-slate-900 shadow-2xs font-bold'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  I'm Paying {myPayableDebts.length > 0 ? `(${myPayableDebts.length})` : ''}
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setSettleDebtType('receive');
                    const myName = selfMember?.name || effectiveUserName || 'You';
                    setSettleReceiver(myName);
                    const fromName = myReceivableDebts[0]?.from || members.find((m) => !selfNames.has(m.name.toLowerCase()))?.name || '';
                    setSettlePayer(fromName);
                    setSettleAmount(myReceivableDebts[0]?.amount ? String(myReceivableDebts[0].amount) : '');
                    setSettleError('');
                  }}
                  className={`flex-1 py-1.5 px-2 rounded-lg transition text-center cursor-pointer ${
                    settleDebtType === 'receive'
                      ? 'bg-white text-slate-900 shadow-2xs font-bold'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  I'm Receiving {myReceivableDebts.length > 0 ? `(${myReceivableDebts.length})` : ''}
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setSettleDebtType('all');
                    setSettleError('');
                  }}
                  className={`py-1.5 px-2.5 rounded-lg transition text-center cursor-pointer ${
                    settleDebtType === 'all'
                      ? 'bg-white text-slate-900 shadow-2xs font-bold'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Custom
                </button>
              </div>

              {/* Informational banner if squared up in current tab */}
              {settleDebtType === 'pay' && myPayableDebts.length === 0 && (
                <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>You don't owe any money. You can still record a payment below if needed.</span>
                </div>
              )}

              {settleDebtType === 'receive' && myReceivableDebts.length === 0 && (
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-slate-700 text-xs flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-slate-500 shrink-0" />
                  <span>No roommate owes you money right now. You can still record a payment received below.</span>
                </div>
              )}

              <form onSubmit={handleConfirmSettlement} className="space-y-3.5">
                {/* Debtor (Who is paying) & Creditor (Who is receiving) */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {/* Payer */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Who is Paying (Debtor) *
                    </label>
                    <select
                      value={settlePayer}
                      onChange={(e) => {
                        setSettlePayer(e.target.value);
                        setSettleError('');
                      }}
                      required
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs sm:text-sm font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 bg-white transition"
                    >
                      <option value="" disabled>Select Payer</option>
                      {members.map((m) => {
                        const isMe = selfNames.has(m.name.toLowerCase());
                        return (
                          <option key={m.id || m.name} value={m.name}>
                            {m.name}{isMe ? ' (You)' : ''}
                          </option>
                        );
                      })}
                    </select>
                  </div>

                  {/* Receiver */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Who is Receiving (Creditor) *
                    </label>
                    <select
                      value={settleReceiver}
                      onChange={(e) => {
                        setSettleReceiver(e.target.value);
                        setSettleError('');
                      }}
                      required
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs sm:text-sm font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 bg-white transition"
                    >
                      <option value="" disabled>Select Receiver</option>
                      {members.map((m) => {
                        const isMe = selfNames.has(m.name.toLowerCase());
                        return (
                          <option key={m.id || m.name} value={m.name}>
                            {m.name}{isMe ? ' (You)' : ''}
                          </option>
                        );
                      })}
                    </select>
                  </div>
                </div>

                {/* Amount & Payment Mode */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="block text-xs font-semibold text-slate-700">
                        Amount *
                      </label>
                      {(() => {
                        // Find matching debt between settlePayer and settleReceiver
                        const match = debts.find(
                          (d) =>
                            d.from.toLowerCase() === settlePayer.toLowerCase() &&
                            d.to.toLowerCase() === settleReceiver.toLowerCase()
                        );
                        if (match && match.amount > 0) {
                          return (
                            <button
                              type="button"
                              onClick={() => {
                                setSettleAmount(String(match.amount));
                                setSettleError('');
                              }}
                              className="text-[10px] text-emerald-700 font-semibold hover:underline"
                            >
                              Full: ₹{match.amount}
                            </button>
                          );
                        }
                        return null;
                      })()}
                    </div>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-sm">
                        ₹
                      </span>
                      <input
                        type="number"
                        step="any"
                        min="1"
                        required
                        placeholder="Amount ₹"
                        value={settleAmount}
                        onChange={(e) => {
                          setSettleAmount(e.target.value);
                          setSettleError('');
                        }}
                        className="w-full pl-7 pr-3 py-2 rounded-xl border border-slate-300 text-xs sm:text-sm font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 transition"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Payment Mode *
                    </label>
                    <select
                      value={settleMode}
                      onChange={(e) => setSettleMode(e.target.value as 'UPI' | 'Cash')}
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs sm:text-sm font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 bg-white transition"
                    >
                      <option value="UPI">UPI (GPay / PhonePe / Paytm)</option>
                      <option value="Cash">Cash</option>
                    </select>
                  </div>
                </div>

                {/* Note */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Note (Optional)
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Paid via Google Pay / Cash settled"
                    value={settleNote}
                    onChange={(e) => setSettleNote(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs sm:text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 transition"
                  />
                </div>

                {/* Settle Up Confirmation notice */}
                <div className="p-2.5 rounded-xl bg-amber-50/80 border border-amber-200/90 text-amber-900 text-[11px] flex items-start gap-2">
                  <Bell className="w-3.5 h-3.5 text-amber-600 shrink-0 mt-0.5" />
                  <span>
                    <strong>Settlement Confirmation:</strong> Recording this will send a confirmation notification to <strong>{settleReceiver || 'the receiver'}</strong>. The debt will be cleared only after they <strong>Accept</strong> it.
                  </span>
                </div>

                {/* Actions */}
                <div className="pt-2 flex items-center justify-end gap-2 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => {
                      setIsSettleModalOpen(false);
                      setSettleError('');
                    }}
                    className="px-3.5 py-2 rounded-xl text-xs font-medium text-slate-600 hover:bg-slate-100 transition cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmittingSettle || !settleAmount || parseFloat(settleAmount) <= 0}
                    className="px-4 py-2 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm transition disabled:opacity-50 cursor-pointer flex items-center gap-1.5 active:scale-[0.98]"
                  >
                    {isSubmittingSettle ? (
                      <>
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        <span>Sending Request...</span>
                      </>
                    ) : (
                      <span>Send Settlement Request</span>
                    )}
                  </button>
                </div>
              </form>
            </div>

            {/* Shared Settlements History */}
            {settlements.length > 0 && (
              <div className="pt-3 border-t border-slate-100">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                    Room Settlement History
                  </span>
                  <span className="text-[11px] text-slate-400">
                    {settlements.length} {settlements.length === 1 ? 'record' : 'records'}
                  </span>
                </div>
                <div className="space-y-1.5 max-h-36 overflow-y-auto pr-0.5">
                  {settlements.map((s) => {
                    const isReceiver =
                      (s.creditorId && s.creditorId === currentUser?.id) ||
                      (s.toUserId && s.toUserId === currentUser?.id) ||
                      selfNames.has(s.to.toLowerCase());

                    const isPayer =
                      s.createdBy === currentUser?.id ||
                      (s.debtorId && s.debtorId === currentUser?.id) ||
                      (s.fromUserId && s.fromUserId === currentUser?.id) ||
                      selfNames.has(s.from.toLowerCase());

                    const canDelete =
                      s.status === 'pending'
                        ? isPayer
                        : (s.createdBy === currentUser?.id || s.ownerId === currentUser?.id || isPayer);

                    const isPending = s.status === 'pending';
                    const isRejected = s.status === 'rejected';

                    return (
                      <div
                        key={s.id}
                        className={`p-2.5 rounded-xl border flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-[11px] ${
                          isPending ? 'bg-amber-50/70 border-amber-200' : isRejected ? 'bg-rose-50/50 border-rose-200' : 'bg-slate-50 border-slate-200'
                        }`}
                      >
                        <div className="flex-1 min-w-0 pr-2">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="font-bold text-slate-800">{s.from}</span>
                            <span className="text-slate-500">{isPending ? 'marked' : 'settled'}</span>
                            <span className="font-bold text-emerald-600">₹{s.amount}</span>
                            <span className="text-slate-500">to</span>
                            <span className="font-bold text-slate-800">{s.to}</span>
                            
                            {isPending && (
                              <span className="px-1.5 py-0.5 rounded-md bg-amber-100 text-amber-800 font-bold text-[9px] border border-amber-200 flex items-center gap-1">
                                <Clock className="w-2.5 h-2.5" />
                                Awaiting {s.to}'s Acceptance
                              </span>
                            )}
                            {s.status === 'completed' && (
                              <span className="px-1.5 py-0.5 rounded-md bg-emerald-100 text-emerald-700 font-bold text-[9px] border border-emerald-200 flex items-center gap-1">
                                <Check className="w-2.5 h-2.5" />
                                Completed
                              </span>
                            )}
                            {isRejected && (
                              <span className="px-1.5 py-0.5 rounded-md bg-rose-100 text-rose-700 font-bold text-[9px] border border-rose-200">
                                Not Received
                              </span>
                            )}
                          </div>
                          <span className="text-slate-400 block text-[10px] mt-0.5">
                            {formatDate(s.date)} • {s.mode || 'UPI'}
                            {s.note ? ` • ${s.note}` : ''}
                          </span>
                        </div>

                        <div className="flex items-center gap-1.5 shrink-0 self-end sm:self-center">
                          {isPending && isReceiver && (
                            <>
                              <button
                                type="button"
                                disabled={processingSettleId === s.id}
                                onClick={() => handleAcceptClick(s.id)}
                                className="px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[10px] transition cursor-pointer flex items-center gap-1"
                              >
                                {processingSettleId === s.id ? (
                                  <Loader2 className="w-2.5 h-2.5 animate-spin" />
                                ) : (
                                  <Check className="w-2.5 h-2.5" />
                                )}
                                <span>Accept</span>
                              </button>
                              <button
                                type="button"
                                disabled={processingSettleId === s.id}
                                onClick={() => handleRejectClick(s.id)}
                                className="px-2 py-1 rounded-lg bg-white hover:bg-rose-50 text-slate-600 hover:text-rose-600 border border-slate-200 font-semibold text-[10px] transition cursor-pointer"
                              >
                                Decline
                              </button>
                            </>
                          )}

                          {canDelete && (
                            <button
                              onClick={() => onDeleteSettlement(s.id)}
                              className="text-slate-400 hover:text-rose-600 p-1 rounded transition shrink-0"
                              title="Delete/cancel settlement record"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* 4. DELETE EXPENSE CONFIRMATION MODAL */}
      {deleteConfirmExpense && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl max-w-sm w-full p-5 shadow-xl border border-slate-200 text-left animate-in fade-in zoom-in-95 duration-150">
            <h3 className="text-base font-bold text-slate-900">Delete Shared Expense?</h3>
            <p className="text-xs text-slate-600 mt-2 leading-relaxed">
              Are you sure you want to delete <span className="font-semibold">"{deleteConfirmExpense.title}"</span> (₹{deleteConfirmExpense.totalAmount || deleteConfirmExpense.amount})?
              This will remove it from the room ledger and recalculate all balances.
            </p>
            <div className="mt-4 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setDeleteConfirmExpense(null)}
                className="px-3.5 py-2 rounded-xl text-xs font-medium text-slate-600 hover:bg-slate-100"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={async () => {
                  const id = deleteConfirmExpense.id;
                  setDeleteConfirmExpense(null);
                  await onDeleteExpense(id);
                }}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-rose-600 hover:bg-rose-700 text-white shadow-sm"
              >
                Delete Expense
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 4B. EXPENSE DETAIL MODAL (Compact on demand breakdown for deep details) */}
      {selectedDetailExpense && (() => {
        const exp = selectedDetailExpense;
        const totalAmt = exp.totalAmount || exp.amount || 0;
        const isPaidBySelf = selfNames.has(exp.paidBy.toLowerCase());
        const isAllowed = canModifyExpense(exp);
        const participantsList = Array.isArray(exp.participants) ? exp.participants : [];

        // Debts specifically for this expense
        const expDebts: { from: string; amount: number; to: string }[] = [];
        participantsList.forEach((p) => {
          if (p.name.toLowerCase() !== exp.paidBy.toLowerCase() && p.share > 0) {
            expDebts.push({
              from: p.name,
              amount: Math.round(p.share),
              to: exp.paidBy,
            });
          }
        });

        return (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
            <div className="bg-white rounded-2xl max-w-sm w-full p-4 sm:p-5 shadow-xl border border-slate-200 text-left animate-in fade-in zoom-in-95 duration-150 space-y-3.5 max-h-[90vh] overflow-y-auto">
              <div className="flex items-start justify-between gap-2 pb-2.5 border-b border-slate-100">
                <div className="min-w-0 flex-1 space-y-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="text-base font-extrabold text-slate-900 leading-tight">{exp.title}</h3>
                    {exp.category && (
                      <span className="text-[10px] font-semibold px-2 py-0.5 rounded-md bg-slate-100 text-slate-600 border border-slate-200/70">
                        {exp.category}
                      </span>
                    )}
                  </div>
                  <div className="flex items-baseline gap-2">
                    <span className="text-xs font-semibold text-slate-500">Total Amount:</span>
                    <span className="font-black text-slate-900 text-lg">
                      ₹{Math.round(totalAmt).toLocaleString('en-IN')}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500">
                    Paid by <strong className="font-bold text-slate-800">{exp.paidBy}{isPaidBySelf ? ' (You)' : ''}</strong>
                    {' '}· {formatDateTime(exp.createdAt || exp.date)}
                  </p>
                </div>
                <button
                  onClick={() => setSelectedDetailExpense(null)}
                  className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg transition hover:bg-slate-100"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Note / description if present */}
              {exp.notes && (
                <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100 text-xs text-slate-600">
                  <span className="font-semibold text-slate-700 block mb-0.5">Note:</span>
                  <p className="leading-relaxed">{exp.notes}</p>
                </div>
              )}

              {/* Participant breakdown */}
              <div className="space-y-1.5 text-xs">
                <span className="font-bold text-slate-700 text-xs block">
                  Split Breakdown ({participantsList.length} people):
                </span>
                <div className="space-y-1">
                  {participantsList.map((p, idx) => {
                    const isMe = selfNames.has(p.name.toLowerCase());
                    return (
                      <div
                        key={idx}
                        className={`flex items-center justify-between px-2.5 py-1.5 rounded-lg border text-xs ${
                          isMe
                            ? 'bg-red-50/70 border-red-200 text-red-900 font-semibold'
                            : 'bg-slate-50 border-slate-200/80 text-slate-700'
                        }`}
                      >
                        <span>{p.name}{isMe ? ' (You)' : ''}</span>
                        <span className="font-bold">₹{Math.round(p.share).toLocaleString('en-IN')}</span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Individual Debt calculation for this expense */}
              {expDebts.length > 0 && (
                <div className="pt-2 border-t border-slate-100 space-y-1.5 text-xs">
                  <span className="font-bold text-slate-700 text-xs block">
                    Debts Created by this Expense:
                  </span>
                  <div className="space-y-1">
                    {expDebts.map((d, dIdx) => {
                      const isFromMe = selfNames.has(d.from.toLowerCase());
                      const isToMe = selfNames.has(d.to.toLowerCase());

                      return (
                        <div
                          key={dIdx}
                          className="px-2.5 py-1 rounded-lg bg-slate-50 border border-slate-100 flex items-center justify-between text-xs"
                        >
                          {isFromMe ? (
                            <span className="font-semibold text-rose-600">
                              You owe {d.to}
                            </span>
                          ) : isToMe ? (
                            <span className="font-semibold text-emerald-600">
                              {d.from} owes You
                            </span>
                          ) : (
                            <span className="text-slate-600">
                              {d.from} owes {d.to}
                            </span>
                          )}
                          <span className="font-bold text-slate-800">
                            ₹{d.amount.toLocaleString('en-IN')}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Action buttons inside modal */}
              <div className="pt-2 flex items-center justify-between border-t border-slate-100 gap-2">
                <div className="flex items-center gap-1.5">
                  {isAllowed && (
                    <button
                      type="button"
                      onClick={() => {
                        const target = exp;
                        setSelectedDetailExpense(null);
                        openEditExpenseModal(target);
                      }}
                      className="px-3 py-1.5 rounded-lg text-xs font-semibold text-red-700 bg-red-50 hover:bg-red-100 transition flex items-center gap-1 cursor-pointer"
                    >
                      <Edit2 className="w-3 h-3" />
                      <span>Edit</span>
                    </button>
                  )}
                  {canDeleteExpense(exp) && (
                    <button
                      type="button"
                      onClick={() => {
                        const target = exp;
                        setSelectedDetailExpense(null);
                        setDeleteConfirmExpense(target);
                      }}
                      className="px-3 py-1.5 rounded-lg text-xs font-semibold text-rose-700 bg-rose-50 hover:bg-rose-100 transition flex items-center gap-1 cursor-pointer"
                    >
                      <Trash2 className="w-3 h-3" />
                      <span>Delete</span>
                    </button>
                  )}
                </div>

                <button
                  type="button"
                  onClick={() => setSelectedDetailExpense(null)}
                  className="px-3.5 py-1.5 rounded-lg text-xs font-medium text-slate-600 hover:bg-slate-100 transition"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        );
      })()}

      {/* 5. ADD ROOMMATE MODAL */}
      {isAddRoommateOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl max-w-sm w-full p-5 shadow-xl border border-slate-200 text-left animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-base font-bold text-slate-900">Add Roommate</h3>
              <button
                onClick={() => setIsAddRoommateOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateRoommate} className="mt-3 space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  Name *
                </label>
                <input
                  type="text"
                  required
                  autoFocus
                  placeholder="e.g. Rohan Sharma"
                  value={newMemberName}
                  onChange={(e) => setNewMemberName(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs focus:outline-none focus:ring-1 focus:ring-red-600"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  UPI ID (Optional)
                </label>
                <input
                  type="text"
                  placeholder="e.g. rohan@upi"
                  value={newMemberUpi}
                  onChange={(e) => setNewMemberUpi(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs focus:outline-none focus:ring-1 focus:ring-red-600"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  Mobile Number (Optional)
                </label>
                <input
                  type="tel"
                  placeholder="e.g. 9876543210"
                  value={newMemberPhone}
                  onChange={(e) => setNewMemberPhone(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs focus:outline-none focus:ring-1 focus:ring-red-600"
                />
              </div>

              {addMemberError && (
                <div className="p-2.5 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl flex items-center gap-1.5">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{addMemberError}</span>
                </div>
              )}

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsAddRoommateOpen(false)}
                  className="px-3.5 py-2 rounded-xl text-xs font-medium text-slate-600 hover:bg-slate-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={members.length >= 12}
                  className="px-4 py-2 rounded-xl text-xs font-bold bg-red-600 hover:bg-red-700 text-white shadow-sm disabled:opacity-50"
                >
                  Add Roommate
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 6. SHARE / INVITE MODAL */}
      {isShareModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl max-w-sm w-full p-5 sm:p-6 shadow-xl border border-slate-200 text-center animate-in fade-in zoom-in-95 duration-150 space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100 text-left">
              <h3 className="text-base font-bold text-slate-900">Invite Roommates</h3>
              <button
                onClick={() => setIsShareModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-slate-600">
              Share this code with your flatmates or hostel roommates so they can join "{currentRoom.name}".
            </p>

            {/* Room Invite Code Box */}
            <div className="p-4 rounded-xl bg-red-50/60 border border-red-200">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-red-700 block">
                Room Invite Code
              </span>
              <span className="text-2xl font-mono font-black text-red-950 tracking-widest block mt-1">
                {currentRoom.inviteCode}
              </span>
            </div>

            <div className="space-y-2">
              <button
                onClick={handleCopyInviteCode}
                className="w-full py-2.5 px-4 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-bold flex items-center justify-center gap-2 transition shadow-sm shadow-red-600/20"
              >
                {copiedCode ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                <span>{copiedCode ? 'Code Copied!' : 'Copy Code'}</span>
              </button>

              <button
                onClick={handleCopyInviteMessage}
                className="w-full py-2.5 px-4 rounded-xl bg-white hover:bg-slate-50 border border-slate-300 text-slate-800 text-xs font-semibold flex items-center justify-center gap-2 transition"
              >
                {copiedMessage ? <Check className="w-4 h-4 text-emerald-600" /> : <Share2 className="w-4 h-4 text-slate-600" />}
                <span>{copiedMessage ? 'Invite Message Copied!' : 'Copy WhatsApp Message'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 7. ROOM SETTINGS & MENU MODAL */}
      {isSettingsModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl max-w-sm w-full p-5 shadow-xl border border-slate-200 text-left animate-in fade-in zoom-in-95 duration-150 space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <h3 className="text-base font-bold text-slate-900">Room Settings</h3>
              <button
                onClick={() => setIsSettingsModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Switch Rooms if multiple */}
            {allRooms && allRooms.length > 1 && (
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  Switch Room
                </label>
                <select
                  value={currentRoom.id}
                  onChange={(e) => {
                    onSelectRoom(e.target.value);
                    setIsSettingsModalOpen(false);
                  }}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs focus:outline-none focus:ring-1 focus:ring-red-600 bg-white"
                >
                  {allRooms.map((r) => (
                    <option key={r.id} value={r.id}>
                      {r.name} ({r.members?.length || 0} members)
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Manage Roommates */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 block">
                  Room Members ({members.length})
                </span>
                {isRoomOwner && (
                  <span className="text-[10px] font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200 flex items-center gap-1">
                    <Shield className="w-2.5 h-2.5" />
                    You are Room Admin
                  </span>
                )}
              </div>
              <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
                {members.map((m) => {
                  const isSelf =
                    m.name.toLowerCase() === effectiveUserName.toLowerCase() ||
                    (m.userId && m.userId === effectiveUserId);
                  const isMemberAdmin =
                    m.role === 'owner' ||
                    (currentRoom.ownerId && (m.userId === currentRoom.ownerId || m.id === currentRoom.ownerId));

                  return (
                    <div
                      key={m.id || m.name}
                      className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between text-xs"
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <div className="w-6 h-6 rounded-full bg-slate-200 text-slate-700 font-bold flex items-center justify-center text-[10px] shrink-0">
                          {m.name.charAt(0).toUpperCase()}
                        </div>
                        <span className="font-semibold text-slate-800 truncate">
                          {m.name}
                        </span>
                        {isSelf && (
                          <span className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-red-50 text-red-700 border border-red-100 shrink-0">
                            You
                          </span>
                        )}
                        {isMemberAdmin && (
                          <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-amber-50 text-amber-800 border border-amber-200 shrink-0 flex items-center gap-0.5">
                            <Shield className="w-2.5 h-2.5" />
                            Admin
                          </span>
                        )}
                      </div>

                      {/* ONLY the room admin can remove other members */}
                      {isRoomOwner && !isSelf && (
                        <button
                          type="button"
                          onClick={() => {
                            setRemoveMemberConfirm({ id: m.id || m.userId || '', name: m.name });
                          }}
                          className="text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg px-2 py-1 text-[11px] font-medium transition cursor-pointer shrink-0"
                          title={`Remove ${m.name} from room`}
                        >
                          Remove
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Quick Actions */}
            <div className="pt-2 border-t border-slate-100 space-y-2">
              <button
                type="button"
                onClick={() => {
                  setIsSettingsModalOpen(false);
                  setIsCreateRoomOpen(true);
                }}
                className="w-full py-2 px-3 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-semibold flex items-center gap-2 transition cursor-pointer"
              >
                <Plus className="w-4 h-4 text-slate-500" />
                <span>Create Another Room</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setIsSettingsModalOpen(false);
                  setIsJoinRoomOpen(true);
                }}
                className="w-full py-2 px-3 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-semibold flex items-center gap-2 transition cursor-pointer"
              >
                <Users className="w-4 h-4 text-slate-500" />
                <span>Join with Room Code</span>
              </button>

              {/* ONLY ADMIN/CREATOR WHO MADE THE ROOM CAN DELETE IT */}
              {isRoomOwner ? (
                <div className="space-y-1">
                  <button
                    type="button"
                    onClick={() => {
                      setDeleteConfirmRoom(currentRoom);
                    }}
                    className="w-full py-2.5 px-3 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-bold flex items-center justify-between transition border border-rose-200 cursor-pointer"
                  >
                    <div className="flex items-center gap-2">
                      <Trash2 className="w-4 h-4 text-rose-600" />
                      <span>Delete Room</span>
                    </div>
                    <span className="text-[10px] font-extrabold uppercase tracking-wide px-2 py-0.5 rounded-full bg-rose-200/80 text-rose-800">
                      Admin Only
                    </span>
                  </button>
                  <p className="text-[11px] text-slate-500 text-center">
                    As room creator, deleting will remove this room for all roommates.
                  </p>
                </div>
              ) : (
                /* REGULAR ROOMMATES: CAN LEAVE ROOM, CANNOT DELETE IT */
                <div className="space-y-1">
                  <button
                    type="button"
                    onClick={() => {
                      setLeaveConfirmRoom(currentRoom);
                    }}
                    className="w-full py-2.5 px-3 rounded-xl bg-slate-100 hover:bg-rose-50 text-slate-700 hover:text-rose-700 text-xs font-semibold flex items-center justify-between transition border border-slate-200 cursor-pointer"
                  >
                    <div className="flex items-center gap-2">
                      <LogOut className="w-4 h-4 text-slate-500" />
                      <span>Leave Room</span>
                    </div>
                    <span className="text-[10px] text-slate-500 font-medium">Roommate</span>
                  </button>
                  <p className="text-[11px] text-slate-500 text-center">
                    Only the room admin can delete the room. You can leave anytime.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* CONFIRMATION MODAL: DELETE ROOM (ADMIN ONLY) */}
      {deleteConfirmRoom && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-60">
          <div className="bg-white rounded-2xl max-w-sm w-full p-5 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95 duration-150">
            <div className="w-12 h-12 rounded-2xl bg-rose-100 text-rose-600 flex items-center justify-center mx-auto mb-3">
              <Trash2 className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-slate-900 text-center mb-1">
              Delete Room Permanently?
            </h3>
            <p className="text-xs text-slate-600 text-center mb-4 leading-relaxed">
              Are you sure you want to delete <span className="font-bold text-slate-900">"{deleteConfirmRoom.name}"</span>?
              All expenses, balances, and history in this room will be permanently deleted for all {deleteConfirmRoom.members?.length || 0} roommates.
              This action cannot be undone.
            </p>

            {actionError && (
              <div className="mb-3 p-2.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs text-center font-medium">
                {actionError}
              </div>
            )}

            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => {
                  setDeleteConfirmRoom(null);
                  setActionError(null);
                }}
                disabled={isDeletingRoom}
                className="flex-1 py-2.5 px-3 rounded-xl border border-slate-200 text-slate-700 text-xs font-semibold hover:bg-slate-50 transition cursor-pointer disabled:opacity-60"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isDeletingRoom}
                onClick={async () => {
                  setIsDeletingRoom(true);
                  setActionError(null);
                  try {
                    const result = await onDeleteRoom(deleteConfirmRoom.id);
                    if (result && result.error) {
                      setActionError(result.error);
                      return;
                    }
                    setDeleteConfirmRoom(null);
                    setIsSettingsModalOpen(false);
                  } catch (err: any) {
                    console.error('Failed to delete room:', err);
                    setActionError(err?.message || 'Failed to delete room');
                  } finally {
                    setIsDeletingRoom(false);
                  }
                }}
                className="flex-1 py-2.5 px-3 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold shadow-xs transition flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-60"
              >
                {isDeletingRoom ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>Deleting...</span>
                  </>
                ) : (
                  <>
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Delete Room</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CONFIRMATION MODAL: LEAVE ROOM (ROOMMATES) */}
      {leaveConfirmRoom && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-60">
          <div className="bg-white rounded-2xl max-w-sm w-full p-5 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95 duration-150">
            <div className="w-12 h-12 rounded-2xl bg-amber-100 text-amber-600 flex items-center justify-center mx-auto mb-3">
              <LogOut className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-slate-900 text-center mb-1">
              Leave Room?
            </h3>
            <p className="text-xs text-slate-600 text-center mb-4 leading-relaxed">
              Are you sure you want to leave <span className="font-bold text-slate-900">"{leaveConfirmRoom.name}"</span>?
              You will no longer see this room unless you rejoin with code <span className="font-mono font-bold text-red-600">{leaveConfirmRoom.inviteCode}</span>.
            </p>

            {actionError && (
              <div className="mb-3 p-2.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs text-center font-medium">
                {actionError}
              </div>
            )}

            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => {
                  setLeaveConfirmRoom(null);
                  setActionError(null);
                }}
                disabled={isLeavingRoom}
                className="flex-1 py-2.5 px-3 rounded-xl border border-slate-200 text-slate-700 text-xs font-semibold hover:bg-slate-50 transition cursor-pointer disabled:opacity-60"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isLeavingRoom}
                onClick={async () => {
                  setIsLeavingRoom(true);
                  setActionError(null);
                  try {
                    if (onLeaveRoom) {
                      const res = await onLeaveRoom(leaveConfirmRoom.id);
                      if (res && res.error) {
                        setActionError(res.error);
                        return;
                      }
                    } else {
                      const myMemberId = (leaveConfirmRoom.members || []).find(
                        (m) => m.userId === currentUser?.id || m.id === currentUser?.id
                      )?.id;
                      if (myMemberId) {
                        await onRemoveRoommate(myMemberId);
                      }
                    }
                    setLeaveConfirmRoom(null);
                    setIsSettingsModalOpen(false);
                  } catch (err: any) {
                    console.error('Failed to leave room:', err);
                    setActionError(err?.message || 'Failed to leave room');
                  } finally {
                    setIsLeavingRoom(false);
                  }
                }}
                className="flex-1 py-2.5 px-3 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold shadow-xs transition flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-60"
              >
                {isLeavingRoom ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>Leaving...</span>
                  </>
                ) : (
                  <>
                    <LogOut className="w-3.5 h-3.5" />
                    <span>Leave Room</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CONFIRMATION MODAL: REMOVE ROOMMATE (ADMIN ONLY) */}
      {removeMemberConfirm && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-60">
          <div className="bg-white rounded-2xl max-w-sm w-full p-5 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95 duration-150">
            <div className="w-12 h-12 rounded-2xl bg-rose-100 text-rose-600 flex items-center justify-center mx-auto mb-3">
              <UserMinus className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-slate-900 text-center mb-1">
              Remove Roommate?
            </h3>
            <p className="text-xs text-slate-600 text-center mb-4 leading-relaxed">
              Remove <span className="font-bold text-slate-900">{removeMemberConfirm.name}</span> from this room?
              They will no longer have access to this room's shared expenses.
            </p>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setRemoveMemberConfirm(null)}
                className="flex-1 py-2.5 px-3 rounded-xl border border-slate-200 text-slate-700 text-xs font-semibold hover:bg-slate-50 transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={async () => {
                  await onRemoveRoommate(removeMemberConfirm.id);
                  setRemoveMemberConfirm(null);
                }}
                className="flex-1 py-2.5 px-3 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold shadow-xs transition flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <UserMinus className="w-3.5 h-3.5" />
                <span>Remove</span>
              </button>
            </div>
          </div>
        </div>
      )}
      {/* Create and Join Room Modals for active room view */}
      {renderCreateRoomModal()}
      {renderJoinRoomModal()}
    </div>
  );
};
