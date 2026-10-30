type TimePickerProps = {
  label: string;
  value: string;
  onChange: (next: string) => void;
};

const timeParts = (time: string) => {
  const [rawHour, minute] = time.split(":").map(Number);

  return {
    hour: rawHour % 12 || 12,
    minute,
    period: rawHour >= 12 ? "PM" : "AM",
  };
};

const joinTime = (hour: number, minute: number, period: string) =>
  `${String((hour % 12) + (period === "PM" ? 12 : 0)).padStart(2, "0")}:${String(minute).padStart(2, "0")}`;

export default function TimePicker({
  label,
  value,
  onChange,
}: TimePickerProps) {
  const parts = timeParts(value);

  const update = (hour: number, minute: number, period: string) =>
    onChange(joinTime(hour, minute, period));

  return (
    <label className="flex flex-col gap-2 text-sm font-medium">
      <span>{label}</span>

      <div className="flex items-center gap-2">
        <select
          aria-label={`${label} hour`}
          value={parts.hour}
          onChange={(e) =>
            update(Number(e.target.value), parts.minute, parts.period)
          }
          className="min-w-0 flex-1 rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm dark:border-gray-700 dark:bg-gray-900"
        >
          {Array.from({ length: 12 }, (_, i) => i + 1).map((hour) => (
            <option key={hour}>
              {String(hour).padStart(2, "0")}
            </option>
          ))}
        </select>

        <b>:</b>

        <select
          aria-label={`${label} minute`}
          value={parts.minute}
          onChange={(e) =>
            update(parts.hour, Number(e.target.value), parts.period)
          }
          className="min-w-0 flex-1 rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm dark:border-gray-700 dark:bg-gray-900"
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
          onChange={(e) =>
            update(parts.hour, parts.minute, e.target.value)
          }
          className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm dark:border-gray-700 dark:bg-gray-900"
        >
          <option>AM</option>
          <option>PM</option>
        </select>
      </div>
    </label>
  );
}