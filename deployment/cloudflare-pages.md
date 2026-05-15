# Cloudflare Pages Deployment Guide

This document describes how to publish the current Southern Machinery Product Asset Center to GitHub and Cloudflare Pages.

## 1. Create a GitHub repository

1. Sign in to GitHub.
2. Create a new repository.
3. Suggested repository name:
   `southern-machinery-product-asset-center`
4. Keep the repository private or public based on your release plan.
5. Do not initialize it with extra template files if the current project folder already contains the source files.

## 2. Push the current project to GitHub

Run these commands in the project root after Git is available in your environment:

```bash
git init
git add .
git commit -m "Initial frontend template and product asset data"
git branch -M main
git remote add origin <your-github-repo-url>
git push -u origin main
```

If the repository already exists locally, only use the commands that are still needed.

## 3. Connect GitHub to Cloudflare Pages

1. Sign in to Cloudflare Dashboard.
2. Open `Workers & Pages`.
3. Click `Create application`.
4. Choose `Pages`.
5. Choose `Connect to Git`.
6. Authorize GitHub access if Cloudflare asks for it.
7. Select the GitHub repository for this project.
8. Select the production branch:
   `main`

## 4. Build settings for Cloudflare Pages

Use these values:

- Framework preset:
  `Vite`
- Build command:
  `npm run build`
- Output directory:
  `dist`
- Root directory:
  leave empty if the project is stored at the repository root

The current `package.json` already includes these scripts:

- `dev`
- `build`
- `preview`

The current Vite setup uses the default build output folder, which is `dist`.

## 5. Deploy and access the site

After saving the Pages project:

1. Cloudflare Pages will install dependencies.
2. Cloudflare Pages will run:
   `npm run build`
3. The built files from `dist` will be published.
4. Cloudflare will provide a default site URL such as:
   `https://<project-name>.pages.dev`

You can later attach a custom domain from the Pages project settings.

## 6. Update product_assets.json and redeploy

The frontend reads:

`public/data/product_assets.json`

When this file is updated:

1. Commit the updated file to GitHub.
2. Push the change to the tracked branch.
3. Cloudflare Pages will automatically trigger a new deployment for that branch.

Typical update flow:

```bash
git add public/data/product_assets.json
git commit -m "Update product asset data"
git push
```

If the production branch is `main`, pushing to `main` will trigger a production redeploy.

## 7. Recommended pre-deploy checks

Before first deployment, run these checks locally when npm is available:

```bash
npm install
npm run build
```

Also confirm:

- `public/data/product_assets.json` is present
- there are no broken relative asset paths
- unknown_model records are intentionally visible and labeled for manual review
- no private credentials or internal notes are stored in public JSON

## 8. Deployment result

After deployment, the site should:

- open from the Cloudflare Pages URL
- load product data from `/data/product_assets.json`
- render list, search, filters, and detail panel correctly
- keep `Needs Manual Review` visible for `unknown_model` records
