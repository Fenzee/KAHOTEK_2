"use client";

import { useState } from "react";
import Image from "next/image";
import { Button } from "./button";
import { Trash2, ImageIcon } from "lucide-react";
import FileUpload from "./file-upload";
import { uploadImage } from "@/lib/upload-image";
import { cn } from "@/lib/utils";

interface ImageUploadProps {
  imageUrl: string | null;
  onImageChange: (url: string | null) => void;
  className?: string;
  label?: string;
}

export default function ImageUpload({ 
  imageUrl, 
  onImageChange, 
  className,
  label = "Image" 
}: ImageUploadProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleUploadSuccess = async (file: File) => {
    setIsUploading(true);
    setError(null);
    
    try {
      const url = await uploadImage(file);
      if (url) {
        onImageChange(url);
      } else {
        setError("Failed to upload image. Please try again.");
      }
    } catch (err) {
      console.error("Error uploading image:", err);
      setError("An error occurred while uploading the image.");
    } finally {
      setIsUploading(false);
    }
  };

  const handleRemoveImage = () => {
    onImageChange(null);
  };

  return (
    <div className={cn("space-y-2", className)}>
      <div className="text-sm font-medium text-gray-700">{label}</div>
      
      {imageUrl ? (
        <div className="relative w-full max-w-sm mx-auto">
          <div className="group relative w-full rounded-xl bg-white dark:bg-black ring-1 ring-gray-200 dark:ring-white/10 p-0.5">
            <div className="absolute inset-x-0 -top-px h-px w-full bg-gradient-to-r from-transparent via-blue-500/20 to-transparent" />
            <div className="relative w-full rounded-[10px] bg-gray-50/50 dark:bg-white/[0.02] p-1.5">
              <div className="relative mx-auto w-full overflow-hidden rounded-lg border border-gray-100 dark:border-white/[0.08] bg-white dark:bg-black/50">
                <div className="relative h-[240px] flex items-center justify-center">
                  <Image 
                    src={imageUrl} 
                    alt="Uploaded image"
                    fill
                    className="object-contain"
                  />
                </div>
                <div className="absolute bottom-2 right-2">
                  <Button 
                    variant="destructive" 
                    size="sm"
                    onClick={handleRemoveImage}
                    className="h-8 w-8 p-0"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <FileUpload
          onUploadSuccess={handleUploadSuccess}
          acceptedFileTypes={["image/jpeg", "image/png", "image/gif", "image/webp"]}
          maxFileSize={5 * 1024 * 1024} // 5MB
        />
      )}
      
      {error && (
        <div className="text-sm text-red-500 mt-1">{error}</div>
      )}
      
      {isUploading && (
        <div className="text-sm text-blue-500 mt-1">Uploading image...</div>
      )}
    </div>
  );
} 