# PDF Invoice Generator

## Overview
The Artiya Management System now includes a comprehensive PDF invoice generator that creates professional invoices for both purchases and sales transactions. The invoices are generated client-side and automatically downloaded.

## Features

### 📄 **Purchase Invoices**
- **Professional Layout**: Company header, farmer details, itemized table
- **Detailed Items Table**: Product name, unit, quantity, rate, and totals
- **Payment Information**: Payment type, total amount
- **Auto-Generated Invoice Numbers**: Format: PUR-000001, PUR-000002, etc.

### 📄 **Sale Invoices** 
- **Crop Sale Summary**: Total value, commission breakdown, net payable
- **Farmer Details**: Name, contact information
- **Buyer Information**: Sold to details
- **Commission Calculation**: Automatic percentage and amount calculation
- **Auto-Generated Invoice Numbers**: Format: SALE-000001, SALE-000002, etc.

### 🎨 **Professional Styling**
- **Company Branding**: Customizable header with company details
- **Clean Layout**: Modern design with proper spacing and alignment
- **Color Coding**: Blue headers, green highlights for net amounts
- **Responsive Tables**: Auto-sized columns with proper alignment
- **Footer Information**: Generation timestamp and system branding

## Usage

### **For Purchases**
1. Navigate to **Purchases** page
2. Find the purchase record you want to invoice
3. Click the **📄 PDF icon** (green FileText button) in the Actions column
4. Or open the purchase details modal and click **"PDF Invoice"** button
5. The PDF will automatically download to your default downloads folder

### **For Sales**
1. Navigate to **Crop Sales** page  
2. Find the sale record you want to invoice
3. Click the **📄 PDF icon** (green FileText button) in the Actions column
4. Or open the sale details modal and click **"PDF Invoice"** button
5. The PDF will automatically download to your default downloads folder

## Configuration

### **Company Information**
Update your business details in `src/config/invoiceSettings.ts`:

```typescript
export const INVOICE_CONFIG = {
  company: {
    name: 'Your Business Name',
    address: 'Your Complete Business Address',
    phone: '+91-XXXXX-XXXXX',
    email: 'info@yourcompany.com',
    website: 'www.yourcompany.com'
  }
};
```

### **Styling Customization**
Modify colors and fonts in the same config file:

```typescript
styling: {
  primaryColor: [33, 150, 243], // RGB blue
  secondaryColor: [76, 175, 80], // RGB green
  headerFontSize: 24,
  titleFontSize: 18,
  normalFontSize: 11
}
```

## File Naming Convention

### **Purchase Invoices**
- Format: `Purchase_Invoice_{ID}_{DATE}.pdf`
- Example: `Purchase_Invoice_123_2024-01-15.pdf`

### **Sale Invoices**
- Format: `Sale_Invoice_{ID}_{DATE}.pdf`
- Example: `Sale_Invoice_456_2024-01-15.pdf`

## Technical Implementation

### **Dependencies**
- **jsPDF**: Core PDF generation library
- **jspdf-autotable**: Table generation plugin for structured data

### **Key Components**
- **`InvoiceGenerator` Class**: Main generator with methods for purchases and sales
- **`invoiceSettings.ts`**: Configuration file for customization
- **Integration**: Seamlessly integrated into PurchasesPage and SalesPage

### **Security**
- **Client-side Generation**: No sensitive data sent to external servers
- **User Data Isolation**: Respects user permissions and data access
- **Error Handling**: Comprehensive error catching and user feedback

## Invoice Structure

### **Purchase Invoice Sections**
1. **Header**: Company name, address, contact details
2. **Invoice Details**: Invoice number, date, payment type
3. **Farmer Information**: Name, father's name, phone, address
4. **Items Table**: Detailed breakdown of purchased items
5. **Total Section**: Highlighted total amount
6. **Footer**: Generation info and system branding

### **Sale Invoice Sections**
1. **Header**: Company name, address, contact details
2. **Invoice Details**: Invoice number, date, buyer information
3. **Farmer Information**: Name, contact details  
4. **Sale Summary**: Total value, commission, net payable
5. **Footer**: Generation info and system branding

## Customization Options

### **Logo Addition**
To add your company logo, modify the `addHeader()` method in `invoiceGenerator.ts`:

```typescript
// Add logo before company name
this.doc.addImage('your-logo.png', 'PNG', x, y, width, height);
```

### **Additional Fields**
Extend the invoice by modifying:
- **`addInvoiceDetails()`**: Add more invoice metadata
- **`addPartyDetails()`**: Include additional farmer/buyer information
- **`addPurchaseItemsTable()`**: Add more product details

### **Multi-language Support**
Update text strings in the generator methods to support different languages.

## Troubleshooting

### **PDF Not Downloading**
- Check browser popup/download blockers
- Ensure sufficient storage space
- Try different browser if issues persist

### **Missing Data in Invoice**
- Verify purchase/sale record has complete information
- Check database relationships (farmer, products, items)
- Ensure user has proper access permissions

### **Styling Issues**
- Verify configuration in `invoiceSettings.ts`
- Check RGB color values are valid (0-255 range)
- Ensure font sizes are reasonable (8-30 range)

## Future Enhancements

### **Planned Features**
- **Email Integration**: Direct email sending of invoices
- **Template System**: Multiple invoice templates
- **Bulk Generation**: Generate multiple invoices at once
- **Print Preview**: Preview before download
- **Digital Signatures**: Add authentication to invoices

### **Advanced Customization**
- **Multi-page Support**: For large transactions
- **Barcode/QR Codes**: For invoice tracking
- **Tax Calculations**: GST and other tax computations
- **Multi-currency**: Support for different currencies

## Support

For issues or customization requests:
1. Check the configuration file first
2. Review error messages in browser console
3. Verify data completeness in database
4. Test with sample transactions

The invoice generator is designed to be reliable, professional, and highly customizable to meet your business needs.
