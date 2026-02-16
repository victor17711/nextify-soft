import { useState, useEffect } from 'react';
import axios from 'axios';
import { Calendar } from '../components/ui/calendar';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { ScrollArea } from '../components/ui/scroll-area';
import { CalendarDays, Clock, User } from 'lucide-react';

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

export const CalendarPage = () => {
  const [tasks, setTasks] = useState([]);
  const [selectedDate, setSelectedDate] = useState(new Date());
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

  // Get dates with tasks
  const taskDates = tasks
    .filter(task => task.due_date)
    .reduce((acc, task) => {
      const date = task.due_date.split('T')[0];
      if (!acc[date]) acc[date] = [];
      acc[date].push(task);
      return acc;
    }, {});

  // Get tasks for selected date
  const selectedDateStr = selectedDate.toISOString().split('T')[0];
  const selectedTasks = taskDates[selectedDateStr] || [];

  // Create modifiers for calendar
  const hasTaskDates = Object.keys(taskDates).map(d => new Date(d));

  const formatDate = (date) => {
    return new Intl.DateTimeFormat('ro-RO', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    }).format(date);
  };

  return (
    <div className="animate-fadeIn">
      <div className="mb-8">
        <h1 className="text-3xl font-heading font-bold tracking-tight">Calendar</h1>
        <p className="text-muted-foreground mt-1">Vizualizează sarcinile în calendar</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Calendar */}
        <Card className="lg:col-span-2 border-border/50 shadow-sm">
          <CardContent className="p-6">
            <Calendar
              mode="single"
              selected={selectedDate}
              onSelect={(date) => date && setSelectedDate(date)}
              className="rounded-md"
              modifiers={{
                hasTask: hasTaskDates
              }}
              modifiersStyles={{
                hasTask: {
                  fontWeight: 'bold',
                  textDecoration: 'underline',
                  textDecorationColor: 'hsl(var(--primary))',
                  textUnderlineOffset: '4px'
                }
              }}
              data-testid="task-calendar"
            />
          </CardContent>
        </Card>

        {/* Tasks for selected date */}
        <Card className="border-border/50 shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg font-heading flex items-center gap-2">
              <CalendarDays className="h-5 w-5 text-primary" />
              {formatDate(selectedDate)}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="text-center text-muted-foreground py-8">
                Se încarcă...
              </div>
            ) : selectedTasks.length === 0 ? (
              <div className="text-center text-muted-foreground py-8">
                Nicio sarcină pentru această zi
              </div>
            ) : (
              <ScrollArea className="h-[400px] pr-4">
                <div className="space-y-3">
                  {selectedTasks.map((task) => (
                    <div
                      key={task.id}
                      className="p-4 rounded-lg border border-border/50 hover:bg-muted/50 transition-colors"
                      data-testid={`calendar-task-${task.id}`}
                    >
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <h4 className="font-medium line-clamp-1">{task.title}</h4>
                        <div className={`w-2 h-2 rounded-full mt-2 ${priorityColors[task.priority]}`} />
                      </div>
                      
                      {task.description && (
                        <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
                          {task.description}
                        </p>
                      )}

                      <div className="flex flex-wrap gap-2">
                        <Badge className={`${statusColors[task.status]} text-white text-xs`}>
                          {statusLabels[task.status]}
                        </Badge>
                        {task.assignee && (
                          <Badge variant="outline" className="text-xs">
                            <User className="h-3 w-3 mr-1" />
                            {task.assignee.name}
                          </Badge>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Upcoming Tasks */}
      <Card className="mt-6 border-border/50 shadow-sm">
        <CardHeader>
          <CardTitle className="text-lg font-heading flex items-center gap-2">
            <Clock className="h-5 w-5 text-primary" />
            Sarcini Viitoare
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center text-muted-foreground py-4">
              Se încarcă...
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {tasks
                .filter(task => {
                  if (!task.due_date) return false;
                  const dueDate = new Date(task.due_date);
                  const today = new Date();
                  today.setHours(0, 0, 0, 0);
                  return dueDate >= today && task.status !== 'completed';
                })
                .sort((a, b) => new Date(a.due_date) - new Date(b.due_date))
                .slice(0, 6)
                .map((task) => (
                  <div
                    key={task.id}
                    className="p-4 rounded-lg border border-border/50 hover:bg-muted/50 transition-colors"
                    data-testid={`upcoming-task-${task.id}`}
                  >
                    <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
                      <CalendarDays className="h-4 w-4" />
                      {new Date(task.due_date).toLocaleDateString('ro-RO')}
                    </div>
                    <h4 className="font-medium line-clamp-1">{task.title}</h4>
                    <div className="mt-2">
                      <Badge className={`${statusColors[task.status]} text-white text-xs`}>
                        {statusLabels[task.status]}
                      </Badge>
                    </div>
                  </div>
                ))}
              {tasks.filter(t => t.due_date && new Date(t.due_date) >= new Date() && t.status !== 'completed').length === 0 && (
                <div className="col-span-full text-center text-muted-foreground py-4">
                  Nicio sarcină viitoare
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
