// Simple test to debug invoice generation
import jsPDF from 'jspdf';

try {
  console.log('Testing basic jsPDF functionality...');
  
  const doc = new jsPDF();
  
  // Test basic text
  doc.setFontSize(16);
  doc.text('Test Invoice', 20, 20);
  
  // Test save
  doc.save('test.pdf');
  
  console.log('✅ Basic PDF generation works!');
} catch (error) {
  console.error('❌ PDF generation failed:', error);
}
