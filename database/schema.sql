-- Booking Dashboard Database Schema
-- Run this script in your Supabase SQL Editor

-- 1) ENUM TYPES (optional but nice for consistency)
CREATE TYPE booking_status AS ENUM ('booked', 'cancelled', 'no_show', 'completed');
CREATE TYPE booking_channel AS ENUM ('phone', 'web', 'manual');
CREATE TYPE campaign_type AS ENUM ('percentage', 'fixed');

--------------------------------------------------
-- 2) TABLES
--------------------------------------------------

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
    name                      TEXT NOT NULL,              -- e.g. "Haircut", "Facial"
    default_duration_minutes  INT NOT NULL,               -- e.g. 60
    suggested_repeat_days     INT,                        -- e.g. 42 days for haircut
    price                     NUMERIC(10,2) NOT NULL,     -- e.g. 49.99
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
    name               TEXT NOT NULL,                     -- e.g. "Monday Madness"
    type               campaign_type NOT NULL,            -- 'percentage' or 'fixed'
    value              NUMERIC(10,2) NOT NULL,            -- 10.00 = 10% or $10 based on type
    trigger_condition  TEXT,                              -- simple string or JSON rule
    created_at         TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Optional: Sample data for testing
-- Uncomment the following to insert sample data

/*
-- Sample Customers
INSERT INTO customers (name, phone, email, gender, age, preferred_language) VALUES
('John Doe', '+1234567890', 'john@example.com', 'Male', 30, 'English'),
('Jane Smith', '+1234567891', 'jane@example.com', 'Female', 25, 'English'),
('Bob Johnson', '+1234567892', 'bob@example.com', 'Male', 35, 'Spanish'),
('Alice Brown', '+1234567893', 'alice@example.com', 'Female', 28, 'English');

-- Sample Services
INSERT INTO services (name, default_duration_minutes, price, suggested_repeat_days) VALUES
('Haircut', 30, 49.99, 42),
('Facial', 60, 79.99, 30),
('Massage', 90, 99.99, 14),
('Manicure', 45, 39.99, 21);

-- Sample Bookings
INSERT INTO bookings (customer_id, service_id, start_time, end_time, channel, status) VALUES
(1, 1, NOW() + INTERVAL '1 day', NOW() + INTERVAL '1 day 30 minutes', 'web', 'booked'),
(2, 2, NOW() + INTERVAL '2 days', NOW() + INTERVAL '2 days 1 hour', 'phone', 'booked'),
(3, 1, NOW() - INTERVAL '5 days', NOW() - INTERVAL '5 days 30 minutes', 'web', 'completed'),
(4, 3, NOW() - INTERVAL '3 days', NOW() - INTERVAL '3 days 1 hour 30 minutes', 'manual', 'completed'),
(1, 4, NOW() - INTERVAL '10 days', NOW() - INTERVAL '10 days 45 minutes', 'web', 'completed'),
(2, 1, NOW() - INTERVAL '7 days', NOW() - INTERVAL '7 days 30 minutes', 'phone', 'completed');

-- Sample Campaigns
INSERT INTO campaigns (name, type, value, trigger_condition) VALUES
('Monday Madness', 'percentage', 10.00, 'day_of_week = Monday'),
('New Customer Discount', 'fixed', 10.00, 'is_new_customer = true'),
('Holiday Special', 'percentage', 15.00, 'month = December');
*/
