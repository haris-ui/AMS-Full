const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://orvgmypzqamtfzutvfsp.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9ydmdteXB6cWFtdGZ6dXR2ZnNwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjA1NTg3NTAsImV4cCI6MjA3NjEzNDc1MH0.s5Vak0XU_khy6NbfLC9F-hHa9afeb967hLCU6LVdSlg';

const supabase = createClient(supabaseUrl, supabaseKey);

async function testConnection() {
  console.log('🔄 Testing Supabase connection...');
  console.log('URL:', supabaseUrl);
  console.log('API Key starts with:', supabaseKey.substring(0, 20) + '...');

  try {
    // Test 1: Check roles table
    console.log('\n📋 Testing roles table...');
    const { data: roles, error: rolesError } = await supabase
      .from('roles')
      .select('*');

    if (rolesError) {
      console.log('❌ Roles table error:', rolesError.message);
    } else {
      console.log('✅ Roles table accessible!');
      console.log('Roles count:', roles.length);
      console.log('Roles:', roles);
    }

    // Test 2: Check farmers table structure
    console.log('\n👨‍🌾 Testing farmers table...');
    const { data: farmers, error: farmersError } = await supabase
      .from('farmers')
      .select('*')
      .limit(1);

    if (farmersError) {
      console.log('❌ Farmers table error:', farmersError.message);
    } else {
      console.log('✅ Farmers table accessible!');
      console.log('Sample farmer data:', farmers);
    }

    // Test 3: Check products table
    console.log('\n📦 Testing products table...');
    const { data: products, error: productsError } = await supabase
      .from('products')
      .select('*')
      .limit(1);

    if (productsError) {
      console.log('❌ Products table error:', productsError.message);
    } else {
      console.log('✅ Products table accessible!');
      console.log('Total products:', products.length);
    }

  } catch (error) {
    console.log('💥 Connection test failed:', error.message);
  }
}

testConnection();
