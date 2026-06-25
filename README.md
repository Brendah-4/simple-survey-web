# simple-survey-web

Admin and public web interface for the Simple Survey platform — built with **React**, **Vite**, and **Tailwind CSS**.

## Prerequisites

- Node.js v18 or higher
- npm
- A running instance of simple-survey-api

## Technologies Used

- React 18
- Vite
- Tailwind CSS
- React Router DOM

## Pages

| Route | Description |
|-------|-------------|
| `/` | Dashboard with survey stats |
| `/surveys` | Manage surveys (create, edit, delete) |
| `/surveys/:id/form` | Public survey form (step-by-step with review page) |
| `/questions` | Manage questions per survey |
| `/responses` | View responses with pagination and email filter |

## Getting Started

```bash
git clone https://github.com/simonmwangiwaweru/simple-survey-web.git
cd simple-survey-web
npm install
npm run dev
```

The dev server proxies `/api` requests to the live Railway API automatically.

## Features

- Step-by-step survey form with progress bar
- **Review page** before final submission
- Supports all question types: text, textarea, email, multiple_choice, checkbox, rating, file
- Response list with **pagination** and **email filter**
- File/certificate download links
- Fully responsive Tailwind UI

## Build

```bash
npm run build
```

Output in `dist/` — deploy to any static host (Netlify, Vercel, Render, etc).

## API

Connects to: `https://simple-survey-api-production.up.railway.app`

Proxy configured in `vite.config.js` for local development.

## Assumptions Made

- No authentication is implemented. The admin pages are accessible to anyone with the URL, as the spec did not require login functionality.
- "Active" in the UI maps to `published` in the database to match the existing schema.
- Only surveys with status `published` appear on the Available Surveys page.
- The web app is installable as a PWA from Chrome on Android as an alternative to the native APK.
- The web app relies on the live Railway API. It does not function without an internet connection except for previously cached pages.
- A review page is shown before final submission so users can verify all their answers.
