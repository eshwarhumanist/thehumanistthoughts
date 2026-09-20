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

module.exports = router;
