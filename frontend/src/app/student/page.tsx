"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import ThemeToggle from "@/components/ThemeToggle";
import { useTheme } from "@/components/ThemeProvider";

const API = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000/api";

export default function StudentHomePage() {
  const router = useRouter();
  const [message, setMessage] = useState("Checking your sign-in…");
  const [authenticated, setAuthenticated] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const { activateRole, clearRole } = useTheme();
  useEffect(() => {
    let active = true;
    void fetch(`${API}/auth/session`, { credentials: "include" }).then(async (response) => response.ok ? response.json() : null).then((session) => {
      if (!active) return;
      if (!session) { clearRole(); router.replace("/student/login"); return; }
      if (session.user?.role !== "student") { clearRole(); router.replace("/admin"); return; }
      activateRole("student");
      setAuthenticated(true);
      setMessage("Your student sign-in is active. Student learning pages will appear here.");
    }).catch(() => { if (active) { clearRole(); router.replace("/student/login"); } });
    return () => { active = false; };
  }, [router, activateRole, clearRole]);
  return <main className="flex min-h-[100svh] flex-col bg-[radial-gradient(ellipse_at_50%_44%,#f1edff_0%,#f8f6ff_37%,transparent_72%),linear-gradient(135deg,#fbfaff_0%,#f8f6ff_56%,#f2edff_100%)] px-[clamp(18px,7vw,112px)] text-[#111b49] dark:bg-[radial-gradient(ellipse_at_50%_44%,#29233d_0%,#201d2d_42%,transparent_76%),linear-gradient(135deg,#191722,#211e30_60%,#29213b)] dark:text-[#f0eef8] max-[560px]:px-[18px]"><header className="mx-auto flex min-h-[94px] w-full max-w-[1440px] items-center justify-between border-b border-[#e9e3fa] dark:border-[#393448] max-[560px]:min-h-[76px]"><Link className="public-brand max-[560px]:[&_strong]:text-[19px] max-[560px]:[&_small]:text-[9px]" href="/"><span className="public-logo max-[560px]:size-10 max-[560px]:text-[23px]">✳</span><span><strong>Udaan</strong><small>LEARNING CENTRE</small></span></Link><div className="flex items-center gap-3">{authenticated && <button className="inline-flex min-h-11 items-center rounded-xl border border-[#e9e3fa] bg-[#ffffffd9] px-[15px] text-sm text-[#6252b5] dark:border-[#403a55] dark:bg-[#292538] dark:text-[#c2b3ff] max-[560px]:min-h-10 max-[560px]:px-[11px] max-[560px]:text-[13px]" type="button" onClick={() => setSettingsOpen((current) => !current)}>{settingsOpen ? "Dashboard" : "Settings"}</button>}<Link className="inline-flex min-h-11 items-center rounded-xl border border-[#e9e3fa] bg-[#ffffffd9] px-[15px] text-sm text-[#6252b5] dark:border-[#403a55] dark:bg-[#292538] dark:text-[#c2b3ff] max-[560px]:min-h-10 max-[560px]:px-[11px] max-[560px]:text-[13px]" href="/">Home</Link></div></header><section className="mx-auto my-[clamp(36px,7vh,76px)] w-full max-w-[480px] rounded-[22px] border border-[#e9e4f5] bg-[#fffffff2] p-[clamp(28px,5vw,42px)] text-center text-[#111b49] shadow-[0_20px_60px_#48378314,0_3px_12px_#48378308] dark:border-[#3c374e] dark:bg-[#252231f5] dark:text-[#f0eef8] dark:shadow-[0_22px_64px_#09081166] max-[560px]:my-[34px] max-[560px]:rounded-[19px] max-[560px]:px-[22px] max-[560px]:py-[27px]">{settingsOpen && authenticated ? <><span className="mx-auto mb-[21px] grid size-[54px] place-items-center rounded-2xl bg-[#eaf7ef] text-[23px] text-[#289f62] dark:bg-[#233b30] dark:text-[#8cddb0]">⚙</span><div className="text-[11px] tracking-[1.4px] text-[#7869b9]">STUDENT / PARENT PREFERENCES</div><h1 className="mt-[10px] mb-2 text-[clamp(27px,5vw,32px)] leading-[1.18] tracking-[-1px] text-[#111b49] dark:text-[#f4f1ff]">Settings</h1><p className="mt-0 mb-[25px] text-[15px] leading-[1.6] text-[#777892] dark:text-[#bbb6ce]">Personalize the Student Dashboard appearance. This preference is saved for your student account on this device.</p>  <article className="mt-6 flex items-center justify-between gap-[18px] rounded-[15px] border border-[#ece7fa] bg-[#fbfaff] p-[18px] text-left dark:border-[#403b50] dark:bg-[#2a2738] max-[560px]:items-start max-[560px]:p-[15px]"><div className="grid gap-[5px]"><strong className="text-[15px] text-[#242747] dark:text-[#f0eef8]">Dark mode</strong><small className="text-[13px] leading-[1.5] text-[#777892] dark:text-[#aaa6bb]">Use the dark Udaan theme across student pages.</small></div><ThemeToggle /></article></> : <><span className="mx-auto mb-[21px] grid size-[54px] place-items-center rounded-2xl bg-[#eaf7ef] text-[23px] text-[#289f62] dark:bg-[#233b30] dark:text-[#8cddb0]">♙</span><div className="text-[11px] tracking-[1.4px] text-[#7869b9]">STUDENT / PARENT PORTAL</div><h1 className="mt-[10px] mb-2 text-[clamp(27px,5vw,32px)] leading-[1.18] tracking-[-1px] text-[#111b49] dark:text-[#f4f1ff]">Welcome to Udaan</h1><p className="mt-0 mb-[25px] text-[15px] leading-[1.6] text-[#777892] dark:text-[#bbb6ce]">{message}</p><Link className="relative mt-[3px] flex h-[54px] w-full items-center justify-center rounded-xl bg-[linear-gradient(105deg,#6945ed,#805cf2)] text-[15px] text-white no-underline shadow-[0_8px_18px_#6c4ce32b]" href="/">Return to home <b className="absolute top-[14px] right-[18px] text-[19px]">→</b></Link></>}</section><footer className="mx-auto flex min-h-[62px] w-full max-w-[1440px] items-center justify-between border-t border-[#e9e3fa] text-xs text-[#9290a7] dark:border-[#393448] dark:text-[#aaa5bb] max-[560px]:min-h-[58px] max-[560px]:gap-3 max-[560px]:text-[11px]"><span>© Udaan Learning Centre</span><span>Curiosity today. Confidence tomorrow.</span></footer></main>;
}
