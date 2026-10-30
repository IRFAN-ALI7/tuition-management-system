"use client";

import Link from "next/link";
import { useLayoutEffect, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { useTheme } from "@/components/ThemeProvider";

const API = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000/api";
type Role = "admin" | "student";

export default function RoleLogin({ role }: { role: Role }) {
  const router = useRouter();
  const { clearRole } = useTheme();
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [help, setHelp] = useState("");
  const [loading, setLoading] = useState(false);
  const admin = role === "admin";

  useLayoutEffect(() => {
    clearRole();
  }, [clearRole]);

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");
    setHelp("");
    setLoading(true);

    try {
      const response = await fetch(`${API}/auth/login`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ identifier, password, role }),
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

  return (
    <main className="flex min-h-[100svh] flex-col bg-[radial-gradient(ellipse_at_50%_44%,#f1edff_0%,#f8f6ff_37%,transparent_72%),linear-gradient(135deg,#fbfaff_0%,#f8f6ff_56%,#f2edff_100%)] px-[clamp(18px,7vw,112px)] text-[#111b49] dark:bg-[radial-gradient(ellipse_at_50%_44%,#29233d_0%,#201d2d_42%,transparent_76%),linear-gradient(135deg,#191722,#211e30_60%,#29213b)] dark:text-[#f0eef8] max-[560px]:px-[18px]">
      {/* Header */}
      <header className="mx-auto flex min-h-[94px] w-full max-w-[1440px] items-center justify-between border-b border-[#e9e3fa] dark:border-[#393448] max-[560px]:min-h-[76px]">
        <Link
          className="flex items-center gap-3 [&_strong]:text-[#111b49] dark:[&_strong]:text-[#f4f1ff] [&_small]:text-[#7775b2] max-[560px]:[&_strong]:text-[19px] max-[560px]:[&_small]:text-[9px]"
          href="/"
        >
          <span className="grid size-12 place-items-center rounded-2xl bg-[#ede7ff] text-[26px] font-bold text-[#704ee8] dark:bg-[#352b53] dark:text-[#c2afff] max-[560px]:size-10 max-[560px]:text-[23px]">
            ✳
          </span>
          <span className="flex flex-col">
            <strong className="text-2xl font-extrabold tracking-tight">
              Udaan
            </strong>
            <small className="text-[10px] font-semibold tracking-[1.5px]">
              LEARNING CENTRE
            </small>
          </span>
        </Link>

        <Link
          className="inline-flex min-h-11 items-center rounded-xl border border-[#e9e3fa] bg-[#ffffffd9] px-[15px] text-sm text-[#6252b5] transition-[background,border-color,transform] hover:-translate-y-px hover:border-[#d9cff8] hover:bg-[#f3efff] focus-visible:outline focus-visible:outline-[3px] focus-visible:outline-[#7153e9] focus-visible:outline-offset-[3px] dark:border-[#403a55] dark:bg-[#292538] dark:text-[#c2b3ff] dark:hover:border-[#605483] dark:hover:bg-[#342d4b] max-[560px]:min-h-10 max-[560px]:px-[11px] max-[560px]:text-[13px]"
          href="/"
        >
          ← Back to home
        </Link>
      </header>

      {/* Login Card */}
      <section className="mx-auto my-[clamp(36px,7vh,76px)] w-full max-w-[480px] rounded-[22px] border border-[#e9e4f5] bg-[#fffffff2] p-[clamp(28px,5vw,42px)] shadow-[0_20px_60px_#48378314,0_3px_12px_#48378308] dark:border-[#3c374e] dark:bg-[#252231f5] dark:text-[#f0eef8] dark:shadow-[0_22px_64px_#09081166] max-[560px]:my-[34px] max-[560px]:rounded-[19px] max-[560px]:px-[22px] max-[560px]:py-[27px]">
        <span
          className={`mb-[21px] grid size-[54px] place-items-center rounded-2xl text-[23px] ${
            admin
              ? "bg-[#f0ebff] text-[#704ee8] dark:bg-[#352b53] dark:text-[#c2afff]"
              : "bg-[#eaf7ef] text-[#289f62] dark:bg-[#233b30] dark:text-[#8cddb0]"
          }`}
        >
          {admin ? "▦" : "♙"}
        </span>

        <div className="text-[11px] tracking-[1.4px] text-[#7869b9]">
          UDAAN LEARNING CENTRE
        </div>

        <h1 className="mt-[10px] mb-2 text-[clamp(27px,5vw,32px)] leading-[1.18] tracking-[-1px] text-[#111b49] dark:text-[#f4f1ff]">
          {admin ? "Admin Login" : "Student / Parent Login"}
        </h1>

        <p className="mt-0 mb-[25px] text-[15px] leading-[1.6] text-[#777892] dark:text-[#bbb6ce]">
          {admin
            ? "Sign in to manage classes, students and attendance."
            : "Sign in to check attendance, fees and learning progress."}
        </p>

        {error && (
          <div
            role="alert"
            className="mb-[18px] rounded-[11px] border border-[#f2dadd] bg-[#fff2f3] px-[14px] py-[13px] text-sm leading-[1.55] text-[#9c3d50] dark:border-[#69404a] dark:bg-[#3e252d] dark:text-[#ffc2ca]"
          >
            <span className="mr-2 font-extrabold">!</span>
            {error}
          </div>
        )}

        {help && (
          <div
            role="status"
            className="mb-[18px] rounded-[11px] border border-[#e5dcff] bg-[#f4f0ff] px-[14px] py-[13px] text-sm leading-[1.55] text-[#554a88] dark:border-[#4b3d67] dark:bg-[#302941] dark:text-[#ded5ff]"
          >
            {help}
          </div>
        )}

        <form
          className="grid gap-[18px]"
          onSubmit={(event) => void submit(event)}
        >
          {/* Identifier */}
          <label className="grid gap-2 text-sm leading-[1.4] font-bold text-[#353756] dark:text-[#e0dcf0]">
            {admin ? "Configured email / username" : "Mobile number"}

            <input
              className="h-[52px] w-full rounded-xl border border-[#e4e1ee] bg-white px-[15px] text-[15px] text-[#242747] outline-none transition-[border-color,box-shadow,background] placeholder:text-[#aaa9b8] hover:border-[#cfc7e8] focus-visible:border-[#8063ec] focus-visible:shadow-[0_0_0_4px_#7959e822] dark:border-[#464057] dark:bg-[#1c1a27] dark:text-[#f4f1ff] dark:placeholder:text-[#8e899f] dark:hover:border-[#7664b4] dark:focus-visible:border-[#a18aff] dark:focus-visible:shadow-[0_0_0_4px_#9a80ff2c]"
              autoComplete={admin ? "username" : "tel"}
              required
              type={admin ? "text" : "tel"}
              value={identifier}
              onChange={(event) => setIdentifier(event.target.value)}
              placeholder={
                admin
                  ? "Enter your admin email or name"
                  : "+91 98765 43210"
              }
            />
          </label>

          {/* Password */}
          <label className="grid gap-2 text-sm leading-[1.4] font-bold text-[#353756] dark:text-[#e0dcf0]">
            Password

            <input
              className="h-[52px] w-full rounded-xl border border-[#e4e1ee] bg-white px-[15px] text-[15px] text-[#242747] outline-none transition-[border-color,box-shadow,background] placeholder:text-[#aaa9b8] hover:border-[#cfc7e8] focus-visible:border-[#8063ec] focus-visible:shadow-[0_0_0_4px_#7959e822] dark:border-[#464057] dark:bg-[#1c1a27] dark:text-[#f4f1ff] dark:placeholder:text-[#8e899f] dark:hover:border-[#7664b4] dark:focus-visible:border-[#a18aff] dark:focus-visible:shadow-[0_0_0_4px_#9a80ff2c]"
              autoComplete="current-password"
              required
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder="Enter your password"
            />
          </label>

          {/* Submit Button */}
          <button
            className="relative mt-[3px] h-[54px] w-full rounded-xl bg-[linear-gradient(105deg,#6945ed,#805cf2)] text-[15px] text-white shadow-[0_8px_18px_#6c4ce32b] transition-[transform,box-shadow,filter] hover:-translate-y-px hover:brightness-[1.04] hover:shadow-[0_11px_22px_#6c4ce33b] active:translate-y-px active:shadow-[0_4px_10px_#6c4ce326] focus-visible:outline focus-visible:outline-[3px] focus-visible:outline-[#7153e9] focus-visible:outline-offset-[3px] disabled:cursor-wait disabled:opacity-[.7] disabled:shadow-none"
            disabled={loading}
            type="submit"
          >
            {loading ? "Signing in…" : "Sign in"}
            <b className="absolute top-[14px] right-[18px] text-[19px]">
              →
            </b>
          </button>
        </form>

        {/* Forgot Password */}
        {admin ? (
          <Link
            className="mx-auto mt-3 flex min-h-[42px] items-center rounded-[9px] px-[10px] text-sm text-[#6651c3] focus-visible:outline focus-visible:outline-[3px] focus-visible:outline-[#7153e9] focus-visible:outline-offset-[3px] hover:text-[#4f36ad] hover:underline hover:underline-offset-[3px] dark:text-[#c0afff]"
            href="/admin/forgot-password"
          >
            Forgot password?
          </Link>
        ) : (
          <button
            className="mx-auto mt-3 flex min-h-[42px] items-center rounded-[9px] border-0 bg-transparent px-[10px] text-sm font-semibold text-[#6651c3] focus-visible:outline focus-visible:outline-[3px] focus-visible:outline-[#7153e9] focus-visible:outline-offset-[3px] hover:text-[#4f36ad] hover:underline hover:underline-offset-[3px] dark:text-[#c0afff]"
            onClick={() =>
              setHelp(
                "Please contact the Udaan Tuition Admin to verify your identity and request a secure password reset."
              )
            }
          >
            Forgot password?
          </button>
        )}
      </section>

      {/* Footer */}
      <footer className="mx-auto flex min-h-[62px] w-full max-w-[1440px] items-center justify-between border-t border-[#e9e3fa] text-xs text-[#9290a7] dark:border-[#393448] dark:text-[#aaa5bb] max-[560px]:min-h-[58px] max-[560px]:gap-3 max-[560px]:text-[11px]">
        <span>© Udaan Learning Centre</span>
        <span>Curiosity today. Confidence tomorrow.</span>
      </footer>
    </main>
  );
}