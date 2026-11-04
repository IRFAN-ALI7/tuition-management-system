
"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  useEffect,
  useLayoutEffect,
  useState,
  type FormEvent,
} from "react";
import { useTheme } from "@/components/ThemeProvider";

const API =
  process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000/api";

type Step = "email" | "otp" | "password" | "success";
type AlertType = "error" | "info" | "success";

export default function AdminForgotPasswordPage() {
  const router = useRouter();
  const { clearRole } = useTheme();

  const [step, setStep] = useState<Step>("email");
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [resetToken, setResetToken] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [error, setError] = useState("");
  const [info, setInfo] = useState("");
  const [alertType, setAlertType] = useState<AlertType>("info");
  const [showAlert, setShowAlert] = useState(false);

  const [loading, setLoading] = useState(false);
  const [cooldown, setCooldown] = useState(0);

  useLayoutEffect(() => {
    clearRole();
  }, [clearRole]);

  useEffect(() => {
    if (cooldown <= 0) return;

    const timer = window.setTimeout(
      () => setCooldown((current) => current - 1),
      1000
    );

    return () => window.clearTimeout(timer);
  }, [cooldown]);

  useEffect(() => {
    if (!showAlert) return;

    const timer = window.setTimeout(() => {
      setShowAlert(false);
    }, 5000);

    return () => window.clearTimeout(timer);
  }, [showAlert]);

  function notify(message: string, type: AlertType = "info") {
    setError("");
    setInfo(message);
    setAlertType(type);
    setShowAlert(true);
  }

  function clearAlert() {
    setError("");
    setInfo("");
    setShowAlert(false);
  }

  async function post(
    path: string,
    body: Record<string, string>
  ) {
    const response = await fetch(
      `${API}/auth/password-reset/${path}`,
      {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
      }
    );

    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      throw new Error(
        data.error ?? "Request failed. Please try again."
      );
    }

    return data as {
      message?: string;
      resetToken?: string;
    };
  }

  async function requestOtp(
    event?: FormEvent<HTMLFormElement>,
    resend = false
  ) {
    event?.preventDefault();

    clearAlert();
    setLoading(true);

    const normalizedEmail = email.trim().toLowerCase();

    try {
      const data = await post(resend ? "resend" : "request", {
        email: normalizedEmail,
      });

      setEmail(normalizedEmail);

      setStep("otp");
      setOtp("");
      setCooldown(60);

      notify(
        data.message ??
          "If an active admin account matches and email delivery is available, a verification code will arrive shortly.",
        "success"
      );
    } catch (cause) {
      notify(
        cause instanceof Error
          ? cause.message
          : "Could not request a code. Please try again.",
        "error"
      );
    } finally {
      setLoading(false);
    }
  }

  async function verifyOtp(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    clearAlert();
    setLoading(true);

    try {
      const data = await post("verify", { email, otp });

      if (!data.resetToken) {
        throw new Error(
          "The server did not authorize a password reset. Request a new code."
        );
      }

      setResetToken(data.resetToken);
      setStep("password");
    } catch (cause) {
      notify(
        cause instanceof Error
          ? cause.message
          : "Could not verify the code.",
        "error"
      );
    } finally {
      setLoading(false);
    }
  }

  async function resetPassword(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    clearAlert();

    if (password !== confirmPassword) {
      notify("The passwords do not match.", "error");
      return;
    }

    if (password.length < 12 || password.length > 128) {
      notify(
        "Password must be between 12 and 128 characters.",
        "error"
      );
      return;
    }

    const passwordBytes = new TextEncoder().encode(password).length;

    if (passwordBytes > 72) {
      notify(
        "Password must not exceed 72 UTF-8 bytes. Please use a shorter password.",
        "error"
      );
      return;
    }

    setLoading(true);

    try {
      const data = await post("complete", {
        resetToken,
        password,
      });

      if (!data.message) {
        throw new Error(
          "The server did not confirm the password reset."
        );
      }

      setStep("success");
      setPassword("");
      setConfirmPassword("");
      setResetToken("");

      notify("Your password has been reset successfully.", "success");

      window.setTimeout(() => {
        router.replace("/admin/login");
      }, 2500);
    } catch (cause) {
      notify(
        cause instanceof Error
          ? cause.message
          : "Could not reset the password.",
        "error"
      );
    } finally {
      setLoading(false);
    }
  }

  const inputClass =
    "h-[52px] w-full rounded-xl border border-[#e4e1ee] bg-white px-4 text-[15px] text-[#242747] outline-none transition duration-200 placeholder:text-[#aaa9b8] hover:border-[#d5c8f5] focus-visible:border-[#8063ec] focus-visible:shadow-[0_0_0_4px_#7959e822] dark:border-[#464057] dark:bg-[#1c1a27] dark:text-[#f4f1ff] dark:placeholder:text-[#8e899f] dark:focus-visible:border-[#a18aff] dark:focus-visible:shadow-[0_0_0_4px_#9a80ff2c]";

  const labelClass =
    "grid gap-2 text-[14px] font-semibold text-[#353756] dark:text-[#e0dcf0]";

  const buttonClass =
    "relative flex min-h-[53px] w-full items-center justify-center rounded-xl bg-gradient-to-r from-[#7044ed] to-[#805cf2] px-5 text-[15px] font-bold text-white shadow-[0_8px_18px_#6c4ce32b] transition duration-200 hover:-translate-y-0.5 hover:brightness-105 hover:shadow-[0_11px_22px_#6c4ce33b] active:translate-y-0 disabled:cursor-wait disabled:opacity-70 focus-visible:outline focus-visible:outline-[3px] focus-visible:outline-[#7153e9] focus-visible:outline-offset-[3px]";

  const secondaryButtonClass =
    "min-h-[42px] rounded-lg bg-transparent px-3 text-[13px] font-semibold text-[#6651c3] transition hover:text-[#4f36ad] hover:underline hover:underline-offset-4 focus-visible:outline focus-visible:outline-[3px] focus-visible:outline-[#7153e9] focus-visible:outline-offset-[3px] disabled:cursor-wait disabled:text-[#aaa6b6] dark:text-[#c0afff]";

  const heading =
    step === "email"
      ? "Forgot password?"
      : step === "otp"
        ? "Verify your email"
        : step === "password"
          ? "Create a new password"
          : "Password updated";

  const description =
    step === "email"
      ? "Enter your registered admin email address. We'll send you a one-time verification code."
      : step === "otp"
        ? `Enter the 6-digit verification code sent to ${email}.`
        : step === "password"
          ? "Choose a strong password for your Udaan admin account."
          : "Your admin password has been changed successfully. You can now sign in with your new password.";

  return (
    <main className="relative isolate flex min-h-[100svh] flex-col overflow-hidden bg-gradient-to-br from-[#fcfbff] via-[#f8f6ff] to-[#f2edff] px-4 text-[#111b49] sm:px-6 lg:px-8 dark:from-[#191722] dark:via-[#211e30] dark:to-[#29213b] dark:text-[#f0eef8]">

      {/* Background decoration */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_50%_42%,#eee7ffb0_0%,transparent_62%),radial-gradient(ellipse_at_100%_100%,#e5d8ff75_0%,transparent_38%)] dark:bg-[radial-gradient(ellipse_at_50%_42%,#352b4e80_0%,transparent_65%)]"
      />

      {/* Header */}
      <header className="mx-auto flex min-h-[78px] w-full max-w-[1240px] items-center justify-between border-b border-[#e9e3fa] sm:min-h-[86px] dark:border-[#393448]">

        <Link
          className="flex items-center gap-3 text-inherit no-underline sm:gap-4"
          href="/"
          aria-label="Udaan Learning Centre home"
        >
          <span className="grid size-[44px] shrink-0 place-items-center rounded-[14px] bg-gradient-to-br from-[#6c45f1] to-[#815bf1] text-[25px] text-white shadow-[0_6px_16px_#7650e52b] sm:size-[52px] sm:rounded-[16px] sm:text-[29px]">
            ✳
          </span>

          <span className="grid gap-0.5">
            <strong className="text-[22px] leading-tight tracking-[-0.7px] text-[#101a4a] sm:text-[26px] dark:text-[#f0eef8]">
              Udaan
            </strong>
            <small className="text-[9px] font-semibold tracking-[1.6px] text-[#6d70ae] sm:text-[11px] sm:tracking-[1.8px] dark:text-[#b7a8ee]">
              LEARNING CENTRE
            </small>
          </span>
        </Link>

        <Link
          className="inline-flex min-h-10 items-center gap-1.5 rounded-xl border border-[#e9e3fa] bg-white/90 px-3 text-[12px] font-semibold text-[#6252b5] shadow-sm transition hover:-translate-y-0.5 hover:border-[#d9cff8] hover:bg-[#f3efff] focus-visible:outline focus-visible:outline-[3px] focus-visible:outline-[#7153e9] focus-visible:outline-offset-[3px] sm:min-h-11 sm:px-4 sm:text-[13px] dark:border-[#403a55] dark:bg-[#292538] dark:text-[#c2b3ff] dark:hover:bg-[#342d4b]"
          href="/admin/login"
        >
          <span className="text-base">←</span>
          Back to sign in
        </Link>
      </header>

      {/* Recovery card */}
      <section className="mx-auto my-auto w-full max-w-[465px] py-8 sm:py-10">

        <div className="rounded-[22px] border border-[#e9e4f5] bg-white/[0.96] p-5 shadow-[0_18px_55px_#48378314,0_3px_12px_#48378308] backdrop-blur-sm sm:rounded-[25px] sm:p-8 lg:p-9 dark:border-[#3c374e] dark:bg-[#252231f5] dark:shadow-[0_22px_64px_#09081166]">

          {/* Heading */}
          <div className="mb-7">
            <p className="mb-2 text-[10px] font-bold tracking-[1.7px] text-[#7869b9] sm:text-[11px] dark:text-[#b6a4f2]">
              ADMIN ACCOUNT RECOVERY
            </p>

            <h1 className="text-[27px] font-extrabold leading-tight tracking-[-1px] text-[#111b49] sm:text-[31px] dark:text-[#f4f1ff]">
              {heading}
            </h1>

            <p className="mt-3 text-[14px] leading-[1.7] text-[#777892] sm:text-[15px] dark:text-[#bbb6ce]">
              {description}
            </p>
          </div>

          {/* Email step */}
          {step === "email" && (
            <form
              className="grid gap-5"
              onSubmit={(event) => void requestOtp(event)}
            >
              <label className={labelClass} htmlFor="recovery-email">
                Registered admin email

                <input
                  id="recovery-email"
                  name="email"
                  className={inputClass}
                  autoComplete="email"
                  required
                  type="email"
                  maxLength={254}
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  placeholder="you@example.com"
                />
              </label>

              <button
                className={buttonClass}
                disabled={loading}
                type="submit"
              >
                {loading ? "Sending code..." : "Send OTP"}
                <span className="absolute right-5 text-[21px] font-normal">
                  →
                </span>
              </button>
            </form>
          )}

          {/* OTP step */}
          {step === "otp" && (
            <form
              className="grid gap-5"
              onSubmit={(event) => void verifyOtp(event)}
            >
              <label className={labelClass} htmlFor="recovery-otp">
                6-digit verification code

                <input
                  id="recovery-otp"
                  name="otp"
                  className={`${inputClass} text-center text-[20px] font-bold tracking-[8px]`}
                  autoComplete="one-time-code"
                  required
                  inputMode="numeric"
                  pattern="[0-9]{6}"
                  maxLength={6}
                  value={otp}
                  onChange={(event) =>
                    setOtp(
                      event.target.value.replace(/\D/g, "").slice(0, 6)
                    )
                  }
                  placeholder="000000"
                />
              </label>

              <button
                className={buttonClass}
                disabled={loading || otp.length !== 6}
                type="submit"
              >
                {loading ? "Verifying..." : "Verify code"}
                <span className="absolute right-5 text-[21px] font-normal">
                  →
                </span>
              </button>

              <div className="flex flex-col items-center gap-1">
                <button
                  className={secondaryButtonClass}
                  disabled={loading || cooldown > 0}
                  type="button"
                  onClick={() => void requestOtp(undefined, true)}
                >
                  {cooldown > 0
                    ? `Resend code in ${cooldown}s`
                    : "Resend OTP"}
                </button>

                <button
                  className={secondaryButtonClass}
                  type="button"
                  onClick={() => {
                    setStep("email");
                    setOtp("");
                    setCooldown(0);
                    clearAlert();
                  }}
                >
                  Use a different email
                </button>
              </div>
            </form>
          )}

          {/* New password step */}
          {step === "password" && (
            <form
              className="grid gap-4"
              onSubmit={(event) => void resetPassword(event)}
            >
              <label className={labelClass} htmlFor="new-password">
                New password

                <input
                  id="new-password"
                  name="newPassword"
                  className={inputClass}
                  autoComplete="new-password"
                  required
                  minLength={12}
                  maxLength={128}
                  type="password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  placeholder="At least 12 characters"
                />
              </label>

              <label className={labelClass} htmlFor="confirm-password">
                Confirm new password

                <input
                  id="confirm-password"
                  name="confirmPassword"
                  className={inputClass}
                  autoComplete="new-password"
                  required
                  minLength={12}
                  maxLength={128}
                  type="password"
                  value={confirmPassword}
                  onChange={(event) =>
                    setConfirmPassword(event.target.value)
                  }
                  placeholder="Enter the new password again"
                />
              </label>

              <p className="text-[12px] leading-[1.6] text-[#777892] dark:text-[#aaa5bb]">
                Use 12–128 characters. Passwords must not exceed 72 UTF-8 bytes.
              </p>

              <button
                className={buttonClass}
                disabled={loading}
                type="submit"
              >
                {loading ? "Updating password..." : "Reset password"}
                <span className="absolute right-5 text-[21px] font-normal">
                  →
                </span>
              </button>
            </form>
          )}

          {/* Success step */}
          {step === "success" && (
            <div className="grid gap-5">
              <div className="flex items-center gap-3 rounded-xl border border-[#cfe9d9] bg-[#edf8f1] p-4 text-[#237246] dark:border-[#315d48] dark:bg-[#20352b] dark:text-[#a5e6c1]">
                <span className="grid size-9 shrink-0 place-items-center rounded-full bg-[#d7f1e1] text-[19px] font-bold dark:bg-[#315d48]">
                  ✓
                </span>
                <p className="text-[13px] leading-[1.6]">
                  Password reset successfully.
                </p>
              </div>

              <Link
                className={`${buttonClass} no-underline`}
                href="/admin/login"
              >
                Continue to Admin Login
                <span className="absolute right-5 text-[21px] font-normal">
                  →
                </span>
              </Link>
            </div>
          )}
        </div>

        <p className="mt-5 text-center text-[11px] text-[#9995ae] sm:text-[12px]">
          Secure account recovery · Udaan Learning Centre
        </p>
      </section>

      {/* Centered toast alerts */}
      {showAlert && (
        <div className="pointer-events-none fixed inset-x-0 top-4 z-[100] flex justify-center px-3 sm:top-5 sm:px-4">
          <div
            role={alertType === "error" ? "alert" : "status"}
            className={`pointer-events-auto flex w-full max-w-[460px] items-center gap-3 rounded-2xl border bg-white px-4 py-3.5 shadow-[0_14px_40px_#35205b25] animate-in fade-in slide-in-from-top-3 duration-200 dark:bg-[#292538] ${
              alertType === "error"
                ? "border-[#f2cbd0] dark:border-[#69404a]"
                : alertType === "success"
                  ? "border-[#cfe9d9] dark:border-[#315d48]"
                  : "border-[#e2d7ff] dark:border-[#4b3d67]"
            }`}
          >
            <span
              className={`flex size-9 shrink-0 items-center justify-center rounded-xl text-[17px] font-bold ${
                alertType === "error"
                  ? "bg-[#fff0f1] text-[#b33e50] dark:bg-[#3e252d] dark:text-[#ffc2ca]"
                  : alertType === "success"
                    ? "bg-[#edf8f1] text-[#237246] dark:bg-[#20352b] dark:text-[#a5e6c1]"
                    : "bg-[#f0eaff] text-[#7448e9] dark:bg-[#352b53] dark:text-[#c2afff]"
              }`}
            >
              {alertType === "error"
                ? "!"
                : alertType === "success"
                  ? "✓"
                  : "i"}
            </span>

            <p
              className={`min-w-0 flex-1 text-[13px] font-medium leading-[1.6] ${
                alertType === "error"
                  ? "text-[#9c3d50] dark:text-[#ffc2ca]"
                  : alertType === "success"
                    ? "text-[#237246] dark:text-[#a5e6c1]"
                    : "text-[#514b70] dark:text-[#ded5ff]"
              }`}
            >
              {error || info}
            </p>

            <button
              type="button"
              aria-label="Close alert"
              onClick={() => setShowAlert(false)}
              className="flex size-8 shrink-0 items-center justify-center rounded-full text-[#9290a8] transition hover:bg-[#f2effa] hover:text-[#4c3b85] dark:hover:bg-[#403953]"
            >
              ×
            </button>
          </div>
        </div>
      )}

      {/* Footer */}
      <footer className="mx-auto flex min-h-[54px] w-full max-w-[1240px] items-center justify-between gap-3 border-t border-[#e9e3fa] text-[10px] text-[#9290a7] sm:min-h-[60px] sm:text-[12px] dark:border-[#393448] dark:text-[#aaa5bb]">
        <span>© Udaan Learning Centre</span>
        <span className="text-right">
          Curiosity today. Confidence tomorrow.
        </span>
      </footer>
    </main>
  );
}
