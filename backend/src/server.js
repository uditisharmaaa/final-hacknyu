import express from 'express'
import cors from 'cors'
import dotenv from 'dotenv'
import dataRoutes from './routes/data.js'
import computationRoutes from './routes/computations.js'

dotenv.config()

const app = express()
const PORT = process.env.PORT || 3001

// Middleware
app.use(cors())
app.use(express.json())

// Routes
app.use('/api/data', dataRoutes)
app.use('/api/compute', computationRoutes)

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'ok', message: 'Backend server is running' })
})

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Backend server running on http://localhost:${PORT}`)
  console.log(`📊 Health check: http://localhost:${PORT}/health`)
})

