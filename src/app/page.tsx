// State to control which calendar is shown

"use client";
import { useSession, signIn, signOut, SessionProvider } from "next-auth/react";
import { useEffect, useState } from "react";
import { format } from "date-fns";
import dynamic from "next/dynamic";

// 大きなカレンダー（react-big-calendar）
// import type { BigCalendarEvent } from "./components/CalendarView"; // 未使用のため削除
const CalendarView = dynamic(() => import("./components/CalendarView"), { ssr: false });
// import { DateRange, DayPicker, CalendarDay, Matcher } from "react-day-picker";
// import { MiniCalendar } from "./components/MiniCalendar";

type CalendarEvent = {
  id: string;
  summary?: string;
  description?: string;
  location?: string;
  start: { dateTime?: string; date?: string };
  end: { dateTime?: string; date?: string };
  colorId?: string;
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
  const { data: session, status } = useSession();
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [range, setRange] = useState<{ start: Date; end: Date } | null>(() => {
    const now = new Date();
    const start = new Date(now.getFullYear(), now.getMonth(), 1);
    const end = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
    return { start, end };
  });
  const [loading, setLoading] = useState(false);
  const [authError, setAuthError] = useState(false);

  // Big Calendarの表示範囲が変わるたびにイベント自動取得
  useEffect(() => {
    if (!session || !range) return;
    const fetchEvents = async () => {
      setLoading(true);
      const start = format(range.start, "yyyy-MM-dd'T'00:00:00XXX");
      const end = format(range.end, "yyyy-MM-dd'T'23:59:59XXX");
      const res = await fetch(`/api/calendar?start=${encodeURIComponent(start)}&end=${encodeURIComponent(end)}`);
      if (res.status === 401) {
        setAuthError(true);
        setLoading(false);
        return;
      }
      const data = await res.json();
      console.log('Fetched events from API:', data);
      setEvents(Array.isArray(data) ? data : []);
      setLoading(false);
    };
    fetchEvents();
  }, [session, range]);

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
    <div className="min-h-screen bg-zinc-50 p-8 text-black">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-2xl font-bold">Googleカレンダー印刷用</h1>
        <button onClick={() => signOut()} className="text-sm text-blue-500">ログアウト</button>
      </div>
      {/* 認証エラー時のポップアップ */}
      {authError && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100vw',
          height: '100vh',
          background: 'rgba(0,0,0,0.4)',
          zIndex: 1000,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}>
          <div style={{ background: '#fff', padding: 32, borderRadius: 12, boxShadow: '0 2px 8px rgba(0,0,0,0.2)', minWidth: 320, textAlign: 'center' }}>
            <p style={{ fontWeight: 'bold', marginBottom: 16 }}>認証が切れました</p>
            <p style={{ marginBottom: 24 }}>一度ログアウトして、再度ログインしてください。</p>
            <button onClick={() => signOut()} className="rounded bg-blue-500 px-4 py-2 text-white hover:bg-blue-600">ログアウト</button>
          </div>
        </div>
      )}
      {/* 大きなカレンダーのみ表示 */}
      <div className="my-12">
        <CalendarView
          events={(() => {
            const mapped = events.map(ev => {
              const isAllDay = Boolean(ev.start.date && !ev.start.dateTime);
              const start = ev.start.dateTime
                ? new Date(ev.start.dateTime)
                : ev.start.date
                  ? new Date(ev.start.date)
                  : new Date();
              let end;
              if (ev.end.dateTime) {
                end = new Date(ev.end.dateTime);
              } else if (ev.end.date) {
                // 終日イベントはGoogle API仕様でend.dateが翌日になるので1日引く
                const endDate = new Date(ev.end.date);
                if (isAllDay) {
                  endDate.setDate(endDate.getDate() - 1);
                }
                end = endDate;
              } else {
                end = new Date();
              }
              return {
                title: ev.summary || "(タイトルなし)",
                start,
                end,
                allDay: isAllDay,
                colorId: ev.colorId,
              };
            });
            console.log('Mapped events for CalendarView:', mapped);
            return mapped;
          })()}
          onRangeChange={setRange}
        />
        {loading && <div className="mt-4 text-center text-blue-500">予定を取得中...</div>}
      </div>
    </div>
  );
}
