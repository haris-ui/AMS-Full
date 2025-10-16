// Test script to populate some transaction data
// Run this after creating farmers and purchases to test the transaction system

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL || 'https://wylyjborkhjbgykyqoqx.supabase.co';
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Ind5bHlqYm9ya2hqYmd5a3lxb3F4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjA1NzM5NDUsImV4cCI6MjA3NjE0OTk0NX0.kylN6QMhOK4YpbQ4dOQnuotmViEs0MwXtkrfMfRfDrM';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function populateTestTransactions() {
  console.log('🔍 Checking existing data...');
  
  try {
    // First, check if we have farmers
    const { data: farmers, error: farmersError } = await supabase
      .from('farmers')
      .select('id, name')
      .limit(3);
    
    if (farmersError) {
      console.error('❌ Error fetching farmers:', farmersError);
      return;
    }
    
    if (!farmers || farmers.length === 0) {
      console.log('⚠️  No farmers found. Please create some farmers first through the app.');
      return;
    }
    
    console.log(`✅ Found ${farmers.length} farmers`);
    farmers.forEach(f => console.log(`   - ${f.name} (ID: ${f.id})`));
    
    // Create some sample transactions for each farmer
    const testTransactions = [];
    
    farmers.forEach(farmer => {
      // Purchase transaction (Credit - you owe farmer)
      testTransactions.push({
        farmer_id: farmer.id,
        type: 'Credit',
        amount: 15000.00,
        description: `Test purchase of wheat from ${farmer.name}`,
        date: new Date().toISOString().split('T')[0]
      });
      
      // Partial payment (Debit - farmer owes you less)
      testTransactions.push({
        farmer_id: farmer.id,
        type: 'Debit',
        amount: 8000.00,
        description: `Partial payment to ${farmer.name}`,
        date: new Date(Date.now() - 86400000).toISOString().split('T')[0] // Yesterday
      });
      
      // Sale transaction (Credit - you owe farmer for crops)
      testTransactions.push({
        farmer_id: farmer.id,
        type: 'Credit',
        amount: 25000.00,
        description: `Crop sale proceeds for ${farmer.name}`,
        date: new Date(Date.now() - 172800000).toISOString().split('T')[0] // 2 days ago
      });
      
      // Commission deduction (Debit - farmer owes you commission)
      testTransactions.push({
        farmer_id: farmer.id,
        type: 'Debit',
        amount: 500.00,
        description: `Commission (2%) on sale for ${farmer.name}`,
        date: new Date(Date.now() - 172800000).toISOString().split('T')[0] // 2 days ago
      });
    });
    
    console.log(`\n📝 Inserting ${testTransactions.length} test transactions...`);
    
    const { data: insertedTransactions, error: insertError } = await supabase
      .from('transactions')
      .insert(testTransactions)
      .select();
    
    if (insertError) {
      console.error('❌ Error inserting transactions:', insertError);
      return;
    }
    
    console.log(`✅ Successfully inserted ${insertedTransactions.length} transactions`);
    
    // Check balances
    console.log('\n💰 Checking farmer balances...');
    const { data: balances, error: balanceError } = await supabase
      .from('farmer_balances')
      .select('*');
    
    if (balanceError) {
      console.error('❌ Error fetching balances:', balanceError);
    } else if (balances && balances.length > 0) {
      console.log('✅ Farmer balances:');
      balances.forEach(balance => {
        const netBalance = Number(balance.balance);
        const owesText = netBalance >= 0 ? 'You owe farmer' : 'Farmer owes you';
        console.log(`   - ${balance.farmer_name}: Rs. ${Math.abs(netBalance).toLocaleString()} (${owesText})`);
      });
    } else {
      console.log('⚠️  No balance data found');
    }
    
    console.log('\n🎉 Test data population complete!');
    console.log('\nNext steps:');
    console.log('1. Open your app at http://localhost:5173/');
    console.log('2. Go to Transactions page or click Receipt icon on Farmers page');
    console.log('3. Select a farmer to see their transaction history');
    console.log('4. Generate a PDF report to test the feature');
    
  } catch (error) {
    console.error('❌ Unexpected error:', error);
  }
}

// Run the test data population
console.log('🧪 Test Transaction Data Populator');
console.log('===================================\n');

populateTestTransactions().then(() => {
  console.log('\n🏁 Script completed');
}).catch(error => {
  console.error('❌ Script failed:', error);
});
