type Props = {
  authenticated: boolean;
};

export default function AdminPageFooter({ authenticated }: Props) {
  return (
    <footer className="flex flex-col justify-between gap-2 border-t border-gray-200 px-5 py-4 text-xs text-gray-500 dark:border-gray-800 sm:flex-row sm:items-center">
      <span>© 2026 Udaan Learning Centre</span>

      <span className="flex items-center gap-2">
        <i
          className={`h-2 w-2 rounded-full ${
            authenticated ? "bg-green-500" : "bg-amber-500"
          }`}
        />

        {authenticated ? "Connected to Udaan API" : "Sign in required"}

        <b>·</b>

        v1.0.0
      </span>
    </footer>
  );
}