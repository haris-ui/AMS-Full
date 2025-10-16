import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { INVOICE_CONFIG } from '../config/invoiceSettings';
import type { Database } from '../lib/database.types';

type Purchase = Database['public']['Tables']['purchases']['Row'];
type PurchaseItem = Database['public']['Tables']['purchase_items']['Row'];
type Farmer = Database['public']['Tables']['farmers']['Row'];
type Product = Database['public']['Tables']['products']['Row'];
type CropSale = Database['public']['Tables']['crop_sales']['Row'];

interface PurchaseWithDetails extends Purchase {
  farmers?: Farmer;
  purchase_items?: (PurchaseItem & { products?: Product })[];
}

interface SaleWithFarmer extends CropSale {
  farmers?: Farmer;
}

interface InvoiceData {
  type: 'purchase' | 'sale';
  data: PurchaseWithDetails | SaleWithFarmer;
  companyInfo?: {
    name: string;
    address: string;
    phone: string;
    email?: string;
  };
}

export class InvoiceGenerator {
  private doc: jsPDF;
  
  constructor() {
    this.doc = new jsPDF();
  }

  generatePurchaseInvoice(purchaseData: PurchaseWithDetails, companyInfo?: InvoiceData['companyInfo']) {
    try {
      this.doc = new jsPDF();
      
      // Header
      this.addHeader(companyInfo);
      
      // Invoice details
      this.addInvoiceDetails('PURCHASE INVOICE', {
        'Invoice #': `PUR-${String(purchaseData.id).padStart(6, '0')}`,
        'Date': purchaseData.date ? new Date(purchaseData.date).toLocaleDateString() : 'N/A',
        'Payment Type': purchaseData.payment_type || 'N/A'
      });

      // Farmer details
      this.addPartyDetails('Farmer Details', {
        'Name': purchaseData.farmers?.name || 'Unknown',
        'Father\'s Name': purchaseData.farmers?.father_name || 'N/A',
        'Phone': purchaseData.farmers?.phone_number || 'N/A',
        'Address': purchaseData.farmers?.address || 'N/A'
      });

      // Items table
      if (purchaseData.purchase_items && purchaseData.purchase_items.length > 0) {
        this.addPurchaseItemsTable(purchaseData.purchase_items);
      }

      // Total
      this.addTotal(Number(purchaseData.total_amount) || 0);

      // Footer
      this.addFooter();

      // Download
      this.doc.save(`Purchase_Invoice_${purchaseData.id}_${new Date().toISOString().split('T')[0]}.pdf`);
    } catch (error) {
      console.error('Error generating purchase invoice:', error);
      throw new Error(`Failed to generate purchase invoice: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  generateSaleInvoice(saleData: SaleWithFarmer, companyInfo?: InvoiceData['companyInfo']) {
    try {
      this.doc = new jsPDF();
      
      // Header
      this.addHeader(companyInfo);
      
      // Invoice details
      this.addInvoiceDetails('CROP SALE INVOICE', {
        'Invoice #': `SALE-${String(saleData.id).padStart(6, '0')}`,
        'Date': saleData.date ? new Date(saleData.date).toLocaleDateString() : 'N/A',
        'Sold To': saleData.sold_to || 'N/A'
      });

      // Farmer details
      this.addPartyDetails('Farmer Details', {
        'Name': saleData.farmers?.name || 'Unknown',
        'Phone': saleData.farmers?.phone_number || 'N/A',
        'Address': saleData.farmers?.address || 'N/A'
      });

      // Sale summary table
      this.addSaleSummaryTable(saleData);

      // Footer
      this.addFooter();

      // Download
      this.doc.save(`Sale_Invoice_${saleData.id}_${new Date().toISOString().split('T')[0]}.pdf`);
    } catch (error) {
      console.error('Error generating sale invoice:', error);
      throw new Error(`Failed to generate sale invoice: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  private addHeader(companyInfo?: InvoiceData['companyInfo']) {
    try {
      const pageWidth = this.doc.internal.pageSize.width;
      
      // Company name
      this.doc.setFontSize(24);
      this.doc.setTextColor(33, 150, 243); // Blue color
      const companyName = companyInfo?.name || 'Artiya Management System';
      this.doc.text(companyName, pageWidth / 2, 25, { align: 'center' });
      
      // Company details
      this.doc.setFontSize(10);
      this.doc.setTextColor(100, 100, 100);
      let yPos = 35;
      
      if (companyInfo?.address) {
        this.doc.text(companyInfo.address, pageWidth / 2, yPos, { align: 'center' });
        yPos += 5;
      }
      
      if (companyInfo?.phone) {
        this.doc.text(`Phone: ${companyInfo.phone}`, pageWidth / 2, yPos, { align: 'center' });
        yPos += 5;
      }
      
      if (companyInfo?.email) {
        this.doc.text(`Email: ${companyInfo.email}`, pageWidth / 2, yPos, { align: 'center' });
      }

      // Line separator
      this.doc.setDrawColor(200, 200, 200);
      this.doc.line(20, yPos + 10, pageWidth - 20, yPos + 10);
    } catch (error) {
      console.error('Error in addHeader:', error);
    }
  }

  private addInvoiceDetails(title: string, details: Record<string, string>) {
    const pageWidth = this.doc.internal.pageSize.width;
    
    // Title
    this.doc.setFontSize(18);
    this.doc.setTextColor(0, 0, 0);
    this.doc.text(title, pageWidth / 2, 75, { align: 'center' });
    
    // Details
    this.doc.setFontSize(11);
    let yPos = 90;
    
    Object.entries(details).forEach(([key, value]) => {
      this.doc.setTextColor(100, 100, 100);
      this.doc.text(`${key}:`, 20, yPos);
      this.doc.setTextColor(0, 0, 0);
      this.doc.text(value, 70, yPos);
      yPos += 8;
    });
  }

  private addPartyDetails(title: string, details: Record<string, string>) {
    const pageWidth = this.doc.internal.pageSize.width;
    
    // Background
    this.doc.setFillColor(248, 249, 250);
    this.doc.rect(20, 125, pageWidth - 40, 35, 'F');
    
    // Title
    this.doc.setFontSize(12);
    this.doc.setTextColor(33, 150, 243);
    this.doc.text(title, 25, 135);
    
    // Details
    this.doc.setFontSize(10);
    let yPos = 145;
    
    Object.entries(details).forEach(([key, value], index) => {
      const xPos = index % 2 === 0 ? 25 : pageWidth / 2 + 10;
      if (index % 2 === 0 && index > 0) yPos += 8;
      
      this.doc.setTextColor(100, 100, 100);
      this.doc.text(`${key}:`, xPos, yPos);
      this.doc.setTextColor(0, 0, 0);
      this.doc.text(value, xPos + 40, yPos);
    });
  }

  private addPurchaseItemsTable(items: (PurchaseItem & { products?: Product })[]) {
    const tableData = items.map((item, index) => [
      index + 1,
      item.products?.name || 'Unknown Product',
      item.products?.unit || 'N/A',
      Number(item.quantity || 0).toFixed(2),
      `Rs. ${Number(item.rate || 0).toFixed(2)}`,
      `Rs. ${(Number(item.quantity || 0) * Number(item.rate || 0)).toFixed(2)}`
    ]);

    autoTable(this.doc, {
      startY: 175,
      head: [['#', 'Product', 'Unit', 'Quantity', 'Rate', 'Total']],
      body: tableData,
      styles: {
        fontSize: 10,
        cellPadding: 5,
      },
      headStyles: {
        fillColor: [33, 150, 243],
        textColor: 255,
        fontStyle: 'bold',
      },
      alternateRowStyles: {
        fillColor: [245, 245, 245],
      },
      columnStyles: {
        0: { halign: 'center', cellWidth: 15 },
        3: { halign: 'right' },
        4: { halign: 'right' },
        5: { halign: 'right' },
      },
    });
  }

  private addSaleSummaryTable(saleData: SaleWithFarmer) {
    const totalValue = Number(saleData.total_value || 0);
    const commissionPercent = Number(saleData.commission_percent || 0);
    const commissionAmount = (totalValue * commissionPercent) / 100;
    const netPayable = totalValue - commissionAmount;

    const tableData = [
      ['Total Sale Value', `Rs. ${totalValue.toLocaleString()}`],
      [`Commission (${commissionPercent}%)`, `Rs. ${commissionAmount.toLocaleString()}`],
      ['Net Payable to Farmer', `Rs. ${netPayable.toLocaleString()}`]
    ];

    autoTable(this.doc, {
      startY: 175,
      head: [['Description', 'Amount']],
      body: tableData,
      styles: {
        fontSize: 12,
        cellPadding: 8,
      },
      headStyles: {
        fillColor: [33, 150, 243],
        textColor: 255,
        fontStyle: 'bold',
      },
      columnStyles: {
        0: { cellWidth: 100 },
        1: { halign: 'right', fontStyle: 'bold' },
      },
      didParseCell: (data: any) => {
        if (data.row.index === 2 && data.column.index === 1) {
          data.cell.styles.fillColor = [76, 175, 80];
          data.cell.styles.textColor = 255;
        }
      },
    });
  }

  private addTotal(amount: number) {
    const pageWidth = this.doc.internal.pageSize.width;
    const lastTable = (this.doc as any).lastAutoTable;
    const yPos = (lastTable?.finalY ? lastTable.finalY + 20 : 190);
    
    try {
      // Total background
      this.doc.setFillColor(33, 150, 243);
      this.doc.rect(pageWidth - 120, yPos - 5, 100, 20, 'F');
      
      // Total text
      this.doc.setFontSize(14);
      this.doc.setTextColor(255, 255, 255);
      this.doc.text('TOTAL AMOUNT:', pageWidth - 115, yPos + 5);
      this.doc.setFontSize(16);
      this.doc.text(`Rs. ${amount.toLocaleString()}`, pageWidth - 115, yPos + 12);
    } catch (error) {
      console.error('Error in addTotal:', error);
    }
  }

  private addFooter() {
    const pageHeight = this.doc.internal.pageSize.height;
    const pageWidth = this.doc.internal.pageSize.width;
    
    // Line separator
    this.doc.setDrawColor(200, 200, 200);
    this.doc.line(20, pageHeight - 30, pageWidth - 20, pageHeight - 30);
    
    // Footer text
    this.doc.setFontSize(9);
    this.doc.setTextColor(100, 100, 100);
    this.doc.text('Generated by Artiya Management System', 20, pageHeight - 20);
    this.doc.text(`Generated on: ${new Date().toLocaleString()}`, pageWidth - 20, pageHeight - 20, { align: 'right' });
  }
}

// Export singleton instance
export const invoiceGenerator = new InvoiceGenerator();
