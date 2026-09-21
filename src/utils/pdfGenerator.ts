import { jsPDF } from 'jspdf';
import { Transaction } from '../types';

interface PDFGeneratorOptions {
  transactions: Transaction[];
  filterMode?: string;
  searchQuery?: string;
  studentName?: string;
}

export function generateLedgerPDF({
  transactions,
  filterMode = 'all',
  searchQuery = '',
  studentName = 'Student Ledger',
}: PDFGeneratorOptions): void {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 14;
  let y = 14;

  // Safe transactions
  const safeList = Array.isArray(transactions) ? transactions.filter((t) => t && t.title) : [];

  // Calculations
  const expenseList = safeList.filter((t) => t.type === 'expense');
  const incomeList = safeList.filter((t) => t.type === 'income');
  const totalExpense = expenseList.reduce((acc, t) => acc + (Number(t.amount) || 0), 0);
  const totalIncome = incomeList.reduce((acc, t) => acc + (Number(t.amount) || 0), 0);
  const upiExpense = expenseList
    .filter((t) => t.paymentMode === 'UPI')
    .reduce((acc, t) => acc + (Number(t.amount) || 0), 0);
  const cashExpense = expenseList
    .filter((t) => t.paymentMode === 'Cash')
    .reduce((acc, t) => acc + (Number(t.amount) || 0), 0);

  // --- HEADER SECTION ---
  // Header background banner
  doc.setFillColor(30, 27, 75); // Indigo 950
  doc.rect(0, 0, pageWidth, 38, 'F');

  // Accent stripe
  doc.setFillColor(79, 70, 229); // Indigo 600
  doc.rect(0, 38, pageWidth, 2, 'F');

  // App / Document Title
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(18);
  doc.text('CAMPUS LEDGER - EXPENSE STATEMENT', margin, 17);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9.5);
  doc.setTextColor(199, 210, 254); // Indigo 200
  const dateStr = new Date().toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
  doc.text(`Official Student Financial Outflow Report  |  Generated on: ${dateStr}`, margin, 24);

  // Filter tag in header
  const filterDesc = [
    filterMode !== 'all' ? `Wallet: ${filterMode}` : null,
    searchQuery ? `Search: "${searchQuery}"` : null,
  ]
    .filter(Boolean)
    .join('  •  ');

  doc.setFontSize(8.5);
  doc.setTextColor(224, 231, 255);
  doc.text(filterDesc ? `Filtered view (${filterDesc})` : 'Full Ledger Statement (All Outflows)', margin, 31);

  y = 48;

  // --- SUMMARY METRIC CARDS ---
  const cardWidth = (pageWidth - margin * 2 - 9) / 4;
  const cardHeight = 18;

  const cards = [
    { label: 'TOTAL EXPENSES', value: `Rs. ${totalExpense.toLocaleString('en-IN')}`, fill: [241, 245, 249], text: [15, 23, 42] },
    { label: 'UPI / BANK SPENT', value: `Rs. ${upiExpense.toLocaleString('en-IN')}`, fill: [238, 242, 255], text: [67, 56, 202] },
    { label: 'CASH SPENT', value: `Rs. ${cashExpense.toLocaleString('en-IN')}`, fill: [236, 253, 245], text: [6, 95, 70] },
    { label: 'ENTRIES COUNT', value: `${safeList.length} Items`, fill: [248, 250, 252], text: [30, 41, 59] },
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

    doc.setFontSize(10);
    doc.setTextColor(card.text[0], card.text[1], card.text[2]);
    doc.text(card.value, cardX + 3, y + 13.5);
  });

  y += cardHeight + 8;

  // --- TABLE SECTION ---
  // Table Header
  const colX = {
    date: margin,
    title: margin + 25,
    mode: margin + 120,
    type: margin + 144,
    amount: pageWidth - margin - 2, // Right-aligned
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
    doc.text('TYPE', colX.type, posY + 5.2);
    doc.text('AMOUNT (Rs.)', colX.amount, posY + 5.2, { align: 'right' });
  };

  drawTableHeader(y);
  y += 9.5;

  if (safeList.length === 0) {
    doc.setFont('helvetica', 'italic');
    doc.setFontSize(9);
    doc.setTextColor(148, 163, 184);
    doc.text('No ledger transactions recorded to display in this statement.', margin + 4, y + 6);
    y += 15;
  } else {
    // Render rows
    safeList.forEach((item, index) => {
      // Check page boundary
      if (y > pageHeight - 20) {
        // Add footer to current page
        renderPageFooter(doc, pageWidth, pageHeight);
        doc.addPage();
        y = 15;
        drawTableHeader(y);
        y += 9.5;
      }

      // Zebra striping
      if (index % 2 === 1) {
        doc.setFillColor(248, 250, 252);
        doc.rect(margin, y - 2, pageWidth - margin * 2, 8, 'F');
      }

      // Row separator
      doc.setDrawColor(241, 245, 249);
      doc.line(margin, y + 5.5, pageWidth - margin, y + 5.5);

      // Date
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8);
      doc.setTextColor(71, 85, 105);
      doc.text(item.date || 'N/A', colX.date + 2, y + 3);

      // Title & note/person
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8);
      doc.setTextColor(15, 23, 42);
      let titleText = item.title || 'Untitled';
      if (item.person) titleText += ` [${item.person}]`;
      if (item.isFixedBill) titleText += ` (Bill)`;
      // Truncate if too long (with widened column, 50 chars fits comfortably)
      if (titleText.length > 52) {
        titleText = titleText.substring(0, 50) + '...';
      }
      doc.text(titleText, colX.title, y + 3);

      // Mode
      const isUPI = item.paymentMode === 'UPI';
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(7.5);
      if (isUPI) {
        doc.setTextColor(79, 70, 229);
      } else {
        doc.setTextColor(5, 150, 105);
      }
      doc.text(item.paymentMode || 'Cash', colX.mode, y + 3);

      // Type
      const isExpense = item.type === 'expense';
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7.5);
      doc.setTextColor(100, 116, 139);
      doc.text(isExpense ? 'Expense' : 'Income', colX.type, y + 3);

      // Amount
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8.5);
      if (isExpense) {
        doc.setTextColor(225, 29, 72); // Rose 600
        doc.text(`- Rs. ${Number(item.amount || 0).toLocaleString('en-IN')}`, colX.amount, y + 3, {
          align: 'right',
        });
      } else {
        doc.setTextColor(16, 185, 129); // Emerald 600
        doc.text(`+ Rs. ${Number(item.amount || 0).toLocaleString('en-IN')}`, colX.amount, y + 3, {
          align: 'right',
        });
      }

      y += 8;
    });
  }

  // Final Total Summary Line
  if (y > pageHeight - 25) {
    renderPageFooter(doc, pageWidth, pageHeight);
    doc.addPage();
    y = 15;
  }

  y += 4;
  doc.setFillColor(241, 245, 249);
  doc.rect(margin, y, pageWidth - margin * 2, 10, 'F');
  doc.setDrawColor(203, 213, 225);
  doc.rect(margin, y, pageWidth - margin * 2, 10, 'S');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(15, 23, 42);
  doc.text('TOTAL NET EXPENSE OUTFLOW:', margin + 4, y + 6.5);

  doc.setFontSize(10.5);
  doc.setTextColor(225, 29, 72);
  doc.text(`Rs. ${totalExpense.toLocaleString('en-IN')}`, colX.amount, y + 6.5, { align: 'right' });

  // Add Page Footer to final page
  renderPageFooter(doc, pageWidth, pageHeight);

  // Trigger browser download
  const dateStamp = new Date().toISOString().split('T')[0];
  const filename = `CampusLedger_Expense_Statement_${dateStamp}.pdf`;
  doc.save(filename);
}

function renderPageFooter(doc: jsPDF, pageWidth: number, pageHeight: number) {
  const margin = 14;
  doc.setDrawColor(226, 232, 240);
  doc.line(margin, pageHeight - 12, pageWidth - margin, pageHeight - 12);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  doc.setTextColor(148, 163, 184);
  doc.text('CampusLedger  •  Smart Student Pocket Money & Outflow Tracker', margin, pageHeight - 7);

  const pageNum = doc.getNumberOfPages();
  doc.text(`Statement Page ${pageNum}`, pageWidth - margin, pageHeight - 7, { align: 'right' });
}
