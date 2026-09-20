const express = require('express');
const { body, validationResult } = require('express-validator');
const db = require('../db');

const router = express.Router();

// Home page - list all articles, optionally filtered by genre
router.get('/', (req, res) => {
  const { genre } = req.query;
  let articles;

  if (genre) {
    articles = db.prepare(`
      SELECT articles.*, genres.name AS genre_name, genres.slug AS genre_slug
      FROM articles
      LEFT JOIN genres ON genres.id = articles.genre_id
      WHERE genres.slug = ?
      ORDER BY articles.created_at DESC
    `).all(genre);
  } else {
    articles = db.prepare(`
      SELECT articles.*, genres.name AS genre_name, genres.slug AS genre_slug
      FROM articles
      LEFT JOIN genres ON genres.id = articles.genre_id
      ORDER BY articles.created_at DESC
    `).all();
  }

  const activeGenre = genre || null;
  res.render('index', { articles, activeGenre });
});

// Single article view + comments
router.get('/article/:slug', (req, res) => {
  const article = db.prepare(`
    SELECT articles.*, genres.name AS genre_name, genres.slug AS genre_slug
    FROM articles
    LEFT JOIN genres ON genres.id = articles.genre_id
    WHERE articles.slug = ?
  `).get(req.params.slug);

  if (!article) return res.status(404).render('404');

  const comments = db.prepare('SELECT * FROM comments WHERE article_id = ? ORDER BY created_at ASC').all(article.id);
  res.render('article', { article, comments, errors: [], formData: {} });
});

// Post a comment (public, no login needed)
router.post('/article/:slug/comments',
  body('author_name').trim().isLength({ min: 1, max: 80 }).withMessage('Please enter your name (max 80 characters).'),
  body('body').trim().isLength({ min: 1, max: 2000 }).withMessage('Comment cannot be empty (max 2000 characters).'),
  (req, res) => {
    const article = db.prepare(`
      SELECT articles.*, genres.name AS genre_name, genres.slug AS genre_slug
      FROM articles LEFT JOIN genres ON genres.id = articles.genre_id
      WHERE articles.slug = ?
    `).get(req.params.slug);

    if (!article) return res.status(404).render('404');

    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      const comments = db.prepare('SELECT * FROM comments WHERE article_id = ? ORDER BY created_at ASC').all(article.id);
      return res.status(400).render('article', {
        article,
        comments,
        errors: errors.array(),
        formData: req.body
      });
    }

    const { author_name, body: commentBody } = req.body;
    db.prepare('INSERT INTO comments (article_id, author_name, body) VALUES (?, ?, ?)')
      .run(article.id, author_name, commentBody);

    res.redirect(`/article/${article.slug}#comments`);
  }
);

module.exports = router;
