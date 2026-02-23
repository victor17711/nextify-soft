import { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../contexts/AuthContext';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Textarea } from '../components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '../components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Badge } from '../components/ui/badge';
import { Checkbox } from '../components/ui/checkbox';
import { ScrollArea } from '../components/ui/scroll-area';
import { toast } from 'sonner';
import { Plus, Pencil, Trash2, Calendar, Users, Search, Filter, X } from 'lucide-react';

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

const priorityLabels = {
  low: 'Scăzută',
  medium: 'Medie',
  high: 'Ridicată'
};

const statusLabels = {
  pending: 'În Așteptare',
  in_progress: 'În Progres',
  completed: 'Finalizat'
};

export const Tasks = () => {
  const { isAdmin } = useAuth();
  const [tasks, setTasks] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState(null);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    start_date: '',
    due_date: '',
    priority: 'medium',
    status: 'pending',
    assigned_to: []
  });

  useEffect(() => {
    fetchTasks();
    if (isAdmin()) {
      fetchEmployees();
    }
  }, []);

  const fetchTasks = async () => {
    try {
      const response = await axios.get(`${API_URL}/api/tasks`);
      setTasks(response.data);
    } catch (error) {
      toast.error('Eroare la încărcarea sarcinilor');
    } finally {
      setLoading(false);
    }
  };

  const fetchEmployees = async () => {
    try {
      const response = await axios.get(`${API_URL}/api/users`);
      // Include all users (employees and admins) for task assignment
      setEmployees(response.data);
    } catch (error) {
      console.error('Error fetching employees:', error);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      const submitData = { ...formData };
      if (!submitData.due_date) delete submitData.due_date;
      
      if (selectedTask) {
        await axios.put(`${API_URL}/api/tasks/${selectedTask.id}`, submitData);
        toast.success('Sarcină actualizată cu succes!');
      } else {
        await axios.post(`${API_URL}/api/tasks`, submitData);
        toast.success('Sarcină creată cu succes!');
      }
      
      setDialogOpen(false);
      resetForm();
      fetchTasks();
    } catch (error) {
      const message = error.response?.data?.detail || 'Eroare la salvare';
      toast.error(message);
    }
  };

  const handleStatusChange = async (taskId, newStatus) => {
    try {
      await axios.put(`${API_URL}/api/tasks/${taskId}`, { status: newStatus });
      toast.success('Status actualizat!');
      fetchTasks();
    } catch (error) {
      toast.error('Eroare la actualizarea statusului');
    }
  };

  const handleEdit = (task) => {
    setSelectedTask(task);
    setFormData({
      title: task.title,
      description: task.description || '',
      due_date: task.due_date || '',
      priority: task.priority,
      status: task.status,
      assigned_to: task.assigned_to || []
    });
    setDialogOpen(true);
  };

  const handleDelete = async () => {
    try {
      await axios.delete(`${API_URL}/api/tasks/${selectedTask.id}`);
      toast.success('Sarcină ștearsă cu succes!');
      setDeleteDialogOpen(false);
      setSelectedTask(null);
      fetchTasks();
    } catch (error) {
      toast.error('Eroare la ștergere');
    }
  };

  const resetForm = () => {
    setSelectedTask(null);
    setFormData({
      title: '',
      description: '',
      due_date: '',
      priority: 'medium',
      status: 'pending',
      assigned_to: []
    });
  };

  const filteredTasks = tasks.filter(task => {
    const matchesSearch = task.title.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = filterStatus === 'all' || task.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  const formatDate = (dateStr) => {
    if (!dateStr) return '-';
    return new Date(dateStr).toLocaleDateString('ro-RO');
  };

  return (
    <div className="animate-fadeIn">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-heading font-bold tracking-tight">Sarcini</h1>
          <p className="text-muted-foreground mt-1">
            {isAdmin() ? 'Gestionează toate sarcinile' : 'Sarcinile tale'}
          </p>
        </div>
        
        {isAdmin() && (
          <Dialog open={dialogOpen} onOpenChange={(open) => {
            setDialogOpen(open);
            if (!open) resetForm();
          }}>
            <DialogTrigger asChild>
              <Button className="active-scale" data-testid="add-task-button">
                <Plus className="w-4 h-4 mr-2" />
                Sarcină Nouă
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle className="font-heading">
                  {selectedTask ? 'Editează Sarcina' : 'Sarcină Nouă'}
                </DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="title">Titlu</Label>
                  <Input
                    id="title"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    placeholder="Titlul sarcinii"
                    data-testid="task-title-input"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="description">Descriere</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Descriere detaliată..."
                    data-testid="task-description-input"
                    rows={3}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="due_date">Data Limită</Label>
                    <Input
                      id="due_date"
                      type="date"
                      value={formData.due_date}
                      onChange={(e) => setFormData({ ...formData, due_date: e.target.value })}
                      data-testid="task-due-date-input"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="priority">Prioritate</Label>
                    <Select 
                      value={formData.priority} 
                      onValueChange={(value) => setFormData({ ...formData, priority: value })}
                    >
                      <SelectTrigger data-testid="task-priority-select">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="low">Scăzută</SelectItem>
                        <SelectItem value="medium">Medie</SelectItem>
                        <SelectItem value="high">Ridicată</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="status">Status</Label>
                  <Select 
                    value={formData.status} 
                    onValueChange={(value) => setFormData({ ...formData, status: value })}
                  >
                    <SelectTrigger data-testid="task-status-select">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pending">În Așteptare</SelectItem>
                      <SelectItem value="in_progress">În Progres</SelectItem>
                      <SelectItem value="completed">Finalizat</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                {/* Multiple Assignees */}
                <div className="space-y-2">
                  <Label>Atribuiți Utilizatori</Label>
                  {formData.assigned_to.length > 0 && (
                    <div className="flex flex-wrap gap-2 mb-2">
                      {formData.assigned_to.map(id => {
                        const emp = employees.find(e => e.id === id);
                        return emp ? (
                          <Badge key={id} variant="secondary" className="pl-2 pr-1 py-1">
                            {emp.name}
                            {emp.role === 'admin' && <span className="text-xs ml-1 opacity-70">(Admin)</span>}
                            <button
                              type="button"
                              onClick={() => {
                                setFormData(prev => ({
                                  ...prev,
                                  assigned_to: prev.assigned_to.filter(uid => uid !== id)
                                }));
                              }}
                              className="ml-1 hover:bg-muted rounded-full p-0.5"
                            >
                              <X className="h-3 w-3" />
                            </button>
                          </Badge>
                        ) : null;
                      })}
                    </div>
                  )}
                  <ScrollArea className="h-[150px] border rounded-md p-2">
                    <div className="space-y-2">
                      {employees.length === 0 ? (
                        <p className="text-sm text-muted-foreground text-center py-4">
                          Nu există utilizatori
                        </p>
                      ) : (
                        employees.map((emp) => (
                          <label
                            key={emp.id}
                            htmlFor={`checkbox-${emp.id}`}
                            className="flex items-center gap-3 p-2 rounded-md hover:bg-muted/50 cursor-pointer"
                          >
                            <Checkbox
                              id={`checkbox-${emp.id}`}
                              checked={formData.assigned_to.includes(emp.id)}
                              onCheckedChange={(checked) => {
                                setFormData(prev => {
                                  const newAssigned = checked
                                    ? [...prev.assigned_to, emp.id]
                                    : prev.assigned_to.filter(id => id !== emp.id);
                                  return { ...prev, assigned_to: newAssigned };
                                });
                              }}
                              data-testid={`assign-${emp.id}`}
                            />
                            <div className="flex-1">
                              <div className="flex items-center gap-2">
                                <p className="text-sm font-medium">{emp.name}</p>
                                {emp.role === 'admin' && (
                                  <Badge variant="outline" className="text-xs px-1.5 py-0">Admin</Badge>
                                )}
                              </div>
                              <p className="text-xs text-muted-foreground">{emp.email}</p>
                            </div>
                          </label>
                        ))
                      )}
                    </div>
                  </ScrollArea>
                </div>

                <DialogFooter className="gap-2">
                  <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                    Anulează
                  </Button>
                  <Button type="submit" className="active-scale" data-testid="task-submit-button">
                    {selectedTask ? 'Salvează' : 'Creează'}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        )}
      </div>

      {/* Filters */}
      <Card className="mb-6 border-border/50 shadow-sm">
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Caută sarcini..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
                data-testid="task-search-input"
              />
            </div>
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className="w-full sm:w-48" data-testid="task-filter-status">
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Toate</SelectItem>
                <SelectItem value="pending">În Așteptare</SelectItem>
                <SelectItem value="in_progress">În Progres</SelectItem>
                <SelectItem value="completed">Finalizate</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Tasks Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-6">
                <div className="h-24 bg-muted rounded"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : filteredTasks.length === 0 ? (
        <Card className="border-border/50 shadow-sm">
          <CardContent className="p-8 text-center text-muted-foreground">
            Nicio sarcină găsită
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredTasks.map((task) => (
            <Card 
              key={task.id} 
              className="hover-lift border-border/50 shadow-sm"
              data-testid={`task-card-${task.id}`}
            >
              <CardHeader className="pb-2">
                <div className="flex items-start justify-between gap-2">
                  <CardTitle className="text-lg font-heading line-clamp-2">
                    {task.title}
                  </CardTitle>
                  <div className={`w-2 h-2 rounded-full mt-2 ${priorityColors[task.priority]}`} />
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {task.description && (
                  <p className="text-sm text-muted-foreground line-clamp-2">
                    {task.description}
                  </p>
                )}
                
                <div className="flex flex-wrap gap-2">
                  <Badge className={`${statusColors[task.status]} text-white`}>
                    {statusLabels[task.status]}
                  </Badge>
                  <Badge variant="outline">
                    {priorityLabels[task.priority]}
                  </Badge>
                </div>

                <div className="space-y-2 text-sm text-muted-foreground">
                  {task.due_date && (
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4" />
                      {formatDate(task.due_date)}
                    </div>
                  )}
                  {task.assignees?.length > 0 && (
                    <div className="flex items-center gap-2">
                      <Users className="h-4 w-4" />
                      <span className="line-clamp-1">
                        {task.assignees.map(a => a.name).join(', ')}
                      </span>
                    </div>
                  )}
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2 pt-2 border-t border-border/50">
                  {!isAdmin() ? (
                    <Select 
                      value={task.status} 
                      onValueChange={(value) => handleStatusChange(task.id, value)}
                    >
                      <SelectTrigger className="flex-1" data-testid={`task-status-change-${task.id}`}>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="pending">În Așteptare</SelectItem>
                        <SelectItem value="in_progress">În Progres</SelectItem>
                        <SelectItem value="completed">Finalizat</SelectItem>
                      </SelectContent>
                    </Select>
                  ) : (
                    <>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleEdit(task)}
                        className="flex-1"
                        data-testid={`edit-task-${task.id}`}
                      >
                        <Pencil className="h-4 w-4 mr-2" />
                        Editează
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => {
                          setSelectedTask(task);
                          setDeleteDialogOpen(true);
                        }}
                        data-testid={`delete-task-${task.id}`}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Delete Confirmation */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="font-heading">Confirmare Ștergere</DialogTitle>
          </DialogHeader>
          <p className="text-muted-foreground">
            Sigur doriți să ștergeți sarcina <strong>{selectedTask?.title}</strong>?
          </p>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>
              Anulează
            </Button>
            <Button variant="destructive" onClick={handleDelete} data-testid="confirm-delete-task">
              Șterge
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};
