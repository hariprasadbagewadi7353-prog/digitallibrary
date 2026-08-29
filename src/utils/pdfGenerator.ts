import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { Member, Book, Transaction } from '../types';

interface ReportExportOptions {
  reportType: string;
  reportTitle: string;
  generatedBy?: string;
  dateRangeText?: string;
  summaryMetrics?: { label: string; value: string | number }[];
  data: any[];
}

export const generateOfficialReportPDF = ({
  reportType,
  reportTitle,
  generatedBy = 'Chief Librarian',
  dateRangeText = 'All Records to Date',
  summaryMetrics = [],
  data = []
}: ReportExportOptions) => {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const todayStr = new Date().toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });

  // Header Banner
  doc.setFillColor(15, 23, 42); // slate-900
  doc.rect(0, 0, pageWidth, 28, 'F');

  // Amber Accent Line
  doc.setFillColor(245, 158, 11); // amber-500
  doc.rect(0, 28, pageWidth, 2, 'F');

  // Header Texts
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  doc.text('GOVERNMENT DIGITAL LIBRARY MANAGEMENT SYSTEM', pageWidth / 2, 11, { align: 'center' });

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(203, 213, 225); // slate-300
  doc.text('Department of Public Libraries • Public Information & Circulation Directorate', pageWidth / 2, 17, { align: 'center' });
  doc.text('Official Cataloging, Accession & Administrative Ledger Report', pageWidth / 2, 22, { align: 'center' });

  // Report Title & Meta
  let y = 37;
  doc.setTextColor(15, 23, 42);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(13);
  doc.text(reportTitle.toUpperCase(), 14, y);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(71, 85, 105);
  y += 5;
  doc.text(`Period Scope: ${dateRangeText}   |   Generated On: ${todayStr}`, 14, y);
  y += 4;
  doc.text(`Authorized Officer: ${generatedBy}   |   Security Classification: OFFICIAL INTERNAL USE`, 14, y);

  // Summary Metrics Cards (if any)
  if (summaryMetrics.length > 0) {
    y += 6;
    const cardWidth = (pageWidth - 28 - (summaryMetrics.length - 1) * 3) / Math.min(summaryMetrics.length, 4);
    const cardHeight = 15;

    summaryMetrics.slice(0, 4).forEach((m, index) => {
      const x = 14 + index * (cardWidth + 3);
      doc.setFillColor(248, 250, 252);
      doc.setDrawColor(226, 232, 240);
      doc.roundedRect(x, y, cardWidth, cardHeight, 2, 2, 'FD');

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(11);
      doc.setTextColor(15, 23, 42);
      doc.text(String(m.value), x + 4, y + 6);

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7);
      doc.setTextColor(100, 116, 139);
      doc.text(m.label.toUpperCase(), x + 4, y + 11);
    });
    y += cardHeight + 4;
  } else {
    y += 5;
  }

  // Table Preparation
  let tableHeaders: string[] = [];
  let tableRows: any[][] = [];

  if (reportType === 'members' || reportType === 'total_members' || reportType === 'new_members') {
    tableHeaders = ['Reg No', 'Student Name', 'Village', 'Pincode', 'Mobile', 'Reg Date', 'Status'];
    tableRows = data.map((m: Member) => [
      m.registration_number || '-',
      m.student_name || '-',
      m.village || '-',
      m.pincode || '-',
      m.mobile || '-',
      m.registration_date ? new Date(m.registration_date).toLocaleDateString('en-IN') : '-',
      m.status || '-'
    ]);
  } else if (reportType === 'books' || reportType === 'total_books' || reportType === 'available_books' || reportType === 'issued_books') {
    tableHeaders = ['Book No', 'Book Title', 'Author', 'Category', 'Language', 'Shelf', 'Status'];
    tableRows = data.map((b: Book) => [
      b.book_number || '-',
      b.title || b.book_name || '-',
      b.author || '-',
      b.category_name || b.category_id || '-',
      b.language || '-',
      b.shelf_location || '-',
      b.status || '-'
    ]);
  } else if (reportType === 'overdue' || reportType === 'overdue_books') {
    tableHeaders = ['Tx ID', 'Student / Member', 'Reg No', 'Book Title', 'Due Date', 'Overdue Days', 'Mobile'];
    tableRows = data.map((t: any) => [
      t.id || '-',
      t.student_name || t.member_name || '-',
      t.registration_number || t.member_reg_number || '-',
      t.book_title || t.book_name || '-',
      t.expected_return_date || t.due_date || '-',
      `${t.days_overdue || 0} days`,
      t.member_mobile || '-'
    ]);
  } else {
    // Transactions / Loans
    tableHeaders = ['Tx ID', 'Member Name', 'Reg No', 'Book Title', 'Issue Date', 'Due Date', 'Status'];
    tableRows = data.map((t: any) => [
      t.id || '-',
      t.member_name || t.student_name || '-',
      t.registration_number || t.member_reg_number || '-',
      t.book_title || t.book_name || '-',
      t.issue_date || '-',
      t.expected_return_date || t.due_date || '-',
      t.status || '-'
    ]);
  }

  autoTable(doc, {
    startY: y + 2,
    head: [tableHeaders],
    body: tableRows,
    theme: 'grid',
    headStyles: {
      fillColor: [15, 23, 42],
      textColor: [255, 255, 255],
      fontSize: 8,
      fontStyle: 'bold',
      halign: 'left',
      cellPadding: 2.5
    },
    bodyStyles: {
      fontSize: 7.5,
      textColor: [30, 41, 59],
      cellPadding: 2
    },
    alternateRowStyles: {
      fillColor: [248, 250, 252]
    },
    margin: { left: 14, right: 14, bottom: 20 },
    didDrawPage: (hookData) => {
      // Footer on every page
      const currentPg = hookData.pageNumber;
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7.5);
      doc.setTextColor(148, 163, 184); // slate-400
      doc.text(
        `Government Central Digital Library — Public Records Accession • Generated ${todayStr}`,
        14,
        pageHeight - 8
      );
      doc.text(`Page ${currentPg}`, pageWidth - 14, pageHeight - 8, { align: 'right' });

      // Subtle bottom line
      doc.setDrawColor(226, 232, 240);
      doc.line(14, pageHeight - 12, pageWidth - 14, pageHeight - 12);
    }
  });

  const fileName = `${reportType}_report_${new Date().toISOString().slice(0, 10)}.pdf`;
  doc.save(fileName);
};

export const generateMemberProfilePDF = (
  member: Member,
  currentLoans: Transaction[] = [],
  loanHistory: Transaction[] = []
) => {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const todayStr = new Date().toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'long',
    year: 'numeric'
  });

  // Header Banner
  doc.setFillColor(15, 23, 42); // slate-900
  doc.rect(0, 0, pageWidth, 28, 'F');

  // Amber Accent Line
  doc.setFillColor(245, 158, 11); // amber-500
  doc.rect(0, 28, pageWidth, 2, 'F');

  // Header Texts
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(13);
  doc.text('GOVERNMENT DIGITAL LIBRARY', pageWidth / 2, 11, { align: 'center' });

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(203, 213, 225);
  doc.text('OFFICIAL DIGITAL MEMBER DOSSIER & CIRCULATION RECORD', pageWidth / 2, 17, { align: 'center' });
  doc.text('Department of Public Libraries • Public Information System', pageWidth / 2, 22, { align: 'center' });

  // Patron Profile Box
  let y = 36;
  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(203, 213, 225);
  doc.roundedRect(14, y, pageWidth - 28, 44, 2, 2, 'FD');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.setTextColor(15, 23, 42);
  doc.text(member.student_name, 20, y + 8);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(71, 85, 105);
  doc.text(`Registration No: ${member.registration_number}`, 20, y + 14);
  doc.text(`Father's / Guardian Name: ${member.father_name || 'N/A'}`, 20, y + 20);
  doc.text(`Village / Location: ${member.village} ${member.pincode ? `(${member.pincode})` : ''}`, 20, y + 26);
  doc.text(`Taluk & District: ${member.taluk || 'Gokak'}, ${member.district || 'Belagavi'}`, 20, y + 32);
  doc.text(`Mobile: ${member.mobile}   |   Email: ${member.email || 'N/A'}`, 20, y + 38);

  // Status Badge on right
  const rightX = pageWidth - 20;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(member.status === 'ACTIVE' ? 16 : 185, member.status === 'ACTIVE' ? 185 : 28, member.status === 'ACTIVE' ? 129 : 28);
  doc.text(`STATUS: ${member.status}`, rightX, y + 8, { align: 'right' });

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(100, 116, 139);
  doc.text(`Registered: ${new Date(member.registration_date).toLocaleDateString('en-IN')}`, rightX, y + 14, { align: 'right' });
  doc.text(`Total Books Borrowed: ${loanHistory.length + currentLoans.length}`, rightX, y + 20, { align: 'right' });
  doc.text(`Active Loans: ${currentLoans.length}`, rightX, y + 26, { align: 'right' });

  y += 50;

  // CURRENTLY ISSUED BOOKS SECTION
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10.5);
  doc.setTextColor(15, 23, 42);
  doc.text('CURRENTLY ISSUED BOOKS & LOANS', 14, y);

  const activeRows = currentLoans.map(t => [
    t.book_number || '-',
    t.book_title || t.book_name || '-',
    t.issue_date || '-',
    t.expected_return_date || t.due_date || '-',
    t.days_overdue && t.days_overdue > 0 ? `OVERDUE (${t.days_overdue} days)` : 'ACTIVE LOAN'
  ]);

  if (activeRows.length === 0) {
    activeRows.push(['-', 'No currently issued books on record.', '-', '-', '-']);
  }

  autoTable(doc, {
    startY: y + 3,
    head: [['Book Number', 'Book Title', 'Issue Date', 'Expected Return', 'Loan Status']],
    body: activeRows,
    theme: 'grid',
    headStyles: {
      fillColor: [15, 23, 42],
      textColor: [255, 255, 255],
      fontSize: 8,
      fontStyle: 'bold',
      cellPadding: 2
    },
    bodyStyles: {
      fontSize: 7.5,
      textColor: [30, 41, 59],
      cellPadding: 2
    },
    margin: { left: 14, right: 14 }
  });

  // COMPLETE BORROWING HISTORY
  const nextY = (doc as any).lastAutoTable.finalY + 8;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10.5);
  doc.setTextColor(15, 23, 42);
  doc.text('COMPLETE BORROWING & RETURN LEDGER HISTORY', 14, nextY);

  const historyRows = loanHistory.map(t => [
    t.book_number || '-',
    t.book_title || t.book_name || '-',
    t.issue_date || '-',
    t.actual_return_date || t.return_date || '-',
    t.status || '-'
  ]);

  if (historyRows.length === 0) {
    historyRows.push(['-', 'No previous return history recorded.', '-', '-', '-']);
  }

  autoTable(doc, {
    startY: nextY + 3,
    head: [['Book Number', 'Book Title', 'Issue Date', 'Returned Date', 'Final Status']],
    body: historyRows,
    theme: 'grid',
    headStyles: {
      fillColor: [51, 65, 85],
      textColor: [255, 255, 255],
      fontSize: 8,
      fontStyle: 'bold',
      cellPadding: 2
    },
    bodyStyles: {
      fontSize: 7.5,
      textColor: [30, 41, 59],
      cellPadding: 2
    },
    alternateRowStyles: {
      fillColor: [248, 250, 252]
    },
    margin: { left: 14, right: 14, bottom: 24 },
    didDrawPage: (hookData) => {
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7.5);
      doc.setTextColor(148, 163, 184);
      doc.text(
        `Official Member Record • Registration ID: ${member.registration_number} • Date: ${todayStr}`,
        14,
        pageHeight - 8
      );
      doc.text(`Page ${hookData.pageNumber}`, pageWidth - 14, pageHeight - 8, { align: 'right' });
    }
  });

  const fileName = `Member_Record_${member.registration_number || member.id}.pdf`;
  doc.save(fileName);
};

export const generateOverdueReportPDF = (
  overdueLoans: any[],
  dateRangeText: string = 'Current Active Overdue List'
) => {
  generateOfficialReportPDF({
    reportType: 'overdue',
    reportTitle: 'Official Library Overdue & Defaulter Notice Ledger',
    dateRangeText,
    summaryMetrics: [
      { label: 'Overdue Items', value: overdueLoans.length },
      {
        label: 'Est. Fines Due',
        value: `₹${overdueLoans.reduce((acc, l) => acc + (Number(l.fine_amount) || (l.days_overdue || 0) * 2), 0)}`
      }
    ],
    data: overdueLoans
  });
};

export const generateTransactionReportPDF = (
  transactions: any[],
  dateRangeTextOrOptions?: string | { startDate?: string; endDate?: string; status?: string }
) => {
  let dateRangeText = 'Complete Circulation Register';
  if (typeof dateRangeTextOrOptions === 'string') {
    dateRangeText = dateRangeTextOrOptions;
  } else if (dateRangeTextOrOptions) {
    const parts = [];
    if (dateRangeTextOrOptions.startDate) parts.push(`From: ${dateRangeTextOrOptions.startDate}`);
    if (dateRangeTextOrOptions.endDate) parts.push(`To: ${dateRangeTextOrOptions.endDate}`);
    if (dateRangeTextOrOptions.status) parts.push(`Status: ${dateRangeTextOrOptions.status}`);
    if (parts.length > 0) dateRangeText = parts.join(' | ');
  }

  const activeCount = transactions.filter(t => t.status === 'ISSUED').length;
  const returnedCount = transactions.filter(t => t.status === 'RETURNED').length;

  generateOfficialReportPDF({
    reportType: 'transactions',
    reportTitle: 'Official Circulation & Book Loan Activity Register',
    dateRangeText,
    summaryMetrics: [
      { label: 'Total Logs', value: transactions.length },
      { label: 'Active Loans', value: activeCount },
      { label: 'Returned', value: returnedCount }
    ],
    data: transactions
  });
};

