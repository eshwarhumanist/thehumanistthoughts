const express = require('express');
const bcrypt = require('bcryptjs');
const db = require('../db');

const router = express.Router();

router.get('/login', (req, res) => {
  if (req.session.adminId) return res.redirect('/admin');
  res.render('login', { error: null });
});

router.post('/login', (req, res) => {
  const { username, password } = req.body;
  const admin = db.prepare('SELECT * FROM admins WHERE username = ?').get(username);

  if (!admin || !bcrypt.compareSync(password || '', admin.password_hash)) {
    return res.status(401).render('login', { error: 'Invalid username or password.' });
  }

  req.session.regenerate((err) => {
    if (err) return res.status(500).render('login', { error: 'Something went wrong. Try again.' });
    req.session.adminId = admin.id;
    req.session.adminUsername = admin.username;
    const dest = req.session.returnTo || '/admin';
    delete req.session.returnTo;
    res.redirect(dest);
  });
});

router.post('/logout', (req, res) => {
  req.session.destroy(() => {
    res.redirect('/');
  });
});

// One-time admin bootstrap for hosts without shell access (e.g. Render free tier).
// Only works while no admin account exists yet, and requires SETUP_TOKEN to match.
router.get('/setup', (req, res) => {
  const existing = db.prepare('SELECT id FROM admins LIMIT 1').get();
  if (existing) return res.status(403).send('An admin account already exists. Setup is disabled.');

  const token = process.env.SETUP_TOKEN;
  if (!token || req.query.token !== token) {
    return res.status(403).send('Invalid or missing setup token.');
  }

  res.send(`
    <form method="POST" action="/setup?token=${encodeURIComponent(req.query.token)}" style="max-width:360px;margin:4rem auto;font-family:sans-serif;">
      <h2>Create Admin Account</h2>
      <input name="username" placeholder="Username" required style="width:100%;padding:0.5rem;margin-bottom:0.75rem;">
      <input name="password" type="password" placeholder="Password (min 8 chars)" required minlength="8" style="width:100%;padding:0.5rem;margin-bottom:0.75rem;">
      <button type="submit" style="width:100%;padding:0.6rem;">Create Admin</button>
    </form>
  `);
});

router.post('/setup', (req, res) => {
  const existing = db.prepare('SELECT id FROM admins LIMIT 1').get();
  if (existing) return res.status(403).send('An admin account already exists. Setup is disabled.');

  const token = process.env.SETUP_TOKEN;
  if (!token || req.query.token !== token) {
    return res.status(403).send('Invalid or missing setup token.');
  }

  const { username, password } = req.body;
  if (!username || !password || password.length < 8) {
    return res.status(400).send('Username and a password of at least 8 characters are required.');
  }

  const hash = bcrypt.hashSync(password, 12);
  db.prepare('INSERT INTO admins (username, password_hash) VALUES (?, ?)').run(username, hash);
  res.send('Admin account created. You can now <a href="/login">log in</a>. For security, remove the SETUP_TOKEN environment variable now.');
});

module.exports = router;
