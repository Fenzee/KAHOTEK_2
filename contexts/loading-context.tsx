"use client";

import React, { createContext, useContext, useState, useCallback } from "react";
import { AnimatePresence } from "framer-motion";
import { LoadingAnimation } from "@/components/ui/loading-animation";

interface LoadingState {
  isLoading: boolean;
  message: string;
  variant: "default" | "quiz" | "game" | "minimal";
}

interface LoadingContextType {
  loading: LoadingState;
  showLoading: (message?: string, variant?: "default" | "quiz" | "game" | "minimal") => void;
  hideLoading: () => void;
  setLoadingMessage: (message: string) => void;
  setLoadingVariant: (variant: "default" | "quiz" | "game" | "minimal") => void;
}

const LoadingContext = createContext<LoadingContextType | undefined>(undefined);

export function useLoading() {
  const context = useContext(LoadingContext);
  if (context === undefined) {
    throw new Error("useLoading must be used within a LoadingProvider");
  }
  return context;
}

interface LoadingProviderProps {
  children: React.ReactNode;
}

export function LoadingProvider({ children }: LoadingProviderProps) {
  const [loading, setLoading] = useState<LoadingState>({
    isLoading: false,
    message: "Memuat...",
    variant: "default"
  });

  const showLoading = useCallback((
    message: string = "Memuat...", 
    variant: "default" | "quiz" | "game" | "minimal" = "default"
  ) => {
    setLoading(current => {
      // Prevent unnecessary updates if already loading with same values
      if (current.isLoading && current.message === message && current.variant === variant) {
        return current;
      }
      return {
        isLoading: true,
        message,
        variant
      };
    });
  }, []);

  const hideLoading = useCallback(() => {
    setLoading(current => {
      // Prevent unnecessary updates if already hidden
      if (!current.isLoading) {
        return current;
      }
      return {
        ...current,
        isLoading: false
      };
    });
  }, []);

  const setLoadingMessage = useCallback((message: string) => {
    setLoading(current => {
      // Prevent unnecessary updates if message is the same
      if (current.message === message) {
        return current;
      }
      return {
        ...current,
        message
      };
    });
  }, []);

  const setLoadingVariant = useCallback((variant: "default" | "quiz" | "game" | "minimal") => {
    setLoading(current => {
      // Prevent unnecessary updates if variant is the same
      if (current.variant === variant) {
        return current;
      }
      return {
        ...current,
        variant
      };
    });
  }, []);

  const contextValue: LoadingContextType = {
    loading,
    showLoading,
    hideLoading,
    setLoadingMessage,
    setLoadingVariant
  };

  return (
    <LoadingContext.Provider value={contextValue}>
      {children}
      <AnimatePresence mode="wait">
        {loading.isLoading && (
          <div 
            className="fixed inset-0 bg-white/90 dark:bg-gray-900/90 backdrop-blur-md z-50 flex items-center justify-center"
            style={{
              animation: 'fadeIn 0.2s ease-out'
            }}
          >
            <LoadingAnimation 
              variant={loading.variant}
              message={loading.message}
              size="lg"
            />
          </div>
        )}
      </AnimatePresence>
      <style jsx global>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }
      `}</style>
    </LoadingContext.Provider>
  );
}
