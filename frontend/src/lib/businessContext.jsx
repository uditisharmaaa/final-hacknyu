import { useState, useEffect, createContext, useContext } from 'react'
import { supabase } from './supabase'

const BusinessContext = createContext(null)

export function BusinessProvider({ children }) {
  const [currentBusiness, setCurrentBusiness] = useState(null)
  const [businesses, setBusinesses] = useState([])
  const [loading, setLoading] = useState(true)
  const [user, setUser] = useState(null)

  useEffect(() => {
    // Check for authenticated user
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        setUser(session.user)
        loadBusiness(session.user.id)
      } else {
        // For demo: if no auth, use first business (Luna Hair Studio)
        loadAllBusinesses()
      }
    })

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        setUser(session.user)
        loadBusiness(session.user.id)
      } else {
        loadAllBusinesses()
      }
    })

    return () => subscription.unsubscribe()
  }, [])

  async function loadBusiness(authUserId) {
    try {
      const { data, error } = await supabase
        .from('businesses')
        .select('*')
        .eq('auth_user_id', authUserId)
        .single()

      if (error && error.code !== 'PGRST116') {
        throw error
      }

      if (data) {
        setCurrentBusiness(data)
      } else {
        // User exists but no business, load all for demo
        loadAllBusinesses()
      }
    } catch (err) {
      console.error('Error loading business:', err)
      loadAllBusinesses()
    } finally {
      setLoading(false)
    }
  }

  async function loadAllBusinesses() {
    try {
      const { data, error } = await supabase
        .from('businesses')
        .select('*')
        .order('name', { ascending: true })

      if (error) throw error

      if (data && data.length > 0) {
        setBusinesses(data)
        // Default to first business for demo (Luna Hair Studio)
        setCurrentBusiness(prev => prev || data[0])
      }
    } catch (err) {
      console.error('Error loading businesses:', err)
    } finally {
      setLoading(false)
    }
  }

  function switchBusiness(businessId) {
    const business = businesses.find(b => b.id === businessId)
    if (business) {
      setCurrentBusiness(business)
    } else {
      // If not in current list, try fetching it
      supabase
        .from('businesses')
        .select('*')
        .eq('id', businessId)
        .single()
        .then(({ data, error }) => {
          if (!error && data) {
            setCurrentBusiness(data)
            // Add to businesses list if not already there
            if (!businesses.find(b => b.id === data.id)) {
              setBusinesses([...businesses, data])
            }
          }
        })
    }
  }

  return (
    <BusinessContext.Provider value={{
      currentBusiness,
      businesses,
      user,
      loading,
      switchBusiness
    }}>
      {children}
    </BusinessContext.Provider>
  )
}

export function useBusiness() {
  const context = useContext(BusinessContext)
  if (!context) {
    throw new Error('useBusiness must be used within BusinessProvider')
  }
  return context
}

