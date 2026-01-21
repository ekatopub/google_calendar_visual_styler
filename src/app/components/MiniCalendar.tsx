import { DateRange, DayPicker, Modifiers, CalendarDay } from "react-day-picker";
import { format } from "date-fns";
import React from "react";

export type MiniCalendarProps = {
  range: DateRange | undefined;
  setRange: (range: DateRange | undefined) => void;
  eventsByDate: Record<string, any[]>;
  modifiers: Modifiers;
  modifiersStyles: Record<string, React.CSSProperties>;
  onShowEvents: () => void;
  events: any[];
};

export const MiniCalendar: React.FC<MiniCalendarProps> = ({
  range,
  setRange,
  eventsByDate,
  modifiers,
  modifiersStyles,
  onShowEvents,
  events,
}) => {
  // 日セルにイベントタイトルを表示
  const renderDayWithEvents = (props: { day: CalendarDay; modifiers: Modifiers } & React.HTMLAttributes<HTMLDivElement>) => {
    const { day } = props;
    if (!(day instanceof Date) || isNaN(day.getTime())) {
      return <></>;
    }
    const dateStr = format(day, 'yyyy-MM-dd');
    const dayEvents = eventsByDate[dateStr] || [];
    return (
      <>
        <span>{day.getDate()}</span>
        {dayEvents.length > 0 && (
          <span style={{ display: 'block', fontSize: '0.7em', color: '#1976d2', marginTop: 2 }}>
            {dayEvents.map((ev: any) => (
              <span key={ev.id}>{ev.summary}<br /></span>
            ))}
          </span>
        )}
      </>
    );
  };

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
