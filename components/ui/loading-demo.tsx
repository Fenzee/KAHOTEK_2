"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { useManualLoading } from "@/hooks/use-route-loading";
import { motion } from "framer-motion";
import { Play, Trophy, Users, Zap } from "lucide-react";

export function LoadingDemo() {
  const { startLoading, stopLoading, updateMessage, updateVariant } = useManualLoading();
  const [isVisible, setIsVisible] = useState(false);

  const demoLoadings = [
    {
      name: "Default Loading",
      variant: "default" as const,
      message: "Memuat halaman...",
      duration: 2000,
      icon: Zap,
      color: "bg-blue-500"
    },
    {
      name: "Quiz Loading", 
      variant: "quiz" as const,
      message: "Menyiapkan kuis...",
      duration: 2500,
      icon: Trophy,
      color: "bg-purple-500"
    },
    {
      name: "Game Loading",
      variant: "game" as const, 
      message: "Menghubungkan ke game...",
      duration: 3000,
      icon: Users,
      color: "bg-green-500"
    },
    {
      name: "Minimal Loading",
      variant: "minimal" as const,
      message: "Loading...",
      duration: 1500,
      icon: Play,
      color: "bg-gray-500"
    }
  ];

  const handleDemoLoading = (demo: typeof demoLoadings[0]) => {
    startLoading(demo.message, demo.variant, demo.duration);
  };

  if (!isVisible) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="fixed bottom-6 right-6 z-40"
      >
        <Button
          onClick={() => setIsVisible(true)}
          className="bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white shadow-lg hover:shadow-xl transition-all duration-300"
        >
          <Zap className="w-4 h-4 mr-2" />
          Demo Loading
        </Button>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      className="fixed bottom-6 right-6 bg-white dark:bg-gray-800 rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-700 p-6 z-40 w-80"
    >
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200">
          Loading Animations Demo
        </h3>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setIsVisible(false)}
          className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
        >
          ✕
        </Button>
      </div>

      <div className="space-y-3">
        {demoLoadings.map((demo, index) => (
          <motion.div
            key={demo.name}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.1 }}
          >
            <Button
              onClick={() => handleDemoLoading(demo)}
              className="w-full justify-start text-left hover:scale-105 transition-transform duration-200"
              variant="outline"
            >
              <div className={`w-3 h-3 rounded-full ${demo.color} mr-3`} />
              <demo.icon className="w-4 h-4 mr-2" />
              <div>
                <div className="font-medium">{demo.name}</div>
                <div className="text-xs text-gray-500 dark:text-gray-400">
                  {demo.message}
                </div>
              </div>
            </Button>
          </motion.div>
        ))}
      </div>

      <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
        <div className="flex gap-2">
          <Button
            onClick={stopLoading}
            variant="outline"
            size="sm"
            className="flex-1"
          >
            Stop Loading
          </Button>
          <Button
            onClick={() => updateMessage("Pesan custom...")}
            variant="outline"
            size="sm"
            className="flex-1"
          >
            Update Message
          </Button>
        </div>
      </div>

      <div className="mt-3 text-xs text-gray-500 dark:text-gray-400 text-center">
        Klik tombol untuk melihat animasi loading yang berbeda
      </div>
    </motion.div>
  );
}
