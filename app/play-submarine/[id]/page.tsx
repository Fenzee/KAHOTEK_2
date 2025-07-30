"use client";

import { use, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";

function PlaySubmarinePageContent({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const resolvedParams = use(params);
  const router = useRouter();
  const searchParams = useSearchParams();
  const participantId = searchParams.get("participant");

  useEffect(() => {
    // Redirect to the submarine implementation
    const submarineUrl = `/play-active/${resolvedParams.id}${participantId ? `?participant=${participantId}` : ''}`;
    
    // Use replace to avoid adding to browser history
    router.replace(submarineUrl);
  }, [resolvedParams.id, participantId, router]);

  // Show loading while redirecting
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-purple-600 mx-auto mb-4"></div>
        <p className="text-lg text-gray-600 dark:text-gray-300">
          Memuat permainan submarine...
        </p>
      </div>
    </div>
  );
}

export default function PlaySubmarinePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  return <PlaySubmarinePageContent params={params} />;
}