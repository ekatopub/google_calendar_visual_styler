// State to control which calendar is shown

"use client";
import "react-day-picker/dist/style.css";
import { useSession, signIn, signOut, SessionProvider } from "next-auth/react";
import { useEffect, useState } from "react";
import { format } from "date-fns";
import dynamic from "next/dynamic";

// 大きなカレンダー（react-big-calendar）
// import type { BigCalendarEvent } from "./components/CalendarView"; // 未使用のため削除
const CalendarView = dynamic(() => import("./components/CalendarView"), { ssr: false });
import { DateRange, DayPicker, CalendarDay, Matcher } from "react-day-picker";
import { MiniCalendar } from "./components/MiniCalendar";
import "./react-day-picker-darkfix.css";

type CalendarEvent = {
  id: string;
  summary?: string;
  description?: string;
  location?: string;
  start: { dateTime?: string; date?: string };
  end: { dateTime?: string; date?: string };
};


// Home: wraps CalendarPage in SessionProvider
export default function Home() {
  return (
    <SessionProvider>
      <CalendarPage />
    </SessionProvider>
  );
}

// All hooks and logic must be inside a component
function CalendarPage() {
  const [showMiniCalendar, setShowMiniCalendar] = useState(true);
  const { data: session, status } = useSession();
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  // const [loading, setLoading] = useState(false); // Unused, so removed
  const [range, setRange] = useState<DateRange | undefined>();

  // APIからのeventsが配列でない場合に備えて防御
  const safeEvents = Array.isArray(events) ? events : [];
  // イベントを日付ごとにグループ化
  const eventsByDate = safeEvents.reduce<Record<string, CalendarEvent[]>>((acc, event) => {
    // 日付を取得（dateTime優先、なければdate）
    const dateStr = event.start.dateTime
      ? format(new Date(event.start.dateTime), 'yyyy-MM-dd')
      : event.start.date
        ? event.start.date
        : '';
    if (!dateStr) return acc;
    if (!acc[dateStr]) acc[dateStr] = [];
    acc[dateStr].push(event);
    return acc;
  }, {});

  // minicalender:土日をハイライトするmodifiers
  const modifiers: Record<string, Matcher | Matcher[] | undefined> = {
    weekend: (date: Date) => date.getDay() === 0 || date.getDay() === 6,
  };

  // minicalender:週末を赤色で表示
  const modifiersStyles = {
    weekend: { color: 'red' },
  };

  // ？calender: 日セルにイベントタイトルを表示
  const renderDayWithEvents = (props: { day: CalendarDay; modifiers: Record<string, Matcher | Matcher[] | undefined> } & React.HTMLAttributes<HTMLDivElement>) => {
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
            {dayEvents.map(ev => (
              <span key={ev.id}>{ev.summary}<br /></span>
            ))}
          </span>
        )}
      </>
    );
  };

  // 「予定を見る」ボタンを押したときのみイベント取得
  const [shouldFetchEvents, setShouldFetchEvents] = useState(false);
  useEffect(() => {
    if (shouldFetchEvents && status === "authenticated" && range?.from && range?.to) {
      const fetchEvents = async () => {
        // setLoading(true); // loading is unused
        const start = format(range.from!, "yyyy-MM-dd'T'00:00:00XXX");
        const end = format(range.to!, "yyyy-MM-dd'T'23:59:59XXX");
        const res = await fetch(`/api/calendar?start=${encodeURIComponent(start)}&end=${encodeURIComponent(end)}`);
        const data = await res.json();
        console.log("[DEBUG] Fetched events:", data);
        setEvents(Array.isArray(data) ? data : []);
        // setLoading(false); // loading is unused
        setShouldFetchEvents(false); // 取得後はリセット
      };
      fetchEvents();
    }
  }, [shouldFetchEvents, status, range]);

  if (status === "loading") return <div>Loading...</div>;

  if (!session) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen">
        <h2>Google-Calender-Visual-Styler</h2>
        <p>グーグルカレンダーを読み込み、印刷に適した色に調整します。</p>
        <p>グーグルアカウントにログインしてください。</p>
        <button onClick={() => signIn("google")}
          className="rounded bg-blue-500 px-4 py-2 text-white hover:bg-blue-600">
          Googleでログイン
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-black p-8 text-black dark:text-white">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-2xl font-bold">Googleカレンダー予定一覧</h1>
        <button onClick={() => signOut()} className="text-sm text-blue-500 dark:text-blue-300">ログアウト</button>
      </div>
      {/* Calendar 1: Mini DayPicker for range selection */}
      {showMiniCalendar && (
        <MiniCalendar
          range={range}
          setRange={setRange}
          eventsByDate={eventsByDate}
          modifiers={modifiers}
          modifiersStyles={modifiersStyles}
          onShowEvents={() => {
            setShowMiniCalendar(false);
            setShouldFetchEvents(true);
          }}
        />
      )}

      {!showMiniCalendar && (
        <div className="mb-6">
          <p className="text-lg font-semibold mb-2">選択した期間の予定</p>
          <DayPicker
            mode="range"
            selected={range}
            onSelect={setRange}
            showOutsideDays
            className="bg-white dark:bg-zinc-800 rounded shadow-lg p-8 text-black dark:text-white w-full max-w-2xl mx-auto text-base"
            modifiers={modifiers}
            modifiersStyles={modifiersStyles}
            components={{ Day: renderDayWithEvents }}
          />
          <button
            className="mt-4 px-4 py-2 bg-gray-500 text-white rounded"
            onClick={() => setShowMiniCalendar(true)}
          >
            日付を再選択する
          </button>
        </div>
      )}
      {/* イベントリストは非表示にする（カレンダーのみ表示） */}
      <button onClick={() => window.print()} className="mt-8 px-4 py-2 bg-green-500 text-white rounded print:hidden">印刷</button>

      {/* 大きなカレンダーを画面下部に表示 */}
      <div className="my-12">
        <CalendarView events={events.map(ev => ({
          title: ev.summary || "(タイトルなし)",
          start: ev.start.dateTime ? new Date(ev.start.dateTime) : ev.start.date ? new Date(ev.start.date) : new Date(),
          end: ev.end.dateTime ? new Date(ev.end.dateTime) : ev.end.date ? new Date(ev.end.date) : new Date(),
          allDay: Boolean(ev.start.date && !ev.start.dateTime),
        }))} />
      </div>
    </div>
  );
}
