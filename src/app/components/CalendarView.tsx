import { Calendar, dateFnsLocalizer } from 'react-big-calendar';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import { format, parse, startOfWeek, getDay } from 'date-fns';
import { ja } from 'date-fns/locale/ja';
import React from 'react';

//https://qiita.com/KyongminS/items/2ae488969d631e795c64
//https://jquense.github.io/react-big-calendar/examples/?path=/story/about-big-calendar--page

const locales = {
  'ja': ja,
};

const localizer = dateFnsLocalizer({
  format,
  parse,
  startOfWeek: () => startOfWeek(new Date(), { weekStartsOn: 0 }),
  getDay,
  locales,
});


// APIから受け取ったイベントをpropsで受け取る
export type BigCalendarEvent = {
  title: string;
  start: Date;
  end: Date;
  allDay?: boolean;
};

type CalendarViewProps = {
  events: BigCalendarEvent[];
  onRangeChange?: (range: { start: Date; end: Date }) => void;
};



import { useRef } from 'react';

const CalendarView: React.FC<CalendarViewProps> = ({ events, onRangeChange }) => {
  const calendarRef = useRef(null);
  // 初回マウント時に初期rangeを取得してonRangeChangeを呼ぶ
  // 初回描画時のrange取得はhandleRangeChangeで対応するため、ここでは何もしない

  const handleRangeChange = (range: Date[] | { start: Date; end: Date }) => {
    if (Array.isArray(range)) {
      if (range.length > 0 && onRangeChange) {
        onRangeChange({ start: range[0], end: range[range.length - 1] });
      }
    } else if (range && 'start' in range && 'end' in range && onRangeChange) {
      onRangeChange({ start: range.start, end: range.end });
    } else if (!range && onRangeChange) {
      // react-big-calendarの初期描画時: rangeがundefinedで呼ばれる場合がある
      // その場合、今日を含む月の範囲を渡す
      const now = new Date();
      const start = new Date(now.getFullYear(), now.getMonth(), 1);
      const end = new Date(now.getFullYear(), now.getMonth() + 1, 0);
      onRangeChange({ start, end });
    }
  };
  return (
    <div style={{ height: 500 }}>
      <Calendar<BigCalendarEvent>
        ref={calendarRef}
        localizer={localizer}
        events={events}
        startAccessor={(event) => event.start}
        endAccessor={(event) => event.end}
        style={{ height: '100%' }}
        culture="ja"
        onRangeChange={handleRangeChange}
      />
    </div>
  );
};

export default CalendarView;
