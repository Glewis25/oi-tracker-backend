const express = require('express');
const { createClient } = require('@supabase/supabase-js');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

// Your Supabase credentials
const SUPABASE_URL = 'https://zsaqplqbigykndswsfct.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpzYXFwbHFiaWd5a25kc3dzZmN0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDg5NTk4MjYsImV4cCI6MjA2NDUzNTgyNn0._N-XTqi1ZCLCwcmn09AUjQKYYbiBDX3goD6XKtWszTw';
const API_KEY = 'my-secret-api-key-12345';

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

// ADD THIS DEBUGGING CODE HERE (RIGHT AFTER CREATING SUPABASE CLIENT):
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

// REPLACE YOUR ENTIRE /api/options-data ENDPOINT WITH THIS VERSION:
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
    
    console.log('Got', data?.length || 0, 'rows from Supabase');
    
    const formatted = (data || []).map(row => {
      try {
        return {
          ticker: row.ticker || '',
          exp: row.expiry || '',
          strike: row.strike ? `$${row.strike}` : '$0',
          callPut: (row['right'] || row.right) === 'C' ? 'Call' : 'Put',
          oiChange: row.oi_change || 0,
          pctChange: row.pct_change || 0,
          volume: row.volume || 0,
          lastPrice: row.last_price || 0
        };
      } catch (e) {
        console.error('Error formatting row:', row, e);
        return null;
      }
    }).filter(Boolean);
    
    console.log('Sending response with', formatted.length, 'items');
    res.json({ data: formatted });
  } catch (error) {
    console.error('Route error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Push data endpoint (KEEP THIS AS IS)
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
