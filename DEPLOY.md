# Deploy the atlas

This folder is the complete local project. Nothing has been published to GitHub or Vercel.

## Deploy from Terminal

Use Node.js 22 or newer, then run:

```sh
cd /Users/farukdube/Documents/Codex/c-elegans-atlas
npm ci
npm run build:vercel
npx vercel --prod
```

Follow the Vercel prompts to choose your account and create or select a project. The included `vercel.json` specifies the build command and `dist` output directory. No environment variables are required.

## Deploy through GitHub

Push this local repository to your GitHub account, then import it in Vercel. Use the repository root as the Root Directory. Keep the included `vercel.json` settings.

The compressed geometry and neural models are included. The build restores and verifies the uncompressed geometry automatically. Keep `public/` in the repository; generated `dist/` and `node_modules/` are intentionally excluded.

See `README.md` and `docs/` for data sources, attribution, and model limitations.
