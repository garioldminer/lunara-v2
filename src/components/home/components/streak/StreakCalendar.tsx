import { Calendar as CalendarIcon } from 'lucide-react';

interface CalendarDay {
  date: string;
  has_reading: boolean;
  reading_id?: string;
  card_name?: string;
  is_reversed?: boolean;
  is_today: boolean;
  is_future: boolean;
}

interface StreakCalendarProps {
  calendar: CalendarDay[];
  loading: boolean;
}

export function StreakCalendar({ calendar, loading }: StreakCalendarProps) {
  // ბოლო 21 დღე ნაცვლად 30-ისა
  const recentDays = calendar.slice(-21);

  return (
    <div style={{ padding: '10px 14px 8px 14px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px', fontWeight: 600, color: '#C5A059' }}>
          <CalendarIcon size={12} />
          <span>Last 21 Days</span>
        </div>
        <div style={{ fontSize: '9px', color: '#94a3b8' }}>
          {calendar.filter(d => d.has_reading).length}/{calendar.filter(d => !d.is_future).length} days
        </div>
      </div>
      
      {loading ? (
        <div style={{ textAlign: 'center', padding: '12px', color: '#94a3b8', fontSize: '10px' }}>
          Loading...
        </div>
      ) : (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(7, 1fr)',
          gap: '3px'
        }}>
          {recentDays.map((day, idx) => (
            <div
              key={idx}
              title={day.date}
              style={{
                aspectRatio: '1',
                borderRadius: '3px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '8px',
                fontWeight: day.is_today ? 700 : 500,
                background: day.is_today
                  ? 'linear-gradient(135deg, #fbbf24, #d97706)'
                  : day.has_reading
                  ? 'linear-gradient(135deg, #10b981, #059669)'
                  : day.is_future
                  ? 'rgba(255,255,255,0.02)'
                  : 'rgba(239, 68, 68, 0.25)',
                color: day.is_future ? '#64748b' : day.has_reading || day.is_today ? '#fff' : '#fca5a5',
                border: day.is_today ? '1px solid #ffe566' : day.has_reading ? '1px solid rgba(16, 185, 129, 0.4)' : '1px solid transparent'
              }}
            >
              {day.has_reading ? '✓' : day.is_today ? '★' : day.is_future ? '' : '✗'}
            </div>
          ))}
        </div>
      )}
      
      {/* Compact Legend */}
      <div style={{ display: 'flex', gap: '10px', marginTop: '6px', fontSize: '8px', color: '#94a3b8', justifyContent: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '3px' }}>
          <div style={{ width: '6px', height: '6px', borderRadius: '1px', background: '#10b981' }} />
          <span>Read</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '3px' }}>
          <div style={{ width: '6px', height: '6px', borderRadius: '1px', background: '#ef4444' }} />
          <span>Missed</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '3px' }}>
          <div style={{ width: '6px', height: '6px', borderRadius: '1px', background: '#fbbf24' }} />
          <span>Today</span>
        </div>
      </div>
    </div>
  );
}