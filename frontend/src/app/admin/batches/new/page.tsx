
"use client";

import { FormEvent, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import ThemeToggle from "@/components/ThemeToggle";
import { useTheme } from "@/components/ThemeProvider";

const API =
  process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000/api";

type Draft = {
  name: string;
  startTime: string;
  endTime: string;
};

const initialDraft: Draft = {
  name: "",
  startTime: "10:00",
  endTime: "11:00",
};

const timeParts = (value: string) => {
  const [hour, minute] = value.split(":").map(Number);

  return {
    hour: hour % 12 || 12,
    minute,
    period: hour >= 12 ? "PM" : "AM",
  };
};

const to24Hour = (
  hour: number,
  minute: number,
  period: string
) =>
  `${String((hour % 12) + (period === "PM" ? 12 : 0)).padStart(2, "0")}:${String(minute).padStart(2, "0")}`;

function TimeField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (time: string) => void;
}) {
  const parts = timeParts(value);

  const update = (
    hour: number,
    minute: number,
    period: string
  ) => onChange(to24Hour(hour, minute, period));

  const selectClass =
    "min-h-[40px] min-w-[50px] flex-1 border-0 bg-transparent px-[5px] py-[7px] text-[14px] font-medium outline-none text-[#172444] dark:text-[#f0eff8]";

  return (
    <label className="grid content-start gap-[7px] text-[13px] font-bold text-[#172444] dark:text-[#f0eff8] [&_b]:ml-[2px] [&_b]:inline [&_b]:text-[#d25269]">
      <span>
        {label} <b>*</b>
      </span>

      <div className="flex min-h-[45px] items-center gap-[3px] rounded-[10px] border border-[#e1e8f2] bg-white px-2 text-[#172444] focus-within:border-[#8b71e8] focus-within:shadow-[0_0_0_3px_#7655e31b] dark:border-[#403b50] dark:bg-[#282534] dark:text-[#f0eff8] [&_select]:min-h-[40px] [&_select]:min-w-[50px] [&_select]:flex-1 [&_select]:border-0 [&_select]:bg-transparent [&_select]:px-[5px] [&_select]:py-[7px] [&_select]:text-[14px] [&_select]:font-medium [&_select]:outline-0 [&_select]:text-[#172444] dark:[&_select]:text-[#f0eff8] [&_select:last-child]:flex-[1.2]">
        <select
          aria-label={`${label} hour`}
          value={parts.hour}
          onChange={(event) =>
            update(
              Number(event.target.value),
              parts.minute,
              parts.period
            )
          }
          className={selectClass}
        >
          {Array.from({ length: 12 }, (_, index) => index + 1).map(
            (hour) => (
              <option key={hour} value={hour}>
                {hour}
              </option>
            )
          )}
        </select>

        <span>:</span>

        <select
          aria-label={`${label} minute`}
          value={parts.minute}
          onChange={(event) =>
            update(
              parts.hour,
              Number(event.target.value),
              parts.period
            )
          }
          className={selectClass}
        >
          {Array.from({ length: 60 }, (_, minute) => (
            <option key={minute} value={minute}>
              {String(minute).padStart(2, "0")}
            </option>
          ))}
        </select>

        <select
          aria-label={`${label} AM or PM`}
          value={parts.period}
          onChange={(event) =>
            update(
              parts.hour,
              parts.minute,
              event.target.value
            )
          }
          className={selectClass}
        >
          <option>AM</option>
          <option>PM</option>
        </select>
      </div>
    </label>
  );
}

export default function CreateBatchPage() {
  const router = useRouter();
  const { dark, activateRole, clearRole } = useTheme();

  const [draft, setDraft] = useState<Draft>(initialDraft);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    let live = true;

    void fetch(`${API}/auth/session`, {
      credentials: "include",
    })
      .then(async (response) =>
        response.ok ? response.json() : null
      )
      .then((session) => {
        if (!live) return;

        if (!session || session.user?.role !== "admin") {
          clearRole();
          router.replace("/admin/login");
          return;
        }

        activateRole("admin");
      })
      .catch((reason: unknown) => {
        if (live) {
          setError(
            reason instanceof Error
              ? reason.message
              : "Could not verify the Admin session."
          );
        }
      })
      .finally(() => {
        if (live) setLoading(false);
      });

    return () => {
      live = false;
    };
  }, [activateRole, clearRole, router]);

  const update = (key: keyof Draft, value: string) => {
    setDraft((current) => ({
      ...current,
      [key]: value,
    }));
  };

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");
    setSaving(true);

    try {
      const response = await fetch(`${API}/batches`, {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(draft),
      });

      const result = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(
          result.error ?? "Could not create this batch."
        );
      }

      const createdAt = result.batch?.createdAt
        ? new Date(result.batch.createdAt).toLocaleString("en-IN", {
            dateStyle: "medium",
            timeStyle: "short",
          })
        : "just now";

      setSuccess(
        `${result.batch.name} created successfully at ${createdAt}.`
      );

      window.setTimeout(
        () => router.push("/admin?section=Classes%20%26%20Batches"),
        1100
      );
    } catch (reason) {
      setError(
        reason instanceof Error
          ? reason.message
          : "Could not create this batch."
      );
    } finally {
      setSaving(false);
    }
  };

  const batchesUrl = "/admin?section=Classes%20%26%20Batches";

  return (
    <main
      className={`min-h-screen bg-[linear-gradient(135deg,#f3f7ff_0%,#f8f7ff_50%,#f2f5fc_100%)] px-6 pb-11 text-[14px] text-[#172444] max-[640px]:px-[15px] max-[640px]:pb-[30px] ${
        dark
          ? "dark bg-[linear-gradient(135deg,#171622,#1c1929)] text-[#f0eff8]"
          : ""
      }`}
    >
      <header className="mx-auto flex min-h-[78px] max-w-[1280px] items-center justify-between border-b border-[#e2e8f3] max-[640px]:min-h-[68px] dark:border-[#373345]">
        <Link
          className="flex items-center gap-[11px] text-[#172444] no-underline dark:text-[#e4def8]"
          href="/admin"
        >
          <span className="grid size-11 place-items-center rounded-[14px] bg-[linear-gradient(145deg,#7e61ec,#6947dd)] text-[25px] text-white shadow-[0_7px_18px_#7055d52b] max-[640px]:size-[39px] dark:shadow-none">
            ✳
          </span>

          <span className="grid gap-[2px]">
            <strong className="text-[19px] leading-[1.1] max-[640px]:text-[17px]">
              Udaan
            </strong>
            <small className="text-[9px] font-bold tracking-[1.2px] text-[#7775b2]">
              LEARNING CENTRE
            </small>
          </span>
        </Link>

        <div className="flex items-center gap-[18px] max-[640px]:gap-[9px] [&_.theme-toggle]:origin-right [&_.theme-toggle]:scale-[.85] max-[640px]:[&_.theme-toggle]:scale-[.75]">
          <ThemeToggle />

          <Link
            href={batchesUrl}
            className="text-[13px] font-bold text-[#5b55a6] no-underline hover:text-[#704be2] focus-visible:outline focus-visible:outline-[3px] focus-visible:outline-[#785de466] focus-visible:outline-offset-[3px] max-[640px]:text-[11px]"
          >
            Back to Batches
          </Link>
        </div>
      </header>

      <section className="mx-auto mt-8 w-full max-w-[900px] max-[640px]:mt-[23px]">
        <div className="mb-[19px] flex items-end justify-between gap-5 max-[640px]:block">
          <div>
            <span className="text-[10px] font-extrabold tracking-[1.25px] text-[#7660c9]">
              CLASSES &amp; BATCHES
            </span>

            <h1 className="my-[5px] mb-[7px] text-[clamp(26px,4vw,34px)] leading-[1.15] tracking-[-.7px] text-[#172444] dark:text-[#f0eff8] max-[640px]:text-[27px]">
              Create Batch
            </h1>

            <p className="m-0 text-[14px] leading-[1.5] text-[#71809a] max-[640px]:text-[13px]">
              Set a name and schedule for this tuition batch.
            </p>
          </div>
        </div>

        {loading ? (
          <div className="rounded-[14px] bg-white p-[22px] text-[#71809a] dark:bg-[#211f2b] dark:text-[#b4afc3]">
            Checking your Admin session…
          </div>
        ) : (
          <form
            className="rounded-[19px] border border-[#e5eaf2] bg-white p-6 shadow-[0_14px_42px_#263b6910] dark:border-[#3a3548] dark:bg-[#211f2b] dark:shadow-[0_14px_42px_#0002] max-[640px]:rounded-[15px] max-[640px]:px-[14px] max-[640px]:py-[17px]"
            onSubmit={(event) => void submit(event)}
          >
            {error && (
              <div
                className="mb-4 grid gap-[6px] rounded-[10px] border border-[#f1c8ce] bg-[#fff2f3] px-[14px] py-3 text-[13px] leading-[1.5] text-[#9f3546] dark:border-[#74414b] dark:bg-[#38252a] dark:text-[#ffbcc5]"
                role="alert"
              >
                {error}
              </div>
            )}

            {success && (
              <div
                className="mb-4 grid gap-[6px] rounded-[10px] border border-[#bfe7d2] bg-[#effbf5] px-[14px] py-3 text-[13px] leading-[1.5] text-[#147345] dark:border-[#315d48] dark:bg-[#20352b] dark:text-[#a5e6c1]"
                role="status"
              >
                {success}
              </div>
            )}

            <div className="grid grid-cols-2 gap-x-[19px] gap-y-[17px] max-[640px]:grid-cols-1 max-[640px]:gap-y-[15px]">
              <label className="col-span-full grid content-start gap-[7px] text-[13px] font-bold text-[#172444] dark:text-[#f0eff8]">
                <span>
                  Batch Name{" "}
                  <b className="ml-[2px] text-[#d25269">*</b>
                </span>

                <input
                  className="min-h-[45px] w-full min-w-0 rounded-[10px] border border-[#e1e8f2] bg-white px-3 py-[10px] text-[14px] font-medium leading-[1.4] text-[#172444] outline-none transition-[border-color,box-shadow] placeholder:font-normal placeholder:text-[#9ca8ba] focus:border-[#8b71e8] focus:shadow-[0_0_0_3px_#7655e31b] dark:border-[#403b50] dark:bg-[#282534] dark:text-[#f0eff8] dark:placeholder:text-[#918ca0]"
                  required
                  autoFocus
                  maxLength={60}
                  value={draft.name}
                  onChange={(event) =>
                    update("name", event.target.value)
                  }
                  placeholder="For example, Batch-C"
                />
              </label>

              <TimeField
                label="Start Time"
                value={draft.startTime}
                onChange={(startTime) => update("startTime", startTime)}
              />

              <TimeField
                label="End Time"
                value={draft.endTime}
                onChange={(endTime) => update("endTime", endTime)}
              />
            </div>

            <div className="mt-[21px] flex justify-end gap-[10px] border-t border-[#edf0f5] pt-[17px] max-[640px]:[&>*]:flex-1">
              <Link
                href={batchesUrl}
                className="inline-flex min-h-[43px] items-center justify-center rounded-[10px] border border-[#e1e8f2] bg-white px-[17px] text-[13px] font-bold text-[#5d6c84] no-underline focus-visible:outline focus-visible:outline-[3px] focus-visible:outline-[#785de466] focus-visible:outline-offset-[3px] max-[640px]:px-[9px] dark:border-[#403b50] dark:bg-[#211f2b] dark:text-[#d4cfe0]"
              >
                Cancel
              </Link>

              <button
                className="inline-flex min-h-[43px] items-center justify-center rounded-[10px] border border-[#694ed7] bg-[linear-gradient(135deg,#785de4,#6546cf)] px-[17px] text-[13px] font-bold text-white shadow-[0_6px_15px_#7658d426] hover:bg-[#5e40c5] active:translate-y-px disabled:cursor-wait disabled:opacity-[.65] focus-visible:outline focus-visible:outline-[3px] focus-visible:outline-[#785de466] focus-visible:outline-offset-[3px] max-[640px]:px-[9px]"
                type="submit"
                disabled={saving || loading}
              >
                {saving ? "Creating batch…" : "Create Batch"}
              </button>
            </div>
          </form>
        )}
      </section>
    </main>
  );
}
