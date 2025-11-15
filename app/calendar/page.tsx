"use client";

import CalendarPage from '@/app/dashboard/calendar/page';

export default function PublicCalendar() {
  // Render the calendar without create controls for public users
  return <CalendarPage allowCreate={false} />;
}
