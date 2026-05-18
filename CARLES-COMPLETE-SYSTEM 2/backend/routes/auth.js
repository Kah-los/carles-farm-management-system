const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const db = require('../db');
const { authenticateToken, JWT_SECRET } = require('../middleware/auth');
const router = express.Router();

function userPayload(u){ return { id:u.id, username:u.username, fullName:u.full_name, role:u.role, email:u.email, phone:u.phone }; }
router.post('/login', async (req,res)=>{
  try {
    const { username, pin } = req.body;
    if (!username || !pin) return res.status(400).json({ error:'Username and PIN are required' });
    const { rows } = await db.query('SELECT * FROM users WHERE username=$1', [username]);
    const user = rows[0];
    if (!user) return res.status(401).json({ error:'Invalid username or PIN' });
    if (user.is_locked) return res.status(403).json({ error:'Account is locked. Contact an administrator.' });
    const ok = await bcrypt.compare(String(pin), user.pin_hash);
    if (!ok) {
      const attempts = (user.failed_attempts || 0) + 1;
      await db.query('UPDATE users SET failed_attempts=$1,is_locked=$2,updated_at=NOW() WHERE id=$3',[attempts, attempts>=3, user.id]);
      return res.status(401).json({ error: attempts>=3 ? 'Account locked after 3 failed attempts' : 'Invalid username or PIN' });
    }
    await db.query('UPDATE users SET failed_attempts=0,is_locked=false,last_login=NOW(),updated_at=NOW() WHERE id=$1',[user.id]);
    const payload = userPayload(user);
    const token = jwt.sign(payload, JWT_SECRET, { expiresIn:'12h' });
    res.json({ token, user: payload });
  } catch(e){ console.error(e); res.status(500).json({ error:'Login failed' }); }
});
router.get('/me', authenticateToken, async (req,res)=>{
  const { rows } = await db.query('SELECT id,username,full_name,role,email,phone FROM users WHERE id=$1',[req.user.id]);
  if (!rows[0]) return res.status(404).json({ error:'User not found' });
  res.json(userPayload(rows[0]));
});
router.post('/change-pin', authenticateToken, async(req,res)=>{
  const { currentPin, newPin } = req.body;
  if (!currentPin || !newPin || String(newPin).length < 4) return res.status(400).json({ error:'Current PIN and a new PIN of at least 4 digits are required' });
  const { rows } = await db.query('SELECT pin_hash FROM users WHERE id=$1',[req.user.id]);
  const ok = await bcrypt.compare(String(currentPin), rows[0].pin_hash);
  if (!ok) return res.status(401).json({ error:'Current PIN is incorrect' });
  const hash = await bcrypt.hash(String(newPin), 10);
  await db.query('UPDATE users SET pin_hash=$1,updated_at=NOW() WHERE id=$2',[hash, req.user.id]);
  res.json({ message:'PIN changed successfully' });
});
module.exports = router;
