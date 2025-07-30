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
import { CheckCircle, Image as ImageIcon } from "lucide-react";

export const AnswerTooltip = ({
  correctAnswer,
  imageUrl,
  onImageClick,
}: {
  correctAnswer: string | null;
  imageUrl?: string | null;
  onImageClick?: () => void;
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

  if (!correctAnswer && !imageUrl) return null;

  return (
    <div 
      className="relative mt-2 bg-green-50 p-2.5 rounded-lg border border-green-100 cursor-default hover:bg-green-100 transition-colors"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onMouseMove={handleMouseMove}
    >
      <AnimatePresence mode="wait">
        {isHovered && (
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
            className="absolute -top-20 left-1/2 z-50 flex -translate-x-1/2 flex-col items-center justify-center rounded-md bg-black px-4 py-3 text-xs shadow-xl max-w-[280px] w-max"
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
      
      <p className="text-xs text-gray-500 mb-1 flex items-center">
        <CheckCircle className="w-3 h-3 mr-1 text-green-600" />
        Jawaban Benar:
      </p>
      
      {imageUrl && (
        <div className="mb-2 flex justify-center">
          <div 
            className="relative w-full max-w-[200px] h-28 overflow-hidden rounded-lg border border-gray-100 cursor-pointer hover:opacity-90 transition-opacity"
            onClick={onImageClick}
          >
            <Image 
              src={imageUrl} 
              alt="Answer image"
              className="object-contain"
              fill
              sizes="(max-width: 768px) 100vw, 200px"
            />
            <div className="absolute top-1 right-1 bg-black bg-opacity-50 rounded-full p-1">
              <ImageIcon className="w-3 h-3 text-white" />
            </div>
          </div>
        </div>
      )}
      
      {correctAnswer && (
        <p className="text-sm text-green-800 font-medium line-clamp-2">{correctAnswer}</p>
      )}
    </div>
  );
}; 