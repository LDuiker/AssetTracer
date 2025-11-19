'use client';

import { useState, useMemo } from 'react';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isSameDay, addMonths, subMonths, startOfWeek, endOfWeek } from 'date-fns';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import type { Reservation } from '@/types/reservation';

interface ReservationsCalendarProps {
  reservations: Reservation[];
  onDateClick: (date: Date) => void;
  onReservationClick: (reservation: Reservation) => void;
}

const statusColors: Record<string, string> = {
  pending: 'bg-yellow-100 text-yellow-800 border-yellow-300 dark:bg-yellow-900/20 dark:text-yellow-300 dark:border-yellow-700',
  confirmed: 'bg-blue-100 text-blue-800 border-blue-300 dark:bg-blue-900/20 dark:text-blue-300 dark:border-blue-700',
  active: 'bg-green-100 text-green-800 border-green-300 dark:bg-green-900/20 dark:text-green-300 dark:border-green-700',
  completed: 'bg-gray-100 text-gray-800 border-gray-300 dark:bg-gray-700/20 dark:text-gray-300 dark:border-gray-600',
  cancelled: 'bg-red-100 text-red-800 border-red-300 dark:bg-red-900/20 dark:text-red-300 dark:border-red-700',
};

export function ReservationsCalendar({
  reservations,
  onDateClick,
  onReservationClick,
}: ReservationsCalendarProps) {
  const [currentMonth, setCurrentMonth] = useState(new Date());

  // Get all days in the current month view (including previous/next month days for full weeks)
  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const calendarStart = startOfWeek(monthStart, { weekStartsOn: 0 }); // Sunday
  const calendarEnd = endOfWeek(monthEnd, { weekStartsOn: 0 }); // Sunday
  const daysInMonth = eachDayOfInterval({ start: calendarStart, end: calendarEnd });

  // Group reservations by date
  const reservationsByDate = useMemo(() => {
    const grouped: Record<string, Reservation[]> = {};
    reservations.forEach((reservation) => {
      const start = new Date(reservation.start_date);
      const end = new Date(reservation.end_date);
      const days = eachDayOfInterval({ start, end });
      
      days.forEach((day) => {
        const dateKey = format(day, 'yyyy-MM-dd');
        if (!grouped[dateKey]) {
          grouped[dateKey] = [];
        }
        // Only add if not already in array (for multi-day reservations)
        if (!grouped[dateKey].some((r) => r.id === reservation.id)) {
          grouped[dateKey].push(reservation);
        }
      });
    });
    return grouped;
  }, [reservations]);

  const previousMonth = () => {
    setCurrentMonth(subMonths(currentMonth, 1));
  };

  const nextMonth = () => {
    setCurrentMonth(addMonths(currentMonth, 1));
  };

  const goToToday = () => {
    setCurrentMonth(new Date());
  };

  const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  return (
    <Card>
      <CardContent className="p-6">
        {/* Calendar Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <Button variant="outline" size="icon" onClick={previousMonth}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white min-w-[200px] text-center">
              {format(currentMonth, 'MMMM yyyy')}
            </h2>
            <Button variant="outline" size="icon" onClick={nextMonth}>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
          <Button variant="outline" onClick={goToToday} className="gap-2">
            <CalendarIcon className="h-4 w-4" />
            Today
          </Button>
        </div>

        {/* Calendar Grid */}
        <div className="grid grid-cols-7 gap-1">
          {/* Week day headers */}
          {weekDays.map((day) => (
            <div
              key={day}
              className="p-2 text-center text-sm font-medium text-gray-500 dark:text-gray-400"
            >
              {day}
            </div>
          ))}

          {/* Calendar days */}
          {daysInMonth.map((day) => {
            const dateKey = format(day, 'yyyy-MM-dd');
            const dayReservations = reservationsByDate[dateKey] || [];
            const isCurrentMonth = isSameMonth(day, currentMonth);
            const isToday = isSameDay(day, new Date());

            return (
              <div
                key={dateKey}
                className={`
                  min-h-[100px] border rounded-lg p-2
                  ${isCurrentMonth ? 'bg-white dark:bg-gray-800' : 'bg-gray-50 dark:bg-gray-900/50'}
                  ${isToday ? 'ring-2 ring-blue-500 dark:ring-blue-400' : ''}
                  ${isCurrentMonth ? 'cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700' : 'opacity-50'}
                  transition-colors
                `}
                onClick={() => isCurrentMonth && onDateClick(day)}
              >
                <div
                  className={`
                    text-sm font-medium mb-1
                    ${isToday ? 'text-blue-600 dark:text-blue-400' : 'text-gray-700 dark:text-gray-300'}
                    ${!isCurrentMonth ? 'text-gray-400 dark:text-gray-600' : ''}
                  `}
                >
                  {format(day, 'd')}
                </div>
                <div className="space-y-1">
                  {dayReservations.slice(0, 3).map((reservation) => (
                    <div
                      key={reservation.id}
                      className={`
                        text-xs px-1.5 py-0.5 rounded border truncate
                        ${statusColors[reservation.status] || statusColors.pending}
                        cursor-pointer hover:opacity-80
                      `}
                      onClick={(e) => {
                        e.stopPropagation();
                        onReservationClick(reservation);
                      }}
                      title={reservation.title}
                    >
                      {reservation.title}
                    </div>
                  ))}
                  {dayReservations.length > 3 && (
                    <div className="text-xs text-gray-500 dark:text-gray-400 px-1.5">
                      +{dayReservations.length - 3} more
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Legend */}
        <div className="mt-6 pt-4 border-t flex flex-wrap gap-4 items-center">
          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Status:</span>
          {Object.entries(statusColors).map(([status, className]) => (
            <div key={status} className="flex items-center gap-2">
              <div className={`w-3 h-3 rounded border ${className.split(' ')[0]}`} />
              <span className="text-xs text-gray-600 dark:text-gray-400 capitalize">{status}</span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

