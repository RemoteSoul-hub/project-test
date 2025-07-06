export default function Loading() {
  return (
    <div className="p-6 text-center">
      <div className="w-12 h-12 border-4 border-blue-200 border-t-blue-500 rounded-full animate-spin mx-auto"></div>
      <p className="mt-2 text-gray-600">Loading infrastructure data...</p>
    </div>
  );
} 