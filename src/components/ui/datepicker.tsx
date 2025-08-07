"use client";

import { useState, useEffect, useRef } from "react";
import { ChevronLeft, ChevronRight, Calendar } from "lucide-react";

interface DatePickerProps {
  selectedDate: string;
  availableDates: string[];
  onDateChange: (date: string) => void;
  className?: string;
}

export function DatePicker({ selectedDate, availableDates, onDateChange, className = "" }: DatePickerProps) {
  const [showCalendar, setShowCalendar] = useState(false);
  const [currentMonth, setCurrentMonth] = useState(() => {
    const [year, month] = selectedDate.split('-');
    return new Date(parseInt(year), parseInt(month) - 1, 1);
  });
  const calendarRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (calendarRef.current && !calendarRef.current.contains(event.target as Node)) {
        setShowCalendar(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const formatDate = (dateStr: string) => {
    try {
      const [year, month, day] = dateStr.split('-');
      const date = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
      
      return date.toLocaleDateString("pt-BR", {
        day: "2-digit",
        month: "long",
        year: "numeric",
      });
    } catch (error) {
      return dateStr;
    }
  };

  const navigateMonth = (direction: 'prev' | 'next') => {
    setCurrentMonth(prev => {
      const newMonth = new Date(prev);
      if (direction === 'prev') {
        newMonth.setMonth(prev.getMonth() - 1);
      } else {
        newMonth.setMonth(prev.getMonth() + 1);
      }
      return newMonth;
    });
  };

  const getCalendarDays = () => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();
    
    const days = [];
    
    // Adicionar dias vazios do início
    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(null);
    }
    
    // Adicionar dias do mês
    for (let i = 1; i <= daysInMonth; i++) {
      const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(i).padStart(2, '0')}`;
      days.push({
        day: i,
        date: dateStr,
        hasQuotation: availableDates.includes(dateStr),
        isSelected: dateStr === selectedDate,
        isToday: dateStr === new Date().toISOString().split('T')[0],
      });
    }
    
    return days;
  };

  const monthYear = currentMonth.toLocaleDateString("pt-BR", {
    month: "long",
    year: "numeric",
  });

  return (
    <div className={`relative ${className}`} ref={calendarRef}>
      <button
        onClick={() => setShowCalendar(!showCalendar)}
        className="w-full px-4 py-3 border-2 border-white/20 rounded-lg bg-black/30 text-left focus:ring-2 focus:ring-white/50 focus:border-white/50 flex items-center justify-between text-white hover:bg-black/40 transition-colors"
      >
        <span className="truncate">{formatDate(selectedDate)}</span>
        <Calendar className="w-5 h-5 text-white/70 flex-shrink-0 ml-2" />
      </button>
      
      {showCalendar && (
        <div className="absolute z-50 mt-2 w-80 max-w-[90vw] bg-background border-2 border-white/20 rounded-lg shadow-xl">
          {/* Header com navegação */}
          <div className="flex items-center justify-between p-4 border-b border-white/20">
            <button
              onClick={() => navigateMonth('prev')}
              className="p-1 hover:bg-white/10 rounded-md transition-colors"
            >
              <ChevronLeft className="w-5 h-5 text-white" />
            </button>
            
            <h3 className="text-white font-semibold capitalize">
              {monthYear}
            </h3>
            
            <button
              onClick={() => navigateMonth('next')}
              className="p-1 hover:bg-white/10 rounded-md transition-colors"
            >
              <ChevronRight className="w-5 h-5 text-white" />
            </button>
          </div>
          
          {/* Calendário */}
          <div className="p-4">
            {/* Dias da semana */}
            <div className="grid grid-cols-7 gap-1 mb-2">
              {["D", "S", "T", "Q", "Q", "S", "S"].map((day, i) => (
                <div key={i} className="text-center text-xs font-medium text-white/70 py-2">
                  {day}
                </div>
              ))}
            </div>
            
            {/* Dias do mês */}
            <div className="grid grid-cols-7 gap-1">
              {getCalendarDays().map((day, i) => (
                <div key={i} className="aspect-square">
                  {day ? (
                    <button
                      onClick={() => {
                        if (day.hasQuotation) {
                          onDateChange(day.date);
                          setShowCalendar(false);
                        }
                      }}
                      disabled={!day.hasQuotation}
                      className={`
                        w-full h-full rounded-md text-sm transition-colors relative
                        ${day.hasQuotation
                          ? day.isSelected
                            ? "bg-white text-background font-semibold"
                            : day.isToday
                            ? "bg-white/30 text-white font-medium hover:bg-white/40"
                            : "bg-white/10 text-white hover:bg-white/20"
                          : "bg-transparent text-white/30 cursor-not-allowed"
                        }
                      `}
                    >
                      {day.day}
                      {day.hasQuotation && (
                        <div className={`absolute bottom-0 left-1/2 transform -translate-x-1/2 w-1 h-1 rounded-full ${
                          day.isSelected ? 'bg-background' : 'bg-white'
                        }`} />
                      )}
                    </button>
                  ) : (
                    <div />
                  )}
                </div>
              ))}
            </div>
          </div>
          
          {/* Footer com datas recentes */}
          <div className="p-4 border-t border-white/20">
            <p className="text-xs text-white/60 mb-2">Datas recentes:</p>
            <div className="flex flex-wrap gap-1">
              {availableDates.slice(0, 6).map((date) => (
                <button
                  key={date}
                  onClick={() => {
                    onDateChange(date);
                    setShowCalendar(false);
                  }}
                  className={`px-2 py-1 text-xs rounded transition-colors ${
                    date === selectedDate
                      ? "bg-white text-background font-medium"
                      : "bg-white/20 text-white hover:bg-white/30"
                  }`}
                >
                  {date.split('-').slice(1).join('/')}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}