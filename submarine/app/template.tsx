"use client";

import { AnimatePresence } from "framer-motion";
import { usePathname } from "next/navigation";
import { PageTransition } from "@/components/ui/page-transition";

export default function Template({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  // Menentukan jenis animasi berdasarkan path
  // Anda bisa menyesuaikan ini sesuai kebutuhan
  const getAnimationType = (path: string) => {
    if (path.includes("/dashboard")) return "fade";
    if (path.includes("/play")) return "slide";
    if (path.includes("/results")) return "zoom";
    return "fade"; // Default animation
  };

  return (
    <AnimatePresence mode="wait">
      <PageTransition key={pathname} animation={getAnimationType(pathname)}>
        {children}
      </PageTransition>
    </AnimatePresence>
  );
} 