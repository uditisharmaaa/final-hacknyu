// LandingPage.jsx
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';

const LandingPage = () => {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 50);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const features = [
    {
      title: "AI-Powered Calls",
      description: "Natural voice assistant handles customer calls 24/7 with human-like conversations",
      icon: "📞"
    },
    {
      title: "Smart Scheduling",
      description: "Automatic appointment booking synced with your calendar in real-time",
      icon: "📅"
    },
    {
      title: "CRM Integration",
      description: "Seamlessly manage customer data, bookings, and service history",
      icon: "💼"
    },
    {
      title: "Auto Follow-ups",
      description: "Intelligent SMS and email reminders sent at optimal times",
      icon: "✉️"
    },
    {
      title: "Dynamic Pricing",
      description: "Smart discount codes during low demand to maximize bookings",
      icon: "💰"
    },
    {
      title: "Business Analytics",
      description: "Real-time insights on revenue, bookings, and customer trends",
      icon: "📊"
    }
  ];

  const stats = [
    { value: "10k+", label: "Calls Handled" },
    { value: "500+", label: "Active Businesses" },
    { value: "99.9%", label: "Uptime" },
    { value: "4.9/5", label: "Customer Rating" }
  ];

  const howItWorks = [
    { step: "01", title: "Connect", desc: "Link your phone number and business calendar" },
    { step: "02", title: "Configure", desc: "Set your services, pricing, and preferences" },
    { step: "03", title: "Automate", desc: "Let AI handle calls, bookings, and follow-ups" }
  ];

  const pricing = [
    { 
      name: "Starter", 
      price: "$29", 
      features: ["100 calls/month", "Basic CRM", "Email support", "Calendar sync"] 
    },
    { 
      name: "Professional", 
      price: "$79", 
      features: ["500 calls/month", "Advanced CRM", "Priority support", "Analytics dashboard", "SMS reminders"], 
      popular: true 
    },
    { 
      name: "Enterprise", 
      price: "$199", 
      features: ["Unlimited calls", "Custom integrations", "Dedicated support", "White-label option", "API access"] 
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-stone-50 to-amber-50">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap');
        
        * {
          font-family: 'Inter', sans-serif;
        }

        @keyframes fade-in {
          from { opacity: 0; }
          to { opacity: 1; }
        }

        @keyframes slide-up {
          from { 
            opacity: 0;
            transform: translateY(30px);
          }
          to { 
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes fade-in-up {
          from { 
            opacity: 0;
            transform: translateY(20px);
          }
          to { 
            opacity: 1;
            transform: translateY(0);
          }
        }

        .animate-fade-in {
          animation: fade-in 0.6s ease-out;
        }

        .animate-slide-up {
          animation: slide-up 0.8s ease-out;
        }

        .animate-slide-up-delay {
          animation: slide-up 0.8s ease-out 0.2s both;
        }

        .animate-slide-up-delay-2 {
          animation: slide-up 0.8s ease-out 0.4s both;
        }

        .animate-fade-in-up {
          animation: fade-in-up 0.6s ease-out both;
        }

        html {
          scroll-behavior: smooth;
        }
      `}</style>

      {/* Navigation */}
      <nav className={`fixed w-full z-50 transition-all duration-300 ${scrolled ? 'bg-white shadow-md py-4' : 'bg-transparent py-6'}`}>
        <div className="max-w-6xl mx-auto px-6 flex items-center justify-between">
          <Link to="/" className="flex items-center space-x-2 hover:opacity-80 transition-opacity">
            <div className="w-10 h-10 bg-gradient-to-br from-amber-600 to-orange-600 rounded-lg flex items-center justify-center">
              <span className="text-white text-xl font-bold">A</span>
            </div>
            <span className="text-2xl font-bold text-stone-800">AI Business Assistant</span>
          </Link>
          
          <div className="hidden md:flex items-center space-x-8">
            <a href="#features" className="text-stone-600 hover:text-amber-700 transition-colors font-medium">Features</a>
            <a href="#how-it-works" className="text-stone-600 hover:text-amber-700 transition-colors font-medium">How It Works</a>
            <a href="#pricing" className="text-stone-600 hover:text-amber-700 transition-colors font-medium">Pricing</a>
            <a 
              href="#get-started"
              className="px-6 py-2.5 bg-gradient-to-r from-amber-600 to-orange-600 text-white rounded-lg hover:shadow-lg transition-all duration-300 font-medium"
            >
              Get Started
            </a>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-32 pb-20 px-6">
        <div className="max-w-6xl mx-auto text-center">
          <div className="inline-block mb-4 px-4 py-2 bg-amber-100 rounded-full text-amber-800 text-sm font-medium animate-fade-in">
            ✨ AI-Powered Business Automation
          </div>
          
          <h1 className="text-5xl md:text-6xl font-bold text-stone-900 mb-6 leading-tight animate-slide-up">
            Voice Receptionist &<br />
            <span className="bg-gradient-to-r from-amber-600 to-orange-600 bg-clip-text text-transparent">
              CRM Dashboard
            </span>
          </h1>
          
          <p className="text-xl text-stone-600 mb-10 max-w-2xl mx-auto leading-relaxed animate-slide-up-delay">
            Automate customer calls, appointment scheduling, and follow-ups with AI. 
            Focus on your business while we handle customer interactions 24/7.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center animate-slide-up-delay-2">
            <a 
              href="#get-started"
              className="px-8 py-4 bg-gradient-to-r from-amber-600 to-orange-600 text-white rounded-lg text-lg font-semibold hover:shadow-xl transition-all duration-300 hover:scale-105"
            >
              Start Free Trial
            </a>
            <button className="px-8 py-4 border-2 border-stone-300 text-stone-700 rounded-lg text-lg font-semibold hover:border-amber-600 hover:text-amber-700 transition-all duration-300">
              Watch Demo
            </button>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mt-20 max-w-4xl mx-auto">
            {stats.map((stat, i) => (
              <div key={i} className="text-center animate-fade-in-up" style={{ animationDelay: `${i * 100}ms` }}>
                <div className="text-3xl font-bold text-stone-900 mb-1">{stat.value}</div>
                <div className="text-sm text-stone-600">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 px-6 bg-white">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-stone-900 mb-4">
              Everything You Need to Succeed
            </h2>
            <p className="text-lg text-stone-600 max-w-2xl mx-auto">
              Powerful AI features designed to help small businesses automate and grow
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, i) => (
              <div 
                key={i} 
                className="group p-8 bg-stone-50 rounded-2xl hover:bg-gradient-to-br hover:from-amber-50 hover:to-orange-50 transition-all duration-300 hover:shadow-lg cursor-pointer border border-stone-100"
              >
                <div className="text-4xl mb-4 group-hover:scale-110 transition-transform duration-300">
                  {feature.icon}
                </div>
                <h3 className="text-xl font-bold text-stone-900 mb-3">
                  {feature.title}
                </h3>
                <p className="text-stone-600 leading-relaxed">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section id="how-it-works" className="py-20 px-6 bg-gradient-to-b from-stone-50 to-white">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-stone-900 mb-4">
              Simple Setup, Powerful Results
            </h2>
            <p className="text-lg text-stone-600">
              Get started in minutes with our easy 3-step process
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-12">
            {howItWorks.map((item, i) => (
              <div key={i} className="text-center relative">
                {i < 2 && (
                  <div className="hidden md:block absolute top-12 left-1/2 w-full h-0.5 bg-gradient-to-r from-amber-300 to-orange-300"></div>
                )}
                <div className="relative z-10 w-24 h-24 mx-auto mb-6 bg-gradient-to-br from-amber-600 to-orange-600 rounded-full flex items-center justify-center text-white text-2xl font-bold shadow-lg">
                  {item.step}
                </div>
                <h3 className="text-2xl font-bold text-stone-900 mb-3">{item.title}</h3>
                <p className="text-stone-600 text-lg">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="py-20 px-6 bg-white">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-stone-900 mb-4">
              Simple, Transparent Pricing
            </h2>
            <p className="text-lg text-stone-600">
              Choose the plan that fits your business needs
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {pricing.map((plan, i) => (
              <div 
                key={i}
                className={`p-8 rounded-2xl border-2 ${plan.popular ? 'border-amber-500 shadow-xl scale-105 bg-gradient-to-b from-amber-50 to-orange-50' : 'border-stone-200 bg-white'} hover:shadow-lg transition-all duration-300`}
              >
                {plan.popular && (
                  <div className="inline-block px-3 py-1 bg-gradient-to-r from-amber-600 to-orange-600 text-white text-sm font-semibold rounded-full mb-4">
                    Most Popular
                  </div>
                )}
                <h3 className="text-2xl font-bold text-stone-900 mb-2">{plan.name}</h3>
                <div className="mb-6">
                  <span className="text-4xl font-bold text-stone-900">{plan.price}</span>
                  <span className="text-stone-600">/month</span>
                </div>
                <ul className="space-y-3 mb-8">
                  {plan.features.map((feature, j) => (
                    <li key={j} className="flex items-center text-stone-600">
                      <span className="mr-2 text-amber-600 text-lg">✓</span>
                      {feature}
                    </li>
                  ))}
                </ul>
                <a 
                  href="#get-started"
                  className={`block w-full py-3 rounded-lg font-semibold text-center transition-all duration-300 ${
                    plan.popular 
                      ? 'bg-gradient-to-r from-amber-600 to-orange-600 text-white hover:shadow-lg' 
                      : 'border-2 border-stone-300 text-stone-700 hover:border-amber-600 hover:text-amber-700'
                  }`}
                >
                  Get Started
                </a>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section id="get-started" className="py-20 px-6">
        <div className="max-w-4xl mx-auto text-center bg-gradient-to-br from-amber-600 to-orange-600 rounded-3xl p-12 shadow-2xl">
          <h2 className="text-4xl font-bold text-white mb-4">
            Ready to Transform Your Business?
          </h2>
          <p className="text-xl text-amber-50 mb-8">
            Join hundreds of businesses already using AI to handle calls and grow
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button className="px-10 py-4 bg-white text-amber-700 rounded-lg text-lg font-bold hover:shadow-2xl transition-all duration-300 hover:scale-105">
              Start Your Free Trial
            </button>
            <button className="px-8 py-3 border-2 border-amber-400 text-amber-700 rounded-lg text-lg font-semibold hover:bg-amber-100 hover:border-amber-500 transition-colors duration-300">
  Contact Sales
</button>

          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-stone-900 text-white py-12 px-6">
        <div className="max-w-6xl mx-auto grid md:grid-cols-4 gap-8">
          <div>
            <div className="flex items-center space-x-2 mb-4">
              <div className="w-8 h-8 bg-gradient-to-br from-amber-600 to-orange-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold">A</span>
              </div>
              <span className="text-xl font-bold">AI Assistant</span>
            </div>
            <p className="text-stone-400 text-sm">
              AI-powered voice receptionist and CRM for modern businesses
            </p>
          </div>
          
          <div>
            <h4 className="font-semibold mb-4">Product</h4>
            <ul className="space-y-2 text-stone-400 text-sm">
              <li><a href="#features" className="hover:text-amber-500 transition-colors">Features</a></li>
              <li><a href="#pricing" className="hover:text-amber-500 transition-colors">Pricing</a></li>
              <li><a href="#" className="hover:text-amber-500 transition-colors">FAQ</a></li>
              <li><a href="#" className="hover:text-amber-500 transition-colors">Documentation</a></li>
            </ul>
          </div>
          
          <div>
            <h4 className="font-semibold mb-4">Company</h4>
            <ul className="space-y-2 text-stone-400 text-sm">
              <li><a href="#" className="hover:text-amber-500 transition-colors">About Us</a></li>
              <li><a href="#" className="hover:text-amber-500 transition-colors">Blog</a></li>
              <li><a href="#" className="hover:text-amber-500 transition-colors">Careers</a></li>
              <li><a href="#" className="hover:text-amber-500 transition-colors">Contact</a></li>
            </ul>
          </div>
          
          <div>
            <h4 className="font-semibold mb-4">Legal</h4>
            <ul className="space-y-2 text-stone-400 text-sm">
              <li><a href="#" className="hover:text-amber-500 transition-colors">Privacy Policy</a></li>
              <li><a href="#" className="hover:text-amber-500 transition-colors">Terms of Service</a></li>
              <li><a href="#" className="hover:text-amber-500 transition-colors">Security</a></li>
              <li><a href="#" className="hover:text-amber-500 transition-colors">GDPR</a></li>
            </ul>
          </div>
        </div>
        
        <div className="max-w-6xl mx-auto mt-12 pt-8 border-t border-stone-800 text-center text-stone-400 text-sm">
          © 2024 AI Business Assistant. All rights reserved.
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;