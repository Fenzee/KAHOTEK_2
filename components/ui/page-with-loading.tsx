"use client";

import { useEffect, Suspense } from "react";
import { PageTransition } from "./page-transition";
import { useRouteLoading } from "@/hooks/use-route-loading";

interface PageWithLoadingProps {
  children: React.ReactNode;
  animation?: "fade" | "slide" | "zoom" | "slideUp" | "slideDown" | "scaleRotate" | "none";
  enableRouteLoading?: boolean;
  loadingDuration?: number;
  customLoadingMessage?: string;
  customLoadingVariant?: "default" | "quiz" | "game" | "minimal";
}

function PageWithLoadingContent({
  children,
  animation = "fade",
  enableRouteLoading = true,
  loadingDuration = 600,
  customLoadingMessage,
  customLoadingVariant
}: PageWithLoadingProps) {
  // Always show dummy loading for better UX
  useRouteLoading({
    enabled: enableRouteLoading,
    duration: loadingDuration,
    ...(customLoadingMessage && { 
      messages: { ["/"]: customLoadingMessage } 
    }),
    ...(customLoadingVariant && { 
      variants: { ["/"]: customLoadingVariant } 
    })
  });

  return (
    <PageTransition 
      animation={animation}
      duration={0.3} // Reduced duration for smoother transitions
    >
      {children}
    </PageTransition>
  );
}

export function PageWithLoading(props: PageWithLoadingProps) {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">{props.customLoadingMessage || "Memuat halaman..."}</p>
        </div>
      </div>
    }>
      <PageWithLoadingContent {...props} />
    </Suspense>
  );
}

// Specialized components for different page types
export function QuizPageWithLoading({ children, ...props }: Omit<PageWithLoadingProps, 'customLoadingVariant'>) {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Memuat kuis...</p>
        </div>
      </div>
    }>
      <PageWithLoadingContent 
        {...props}
        customLoadingVariant="quiz"
        animation="slideUp"
      >
        {children}
      </PageWithLoadingContent>
    </Suspense>
  );
}

export function GamePageWithLoading({ children, ...props }: Omit<PageWithLoadingProps, 'customLoadingVariant'>) {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Menghubungkan ke game...</p>
        </div>
      </div>
    }>
      <PageWithLoadingContent 
        {...props}
        customLoadingVariant="game"
        animation="scaleRotate"
      >
        {children}
      </PageWithLoadingContent>
    </Suspense>
  );
}

export function DashboardPageWithLoading({ children, ...props }: Omit<PageWithLoadingProps, 'customLoadingVariant'>) {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Memuat dashboard...</p>
        </div>
      </div>
    }>
      <PageWithLoadingContent 
        {...props}
        customLoadingVariant="default"
        animation="fade"
      >
        {children}
      </PageWithLoadingContent>
    </Suspense>
  );
}
