import { jsPDF } from 'jspdf';
import { Transaction, RoomGroup, RoomExpense, Roommate, RoomSettlement } from '../types';

export interface PDFDateFilter {
  startDate?: string;
  endDate?: string;
  dateRangeLabel?: string;
}

export interface PersonalPDFGeneratorOptions extends PDFDateFilter {
  transactions: Transaction[];
  filterMode?: string;
  searchQuery?: string;
  studentName?: string;
}

export interface RoomPDFGeneratorOptions extends PDFDateFilter {
  room: RoomGroup;
  currentUserName?: string;
  currentUserId?: string;
}

export interface GeneratedPDFResult {
  doc: jsPDF;
  filename: string;
  dataUri: string;
}

// -------------------------------------------------------------
// 1. MY MONEY / PERSONAL LEDGER PDF
// -------------------------------------------------------------

export function createLedgerPDFDoc({
  transactions,
  filterMode = 'all',
  searchQuery = '',
  studentName = 'Student Ledger',
  startDate,
  endDate,
  dateRangeLabel,
}: PersonalPDFGeneratorOptions): GeneratedPDFResult {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
    compress: true,
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 14;
  let y = 14;

  // Filter transactions by date range if provided
  let filteredList = Array.isArray(transactions) ? transactions.filter((t) => t && t.title) : [];

  if (startDate) {
    filteredList = filteredList.filter((t) => {
      const d = t.date ? t.date.split('T')[0] : '';
      return !d || d >= startDate;
    });
  }
  if (endDate) {
    filteredList = filteredList.filter((t) => {
      const d = t.date ? t.date.split('T')[0] : '';
      return !d || d <= endDate;
    });
  }

  // Sort descending by date
  filteredList.sort((a, b) => (b.date || '').localeCompare(a.date || ''));

  // Calculations
  const expenseList = filteredList.filter((t) => t.type === 'expense');
  const incomeList = filteredList.filter((t) => t.type === 'income');
  const totalExpense = expenseList.reduce((acc, t) => acc + (Number(t.amount) || 0), 0);
  const totalIncome = incomeList.reduce((acc, t) => acc + (Number(t.amount) || 0), 0);
  const upiExpense = expenseList
    .filter((t) => t.paymentMode === 'UPI')
    .reduce((acc, t) => acc + (Number(t.amount) || 0), 0);
  const cashExpense = expenseList
    .filter((t) => t.paymentMode === 'Cash')
    .reduce((acc, t) => acc + (Number(t.amount) || 0), 0);
  const upiIncome = incomeList
    .filter((t) => t.paymentMode === 'UPI')
    .reduce((acc, t) => acc + (Number(t.amount) || 0), 0);
  const cashIncome = incomeList
    .filter((t) => t.paymentMode === 'Cash')
    .reduce((acc, t) => acc + (Number(t.amount) || 0), 0);

  // --- HEADER SECTION ---
  doc.setFillColor(30, 27, 75); // Indigo 950
  doc.rect(0, 0, pageWidth, 40, 'F');

  // Accent stripe
  doc.setFillColor(79, 70, 229); // Indigo 600
  doc.rect(0, 40, pageWidth, 2.5, 'F');

  // App / Document Title
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(17);
  doc.text('POCKETBUDDY — MY MONEY EXPENSE STATEMENT', margin, 16);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(199, 210, 254); // Indigo 200
  const dateStr = new Date().toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
  doc.text(`Student: ${studentName}  |  Generated on: ${dateStr}`, margin, 23);

  // Range and filter description
  const rangeText = dateRangeLabel ? `Period: ${dateRangeLabel}` : (startDate && endDate ? `Period: ${startDate} to ${endDate}` : 'All Time History');
  const filterDesc = [
    rangeText,
    filterMode !== 'all' ? `Filter: ${filterMode}` : null,
    searchQuery ? `Search: "${searchQuery}"` : null,
  ].filter(Boolean).join('  •  ');

  doc.setFontSize(8.5);
  doc.setTextColor(224, 231, 255);
  doc.text(filterDesc, margin, 32);

  y = 50;

  // --- SUMMARY METRIC CARDS (4 cards) ---
  const cardWidth = (pageWidth - margin * 2 - 9) / 4;
  const cardHeight = 18;

  const cards = [
    { label: 'TOTAL EXPENSE', value: `Rs. ${totalExpense.toLocaleString('en-IN')}`, fill: [254, 242, 242], text: [185, 28, 28] },
    { label: 'TOTAL INCOME', value: `Rs. ${totalIncome.toLocaleString('en-IN')}`, fill: [240, 253, 244], text: [21, 128, 61] },
    { label: 'UPI SPENT / RCVD', value: `Rs. ${upiExpense.toLocaleString('en-IN')}`, fill: [238, 242, 255], text: [67, 56, 202] },
    { label: 'CASH SPENT / RCVD', value: `Rs. ${cashExpense.toLocaleString('en-IN')}`, fill: [248, 250, 252], text: [51, 65, 85] },
  ];

  cards.forEach((card, idx) => {
    const cardX = margin + idx * (cardWidth + 3);
    doc.setFillColor(card.fill[0], card.fill[1], card.fill[2]);
    doc.roundedRect(cardX, y, cardWidth, cardHeight, 2, 2, 'F');
    doc.setDrawColor(226, 232, 240);
    doc.roundedRect(cardX, y, cardWidth, cardHeight, 2, 2, 'S');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(6.5);
    doc.setTextColor(100, 116, 139);
    doc.text(card.label, cardX + 3, y + 6);

    doc.setFontSize(9.5);
    doc.setTextColor(card.text[0], card.text[1], card.text[2]);
    doc.text(card.value, cardX + 3, y + 13.5);
  });

  y += cardHeight + 8;

  // --- TABLE SECTION ---
  const colX = {
    date: margin,
    title: margin + 24,
    mode: margin + 115,
    type: margin + 140,
    amount: pageWidth - margin - 2,
  };

  const drawTableHeader = (posY: number) => {
    doc.setFillColor(241, 245, 249);
    doc.rect(margin, posY, pageWidth - margin * 2, 7.5, 'F');
    doc.setDrawColor(203, 213, 225);
    doc.line(margin, posY + 7.5, pageWidth - margin, posY + 7.5);

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7.5);
    doc.setTextColor(51, 65, 85);

    doc.text('DATE', colX.date + 2, posY + 5.2);
    doc.text('DESCRIPTION / TITLE', colX.title, posY + 5.2);
    doc.text('PAYMENT MODE', colX.mode, posY + 5.2);
    doc.text('CATEGORY / TYPE', colX.type, posY + 5.2);
    doc.text('AMOUNT (Rs.)', colX.amount, posY + 5.2, { align: 'right' });
  };

  drawTableHeader(y);
  y += 9.5;

  if (filteredList.length === 0) {
    doc.setFont('helvetica', 'italic');
    doc.setFontSize(9);
    doc.setTextColor(148, 163, 184);
    doc.text('No transactions recorded for the selected date range and filter.', margin + 4, y + 6);
    y += 15;
  } else {
    filteredList.forEach((item, index) => {
      if (y > pageHeight - 20) {
        renderPageFooter(doc, pageWidth, pageHeight, 'PocketBuddy • Personal Expense Statement');
        doc.addPage();
        y = 15;
        drawTableHeader(y);
        y += 9.5;
      }

      if (index % 2 === 1) {
        doc.setFillColor(248, 250, 252);
        doc.rect(margin, y - 2, pageWidth - margin * 2, 8, 'F');
      }

      doc.setDrawColor(241, 245, 249);
      doc.line(margin, y + 5.5, pageWidth - margin, y + 5.5);

      // Date
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8);
      doc.setTextColor(71, 85, 105);
      doc.text(item.date ? item.date.split('T')[0] : 'N/A', colX.date + 2, y + 3);

      // Title & notes
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8);
      doc.setTextColor(15, 23, 42);
      let titleText = item.title || 'Untitled';
      if (item.person) titleText += ` [${item.person}]`;
      if (titleText.length > 50) titleText = titleText.substring(0, 48) + '...';
      doc.text(titleText, colX.title, y + 3);

      // Payment Mode
      const isUPI = item.paymentMode === 'UPI';
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(7.5);
      if (isUPI) {
        doc.setTextColor(79, 70, 229);
      } else {
        doc.setTextColor(5, 150, 105);
      }
      doc.text(item.paymentMode || 'Cash', colX.mode, y + 3);

      // Category / Type
      const isExpense = item.type === 'expense';
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7.5);
      doc.setTextColor(100, 116, 139);
      const catText = item.category ? `${item.category} (${isExpense ? 'Exp' : 'Inc'})` : (isExpense ? 'Expense' : 'Income');
      doc.text(catText, colX.type, y + 3);

      // Amount
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8.5);
      if (isExpense) {
        doc.setTextColor(225, 29, 72); // Rose 600
        doc.text(`- Rs. ${Number(item.amount || 0).toLocaleString('en-IN')}`, colX.amount, y + 3, { align: 'right' });
      } else {
        doc.setTextColor(16, 185, 129); // Emerald 600
        doc.text(`+ Rs. ${Number(item.amount || 0).toLocaleString('en-IN')}`, colX.amount, y + 3, { align: 'right' });
      }

      y += 8;
    });
  }

  // Summary footer row
  if (y > pageHeight - 25) {
    renderPageFooter(doc, pageWidth, pageHeight, 'PocketBuddy • Personal Expense Statement');
    doc.addPage();
    y = 15;
  }

  y += 4;
  doc.setFillColor(241, 245, 249);
  doc.rect(margin, y, pageWidth - margin * 2, 10, 'F');
  doc.setDrawColor(203, 213, 225);
  doc.rect(margin, y, pageWidth - margin * 2, 10, 'S');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(15, 23, 42);
  doc.text(`TOTAL EXPENSES: Rs. ${totalExpense.toLocaleString('en-IN')}  |  TOTAL INCOME: Rs. ${totalIncome.toLocaleString('en-IN')}`, margin + 4, y + 6.5);

  const netBalance = totalIncome - totalExpense;
  doc.setFontSize(9);
  if (netBalance >= 0) {
    doc.setTextColor(16, 185, 129);
    doc.text(`Net: +Rs. ${netBalance.toLocaleString('en-IN')}`, colX.amount, y + 6.5, { align: 'right' });
  } else {
    doc.setTextColor(225, 29, 72);
    doc.text(`Net: -Rs. ${Math.abs(netBalance).toLocaleString('en-IN')}`, colX.amount, y + 6.5, { align: 'right' });
  }

  renderPageFooter(doc, pageWidth, pageHeight, 'PocketBuddy • Personal Expense Statement');

  const dateStamp = new Date().toISOString().split('T')[0];
  const filename = `PocketBuddy_Personal_Report_${dateStamp}.pdf`;
  const rawUri = doc.output('datauristring');
  const base64Data = rawUri.includes(',') ? rawUri.split(',')[1] : rawUri;
  const dataUri = `data:application/pdf;base64,${base64Data}`;

  return { doc, filename, dataUri };
}

export function generateLedgerPDF(options: PersonalPDFGeneratorOptions): void {
  const { doc, filename } = createLedgerPDFDoc(options);
  doc.save(filename);
}

// -------------------------------------------------------------
// 2. MY ROOM / SHARED EXPENSES LEDGER PDF
// -------------------------------------------------------------

export function createRoomLedgerPDFDoc({
  room,
  currentUserName = 'You',
  currentUserId,
  startDate,
  endDate,
  dateRangeLabel,
}: RoomPDFGeneratorOptions): GeneratedPDFResult {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
    compress: true,
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 14;
  let y = 14;

  const members: Roommate[] = Array.isArray(room?.members) ? room.members : [];
  const allExpenses: RoomExpense[] = Array.isArray(room?.expenses) ? room.expenses : [];
  const settlements: RoomSettlement[] = Array.isArray(room?.settlements) ? room.settlements : [];

  // Filter expenses by date range if specified
  let expenses = allExpenses.filter((e) => e && (e.title || e.totalAmount || e.amount));
  if (startDate) {
    expenses = expenses.filter((e) => {
      const d = e.date ? e.date.split('T')[0] : '';
      return !d || d >= startDate;
    });
  }
  if (endDate) {
    expenses = expenses.filter((e) => {
      const d = e.date ? e.date.split('T')[0] : '';
      return !d || d <= endDate;
    });
  }
  expenses.sort((a, b) => (b.date || '').localeCompare(a.date || ''));

  // Calculate Member Balances in exact integer paise
  const balances: Record<
    string,
    { totalPaid: number; totalShare: number; settledPaid: number; settledReceived: number; net: number }
  > = {};

  const findMemberKey = (nameOrId?: string): string => {
    if (!nameOrId) return 'Unknown';
    const clean = nameOrId.toLowerCase().trim();
    const found = members.find(
      (m) =>
        m.name.toLowerCase().trim() === clean ||
        m.id.toLowerCase().trim() === clean ||
        (m.userId && m.userId.toLowerCase().trim() === clean)
    );
    return found ? found.name : nameOrId;
  };

  members.forEach((m) => {
    balances[m.name] = { totalPaid: 0, totalShare: 0, settledPaid: 0, settledReceived: 0, net: 0 };
  });

  // Tally expenses
  expenses.forEach((exp) => {
    const payerKey = findMemberKey(exp.paidBy);
    const totalAmt = Number(exp.totalAmount ?? exp.amount ?? 0);
    if (!balances[payerKey]) {
      balances[payerKey] = { totalPaid: 0, totalShare: 0, settledPaid: 0, settledReceived: 0, net: 0 };
    }
    balances[payerKey].totalPaid += totalAmt;

    const parts = Array.isArray(exp.participants) ? exp.participants : [];
    parts.forEach((p) => {
      const pKey = findMemberKey(p.name);
      if (!balances[pKey]) {
        balances[pKey] = { totalPaid: 0, totalShare: 0, settledPaid: 0, settledReceived: 0, net: 0 };
      }
      balances[pKey].totalShare += Number(p.share || 0);
    });
  });

  // Tally completed settlements
  settlements.forEach((s) => {
    if (s.status !== 'completed' && s.status !== undefined && s.status !== null) return;
    const fromKey = findMemberKey(s.from);
    const toKey = findMemberKey(s.to);
    if (!balances[fromKey]) {
      balances[fromKey] = { totalPaid: 0, totalShare: 0, settledPaid: 0, settledReceived: 0, net: 0 };
    }
    if (!balances[toKey]) {
      balances[toKey] = { totalPaid: 0, totalShare: 0, settledPaid: 0, settledReceived: 0, net: 0 };
    }
    balances[fromKey].settledPaid += Number(s.amount || 0);
    balances[toKey].settledReceived += Number(s.amount || 0);
  });

  // Net = (totalPaid + settledPaid) - (totalShare + settledReceived) in exact paise
  members.forEach((m) => {
    const b = balances[m.name];
    if (b) {
      const paidPaise = Math.round(b.totalPaid * 100) + Math.round(b.settledPaid * 100);
      const sharePaise = Math.round(b.totalShare * 100) + Math.round(b.settledReceived * 100);
      b.net = (paidPaise - sharePaise) / 100;
    }
  });

  // Calculate Pairwise Debts ("Who Owes Whom")
  const debtors: { name: string; amountPaise: number }[] = [];
  const creditors: { name: string; amountPaise: number }[] = [];

  members.forEach((m) => {
    const b = balances[m.name];
    if (!b) return;
    const netPaise = Math.round(b.net * 100);
    if (netPaise < 0) {
      debtors.push({ name: m.name, amountPaise: Math.abs(netPaise) });
    } else if (netPaise > 0) {
      creditors.push({ name: m.name, amountPaise: netPaise });
    }
  });

  debtors.sort((a, b) => b.amountPaise - a.amountPaise);
  creditors.sort((a, b) => b.amountPaise - a.amountPaise);

  const debtsList: { from: string; to: string; amount: number }[] = [];
  let dIdx = 0;
  let cIdx = 0;
  const dClone = debtors.map((d) => ({ ...d }));
  const cClone = creditors.map((c) => ({ ...c }));

  while (dIdx < dClone.length && cIdx < cClone.length) {
    const debtor = dClone[dIdx];
    const creditor = cClone[cIdx];
    const settledAmountPaise = Math.min(debtor.amountPaise, creditor.amountPaise);

    if (settledAmountPaise > 0) {
      debtsList.push({
        from: debtor.name,
        to: creditor.name,
        amount: settledAmountPaise / 100,
      });
    }

    debtor.amountPaise -= settledAmountPaise;
    creditor.amountPaise -= settledAmountPaise;

    if (debtor.amountPaise === 0) dIdx++;
    if (creditor.amountPaise === 0) cIdx++;
  }

  const totalRoomSpent = expenses.reduce((acc, e) => acc + (Number(e.totalAmount ?? e.amount) || 0), 0);
  const totalSettledAmt = settlements
    .filter((s) => s.status === 'completed' || !s.status)
    .reduce((acc, s) => acc + (Number(s.amount) || 0), 0);

  // --- HEADER SECTION ---
  doc.setFillColor(15, 23, 42); // Slate 900
  doc.rect(0, 0, pageWidth, 40, 'F');

  // Rose accent stripe
  doc.setFillColor(225, 29, 72); // Rose 600
  doc.rect(0, 40, pageWidth, 2.5, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(16);
  doc.text(`ROOM EXPENSE REPORT: ${room?.name || 'Shared Room'}`, margin, 15);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(226, 232, 240);
  const dateStr = new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' });
  doc.text(
    `Room Code: ${room?.inviteCode || 'N/A'}  •  Type: ${room?.type || 'Hostel / Flat'}  •  Members: ${members.length}`,
    margin,
    22
  );

  const rangeText = dateRangeLabel ? `Period: ${dateRangeLabel}` : (startDate && endDate ? `Period: ${startDate} to ${endDate}` : 'All Time Expenses');
  doc.setFontSize(8.5);
  doc.setTextColor(244, 63, 94); // Rose 500
  doc.text(`${rangeText}  |  Generated on: ${dateStr}`, margin, 31);

  y = 50;

  // --- SUMMARY METRIC CARDS ---
  const cardWidth = (pageWidth - margin * 2 - 9) / 4;
  const cardHeight = 18;

  const roomCards = [
    { label: 'TOTAL ROOM BILLS', value: `Rs. ${totalRoomSpent.toLocaleString('en-IN')}`, fill: [255, 241, 242], text: [190, 18, 60] },
    { label: 'TOTAL SETTLED', value: `Rs. ${totalSettledAmt.toLocaleString('en-IN')}`, fill: [240, 253, 244], text: [21, 128, 61] },
    { label: 'PENDING DEBTS', value: `${debtsList.length} Dues`, fill: [254, 243, 199], text: [180, 83, 9] },
    { label: 'ROOMMATES', value: `${members.length} Members`, fill: [248, 250, 252], text: [51, 65, 85] },
  ];

  roomCards.forEach((card, idx) => {
    const cardX = margin + idx * (cardWidth + 3);
    doc.setFillColor(card.fill[0], card.fill[1], card.fill[2]);
    doc.roundedRect(cardX, y, cardWidth, cardHeight, 2, 2, 'F');
    doc.setDrawColor(226, 232, 240);
    doc.roundedRect(cardX, y, cardWidth, cardHeight, 2, 2, 'S');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(6.5);
    doc.setTextColor(100, 116, 139);
    doc.text(card.label, cardX + 3, y + 6);

    doc.setFontSize(9.5);
    doc.setTextColor(card.text[0], card.text[1], card.text[2]);
    doc.text(card.value, cardX + 3, y + 13.5);
  });

  y += cardHeight + 7;

  // --- SECTION A: WHO OWES WHOM SUMMARY BOX ---
  doc.setFillColor(248, 250, 252);
  doc.roundedRect(margin, y, pageWidth - margin * 2, 22, 2, 2, 'F');
  doc.setDrawColor(203, 213, 225);
  doc.roundedRect(margin, y, pageWidth - margin * 2, 22, 2, 2, 'S');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(15, 23, 42);
  doc.text('WHO OWES WHOM (NET DEBT SETTLEMENT MATRIX):', margin + 3.5, y + 6);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  if (debtsList.length === 0) {
    doc.setTextColor(21, 128, 61);
    doc.text('All roommate accounts are completely settled. No one owes any money.', margin + 3.5, y + 14);
  } else {
    doc.setTextColor(51, 65, 85);
    const debtsStrings = debtsList
      .slice(0, 4)
      .map((d) => `• ${d.from} owes ${d.to} Rs. ${d.amount.toLocaleString('en-IN')}`)
      .join('    ');
    doc.text(debtsStrings, margin + 3.5, y + 13);
    if (debtsList.length > 4) {
      const moreStr = debtsList
        .slice(4)
        .map((d) => `• ${d.from} owes ${d.to} Rs. ${d.amount.toLocaleString('en-IN')}`)
        .join('    ');
      doc.text(moreStr, margin + 3.5, y + 18);
    }
  }

  y += 27;

  // --- SECTION B: ROOMMATE CONTRIBUTIONS TABLE ---
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(15, 23, 42);
  doc.text('1. ROOMMATE CONTRIBUTIONS & NET BALANCES', margin, y);
  y += 3.5;

  const memCols = {
    name: margin + 2,
    paid: margin + 55,
    share: margin + 90,
    settledPaid: margin + 125,
    net: pageWidth - margin - 2,
  };

  const drawMemberHeader = (posY: number) => {
    doc.setFillColor(241, 245, 249);
    doc.rect(margin, posY, pageWidth - margin * 2, 7, 'F');
    doc.setDrawColor(203, 213, 225);
    doc.line(margin, posY + 7, pageWidth - margin, posY + 7);

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7.5);
    doc.setTextColor(51, 65, 85);
    doc.text('ROOMMATE NAME', memCols.name, posY + 4.8);
    doc.text('TOTAL PAID (Rs.)', memCols.paid, posY + 4.8);
    doc.text('ACTUAL SHARE (Rs.)', memCols.share, posY + 4.8);
    doc.text('SETTLED (Rs.)', memCols.settledPaid, posY + 4.8);
    doc.text('NET BALANCE', memCols.net, posY + 4.8, { align: 'right' });
  };

  drawMemberHeader(y);
  y += 8.5;

  members.forEach((m) => {
    const b = balances[m.name] || { totalPaid: 0, totalShare: 0, settledPaid: 0, settledReceived: 0, net: 0 };
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(15, 23, 42);

    doc.text(m.name, memCols.name, y + 3);
    doc.text(`Rs. ${b.totalPaid.toLocaleString('en-IN')}`, memCols.paid, y + 3);
    doc.text(`Rs. ${b.totalShare.toLocaleString('en-IN')}`, memCols.share, y + 3);
    doc.text(`Rs. ${b.settledPaid.toLocaleString('en-IN')}`, memCols.settledPaid, y + 3);

    doc.setFont('helvetica', 'bold');
    if (b.net > 0) {
      doc.setTextColor(21, 128, 61); // Green
      doc.text(`+ Rs. ${b.net.toLocaleString('en-IN')} (Receives)`, memCols.net, y + 3, { align: 'right' });
    } else if (b.net < 0) {
      doc.setTextColor(225, 29, 72); // Red
      doc.text(`- Rs. ${Math.abs(b.net).toLocaleString('en-IN')} (Owes)`, memCols.net, y + 3, { align: 'right' });
    } else {
      doc.setTextColor(100, 116, 139);
      doc.text('Rs. 0 (Settled)', memCols.net, y + 3, { align: 'right' });
    }

    doc.setDrawColor(241, 245, 249);
    doc.line(margin, y + 5.5, pageWidth - margin, y + 5.5);
    y += 7.5;
  });

  y += 4;

  // --- SECTION C: ITEMIZED SHARED EXPENSES TABLE ---
  if (y > pageHeight - 35) {
    renderPageFooter(doc, pageWidth, pageHeight, `PocketBuddy • Room: ${room.name}`);
    doc.addPage();
    y = 15;
  }

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(15, 23, 42);
  doc.text('2. ITEMIZED SHARED EXPENSES & PARTICIPANT SPLITS', margin, y);
  y += 3.5;

  const expCols = {
    date: margin + 2,
    title: margin + 22,
    paidBy: margin + 90,
    addedBy: margin + 124,
    amount: pageWidth - margin - 2,
  };

  const drawExpHeader = (posY: number) => {
    doc.setFillColor(241, 245, 249);
    doc.rect(margin, posY, pageWidth - margin * 2, 7, 'F');
    doc.setDrawColor(203, 213, 225);
    doc.line(margin, posY + 7, pageWidth - margin, posY + 7);

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7.5);
    doc.setTextColor(51, 65, 85);
    doc.text('DATE', expCols.date, posY + 4.8);
    doc.text('DESCRIPTION / SPLIT DETAILS', expCols.title, posY + 4.8);
    doc.text('PAID BY', expCols.paidBy, posY + 4.8);
    doc.text('ADDED BY', expCols.addedBy, posY + 4.8);
    doc.text('TOTAL BILL (Rs.)', expCols.amount, posY + 4.8, { align: 'right' });
  };

  drawExpHeader(y);
  y += 8.5;

  if (expenses.length === 0) {
    doc.setFont('helvetica', 'italic');
    doc.setFontSize(8.5);
    doc.setTextColor(148, 163, 184);
    doc.text('No shared expenses found for the selected date range.', margin + 4, y + 4);
    y += 12;
  } else {
    expenses.forEach((exp, idx) => {
      if (y > pageHeight - 20) {
        renderPageFooter(doc, pageWidth, pageHeight, `PocketBuddy • Room: ${room.name}`);
        doc.addPage();
        y = 15;
        drawExpHeader(y);
        y += 8.5;
      }

      if (idx % 2 === 1) {
        doc.setFillColor(248, 250, 252);
        doc.rect(margin, y - 1.5, pageWidth - margin * 2, 9.5, 'F');
      }

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7.5);
      doc.setTextColor(71, 85, 105);
      doc.text(exp.date ? exp.date.split('T')[0] : 'N/A', expCols.date, y + 2.5);

      // Title
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8);
      doc.setTextColor(15, 23, 42);
      let tText = exp.title || 'Untitled Expense';
      if (tText.length > 36) tText = tText.substring(0, 34) + '...';
      doc.text(tText, expCols.title, y + 2.5);

      // Split detail subtitle (e.g., "Shares: Aditya 66.68, Shivam 66.66")
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(6.5);
      doc.setTextColor(100, 116, 139);
      const parts = Array.isArray(exp.participants) ? exp.participants : [];
      const splitStr = parts.map((p) => `${p.name}: Rs.${Math.round(p.share || 0)}`).join(', ');
      let cleanSplit = splitStr.length > 55 ? splitStr.substring(0, 52) + '...' : splitStr;
      doc.text(cleanSplit, expCols.title, y + 6.5);

      // Paid By
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(7.5);
      doc.setTextColor(79, 70, 229);
      doc.text(exp.paidBy || 'N/A', expCols.paidBy, y + 2.5);

      // Added By
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7);
      doc.setTextColor(100, 116, 139);
      doc.text(exp.createdBy || exp.paidBy || 'Roommate', expCols.addedBy, y + 2.5);

      // Total Amount
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8.5);
      doc.setTextColor(15, 23, 42);
      const totalAmt = Number(exp.totalAmount ?? exp.amount ?? 0);
      doc.text(`Rs. ${totalAmt.toLocaleString('en-IN')}`, expCols.amount, y + 3, { align: 'right' });

      doc.setDrawColor(241, 245, 249);
      doc.line(margin, y + 8, pageWidth - margin, y + 8);
      y += 9.5;
    });
  }

  // --- SECTION D: SETTLEMENTS HISTORY (if any) ---
  if (settlements.length > 0) {
    if (y > pageHeight - 35) {
      renderPageFooter(doc, pageWidth, pageHeight, `PocketBuddy • Room: ${room.name}`);
      doc.addPage();
      y = 15;
    } else {
      y += 4;
    }

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.setTextColor(15, 23, 42);
    doc.text('3. RECORDED SETTLEMENTS & PAYMENTS', margin, y);
    y += 3.5;

    const setCols = {
      date: margin + 2,
      payer: margin + 25,
      receiver: margin + 70,
      mode: margin + 115,
      status: margin + 140,
      amount: pageWidth - margin - 2,
    };

    doc.setFillColor(241, 245, 249);
    doc.rect(margin, y, pageWidth - margin * 2, 7, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7.5);
    doc.setTextColor(51, 65, 85);
    doc.text('DATE', setCols.date, y + 4.8);
    doc.text('PAID BY (FROM)', setCols.payer, y + 4.8);
    doc.text('RECEIVED BY (TO)', setCols.receiver, y + 4.8);
    doc.text('MODE', setCols.mode, y + 4.8);
    doc.text('STATUS', setCols.status, y + 4.8);
    doc.text('AMOUNT', setCols.amount, y + 4.8, { align: 'right' });
    y += 8.5;

    settlements.slice(0, 10).forEach((s) => {
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7.5);
      doc.setTextColor(71, 85, 105);
      doc.text(s.date ? s.date.split('T')[0] : 'N/A', setCols.date, y + 3);
      doc.text(s.from || 'N/A', setCols.payer, y + 3);
      doc.text(s.to || 'N/A', setCols.receiver, y + 3);
      doc.text(s.mode || 'UPI', setCols.mode, y + 3);

      doc.setFont('helvetica', 'bold');
      if (s.status === 'completed' || !s.status) {
        doc.setTextColor(21, 128, 61);
        doc.text('COMPLETED', setCols.status, y + 3);
      } else {
        doc.setTextColor(217, 119, 6);
        doc.text(String(s.status).toUpperCase(), setCols.status, y + 3);
      }

      doc.setTextColor(15, 23, 42);
      doc.text(`Rs. ${Number(s.amount || 0).toLocaleString('en-IN')}`, setCols.amount, y + 3, { align: 'right' });
      y += 7;
    });
  }

  renderPageFooter(doc, pageWidth, pageHeight, `PocketBuddy • Room: ${room.name}`);

  const dateStamp = new Date().toISOString().split('T')[0];
  const cleanRoomName = (room?.name || 'Room').replace(/[^a-zA-Z0-9]/g, '_');
  const filename = `PocketBuddy_${cleanRoomName}_Report_${dateStamp}.pdf`;
  const rawUri = doc.output('datauristring');
  const base64Data = rawUri.includes(',') ? rawUri.split(',')[1] : rawUri;
  const dataUri = `data:application/pdf;base64,${base64Data}`;

  return { doc, filename, dataUri };
}

export function generateRoomLedgerPDF(options: RoomPDFGeneratorOptions): void {
  const { doc, filename } = createRoomLedgerPDFDoc(options);
  doc.save(filename);
}

function renderPageFooter(doc: jsPDF, pageWidth: number, pageHeight: number, reportTitle: string) {
  const margin = 14;
  doc.setDrawColor(226, 232, 240);
  doc.line(margin, pageHeight - 12, pageWidth - margin, pageHeight - 12);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  doc.setTextColor(148, 163, 184);
  doc.text(reportTitle, margin, pageHeight - 7);

  const pageNum = doc.getNumberOfPages();
  doc.text(`Page ${pageNum}`, pageWidth - margin, pageHeight - 7, { align: 'right' });
}
