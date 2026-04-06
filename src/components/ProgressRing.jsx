import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';

const getColor = (percentage) => {
  if (percentage < 30) return '#ef4444'; // red-500
  if (percentage < 70) return '#eab308'; // yellow-500
  return '#22c55e'; // green-500
};

const ProgressRing = ({ percentage = 0, size = 120, strokeWidth = 8, label }) => {
  const [animatedPercentage, setAnimatedPercentage] = useState(0);

  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const center = size / 2;

  const clampedPercentage = Math.min(100, Math.max(0, percentage));
  const strokeDashoffset = circumference - (animatedPercentage / 100) * circumference;
  const color = getColor(clampedPercentage);

  // Count-up animation on mount
  useEffect(() => {
    const duration = 800; // ms
    const startTime = performance.now();
    const startValue = 0;
    const endValue = clampedPercentage;

    const animate = (currentTime) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      // Ease out cubic
      const eased = 1 - Math.pow(1 - progress, 3);
      setAnimatedPercentage(startValue + (endValue - startValue) * eased);

      if (progress < 1) {
        requestAnimationFrame(animate);
      }
    };

    requestAnimationFrame(animate);
  }, [clampedPercentage]);

  return (
    <div className="flex flex-col items-center gap-1">
      <div className="relative" style={{ width: size, height: size }}>
        <svg
          width={size}
          height={size}
          style={{ transform: 'rotate(-90deg)' }}
        >
          {/* Background track */}
          <circle
            cx={center}
            cy={center}
            r={radius}
            fill="none"
            stroke="rgba(255,255,255,0.1)"
            strokeWidth={strokeWidth}
          />
          {/* Animated progress arc */}
          <motion.circle
            cx={center}
            cy={center}
            r={radius}
            fill="none"
            stroke={color}
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            strokeDasharray={circumference}
            animate={{
              strokeDashoffset,
              stroke: color,
            }}
            transition={{
              strokeDashoffset: { duration: 0.8, ease: 'easeOut' },
              stroke: { duration: 0.4 },
            }}
            style={{
              filter: `drop-shadow(0 0 6px ${color}80)`,
            }}
          />
        </svg>
        {/* Center text */}
        <div
          className="absolute inset-0 flex flex-col items-center justify-center"
          style={{ transform: 'none' }}
        >
          <span
            className="font-bold tabular-nums leading-none"
            style={{
              fontSize: size * 0.2,
              color,
              textShadow: `0 0 8px ${color}60`,
            }}
          >
            {Math.round(animatedPercentage)}%
          </span>
        </div>
      </div>
      {label && (
        <span
          className="text-xs text-white/60 text-center leading-tight max-w-full truncate"
          style={{ maxWidth: size }}
        >
          {label}
        </span>
      )}
    </div>
  );
};

export default ProgressRing;
