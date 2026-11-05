"use client";

import Link from "next/link";
import Image from "next/image";
import { useTheme } from "@/components/ThemeProvider";
import { useLayoutEffect } from "react";

const features = [
  {
    title: "Expert Guidance",
    description: "Learn from experienced and supportive teachers",
    color: "violet",
    icon: "guidance",
  },
  {
    title: "Structured Classes",
    description: "Well-planned syllabus and regular practice",
    color: "amber",
    icon: "classes",
  },
  {
    title: "Tests & Assessments",
    description: "Topic-wise tests to strengthen preparation",
    color: "blue",
    icon: "tests",
  },
  {
    title: "Progress Tracking",
    description: "Track your learning growth and performance",
    color: "green",
    icon: "progress",
  },
] as const;

// Add the centre's actual contact details here.
const CONTACT = {
  phone: "",
  email: "",
  address: "",
};

const benefits = [
  "Concept Clarity",
  "Regular Practice",
  "Doubt Support",
  "Better Results",
];

function ArrowIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      className="size-5"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M5 12h14M13 5l7 7-7 7" />
    </svg>
  );
}

function LoginIcon({ type }: { type: "admin" | "student" }) {
  if (type === "admin") {
    return (
      <svg
        viewBox="0 0 24 24"
        className="size-6"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        <rect x="3" y="3" width="7" height="7" rx="1.5" />
        <rect x="14" y="3" width="7" height="7" rx="1.5" />
        <rect x="3" y="14" width="7" height="7" rx="1.5" />
        <rect x="14" y="14" width="7" height="7" rx="1.5" />
      </svg>
    );
  }

  return (
    <svg
      viewBox="0 0 24 24"
      className="size-6"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <circle cx="12" cy="8" r="4" />
      <path d="M4 21a8 8 0 0 1 16 0" />
    </svg>
  );
}

function FeatureIcon({ type }: { type: string }) {
  const common = {
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 1.8,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
    className: "size-6 sm:size-7",
    "aria-hidden": true as const,
  };

  switch (type) {
    case "guidance":
      return (
        <svg {...common}>
          <path d="m2 9 10-5 10 5-10 5L2 9Z" />
          <path d="M6 11v5c3.5 3 8.5 3 12 0v-5M22 9v6" />
        </svg>
      );

    case "classes":
      return (
        <svg {...common}>
          <path d="m3 8 9-5 9 5-9 5-9-5Z" />
          <path d="m3 13 9 5 9-5M3 18l9 5 9-5" />
        </svg>
      );

    case "tests":
      return (
        <svg {...common}>
          <rect x="5" y="4" width="14" height="18" rx="2" />
          <path d="M9 4V2h6v2M9 10h6M9 14h6M9 18h3" />
        </svg>
      );

    default:
      return (
        <svg {...common}>
          <path d="M4 20v-6h4v6M10 20V9h4v11M16 20V4h4v16" />
        </svg>
      );
  }
}

function CheckIcon() {
  return (
    <span className="flex size-[21px] shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-[#8747F5] to-[#642BE5] text-white">
      <svg
        viewBox="0 0 24 24"
        className="size-3.5"
        fill="none"
        stroke="currentColor"
        strokeWidth="3"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        <path d="m5 12 4 4L19 6" />
      </svg>
    </span>
  );
}

/*
  About illustration:
  Globe + graduation cap + books + pencil holder.
  No golden laurel branches.
*/
function AboutIllustration() {
  return (
    <svg
      viewBox="0 0 440 250"
      className="h-full w-full"
      role="img"
      aria-label="Globe, graduation cap, books and pencils"
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        <linearGradient id="aboutGlobe" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#B8D5FF" />
          <stop offset="55%" stopColor="#8298F0" />
          <stop offset="100%" stopColor="#5541C8" />
        </linearGradient>

        <linearGradient id="aboutCap" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#9565F5" />
          <stop offset="100%" stopColor="#6035C9" />
        </linearGradient>

        <linearGradient id="aboutBooks" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#A77BFF" />
          <stop offset="100%" stopColor="#7144D8" />
        </linearGradient>

        <clipPath id="aboutGlobeClip">
          <circle cx="206" cy="91" r="67" />
        </clipPath>
      </defs>

      {/* Globe */}
      <circle
        cx="206"
        cy="91"
        r="72"
        fill="url(#aboutGlobe)"
        stroke="#C9BCFF"
        strokeWidth="4"
      />

      <g clipPath="url(#aboutGlobeClip)">
        <path
          d="m150 48 20-16 24 4 8 13-12 13-3 20-17 6-13-14-15-2Z"
          fill="#E8F1FF"
        />
        <path
          d="m206 30 22-12 25 11 13 20-12 13-19-6-12 14-17-10Z"
          fill="#E8F1FF"
        />
        <path
          d="m245 105 18-10 20 14-6 22-17 9-17-15Z"
          fill="#E8F1FF"
        />
        <path
          d="m177 115 19-9 16 11 8 23-18 22-17-12-13-20Z"
          fill="#E8F1FF"
        />
        <path
          d="M136 91h140M206 19c-36 38-36 105 0 144M206 19c36 38 36 105 0 144"
          fill="none"
          stroke="#F3F5FF"
          strokeWidth="1.6"
          opacity=".8"
        />
        <ellipse
          cx="206"
          cy="91"
          rx="34"
          ry="72"
          fill="none"
          stroke="#F3F5FF"
          strokeWidth="1.4"
        />
      </g>

      <circle
        cx="206"
        cy="91"
        r="67"
        fill="none"
        stroke="#E7E5FF"
        strokeWidth="2"
      />

      {/* Books */}
      <path
        d="M91 185q0-10 12-10h214q12 0 12 10l-9 13H100Z"
        fill="url(#aboutBooks)"
        stroke="#6840CB"
        strokeWidth="2"
      />
      <path d="M100 185h220v8H100Z" fill="#D5C5FF" />

      <path
        d="M103 204q0-10 12-10h194q12 0 12 10l-9 13H112Z"
        fill="#F4C76F"
        stroke="#D99A35"
        strokeWidth="2"
      />
      <path d="M112 204h200v8H112Z" fill="#FFF2D8" />

      <path
        d="M109 171q0-9 12-9h181q12 0 12 9l-8 15H117Z"
        fill="#FFFFFF"
        stroke="#A68AEF"
        strokeWidth="2"
      />

      {/* Graduation cap */}
      <path
        d="m98 147 108-49 109 49-109 49Z"
        fill="#4E31BA"
        stroke="#BBA8FF"
        strokeWidth="2"
      />
      <path
        d="m116 147 90-40 91 40-91 41Z"
        fill="url(#aboutCap)"
      />
      <path
        d="M164 165v23q42 24 84 0v-23"
        fill="#5835C5"
        stroke="#BBA8FF"
        strokeWidth="1.5"
      />

      {/* Cap tassel */}
      <path
        d="M206 99 321 145"
        fill="none"
        stroke="#D9C9FF"
        strokeWidth="2.5"
      />
      <circle cx="321" cy="145" r="3.5" fill="#D9C9FF" />
      <path
        d="M321 149v25"
        stroke="#8D68E8"
        strokeWidth="2.5"
        strokeLinecap="round"
      />
      <path d="m315 174 6-3 6 3-6 12Z" fill="#8D68E8" />

      {/* Pencil */}
      <g transform="translate(356 83) rotate(28)">
        <rect
          x="0"
          y="0"
          width="11"
          height="99"
          rx="4"
          fill="#7546DF"
          stroke="#5630BB"
          strokeWidth="1.5"
        />
        <path
          d="M3 12h5M3 79h5"
          stroke="#DCCEFF"
          strokeWidth="2"
        />
        <path d="M0 6 5.5-8 11 6Z" fill="#A78BFA" />
        <path d="M0 94 5.5 108 11 94Z" fill="#D8C8FF" />
      </g>

      {/* Pencil holder */}
      <g transform="translate(48 147)">
        <path
          d="M8 25h43l-5 56H13Z"
          fill="#7545DB"
          stroke="#5C36C4"
          strokeWidth="2"
        />
        <ellipse cx="29.5" cy="25" rx="21.5" ry="6" fill="#A98AF4" />
        <path d="M15 23 9-9" stroke="#F1A52B" strokeWidth="4" />
        <path d="M24 22 26-17" stroke="#EF6C8C" strokeWidth="4" />
        <path d="M32 22 40-12" stroke="#3A9BEA" strokeWidth="4" />
        <path d="M40 23 53-7" stroke="#F3BE45" strokeWidth="4" />
        <path d="M15-9 9-17 6-7Z" fill="#F1A52B" />
        <path d="M26-17 22-25 29-24Z" fill="#EF6C8C" />
        <path d="M40-12 38-20 46-15Z" fill="#3A9BEA" />
        <path d="M53-7 52-15 59-10Z" fill="#F3BE45" />
      </g>
    </svg>
  );
}

function ContactIcon({
  type,
}: {
  type: "phone" | "email" | "address";
}) {
  const common = {
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 1.8,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
    className: "size-5 sm:size-[22px]",
    "aria-hidden": true as const,
  };

  if (type === "phone") {
    return (
      <svg {...common}>
        <path d="M22 16.92v3a2 2 0 0 1-2.18 2A19.8 19.8 0 0 1 3.08 5.18 2 2 0 0 1 5.06 3h3a2 2 0 0 1 2 1.72c.12.96.35 1.9.69 2.8a2 2 0 0 1-.45 2.11L9 10.93a16 16 0 0 0 4.07 4.07l1.3-1.3a2 2 0 0 1 2.11-.45c.9.34 1.84.57 2.8.69a2 2 0 0 1 1.72 1.98Z" />
      </svg>
    );
  }

  if (type === "email") {
    return (
      <svg {...common}>
        <rect x="2" y="4" width="20" height="16" rx="2" />
        <path d="m22 7-10 6L2 7" />
      </svg>
    );
  }

  return (
    <svg {...common}>
      <path d="M20 10c0 5-8 12-8 12S4 15 4 10a8 8 0 1 1 16 0Z" />
      <circle cx="12" cy="10" r="2.5" />
    </svg>
  );
}

export default function PublicHomePage() {
  const { clearRole } = useTheme();

  useLayoutEffect(() => {
    clearRole();
  }, [clearRole]);

  const contactItems = [
    {
      type: "phone" as const,
      title: "Phone",
      value: CONTACT.phone,
      href: CONTACT.phone
        ? `tel:${CONTACT.phone.replace(/\s/g, "")}`
        : undefined,
    },
    {
      type: "email" as const,
      title: "Email",
      value: CONTACT.email,
      href: CONTACT.email
        ? `mailto:${CONTACT.email}`
        : undefined,
    },
    {
      type: "address" as const,
      title: "Address",
      value: CONTACT.address,
      href: undefined,
    },
  ];

  const featureColors = {
    violet: "bg-[#F0E8FF] text-[#7842E9]",
    amber: "bg-[#FFF3DC] text-[#E7A000]",
    blue: "bg-[#E7F1FF] text-[#2586E8]",
    green: "bg-[#E5F7EC] text-[#24A85B]",
  };

  // Shared login button styling: animated violet border and subtle icon/arrow motion.
  const loginButtonBase =
    "group flex min-h-[72px] w-full min-w-0 items-center gap-3 rounded-[16px] border px-3.5 py-3 no-underline transition-all duration-300 active:scale-[0.98] focus-visible:outline-2 focus-visible:outline-offset-3 focus-visible:outline-[#713CF0] sm:min-h-[76px] sm:gap-3.5 sm:rounded-[17px] sm:px-5";

  const loginButtonDefault =
    "border-[#E3D9FF] bg-white/90 text-[#171D49] shadow-[0_6px_16px_#4630A00D] hover:border-[#8B63F2] hover:shadow-[0_0_0_1px_#B9A2FF,0_0_14px_#8B63F233]";

  return (
    <main
      id="home"
      className="relative isolate flex min-h-screen flex-col overflow-hidden bg-gradient-to-br from-[#FCFAFF] via-white to-[#F5F0FF] text-[#111B49]"
    >
      {/* Background accents */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_75%_10%,#E9DFFF99_0%,transparent_42%),radial-gradient(ellipse_at_5%_65%,#EEE8FF80_0%,transparent_32%)]"
      />

      {/* Header and single-row navigation */}
      <header className="relative z-20 border-b border-[#EAE2FF] bg-white/70 backdrop-blur-md">
        <div className="mx-auto flex min-h-[66px] max-w-[1440px] items-center justify-between gap-2 px-3 sm:h-[78px] sm:px-7 lg:px-12">
          <Link
            href="/"
            aria-label="Udaan Learning Centre home"
            className="flex shrink-0 items-center gap-1.5 sm:gap-2.5"
          >
            <span className="flex size-8 items-center justify-center rounded-[11px] bg-gradient-to-br from-[#6C45F1] to-[#815BF1] text-[21px] text-white shadow-md shadow-violet-500/20 sm:size-12 sm:rounded-[15px] sm:text-[28px]">
              ✳
            </span>

            <span className="flex flex-col">
              <strong className="text-[17px] font-extrabold leading-none tracking-tight text-[#101A4A] sm:text-[25px]">
                Udaan
              </strong>
              <small className="mt-1 text-[6px] font-bold tracking-[1px] text-[#7149E8] sm:text-[10px] sm:tracking-[2px]">
                LEARNING CENTRE
              </small>
            </span>
          </Link>

          <nav
            aria-label="Main navigation"
            className="flex shrink-0 items-center gap-0 sm:gap-2 lg:gap-5"
          >
            <a
              href="#home"
              className="rounded-full bg-[#713CF0] px-2 py-1.5 text-[9px] font-semibold text-white transition hover:bg-[#6030D8] sm:px-5 sm:py-2 sm:text-[13px]"
            >
              Home
            </a>
            <a
              href="#about"
              className="rounded-full px-2 py-1.5 text-[9px] font-semibold text-[#20264C] transition hover:bg-[#F1EBFF] hover:text-[#713CF0] sm:px-4 sm:py-2 sm:text-[13px]"
            >
              About
            </a>
            <a
              href="#features"
              className="rounded-full px-2 py-1.5 text-[9px] font-semibold text-[#20264C] transition hover:bg-[#F1EBFF] hover:text-[#713CF0] sm:px-4 sm:py-2 sm:text-[13px]"
            >
              Features
            </a>
            <a
              href="#contact"
              className="rounded-full px-2 py-1.5 text-[9px] font-semibold text-[#20264C] transition hover:bg-[#F1EBFF] hover:text-[#713CF0] sm:px-4 sm:py-2 sm:text-[13px]"
            >
              Contact
            </a>
          </nav>
        </div>
      </header>

      {/* Hero */}
      <section className="relative z-10 mx-auto grid w-full max-w-[1440px] grid-cols-1 items-center gap-1 px-4 pb-5 pt-5 sm:gap-3 sm:px-7 sm:pt-7 lg:min-h-[405px] lg:grid-cols-2 lg:gap-8 lg:px-12 lg:pb-4 lg:pt-5">
        <div className="order-1 relative z-10 mx-auto w-full max-w-[590px] lg:mx-0">
          <h1 className="text-[clamp(37px,5.2vw,65px)] font-extrabold leading-[1.04] tracking-[-0.045em] text-[#111B49]">
            Your goals.
            <span className="block bg-gradient-to-r from-[#7042EE] to-[#8958F1] bg-clip-text text-transparent">
              Our guidance.
            </span>
          </h1>

          <div className="ml-5 mt-3 h-[5px] w-[145px] -rotate-[2deg] rounded-full bg-[#8052EF] sm:ml-7 sm:w-[190px]" />

          <p className="mt-4 max-w-[500px] text-[13px] font-medium leading-[1.65] text-[#555E83] sm:mt-5 sm:text-[15px]">
            Learn with confidence. Grow with knowledge.
          </p>

          {/* Login buttons */}
          <div className="mt-5 grid max-w-[570px] grid-cols-2 gap-2.5 sm:mt-6 sm:gap-3">
            <Link
              className={`${loginButtonBase} ${loginButtonDefault}`}
              href="/admin/login"
            >
              <span
                className="flex size-10 shrink-0 items-center justify-center rounded-[11px] bg-[#F0E9FF] text-[#7545EA] transition-transform duration-300 group-hover:rotate-3 group-hover:scale-105 sm:size-11"
                aria-hidden="true"
              >
                <LoginIcon type="admin" />
              </span>

              <span className="min-w-0 flex-1">
                <strong className="block text-[14px] font-bold leading-tight sm:text-[16px]">
                  Admin Login
                </strong>
                <span className="mt-1 hidden text-[11px] text-[#777E9A] sm:block sm:text-xs">
                  Manage your centre
                </span>
              </span>

              <span className="hidden shrink-0 text-[#7043E8] transition-transform duration-300 group-hover:translate-x-1.5 group-hover:scale-110 sm:block">
                <ArrowIcon />
              </span>
            </Link>

            <Link
              className={`${loginButtonBase} ${loginButtonDefault}`}
              href="/student/login"
            >
              <span
                className="flex size-10 shrink-0 items-center justify-center rounded-[11px] bg-[#F0E9FF] text-[#7545EA] transition-transform duration-300 group-hover:rotate-3 group-hover:scale-105 sm:size-11"
                aria-hidden="true"
              >
                <LoginIcon type="student" />
              </span>

              <span className="min-w-0 flex-1">
                <strong className="block text-[13px] font-bold leading-tight sm:text-[16px]">
                  Student / Parent
                </strong>
                <span className="mt-1 hidden text-[11px] text-[#777E9A] sm:block sm:text-xs">
                  View your progress
                </span>
              </span>

              <span className="hidden shrink-0 text-[#7043E8] transition-transform duration-300 group-hover:translate-x-1.5 group-hover:scale-110 sm:block">
                <ArrowIcon />
              </span>
            </Link>
          </div>
        </div>

        {/* Existing hero image from public folder */}
        <div className="relative order-2 mx-auto h-[205px] w-full max-w-[520px] sm:h-[285px] lg:h-[390px] lg:max-w-none">
          <Image
            src="/udaan-study-hero.png"
            alt="Books, plants, laptop and a sunrise window"
            fill
            priority
            sizes="(max-width: 768px) 100vw, 55vw"
            className="object-contain"
          />
        </div>
      </section>

      {/* Features */}
      <section
        id="features"
        aria-label="Udaan educational features"
        className="relative z-10 mx-auto grid w-full max-w-[1440px] grid-cols-2 gap-2.5 px-4 pb-5 sm:gap-3 sm:px-7 sm:pb-7 lg:grid-cols-4 lg:gap-3.5 lg:px-12"
      >
        {features.map((feature) => (
          <article
            key={feature.title}
            className="flex min-h-[116px] min-w-0 items-center gap-2.5 rounded-[15px] border border-[#E9E0FF] bg-white/90 px-2.5 py-3 shadow-[0_5px_16px_#4630A009] transition duration-200 hover:-translate-y-0.5 hover:shadow-[0_9px_20px_#4630A014] sm:min-h-[112px] sm:gap-3.5 sm:rounded-[17px] sm:px-3.5 lg:min-h-[116px] lg:px-4"
          >
            <span
              className={`flex size-9 shrink-0 items-center justify-center rounded-xl sm:size-12 sm:rounded-[14px] ${
                featureColors[feature.color]
              }`}
            >
              <FeatureIcon type={feature.icon} />
            </span>

            <div className="min-w-0">
              <h2 className="text-[11px] font-bold leading-snug text-[#151C48] sm:text-[13px] lg:text-[14px]">
                {feature.title}
              </h2>
              <p className="mt-1 text-[10px] leading-[1.45] text-[#68708F] sm:text-[11px] lg:text-xs">
                {feature.description}
              </p>
            </div>
          </article>
        ))}
      </section>

      {/* About Udaan */}
      <section
        id="about"
        className="relative z-10 mx-auto mb-5 grid w-[calc(100%-32px)] max-w-[1320px] scroll-mt-5 grid-cols-1 items-center overflow-hidden rounded-[20px] border border-[#E8DFFF] bg-gradient-to-r from-[#F5F0FF] via-[#FBF9FF] to-[#F0E8FF] px-4 py-4 sm:mb-5 sm:w-[calc(100%-56px)] sm:px-6 sm:py-5 lg:grid-cols-[34%_66%] lg:px-7 lg:py-5"
      >
        <div className="mx-auto h-[165px] w-full max-w-[350px] sm:h-[190px] lg:h-[175px] lg:border-r lg:border-[#BFA7FF] lg:pr-7">
          <AboutIllustration />
        </div>

        <div className="pt-3 lg:pl-9 lg:pt-0">
          <h2 className="text-center text-[23px] font-extrabold tracking-tight text-[#111B49] sm:text-left sm:text-[27px]">
            About <span className="text-[#7842EE]">Udaan</span>
          </h2>

          <p className="mt-2 text-center text-[12px] leading-[1.65] text-[#424D76] sm:text-left sm:text-[13px] lg:max-w-[790px] lg:text-[14px]">
            Udaan Learning Centre is a student-focused platform that
            helps learners build strong concepts, improve performance
            and achieve their academic goals with the right guidance
            and regular practice.
          </p>

          <div className="mt-4 grid grid-cols-2 gap-x-3 gap-y-3 sm:grid-cols-4 sm:gap-2">
            {benefits.map((benefit) => (
              <div
                key={benefit}
                className="flex min-w-0 items-center gap-2"
              >
                <CheckIcon />
                <span className="text-[10px] font-bold text-[#20264E] sm:text-[11px] lg:text-[12px]">
                  {benefit}
                </span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Contact row - one row, no separate cards */}
      <section
        id="contact"
        aria-label="Contact Udaan Learning Centre"
        className="relative z-10 mx-auto w-full max-w-[1320px] scroll-mt-4 px-4 pb-3 sm:px-7 lg:px-12"
      >
        <div className="grid grid-cols-3 items-center border-b border-[#BDA8F4]/60 pb-4">
          {contactItems.map((item, index) => (
            <div
              key={item.type}
              className={`flex min-w-0 items-center justify-center gap-1.5 px-1 sm:gap-3 sm:px-3 ${
                index > 0 ? "border-l border-[#BDA8F4]" : ""
              }`}
            >
              <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-[#F0E9FF] text-[#7043E8] sm:size-11">
                <ContactIcon type={item.type} />
              </span>

              <div className="min-w-0">
                <p className="text-[9px] font-bold text-[#4F35B8] sm:text-xs">
                  {item.title}
                </p>

                {item.value ? (
                  item.href ? (
                    <a
                      href={item.href}
                      className="mt-0.5 block break-words text-[8px] leading-tight text-[#20264E] hover:text-[#7043E8] sm:text-[13px]"
                    >
                      {item.value}
                    </a>
                  ) : (
                    <p className="mt-0.5 break-words text-[8px] leading-tight text-[#20264E] sm:text-[13px]">
                      {item.value}
                    </p>
                  )
                ) : (
                  <p className="mt-0.5 text-[8px] leading-tight text-[#77708F] sm:text-[11px]">
                    Add details
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Wavy footer */}
      <footer className="relative z-10 mt-auto overflow-hidden">
        <div
          aria-hidden="true"
          className="absolute inset-x-0 bottom-0 -z-10 h-[76px] bg-gradient-to-r from-[#E5D9FF] via-[#D4C1FF] to-[#E9DEFF] [clip-path:polygon(0_28%,12%_48%,25%_72%,40%_43%,54%_69%,69%_37%,84%_61%,100%_25%,100%_100%,0_100%)] sm:h-[88px]"
        />

        <div className="mx-auto flex min-h-[70px] max-w-[1440px] flex-col items-center justify-center gap-1 px-4 pb-3 pt-3 text-center text-[10px] text-[#5F6794] sm:min-h-[78px] sm:flex-row sm:justify-between sm:px-7 sm:text-xs lg:px-12">
          <span>© Udaan Learning Centre</span>
          <span className="font-medium italic">
            Curiosity today. Confidence tomorrow.
          </span>
        </div>
      </footer>
    </main>
  );
}