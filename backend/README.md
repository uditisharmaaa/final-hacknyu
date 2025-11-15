# Supabase Backend API

Backend server that interfaces with Supabase and performs data computations.

## Features

- 🔌 RESTful API endpoints for Supabase data access
- 📊 Built-in computation endpoints (statistics, aggregations)
- 🔒 Secure server-side Supabase access
- 🚀 Express.js server with CORS support

## Setup

1. **Install dependencies:**
   ```bash
   cd backend
   npm install
   ```

2. **Configure environment variables:**
   - Copy `.env.example` to `.env`
   - Add your Supabase credentials:
     ```
     SUPABASE_URL=https://your-project.supabase.co
     SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
     PORT=3001
     ```

3. **Start the server:**
   ```bash
   npm run dev    # Development mode with auto-reload
   # or
   npm start      # Production mode
   ```

The server will run on `http://localhost:3001`

## API Endpoints

### Health Check
- `GET /health` - Check if server is running

### Data Endpoints
- `GET /api/data/:tableName` - Get all data from a table
  - Query params: `limit` (default: 100), `offset` (default: 0)
- `GET /api/data/:tableName/columns?columns=col1,col2` - Get specific columns

### Computation Endpoints
- `GET /api/compute/stats/:tableName` - Get statistics for a table
- `POST /api/compute/aggregate/:tableName` - Aggregate data by a column
  - Body: `{ groupBy: "column1", aggregateColumn: "column2", operation: "sum" }`
  - Operations: `sum`, `avg`, `min`, `max`, `count`
- `POST /api/compute/custom/:tableName` - Custom computations
  - Body: `{ computation: "total_rows" }`

## Example Usage

```bash
# Get all users
curl http://localhost:3001/api/data/users

# Get statistics
curl http://localhost:3001/api/compute/stats/users

# Aggregate data
curl -X POST http://localhost:3001/api/compute/aggregate/orders \
  -H "Content-Type: application/json" \
  -d '{"groupBy": "user_id", "aggregateColumn": "amount", "operation": "sum"}'
```

## Project Structure

```
backend/
├── src/
│   ├── routes/
│   │   ├── data.js           # Data fetching endpoints
│   │   └── computations.js   # Computation endpoints
│   ├── services/
│   │   └── supabase.js       # Supabase client setup
│   └── server.js             # Express server setup
├── .env                      # Environment variables
├── package.json
└── README.md
```

