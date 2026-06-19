export default function CardBack() {
    return (
      <div className="card-back">
        <svg viewBox="0 0 100 160" className="card-svg">
          {/* Background */}
          <rect width="100" height="160" fill="#1a0f05" rx="6"/>
          
          {/* Outer golden border */}
          <rect 
            x="3" y="3" 
            width="94" height="154" 
            stroke="#c87800" 
            strokeWidth="1.5" 
            fill="none"
            rx="5"
          />
          
          {/* Inner decorative border */}
          <rect 
            x="7" y="7" 
            width="86" height="146" 
            stroke="#ffe566" 
            strokeWidth="0.5" 
            fill="none"
            opacity="0.4"
            rx="4"
          />
          
          {/* Moon phases - vertical arrangement */}
          <g className="moon-phases">
            {/* Full Moon (top) */}
            <circle cx="50" cy="35" r="11" fill="#ffe566" opacity="0.9"/>
            <circle cx="50" cy="35" r="9" fill="#1a0f05" opacity="0.2"/>
            
            {/* Half Moon */}
            <circle cx="50" cy="65" r="11" fill="#1a0f05" stroke="#ffe566" strokeWidth="1.5" opacity="0.8"/>
            <path d="M 50 54 A 11 11 0 0 1 50 76" fill="#ffe566" opacity="0.8"/>
            
            {/* Crescent Moon */}
            <circle cx="50" cy="95" r="11" fill="#1a0f05" stroke="#ffe566" strokeWidth="1.5" opacity="0.7"/>
            <path d="M 47 84 A 9 9 0 0 1 47 106" fill="#ffe566" opacity="0.7"/>
            
            {/* New Moon (bottom) */}
            <circle cx="50" cy="125" r="11" fill="#ffe566" opacity="0.5"/>
            <circle cx="50" cy="125" r="9" fill="#1a0f05" opacity="0.5"/>
          </g>
          
          {/* Decorative stars */}
          <circle cx="25" cy="50" r="1.5" fill="#ffe566" opacity="0.7"/>
          <circle cx="75" cy="50" r="1.5" fill="#ffe566" opacity="0.7"/>
          <circle cx="20" cy="80" r="1" fill="#ffe566" opacity="0.5"/>
          <circle cx="80" cy="80" r="1" fill="#ffe566" opacity="0.5"/>
          <circle cx="25" cy="110" r="1.5" fill="#ffe566" opacity="0.7"/>
          <circle cx="75" cy="110" r="1.5" fill="#ffe566" opacity="0.7"/>
          
          {/* Corner ornaments */}
          <path d="M 10 10 L 18 10 L 10 18 Z" fill="#c87800" opacity="0.8"/>
          <path d="M 90 10 L 82 10 L 90 18 Z" fill="#c87800" opacity="0.8"/>
          <path d="M 10 150 L 18 150 L 10 142 Z" fill="#c87800" opacity="0.8"/>
          <path d="M 90 150 L 82 150 L 90 142 Z" fill="#c87800" opacity="0.8"/>
          
          {/* Center eye symbol */}
          <ellipse cx="50" cy="80" rx="8" ry="5" fill="none" stroke="#ffe566" strokeWidth="1" opacity="0.6"/>
          <circle cx="50" cy="80" r="2.5" fill="#ffe566" opacity="0.6"/>
        </svg>
      </div>
    );
  }