# Supabase Dashboard

A modern React.js dashboard built with Tailwind CSS that displays data from your Supabase database.

## Features

- 🎨 Beautiful, modern UI with Tailwind CSS
- 📊 View data from any Supabase table
- 🔄 Real-time data fetching
- 📱 Responsive design
- ⚡ Fast and lightweight with Vite

## Prerequisites

- Node.js (v16 or higher)
- npm or yarn
- A Supabase project

## Setup

1. **Navigate to the frontend directory:**
   ```bash
   cd frontend
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Configure Supabase:**
   - Create a `.env` file in the `frontend` directory
   - Get your Supabase URL and anon key from your Supabase project settings
   - Update `.env` with your credentials:
     ```
     VITE_SUPABASE_URL=https://your-project.supabase.co
     VITE_SUPABASE_ANON_KEY=your-anon-key
     ```

4. **Start the development server:**
   ```bash
   npm run dev
   ```

5. **Open your browser:**
   Navigate to `http://localhost:5173`

## Usage

1. Enter the name of a table from your Supabase database in the input field
2. Click "Refresh" or press Enter to load the data
3. View your data in a clean, organized table format

## Building for Production

```bash
npm run build
```

The built files will be in the `dist` directory.

## Project Structure

```
frontend/
├── src/
│   ├── components/
│   │   └── Dashboard.jsx    # Main dashboard component
│   ├── lib/
│   │   └── supabase.js       # Supabase client configuration
│   ├── App.jsx               # Root component
│   ├── main.jsx              # Entry point
│   └── index.css             # Global styles with Tailwind
├── static/
│   ├── README.md             # Documentation
│   └── .gitignore            # Git ignore rules
├── index.html
├── package.json
├── tailwind.config.js
├── vite.config.js
└── .env                      # Your Supabase credentials (not in git)
```

## Technologies Used

- **React 18** - UI library
- **Vite** - Build tool and dev server
- **Tailwind CSS** - Utility-first CSS framework
- **Supabase** - Backend as a service

## License

MIT

