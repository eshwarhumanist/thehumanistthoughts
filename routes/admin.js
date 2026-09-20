const express = require('express');
const path = require('path');
const fs = require('fs');
const multer = require('multer');
const { body, validationResult } = require('express-validator');
const db = require('../db');
const slugify = require('../utils/slugify');
const requireAdmin = require('../middleware/requireAdmin');

const router = express.Router();
router.use(requireAdmin);

const uploadDir = path.join(__dirname, '..', 'public', 'uploads');
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    cb(null, `${Date.now()}-${Math.round(Math.random() * 1e9)}${ext}`);
  }
});
const allowedExt = ['.png', '.jpg', '.jpeg', '.webp', '.gif'];
const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (allowedExt.includes(path.extname(file.originalname).toLowerCase())) return cb(null, true);
    cb(new Error('Only image files (png, jpg, jpeg, webp, gif) are allowed.'));
  }
});

function uniqueSlug(title, ignoreId) {
  const base = slugify(title) || 'article';
  let slug = base;
  let n = 1;
  while (true) {
    const existing = db.prepare('SELECT id FROM articles WHERE slug = ?').get(slug);
    if (!existing || existing.id === ignoreId) break;
    n += 1;
    slug = `${base}-${n}`;
  }
  return slug;
}

// Dashboard
router.get('/', (req, res) => {
  const articles = db.prepare(`
    SELECT articles.*, genres.name AS genre_name
    FROM articles LEFT JOIN genres ON genres.id = articles.genre_id
    ORDER BY articles.created_at DESC
  `).all();
  res.render('admin/dashboard', { articles });
});

// New article form
router.get('/articles/new', (req, res) => {
  res.render('admin/article-form', { article: null, errors: [], formData: {} });
});

router.post('/articles', upload.single('cover_image'),
  body('title').trim().isLength({ min: 1, max: 200 }).withMessage('Title is required (max 200 characters).'),
  body('body').trim().isLength({ min: 1 }).withMessage('Article content cannot be empty.'),
  (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).render('admin/article-form', { article: null, errors: errors.array(), formData: req.body });
    }

    const { title, summary, body: content, genre_id } = req.body;
    const slug = uniqueSlug(title);
    const coverImage = req.file ? `/uploads/${req.file.filename}` : null;

    db.prepare(`
      INSERT INTO articles (title, slug, genre_id, summary, body, cover_image)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(title, slug, genre_id || null, summary || null, content, coverImage);

    res.redirect('/admin');
  }
);

// Edit article form
router.get('/articles/:id/edit', (req, res) => {
  const article = db.prepare('SELECT * FROM articles WHERE id = ?').get(req.params.id);
  if (!article) return res.status(404).render('404');
  res.render('admin/article-form', { article, errors: [], formData: article });
});

router.put('/articles/:id', upload.single('cover_image'),
  body('title').trim().isLength({ min: 1, max: 200 }).withMessage('Title is required (max 200 characters).'),
  body('body').trim().isLength({ min: 1 }).withMessage('Article content cannot be empty.'),
  (req, res) => {
    const article = db.prepare('SELECT * FROM articles WHERE id = ?').get(req.params.id);
    if (!article) return res.status(404).render('404');

    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).render('admin/article-form', {
        article,
        errors: errors.array(),
        formData: { ...req.body, id: article.id }
      });
    }

    const { title, summary, body: content, genre_id, remove_cover_image } = req.body;
    const slug = uniqueSlug(title, article.id);

    let coverImage = article.cover_image;
    if (req.file) {
      if (article.cover_image) {
        const oldPath = path.join(__dirname, '..', 'public', article.cover_image);
        fs.unlink(oldPath, () => {});
      }
      coverImage = `/uploads/${req.file.filename}`;
    } else if (remove_cover_image === 'on' && article.cover_image) {
      const oldPath = path.join(__dirname, '..', 'public', article.cover_image);
      fs.unlink(oldPath, () => {});
      coverImage = null;
    }

    db.prepare(`
      UPDATE articles
      SET title = ?, slug = ?, genre_id = ?, summary = ?, body = ?, cover_image = ?, updated_at = datetime('now')
      WHERE id = ?
    `).run(title, slug, genre_id || null, summary || null, content, coverImage, article.id);

    res.redirect('/admin');
  }
);

// Delete article
router.delete('/articles/:id', (req, res) => {
  const article = db.prepare('SELECT * FROM articles WHERE id = ?').get(req.params.id);
  if (article) {
    if (article.cover_image) {
      const oldPath = path.join(__dirname, '..', 'public', article.cover_image);
      fs.unlink(oldPath, () => {});
    }
    db.prepare('DELETE FROM articles WHERE id = ?').run(article.id);
  }
  res.redirect('/admin');
});

// Delete a comment (admin moderation)
router.delete('/comments/:id', (req, res) => {
  const comment = db.prepare('SELECT * FROM comments WHERE id = ?').get(req.params.id);
  if (comment) {
    db.prepare('DELETE FROM comments WHERE id = ?').run(comment.id);
    return res.redirect(`/admin/articles/${comment.article_id}/edit`);
  }
  res.redirect('/admin');
});

// Genre management
router.get('/genres', (req, res) => {
  const genres = db.prepare('SELECT * FROM genres ORDER BY name ASC').all();
  res.render('admin/genres', { genres, error: null });
});

router.post('/genres', body('name').trim().isLength({ min: 1, max: 60 }), (req, res) => {
  const errors = validationResult(req);
  const genres = db.prepare('SELECT * FROM genres ORDER BY name ASC').all();
  if (!errors.isEmpty()) {
    return res.status(400).render('admin/genres', { genres, error: 'Genre name is required (max 60 characters).' });
  }
  const { name } = req.body;
  const slug = slugify(name);
  try {
    db.prepare('INSERT INTO genres (name, slug) VALUES (?, ?)').run(name, slug);
    res.redirect('/admin/genres');
  } catch (err) {
    res.status(400).render('admin/genres', { genres, error: 'That genre already exists.' });
  }
});

router.delete('/genres/:id', (req, res) => {
  db.prepare('DELETE FROM genres WHERE id = ?').run(req.params.id);
  res.redirect('/admin/genres');
});

module.exports = router;
