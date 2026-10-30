"use client";

import { useTheme } from "@/components/ThemeProvider";

export default function ThemeToggle() {
  const { dark, toggleTheme } = useTheme();

  return (
    <button
      className="flex h-14 w-28 shrink-0 items-center justify-between rounded-[40px] border border-[#e4dcff] bg-white px-[9px] py-[7px] text-[25px] text-[#c9c0f4] shadow-[0_3px_12px_#5941b40a] focus-visible:outline focus-visible:outline-[3px] focus-visible:outline-[#aa98ff] focus-visible:outline-offset-[3px] dark:border-[#403a55] dark:bg-[#292538] dark:text-[#ded7ff] dark:focus-visible:outline-[#b09cff] max-[760px]:h-12 max-[760px]:w-[92px] [.top-actions_&]:h-[38px] [.top-actions_&]:w-[70px] [.top-actions_&]:rounded-[20px] [.top-actions_&]:px-[7px] [.top-actions_&]:py-1 max-[760px]:[.dashboard-topbar_&]:scale-[.85] max-[760px]:[.dashboard-topbar_&]:origin-right"
      aria-label={dark ? "Switch to light mode" : "Switch to dark mode"}
      aria-pressed={dark}
      onClick={toggleTheme}
      type="button"
    >
      <span
        className="grid w-[34px] place-items-center [.top-actions_&]:w-auto [.top-actions_&]:text-[17px] [.top-actions_&]:leading-none"
        aria-hidden="true"
      >
        ☼
      </span>

      <span
        className={`flex h-9 w-[43px] items-center rounded-[22px] p-1 max-[760px]:h-[31px] max-[760px]:w-9 [.top-actions_&]:h-[27px] [.top-actions_&]:w-8 [.top-actions_&]:p-[3px] ${
          dark ? "bg-[#5543aa]" : "bg-[#7550ef]"
        }`}
        aria-hidden="true"
      >
        <i
          className={`ml-auto block size-[27px] rounded-full bg-white transition-transform duration-200 ease-in-out max-[760px]:size-[23px] [.top-actions_&]:size-5 ${
            dark
              ? "-translate-x-[7px] max-[760px]:-translate-x-[5px] [.top-actions_&]:-translate-x-[5px]"
              : ""
          }`}
        />
      </span>
    </button>
  );
}