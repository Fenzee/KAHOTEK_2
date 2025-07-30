import { LoadingAnimation } from "@/components/ui/loading-animation";

export default function Loading() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-[#1a472a] via-[#2d5a3d] to-[#4a7c59] flex items-center justify-center">
      <div className="text-center text-white">
        <LoadingAnimation />
        <h2 className="text-2xl font-bold mb-2 mt-6">Memuat Kapal Selam...</h2>
        <p className="text-green-200">Bersiap untuk menyelam ke kedalaman laut!</p>
      </div>
    </div>
  );
}