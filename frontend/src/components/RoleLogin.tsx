
"use client";

import Link from "next/link";
import Image from "next/image";
import { useEffect, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { useTheme } from "@/components/ThemeProvider";

const API =
  process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000/api";

type Role = "admin" | "student";

function Icon({
  name,
  className = "size-5",
}: {
  name: "users" | "phone" | "lock" | "eye" | "eye-off" | "graduation";
  className?: string;
}) {
  const common = {
    className,
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 1.8,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
    "aria-hidden": true as const,
  };

  switch (name) {
    case "users":
      return (
        <svg {...common}>
          <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
          <circle cx="9" cy="7" r="4" />
          <path d="M22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" />
        </svg>
      );

    case "phone":
      return (
        <svg {...common}>
          <path d="M22 16.92v3a2 2 0 0 1-2.18 2A19.8 19.8 0 0 1 11.2 18.8a19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.1 4.18 2 2 0 0 1 4.08 2h3a2 2 0 0 1 2 1.72l.45 3.05a2 2 0 0 1-.57 1.7L7.1 10.33a16 16 0 0 0 6 6l1.86-1.86a2 2 0 0 1 1.7-.57l3.05.45a2 2 0 0 1 1.29 1.57Z" />
        </svg>
      );

    case "lock":
      return (
        <svg {...common}>
          <rect x="3" y="11" width="18" height="11" rx="2" />
          <path d="M7 11V7a5 5 0 0 1 10 0v4" />
          <path d="M12 15v3" />
        </svg>
      );

    case "eye":
      return (
        <svg {...common}>
          <path d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7S2 12 2 12Z" />
          <circle cx="12" cy="12" r="3" />
        </svg>
      );

    case "eye-off":
      return (
        <svg {...common}>
          <path d="m3 3 18 18" />
          <path d="M10.6 10.6a2 2 0 0 0 2.8 2.8" />
          <path d="M9.9 5.2A10.8 10.8 0 0 1 12 5c6.4 0 10 7 10 7a16 16 0 0 1-3.1 3.9" />
          <path d="M6.2 6.2C3.5 8 2 12 2 12s3.6 7 10 7a10 10 0 0 0 4-.8" />
        </svg>
      );

    case "graduation":
      return (
        <svg {...common}>
          <path d="m2 9 10-5 10 5-10 5L2 9Z" />
          <path d="M6 11v5c3.5 3 8.5 3 12 0v-5M22 9v6" />
        </svg>
      );
  }
}

export default function RoleLogin({ role }: { role: Role }) {
  const router = useRouter();
  const { clearRole } = useTheme();

  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showStudentHelp, setShowStudentHelp] = useState(false);

  const admin = role === "admin";

  useEffect(() => {
    clearRole();
  }, [clearRole]);

  useEffect(() => {
    if (!showStudentHelp) return;

    const timeout = window.setTimeout(() => {
      setShowStudentHelp(false);
    }, 5000);

    return () => window.clearTimeout(timeout);
  }, [showStudentHelp]);

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    setError("");
    setShowStudentHelp(false);
    setLoading(true);

    try {
      const response = await fetch(`${API}/auth/login`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          identifier: identifier.trim(),
          password,
          role,
        }),
      });

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(
          data.error ?? "Sign in failed. Please try again."
        );
      }

      router.replace(admin ? "/admin" : "/student");
      router.refresh();
    } catch (cause) {
      setError(
        cause instanceof Error
          ? cause.message
          : "Sign in failed. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  const inputClass =
    "h-[54px] w-full rounded-xl border border-[#e7e2f1] bg-white pl-[52px] pr-4 text-[15px] text-[#20264f] outline-none transition duration-200 placeholder:text-[#a09eb2] hover:border-[#d5c8f5] focus:border-[#7950ed] focus:ring-4 focus:ring-[#7950ed]/10";

  return (
    <main className="relative isolate flex min-h-screen flex-col overflow-hidden bg-gradient-to-br from-[#fcfbff] via-[#f8f5ff] to-[#f1eaff] px-4 text-[#111b49] sm:px-6 lg:px-8">

      {/* Background */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_80%_12%,#e6dcff9c_0%,transparent_42%),radial-gradient(ellipse_at_0%_85%,#dfd1ff75_0%,transparent_35%)]"
      />

      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 bottom-0 -z-10 hidden h-32 bg-gradient-to-r from-[#e5d8ff] via-[#d8c4ff] to-[#e8d9ff] [clip-path:polygon(0_35%,15%_55%,32%_78%,50%_82%,68%_65%,85%_40%,100%_20%,100%_100%,0_100%)] lg:block"
      />

      {/* Header: desktop and tablet */}
      <header className="relative z-10 mx-auto hidden h-[82px] w-full max-w-[1240px] shrink-0 items-center justify-between border-b border-[#e8e1ff] sm:flex">
        <Link
          href="/"
          aria-label="Udaan Learning Centre home"
          className="flex items-center gap-3 no-underline"
        >
          <span
            className="flex size-12 items-center justify-center rounded-[15px] bg-gradient-to-br from-[#6c45f1] to-[#815bf1] text-[27px] text-white shadow-[0_6px_16px_#7650e52b]"
            aria-hidden="true"
          >
            ✳
          </span>

          <span className="flex flex-col">
            <strong className="text-[25px] leading-tight tracking-[-0.7px] text-[#101a4a]">
              Udaan
            </strong>
            <small className="mt-0.5 text-[10px] font-semibold tracking-[1.8px] text-[#6d55c5]">
              LEARNING CENTRE
            </small>
          </span>
        </Link>

        <Link
          href="/"
          className="inline-flex min-h-[42px] items-center gap-2 rounded-xl border border-[#d9caff] bg-white/90 px-4 text-[13px] font-semibold text-[#653bd7] shadow-sm transition duration-200 hover:-translate-y-0.5 hover:bg-[#f8f4ff] focus-visible:outline-2 focus-visible:outline-offset-3 focus-visible:outline-[#7950ed]"
        >
          <span className="text-[18px] leading-none">←</span>
          Back to home
        </Link>
      </header>

      {/* Main layout */}
      <section className="relative z-10 mx-auto grid w-full max-w-[1240px] flex-1 grid-cols-1 items-center gap-7 py-5 sm:py-7 lg:grid-cols-[0.95fr_1.05fr] lg:gap-12 lg:py-8 xl:gap-16">

        {/* Left content: hidden on phones */}
        <div className="hidden min-w-0 flex-col justify-center lg:flex">
          <div className="mb-5 inline-flex w-fit items-center gap-2.5 rounded-full border border-[#dfd2ff] bg-[#eee7ff]/90 px-4 py-2 text-[14px] font-bold text-[#37208f]">
            <Icon name="graduation" className="size-5" />
            {admin ? "Admin Portal" : "Student / Parent Portal"}
          </div>

          <h1 className="max-w-[560px] text-[clamp(38px,4.2vw,54px)] font-extrabold leading-[1.1] tracking-[-2px] text-[#101a4a]">
            Sign in to your{" "}
            <span className="bg-gradient-to-r from-[#7045ef] to-[#9360ef] bg-clip-text text-transparent">
              {admin ? "admin account" : "learning account"}
            </span>
          </h1>

          <div className="mb-6 mt-4 h-[5px] w-44 rounded-full bg-gradient-to-r from-[#7449ef] to-[#c1a5ff]" />

          <p className="max-w-[470px] text-[17px] leading-[1.7] text-[#555b83]">
            {admin
              ? "Manage your classes, students, attendance and learning centre — all in one place."
              : "Access your attendance, fees, exams and learning progress — all in one place."}
          </p>

          {/* Study illustration */}
          <div className="relative mt-4 h-[290px] w-full max-w-[520px] xl:h-[340px]">
            <Image
              src="/udaan-study-hero.png"
              alt="A beautiful study space with books, plants, a laptop and a sunrise window"
              fill
              priority
              sizes="(max-width: 1200px) 45vw, 520px"
              className="object-contain object-center"
            />
          </div>
        </div>

        {/* Login card */}
        <div className="flex w-full items-center justify-center lg:justify-end">
          <section className="w-full max-w-[510px] rounded-[24px] border border-[#e8defe] bg-white/95 px-5 py-7 shadow-[0_16px_48px_#5c3caa14,0_3px_12px_#7450d109] backdrop-blur-sm transition-shadow duration-300 sm:rounded-[27px] sm:px-9 sm:py-8 lg:px-10 lg:py-9">

            {/* Card icon */}
            <div className="mx-auto mb-4 flex size-[66px] items-center justify-center rounded-[20px] border border-[#e4d7ff] bg-gradient-to-br from-[#f5efff] to-[#eee6ff] text-[#7543ed] shadow-[0_6px_18px_#7d4ce912] sm:size-[72px]">
              {admin ? (
                <span className="text-[32px] font-semibold">▦</span>
              ) : (
                <Icon name="users" className="size-9" />
              )}
            </div>

            <div className="mb-6 text-center sm:mb-7">
              <h2 className="text-[24px] font-extrabold leading-tight tracking-[-0.8px] text-[#101a4a] sm:text-[27px]">
                {admin ? "Admin Login" : "Student / Parent Login"}
              </h2>

              <p className="mx-auto mt-2 max-w-[390px] text-[14px] leading-[1.6] text-[#777894] sm:text-[15px]">
                Enter your registered mobile number and password to continue.
              </p>
            </div>

            {/* Login error */}
            {error && (
              <div
                role="alert"
                className="mb-4 flex items-start gap-3 rounded-xl border border-[#f2cbd0] bg-[#fff1f2] px-4 py-3 text-[13px] leading-5 text-[#a33b4c]"
              >
                <span className="mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full bg-[#fbdde1] font-bold">
                  !
                </span>
                <p>{error}</p>
              </div>
            )}

            <form
              className="grid gap-[18px]"
              onSubmit={(event) => void submit(event)}
            >
              {/* Mobile number */}
              <label
                htmlFor="login-mobile"
                className="grid gap-2 text-[14px] font-bold text-[#171d48]"
              >
                <span className="flex items-center gap-2.5">
                  <Icon name="phone" className="size-5 text-[#7044e9]" />
                  {admin ? "Admin Mobile Number" : "Student Mobile Number"}
                </span>

                <span className="relative block">
                  <Icon
                    name="phone"
                    className="pointer-events-none absolute left-[17px] top-1/2 size-[19px] -translate-y-1/2 text-[#9694ae]"
                  />

                  <input
                    id="login-mobile"
                    name="identifier"
                    className={inputClass}
                    autoComplete="tel"
                    inputMode="numeric"
                    maxLength={15}
                    required
                    type="tel"
                    value={identifier}
                    onChange={(event) => setIdentifier(event.target.value)}
                    placeholder="Enter mobile number"
                  />
                </span>
              </label>

              {/* Password */}
              <label
                htmlFor="login-password"
                className="grid gap-2 text-[14px] font-bold text-[#171d48]"
              >
                <span className="flex items-center gap-2.5">
                  <Icon name="lock" className="size-5 text-[#7044e9]" />
                  Password
                </span>

                <span className="relative block">
                  <Icon
                    name="lock"
                    className="pointer-events-none absolute left-[17px] top-1/2 size-[19px] -translate-y-1/2 text-[#9694ae]"
                  />

                  <input
                    id="login-password"
                    name="password"
                    className={`${inputClass} pr-[52px]`}
                    autoComplete="current-password"
                    required
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    placeholder="Enter your password"
                  />

                  <button
                    type="button"
                    onClick={() => setShowPassword((current) => !current)}
                    aria-label={showPassword ? "Hide password" : "Show password"}
                    className="absolute right-3 top-1/2 flex size-9 -translate-y-1/2 items-center justify-center rounded-full text-[#9290ad] transition hover:bg-[#f1edff] hover:text-[#7044e9] focus-visible:outline-2 focus-visible:outline-[#7950ed]"
                  >
                    <Icon
                      name={showPassword ? "eye-off" : "eye"}
                      className="size-5"
                    />
                  </button>
                </span>
              </label>

              {/* Sign in */}
              <button
                className="relative mt-1 flex min-h-[54px] w-full items-center justify-center rounded-xl bg-gradient-to-r from-[#8041ef] via-[#7543eb] to-[#6234dc] px-5 text-[15px] font-bold text-white shadow-[0_9px_20px_#7442e82c] transition duration-200 hover:-translate-y-0.5 hover:brightness-105 hover:shadow-[0_12px_24px_#7442e840] active:translate-y-0 disabled:cursor-wait disabled:opacity-70"
                disabled={loading}
                type="submit"
              >
                {loading ? "Signing in..." : "Sign in"}
                <span className="absolute right-5 text-[23px] font-normal">
                  →
                </span>
              </button>
            </form>

            {/* Forgot password */}
            <div className="mt-4 text-center">
              {admin ? (
                <Link
                  href="/admin/forgot-password"
                  className="inline-flex min-h-10 items-center rounded-lg px-3 text-[14px] font-bold text-[#6335dc] transition hover:text-[#4520b4] hover:underline hover:underline-offset-4 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#7950ed]"
                >
                  Forgot password?
                </Link>
              ) : (
                <button
                  type="button"
                  onClick={() => {
                    setError("");
                    setShowStudentHelp(true);
                  }}
                  className="inline-flex min-h-10 items-center rounded-lg px-3 text-[14px] font-bold text-[#6335dc] transition hover:text-[#4520b4] hover:underline hover:underline-offset-4 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#7950ed]"
                >
                  Forgot password?
                </button>
              )}
            </div>
          </section>
        </div>
      </section>

      {/* Footer: desktop and tablet */}
      <footer className="relative z-10 mx-auto hidden min-h-[48px] w-full max-w-[1240px] items-center justify-between border-t border-[#e8e1ff] text-[12px] text-[#77769a] sm:flex">
        <span>© Udaan Learning Centre</span>
        <span>Curiosity today. Confidence tomorrow.</span>
      </footer>

      {/* Student forgot-password alert */}
      {showStudentHelp && (
        <div className="pointer-events-none fixed inset-x-0 top-4 z-[100] flex justify-center px-3 sm:top-5 sm:px-4">
          <div
            role="alert"
            className="pointer-events-auto flex w-full max-w-[440px] items-center gap-3 rounded-2xl border border-[#e2d7ff] bg-white px-4 py-3.5 shadow-[0_14px_40px_#35205b25] animate-in fade-in slide-in-from-top-3 duration-200"
          >
            <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-[#f0eaff] text-[20px] font-bold text-[#7448e9]">
              i
            </span>

            <p className="min-w-0 flex-1 text-[13px] font-medium leading-[1.6] text-[#514b70]">
              Please contact your Tuition Admin to reset your password.
            </p>

            <button
              type="button"
              aria-label="Close alert"
              onClick={() => setShowStudentHelp(false)}
              className="flex size-8 shrink-0 items-center justify-center rounded-full text-[#9290a8] transition hover:bg-[#f2effa] hover:text-[#4c3b85]"
            >
              ×
            </button>
          </div>
        </div>
      )}
    </main>
  );
}
