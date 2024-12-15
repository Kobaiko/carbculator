import { useState } from "react";
import { Button } from "@/components/ui/button";
import { 
  ChevronLeft, 
  ChevronRight,
  CalendarDays,
  Circle
} from "lucide-react";
import { 
  startOfMonth, 
  endOfMonth, 
  eachDayOfInterval,
  format,
  isSameMonth,
  isSameDay,
  addMonths,
  subMonths,
  startOfWeek,
  endOfWeek
} from "date-fns";

interface CustomCalendarProps {
  selected?: Date;
  onSelect?: (date: Date) => void;
  modifiers?: {
    goals_met: (date: Date) => boolean;
    goals_not_met: (date: Date) => boolean;
    no_meals: (date: Date) => boolean;
  };
}

export function CustomCalendar({ selected, onSelect, modifiers }: CustomCalendarProps) {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  
  const getDayClass = (date: Date) => {
    if (!isSameMonth(date, currentMonth)) {
      return "text-muted-foreground opacity-50";
    }
    
    if (modifiers?.goals_met(date)) {
      return "bg-green-100 dark:bg-green-900/30 text-green-900 dark:text-green-100 hover:bg-green-200 dark:hover:bg-green-900/50";
    }
    if (modifiers?.goals_not_met(date)) {
      return "bg-red-100 dark:bg-red-900/30 text-red-900 dark:text-red-100 hover:bg-red-200 dark:hover:bg-red-900/50";
    }
    if (modifiers?.no_meals(date)) {
      return "bg-gray-100 dark:bg-gray-800/50 text-gray-900 dark:text-gray-100 hover:bg-gray-200 dark:hover:bg-gray-800";
    }
    
    return "";
  };

  const days = eachDayOfInterval({
    start: startOfWeek(startOfMonth(currentMonth)),
    end: endOfWeek(endOfMonth(currentMonth))
  });

  const weekDays = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

  return (
    <div className="w-full max-w-3xl mx-auto h-full flex flex-col pt-8 md:pt-0">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-1">
          <CalendarDays className="h-4 w-4" />
          <h2 className="text-lg font-semibold truncate">
            {format(currentMonth, "MMMM yyyy")}
          </h2>
        </div>
        <div className="flex gap-1">
          <Button
            variant="outline"
            size="icon"
            className="h-7 w-7"
            onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="icon"
            className="h-7 w-7"
            onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-7 gap-px bg-muted rounded-lg">
        {weekDays.map((day, index) => (
          <div
            key={day}
            className={`flex items-center justify-center text-center p-1.5 font-medium text-[10px] bg-primary/5 text-primary ${
              index === 0 ? 'rounded-tl-lg' : ''
            } ${index === 6 ? 'rounded-tr-lg' : ''}`}
          >
            {day}
          </div>
        ))}
        
        {days.map((day, dayIdx) => (
          <div key={day.toString()} className="relative w-full pt-[100%]">
            <Button
              variant="ghost"
              className={`absolute inset-0 rounded-none flex flex-col items-center justify-start hover:bg-accent ${
                selected && isSameDay(day, selected)
                  ? "ring-2 ring-primary"
                  : ""
              } ${getDayClass(day)}`}
              onClick={() => onSelect?.(day)}
            >
              <span className="text-[10px] font-normal">{format(day, "d")}</span>
            </Button>
          </div>
        ))}
      </div>

      <div className="flex flex-wrap items-center justify-center gap-2 mt-2 text-[10px] px-2">
        <div className="flex items-center gap-1">
          <Circle className="h-2 w-2 fill-green-100 text-green-100 dark:fill-green-900 dark:text-green-900" />
          <span>Goals Met</span>
        </div>
        <div className="flex items-center gap-1">
          <Circle className="h-2 w-2 fill-red-100 text-red-100 dark:fill-red-900 dark:text-red-900" />
          <span>Goals Not Met</span>
        </div>
        <div className="flex items-center gap-1">
          <Circle className="h-2 w-2 fill-gray-100 text-gray-100 dark:fill-gray-800 dark:text-gray-800" />
          <span>No Meals</span>
        </div>
      </div>
    </div>
  );
}