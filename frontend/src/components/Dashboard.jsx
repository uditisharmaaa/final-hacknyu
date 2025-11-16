import React, { useState, useEffect } from 'react';

const Dashboard = () => {
  const [stats, setStats] = useState({
    totalCalls: 234,
    scheduledAppointments: 89,
    customers: 156,
    demandTrend: 12.5
  });

  const [animate, setAnimate] = useState(false);
  const [hoveredCard, setHoveredCard] = useState(null);

  useEffect(() => {
    setAnimate(true);
    // Animate numbers counting up
    const interval = setInterval(() => {
      setStats(prev => ({
        ...prev,
        totalCalls: Math.min(prev.totalCalls + 3, 234),
      }));
    }, 50);
    setTimeout(() => clearInterval(interval), 2000);
  }, []);

  // Pure SVG Icons
  const PhoneIcon = ({ size = 24, className = "" }) => (
    <svg className={`w-${size/4} h-${size/4} ${className}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
    </svg>
  );

  const CalendarIcon = ({ size = 24, className = "" }) => (
    <svg className={`w-${size/4} h-${size/4} ${className}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
    </svg>
  );

  const UsersIcon = ({ size = 24, className = "" }) => (
    <svg className={`w-${size/4} h-${size/4} ${className}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
    </svg>
  );

  const TrendingUpIcon = ({ size = 20, className = "" }) => (
    <svg className={`w-${size/4} h-${size/4} ${className}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
    </svg>
  );

  const DatabaseIcon = ({ size = 28, className = "" }) => (
    <svg className={`w-${size/4} h-${size/4} ${className}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4m0 5c0 2.21-3.582 4-8 4s-8-1.79-8-4" />
    </svg>
  );

  const MessageIcon = ({ size = 28, className = "" }) => (
    <svg className={`w-${size/4} h-${size/4} ${className}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
    </svg>
  );

  const DollarIcon = ({ size = 28, className = "" }) => (
    <svg className={`w-${size/4} h-${size/4} ${className}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  );

  const TargetIcon = ({ size = 28, className = "" }) => (
    <svg className={`w-${size/4} h-${size/4} ${className}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  );

  const ZapIcon = ({ size = 32, className = "" }) => (
    <svg className={`w-${size/4} h-${size/4} ${className}`} fill="currentColor" viewBox="0 0 24 24">
      <path d="M13 2L3 14h8l-1 8 10-12h-8l1-8z" />
    </svg>
  );

  const SparkleIcon = ({ className = "" }) => (
    <svg className={`w-4 h-4 ${className}`} fill="currentColor" viewBox="0 0 24 24">
      <path d="M12 0l1.5 7.5L21 9l-7.5 1.5L12 18l-1.5-7.5L3 9l7.5-1.5z" />
    </svg>
  );

  const StatCard = ({ icon: Icon, title, value, trend, delay, gradient }) => (
    <div 
      className={`relative overflow-hidden bg-gradient-to-br ${gradient} rounded-2xl shadow-xl p-6 transform transition-all duration-700 ${
        animate ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0'
      } hover:scale-110 hover:shadow-2xl hover:rotate-1 cursor-pointer group`}
      style={{ transitionDelay: `${delay}ms` }}
      onMouseEnter={() => setHoveredCard(title)}
      onMouseLeave={() => setHoveredCard(null)}
    >
      {/* Animated background circles */}
      <div className="absolute top-0 right-0 w-32 h-32 bg-white opacity-10 rounded-full blur-2xl transform translate-x-8 -translate-y-8 group-hover:scale-150 transition-transform duration-700"></div>
      <div className="absolute bottom-0 left-0 w-24 h-24 bg-white opacity-10 rounded-full blur-2xl transform -translate-x-4 translate-y-4 group-hover:scale-150 transition-transform duration-700"></div>
      
      <div className="relative z-10">
        <div className="flex items-center justify-between mb-4">
          <div className="p-3 rounded-xl bg-white bg-opacity-20 backdrop-blur-sm transform group-hover:rotate-12 transition-transform duration-300">
            <Icon size={28} className="text-white" />
          </div>
          {trend && (
            <div className="flex items-center text-white bg-white bg-opacity-20 rounded-lg px-3 py-1 backdrop-blur-sm animate-pulse">
              <TrendingUpIcon size={18} />
              <span className="ml-1 font-bold text-sm">{Math.abs(trend)}%</span>
            </div>
          )}
        </div>
        <h3 className="text-white text-opacity-90 text-sm font-semibold mb-2 uppercase tracking-wide">{title}</h3>
        <p className="text-4xl font-black text-white drop-shadow-lg">{value}</p>
      </div>
    </div>
  );

  const FeatureCard = ({ icon: Icon, title, description, gradient, delay }) => (
    <div 
      className={`group relative overflow-hidden bg-white rounded-2xl shadow-lg p-8 transform transition-all duration-700 ${
        animate ? 'translate-x-0 opacity-100' : '-translate-x-10 opacity-0'
      } hover:scale-105 hover:shadow-2xl cursor-pointer border-2 border-transparent hover:border-purple-300`}
      style={{ transitionDelay: `${delay}ms` }}
    >
      {/* Gradient overlay on hover */}
      <div className={`absolute inset-0 bg-gradient-to-br ${gradient} opacity-0 group-hover:opacity-10 transition-opacity duration-500`}></div>
      
      <div className="relative z-10">
        <div className={`inline-flex p-4 rounded-2xl bg-gradient-to-br ${gradient} mb-5 transform group-hover:scale-110 group-hover:rotate-6 transition-all duration-300 shadow-lg`}>
          <Icon size={32} className="text-white" />
        </div>
        <h3 className="text-2xl font-bold text-gray-800 mb-3 group-hover:text-transparent group-hover:bg-clip-text group-hover:bg-gradient-to-r group-hover:from-purple-600 group-hover:to-blue-600 transition-all duration-300">{title}</h3>
        <p className="text-gray-600 leading-relaxed">{description}</p>
        
        {/* Animated arrow */}
        <div className="mt-4 flex items-center text-purple-600 opacity-0 group-hover:opacity-100 transform translate-x-0 group-hover:translate-x-2 transition-all duration-300">
          <span className="font-semibold mr-2">Learn more</span>
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
          </svg>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-100 via-purple-100 to-pink-100 relative overflow-hidden">
      {/* Animated background elements */}
      <div className="absolute top-0 left-0 w-96 h-96 bg-purple-300 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob"></div>
      <div className="absolute top-0 right-0 w-96 h-96 bg-blue-300 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob animation-delay-2000"></div>
      <div className="absolute bottom-0 left-1/2 w-96 h-96 bg-pink-300 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob animation-delay-4000"></div>
      
      <style jsx>{`
        @keyframes blob {
          0%, 100% { transform: translate(0, 0) scale(1); }
          33% { transform: translate(30px, -50px) scale(1.1); }
          66% { transform: translate(-20px, 20px) scale(0.9); }
        }
        .animate-blob {
          animation: blob 7s infinite;
        }
        .animation-delay-2000 {
          animation-delay: 2s;
        }
        .animation-delay-4000 {
          animation-delay: 4s;
        }
      `}</style>

      {/* Header */}
      <header className="bg-white bg-opacity-80 backdrop-blur-lg shadow-xl sticky top-0 z-50 border-b border-purple-200">
        <div className="max-w-7xl mx-auto px-6 py-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="relative p-3 bg-gradient-to-br from-purple-600 via-blue-600 to-pink-600 rounded-2xl shadow-lg transform hover:rotate-12 transition-transform duration-300">
                <ZapIcon size={36} className="text-white" />
                <SparkleIcon className="absolute -top-1 -right-1 text-yellow-300 animate-pulse" />
              </div>
              <div>
                <h1 className="text-4xl font-black bg-gradient-to-r from-purple-600 via-blue-600 to-pink-600 bg-clip-text text-transparent">
                  AI Business Assistant
                </h1>
                <p className="text-gray-600 font-medium">Complete automation for small business owners</p>
              </div>
            </div>
            <button className="px-8 py-4 bg-gradient-to-r from-purple-600 via-blue-600 to-pink-600 text-white rounded-xl font-bold text-lg shadow-xl hover:shadow-2xl transform hover:scale-110 hover:-rotate-2 transition-all duration-300 relative overflow-hidden group">
              <span className="relative z-10">Get Started Free</span>
              <div className="absolute inset-0 bg-gradient-to-r from-pink-600 via-purple-600 to-blue-600 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
            </button>
          </div>
        </div>
      </header>

      <div className="relative z-10 max-w-7xl mx-auto px-6 py-10">
        {/* Hero Section */}
        <div className={`relative overflow-hidden bg-gradient-to-r from-purple-600 via-blue-600 to-pink-600 rounded-3xl shadow-2xl p-12 mb-10 text-white transform transition-all duration-1000 ${
          animate ? 'scale-100 opacity-100 rotate-0' : 'scale-95 opacity-0 rotate-2'
        }`}>
          {/* Animated sparkles */}
          <div className="absolute top-10 right-20 animate-pulse">
            <SparkleIcon className="text-yellow-300 w-8 h-8" />
          </div>
          <div className="absolute bottom-20 left-40 animate-pulse animation-delay-2000">
            <SparkleIcon className="text-pink-300 w-6 h-6" />
          </div>
          
          <div className="relative z-10">
            <h2 className="text-5xl font-black mb-5 drop-shadow-lg">Transform Your Business Operations 🚀</h2>
            <p className="text-2xl font-medium mb-8 text-white text-opacity-95">
              AI-powered call handling, scheduling, and customer management—all in one platform
            </p>
            <div className="flex flex-wrap gap-4">
              {[
                { icon: PhoneIcon, text: 'Automated Calls', bg: 'from-blue-500 to-cyan-400' },
                { icon: CalendarIcon, text: 'Smart Scheduling', bg: 'from-purple-500 to-pink-400' },
                { icon: DatabaseIcon, text: 'CRM Integration', bg: 'from-green-500 to-teal-400' }
              ].map((item, i) => (
                <div key={i} className={`flex items-center space-x-3 bg-gradient-to-r ${item.bg} rounded-xl px-5 py-3 shadow-lg transform hover:scale-110 transition-transform duration-300 cursor-pointer`}>
                  <item.icon size={24} />
                  <span className="font-bold">{item.text}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
          <StatCard 
            icon={PhoneIcon} 
            title="Total Calls" 
            value={stats.totalCalls} 
            trend={15.3}
            delay={100}
            gradient="from-blue-500 via-blue-600 to-purple-600"
          />
          <StatCard 
            icon={CalendarIcon} 
            title="Appointments" 
            value={stats.scheduledAppointments} 
            trend={8.7}
            delay={200}
            gradient="from-purple-500 via-purple-600 to-pink-600"
          />
          <StatCard 
            icon={UsersIcon} 
            title="Customers" 
            value={stats.customers} 
            trend={stats.demandTrend}
            delay={300}
            gradient="from-pink-500 via-pink-600 to-red-600"
          />
          <StatCard 
            icon={TrendingUpIcon} 
            title="Demand" 
            value="High" 
            trend={stats.demandTrend}
            delay={400}
            gradient="from-green-500 via-teal-600 to-cyan-600"
          />
        </div>

        {/* Features Section */}
        <div className="mb-10">
          <h2 className="text-4xl font-black text-gray-800 mb-8 text-center">
            <span className="bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">Powerful Features</span>
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            <FeatureCard 
              icon={PhoneIcon}
              title="AI Call Assistant"
              description="Handles incoming calls with natural voice AI powered by ElevenLabs. Collects information and verifies emails automatically."
              gradient="from-blue-500 to-cyan-500"
              delay={100}
            />
            <FeatureCard 
              icon={CalendarIcon}
              title="Smart Scheduling"
              description="Seamlessly schedules appointments on iCal and sends beautiful email confirmations instantly."
              gradient="from-purple-500 to-pink-500"
              delay={200}
            />
            <FeatureCard 
              icon={DatabaseIcon}
              title="CRM Integration"
              description="Automatically adds customers to Supabase with full details, service history, and preferences."
              gradient="from-green-500 to-teal-500"
              delay={300}
            />
            <FeatureCard 
              icon={MessageIcon}
              title="Smart Follow-ups"
              description="AI determines optimal follow-up timing and sends personalized Twilio reminders automatically."
              gradient="from-orange-500 to-red-500"
              delay={400}
            />
            <FeatureCard 
              icon={DollarIcon}
              title="Dynamic Discounts"
              description="Intelligently sends discount codes during low demand periods to maximize bookings."
              gradient="from-yellow-500 to-orange-500"
              delay={500}
            />
            <FeatureCard 
              icon={TargetIcon}
              title="Business Insights"
              description="Track demand trends, customer retention, and receive AI-powered growth recommendations."
              gradient="from-indigo-500 to-purple-500"
              delay={600}
            />
          </div>
        </div>

        {/* CTA Section */}
        <div className={`relative overflow-hidden bg-gradient-to-r from-pink-600 via-purple-600 to-blue-600 rounded-3xl shadow-2xl p-12 text-white text-center transform transition-all duration-1000 ${
          animate ? 'scale-100 opacity-100' : 'scale-95 opacity-0'
        }`} style={{ transitionDelay: '800ms' }}>
          <div className="absolute top-0 left-0 w-full h-full">
            <div className="absolute top-10 left-20 w-32 h-32 bg-white rounded-full opacity-10 animate-pulse"></div>
            <div className="absolute bottom-10 right-20 w-40 h-40 bg-white rounded-full opacity-10 animate-pulse animation-delay-2000"></div>
          </div>
          
          <div className="relative z-10">
            <h2 className="text-5xl font-black mb-5 drop-shadow-lg">Ready to Transform Your Business? ✨</h2>
            <p className="text-2xl font-medium mb-8">Join hundreds of businesses automating their operations</p>
            <button className="px-12 py-5 bg-white text-purple-600 rounded-2xl font-black text-xl shadow-2xl hover:shadow-3xl transform hover:scale-110 hover:rotate-2 transition-all duration-300 group relative overflow-hidden">
              <span className="relative z-10">Start Free Trial →</span>
              <div className="absolute inset-0 bg-gradient-to-r from-purple-100 to-pink-100 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
// exporting Dashboard component
export default Dashboard;