import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'

export default function RevenueChart({ data }) {
  const chartData = Object.entries(data || {}).map(([month, revenue]) => ({
    month,
    revenue: parseFloat(revenue).toFixed(2)
  }))

  return (
    <div className="bg-white rounded-xl shadow-md p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Monthly Revenue Trend</h3>
      <ResponsiveContainer width="100%" height={300}>
        <LineChart data={chartData}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="month" />
          <YAxis />
          <Tooltip formatter={(value) => `$${parseFloat(value).toFixed(2)}`} />
          <Legend />
          <Line 
            type="monotone" 
            dataKey="revenue" 
            stroke="#0ea5e9" 
            strokeWidth={2}
            name="Revenue ($)"
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}
