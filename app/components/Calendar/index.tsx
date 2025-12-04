'use client';

import { useState } from 'react';
import { format, addDays, isSameDay, startOfDay, endOfDay } from 'date-fns';
import { CalendarEvent, EventTypeConfig } from '../../types/calendar';
import { ChevronLeft, ChevronRight } from 'lucide-react';

const eventTypeConfig: Record<CalendarEvent['type'], EventTypeConfig> = {
  'youth-class': {
    label: 'Youth Class',
    color: 'bg-blue-500',
    textColor: 'text-white',
    icon: '🎯'
  },
  'game': {
    label: 'Game',
    color: 'bg-green-500',
    textColor: 'text-white',
    icon: '🏆'
  },
  'practice': {
    label: 'Practice',
    color: 'bg-purple-500',
    textColor: 'text-white',
    icon: '⚽'
  },
  'community': {
    label: 'Community',
    color: 'bg-orange-500',
    textColor: 'text-white',
    icon: '👥'
  },
  'other': {
    label: 'Other',
    color: 'bg-gray-500',
    textColor: 'text-white',
    icon: '📅'
  }
};

interface CalendarProps {
  events: CalendarEvent[];
  onEventClick: (event: CalendarEvent) => void;
}

const Calendar: React.FC<CalendarProps> = ({ events, onEventClick }) => {
  const [startDate, setStartDate] = useState(new Date());
  const daysToShow = 7; // Show a week at a time

  const days = Array.from({ length: daysToShow }, (_, i) => addDays(startDate, i));

  const getEventsForDay = (day: Date) => {
    const dayStart = startOfDay(day);
    const dayEnd = endOfDay(day);
    return events.filter(event => 
      event.startTime >= dayStart && event.startTime <= dayEnd
    );
  };

  const handlePrevWeek = () => {
    setStartDate(prev => addDays(prev, -7));
  };

  const handleNextWeek = () => {
    setStartDate(prev => addDays(prev, 7));
  };

  return (
    <div className="calendar-container">
      <div className="calendar-header">
        <h2 className="calendar-title">
          {format(startDate, 'MMMM yyyy')}
        </h2>
        <div className="flex gap-2">
          <button onClick={handlePrevWeek} className="calendar-nav-button">
            <ChevronLeft className="w-5 h-5" />
          </button>
          <button onClick={handleNextWeek} className="calendar-nav-button">
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
      </div>

      <div className="calendar-day-view">
        {days.map((day, dayIndex) => {
          const dayEvents = getEventsForDay(day);
          const isToday = isSameDay(day, new Date());

          return (
            <div key={day.toISOString()} className="day-container">
              <div className="day-header">
                <div className="flex items-center gap-2">
                  <span>{format(day, 'EEEE, MMMM d')}</span>
                  {isToday && <span className="today-indicator">Today</span>}
                </div>
              </div>
              <div className="day-content">
                {dayEvents.length > 0 ? (
                  dayEvents.map((event, eventIndex) => (
                    <div
                      key={`${event.id}-${dayIndex}-${eventIndex}`}
                      className={`calendar-event ${event.type}`}
                      onClick={() => onEventClick(event)}
                    >
                      <div className="flex justify-between items-center">
                        <span>{event.title}</span>
                        <span className="text-sm opacity-75">
                          {format(event.startTime, 'h:mm a')} - {format(event.endTime, 'h:mm a')}
                        </span>
                      </div>
                      {event.host && (
                        <div className="text-sm opacity-75 mt-1">
                          Host: {event.host}
                        </div>
                      )}
                    </div>
                  ))
                ) : (
                  <div className="text-gray-500 text-center py-4">
                    No events scheduled
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default Calendar;