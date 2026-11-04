
interface LoadingStateProps {
  message?: string;
  fullPage?: boolean;
}

export default function LoadingState({
  message = "Please wait...",
  fullPage = false,
}: LoadingStateProps) {
  return (
    <div
      className={`flex flex-col items-center justify-center gap-3 ${
        fullPage ? "min-h-[60vh]" : "min-h-48"
      }`}
    >
      <div className="h-9 w-9 animate-spin rounded-full border-4 border-gray-200 border-t-blue-600 dark:border-gray-700 dark:border-t-blue-400" />

      <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
        {message}
      </p>
    </div>
  );
}
