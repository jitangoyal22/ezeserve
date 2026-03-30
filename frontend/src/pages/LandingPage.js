import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, Check, QrCode, Smartphone, TrendingUp, Zap, Globe, Heart, Star, Shield } from 'lucide-react';
import { Button } from '@/components/ui/button';

const LandingPage = () => {
  const navigate = useNavigate();

  const features = [
    {
      icon: QrCode,
      title: 'QR Code Ordering',
      description: 'Contactless ordering via QR scan. No app download needed.'
    },
    {
      icon: Smartphone,
      title: 'Mobile First Design',
      description: 'Beautiful responsive design that works perfectly on all devices.'
    },
    {
      icon: TrendingUp,
      title: 'Real-time Analytics',
      description: 'Track orders, revenue, and trends with live dashboard.'
    },
    {
      icon: Zap,
      title: 'Lightning Fast',
      description: 'Orders reach kitchen instantly. Reduce wait time by 40%.'
    },
    {
      icon: Globe,
      title: 'Multi-Restaurant',
      description: 'Manage multiple restaurant locations from one dashboard.'
    },
    {
      icon: Shield,
      title: 'Secure & Reliable',
      description: 'Bank-grade security. 99.9% uptime guaranteed.'
    }
  ];

  const pricing = [
    {
      name: 'Starter',
      price: '499',
      period: 'month',
      features: [
        'Up to 50 orders/day',
        'QR code menu',
        'Basic analytics',
        'Email support',
        '1 Restaurant'
      ],
      popular: false
    },
    {
      name: 'Professional',
      price: '999',
      period: 'month',
      features: [
        'Unlimited orders',
        'Advanced analytics',
        'Kanban order board',
        'WhatsApp integration',
        'Up to 5 Restaurants',
        'Priority support'
      ],
      popular: true
    },
    {
      name: 'Enterprise',
      price: 'Custom',
      period: '',
      features: [
        'Everything in Professional',
        'Unlimited restaurants',
        'Custom branding',
        'API access',
        'Dedicated account manager',
        '24/7 phone support'
      ],
      popular: false
    }
  ];

  const petpoojaComparison = [
    { feature: 'Setup Cost', petpooja: '₹15,000 - ₹50,000', ezeserve: '₹0 (Free)' },
    { feature: 'Monthly Cost', petpooja: '₹3,000 - ₹8,000', ezeserve: '₹499 - ₹999' },
    { feature: 'QR Ordering', petpooja: '✓', ezeserve: '✓' },
    { feature: 'Kanban Board', petpooja: '✗', ezeserve: '✓' },
    { feature: 'Modern UI', petpooja: 'Basic', ezeserve: 'Premium' },
    { feature: 'Setup Time', petpooja: '2-3 days', ezeserve: '15 minutes' }
  ];

  return (
    <div style={{ fontFamily: 'Inter, sans-serif' }}>
      {/* Hero Section */}
      <div className=\"relative overflow-hidden\" style={{ 
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        minHeight: '100vh'
      }}>
        <div className=\"absolute inset-0 opacity-10\" style={{
          backgroundImage: 'radial-gradient(circle at 20% 30%, white 0%, transparent 40%)'
        }}></div>
        
        <nav className=\"relative z-10 p-6 flex justify-between items-center max-w-7xl mx-auto\">
          <div className=\"flex items-center gap-2\">
            <div className=\"w-10 h-10 rounded-2xl flex items-center justify-center\" style={{ backgroundColor: '#FFFFFF' }}>
              <QrCode size={24} style={{ color: '#667eea' }} />
            </div>
            <span className=\"text-2xl font-bold text-white\">ezeserve</span>
          </div>
          <Button 
            onClick={() => navigate('/admin/login')}
            className=\"rounded-full px-6 font-semibold\"
            style={{ backgroundColor: '#FFFFFF', color: '#667eea' }}
          >
            Admin Login
          </Button>
        </nav>

        <div className=\"relative z-10 max-w-7xl mx-auto px-6 pt-20 pb-32 text-center\">
          <h1 className=\"text-5xl sm:text-6xl lg:text-7xl font-bold text-white mb-6 leading-tight\">
            Modern QR Ordering<br/>for Smart Restaurants
          </h1>
          <p className=\"text-xl sm:text-2xl text-white/90 mb-8 max-w-3xl mx-auto\">
            Replace outdated POS systems. Get customers ordering in seconds with QR codes. 
            Save ₹40,000+ annually vs Petpooja.
          </p>
          <div className=\"flex flex-col sm:flex-row gap-4 justify-center items-center\">
            <Button 
              onClick={() => navigate('/admin/login')}
              className=\"rounded-full px-8 py-6 text-lg font-semibold flex items-center gap-2\"
              style={{ backgroundColor: '#FFFFFF', color: '#667eea' }}
            >
              Start Free Trial
              <ArrowRight size={20} />
            </Button>
            <Button 
              className=\"rounded-full px-8 py-6 text-lg font-semibold\"
              style={{ backgroundColor: 'rgba(255, 255, 255, 0.2)', color: '#FFFFFF', border: '2px solid white' }}
            >
              Watch Demo
            </Button>
          </div>
          <p className=\"text-white/70 mt-4\">No credit card required • Setup in 15 minutes</p>
        </div>
      </div>

      {/* Features Section */}
      <div className=\"py-20 px-6\" style={{ backgroundColor: '#FAFAFA' }}>
        <div className=\"max-w-7xl mx-auto\">
          <div className=\"text-center mb-16\">
            <h2 className=\"text-4xl font-bold mb-4\" style={{ color: '#1E293B' }}>
              Everything You Need to Run a Modern Restaurant
            </h2>
            <p className=\"text-xl\" style={{ color: '#64748B' }}>
              Powerful features that Petpooja charges extra for. Included in every plan.
            </p>
          </div>

          <div className=\"grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8\">
            {features.map((feature, index) => {
              const Icon = feature.icon;
              return (
                <div 
                  key={index}
                  className=\"rounded-3xl p-8 gradient-card hover:-translate-y-2 transition-all duration-200\"
                >
                  <div 
                    className=\"w-16 h-16 rounded-2xl flex items-center justify-center mb-6\"
                    style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}
                  >
                    <Icon size={32} style={{ color: '#FFFFFF' }} />
                  </div>
                  <h3 className=\"text-xl font-bold mb-3\" style={{ color: '#1E293B' }}>
                    {feature.title}
                  </h3>
                  <p style={{ color: '#64748B' }}>
                    {feature.description}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Comparison Section */}
      <div className=\"py-20 px-6\" style={{ backgroundColor: '#FFFFFF' }}>
        <div className=\"max-w-5xl mx-auto\">
          <div className=\"text-center mb-16\">
            <h2 className=\"text-4xl font-bold mb-4\" style={{ color: '#1E293B' }}>
              ezeserve vs Petpooja
            </h2>
            <p className=\"text-xl\" style={{ color: '#64748B' }}>
              See why modern restaurants are switching to ezeserve
            </p>
          </div>

          <div className=\"rounded-3xl overflow-hidden\" style={{ backgroundColor: '#F9FAFB' }}>
            <div className=\"grid grid-cols-3 gap-4 p-6 font-bold text-center\" style={{ backgroundColor: '#667eea', color: '#FFFFFF' }}>
              <div>Feature</div>
              <div>Petpooja</div>
              <div>ezeserve ✨</div>
            </div>
            {petpoojaComparison.map((row, index) => (
              <div 
                key={index}
                className=\"grid grid-cols-3 gap-4 p-6 border-b text-center items-center\"
                style={{ borderColor: '#E5E7EB' }}
              >
                <div className=\"font-semibold\" style={{ color: '#1E293B' }}>{row.feature}</div>
                <div style={{ color: '#64748B' }}>{row.petpooja}</div>
                <div className=\"font-bold\" style={{ color: '#667eea' }}>{row.ezeserve}</div>
              </div>
            ))}
          </div>

          <div className=\"mt-8 p-6 rounded-2xl text-center\" style={{ backgroundColor: '#FEF3C7' }}>
            <p className=\"text-lg font-bold\" style={{ color: '#92400E' }}>
              💰 Save ₹40,000+ in first year by switching from Petpooja to ezeserve
            </p>
          </div>
        </div>
      </div>

      {/* Pricing Section */}
      <div className=\"py-20 px-6\" style={{ backgroundColor: '#FAFAFA' }}>
        <div className=\"max-w-7xl mx-auto\">
          <div className=\"text-center mb-16\">
            <h2 className=\"text-4xl font-bold mb-4\" style={{ color: '#1E293B' }}>
              Simple, Transparent Pricing
            </h2>
            <p className=\"text-xl\" style={{ color: '#64748B' }}>
              No hidden fees. No setup charges. Cancel anytime.
            </p>
          </div>

          <div className=\"grid grid-cols-1 md:grid-cols-3 gap-8\">
            {pricing.map((plan, index) => (
              <div 
                key={index}
                className=\"rounded-3xl p-8 gradient-card relative\"
                style={{ 
                  border: plan.popular ? '3px solid #667eea' : '1px solid transparent'
                }}
              >
                {plan.popular && (
                  <div 
                    className=\"absolute -top-4 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full text-sm font-bold\"
                    style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', color: '#FFFFFF' }}
                  >
                    MOST POPULAR
                  </div>
                )}
                <h3 className=\"text-2xl font-bold mb-2\" style={{ color: '#1E293B' }}>
                  {plan.name}
                </h3>
                <div className=\"mb-6\">
                  <span className=\"text-5xl font-bold\" style={{ 
                    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent'
                  }}>
                    {plan.price !== 'Custom' ? `₹${plan.price}` : plan.price}
                  </span>
                  {plan.period && <span style={{ color: '#64748B' }}>/{plan.period}</span>}
                </div>
                <ul className=\"space-y-3 mb-8\">
                  {plan.features.map((feature, idx) => (
                    <li key={idx} className=\"flex items-center gap-2\">
                      <Check size={20} style={{ color: '#10B981' }} />
                      <span style={{ color: '#475569' }}>{feature}</span>
                    </li>
                  ))}
                </ul>
                <Button 
                  onClick={() => navigate('/admin/login')}
                  className=\"w-full rounded-full py-3 font-semibold\"
                  style={{ 
                    background: plan.popular ? 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' : '#F1F5F9',
                    color: plan.popular ? '#FFFFFF' : '#1E293B'
                  }}
                >
                  Get Started
                </Button>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className=\"py-20 px-6\" style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}>
        <div className=\"max-w-4xl mx-auto text-center\">
          <h2 className=\"text-4xl font-bold text-white mb-6\">
            Ready to Modernize Your Restaurant?
          </h2>
          <p className=\"text-xl text-white/90 mb-8\">
            Join 100+ restaurants already using ezeserve. Setup takes just 15 minutes.
          </p>
          <Button 
            onClick={() => navigate('/admin/login')}
            className=\"rounded-full px-8 py-6 text-lg font-semibold flex items-center gap-2 mx-auto\"
            style={{ backgroundColor: '#FFFFFF', color: '#667eea' }}
          >
            Start Your Free Trial
            <ArrowRight size={20} />
          </Button>
        </div>
      </div>

      {/* Footer */}
      <div className=\"py-8 px-6\" style={{ backgroundColor: '#1E293B' }}>
        <div className=\"max-w-7xl mx-auto text-center\">
          <p style={{ color: '#94A3B8' }}>
            © 2024 ezeserve. All rights reserved. Made in India 🇮🇳
          </p>
        </div>
      </div>
    </div>
  );
};

export default LandingPage;
