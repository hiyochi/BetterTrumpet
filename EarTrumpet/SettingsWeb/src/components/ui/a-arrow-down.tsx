"use client";

import type { Variants } from "motion/react";
import { motion, useAnimation } from "motion/react";
import type { HTMLAttributes } from "react";
import { forwardRef, useCallback, useImperativeHandle, useRef } from "react";

export interface AArrowDownIconHandle {
  startAnimation: () => void;
  stopAnimation: () => void;
}

interface AArrowDownIconProps extends HTMLAttributes<HTMLDivElement> {
  size?: number;
}

const letterVariants: Variants = {
  normal: { opacity: 1, scale: 1 },
  animate: { opacity: [0, 1], scale: [0.84, 1], transition: { duration: 0.16 } },
};

const arrowVariants: Variants = {
  normal: { opacity: 1, y: 0 },
  animate: { opacity: [0, 1], y: [-6, 0], transition: { duration: 0.16, delay: 0.06 } },
};

const AArrowDownIcon = forwardRef<AArrowDownIconHandle, AArrowDownIconProps>(
  ({ onMouseEnter, onMouseLeave, className, size = 20, ...props }, ref) => {
    const controls = useAnimation();
    const isControlledRef = useRef(false);

    useImperativeHandle(ref, () => {
      isControlledRef.current = true;
      return {
        startAnimation: () => controls.start("animate"),
        stopAnimation: () => controls.start("normal"),
      };
    });

    const handleMouseEnter = useCallback((event: React.MouseEvent<HTMLDivElement>) => {
      if (isControlledRef.current) onMouseEnter?.(event);
      else controls.start("animate");
    }, [controls, onMouseEnter]);

    const handleMouseLeave = useCallback((event: React.MouseEvent<HTMLDivElement>) => {
      if (isControlledRef.current) onMouseLeave?.(event);
      else controls.start("normal");
    }, [controls, onMouseLeave]);

    return (
      <div className={className} onMouseEnter={handleMouseEnter} onMouseLeave={handleMouseLeave} {...props}>
        <svg fill="none" height={size} stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24" width={size} xmlns="http://www.w3.org/2000/svg">
          <motion.path animate={controls} d="M3.5 13h6" variants={letterVariants} />
          <motion.path animate={controls} d="m2 16 4.5-9 4.5 9" variants={letterVariants} />
          <motion.path animate={controls} d="M18 7v9" variants={arrowVariants} />
          <motion.path animate={controls} d="m14 12 4 4 4-4" variants={arrowVariants} />
        </svg>
      </div>
    );
  },
);

AArrowDownIcon.displayName = "AArrowDownIcon";

export { AArrowDownIcon };
