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
