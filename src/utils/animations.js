/**
 * animations.js — Reusable framer-motion variants for RLP Dashboard
 * Import these in components to get consistent, smooth animations.
 */

// ── Page / section fade-in on mount ──────────────────────────────────────────
export const fadeIn = {
  hidden: { opacity: 0, y: 8 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.4, ease: 'easeOut' },
  },
};

// ── Header slide-down on mount ────────────────────────────────────────────────
export const headerSlide = {
  hidden: { opacity: 0, y: -20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.45, ease: [0.22, 1, 0.36, 1] },
  },
};

// ── Stats bar slide-up on mount ───────────────────────────────────────────────
export const statsBarSlide = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.45, ease: [0.22, 1, 0.36, 1] },
  },
};

// ── Stagger container — wraps a list of children ─────────────────────────────
export const staggerContainer = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.07,
      delayChildren: 0.1,
    },
  },
};

// ── Stagger item — each card / list row ──────────────────────────────────────
export const staggerItem = {
  hidden: { opacity: 0, y: 20, scale: 0.97 },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { duration: 0.35, ease: [0.22, 1, 0.36, 1] },
  },
};

// ── Card hover effect ─────────────────────────────────────────────────────────
export const cardHover = {
  rest: {
    scale: 1,
    boxShadow: '0 4px 20px rgba(0,0,0,0.25)',
    transition: { duration: 0.25, ease: 'easeOut' },
  },
  hover: {
    scale: 1.01,
    boxShadow: '0 8px 36px rgba(0,0,0,0.45)',
    transition: { duration: 0.25, ease: 'easeOut' },
  },
};

// ── Todo item layout animation (for drag-drop reorder) ───────────────────────
export const todoItemVariants = {
  hidden: { opacity: 0, x: -12 },
  visible: {
    opacity: 1,
    x: 0,
    transition: { duration: 0.28, ease: 'easeOut' },
  },
  exit: {
    opacity: 0,
    x: 12,
    transition: { duration: 0.2, ease: 'easeIn' },
  },
};

// ── Status badge color transition ─────────────────────────────────────────────
export const statusColors = {
  pending: '#6b7280',      // gray-500
  in_progress: '#60a5fa',  // blue-400
  done: '#4ade80',         // green-400
};

// ── Count-up spring (used in StatsBar animated numbers) ──────────────────────
export const countUpTransition = {
  type: 'spring',
  stiffness: 80,
  damping: 14,
};

// ── Progress ring arc draw-on ─────────────────────────────────────────────────
export const progressRingTransition = {
  duration: 0.9,
  ease: [0.22, 1, 0.36, 1],
};

// ── Overlay drag ghost ────────────────────────────────────────────────────────
export const dragOverlayVariants = {
  initial: { scale: 1, boxShadow: '0 2px 8px rgba(0,0,0,0.3)' },
  animate: {
    scale: 1.04,
    boxShadow: '0 12px 40px rgba(99,102,241,0.35)',
    transition: { duration: 0.15 },
  },
};
