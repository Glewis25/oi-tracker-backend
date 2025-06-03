const express = require('express');
const { createClient } = require('@supabase/supabase-js');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

// TODO: Replace these with your actual values
const SUPABASE_URL = 'https://zsaqplqbigykndswsfct.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpzYXFwbHFiaWd5a25kc3dzZmN0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDg5NTk4MjYsImV4cCI6MjA2NDUzNTgyNn0._N-XTqi1ZCLCwcmn09AUjQKYYbiBDX3goD6XKtWszTw';
const API_KEY = 'my-secret-api-key-12345';

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

// Endpoint to receive data from Python
app.post('/api/push-data', async (req, res) => {
  if (req.headers['x-api-key'] !== API_KEY) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const { data } = req.body;
  
  try {
    const { error } = await supabase
      .from('options_oi')
      .insert(data);
    
    if (error) throw error;
    
    res.json({ success: true, count: data.length });
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get data for dashboard
app.get('/api/options-data', async (req, res) => {
  try {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    
    const { data, error } = await supabase
      .from('options_oi')
      .select('*')
      .gte('timestamp', yesterday.toISOString())
      .order('oi_change', { ascending: false })
      .limit(100);
    
    if (error) throw error;
    
    const formatted = data.map(row => ({
      ticker: row.ticker,
      exp: row.expiry,
      strike: `$${row.strike}`,
      callPut: row.right === 'C' ? 'Call' : 'Put',
      oiChange: row.oi_change,
      pctChange: row.pct_change,
      volume: row.volume,
      lastPrice: row.last_price
    }));
    
    res.json({ data: formatted });
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: error.message });
  }
});

app.get('/', (req, res) => {
  res.json({ status: 'OI Tracker API is running!' });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
