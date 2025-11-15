# Quick Setup Guide

Follow these steps to get your dashboard running:

## 1. Database Setup (Supabase)

1. Go to your Supabase project dashboard
2. Navigate to **SQL Editor**
3. Copy and paste the contents of `database/schema.sql`
4. Click **Run** to create all tables and types

## 2. Get Your Supabase Credentials

1. In Supabase, go to **Settings** → **API**
2. Copy your **Project URL**
3. Copy your **anon/public** key

## 3. Frontend Setup

1. Navigate to the frontend directory:
   ```bash
   cd frontend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Create a `.env` file:
   ```bash
   # Create .env file
   touch .env
   ```

4. Add your Supabase credentials to `.env`:
   ```env
   VITE_SUPABASE_URL=your_project_url_here
   VITE_SUPABASE_ANON_KEY=your_anon_key_here
   ```

5. Start the development server:
   ```bash
   npm run dev
   ```

6. Open your browser to `http://localhost:5173`

## 4. (Optional) Add Sample Data

If you want to see the dashboard with sample data:

1. Go to Supabase SQL Editor
2. Uncomment the sample data section in `database/schema.sql`
3. Run that section only

Or insert data manually through the Supabase dashboard.

## Troubleshooting

### "Missing Supabase environment variables" error
- Make sure your `.env` file is in the `frontend` directory
- Check that the variable names start with `VITE_`
- Restart the dev server after creating/updating `.env`

### Dashboard shows no data
- Verify tables are created in Supabase
- Check that Row Level Security (RLS) allows read access
- For development, you can temporarily disable RLS on tables

### Charts not rendering
- Open browser console to check for errors
- Verify all dependencies are installed: `npm install`
- Make sure you have some data in your tables

## Next Steps

- Customize the dashboard components in `frontend/src/components/`
- Add more charts and insights in `frontend/src/App.jsx`
- Modify the data fetching logic in `frontend/src/services/dataService.js`

Happy coding! 🚀
