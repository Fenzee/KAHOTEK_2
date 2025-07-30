"use client";

import { motion, AnimatePresence } from "framer-motion";
import { ReactNode, useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import { LoadingAnimation } from "./loading-animation";

// Tipe animasi yang tersedia
export type AnimationType = "fade" | "slide" | "zoom" | "slideUp" | "slideDown" | "scaleRotate" | "none";

interface PageTransitionProps {
  children: ReactNode;
  animation?: AnimationType;
  duration?: number;
  showLoading?: boolean;
  loadingVariant?: "default" | "quiz" | "game" | "minimal";
  loadingMessage?: string;
  loadingDuration?: number;
}

const animations = {
  fade: {
    initial: { opacity: 0 },
    animate: { opacity: 1 },
    exit: { opacity: 0 },
  },
  slide: {
    initial: { x: "100%" },
    animate: { x: 0 },
    exit: { x: "-100%" },
  },
  slideUp: {
    initial: { y: "100%", opacity: 0 },
    animate: { y: 0, opacity: 1 },
    exit: { y: "-100%", opacity: 0 },
  },
  slideDown: {
    initial: { y: "-100%", opacity: 0 },
    animate: { y: 0, opacity: 1 },
    exit: { y: "100%", opacity: 0 },
  },
  zoom: {
    initial: { scale: 0.8, opacity: 0 },
    animate: { scale: 1, opacity: 1 },
    exit: { scale: 0.8, opacity: 0 },
  },
  scaleRotate: {
    initial: { scale: 0.5, rotate: -180, opacity: 0 },
    animate: { scale: 1, rotate: 0, opacity: 1 },
    exit: { scale: 0.5, rotate: 180, opacity: 0 },
  },
  none: {
    initial: {},
    animate: {},
    exit: {},
  },
};

export function PageTransition({
  children,
  animation = "fade",
  duration = 0.3,
  showLoading = false,
  loadingVariant = "default",
  loadingMessage = "Memuat...",
  loadingDuration = 800,
}: PageTransitionProps) {
  const [isLoading, setIsLoading] = useState(showLoading);
  const pathname = usePathname();

  useEffect(() => {
    if (showLoading) {
      setIsLoading(true);
      const timer = setTimeout(() => {
        setIsLoading(false);
      }, loadingDuration);
      return () => clearTimeout(timer);
    }
  }, [pathname, showLoading, loadingDuration]);

  if (isLoading) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm z-50 flex items-center justify-center"
      >
        <LoadingAnimation 
          variant={loadingVariant} 
          message={loadingMessage}
          size="lg"
        />
      </motion.div>
    );
  }

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={pathname}
        initial="initial"
        animate="animate"
        exit="exit"
        variants={animations[animation]}
        transition={{
          duration,
          ease: [0.22, 1, 0.36, 1], // Custom easing for smoother transitions
          type: "tween"
        }}
        className="h-full w-full"
      >
        {children}
      </motion.div>
    </AnimatePresence>
  );
}