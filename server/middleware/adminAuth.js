const supabase = require('../db/supabase');

async function adminAuth(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const token = authHeader.split(' ')[1];

  const { data: session, error } = await supabase
    .from('admin_sessions')
    .select('*')
    .eq('id', token)
    .gt('expires_at', new Date().toISOString())
    .single();

  if (error || !session) {
    return res.status(401).json({ error: 'Invalid or expired session' });
  }

  next();
}

module.exports = adminAuth;
