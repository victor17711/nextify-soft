import { useState, useEffect } from 'react';
import axios from 'axios';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Button } from '../components/ui/button';
import { ScrollArea } from '../components/ui/scroll-area';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../components/ui/dialog';
import { ChevronLeft, ChevronRight, CalendarDays, Users } from 'lucide-react';

const API_URL = process.env.REACT_APP_BACKEND_URL;

const priorityColors = {
  low: 'bg-slate-500',
  medium: 'bg-yellow-500',
  high: 'bg-red-500'
};

const statusColors = {
  pending: 'bg-orange-500',
  in_progress: 'bg-blue-500',
  completed: 'bg-emerald-500'
};

const statusLabels = {
  pending: 'În Așteptare',
  in_progress: 'În Progres',
  completed: 'Finalizat'
};

const DAYS_OF_WEEK = ['Lun', 'Mar', 'Mie', 'Joi', 'Vin', 'Sâm', 'Dum'];
const MONTHS = [
  'Ianuarie', 'Februarie', 'Martie', 'Aprilie', 'Mai', 'Iunie',
  'Iulie', 'August', 'Septembrie', 'Octombrie', 'Noiembrie', 'Decembrie'
];

export const CalendarPage = () => {
  const [tasks, setTasks] = useState([]);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(null);
  const [selectedTasks, setSelectedTasks] = useState([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchTasks();
  }, []);

  const fetchTasks = async () => {
    try {
      const response = await axios.get(`${API_URL}/api/tasks`);
      setTasks(response.data);
    } catch (error) {
      console.error('Error fetching tasks:', error);
    } finally {
      setLoading(false);
    }
  };

  // Get tasks for a specific date (checks if date falls within start_date and due_date range)
  const getTasksForDate = (dateStr) => {
    return tasks.filter(task => {
      const startDate = task.start_date ? task.start_date.split('T')[0] : null;
      const dueDate = task.due_date ? task.due_date.split('T')[0] : null;
      
      // If task has both start and due date, check if dateStr is within range
      if (startDate && dueDate) {
        return dateStr >= startDate && dateStr <= dueDate;
      }
      // If only start date, show on that date and after
      if (startDate && !dueDate) {
        return dateStr === startDate;
      }
      // If only due date, show on that date
      if (!startDate && dueDate) {
        return dateStr === dueDate;
      }
      return false;
    });
  };

  // Calendar calculations
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const firstDayOfMonth = new Date(year, month, 1);
  const lastDayOfMonth = new Date(year, month + 1, 0);
  const daysInMonth = lastDayOfMonth.getDate();
  
  // Adjust for Monday start (0 = Monday, 6 = Sunday)
  let startingDayOfWeek = firstDayOfMonth.getDay() - 1;
  if (startingDayOfWeek < 0) startingDayOfWeek = 6;

  const prevMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1));
  };

  const nextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1));
  };

  const goToToday = () => {
    setCurrentDate(new Date());
  };

  const handleDayClick = (day) => {
    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    const dayTasks = getTasksForDate(dateStr);
    setSelectedDate(new Date(year, month, day));
    setSelectedTasks(dayTasks);
    setDialogOpen(true);
  };

  const isToday = (day) => {
    const today = new Date();
    return day === today.getDate() && 
           month === today.getMonth() && 
           year === today.getFullYear();
  };

  const formatSelectedDate = () => {
    if (!selectedDate) return '';
    return selectedDate.toLocaleDateString('ro-RO', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const formatDateRange = (task) => {
    const start = task.start_date ? new Date(task.start_date).toLocaleDateString('ro-RO') : null;
    const end = task.due_date ? new Date(task.due_date).toLocaleDateString('ro-RO') : null;
    
    if (start && end) {
      return `${start} - ${end}`;
    }
    if (start) return `Început: ${start}`;
    if (end) return `Limită: ${end}`;
    return '';
  };

  // Generate calendar days
  const calendarDays = [];
  
  // Empty cells for days before the first day of month
  for (let i = 0; i < startingDayOfWeek; i++) {
    calendarDays.push(null);
  }
  
  // Days of the month
  for (let day = 1; day <= daysInMonth; day++) {
    calendarDays.push(day);
  }

  return (
    <div className="animate-fadeIn">
      <div className="mb-8">
        <h1 className="text-3xl font-heading font-bold tracking-tight">Calendar</h1>
        <p className="text-muted-foreground mt-1">Vizualizează sarcinile în calendar</p>
      </div>

      <Card className="border-border/50 shadow-sm">
        {/* Calendar Header */}
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Button variant="outline" size="icon" onClick={prevMonth} data-testid="prev-month">
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button variant="outline" size="icon" onClick={nextMonth} data-testid="next-month">
                <ChevronRight className="h-4 w-4" />
              </Button>
              <h2 className="text-xl font-heading font-semibold ml-2">
                {MONTHS[month]} {year}
              </h2>
            </div>
            <Button variant="outline" onClick={goToToday} data-testid="today-button">
              Astăzi
            </Button>
          </div>
        </CardHeader>

        <CardContent>
          {loading ? (
            <div className="h-[500px] flex items-center justify-center text-muted-foreground">
              Se încarcă...
            </div>
          ) : (
            <>
              {/* Day Headers */}
              <div className="grid grid-cols-7 gap-1 mb-2">
                {DAYS_OF_WEEK.map((day) => (
                  <div 
                    key={day} 
                    className="text-center text-sm font-medium text-muted-foreground py-2"
                  >
                    {day}
                  </div>
                ))}
              </div>

              {/* Calendar Grid */}
              <div className="grid grid-cols-7 gap-1">
                {calendarDays.map((day, index) => {
                  if (day === null) {
                    return <div key={`empty-${index}`} className="h-24 md:h-28" />;
                  }

                  const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
                  const dayTasks = getTasksForDate(dateStr);
                  const hasHighPriority = dayTasks.some(t => t.priority === 'high' && t.status !== 'completed');

                  return (
                    <div
                      key={day}
                      onClick={() => handleDayClick(day)}
                      className={`h-24 md:h-28 p-1 md:p-2 border rounded-lg cursor-pointer transition-all hover:bg-muted/50 ${
                        isToday(day) 
                          ? 'border-primary bg-primary/5' 
                          : 'border-border/50'
                      } ${hasHighPriority ? 'ring-2 ring-red-500/30' : ''}`}
                      data-testid={`calendar-day-${day}`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className={`text-sm font-medium ${
                          isToday(day) ? 'text-primary' : ''
                        }`}>
                          {day}
                        </span>
                        {dayTasks.length > 0 && (
                          <span className="text-xs bg-primary/10 text-primary px-1.5 py-0.5 rounded-full">
                            {dayTasks.length}
                          </span>
                        )}
                      </div>
                      
                      {/* Task previews */}
                      <div className="space-y-0.5 overflow-hidden">
                        {dayTasks.slice(0, 3).map((task, idx) => (
                          <div
                            key={task.id}
                            className={`text-xs px-1.5 py-0.5 rounded truncate text-white ${statusColors[task.status]}`}
                          >
                            {task.title}
                          </div>
                        ))}
                        {dayTasks.length > 3 && (
                          <div className="text-xs text-muted-foreground px-1.5">
                            +{dayTasks.length - 3} mai mult
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Legend */}
      <Card className="mt-6 border-border/50 shadow-sm">
        <CardContent className="p-4">
          <div className="flex flex-wrap gap-4">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded bg-orange-500" />
              <span className="text-sm">În Așteptare</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded bg-blue-500" />
              <span className="text-sm">În Progres</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded bg-emerald-500" />
              <span className="text-sm">Finalizat</span>
            </div>
            <div className="flex items-center gap-2 ml-auto">
              <div className="w-3 h-3 rounded ring-2 ring-red-500/50" />
              <span className="text-sm">Prioritate Ridicată</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Task Details Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="font-heading flex items-center gap-2">
              <CalendarDays className="h-5 w-5 text-primary" />
              {formatSelectedDate()}
            </DialogTitle>
          </DialogHeader>
          
          {selectedTasks.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              Nicio sarcină pentru această zi
            </div>
          ) : (
            <ScrollArea className="max-h-[400px]">
              <div className="space-y-3">
                {selectedTasks.map((task) => (
                  <div
                    key={task.id}
                    className="p-4 rounded-lg border border-border/50 hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <h4 className="font-medium">{task.title}</h4>
                      <div className={`w-2 h-2 rounded-full mt-2 ${priorityColors[task.priority]}`} />
                    </div>
                    
                    {task.description && (
                      <p className="text-sm text-muted-foreground mb-3">
                        {task.description}
                      </p>
                    )}

                    {/* Date Range */}
                    {(task.start_date || task.due_date) && (
                      <div className="flex items-center gap-2 text-sm text-muted-foreground mb-3">
                        <CalendarDays className="h-4 w-4" />
                        {formatDateRange(task)}
                      </div>
                    )}

                    <div className="flex flex-wrap items-center gap-2">
                      <Badge className={`${statusColors[task.status]} text-white text-xs`}>
                        {statusLabels[task.status]}
                      </Badge>
                      {task.assignees?.length > 0 && (
                        <Badge variant="outline" className="text-xs">
                          <Users className="h-3 w-3 mr-1" />
                          {task.assignees.map(a => a.name).join(', ')}
                        </Badge>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};
