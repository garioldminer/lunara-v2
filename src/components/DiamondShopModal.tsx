import { useState } from 'react';
import { X, Gem, Sparkles } from 'lucide-react';
import { supabase } from '../lib/supabase';

interface Package {
  id: string;
  coins: number;
  stars: number;
  label: string;
  isPopular?: boolean;
}

const packages: Package[] = [
  { id: 'small', coins: 50, stars: 50, label: 'მცირე პაკეტი' },
  { id: 'medium', coins: 120, stars: 100, label: 'საშუალო პაკეტი', isPopular: true },
  { id: 'large', coins: 300, stars: 200, label: 'დიდი პაკეტი' },
];

interface DiamondShopModalProps {
  isOpen: boolean;
  onClose: () => void;
  userId: string;
  onSuccess: () => void;
}

export default function DiamondShopModal({ isOpen, onClose, userId, onSuccess }: DiamondShopModalProps) {
  const [isLoading, setIsLoading] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleBuy = async (pkg: Package) => {
    if (!(window as any).Telegram?.WebApp) {
      alert('ეს ფუნქცია მხოლოდ Telegram-შია ხელმისაწვდომი.');
      return;
    }

    setIsLoading(pkg.id);
    try {
      const { data, error } = await supabase.functions.invoke('create-diamond-invoice', {
        body: {
          user_id: userId,
          coins_amount: pkg.coins,
          stars_amount: pkg.stars,
          description: `${pkg.coins} დიამონდის შეძენა`
        }
      });

      if (error || !data?.invoice_url) {
        throw new Error('ინვოისის შექმნა ვერ მოხერხდა');
      }

      const tg = (window as any).Telegram.WebApp;
      tg.openInvoice(data.invoice_url, async (status: string) => {
        if (status === 'paid') {
          onSuccess();
        }
        setIsLoading(null);
      });
    } catch (err) {
      console.error('Shop Error:', err);
      alert('შეცდომა მაღაზიასთან დაკავშირებით. სცადეთ მოგვიანებით.');
      setIsLoading(null);
    }
  };

  return (
    <div style={{
      position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
      background: 'rgba(0,0,0,0.8)', zIndex: 10000,
      display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px'
    }} onClick={onClose}>
      <div style={{
        background: 'linear-gradient(135deg, #1a1510 0%, #0f0c08 100%)',
        border: '1px solid rgba(197, 160, 89, 0.3)', borderRadius: '20px',
        width: '100%', maxWidth: '400px', padding: '24px', position: 'relative'
      }} onClick={(e) => e.stopPropagation()}>
        
        <button onClick={onClose} style={{ position: 'absolute', top: '16px', right: '16px', background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer' }}>
          <X size={24} />
        </button>

        <div style={{ textAlign: 'center', marginBottom: '24px' }}>
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '8px' }}>
            <div style={{ background: 'rgba(197, 160, 89, 0.2)', padding: '12px', borderRadius: '50%' }}>
              <Gem size={32} color="#C5A059" />
            </div>
          </div>
          <h2 style={{ color: '#fff', fontSize: '24px', fontWeight: 'bold', margin: 0 }}>დიამონდების მაღაზია</h2>
          <p style={{ color: '#94a3b8', fontSize: '14px', marginTop: '8px' }}>შეიძინე დიამონდები Telegram Stars-ით და შეავსე ენერგია!</p>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {packages.map((pkg) => (
            <button
              key={pkg.id}
              onClick={() => handleBuy(pkg)}
              disabled={isLoading !== null}
              style={{
                background: pkg.isPopular ? 'rgba(197, 160, 89, 0.15)' : 'rgba(255,255,255,0.05)',
                border: pkg.isPopular ? '1px solid #C5A059' : '1px solid rgba(255,255,255,0.1)',
                borderRadius: '12px', padding: '16px', cursor: 'pointer',
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                opacity: isLoading === pkg.id ? 0.6 : 1, position: 'relative', overflow: 'hidden'
              }}
            >
              {pkg.isPopular && (
                <div style={{
                  position: 'absolute', top: '0', right: '0',
                  background: '#C5A059', color: '#000', fontSize: '10px',
                  padding: '2px 8px', borderBottomLeftRadius: '8px', fontWeight: 'bold'
                }}>
                  პოპულარული
                </div>
              )}
              
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px', color: '#C5A059', fontWeight: 'bold', fontSize: '18px' }}>
                  <Gem size={20} /> {pkg.coins}
                </div>
                <div style={{ color: '#94a3b8', fontSize: '14px' }}>{pkg.label}</div>
              </div>

              <div style={{ 
                display: 'flex', alignItems: 'center', gap: '4px', 
                background: 'rgba(255,255,255,0.1)', padding: '6px 12px', borderRadius: '20px',
                color: '#fff', fontWeight: 'bold', fontSize: '14px'
              }}>
                <Sparkles size={16} color="#FFD700" /> {pkg.stars} ⭐
              </div>
            </button>
          ))}
        </div>

        {isLoading && (
          <div style={{ textAlign: 'center', marginTop: '16px', color: '#C5A059', fontSize: '14px' }}>
            იტვირთება ინვოისი...
          </div>
        )}
      </div>
    </div>
  );
}