const express = require('express');
const { createClient } = require('@supabase/supabase-js');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

// Your Supabase credentials
const SUPABASE_URL = 'https://zsaqplqbigykndswsfct.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpzYXFwbHFiaWd5a25kc3dzZmN0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDg5NTk4MjYsImV4cCI6MjA2NDUzNTgyNn0._N-XTqi1ZCLCwcmn09AUjQKYYbiBDX3goD6XKtWszTw'; // <-- YOU NEED TO ADD THIS
const API_KEY = 'my-secret-api-key-12345';

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);
// Test Supabase connection immediately
console.log('Testing Supabase connection...');
supabase
  .from('options_oi')
  .select('count', { count: 'exact' })
  .then(({ count, error }) => {
    if (error) {
      console.error('❌ Supabase test failed:', error.message);
      console.error('Full error:', error);
    } else {
      console.log('✅ Supabase connected! Table has', count, 'rows');
    }
  });
// Test endpoint
app.get('/', (req, res) => {
  console.log('GET / called');
  res.json({ status: 'OI Tracker API is running!' });
});

// Get options data
app.get('/api/options-data', async (req, res) => {
  console.log('GET /api/options-data called');
  try {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    
    console.log('Querying Supabase...');
    const { data, error } = await supabase
      .from('options_oi')
      .select('*')
      .gte('timestamp', yesterday.toISOString())
      .order('oi_change', { ascending: false })
      .limit(100);
    
    if (error) {
      console.error('Supabase error:', error);
      throw error;
    }
    
    const formatted = (data || []).map(row => ({
      ticker: row.ticker,
      exp: row.expiry,
      strike: `$${row.strike}`,
      callPut: row.right === 'C' ? 'Call' : 'Put',
      oiChange: row.oi_change,
      pctChange: row.pct_change,
      volume: row.volume,
      lastPrice: row.last_price
    }));
    
    console.log('Sending response with', formatted.length, 'items');
    res.json({ data: formatted });
  } catch (error) {
    console.error('Route error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Push data endpoint
app.post('/api/push-data', async (req, res) => {
  console.log('POST /api/push-data called');
  
  // Check API key
  if (req.headers['x-api-key'] !== API_KEY) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const { data } = req.body;
  
  try {
    console.log('Inserting', data.length, 'records to Supabase');
    const { error } = await supabase
      .from('options_oi')
      .insert(data);
    
    if (error) throw error;
    
    res.json({ success: true, count: data.length });
  } catch (error) {
    console.error('Insert error:', error);
    res.status(500).json({ error: error.message });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
