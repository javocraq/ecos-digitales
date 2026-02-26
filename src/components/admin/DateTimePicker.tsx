import { useState, useMemo } from "react";
import { format, parse } from "date-fns";
import { es } from "date-fns/locale";
import { CalendarIcon, X } from "lucide-react";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

interface DateTimePickerProps {
  value: string; // "YYYY-MM-DDTHH:mm" or ""
  onChange: (value: string) => void;
  error?: boolean;
}

function pad(n: number) {
  return n.toString().padStart(2, "0");
}

function parseValue(value: string) {
  if (!value) return { date: undefined, hour: 12, minute: 0 };
  const [datePart, timePart] = value.split("T");
  const [y, m, d] = datePart.split("-").map(Number);
  const [h, min] = timePart.split(":").map(Number);
  return { date: new Date(y, m - 1, d), hour: h, minute: min };
}

function buildValue(date: Date, hour: number, minute: number): string {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(hour)}:${pad(minute)}`;
}

export function DateTimePicker({ value, onChange, error }: DateTimePickerProps) {
  const [open, setOpen] = useState(false);
  const parsed = useMemo(() => parseValue(value), [value]);

  const handleDaySelect = (day: Date | undefined) => {
    if (!day) return;
    onChange(buildValue(day, parsed.hour, parsed.minute));
  };

  const handleHourChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const h = Number(e.target.value);
    if (parsed.date) {
      onChange(buildValue(parsed.date, h, parsed.minute));
    }
  };

  const handleMinuteChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const m = Number(e.target.value);
    if (parsed.date) {
      onChange(buildValue(parsed.date, parsed.hour, m));
    }
  };

  const handleClear = () => {
    onChange("");
    setOpen(false);
  };

  const displayText = value
    ? format(parse(value, "yyyy-MM-dd'T'HH:mm", new Date()), "d MMM yyyy, hh:mm a", { locale: es })
    : "Sin fecha (borrador)";

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          className={`inline-flex items-center gap-2 h-10 w-full rounded-lg border px-3 text-sm transition-all duration-200 text-left ${
            error
              ? "border-red-300"
              : "border-neutral-200 hover:border-neutral-300"
          } ${
            value
              ? "text-neutral-800 bg-neutral-50/50"
              : "text-neutral-400 bg-neutral-50/50"
          }`}
        >
          <CalendarIcon className="h-4 w-4 shrink-0 text-neutral-400" />
          <span className="truncate">{displayText}</span>
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <Calendar
          mode="single"
          selected={parsed.date}
          onSelect={handleDaySelect}
          locale={es}
          initialFocus
          className="pointer-events-auto"
        />
        <div className="border-t border-neutral-100 px-3 py-3 flex items-center gap-2">
          <label className="text-xs text-neutral-500">Hora:</label>
          <select
            value={parsed.hour}
            onChange={handleHourChange}
            disabled={!parsed.date}
            className="h-8 rounded-md border border-neutral-200 bg-white px-2 text-sm text-neutral-800 focus:outline-none focus:ring-2 focus:ring-neutral-900/5"
          >
            {Array.from({ length: 24 }, (_, i) => (
              <option key={i} value={i}>
                {pad(i)}
              </option>
            ))}
          </select>
          <span className="text-neutral-400">:</span>
          <select
            value={parsed.minute}
            onChange={handleMinuteChange}
            disabled={!parsed.date}
            className="h-8 rounded-md border border-neutral-200 bg-white px-2 text-sm text-neutral-800 focus:outline-none focus:ring-2 focus:ring-neutral-900/5"
          >
            {Array.from({ length: 60 }, (_, i) => (
              <option key={i} value={i}>
                {pad(i)}
              </option>
            ))}
          </select>
        </div>
        {value && (
          <div className="border-t border-neutral-100 px-3 py-2">
            <button
              type="button"
              onClick={handleClear}
              className="inline-flex items-center gap-1.5 text-xs text-neutral-500 hover:text-neutral-700 transition-colors duration-200"
            >
              <X className="h-3 w-3" />
              Limpiar
            </button>
          </div>
        )}
      </PopoverContent>
    </Popover>
  );
}
