
import { DateRange, DayPicker, Matcher } from "react-day-picker";
import { format } from "date-fns";
import React from "react";

// Duplicate the CalendarEvent type here to avoid import issues from app directory
type CalendarEvent = {
  id: string;
  summary?: string;
  description?: string;
  location?: string;
  start: { dateTime?: string; date?: string };
  end: { dateTime?: string; date?: string };
};



export type MiniCalendarProps = {
  range: DateRange | undefined;
  setRange: (range: DateRange | undefined) => void;
  eventsByDate: Record<string, CalendarEvent[]>;
  modifiers: Record<string, Matcher | Matcher[] | undefined>;
  modifiersStyles: Record<string, React.CSSProperties>;
  onShowEvents: () => void;
};


export const MiniCalendar: React.FC<MiniCalendarProps> = ({
  range,
  setRange,
  //eventsByDate,
  modifiers,
  modifiersStyles,
  onShowEvents,
}) => {
  return (
    <div className="mb-6">
      <p>取得する開始日と終了日を選択してください</p>
      <DayPicker
        mode="range"
        selected={range}
        onSelect={setRange}
        showOutsideDays
        className="bg-white dark:bg-zinc-800 rounded shadow p-2 text-black dark:text-white w-64 mx-auto"
        modifiers={modifiers}
        modifiersStyles={modifiersStyles}
      />
      <div className="mt-2 text-sm text-zinc-600 dark:text-zinc-300">
        {range?.from && range?.to
          ? `${format(range.from, "yyyy/MM/dd")} ～ ${format(range.to, "yyyy/MM/dd")}`
          : "期間を選択してください"}
      </div>
      <button
        className="mt-4 px-4 py-2 bg-blue-500 text-white rounded"
        onClick={onShowEvents}
      >
        予定を見る
      </button>
    </div>
  );
};
