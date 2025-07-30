"use client";

import { useEffect, useState, useCallback } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import { useLoading } from "@/contexts/loading-context";

interface RouteLoadingConfig {
  enabled?: boolean;
  duration?: number;
  messages?: Record<string, string>;
  variants?: Record<string, "default" | "quiz" | "game" | "minimal">;
}

const defaultMessages: Record<string, string> = {
  "/": "Memuat halaman utama...",
  "/auth/login": "Memuat halaman masuk...",
  "/auth/register": "Memuat halaman daftar...",
  "/dashboard": "Memuat dashboard...",
  "/create": "Memuat pembuat kuis...",
  "/game": "Menghubungkan ke game...",
  "/play": "Memuat kuis...",
  "/results": "Memuat hasil...",
  "/join": "Bergabung ke game...",
  "/host": "Menyiapkan game...",
  "/learn": "Memuat materi...",
  "/edit": "Memuat editor...",
  "/profile": "Memuat profil...",
  "/history": "Memuat riwayat...",
  "/map": "Memuat peta..."
};

const defaultVariants: Record<string, "default" | "quiz" | "game" | "minimal"> = {
  "/game": "game",
  "/play": "quiz",
  "/host": "game",
  "/join": "game",
  "/create": "quiz",
  "/edit": "quiz",
  "/results": "quiz",
  "/learn": "quiz"
};

export function useRouteLoading(config: RouteLoadingConfig = {}) {
  const {
    enabled = true,
    duration = 600, // Consistent dummy loading duration
    messages = {},
    variants = {}
  } = config;

  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { showLoading, hideLoading } = useLoading();
  const [isNavigating, setIsNavigating] = useState(false);

  // Memoize functions to prevent infinite loops
  const stableShowLoading = useCallback(showLoading, []);
  const stableHideLoading = useCallback(hideLoading, []);

  useEffect(() => {
    if (!enabled) return;

    // Clear any existing loading state first
    stableHideLoading();
    setIsNavigating(false);

    // Minimal debounce for responsive dummy loading (50ms delay)
    const showLoadingTimer = setTimeout(() => {
      setIsNavigating(true);
      
      // Get the appropriate message and variant for the current route
      const getRouteMessage = (path: string) => {
        // Check for exact match first
        if (messages[path] || defaultMessages[path]) {
          return messages[path] || defaultMessages[path];
        }
        
        // Check for pattern matches (e.g., /game/[id] -> /game)
        const segments = path.split('/').filter(Boolean);
        for (let i = segments.length; i > 0; i--) {
          const partialPath = '/' + segments.slice(0, i).join('/');
          if (messages[partialPath] || defaultMessages[partialPath]) {
            return messages[partialPath] || defaultMessages[partialPath];
          }
        }
        
        return "Memuat halaman...";
      };

      const getRouteVariant = (path: string): "default" | "quiz" | "game" | "minimal" => {
        // Check for exact match first
        if (variants[path] || defaultVariants[path]) {
          return variants[path] || defaultVariants[path];
        }
        
        // Check for pattern matches
        const segments = path.split('/').filter(Boolean);
        for (let i = segments.length; i > 0; i--) {
          const partialPath = '/' + segments.slice(0, i).join('/');
          if (variants[partialPath] || defaultVariants[partialPath]) {
            return variants[partialPath] || defaultVariants[partialPath];
          }
        }
        
        return "default";
      };

      const message = getRouteMessage(pathname);
      const variant = getRouteVariant(pathname);

      stableShowLoading(message, variant);
    }, 50); // Reduced to 50ms for more responsive loading

    const hideLoadingTimer = setTimeout(() => {
      stableHideLoading();
      setIsNavigating(false);
    }, duration + 50); // Adjust total duration accordingly

    return () => {
      clearTimeout(showLoadingTimer);
      clearTimeout(hideLoadingTimer);
      stableHideLoading();
      setIsNavigating(false);
    };
  }, [pathname, searchParams, enabled, duration]); // Removed showLoading and hideLoading from dependencies

  return { isNavigating };
}

// Hook for manual loading control
export function useManualLoading() {
  const { showLoading, hideLoading, setLoadingMessage, setLoadingVariant } = useLoading();

  const startLoading = (
    message?: string, 
    variant?: "default" | "quiz" | "game" | "minimal",
    duration?: number
  ) => {
    showLoading(message, variant);
    
    if (duration) {
      setTimeout(() => {
        hideLoading();
      }, duration);
    }
  };

  return {
    startLoading,
    stopLoading: hideLoading,
    updateMessage: setLoadingMessage,
    updateVariant: setLoadingVariant
  };
}
