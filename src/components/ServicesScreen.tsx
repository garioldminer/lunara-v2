import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, Crown, Sparkles, CheckCircle, Lock, Star } from 'lucide-react';
import { useUser } from '../context/UserContext';
import { getActiveSubscription } from '../lib/subscriptionService';
import { formatStars } from '../lib/telegramPaymentService';
import './ServicesScreen.css';

interface Props {
  onNavigate?: (screen: string) => void;
}

interface Service {
  id: string;
  icon: string;
  name: string;
  description: string;
  price: string;
  priceStars?: number;
  type: 'subscription' | 'single' | 'free' | 'coming-soon';
  features: string[];
  popular?: boolean;
  color: string;
}

export default function ServicesScreen({ onNavigate }: Props) {
  const { user } = useUser();
  const [hasSubscription, setHasSubscription] = useState(false);

  useEffect(() => {
    if (user) {
      getActiveSubscription(user.id).then(sub => {
        setHasSubscription(!!sub);
      });
    }
  }, [user]);

  const subscriptions: Service[] = [
    {
      id: 'monthly',
      icon: '💎',
      name: 'Premium Monthly',
      description: '30 days of unlimited access',
      price: '$9.99',
      priceStars: 499,
      type: 'subscription',
      features: [
        'Unlimited readings',
        'Full 78-card collection',
        'Daily + weekly horoscope',
        'AI-powered insights',
        'No ads'
      ],
      color: '#C5A059'
    },
    {
      id: 'yearly',
      icon: '💎',
      name: 'Premium Yearly',
      description: '365 days - Best value!',
      price: '$79.99',
      priceStars: 3999,
      type: 'subscription',
      features: [
        'Everything in Monthly',
        'Save 33%',
        'Priority support',
        'Exclusive content',
        'Early access to features'
      ],
      popular: true,
      color: '#FFD700'
    }
  ];

  const singleReadings: Service[] = [
    {
      id: 'celtic_cross',
      icon: '✝️',
      name: 'Celtic Cross',
      description: '10-card deep analysis',
      price: '$2.99',
      priceStars: 1,
      type: 'single',
      features: [
        '10 cards spread',
        'Detailed interpretation',
        'Past, present, future',
        'Challenges & outcomes'
      ],
      color: '#a78bfa'
    },
    {
      id: 'horseshoe',
      icon: '🐎',
      name: 'Horseshoe',
      description: '7-card life path',
      price: '$1.99',
      priceStars: 100,
      type: 'single',
      features: [
        '7 cards spread',
        'Life path analysis',
        'Past influences',
        'Future guidance'
      ],
      color: '#fb923c'
    },
    {
      id: 'relationship',
      icon: '❤️',
      name: 'Relationship',
      description: '6-card love analysis',
      price: '$3.99',
      priceStars: 200,
      type: 'single',
      features: [
        '6 cards spread',
        'Partner compatibility',
        'Relationship dynamics',
        'Future together'
      ],
      color: '#f472b6'
    }
  ];

  const freeServices: Service[] = [
    {
      id: 'daily_card',
      icon: '🌅',
      name: 'Daily Card',
      description: 'Your card for today',
      price: 'FREE',
      type: 'free',
      features: [
        'One card per day',
        'Basic meaning',
        'Reversed interpretation',
        'Daily guidance'
      ],
      color: '#34d399'
    },
    {
      id: 'three_card',
      icon: '🎴',
      name: '3-Card Reading',
      description: 'Past, present, future',
      price: 'FREE',
      type: 'free',
      features: [
        '3 cards spread',
        'Quick insight',
        'Simple interpretation',
        'Daily use'
      ],
      color: '#60a5fa'
    }
  ];

  const comingSoon: Service[] = [
    {
      id: 'birth_chart',
      icon: '🌟',
      name: 'Birth Chart',
      description: 'Full astrological analysis',
      price: 'Coming Soon',
      type: 'coming-soon',
      features: [
        'Sun, moon, rising signs',
        'Planetary positions',
        'Houses analysis',
        'Aspects interpretation'
      ],
      color: '#888'
    },
    {
      id: 'compatibility',
      icon: '💕',
      name: 'Compatibility',
      description: 'Relationship analysis',
      price: 'Coming Soon',
      type: 'coming-soon',
      features: [
        'Synastry chart',
        'Composite chart',
        'Compatibility score',
        'Relationship advice'
      ],
      color: '#888'
    },
    {
      id: 'ai_insights',
      icon: '🤖',
      name: 'AI Insights',
      description: 'Personalized guidance',
      price: 'Coming Soon',
      type: 'coming-soon',
      features: [
        'AI-powered analysis',
        'Personal questions',
        'Detailed answers',
        'Follow-up questions'
      ],
      color: '#888'
    }
  ];

  const handleServiceClick = (service: Service) => {
    if (service.type === 'coming-soon') {
      return;
    }
    
    if (service.type === 'free') {
      if (service.id === 'daily_card') {
        onNavigate?.('daily-card');
      } else if (service.id === 'three_card') {
        onNavigate?.('three-card-reading');
      }
    } else if (service.type === 'subscription') {
      onNavigate?.('services');
    } else if (service.type === 'single') {
      onNavigate?.('services');
    }
  };

  return (
    <div className="services-screen">
      {/* Header */}
      <div className="services-header">
        <button className="services-back-btn" onClick={() => onNavigate?.('home')}>
          <ArrowLeft size={20} />
        </button>
        <div className="services-header-center">
          <Sparkles size={24} />
          <h1>Services</h1>
        </div>
        <div className="services-header-spacer" />
      </div>

      <div className="services-content">
        {/* Subscriptions Section */}
        <section className="services-section">
          <div className="section-header">
            <h2 className="section-title">
              <Crown size={20} />
              <span>Subscriptions</span>
            </h2>
            <p className="section-subtitle">Unlimited access to all features</p>
          </div>
          
          <div className="subscription-cards">
            {subscriptions.map((service, index) => (
              <motion.div
                key={service.id}
                className={`service-card subscription-card ${service.popular ? 'popular' : ''}`}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                onClick={() => handleServiceClick(service)}
              >
                {service.popular && (
                  <div className="popular-badge">
                    <Star size={12} />
                    <span>POPULAR</span>
                  </div>
                )}
                
                <div className="service-icon" style={{ '--service-color': service.color } as React.CSSProperties}>
                  {service.icon}
                </div>
                
                <div className="service-info">
                  <h3 className="service-name">{service.name}</h3>
                  <p className="service-description">{service.description}</p>
                </div>
                
                <div className="service-price">
                  <div className="price-main">
                    <span className="price-usd">{service.price}</span>
                    {service.priceStars && (
                      <span className="price-stars">{formatStars(service.priceStars)}</span>
                    )}
                  </div>
                  <div className="price-period">
                    {service.id === 'monthly' ? '30 days' : '365 days'}
                  </div>
                </div>
                
                <div className="service-features">
                  {service.features.map((feature, idx) => (
                    <div key={idx} className="feature-item">
                      <CheckCircle size={12} />
                      <span>{feature}</span>
                    </div>
                  ))}
                </div>
                
                <button className="service-cta">
                  {hasSubscription ? 'Current Plan' : 'Subscribe Now'}
                </button>
              </motion.div>
            ))}
          </div>
        </section>

        {/* Single Readings Section */}
        <section className="services-section">
          <div className="section-header">
            <h2 className="section-title">
              <Sparkles size={20} />
              <span>Single Readings</span>
            </h2>
            <p className="section-subtitle">One-time premium readings</p>
          </div>
          
          <div className="readings-grid">
            {singleReadings.map((service, index) => (
              <motion.div
                key={service.id}
                className="service-card reading-card"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                onClick={() => handleServiceClick(service)}
              >
                <div className="service-icon" style={{ '--service-color': service.color } as React.CSSProperties}>
                  {service.icon}
                </div>
                
                <div className="service-info">
                  <h3 className="service-name">{service.name}</h3>
                  <p className="service-description">{service.description}</p>
                </div>
                
                <div className="service-price">
                  <div className="price-main">
                    <span className="price-usd">{service.price}</span>
                    {service.priceStars && (
                      <span className="price-stars">{formatStars(service.priceStars)}</span>
                    )}
                  </div>
                </div>
                
                <div className="service-features">
                  {service.features.slice(0, 3).map((feature, idx) => (
                    <div key={idx} className="feature-item">
                      <CheckCircle size={10} />
                      <span>{feature}</span>
                    </div>
                  ))}
                </div>
                
                <button className="service-cta">
                  {hasSubscription ? 'Included' : 'Buy Now'}
                </button>
              </motion.div>
            ))}
          </div>
        </section>

        {/* Free Services Section */}
        <section className="services-section">
          <div className="section-header">
            <h2 className="section-title">
              <Star size={20} />
              <span>Free Services</span>
            </h2>
            <p className="section-subtitle">Available to everyone</p>
          </div>
          
          <div className="readings-grid">
            {freeServices.map((service, index) => (
              <motion.div
                key={service.id}
                className="service-card free-card"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                onClick={() => handleServiceClick(service)}
              >
                <div className="service-icon" style={{ '--service-color': service.color } as React.CSSProperties}>
                  {service.icon}
                </div>
                
                <div className="service-info">
                  <h3 className="service-name">{service.name}</h3>
                  <p className="service-description">{service.description}</p>
                </div>
                
                <div className="service-price">
                  <div className="price-main">
                    <span className="price-free">{service.price}</span>
                  </div>
                </div>
                
                <div className="service-features">
                  {service.features.slice(0, 3).map((feature, idx) => (
                    <div key={idx} className="feature-item">
                      <CheckCircle size={10} />
                      <span>{feature}</span>
                    </div>
                  ))}
                </div>
                
                <button className="service-cta free-cta">
                  Use Now
                </button>
              </motion.div>
            ))}
          </div>
        </section>

        {/* Coming Soon Section */}
        <section className="services-section">
          <div className="section-header">
            <h2 className="section-title">
              <Lock size={20} />
              <span>Coming Soon</span>
            </h2>
            <p className="section-subtitle">Exciting features in development</p>
          </div>
          
          <div className="readings-grid">
            {comingSoon.map((service, index) => (
              <motion.div
                key={service.id}
                className="service-card coming-soon-card"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <div className="coming-soon-overlay">
                  <Lock size={24} />
                  <span>Coming Soon</span>
                </div>
                
                <div className="service-icon" style={{ '--service-color': service.color } as React.CSSProperties}>
                  {service.icon}
                </div>
                
                <div className="service-info">
                  <h3 className="service-name">{service.name}</h3>
                  <p className="service-description">{service.description}</p>
                </div>
                
                <div className="service-price">
                  <div className="price-main">
                    <span className="price-soon">{service.price}</span>
                  </div>
                </div>
                
                <div className="service-features">
                  {service.features.slice(0, 3).map((feature, idx) => (
                    <div key={idx} className="feature-item">
                      <CheckCircle size={10} />
                      <span>{feature}</span>
                    </div>
                  ))}
                </div>
              </motion.div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}