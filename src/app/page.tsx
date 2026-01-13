// State to control which calendar is shown

"use client";
import "react-day-picker/dist/style.css";
import { useSession, signIn, signOut, SessionProvider } from "next-auth/react";
import { useEffect, useState } from "react";
import { format } from "date-fns";
import { DateRange, DayPicker, Modifiers, CalendarDay } from "react-day-picker";
import "./react-day-picker-darkfix.css";




type CalendarEvent = {
  id: string;
  summary?: string;
  description?: string;
  location?: string;
  start: { dateTime?: string; date?: string };
  end: { dateTime?: string; date?: string };
};


export default function Home() {
  return (
    <SessionProvider>
      <CalendarPage />
    </SessionProvider>
  );
}




function CalendarPage() {
  const [showMiniCalendar, setShowMiniCalendar] = useState(true);
  // ...existing code...
  const { data: session, status } = useSession();
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [loading, setLoading] = useState(false);
  const [range, setRange] = useState<DateRange | undefined>();

  // イベントを日付ごとにグループ化
  const eventsByDate = events.reduce<Record<string, CalendarEvent[]>>((acc, event) => {
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

  // 例: 土日をハイライトするmodifiers
  const modifiers = {
    weekend: (date: Date) => date.getDay() === 0 || date.getDay() === 6,
  };

  // 週末を赤色で表示し、イベントも表示するカスタムDay
  const modifiersStyles = {
    weekend: { color: 'red' },
  };

  // カレンダー2: 日セルにイベントタイトルを表示
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
            {dayEvents.map(ev => (
              <span key={ev.id}>{ev.summary}<br /></span>
            ))}
          </span>
        )}
      </>
    );
  };

  useEffect(() => {
    if (status === "authenticated" && range?.from && range?.to) {
      const fetchEvents = async () => {
        setLoading(true);
        const start = format(range.from!, "yyyy-MM-dd'T'00:00:00XXX");
        const end = format(range.to!, "yyyy-MM-dd'T'23:59:59XXX");
        const res = await fetch(`/api/calendar?start=${encodeURIComponent(start)}&end=${encodeURIComponent(end)}`);
        const data = await res.json();
        setEvents(data);
        setLoading(false);
      };
      fetchEvents();
    }
  }, [status, range]);

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
          {(events && events.length > 0) && (
            <button
              className="mt-4 px-4 py-2 bg-blue-500 text-white rounded"
              onClick={() => setShowMiniCalendar(false)}
            >
              予定を見る
            </button>
          )}
        </div>
      )}
      {/* Calendar 2: Large calendar with event overlays */}
      {!showMiniCalendar && (events && events.length > 0) && (
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
      {loading ? (
        <div>予定を取得中...</div>
      ) : (
        <div className="bg-white dark:bg-zinc-800 rounded shadow p-4 print:p-0 print:shadow-none text-black dark:text-white">
          <ul>
            {events && events.length > 0 ? events.map((event) => (
              <li key={event.id} className="mb-4 border-b pb-2 print:border-none print:pb-0">
                <div className="font-semibold">{event.summary}</div>
                <div className="text-sm text-zinc-600 dark:text-zinc-300">
                  {event.start?.dateTime || event.start?.date} ～ {event.end?.dateTime || event.end?.date}
                </div>
                {event.location && <div className="text-xs text-zinc-500 dark:text-zinc-400">{event.location}</div>}
                {event.description && <div className="text-xs text-zinc-400 dark:text-zinc-500">{event.description}</div>}
              </li>
            )) : <div className="text-zinc-500 dark:text-zinc-400">予定がありません</div>}
          </ul>
        </div>
      )}
      <button onClick={() => window.print()} className="mt-8 px-4 py-2 bg-green-500 text-white rounded print:hidden">印刷</button>
    </div>
  );
}
