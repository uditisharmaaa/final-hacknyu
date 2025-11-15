# Booking Dashboard

A beautiful, data-rich dashboard for managing bookings, customers, services, and campaigns. Built with React, Vite, Tailwind CSS, and Supabase.

## Features

- 📊 **Real-time Analytics**: Live dashboard with comprehensive insights
- 💰 **Revenue Tracking**: Monthly revenue trends and total revenue display
- 📅 **Booking Management**: View bookings by status, channel, and recent activity
- 👥 **Customer Insights**: Customer demographics and statistics
- 🎯 **Service Analytics**: Top services and booking metrics
- 🎨 **Beautiful UI**: Modern, responsive design with Tailwind CSS
- 📈 **Interactive Charts**: Visual data representation using Recharts

## Prerequisites

- Node.js (v18 or higher)
- npm or yarn
- Supabase account and project
- PostgreSQL database with the schema set up

## Database Setup

1. Go to your Supabase project dashboard
2. Navigate to SQL Editor
3. Run the following SQL script to create the necessary tables:

```sql
-- 1) ENUM TYPES (optional but nice for consistency)
CREATE TYPE booking_status AS ENUM ('booked', 'cancelled', 'no_show', 'completed');
CREATE TYPE booking_channel AS ENUM ('phone', 'web', 'manual');
CREATE TYPE campaign_type AS ENUM ('percentage', 'fixed');

-- 2) TABLES

-- Customers
CREATE TABLE customers (
    id                  BIGSERIAL PRIMARY KEY,
    name                TEXT NOT NULL,
    phone               TEXT,
    email               TEXT,
    gender              TEXT,
    age                 INT,
    preferred_language  TEXT,
    company_name        TEXT,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Services
CREATE TABLE services (
    id                        BIGSERIAL PRIMARY KEY,
    name                      TEXT NOT NULL,
    default_duration_minutes  INT NOT NULL,
    suggested_repeat_days     INT,
    price                     NUMERIC(10,2) NOT NULL,
    created_at                TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Bookings
CREATE TABLE bookings (
    id           BIGSERIAL PRIMARY KEY,
    customer_id  BIGINT NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
    service_id   BIGINT NOT NULL REFERENCES services(id) ON DELETE RESTRICT,
    start_time   TIMESTAMPTZ NOT NULL,
    end_time     TIMESTAMPTZ NOT NULL,
    channel      booking_channel NOT NULL DEFAULT 'phone',
    status       booking_status NOT NULL DEFAULT 'booked',
    created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Campaigns / Discounts
CREATE TABLE campaigns (
    id                 BIGSERIAL PRIMARY KEY,
    name               TEXT NOT NULL,
    type               campaign_type NOT NULL,
    value              NUMERIC(10,2) NOT NULL,
    trigger_condition  TEXT,
    created_at         TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

4. Make sure Row Level Security (RLS) is configured appropriately for your use case.

## Frontend Setup

1. Navigate to the frontend directory:
```bash
cd frontend
```

2. Install dependencies:
```bash
npm install
```

3. Create a `.env` file in the `frontend` directory:
```bash
cp .env.example .env
```

4. Update the `.env` file with your Supabase credentials:
```env
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

You can find these values in your Supabase project settings:
- Go to Project Settings > API
- Copy the Project URL and anon/public key

5. Start the development server:
```bash
npm run dev
```

The dashboard will be available at `http://localhost:5173`

## Backend Setup (Optional)

The backend is set up with Express.js. If you need to run it:

1. Navigate to the backend directory:
```bash
cd backend
```

2. Install dependencies:
```bash
npm install
```

3. Create a `.env` file with your configuration

4. Start the server:
```bash
node index.js
```

## Dashboard Features

### Statistics Cards
- **Total Revenue**: Sum of all completed bookings
- **Total Customers**: Count of all customers
- **Total Bookings**: Count of all bookings
- **Today's Bookings**: Count of bookings scheduled for today

### Charts and Visualizations
- **Monthly Revenue Trend**: Line chart showing revenue over the last 6 months
- **Bookings by Status**: Pie chart showing distribution of booking statuses
- **Bookings by Channel**: Bar chart showing booking channels (phone, web, manual)
- **Customer Demographics**: Pie chart showing gender distribution
- **Top Services**: List of most booked services
- **Recent Bookings**: List of the 5 most recent bookings

### Additional Stats
- Active Services count
- Active Campaigns count
- Recent bookings (last 7 days)

## Project Structure

```
final-hacknyu/
├── frontend/
│   ├── src/
│   │   ├── components/      # React components
│   │   │   ├── StatCard.jsx
│   │   │   ├── RevenueChart.jsx
│   │   │   ├── BookingStatusChart.jsx
│   │   │   ├── ChannelChart.jsx
│   │   │   ├── TopServices.jsx
│   │   │   ├── GenderChart.jsx
│   │   │   └── RecentBookings.jsx
│   │   ├── lib/
│   │   │   └── supabase.js  # Supabase client configuration
│   │   ├── services/
│   │   │   └── dataService.js  # Data fetching functions
│   │   ├── App.jsx          # Main dashboard component
│   │   └── main.jsx         # Entry point
│   ├── .env.example         # Environment variables template
│   └── package.json
├── backend/
│   ├── index.js
│   └── package.json
└── README.md
```

## Technologies Used

- **React 19**: UI library
- **Vite**: Build tool and dev server
- **Tailwind CSS**: Utility-first CSS framework
- **Supabase**: Backend-as-a-Service (database and API)
- **Recharts**: Charting library for React
- **Lucide React**: Icon library
- **date-fns**: Date utility library

## Troubleshooting

### Dashboard shows "Error Loading Dashboard"
- Check that your `.env` file has the correct Supabase URL and anon key
- Verify that all database tables are created correctly
- Check browser console for specific error messages
- Ensure Row Level Security policies allow read access (or disable RLS for development)

### No data showing
- Make sure you have inserted some sample data into your Supabase tables
- Check that the foreign key relationships are correct
- Verify that the table and column names match exactly

### Charts not rendering
- Ensure all dependencies are installed: `npm install`
- Check browser console for errors
- Verify that Recharts is properly installed

## Sample Data

To test the dashboard, you can insert sample data:

```sql
-- Insert sample customers
INSERT INTO customers (name, phone, email, gender, age) VALUES
('John Doe', '+1234567890', 'john@example.com', 'Male', 30),
('Jane Smith', '+1234567891', 'jane@example.com', 'Female', 25);

-- Insert sample services
INSERT INTO services (name, default_duration_minutes, price, suggested_repeat_days) VALUES
('Haircut', 30, 49.99, 42),
('Facial', 60, 79.99, 30);

-- Insert sample bookings
INSERT INTO bookings (customer_id, service_id, start_time, end_time, channel, status) VALUES
(1, 1, NOW() + INTERVAL '1 day', NOW() + INTERVAL '1 day 30 minutes', 'web', 'booked'),
(2, 2, NOW() + INTERVAL '2 days', NOW() + INTERVAL '2 days 1 hour', 'phone', 'booked');
```

## License

ISC

## Author

Built for HackNYU 2024
