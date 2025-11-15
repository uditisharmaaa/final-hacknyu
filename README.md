# Supabase Dashboard with Backend API

A full-stack application with a React frontend and Node.js backend that interfaces with Supabase.

## Quick Start

### First Time Setup

1. **Install all dependencies:**
   ```bash
   npm run install:all
   ```
   This installs dependencies for the root, backend, and frontend.

2. **Set up Backend environment:**
   Create a `.env` file in the `backend` folder:
   ```env
   SUPABASE_URL=https://your-project.supabase.co
   SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
   PORT=3001
   ```
   
   **Where to find these:**
   - Go to your Supabase project dashboard
   - Settings → API
   - Copy the "Project URL" for `SUPABASE_URL`
   - Copy the "service_role" key (secret) for `SUPABASE_SERVICE_ROLE_KEY`

3. **(Optional) Set up Frontend environment:**
   Create a `.env` file in the `frontend` folder if you want to customize the API URL:
   ```env
   VITE_API_URL=http://localhost:3001
   ```
   (This is the default, so you can skip this step)

### Running the Application

**Just one command to run everything:**
```bash
npm run dev
```

This starts both the backend (port 3001) and frontend (port 5173) servers simultaneously!

Open your browser and go to: `http://localhost:5173`

### Individual Server Commands

If you need to run servers separately:

**Backend only:**
```bash
npm run dev:backend
```

**Frontend only:**
```bash
npm run dev:frontend
```

## Project Structure

```
final-hacknyu/
├── package.json      # Root package.json with dev scripts
├── backend/          # Node.js/Express API server
│   ├── src/
│   │   ├── routes/   # API endpoints
│   │   ├── services/ # Supabase client
│   │   └── server.js
│   └── .env          # Backend environment variables
│
└── frontend/         # React dashboard
    ├── src/
    │   ├── components/
    │   └── lib/
    └── .env          # Frontend environment variables (optional)
```

## Troubleshooting

### Backend won't start
- Make sure you created the `.env` file in the `backend` folder
- Check that your Supabase credentials are correct
- Ensure port 3001 is not already in use

### Frontend shows connection error
- Make sure the backend is running on `http://localhost:3001`
- Check the browser console for specific error messages
- Verify the backend health check: `http://localhost:3001/health`

### Blank page
- Check browser console for errors
- Make sure both servers are running
- Try refreshing the page

## API Endpoints

Once the backend is running, you can test it:

- Health check: `http://localhost:3001/health`
- Get table data: `http://localhost:3001/api/data/users`
- Get statistics: `http://localhost:3001/api/compute/stats/users`

## Next Steps

1. Enter a table name in the dashboard (e.g., "users")
2. Click "Refresh" to load data
3. Click "Stats" to see statistics about the table

