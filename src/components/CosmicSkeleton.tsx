import { motion } from 'framer-motion';
import './CosmicSkeleton.css';

export default function CosmicSkeleton() {
  return (
    <div className="cosmic-skeleton">
      {/* Animated Stars Background */}
      <div className="skeleton-stars">
        {[...Array(20)].map((_, i) => (
          <motion.div
            key={i}
            className="skeleton-star"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
            }}
            animate={{
              opacity: [0.2, 1, 0.2],
              scale: [0.8, 1.2, 0.8],
            }}
            transition={{
              duration: 2 + Math.random() * 2,
              repeat: Infinity,
              delay: Math.random() * 2,
            }}
          />
        ))}
      </div>

      {/* Header Skeleton */}
      <div className="skeleton-header">
        <div className="skeleton-circle" />
        <div className="skeleton-text skeleton-text-large" />
        <div className="skeleton-text skeleton-text-small" />
        <div className="skeleton-circle" />
      </div>

      {/* Hero Banner Skeleton */}
      <div className="skeleton-hero">
        <div className="skeleton-hero-content">
          <div className="skeleton-text skeleton-text-medium" />
          <div className="skeleton-text skeleton-text-large" />
          <div className="skeleton-text skeleton-text-full" />
          <div className="skeleton-button" />
        </div>
        <div className="skeleton-card">
          <div className="skeleton-card-inner" />
        </div>
      </div>

      {/* Tab Navigation Skeleton */}
      <div className="skeleton-tabs">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="skeleton-tab" />
        ))}
      </div>

      {/* Energy Cards Skeleton */}
      <div className="skeleton-section">
        <div className="skeleton-section-title" />
        <div className="skeleton-energy-grid">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="skeleton-energy-card">
              <div className="skeleton-circle skeleton-icon" />
              <div className="skeleton-text skeleton-text-small" />
              <div className="skeleton-text skeleton-text-tiny" />
              <div className="skeleton-dots">
                {[...Array(5)].map((_, j) => (
                  <div key={j} className="skeleton-dot" />
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Moon Card Skeleton */}
      <div className="skeleton-moon-card">
        <div className="skeleton-circle skeleton-moon" />
        <div className="skeleton-moon-content">
          <div className="skeleton-text skeleton-text-tiny" />
          <div className="skeleton-text skeleton-text-medium" />
          <div className="skeleton-text skeleton-text-small" />
          <div className="skeleton-text skeleton-text-full" />
        </div>
        <div className="skeleton-circle skeleton-symbol" />
      </div>

      {/* Predictions Grid Skeleton */}
      <div className="skeleton-section">
        <div className="skeleton-section-title" />
        <div className="skeleton-predictions-grid">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="skeleton-prediction-card">
              <div className="skeleton-circle skeleton-icon" />
              <div className="skeleton-text skeleton-text-tiny" />
              <div className="skeleton-text skeleton-text-tiny" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}