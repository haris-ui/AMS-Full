// Invoice configuration settings
// Update these details with your actual business information

export const INVOICE_CONFIG = {
  company: {
    name: 'Artiya Management System',
    address: 'Your Business Address, City, State, PIN',
    phone: '+91-XXXXX-XXXXX',
    email: 'info@artiya.com',
    website: 'www.artiya.com'
  },
  
  // Invoice number format settings
  invoice: {
    purchasePrefix: 'PUR',
    salePrefix: 'SALE',
    numberLength: 6 // padding with zeros
  },

  // PDF styling settings
  styling: {
    primaryColor: [33, 150, 243], // RGB blue
    secondaryColor: [76, 175, 80], // RGB green
    textColor: [0, 0, 0], // RGB black
    lightGrayColor: [245, 245, 245], // RGB light gray
    headerFontSize: 24,
    titleFontSize: 18,
    normalFontSize: 11,
    smallFontSize: 10
  }
};

// Helper function to get company info
export const getCompanyInfo = () => INVOICE_CONFIG.company;
