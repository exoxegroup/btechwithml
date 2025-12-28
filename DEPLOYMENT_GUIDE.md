# Deployment Guide for Render.com (Free Tier)

This guide walks you through deploying the **BioLearn** application (PostgreSQL, Backend, Frontend) to Render.com using the Free Tier.

## Prerequisites
- GitHub Repository: `https://github.com/exoxegroup/btechwithml.git` (Code is already pushed).
- Render.com Account.

---

## Step 1: Create PostgreSQL Database

1. Log in to your Render Dashboard.
2. Click **New +** -> **PostgreSQL**.
3. **Name**: `biolearn-db` (or any name).
4. **Region**: Choose the one closest to you (e.g., Frankfurt, Singapore, Oregon).
5. **Instance Type**: **Free**.
6. Click **Create Database**.
7. **Wait** for it to be created.
8. Copy the **Internal Database URL**. You will need this for the Backend.

---

## Step 2: Deploy Backend (Web Service)

1. Click **New +** -> **Web Service**.
2. Connect your GitHub repository (`exoxegroup/btechwithml`).
3. Configure the service:
   - **Name**: `biolearn-backend`
   - **Region**: **Same as your Database** (Important!).
   - **Root Directory**: `backend`
   - **Runtime**: **Node**
   - **Build Command**: `npm install && npm run build`
   - **Start Command**: `npm start`
     - *Note*: We configured `npm start` to run `npx prisma migrate deploy && node dist/index.js`. This automatically runs database migrations before starting the server, ensuring your DB is always up-to-date.
   - **Instance Type**: **Free**.
4. **Environment Variables** (Click "Advanced" or "Environment"):
   Add the following keys:
   - `DATABASE_URL`: Paste the **Internal Database URL** from Step 1.
   - `JWT_SECRET`: A long random string (e.g., generate one locally).
   - `GEMINI_API_KEY`: Your Google Gemini API Key.
   - `CLOUDINARY_CLOUD_NAME`: Your Cloudinary Cloud Name.
   - `CLOUDINARY_API_KEY`: Your Cloudinary API Key.
   - `CLOUDINARY_API_SECRET`: Your Cloudinary API Secret.
   - `NODE_ENV`: `production`
   - `FRONTEND_URL`: Leave blank for now (we will update this after deploying Frontend).
5. Click **Create Web Service**.
6. **Wait** for the build and deployment to finish.
   - Check the logs to ensure migrations ran successfully (`No pending migrations` or `Applied X migrations`).
7. Copy the **Service URL** (e.g., `https://biolearn-backend.onrender.com`).

---

## Step 3: Deploy Frontend (Static Site)

1. Click **New +** -> **Static Site**.
2. Connect your GitHub repository (`exoxegroup/btechwithml`).
3. Configure the site:
   - **Name**: `biolearn-frontend`
   - **Root Directory**: `frontend`
   - **Build Command**: `npm install && npm run build`
   - **Publish Directory**: `dist`
4. **Environment Variables**:
   - `VITE_API_URL`: Paste your **Backend Service URL** from Step 2, appended with `/api` (e.g., `https://biolearn-backend.onrender.com/api`).
5. Click **Create Static Site**.
6. **Wait** for the build to finish.
7. Copy the **Site URL** (e.g., `https://biolearn-frontend.onrender.com`).

---

## Step 4: Finalize Configuration

1. Go back to your **Backend Web Service** settings on Render.
2. Go to **Environment**.
3. Update `FRONTEND_URL` with your **Frontend Site URL** (from Step 3).
4. **Save Changes**. Render will automatically restart the backend to apply the change.

## Troubleshooting

- **Build Failures**: Check the logs. If you see memory errors (Free tier has 512MB RAM), try to keep dependencies minimal.
- **Database Connection**: Ensure `DATABASE_URL` is the **Internal** one (starts with `postgres://...` and usually ends with `.render.internal`). The External one fails within the Render network sometimes due to SSL/latency on free tier.
- **CORS Errors**: If you see CORS errors in the browser console, double-check that `FRONTEND_URL` in Backend Env Vars matches exactly the URL you are visiting (no trailing slash usually, or strict match depending on code).
