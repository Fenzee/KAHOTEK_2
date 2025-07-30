import { supabase } from "./supabase";
import { v4 as uuidv4 } from "uuid";

export async function uploadImage(file: File, folder: string = "quiz_images"): Promise<string | null> {
  try {
    // Generate a unique file name
    const fileExt = file.name.split(".").pop();
    const fileName = `${uuidv4()}.${fileExt}`;
    const filePath = `${folder}/${fileName}`;

    // Upload the file to Supabase storage
    const { error } = await supabase.storage
      .from("quiz_images")
      .upload(filePath, file);

    if (error) {
      console.error("Error uploading image:", error);
      return null;
    }

    // Get the public URL
    const { data } = supabase.storage
      .from("quiz_images")
      .getPublicUrl(filePath);

    return data?.publicUrl || null;
  } catch (error) {
    console.error("Error in uploadImage:", error);
    return null;
  }
}

export function getImageNameFromUrl(url: string | null): string {
  if (!url) return "No image";
  
  try {
    const urlObj = new URL(url);
    const pathParts = urlObj.pathname.split("/");
    const fileName = pathParts[pathParts.length - 1];
    
    // Return just the filename without extension
    return fileName.split(".")[0].substring(0, 8) + "...";
  } catch (e) {
    return "Invalid URL";
  }
} 