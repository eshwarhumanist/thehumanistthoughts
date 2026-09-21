# The Humanist Thoughts

A personal, static blog for publishing articles on contemporary socio-political issues. Built with [Eleventy](https://www.11ty.dev/) and hosted for free on GitHub Pages.

## How this works

- Every article is a plain text file (Markdown) in `src/articles/`.
- Running the build turns those files into a full website in `_site/`.
- Pushing to GitHub automatically rebuilds and republishes the site via GitHub Actions — no server to run, no database, free forever.
- There is no login or admin dashboard: since only you have push access to the GitHub repository, you are effectively the only one who can publish, edit, or remove articles. The public can only read.

## Publishing a new article

```
npm run new-article
```

This asks for a title, genre, and short summary, then creates a new Markdown file for you in `src/articles/`. Open that file and write the article body in Markdown below the existing front matter. Then:

```
npm run build
git add .
git commit -m "Add article: <title>"
git push
```

A minute or two after pushing, the live site updates automatically.

## Genres

The sidebar genre list lives in `src/_data/genres.js`. Add, remove, or rename genres there — just make sure the `genre:` value in each article's front matter matches one of the names in that list exactly, or it won't show up under any sidebar filter.

## Local preview

```
npm install
npm start
```

Opens a local preview at http://localhost:8080 that live-reloads as you edit.

## Design

The color palette, fonts, and layout live in `public/css/style.css` and the templates in `src/_includes/`.
