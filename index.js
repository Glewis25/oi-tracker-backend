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
    
    console.log('Supabase response:', { data, error });
    
    if (error) {
      console.error('Supabase error:', error);
      throw error;
    }
    
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
    
    console.log('Sending response with', formatted.length, 'items');
    res.json({ data: formatted });
  } catch (error) {
    console.error('Route error:', error);
    res.status(500).json({ error: error.message });
  }
});

app.get('/', (req, res) => {
  console.log('GET / called');
  res.json({ status: 'OI Tracker API is running!' });
});
