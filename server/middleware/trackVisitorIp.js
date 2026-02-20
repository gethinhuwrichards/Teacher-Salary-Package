const supabase = require('../db/supabase');

/**
 * Middleware that records every unique visitor IP to the visitor_ips table.
 * Uses upsert to increment visit_count and update last_seen.
 */
async function trackVisitorIp(req, res, next) {
  // Don't block the response — fire and forget
  const ip = req.headers['x-forwarded-for']?.split(',')[0]?.trim() || req.ip || null;

  if (ip && ip !== '::1' && ip !== '127.0.0.1') {
    supabase
      .rpc('upsert_visitor_ip', { p_ip: ip })
      .then(({ error }) => {
        if (error) console.error('Visitor IP tracking error:', error.message);
      })
      .catch((err) => {
        console.error('Visitor IP tracking failed:', err.message);
      });
  }

  next();
}

module.exports = trackVisitorIp;
