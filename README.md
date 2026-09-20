# The Humanist Thoughts

A personal blog for publishing articles on contemporary socio-political issues, with admin-only publishing and public commenting.

## Features

- **Admin-only publishing**: only the logged-in admin can create, edit, and delete articles.
- **Public sharing & comments**: anyone with a link can read an article and leave a comment; the public cannot edit or delete articles.
- **Genre sidebar**: articles can be grouped into genres (Politics, Society, Economy, Human Rights, Environment, Opinion, or your own), shown as a left-side navigation tab.
- **Sober, serious visual design**: muted earth-tone palette, serif typography — intentionally understated to suit weighty subject matter.
- **Cover images**: optional image upload per article.

## Requirements

- Node.js 22.5+ (uses the built-in `node:sqlite` module — no external database server or native build tools required).

## First-time setup

```
npm install
npm run init-admin
```

`npm run init-admin` will prompt you to choose an admin username and password (this is your only login — the blog has a single admin, as specified).

## Running the blog

```
npm start
```

Then open http://localhost:3000 in your browser.

- Visit `/login` to sign in as admin.
- Once logged in, use **Admin Dashboard** in the top nav to create, edit, or delete articles, and **Manage Genres** to add/remove genre categories.
- Log out via the **Logout** link in the top nav.

## Notes on configuration

- `.env` holds `SESSION_SECRET` and `PORT`. **Change `SESSION_SECRET` to a long random string before making the site public.**
- The SQLite database file lives at `data/blog.db`; uploaded cover images are stored in `public/uploads/`. Back these up periodically.
- Admin sessions are kept in memory, so restarting the server will require logging in again.

## Deploying so others can view your articles

Running `npm start` only serves the blog on your own machine (`localhost`). To let others open your article links, host it on a small server or platform that runs Node.js (e.g. a VPS, Render, Railway, or similar), set `SESSION_SECRET` there, and run `npm install && npm start` on that host.
