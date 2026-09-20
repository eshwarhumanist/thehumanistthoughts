const path = require('path');
const { DatabaseSync } = require('node:sqlite');

const db = new DatabaseSync(path.join(__dirname, 'data', 'blog.db'));
db.exec('PRAGMA journal_mode = WAL;');
db.exec('PRAGMA foreign_keys = ON;');

db.exec(`
CREATE TABLE IF NOT EXISTS admins (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  username TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS genres (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT UNIQUE NOT NULL,
  slug TEXT UNIQUE NOT NULL
);

CREATE TABLE IF NOT EXISTS articles (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  title TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  genre_id INTEGER REFERENCES genres(id) ON DELETE SET NULL,
  summary TEXT,
  body TEXT NOT NULL,
  cover_image TEXT,
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS comments (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  article_id INTEGER NOT NULL REFERENCES articles(id) ON DELETE CASCADE,
  author_name TEXT NOT NULL,
  body TEXT NOT NULL,
  created_at TEXT DEFAULT (datetime('now'))
);
`);

const slugify = (s) => s.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
const defaultGenres = ['Politics', 'Society', 'Economy', 'Human Rights', 'Environment', 'Opinion'];
const insertGenreStmt = db.prepare('INSERT OR IGNORE INTO genres (name, slug) VALUES (?, ?)');
for (const g of defaultGenres) {
  insertGenreStmt.run(g, slugify(g));
}

// Thin wrapper so calling code can keep using the better-sqlite3-style
// db.prepare(sql).run/get/all(...args) API on top of node:sqlite.
module.exports = {
  prepare(sql) {
    const stmt = db.prepare(sql);
    return {
      run: (...args) => stmt.run(...args),
      get: (...args) => stmt.get(...args),
      all: (...args) => stmt.all(...args)
    };
  },
  exec(sql) {
    return db.exec(sql);
  }
};
