import { supabase } from '../lib/supabase'

// Fetch customers for a specific business
export async function getCustomers(businessId) {
  if (!businessId) return []
  
  const { data, error } = await supabase
    .from('customers')
    .select('*')
    .eq('business_id', businessId)
    .order('created_at', { ascending: false })
  
  if (error) throw error
  return data || []
}

// Fetch services for a specific business
export async function getServices(businessId) {
  if (!businessId) return []
  
  const { data, error } = await supabase
    .from('services')
    .select('*')
    .eq('business_id', businessId)
    .order('created_at', { ascending: false })
  
  if (error) throw error
  return data || []
}

// Fetch bookings for a specific business with related data
export async function getBookings(businessId) {
  if (!businessId) return []
  
  const { data: bookingsData, error: bookingsError } = await supabase
    .from('bookings')
    .select('*')
    .eq('business_id', businessId)
    .order('start_time', { ascending: false })
  
  if (bookingsError) throw bookingsError

  if (!bookingsData || bookingsData.length === 0) {
    return []
  }

  // Fetch related customer and service data
  const customerIds = [...new Set(bookingsData.map(b => b.customer_id))]
  const serviceIds = [...new Set(bookingsData.map(b => b.service_id))]

  const { data: customersData } = await supabase
    .from('customers')
    .select('*')
    .in('id', customerIds)
    .eq('business_id', businessId)

  const { data: servicesData } = await supabase
    .from('services')
    .select('*')
    .in('id', serviceIds)
    .eq('business_id', businessId)

  // Map related data to bookings
  const customersMap = new Map(customersData?.map(c => [c.id, c]) || [])
  const servicesMap = new Map(servicesData?.map(s => [s.id, s]) || [])

  return bookingsData.map(booking => ({
    ...booking,
    customers: customersMap.get(booking.customer_id),
    services: servicesMap.get(booking.service_id)
  })) || []
}

// Fetch campaigns for a specific business
export async function getCampaigns(businessId) {
  if (!businessId) return []
  
  const { data, error } = await supabase
    .from('campaigns')
    .select('*')
    .eq('business_id', businessId)
    .order('created_at', { ascending: false })
  
  if (error) throw error
  return data || []
}

// Get dashboard statistics for a specific business
export async function getDashboardStats(businessId) {
  if (!businessId) {
    return {
      customers: 0,
      services: 0,
      bookings: 0,
      campaigns: 0,
      revenue: '0.00',
      recentBookings: 0,
      todayBookings: 0,
      bookingsByStatus: {},
      bookingsByChannel: {},
      monthlyRevenue: {},
      topServices: [],
      genderDistribution: {}
    }
  }

  const [customers, services, bookings, campaigns] = await Promise.all([
    getCustomers(businessId),
    getServices(businessId),
    getBookings(businessId),
    getCampaigns(businessId)
  ])

  // Calculate revenue from completed bookings
  const completedBookings = bookings.filter(b => b.status === 'completed')
  const revenue = completedBookings.reduce((sum, booking) => {
    const service = booking.services
    return sum + (service?.price || 0)
  }, 0)

  // Bookings by status
  const bookingsByStatus = bookings.reduce((acc, booking) => {
    acc[booking.status] = (acc[booking.status] || 0) + 1
    return acc
  }, {})

  // Bookings by channel
  const bookingsByChannel = bookings.reduce((acc, booking) => {
    acc[booking.channel] = (acc[booking.channel] || 0) + 1
    return acc
  }, {})

  // Recent bookings (last 7 days)
  const sevenDaysAgo = new Date()
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)
  const recentBookings = bookings.filter(
    booking => new Date(booking.start_time) >= sevenDaysAgo
  )

  // Today's bookings
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const todayBookings = bookings.filter(
    booking => {
      const bookingDate = new Date(booking.start_time)
      bookingDate.setHours(0, 0, 0, 0)
      return bookingDate.getTime() === today.getTime() && booking.status !== 'cancelled'
    }
  )

  // Revenue by month (last 6 months)
  const monthlyRevenue = {}
  const now = new Date()
  for (let i = 5; i >= 0; i--) {
    const monthDate = new Date(now.getFullYear(), now.getMonth() - i, 1)
    const monthKey = monthDate.toLocaleString('default', { month: 'short', year: 'numeric' })
    monthlyRevenue[monthKey] = 0
  }

  completedBookings.forEach(booking => {
    const bookingDate = new Date(booking.start_time)
    const monthKey = bookingDate.toLocaleString('default', { month: 'short', year: 'numeric' })
    if (monthlyRevenue[monthKey] !== undefined) {
      monthlyRevenue[monthKey] += booking.services?.price || 0
    }
  })

  // Top services by booking count
  const serviceBookings = {}
  bookings.forEach(booking => {
    const serviceName = booking.services?.name || 'Unknown'
    serviceBookings[serviceName] = (serviceBookings[serviceName] || 0) + 1
  })
  const topServices = Object.entries(serviceBookings)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)

  // Customer demographics
  const genderDistribution = customers.reduce((acc, customer) => {
    const gender = customer.gender || 'Unknown'
    acc[gender] = (acc[gender] || 0) + 1
    return acc
  }, {})

  return {
    customers: customers.length,
    services: services.length,
    bookings: bookings.length,
    campaigns: campaigns.length,
    revenue: revenue.toFixed(2),
    recentBookings: recentBookings.length,
    todayBookings: todayBookings.length,
    bookingsByStatus,
    bookingsByChannel,
    monthlyRevenue,
    topServices,
    genderDistribution
  }
}

// Fetch all businesses (for demo/selection)
export async function getAllBusinesses() {
  const { data, error } = await supabase
    .from('businesses')
    .select('*')
    .order('name', { ascending: true })
  
  if (error) throw error
  return data || []
}