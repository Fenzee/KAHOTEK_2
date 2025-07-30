"use client";

import { motion } from "framer-motion";
import { Loader2, Zap, Trophy, Users } from "lucide-react";

interface LoadingAnimationProps {
  variant?: "default" | "quiz" | "game" | "minimal";
  message?: string;
  size?: "sm" | "md" | "lg";
}

export function LoadingAnimation({ 
  variant = "default", 
  message = "Memuat...",
  size = "md" 
}: LoadingAnimationProps) {
  const sizeClasses = {
    sm: "w-6 h-6",
    md: "w-8 h-8", 
    lg: "w-12 h-12"
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { 
      opacity: 1,
      transition: { 
        duration: 0.15, // Faster entrance
        staggerChildren: 0.05 // Reduced stagger
      }
    },
    exit: { 
      opacity: 0,
      transition: { duration: 0.1 } // Faster exit
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 10 }, // Reduced movement
    visible: { 
      opacity: 1, 
      y: 0
    }
  };

  const itemTransition = { type: "spring" as const, stiffness: 400, damping: 25 }; // Snappier spring
  const pulseTransition = {
    duration: 1.2, // Slightly faster pulse
    repeat: Infinity,
    ease: "easeInOut" as const
  };
  const spinTransition = {
    duration: 1,
    repeat: Infinity,
    ease: "linear" as const
  };

  if (variant === "minimal") {
    return (
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        exit="exit"
        className="flex items-center justify-center"
      >
        <motion.div 
          animate={{ rotate: 360 }}
          transition={spinTransition}
        >
          <Loader2 className={`${sizeClasses[size]} text-blue-500`} />
        </motion.div>
      </motion.div>
    );
  }

  if (variant === "quiz") {
    return (
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        exit="exit"
        className="flex flex-col items-center justify-center space-y-6 p-8"
      >
        <div className="relative">
          <motion.div
            animate={{
              scale: [1, 1.2, 1],
              opacity: [0.7, 1, 0.7]
            }}
            transition={pulseTransition}
            className="absolute inset-0 bg-gradient-to-r from-blue-400 to-purple-400 rounded-full blur-xl opacity-30"
          />
          <motion.div
            animate={{ rotate: 360 }}
            transition={spinTransition}
            className="relative bg-gradient-to-r from-blue-500 to-purple-500 rounded-full p-4"
          >
            <Trophy className="w-8 h-8 text-white" />
          </motion.div>
        </div>
        
        <motion.div 
          variants={itemVariants} 
          transition={itemTransition}
          className="text-center space-y-2"
        >
          <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200">
            Menyiapkan Kuis
          </h3>
          <p className="text-gray-600 dark:text-gray-400">{message}</p>
        </motion.div>

        <motion.div 
          variants={itemVariants}
          transition={itemTransition}
          className="flex space-x-1"
        >
          {[0, 1, 2].map((i) => (
            <motion.div
              key={i}
              className="w-2 h-2 bg-blue-500 rounded-full"
              animate={{
                y: [0, -10, 0],
                opacity: [0.5, 1, 0.5]
              }}
              transition={{
                duration: 1.2,
                repeat: Infinity,
                delay: i * 0.2,
                ease: "easeInOut"
              }}
            />
          ))}
        </motion.div>
      </motion.div>
    );
  }

  if (variant === "game") {
    return (
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        exit="exit"
        className="flex flex-col items-center justify-center space-y-6 p-8"
      >
        <div className="relative">
          <motion.div
            animate={{
              rotate: [0, 360],
              scale: [1, 1.1, 1]
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              ease: "linear"
            }}
            className="bg-gradient-to-r from-green-400 to-blue-400 rounded-full p-4"
          >
            <Users className="w-8 h-8 text-white" />
          </motion.div>
          
          <motion.div
            animate={{
              scale: [1, 1.5, 1],
              opacity: [0.3, 0.7, 0.3]
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              ease: "easeInOut"
            }}
            className="absolute inset-0 bg-gradient-to-r from-green-400 to-blue-400 rounded-full blur-lg"
          />
        </div>
        
        <motion.div 
          variants={itemVariants} 
          transition={itemTransition}
          className="text-center space-y-2"
        >
          <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200">
            Menghubungkan ke Game
          </h3>
          <p className="text-gray-600 dark:text-gray-400">{message}</p>
        </motion.div>

        <motion.div className="flex space-x-2">
          {[0, 1, 2, 3].map((i) => (
            <motion.div
              key={i}
              className="w-3 h-3 bg-gradient-to-r from-green-400 to-blue-400 rounded-full"
              animate={{
                scale: [1, 1.5, 1],
                opacity: [0.4, 1, 0.4]
              }}
              transition={{
                duration: 1.5,
                repeat: Infinity,
                delay: i * 0.3,
                ease: "easeInOut"
              }}
            />
          ))}
        </motion.div>
      </motion.div>
    );
  }

  // Default variant
  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      exit="exit"
      className="flex flex-col items-center justify-center space-y-4 p-6"
    >
      <div className="relative">
        <motion.div
          animate={{ rotate: 360 }}
          transition={spinTransition}
          className="border-4 border-blue-200 border-t-blue-500 rounded-full w-12 h-12"
        />
        <motion.div
          animate={{
            scale: [1, 1.2, 1],
            opacity: [0.7, 1, 0.7]
          }}
          transition={pulseTransition}
          className="absolute inset-0 border-4 border-transparent border-t-purple-400 rounded-full"
        />
      </div>
      
      <motion.div 
        variants={itemVariants} 
        transition={itemTransition}
        className="text-center"
      >
        <p className="text-gray-700 dark:text-gray-300 font-medium">{message}</p>
      </motion.div>
      
      <motion.div 
        variants={itemVariants}
        transition={itemTransition}
        className="flex items-center space-x-1"
      >
        <Zap className="w-4 h-4 text-blue-500" />
        <span className="text-sm text-gray-500 dark:text-gray-400">GolekQuiz</span>
      </motion.div>
    </motion.div>
  );
}
