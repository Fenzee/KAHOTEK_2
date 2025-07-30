import { useInView } from "framer-motion";
import { useRef } from "react";

type AnimationOptions = {
  once?: boolean;
  margin?: string;
};

/**
 * Hook untuk mendeteksi apakah sebuah elemen sudah terlihat (in view)
 * dan memicu animasi saat elemen muncul di viewport
 */
export function useAnimationInView(options: AnimationOptions = {}) {
  const { once = true, margin = "-100px 0px" } = options;
  const ref = useRef(null);
  const isInView = useInView(ref, {
    once,
    margin,
  });

  return { ref, isInView };
}

/**
 * Preset animasi yang umum digunakan
 */
export const animationPresets = {
  fadeIn: {
    hidden: { opacity: 0 },
    visible: { opacity: 1 },
  },
  fadeInUp: {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 },
  },
  fadeInDown: {
    hidden: { opacity: 0, y: -20 },
    visible: { opacity: 1, y: 0 },
  },
  fadeInLeft: {
    hidden: { opacity: 0, x: -20 },
    visible: { opacity: 1, x: 0 },
  },
  fadeInRight: {
    hidden: { opacity: 0, x: 20 },
    visible: { opacity: 1, x: 0 },
  },
  zoomIn: {
    hidden: { opacity: 0, scale: 0.9 },
    visible: { opacity: 1, scale: 1 },
  },
  zoomOut: {
    hidden: { opacity: 0, scale: 1.1 },
    visible: { opacity: 1, scale: 1 },
  },
  // Tambahan preset animasi bisa ditambahkan sesuai kebutuhan
}; 