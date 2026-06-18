import { useEffect, useState } from 'react';
import './PricingScreen.css';

interface Props {
  onBack: () => void;
}

interface Package {
  id: string;
  name: string;
  icon: string;
  price: string;
  period: string;
  subtitle: string;
  features: string[];
  cta: string;
  popular: boolean;
  color: string;
}

const packages: Package[] = [
  {
    id: 'seeker',
    name: 'SEEKER',
    icon: '🌑',
    price: 'Free',
    period: 'Forever',
    subtitle: 'დაიწყე შენი მოგზაურობა',
    features: [
      'დღიური ბარათი (1/დღე)',
      'ძირითადი ჰოროსკოპი',
      '3 განლაგება კვირაში',
      '10 ბარათის კოლექცია',
      'დღიური აფირმაციები',
      'ბაზალური ნუმეროლოგია',
    ],
    cta: 'დაიწყე უფასოდ',
    popular: false,
    color: '#886600',
  },
  {
    id: 'mystic',
    name: 'MYSTIC',
    icon: '🌙',
    price: '$4.99',
    period: '/თვე',
    subtitle: 'გააღრმევე შენი ცოდნა',
    features: [
      'ულიმიტო განლაგებები',
      'სრული კოლექცია (78)',
      'დღიური + კვირეული ჰოროსკოპი',
      'სრული ნუმეროლოგია',
      'კრისტალები (50+)',
      'ჩაკრების ანალიზი',
      'სიზმრების ლექსიკონი',
      'მთვარის რიტუალები',
      'დაბადების რუკა',
      'შეთავსებადობა (3/თვე)',
      '100 💎 გემი/თვე',
      'რეკლამების გარეშე',
    ],
    cta: '7 დღე უფასო ტრიალი',
    popular: true,
    color: '#c87800',
  },
  {
    id: 'oracle',
    name: 'ORACLE',
    icon: '🌕',
    price: '$9.99',
    period: '/თვე',
    subtitle: 'გახდი წინასწარმეტყველი',
    features: [
      'ყველაფერი MYSTIC-იდან +',
      'AI კითხვები',
      'ულიმიტო შეთავსებადობა',
      'რუნები (24)',
      'ორაკულის ბარათები (3)',
      'ქირომანტია',
      'ჰუმან დიზაინი',
      'ი ჩინგი (64)',
      'აურის წაკითხვა',
      'სულიერი ცხოველები',
      'კონსულტაცია (1/თვე)',
      'ექსკლუზიური ბარათები',
      '300 💎 გემი/თვე',
    ],
    cta: 'აირჩიე ORACLE',
    popular: false,
    color: '#e8a020',
  },
  {
    id: 'celestial',
    name: 'CELESTIAL',
    icon: '✨',
    price: '$19.99',
    period: '/თვე',
    subtitle: 'მიაღწიე ღვთაებრივს',
    features: [
      'ყველაფერი ORACLE-იდან +',
      'პირადი მენტორი',
      'ულიმიტო კონსულტაციები',
      'ექსკლუზიური ვებინარები',
      'წლიური პროგნოზი (PDF)',
      'პირადი რიტუალები',
      'ფიზიკური საჩუქრები',
      'დახურული საზოგადოება',
      '1-on-1 სესიები (1სთ/თვე)',
      'Custom ავატარი',
      '1000 💎 გემი/თვე',
      'Elite ბეჯი',
    ],
    cta: 'გახდი CELESTIAL',
    popular: false,
    color: '#ffe566',
  },
];

export default function PricingScreen({ onBack }: Props) {
  const [selectedPackage, setSelectedPackage] = useState<Package | null>(null);

  useEffect(() => {
    console.log('💎 PricingScreen mounted');
  }, []);

  const handleCardClick = (pkg: Package) => {
    setSelectedPackage(pkg);
  };

  const handleCloseModal = () => {
    setSelectedPackage(null);
  };

  return (
    <div className="screen-container pricing">
      {/* ნაწილაკები */}
      <div className="particles-container">
        {[...Array(12)].map((_, i) => (
          <div
            key={i}
            className="particle"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 5}s`,
              animationDuration: `${4 + Math.random() * 3}s`,
              width: `${2 + Math.random() * 2}px`,
              height: `${2 + Math.random() * 2}px`,
            }}
          />
        ))}
      </div>

      {/* Header */}
      <div className="pricing-header">
        <button className="back-btn" onClick={onBack}>
          ←
        </button>
        <h1 className="pricing-title">CHOOSE YOUR PATH</h1>
        <p className="pricing-subtitle">✦ აირჩიე შენი გზა ✦</p>
      </div>

      {/* 4 ბარათი Grid */}
      <div className="packages-grid">
        {packages.map((pkg) => (
          <div
            key={pkg.id}
            className={`package-card ${pkg.popular ? 'popular' : ''}`}
            onClick={() => handleCardClick(pkg)}
          >
            {pkg.popular && (
              <div className="popular-badge">⭐ POPULAR</div>
            )}
            <div className="card-icon">{pkg.icon}</div>
            <h2 className="card-name">{pkg.name}</h2>
            <div className="card-price">
              <span className="price-amount">{pkg.price}</span>
              <span className="price-period">{pkg.period}</span>
            </div>
            <p className="card-subtitle">{pkg.subtitle}</p>
            <div className="card-features-preview">
              <span>{pkg.features.length} ფუნქცია</span>
            </div>
          </div>
        ))}
      </div>

      {/* Modal */}
      {selectedPackage && (
        <div className="modal-overlay" onClick={handleCloseModal}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <button className="modal-close" onClick={handleCloseModal}>
              
            </button>
            
            <div className="modal-header">
              <div className="modal-icon">{selectedPackage.icon}</div>
              <h2 className="modal-title">{selectedPackage.name}</h2>
              <p className="modal-subtitle">{selectedPackage.subtitle}</p>
              <div className="modal-price">
                <span className="price-amount">{selectedPackage.price}</span>
                <span className="price-period">{selectedPackage.period}</span>
              </div>
            </div>

            <div className="modal-features">
              <h3 className="features-title">✦ რა შედის ✦</h3>
              {selectedPackage.features.map((feature, idx) => (
                <div key={idx} className="feature-item">
                  <span className="feature-check">✦</span>
                  <span className="feature-text">{feature}</span>
                </div>
              ))}
            </div>

            <button
              className="modal-cta"
              onClick={() => {
                console.log(`Selected: ${selectedPackage.id}`);
                handleCloseModal();
              }}
            >
              {selectedPackage.cta}
            </button>

            <div className="modal-guarantee">
              🔒 7 დღიანი ტრიალი • ნებისმიერ დროს გაუქმება
            </div>
          </div>
        </div>
      )}
    </div>
  );
}