// Page transitions
export const fadeInUp = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -20 }
};

// Dropdown animations
export const dropdownVariants = {
  hidden: {
    opacity: 0,
    scale: 0.95,
    y: -10,
    transition: { duration: 0.2, ease: "easeOut" }
  },
  visible: {
    opacity: 1,
    scale: 1,
    y: 0,
    transition: { duration: 0.25, ease: "easeOut", staggerChildren: 0.02 }
  }
};

export const dropdownItemVariants = {
  hidden: { opacity: 0, y: -5 },
  visible: { opacity: 1, y: 0 }
};

// Common transitions
export const configTransition = {
  type: "spring",
  stiffness: 300,
  damping: 30
};

// Button interactions
export const buttonHover = { scale: 1.02 };
export const buttonTap = { scale: 0.98 };
export const buttonHoverLift = { scale: 1.02, y: -1 };

export const smallElementHover = { scale: 1.05 };
export const smallElementTap = { scale: 0.95 };

export const cardHover = { scale: 1.01 };

// Common spring transition
export const springTransition = { type: "spring", stiffness: 400, damping: 25 };