export default function Loading() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center">
      <div className="text-center">
        <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-6 animate-pulse">
          <div className="animate-spin rounded-full h-14 w-14 border-b-4 border-white"></div>
        </div>
        <h2 className="text-3xl font-bold mb-2 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
          Memuat...
        </h2>
        <p className="text-gray-500">Mohon tunggu sebentar</p>
      </div>
    </div>
  );
}
