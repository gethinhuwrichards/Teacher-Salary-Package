require('dotenv').config();
const express = require('express');
const cors = require('cors');

const schoolsRoutes = require('./routes/schools');
const countriesRoutes = require('./routes/countries');
const submissionsRoutes = require('./routes/submissions');
const adminRoutes = require('./routes/admin');
const currencyRoutes = require('./routes/currency');

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

// Health check
app.get('/api/health', async (req, res) => {
  const checks = {
    supabase_url: !!process.env.SUPABASE_URL,
    supabase_key: !!process.env.SUPABASE_SERVICE_KEY,
    exchange_key: !!process.env.EXCHANGE_RATE_API_KEY,
    admin_password: !!process.env.ADMIN_PASSWORD,
  };
  try {
    const supabase = require('./db/supabase');
    const { error } = await supabase.from('schools').select('id').limit(1);
    checks.supabase_connected = !error;
    if (error) checks.supabase_error = error.message;
  } catch (err) {
    checks.supabase_connected = false;
    checks.supabase_error = err.message;
  }
  res.json(checks);
});

app.use('/api/schools', schoolsRoutes);
app.use('/api/countries', countriesRoutes);
app.use('/api/submissions', submissionsRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/currency', currencyRoutes);

// Only listen when running locally (not on Vercel)
if (process.env.VERCEL !== '1') {
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
}

module.exports = app;
