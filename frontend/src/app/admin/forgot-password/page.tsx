
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

    setError("");
    setInfo("");
    setLoading(true);

    const normalizedEmail = email.trim().toLowerCase();

    try {
      const data = await post(resend ? "resend" : "request", {
        email: normalizedEmail,
      });

      setEmail(normalizedEmail);

      setInfo(
        data.message ??
          "If an active admin account matches and email delivery is available, a verification code will arrive shortly."
      );

      setStep("otp");
      setOtp("");
      setCooldown(60);
    } catch (cause) {
      setError(
        cause instanceof Error
          ? cause.message
          : "Could not request a code. Please try again."
      );
    } finally {
      setLoading(false);
    }
  }

  async function verifyOtp(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setError("");
    setInfo("");
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
      setError(
        cause instanceof Error
          ? cause.message
          : "Could not verify the code."
      );
    } finally {
      setLoading(false);
    }
  }

  async function resetPassword(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setError("");
    setInfo("");

    if (password !== confirmPassword) {
      setError("The passwords do not match.");
      return;
    }

    if (password.length < 12 || password.length > 128) {
      setError("Password must be between 12 and 128 characters.");
      return;
    }

    const passwordBytes = new TextEncoder().encode(password).length;

    if (passwordBytes > 72) {
      setError(
        "Password must not exceed 72 UTF-8 bytes. Please use a shorter password."
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
      setInfo("Password reset successfully.");
      setPassword("");
      setConfirmPassword("");
      setResetToken("");

      window.setTimeout(() => {
        router.replace("/admin/login");
      }, 1600);
    } catch (cause) {
      setError(
        cause instanceof Error
          ? cause.message
          : "Could not reset the password."
      );
    } finally {
      setLoading(false);
    }
  }

  const inputClass =
    "h-[52px] w-full rounded-xl border border-[#e4e1ee] bg-white px-[15px] text-[15px] text-[#242747] outline-none placeholder:text-[#aaa9b8] focus-visible:border-[#8063ec] focus-visible:shadow-[0_0_0_4px_#7959e822] dark:border-[#464057] dark:bg-[#1c1a27] dark:text-[#f4f1ff] dark:placeholder:text-[#8e899f] dark:focus-visible:border-[#a18aff] dark:focus-visible:shadow-[0_0_0_4px_#9a80ff2c]";

  const labelClass =
    "grid gap-2 text-sm font-bold text-[#353756] dark:text-[#e0dcf0]";

  const buttonClass =
    "relative mt-[3px] h-[54px] rounded-xl bg-[linear-gradient(105deg,#6945ed,#805cf2)] text-[15px] text-white shadow-[0_8px_18px_#6c4ce32b] transition-[transform,box-shadow,filter] hover:-translate-y-px hover:brightness-[1.04] hover:shadow-[0_11px_22px_#6c4ce33b] active:translate-y-px active:shadow-[0_4px_10px_#6c4ce326] focus-visible:outline focus-visible:outline-[3px] focus-visible:outline-[#7153e9] focus-visible:outline-offset-[3px] disabled:cursor-wait disabled:opacity-[.7] disabled:shadow-none";

  const secondaryButtonClass =
    "min-h-[42px] rounded-[9px] border-0 bg-transparent text-sm font-semibold text-[#6651c3] hover:text-[#4f36ad] hover:underline hover:underline-offset-[3px] focus-visible:outline focus-visible:outline-[3px] focus-visible:outline-[#7153e9] focus-visible:outline-offset-[3px] disabled:cursor-wait disabled:text-[#aaa6b6] dark:text-[#c0afff]";

  return (
    <main className="flex min-h-[100svh] flex-col bg-[radial-gradient(ellipse_at_50%_44%,#f1edff_0%,#f8f6ff_37%,transparent_72%),linear-gradient(135deg,#fbfaff_0%,#f8f6ff_56%,#f2edff_100%)] px-[clamp(18px,7vw,112px)] text-[#111b49] dark:bg-[radial-gradient(ellipse_at_50%_44%,#29233d_0%,#201d2d_42%,transparent_76%),linear-gradient(135deg,#191722,#211e30_60%,#29213b)] dark:text-[#f0eef8] max-[560px]:px-[18px]">
      <header className="mx-auto flex min-h-[94px] w-full max-w-[1440px] items-center justify-between border-b border-[#e9e3fa] dark:border-[#393448] max-[560px]:min-h-[76px]">
        <Link
          className="flex items-center gap-[17px] text-inherit no-underline [&>span:last-child]:grid [&>span:last-child]:gap-[3px] [&_strong]:text-[29px] [&_strong]:leading-[1.15] [&_strong]:tracking-[-0.8px] [&_strong]:text-[#101a4a] [&_small]:mt-0.5 [&_small]:text-[13px] [&_small]:tracking-[2px] [&_small]:text-[#6d70ae] max-[560px]:[&_strong]:text-[19px] max-[560px]:[&_small]:text-[9px] dark:[&_strong]:text-[#f0eef8]"
          href="/"
        >
          <span className="grid size-[60px] shrink-0 place-items-center rounded-2xl bg-gradient-to-br from-[#6c45f1] to-[#815bf1] text-[34px] text-white max-[560px]:size-10 max-[560px]:text-[23px]">
            ✳
          </span>
          <span>
            <strong>Udaan</strong>
            <small>LEARNING CENTRE</small>
          </span>
        </Link>

        <Link
          className="inline-flex min-h-11 items-center rounded-xl border border-[#e9e3fa] bg-[#ffffffd9] px-[15px] text-sm text-[#6252b5] transition-[background,border-color,transform] hover:-translate-y-px hover:border-[#d9cff8] hover:bg-[#f3efff] focus-visible:outline focus-visible:outline-[3px] focus-visible:outline-[#7153e9] focus-visible:outline-offset-[3px] dark:border-[#403a55] dark:bg-[#292538] dark:text-[#c2b3ff] dark:hover:border-[#605483] dark:hover:bg-[#342d4b] max-[560px]:min-h-10 max-[560px]:px-[11px] max-[560px]:text-[13px]"
          href="/admin/login"
        >
          ← Back to sign in
        </Link>
      </header>

      <section className="mx-auto my-[clamp(36px,7vh,76px)] w-full max-w-[480px] rounded-[22px] border border-[#e9e4f5] bg-[#fffffff2] p-[clamp(28px,5vw,42px)] text-[#111b49] shadow-[0_20px_60px_#48378314,0_3px_12px_#48378308] dark:border-[#3c374e] dark:bg-[#252231f5] dark:text-[#f0eef8] dark:shadow-[0_22px_64px_#09081166] max-[560px]:my-[34px] max-[560px]:rounded-[19px] max-[560px]:px-[22px] max-[560px]:py-[27px]">
        <span
          className="mb-[21px] grid size-[54px] place-items-center rounded-2xl bg-[#f0ebff] text-[23px] text-[#704ee8] dark:bg-[#352b53] dark:text-[#c2afff]"
          aria-hidden="true"
        >
          ▦
        </span>

        <div className="text-[11px] tracking-[1.4px] text-[#7869b9]">
          ADMIN ACCOUNT RECOVERY
        </div>

        <h1 className="mt-[10px] mb-2 text-[clamp(27px,5vw,32px)] leading-[1.18] tracking-[-1px] text-[#111b49] dark:text-[#f4f1ff]">
          {step === "email"
            ? "Forgot password?"
            : step === "otp"
              ? "Verify your email"
              : step === "password"
                ? "Create a new password"
                : "Password updated"}
        </h1>

        <p className="mt-0 mb-[25px] text-[15px] leading-[1.6] text-[#777892] dark:text-[#bbb6ce]">
          {step === "email"
            ? "Enter the registered admin email address to request a one-time verification code."
            : step === "otp"
              ? `Enter the 6-digit code sent to ${email}.`
              : step === "password"
                ? "Choose a strong password for your Udaan admin account."
                : "Your password has been changed. You’ll be redirected to Admin Login."}
        </p>

        {error && (
          <div
            className="mb-[18px] rounded-[11px] border border-[#f2dadd] bg-[#fff2f3] px-[14px] py-[13px] text-sm leading-[1.55] text-[#9c3d50] dark:border-[#69404a] dark:bg-[#3e252d] dark:text-[#ffc2ca]"
            role="alert"
          >
            <span className="mr-2 font-extrabold">!</span>
            {error}
          </div>
        )}

        {info && (
          <div
            className={
              step === "success"
                ? "mb-[18px] rounded-[11px] border border-[#cfe9d9] bg-[#edf8f1] p-[14px] text-sm leading-[1.5] text-[#237246] dark:border-[#315d48] dark:bg-[#20352b] dark:text-[#a5e6c1]"
                : "mb-[18px] rounded-[11px] border border-[#e5dcff] bg-[#f4f0ff] px-[14px] py-[13px] text-sm leading-[1.55] text-[#554a88] dark:border-[#4b3d67] dark:bg-[#302941] dark:text-[#ded5ff]"
            }
            role="status"
          >
            {info}
          </div>
        )}

        {step === "email" && (
          <form
            className="grid gap-[17px]"
            onSubmit={(event) => void requestOtp(event)}
          >
            <label className={labelClass}>
              Registered admin email
              <input
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
              {loading ? "Sending code…" : "Send OTP"}
              <b className="absolute top-[14px] right-[18px] text-[19px]">
                →
              </b>
            </button>
          </form>
        )}

        {step === "otp" && (
          <form
            className="grid gap-[17px]"
            onSubmit={(event) => void verifyOtp(event)}
          >
            <label className={labelClass}>
              6-digit verification code
              <input
                className={inputClass}
                autoComplete="one-time-code"
                required
                inputMode="numeric"
                pattern="[0-9]{6}"
                maxLength={6}
                value={otp}
                onChange={(event) =>
                  setOtp(event.target.value.replace(/\D/g, "").slice(0, 6))
                }
                placeholder="000000"
              />
            </label>

            <button
              className={buttonClass}
              disabled={loading || otp.length !== 6}
              type="submit"
            >
              {loading ? "Verifying…" : "Verify code"}
              <b className="absolute top-[14px] right-[18px] text-[19px]">
                →
              </b>
            </button>

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
              className="min-h-[42px] rounded-[9px] border-0 bg-transparent text-sm font-semibold text-[#6651c3] hover:text-[#4f36ad] hover:underline hover:underline-offset-[3px] focus-visible:outline focus-visible:outline-[3px] focus-visible:outline-[#7153e9] focus-visible:outline-offset-[3px] dark:text-[#c0afff]"
              type="button"
              onClick={() => {
                setStep("email");
                setError("");
                setInfo("");
                setOtp("");
                setCooldown(0);
              }}
            >
              Use a different email
            </button>
          </form>
        )}

        {step === "password" && (
          <form
            className="grid gap-[17px]"
            onSubmit={(event) => void resetPassword(event)}
          >
            <label className={labelClass}>
              New password
              <input
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

            <label className={labelClass}>
              Confirm new password
              <input
                className={inputClass}
                autoComplete="new-password"
                required
                minLength={12}
                maxLength={128}
                type="password"
                value={confirmPassword}
                onChange={(event) => setConfirmPassword(event.target.value)}
                placeholder="Enter the new password again"
              />
            </label>

            <p className="text-xs leading-[1.5] text-[#777892] dark:text-[#aaa5bb]">
              Use 12–128 characters. Passwords must not exceed 72 UTF-8 bytes.
            </p>

            <button
              className={buttonClass}
              disabled={loading}
              type="submit"
            >
              {loading ? "Updating password…" : "Reset password"}
              <b className="absolute top-[14px] right-[18px] text-[19px]">
                →
              </b>
            </button>
          </form>
        )}

        {step === "success" && (
          <Link
            className="relative mt-[3px] flex h-[54px] w-full items-center justify-center rounded-xl bg-[linear-gradient(105deg,#6945ed,#805cf2)] text-[15px] text-white no-underline shadow-[0_8px_18px_#6c4ce32b] focus-visible:outline focus-visible:outline-[3px] focus-visible:outline-[#7153e9] focus-visible:outline-offset-[3px]"
            href="/admin/login"
          >
            Continue to Admin Login
            <b className="absolute top-[14px] right-[18px] text-[19px]">
              →
            </b>
          </Link>
        )}
      </section>

      <footer className="mx-auto flex min-h-[62px] w-full max-w-[1440px] items-center justify-between border-t border-[#e9e3fa] text-xs text-[#9290a7] dark:border-[#393448] dark:text-[#aaa5bb] max-[560px]:min-h-[58px] max-[560px]:gap-3 max-[560px]:text-[11px]">
        <span>© Udaan Learning Centre</span>
        <span>Curiosity today. Confidence tomorrow.</span>
      </footer>
    </main>
  );
}
