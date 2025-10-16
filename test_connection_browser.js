import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://orvgmypzqamtfzutvfsp.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9ydmdteXB6cWFtdGZ6dXR2ZnNwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjA1NTg3NTAsImV4cCI6MjA3NjEzNDc1MH0.s5Vak0XU_khy6NbfLC9F-hHa9afeb967hLCU6LVdSlg';

const supabase = createClient(supabaseUrl, supabaseKey);

async function testConnection() {
  console.log('🔄 Testing Supabase connection...');

  try {
    // Test 1: Check roles table
    console.log('\n📋 Testing roles table...');
    const { data: roles, error: rolesError } = await supabase
      .from('roles')
      .select('*');

    if (rolesError) {
      console.log('❌ Roles table error:', rolesError.message);
      document.body.innerHTML += `<p>❌ Roles table error: ${rolesError.message}</p>`;
    } else {
      console.log('✅ Roles table accessible!');
      console.log('Roles:', roles);
      document.body.innerHTML += `<p>✅ Roles table accessible! Count: ${roles.length}</p>`;
      document.body.innerHTML += `<pre>${JSON.stringify(roles, null, 2)}</pre>`;
    }

    // Test 2: Check if we can authenticate (optional for public read)
    console.log('\n🔐 Testing authentication...');
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      console.log('✅ User authenticated:', user.email);
      document.body.innerHTML += `<p>✅ User authenticated: ${user.email}</p>`;
    } else {
      console.log('ℹ️ No user authenticated (normal for public access)');
      document.body.innerHTML += `<p>ℹ️ No user authenticated (normal for public access)</p>`;
    }

  } catch (error) {
    console.log('💥 Connection test failed:', error.message);
    document.body.innerHTML += `<p>💥 Connection test failed: ${error.message}</p>`;
  }
}

testConnection();
