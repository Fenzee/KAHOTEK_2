import { motion, Variant } from "framer-motion";
import { ReactNode } from "react";
import { useAnimationInView, animationPresets } from "@/hooks/use-animation";

type PresetKeys = keyof typeof animationPresets;

interface AnimatedElementProps {
  children: ReactNode;
  preset?: PresetKeys;
  duration?: number;
  delay?: number;
  className?: string;
  custom?: {
    hidden: Variant;
    visible: Variant;
  };
  threshold?: string;
  once?: boolean;
}

export function AnimatedElement({
  children,
  preset = "fadeIn",
  duration = 0.5,
  delay = 0,
  className = "",
  custom,
  threshold = "-100px 0px",
  once = true,
}: AnimatedElementProps) {
  const { ref, isInView } = useAnimationInView({ margin: threshold, once });
  const variants = custom || animationPresets[preset];

  return (
    <motion.div
      ref={ref}
      initial="hidden"
      animate={isInView ? "visible" : "hidden"}
      variants={variants}
      transition={{
        duration,
        delay,
        ease: "easeOut",
      }}
      className={className}
    >
      {children}
    </motion.div>
  );
} 