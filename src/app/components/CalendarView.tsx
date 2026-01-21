import { Calendar, dateFnsLocalizer, Event } from 'react-big-calendar';
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
};


const CalendarView: React.FC<CalendarViewProps> = ({ events }) => (
  <div style={{ height: 500 }}>
    <Calendar
      localizer={localizer}
      events={events}
      startAccessor="start"
      endAccessor="end"
      style={{ height: '100%' }}
      culture="ja"
    />
  </div>
);

export default CalendarView;
