export default function Loading() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-900 via-purple-800 to-pink-700 flex items-center justify-center relative overflow-hidden">
      {/* Decorative elements */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden z-0">
        <div className="absolute top-10 left-10 w-72 h-72 bg-pink-500 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob"></div>
        <div className="absolute top-0 right-10 w-72 h-72 bg-yellow-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-2000"></div>
        <div className="absolute -bottom-8 left-20 w-72 h-72 bg-blue-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-4000"></div>
      </div>
      
      <div className="text-center relative z-10">
        <div className="relative">
          <div className="w-24 h-24 bg-white/20 backdrop-blur-md rounded-full flex items-center justify-center mx-auto mb-6 p-1.5 shadow-lg">
            <div className="animate-spin rounded-full h-20 w-20 border-b-4 border-white"></div>
          </div>
          <div className="absolute -top-2 -right-2 w-6 h-6 bg-pink-500 rounded-full animate-pulse shadow-lg"></div>
        </div>
        <h2 className="text-2xl font-bold mb-2 text-white">Memuat...</h2>
        <p className="text-white/80">Mohon tunggu sebentar</p>
      </div>
    </div>
  );
}
