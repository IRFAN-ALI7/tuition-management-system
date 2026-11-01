
import { ensureFeeLedgersThrough } from "./feeLedger.service";

const INDIA_TIME_ZONE = "Asia/Kolkata";
const RETRY_DELAY = 5 * 60 * 1000;

// Node.js setTimeout maximum safe delay.
const MAX_TIMEOUT = 2_147_000_000;

let scheduledTimer: ReturnType<typeof setTimeout> | null = null;
let started = false;

function getIndiaPeriod() {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: INDIA_TIME_ZONE,
    year: "numeric",
    month: "numeric",
  }).formatToParts(new Date());

  const year = Number(
    parts.find((part) => part.type === "year")?.value
  );

  const month = Number(
    parts.find((part) => part.type === "month")?.value
  );

  return { year, month };
}

function getNextMonthStart(): number {
  const { year, month } = getIndiaPeriod();

  // India is UTC+05:30.
  return (
    Date.UTC(year, month, 1, 0, 0, 0) -
    5.5 * 60 * 60 * 1000
  );
}

function scheduleAt(targetTime: number) {
  if (scheduledTimer) {
    clearTimeout(scheduledTimer);
  }

  const remaining = targetTime - Date.now();

  if (remaining <= 0) {
    scheduledTimer = setTimeout(() => {
      void runMonthlyGeneration();
    }, 1000);

    return;
  }

  // Break long waits into safe Node.js timeout intervals.
  const delay = Math.min(remaining, MAX_TIMEOUT);

  scheduledTimer = setTimeout(() => {
    if (Date.now() >= targetTime) {
      void runMonthlyGeneration();
    } else {
      scheduleAt(targetTime);
    }
  }, delay);
}

function scheduleNextRun(delay?: number) {
  const targetTime =
    delay !== undefined
      ? Date.now() + delay
      : getNextMonthStart();

  scheduleAt(targetTime);
}

async function runMonthlyGeneration() {
  try {
    const { year, month } = getIndiaPeriod();

    console.log(
      `Running monthly fee ledger generation for ${month}/${year}...`
    );

    await ensureFeeLedgersThrough(year, month);

    console.log(
      `Monthly fee ledger generation completed for ${month}/${year}.`
    );

    scheduleNextRun();
  } catch (error) {
    console.error(
      "Monthly fee ledger generation failed:",
      error
    );

    // Retry after five minutes if generation fails.
    scheduleNextRun(RETRY_DELAY);
  }
}

/**
 * Call once after MongoDB connection.
 *
 * Generates missing records immediately on startup,
 * then schedules the next run for the first day of
 * the next month in India.
 */
export async function startFeeScheduler(): Promise<void> {
  if (started) return;

  started = true;

  console.log("Starting monthly fee scheduler...");

  await runMonthlyGeneration();
}
