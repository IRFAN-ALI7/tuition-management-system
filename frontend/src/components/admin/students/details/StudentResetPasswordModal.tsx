"use client";

type Props = {
  studentName: string;
  newPassword: string;
  resettingPassword: boolean;
  resetPasswordMessage: string;
  resetPasswordError: string;
  buttonClass: string;
  onPasswordChange: (value: string) => void;
  onSubmit: (event: React.FormEvent<HTMLFormElement>) => void;
  onClose: () => void;
};

export default function StudentResetPasswordModal({
  studentName,
  newPassword,
  resettingPassword,
  resetPasswordMessage,
  resetPasswordError,
  buttonClass,
  onPasswordChange,
  onSubmit,
  onClose,
}: Props) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 p-4 backdrop-blur-sm">
      <section
        className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl dark:border-slate-700 dark:bg-slate-900"
        role="dialog"
        aria-modal="true"
        aria-labelledby="reset-password-title"
      >
        <div className="mb-5 flex items-center justify-between gap-3">
          <div>
            <h2
              id="reset-password-title"
              className="text-xl font-bold text-slate-900 dark:text-white"
            >
              Reset Student Password
            </h2>

            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
              {studentName}
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="rounded-lg px-3 py-2 text-xl text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"
            aria-label="Close"
          >
            ×
          </button>
        </div>

        <form onSubmit={onSubmit} className="space-y-4">
          <label className="block">
            <span className="mb-2 block text-sm font-semibold text-slate-700 dark:text-slate-200">
              New Password
            </span>

            <input
              type="password"
              value={newPassword}
              onChange={(event) => onPasswordChange(event.target.value)}
              placeholder="Enter new password"
              minLength={8}
              maxLength={128}
              autoComplete="new-password"
              required
              className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 dark:border-slate-700 dark:bg-slate-950 dark:text-white"
            />
          </label>

          <p className="text-xs text-slate-500 dark:text-slate-400">
            Password must contain at least 8 characters and must not exceed
            72 UTF-8 bytes.
          </p>

          {resetPasswordError && (
            <p className="rounded-lg bg-rose-50 p-3 text-sm text-rose-700 dark:bg-rose-950/40 dark:text-rose-300">
              {resetPasswordError}
            </p>
          )}

          {resetPasswordMessage && (
            <p className="rounded-lg bg-emerald-50 p-3 text-sm text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300">
              {resetPasswordMessage}
            </p>
          )}

          <div className="flex flex-wrap justify-end gap-3 pt-2">
            <button
              type="button"
              className={buttonClass}
              onClick={onClose}
            >
              Close
            </button>

            <button
              type="submit"
              className="inline-flex items-center justify-center rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-50"
              disabled={resettingPassword || !newPassword}
            >
              {resettingPassword ? "Resetting..." : "Reset Password"}
            </button>
          </div>
        </form>
      </section>
    </div>
  );
}