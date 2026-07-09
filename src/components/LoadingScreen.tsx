import { motion } from 'framer-motion';
import { useState, useEffect } from 'react';
import './LoadingScreen.css';

interface Props {
  message?: string;
}

const LOADING_QUOTES = [
  "The stars are aligning...",
  "Consulting the cosmos...",
  "Reading ancient wisdom...",
  "Connecting to the universe...",
  "Mystical forces at work..."
];

export default function LoadingScreen({ message }: Props) {
  const [randomQuote, setRandomQuote] = useState(LOADING_QUOTES[0]);

  useEffect(() => {
    setRandomQuote(LOADING_QUOTES[Math.floor(Math.random() * LOADING_QUOTES.length)]);
  }, []);

  return (
    <div className="loading-screen">
      {/* Background Image */}
      <div 
        className="loading-bg"
        style={{
          backgroundImage: `url('https://eutavdhcxpfhpfsyaskb.supabase.co/storage/v1/object/public/assets/backgrounds/loading-bg.png')`
        }}
      />
      
      {/* Dark Overlay */}
      <div className="loading-overlay" />

      {/* Content */}
      <div className="loading-content">
        {/* LUNARA Title */}
        <motion.h1
          className="loading-title"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, ease: "easeOut" }}
        >
          LUNARA
        </motion.h1>

        {/* Loading Message */}
        <motion.p
          className="loading-message"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5, duration: 0.8 }}
        >
          {message || randomQuote}
        </motion.p>

        {/* Loading Dots */}
        <div className="loading-dots">
          {[0, 1, 2].map((i) => (
            <motion.div
              key={i}
              className="loading-dot"
              animate={{
                scale: [1, 1.4, 1],
                opacity: [0.4, 1, 0.4]
              }}
              transition={{
                duration: 1.2,
                repeat: Infinity,
                delay: i * 0.2,
                ease: "easeInOut"
              }}
            />
          ))}
        </div>
      </div>
    </div>
  );
}