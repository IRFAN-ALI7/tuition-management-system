
"use client";

import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useTheme } from "@/components/ThemeProvider";
import { useLayoutEffect, useState } from "react";

export default function PublicHomePage() {
  const { clearRole } = useTheme();
  const router = useRouter();
  const [pressedRole, setPressedRole] = useState<"admin" | "student" | null>(
    null
  );

  useLayoutEffect(() => {
    clearRole();
  }, [clearRole]);

  function navigateToLogin(
    event: React.MouseEvent<HTMLAnchorElement>,
    role: "admin" | "student"
  ) {
    if (
      event.metaKey ||
      event.ctrlKey ||
      event.shiftKey ||
      event.altKey ||
      event.button !== 0
    ) {
      return;
    }

    event.preventDefault();
    setPressedRole(role);

    window.setTimeout(() => {
      router.push(role === "admin" ? "/admin/login" : "/student/login");
    }, 160);
  }

  const loginButtonBase =
    "group flex min-h-[106px] w-full items-center gap-[19px] rounded-[20px] border border-[#ece7fa] bg-white px-5 py-4 text-[#121b49] no-underline shadow-[0_10px_25px_#4831a00c] transition duration-200 hover:-translate-y-0.5 hover:border-[#d9d0fb] hover:shadow-[0_12px_28px_#4831a018] active:translate-y-px focus-visible:outline-3 focus-visible:outline-offset-3 focus-visible:outline-[#aa98ff] sm:px-6";

  const loginButtonPressed =
    "translate-y-px border-[#7053e6] bg-gradient-to-r from-[#7053e6] to-[#8069ee] text-white shadow-[0_9px_24px_#7053e64a]";

  return (
    <main className="relative isolate flex min-h-screen flex-col overflow-hidden bg-gradient-to-br from-[#fbfaff] via-white to-[#f7f1ff] px-6 text-[#111b49] sm:px-8 lg:px-[clamp(32px,7vw,112px)]">
      {/* Decorative background */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_76%_1%,#e8e0ffad_0%,#eee9ff55_21%,transparent_47%),radial-gradient(ellipse_at_0%_55%,#e6ddff99_0%,transparent_19%),radial-gradient(ellipse_at_100%_53%,#f0d9ff80_0%,transparent_19%)]"
      />

      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 bottom-0 -z-10 h-[105px] bg-gradient-to-br from-[#ddd1ff] to-[#c8b6ff] [clip-path:polygon(0_42%,5%_55%,11%_70%,18%_67%,26%_79%,34%_68%,43%_78%,53%_67%,64%_79%,73%_69%,83%_55%,93%_50%,100%_33%,100%_100%,0_100%)]"
      />

      <header className="relative z-10 flex h-[94px] shrink-0 items-center border-b border-[#e8e1ff]">
        <Link
          className="flex items-center gap-[17px] no-underline"
          href="/"
          aria-label="Udaan Learning Centre home"
        >
          <span
            className="flex size-[60px] shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-[#6c45f1] to-[#815bf1] text-[34px] text-white"
            aria-hidden="true"
          >
            ✳
          </span>

          <span className="flex flex-col">
            <strong className="text-[29px] leading-tight tracking-[-0.8px] text-[#101a4a]">
              Udaan
            </strong>
            <small className="mt-0.5 text-[13px] tracking-[2px] text-[#6d70ae]">
              LEARNING CENTRE
            </small>
          </span>
        </Link>
      </header>

      <section className="relative z-10 mx-auto grid min-h-[585px] w-full max-w-[1370px] flex-1 grid-cols-1 items-center gap-8 py-10 lg:grid-cols-2 lg:gap-10 lg:py-0">
        <div className="relative z-10 w-full max-w-[630px]">
          <h1 className="mb-7 grid text-[clamp(44px,6.1vw,101px)] font-extrabold leading-[0.99] tracking-[-0.055em] sm:text-[clamp(48px,6.1vw,101px)]">
            <span className="block whitespace-nowrap text-[#101b4b]">
              Your goals.
            </span>
            <span className="block whitespace-nowrap bg-gradient-to-r from-[#7248f3] to-[#825ce9] bg-clip-text text-transparent">
              Our guidance.
            </span>
          </h1>

          <div className="mb-8 ml-[30px] h-[9px] w-[58%] max-w-[330px] rotate-[-1.5deg] rounded-[50%] border-t-[7px] border-[#7954ef]" />

          <div className="mt-0 grid w-full max-w-[565px] grid-cols-1 gap-[14px]">
            <Link
              className={`${loginButtonBase} ${
                pressedRole === "admin" ? loginButtonPressed : ""
              }`}
              href="/admin/login"
              onClick={(event) => navigateToLogin(event, "admin")}
            >
              <span
                className={`flex size-[52px] shrink-0 items-center justify-center rounded-2xl bg-[#f0ebff] text-2xl text-[#7355df] ${
                  pressedRole === "admin" ? "bg-white/20 text-white" : ""
                }`}
                aria-hidden="true"
              >
                ▦
              </span>

              <span className="flex min-w-0 flex-1 flex-col gap-1">
                <strong className="text-base font-bold sm:text-lg">
                  Admin Login
                </strong>
                <small
                  className={`text-sm ${
                    pressedRole === "admin" ? "text-white" : "text-[#777991]"
                  }`}
                >
                  Manage your learning centre
                </small>
              </span>

              <b
                className={`shrink-0 text-xl transition-transform group-hover:translate-x-1 ${
                  pressedRole === "admin" ? "text-white" : "text-[#5546a7]"
                }`}
                aria-hidden="true"
              >
                →
              </b>
            </Link>

            <Link
              className={`${loginButtonBase} ${
                pressedRole === "student" ? loginButtonPressed : ""
              }`}
              href="/student/login"
              onClick={(event) => navigateToLogin(event, "student")}
            >
              <span
                className={`flex size-[52px] shrink-0 items-center justify-center rounded-2xl bg-[#eaf7ef] text-2xl text-[#34a967] ${
                  pressedRole === "student" ? "bg-white/20 text-white" : ""
                }`}
                aria-hidden="true"
              >
                ♙
              </span>

              <span className="flex min-w-0 flex-1 flex-col gap-1">
                <strong className="text-base font-bold sm:text-lg">
                  Student / Parent Login
                </strong>
                <small
                  className={`text-sm ${
                    pressedRole === "student"
                      ? "text-white"
                      : "text-[#777991]"
                  }`}
                >
                  View your learning progress
                </small>
              </span>

              <b
                className={`shrink-0 text-xl transition-transform group-hover:translate-x-1 ${
                  pressedRole === "student" ? "text-white" : "text-[#5546a7]"
                }`}
                aria-hidden="true"
              >
                →
              </b>
            </Link>
          </div>
        </div>

        <div className="relative min-h-[280px] w-full self-stretch sm:min-h-[380px] lg:min-h-[520px]">
          <Image
            className="object-contain"
            src="/udaan-study-hero.png"
            alt="Books, a notebook, pencils and a laptop beside a sunrise window"
            fill
            priority
            sizes="(max-width: 760px) 100vw, 60vw"
          />
        </div>
      </section>

      <section
        className="relative z-10 mx-auto grid w-full max-w-[1370px] grid-cols-1 divide-y divide-[#e8e2fb] rounded-2xl border border-[#e8e2fb] bg-white/70 px-4 py-2 sm:grid-cols-3 sm:divide-x sm:divide-y-0 sm:px-2"
        aria-label="Learning at Udaan"
      >
        <article className="flex items-center gap-4 px-3 py-5 sm:px-5">
          <span
            className="flex size-12 shrink-0 items-center justify-center rounded-xl bg-[#f0ebff] text-[#7255e8]"
            aria-hidden="true"
          >
            <svg
              className="size-6 fill-none stroke-current"
              viewBox="0 0 24 24"
              strokeWidth="1.7"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="m2 9 10-5 10 5-10 5L2 9Z" />
              <path d="M6 11v5c3.5 3 8.5 3 12 0v-5M22 9v6" />
            </svg>
          </span>
          <div>
            <strong className="text-[15px] font-semibold sm:text-base">
              Personal guidance
            </strong>
            <p className="mt-1 text-sm text-[#777991]">
              One-to-one attention
            </p>
          </div>
        </article>

        <article className="flex items-center gap-4 px-3 py-5 sm:px-5">
          <span
            className="flex size-12 shrink-0 items-center justify-center rounded-xl bg-[#f0ebff] text-[#7255e8]"
            aria-hidden="true"
          >
            <svg
              className="size-6 fill-none stroke-current"
              viewBox="0 0 24 24"
              strokeWidth="1.7"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <circle cx="9" cy="8" r="3" />
              <circle cx="17" cy="9" r="2.5" />
              <path d="M3.5 19c.4-3.3 2.1-5 5.5-5s5.1 1.7 5.5 5M15 14c3.3-.3 5.1 1.4 5.5 4" />
            </svg>
          </span>
          <div>
            <strong className="text-[15px] font-semibold sm:text-base">
              Supportive learning
            </strong>
            <p className="mt-1 text-sm text-[#777991]">
              A positive environment
            </p>
          </div>
        </article>

        <article className="flex items-center gap-4 px-3 py-5 sm:px-5">
          <span
            className="flex size-12 shrink-0 items-center justify-center rounded-xl bg-[#f0ebff] text-[#7255e8]"
            aria-hidden="true"
          >
            <svg
              className="size-6 fill-none stroke-current"
              viewBox="0 0 24 24"
              strokeWidth="1.7"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M4 20v-6h4v6M10 20V9h4v11M16 20V4h4v16" />
            </svg>
          </span>
          <div>
            <strong className="text-[15px] font-semibold sm:text-base">
              Visible progress
            </strong>
            <p className="mt-1 text-sm text-[#777991]">
              Step-by-step growth
            </p>
          </div>
        </article>
      </section>

      <footer className="relative z-10 mx-auto flex w-full max-w-[1370px] flex-col items-center justify-between gap-2 py-7 text-center text-sm text-[#6d70ae] sm:flex-row sm:text-left">
        <span>© Udaan Learning Centre</span>
        <span>Curiosity today. Confidence tomorrow.</span>
      </footer>
    </main>
  );
}
