import jsPDF from 'jspdf';
import { getCompanyInfo } from '../config/invoiceSettings';
import type { Database } from '../lib/database.types';

type Transaction = Database['public']['Tables']['transactions']['Row'];
type Farmer = Database['public']['Tables']['farmers']['Row'];
type Purchase = Database['public']['Tables']['purchases']['Row'];
type CropSale = Database['public']['Tables']['crop_sales']['Row'];

interface TransactionWithDetails extends Transaction {
  purchases?: Purchase;
  crop_sales?: CropSale;
}

interface FarmerBalance {
  farmer_id: number;
  farmer_name: string;
  total_debit: number;
  total_credit: number;
  balance: number;
}

export const generateFarmerTransactionReport = async (
  farmer: Farmer,
  balance: FarmerBalance,
  transactions: TransactionWithDetails[]
) => {
  try {
    const doc = new jsPDF();
    const companyInfo = getCompanyInfo();
    const pageWidth = doc.internal.pageSize.width;
    const pageHeight = doc.internal.pageSize.height;
    let yPos = 20;

    // Helper function to check if we need a new page
    const checkNewPage = (requiredSpace: number) => {
      if (yPos + requiredSpace > pageHeight - 30) {
        doc.addPage();
        yPos = 20;
        return true;
      }
      return false;
    };

    // Header - Company Info
    doc.setFontSize(20);
    doc.setTextColor(33, 150, 243);
    doc.text(companyInfo.name, pageWidth / 2, yPos, { align: 'center' });
    yPos += 8;

    doc.setFontSize(10);
    doc.setTextColor(100, 100, 100);
    doc.text(companyInfo.address, pageWidth / 2, yPos, { align: 'center' });
    yPos += 5;
    doc.text(`Phone: ${companyInfo.phone} | Email: ${companyInfo.email}`, pageWidth / 2, yPos, { align: 'center' });
    yPos += 15;

    // Report Title
    doc.setFontSize(18);
    doc.setTextColor(0, 0, 0);
    doc.text('FARMER TRANSACTION REPORT', pageWidth / 2, yPos, { align: 'center' });
    yPos += 15;

    // Farmer Details Section
    doc.setFontSize(14);
    doc.setTextColor(33, 150, 243);
    doc.text('Farmer Information', 20, yPos);
    yPos += 8;

    // Farmer details box
    doc.setFillColor(248, 249, 250);
    doc.rect(20, yPos - 5, pageWidth - 40, 25, 'F');
    
    doc.setFontSize(11);
    doc.setTextColor(0, 0, 0);
    doc.text(`Name: ${farmer.name}`, 25, yPos + 3);
    doc.text(`Father's Name: ${farmer.father_name || 'N/A'}`, 25, yPos + 10);
    doc.text(`Phone: ${farmer.phone_number || 'N/A'}`, pageWidth / 2 + 10, yPos + 3);
    doc.text(`Address: ${farmer.address || 'N/A'}`, pageWidth / 2 + 10, yPos + 10);
    yPos += 30;

    // Account Summary Section
    doc.setFontSize(14);
    doc.setTextColor(33, 150, 243);
    doc.text('Account Summary', 20, yPos);
    yPos += 8;

    // Summary box
    doc.setFillColor(248, 249, 250);
    doc.rect(20, yPos - 5, pageWidth - 40, 35, 'F');
    
    doc.setFontSize(12);
    doc.setTextColor(0, 0, 0);
    
    // Credit amount (green)
    doc.setTextColor(76, 175, 80);
    doc.text(`Total Credit: Rs. ${Number(balance.total_credit).toLocaleString()}`, 25, yPos + 5);
    
    // Debit amount (red)
    doc.setTextColor(244, 67, 54);
    doc.text(`Total Debit: Rs. ${Number(balance.total_debit).toLocaleString()}`, 25, yPos + 15);
    
    // Net balance
    const netBalance = Number(balance.balance);
    const balanceColor = netBalance >= 0 ? [76, 175, 80] : [244, 67, 54];
    const balanceText = netBalance >= 0 ? 'You owe farmer' : 'Farmer owes you';
    
    doc.setTextColor(balanceColor[0], balanceColor[1], balanceColor[2]);
    doc.setFontSize(14);
    doc.text(`Net Balance: Rs. ${Math.abs(netBalance).toLocaleString()}`, 25, yPos + 25);
    
    doc.setFontSize(10);
    doc.setTextColor(100, 100, 100);
    doc.text(`(${balanceText})`, 25, yPos + 32);
    
    yPos += 45;

    // Report Details
    doc.setFontSize(10);
    doc.setTextColor(100, 100, 100);
    doc.text(`Report generated on: ${new Date().toLocaleString()}`, pageWidth - 20, yPos, { align: 'right' });
    doc.text(`Total transactions: ${transactions.length}`, 20, yPos);
    yPos += 15;

    // Transaction History Header
    checkNewPage(30);
    doc.setFontSize(14);
    doc.setTextColor(33, 150, 243);
    doc.text('Transaction History', 20, yPos);
    yPos += 10;

    // Table Headers
    doc.setFontSize(10);
    doc.setTextColor(0, 0, 0);
    doc.setFillColor(240, 240, 240);
    
    const headerY = yPos;
    const headerHeight = 8;
    
    // Header background
    doc.rect(20, headerY - 2, pageWidth - 40, headerHeight, 'F');
    
    // Header text
    doc.text('Date', 25, headerY + 3);
    doc.text('Type', 60, headerY + 3);
    doc.text('Amount (Rs.)', 90, headerY + 3);
    doc.text('Description', 135, headerY + 3);
    
    yPos += 12;

    // Transaction rows
    if (transactions.length === 0) {
      doc.setTextColor(100, 100, 100);
      doc.text('No transactions found', pageWidth / 2, yPos + 10, { align: 'center' });
    } else {
      transactions.forEach((transaction, index) => {
        checkNewPage(15);
        
        // Alternate row colors
        if (index % 2 === 0) {
          doc.setFillColor(250, 250, 250);
          doc.rect(20, yPos - 2, pageWidth - 40, 12, 'F');
        }
        
        doc.setFontSize(9);
        doc.setTextColor(0, 0, 0);
        
        // Date
        const dateStr = transaction.date ? new Date(transaction.date).toLocaleDateString() : 'N/A';
        doc.text(dateStr, 25, yPos + 3);
        
        // Type with color coding
        const typeColor = transaction.type === 'Credit' ? [76, 175, 80] : [244, 67, 54];
        doc.setTextColor(typeColor[0], typeColor[1], typeColor[2]);
        doc.text(transaction.type || '', 60, yPos + 3);
        
        // Amount
        doc.text(Number(transaction.amount || 0).toLocaleString(), 90, yPos + 3);
        
        // Description
        doc.setTextColor(0, 0, 0);
        const description = transaction.description || 'N/A';
        const maxDescLength = 35;
        const truncatedDesc = description.length > maxDescLength 
          ? description.substring(0, maxDescLength) + '...' 
          : description;
        doc.text(truncatedDesc, 135, yPos + 3);
        
        yPos += 12;
      });
    }

    // Footer
    yPos = pageHeight - 25;
    doc.setFontSize(8);
    doc.setTextColor(100, 100, 100);
    doc.text('This is a computer-generated report from Artiya Management System', pageWidth / 2, yPos, { align: 'center' });
    doc.text(`Page 1 of 1`, pageWidth - 20, yPos, { align: 'right' });

    // Summary at the end (if multiple pages)
    if (doc.getNumberOfPages() > 1) {
      doc.setFontSize(10);
      doc.setTextColor(0, 0, 0);
      yPos -= 10;
      doc.text(`Total Credit: Rs. ${Number(balance.total_credit).toLocaleString()}`, 20, yPos);
      yPos += 5;
      doc.text(`Total Debit: Rs. ${Number(balance.total_debit).toLocaleString()}`, 20, yPos);
      yPos += 5;
      doc.setTextColor(balanceColor[0], balanceColor[1], balanceColor[2]);
      doc.text(`Net Balance: Rs. ${Math.abs(netBalance).toLocaleString()} (${balanceText})`, 20, yPos);
    }

    // Generate filename and download
    const filename = `Farmer_${farmer.name.replace(/\s+/g, '_')}_Transaction_Report_${new Date().toISOString().split('T')[0]}.pdf`;
    doc.save(filename);

  } catch (error) {
    console.error('Error generating transaction report:', error);
    throw error;
  }
};
