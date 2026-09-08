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
  return (
    <div style={{ padding: '16px 16px 8px 16px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '10px', fontSize: '12px', fontWeight: 600, color: '#C5A059' }}>
        <CalendarIcon size={14} />
        <span>Last 30 Days</span>
      </div>
      
      {loading ? (
        <div style={{ textAlign: 'center', padding: '20px', color: '#94a3b8', fontSize: '11px' }}>
          Loading calendar...
        </div>
      ) : (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(7, 1fr)',
          gap: '4px'
        }}>
          {calendar.map((day, idx) => (
            <div
              key={idx}
              title={day.date}
              style={{
                aspectRatio: '1',
                borderRadius: '4px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '9px',
                fontWeight: day.is_today ? 700 : 500,
                background: day.is_today
                  ? 'linear-gradient(135deg, #fbbf24, #d97706)'
                  : day.has_reading
                  ? 'linear-gradient(135deg, #10b981, #059669)'
                  : day.is_future
                  ? 'rgba(255,255,255,0.02)'
                  : 'rgba(239, 68, 68, 0.25)',
                color: day.is_future ? '#64748b' : day.has_reading || day.is_today ? '#fff' : '#fca5a5',
                border: day.is_today ? '1.5px solid #ffe566' : day.has_reading ? '1px solid rgba(16, 185, 129, 0.4)' : '1px solid transparent',
                boxShadow: day.is_today ? '0 0 8px rgba(251, 191, 36, 0.5)' : 'none'
              }}
            >
              {day.has_reading ? '✓' : day.is_today ? '★' : day.is_future ? '' : '✗'}
            </div>
          ))}
        </div>
      )}
      
      <div style={{ display: 'flex', gap: '12px', marginTop: '10px', fontSize: '9px', color: '#94a3b8', justifyContent: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
          <div style={{ width: '8px', height: '8px', borderRadius: '2px', background: '#10b981' }} />
          <span>Read</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
          <div style={{ width: '8px', height: '8px', borderRadius: '2px', background: '#ef4444' }} />
          <span>Missed</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
          <div style={{ width: '8px', height: '8px', borderRadius: '2px', background: '#fbbf24' }} />
          <span>Today</span>
        </div>
      </div>
    </div>
  );
}