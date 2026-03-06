# space chainsaw

Static blog generator with Markdown posts, draft filtering, categories, reading-time metadata, and RSS.

## Local Development

- Install dependencies: `npm install`
- Run dev mode (watch + local server): `npm run dev`
- Build static output into `docs/`: `npm run build`

## Publishing to GitHub Pages

1. Push this repository to GitHub.
2. In GitHub: **Settings → Pages → Build and deployment**.
3. Set **Source** to **GitHub Actions**.
4. Ensure the workflow file `.github/workflows/deploy-pages.yml` is on `main`.
5. Push to `main`; GitHub Actions will build and deploy from `docs/`.

## Custom Domain (`spacechainsaw.blog`)

1. Add your domain under **Settings → Pages → Custom domain**.
2. Keep the generated `docs/CNAME` file in the repo/build output.
3. Configure DNS:
   - Root/apex domain: use GitHub Pages A records (or ALIAS/ANAME to `<username>.github.io` if your DNS provider supports it).
   - Optional `www`: `CNAME` to `<username>.github.io`.
4. After DNS propagates, enable **Enforce HTTPS** in GitHub Pages.

## RSS

- Feed URL: `https://spacechainsaw.blog/rss.xml`
- Footer RSS subscribe link is included on all pages.
