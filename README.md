# Carles Meatland & Farms Management System

A deployable full-stack farm management web app with a professional responsive frontend, branded logo assets, a Node/Express backend, PostgreSQL schema, JWT authentication and PWA files.

## What is included

```text
backend/
  server.js
  setup-db.sql
  package.json
  .env.example
  middleware/auth.js
  routes/auth.js
  routes/animals.js
  routes/feed.js
  routes/medications.js
  routes/breeding.js
  routes/finance.js
  routes/users.js
  routes/reports.js

frontend/
  index.html
  manifest.webmanifest
  sw.js
  assets/
    logo-full.svg
    logo-mark.svg
    logo-wordmark.svg
    favicon.svg
    login-hero.svg
  icons/
    icon-192.png
    icon-512.png
    apple-touch-icon.png
  src/
    app.jsx
    data.js
    brand.jsx
    ui.jsx
    charts.jsx
    styles.css
    screens/*.jsx
```

## Design updates in this version

- Clean Carles Meatland & Farms logo system using scalable SVG files.
- Professional login page with farm illustration, visible typography and mobile-friendly form fields.
- Responsive dashboard and all screens designed for phone, tablet and desktop.
- Large 50px touch targets, readable Poppins/system fonts, card layouts and branded colors.
- Mobile bottom navigation plus full slide-out menu so users do not need to pinch or zoom.

## Backend deployment on Railway

1. Create or open your Railway project.
2. Add/confirm PostgreSQL is attached.
3. Deploy the `backend` folder as the Node.js service.
4. Set environment variables:

```env
DATABASE_URL=provided-by-railway
JWT_SECRET=replace-with-a-long-random-secret
NODE_ENV=production
FRONTEND_URL=https://your-netlify-site.netlify.app
PORT=8080
```

5. Run the SQL in `backend/setup-db.sql` inside Railway PostgreSQL Query tab.
6. Confirm the health endpoint works:

```text
https://your-railway-backend.up.railway.app/health
```

## Frontend deployment on Netlify

1. Open `frontend/index.html` and confirm this line points to your Railway backend:

```js
window.CARLES_API_URL = 'https://carles-farm-backend-production.up.railway.app/api';
```

2. Drag and drop the entire `frontend` folder into Netlify, or deploy it from GitHub.
3. In Railway, set `FRONTEND_URL` to the final Netlify site URL to avoid CORS errors.
4. Clear browser cache after replacing an older deployment.

## Default test credentials

```text
Username: admin
PIN: 1234
```

Change the default PIN after first login.

## Testing checklist

- Login works with admin/1234.
- Dashboard loads without console errors.
- Animal list loads from the Railway database.
- Add animal works.
- Add finance transaction works.
- Mobile view opens without horizontal scrolling or pinching.
- PWA icons and favicon appear.
- CORS is configured with your Netlify URL.

## Notes

Only the authentication token and current user are saved in browser localStorage. Farm data is retrieved from the backend API, as required by the project specification.
