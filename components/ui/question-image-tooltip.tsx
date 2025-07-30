"use client";

import React, { useState } from "react";
import Image from "next/image";
import {
  motion,
  useTransform,
  AnimatePresence,
  useMotionValue,
  useSpring,
} from "framer-motion";
import { CheckCircle } from "lucide-react";

export const QuestionImageTooltip = ({
  imageUrl,
  correctAnswer,
  onClick,
}: {
  imageUrl: string;
  correctAnswer: string | null;
  onClick?: () => void;
}) => {
  const [isHovered, setIsHovered] = useState<boolean>(false);
  const springConfig = { stiffness: 100, damping: 5 };
  const x = useMotionValue(0);
  const rotate = useSpring(
    useTransform(x, [-100, 100], [-15, 15]),
    springConfig,
  );
  const translateX = useSpring(
    useTransform(x, [-100, 100], [-20, 20]),
    springConfig,
  );
  
  const handleMouseMove = (event: React.MouseEvent<HTMLDivElement>) => {
    const rect = event.currentTarget.getBoundingClientRect();
    const halfWidth = rect.width / 2;
    x.set(event.clientX - rect.left - halfWidth);
  };

  return (
    <div className="w-full flex flex-col items-center">
      <div 
        className="group relative w-full max-w-xs mx-auto"
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        onMouseMove={handleMouseMove}
      >
        <AnimatePresence mode="wait">
          {isHovered && correctAnswer && (
            <motion.div
              initial={{ opacity: 0, y: 20, scale: 0.6 }}
              animate={{
                opacity: 1,
                y: 0,
                scale: 1,
                transition: {
                  type: "spring",
                  stiffness: 260,
                  damping: 10,
                },
              }}
              exit={{ opacity: 0, y: 20, scale: 0.6 }}
              style={{
                translateX: translateX,
                rotate: rotate,
              }}
              className="absolute -top-24 left-1/2 z-50 flex -translate-x-1/2 flex-col items-center justify-center rounded-md bg-black px-4 py-3 text-xs shadow-xl max-w-[280px] w-max"
            >
              <div className="absolute inset-x-10 -bottom-px z-30 h-px w-[20%] bg-gradient-to-r from-transparent via-emerald-500 to-transparent" />
              <div className="absolute -bottom-px left-10 z-30 h-px w-[40%] bg-gradient-to-r from-transparent via-sky-500 to-transparent" />
              <div className="flex items-center text-xs text-emerald-400 mb-1">
                <CheckCircle className="w-3 h-3 mr-1" />
                Jawaban Benar:
              </div>
              <div className="relative z-30 text-sm font-medium text-white text-center break-words">
                {correctAnswer}
              </div>
              <div className="absolute bottom-[-8px] left-1/2 transform -translate-x-1/2 w-4 h-4 bg-black rotate-45"></div>
            </motion.div>
          )}
        </AnimatePresence>
        
        <div 
          className="relative w-full h-36 overflow-hidden rounded-lg border border-gray-100 cursor-pointer hover:opacity-90 transition-opacity"
          onClick={onClick}
        >
          <Image 
            src={imageUrl} 
            alt="Question image"
            className="object-contain"
            fill
            sizes="(max-width: 768px) 100vw, 50vw"
          />
            </div>
          </div>
        </div>
  );
}; 