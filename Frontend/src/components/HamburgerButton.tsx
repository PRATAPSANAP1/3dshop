import React from "react";
import { motion } from "framer-motion";

interface HamburgerButtonProps {
  isOpen?: boolean;
  onClick?: () => void;
  className?: string;
}

const HamburgerButton = React.forwardRef<HTMLButtonElement, HamburgerButtonProps>(
  ({ isOpen = false, onClick, className = "", ...props }, ref) => {
    return (
      <motion.button
        ref={ref}
        onClick={onClick}
        whileHover={{ scale: 1.08 }}
        whileTap={{ scale: 0.92 }}
        className={`hamburger-btn group relative flex h-11 w-11 items-center justify-center rounded-2xl focus:outline-none ${className}`}
        aria-label="Toggle menu"
        {...props}
      >
        {/* Gradient background with glow */}
        <span className="hamburger-btn-bg" />
        
        {/* Animated bars */}
        <span className="hamburger-bars">
          <motion.span
            className="hamburger-bar"
            animate={isOpen ? { rotate: 45, y: 6 } : { rotate: 0, y: 0 }}
            transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
          />
          <motion.span
            className="hamburger-bar hamburger-bar-mid"
            animate={isOpen ? { opacity: 0, scaleX: 0 } : { opacity: 1, scaleX: 1 }}
            transition={{ duration: 0.2 }}
          />
          <motion.span
            className="hamburger-bar"
            animate={isOpen ? { rotate: -45, y: -6 } : { rotate: 0, y: 0 }}
            transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
          />
        </span>
      </motion.button>
    );
  }
);

HamburgerButton.displayName = "HamburgerButton";

export default HamburgerButton;
