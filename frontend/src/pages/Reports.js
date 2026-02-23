import { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../contexts/AuthContext';
import { Button } from '../components/ui/button';
import { Label } from '../components/ui/label';
import { Textarea } from '../components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Badge } from '../components/ui/badge';
import { Avatar, AvatarFallback } from '../components/ui/avatar';
import { ScrollArea } from '../components/ui/scroll-area';
import { toast } from 'sonner';
import { Calendar, ChevronLeft, ChevronRight, FileText, User, Save, Plus } from 'lucide-react';

const API_URL = process.env.REACT_APP_BACKEND_URL;

const DAYS_OF_WEEK = ['Duminică', 'Luni', 'Marți', 'Miercuri', 'Joi', 'Vineri', 'Sâmbătă'];

export const Reports = () => {
  const { user, isAdmin } = useAuth();
  const [reports, setReports] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [selectedEmployee, setSelectedEmployee] = useState('all');
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [currentReport, setCurrentReport] = useState('');
  const [existingReportId, setExistingReportId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (isAdmin()) {
      fetchEmployees();
    }
    fetchReports();
  }, [selectedEmployee]);

  useEffect(() => {
    // Find report for selected date
    const report = reports.find(r => r.date === selectedDate && 
      (isAdmin() ? (selectedEmployee === 'all' || r.user_id === selectedEmployee) : r.user_id === user?.id)
    );
    
    if (report) {
      setCurrentReport(report.content);
      setExistingReportId(report.id);
    } else {
      setCurrentReport('');
      setExistingReportId(null);
    }
  }, [selectedDate, reports, selectedEmployee]);

  const fetchEmployees = async () => {
    try {
      const response = await axios.get(`${API_URL}/api/users`);
      setEmployees(response.data);
    } catch (error) {
      console.error('Error fetching employees:', error);
    }
  };

  const fetchReports = async () => {
    try {
      let url = `${API_URL}/api/reports`;
      if (isAdmin() && selectedEmployee !== 'all') {
        url += `?user_id=${selectedEmployee}`;
      }
      const response = await axios.get(url);
      setReports(response.data);
    } catch (error) {
      toast.error('Eroare la încărcarea rapoartelor');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveReport = async () => {
    if (!currentReport.trim()) {
      toast.error('Raportul nu poate fi gol');
      return;
    }

    setSaving(true);
    try {
      await axios.post(`${API_URL}/api/reports`, {
        date: selectedDate,
        content: currentReport
      });
      toast.success('Raport salvat cu succes!');
      fetchReports();
      // Navigate to previous day after saving
      navigateDate(-1);
    } catch (error) {
      toast.error('Eroare la salvarea raportului');
    } finally {
      setSaving(false);
    }
  };

  const navigateDate = (direction) => {
    const date = new Date(selectedDate);
    date.setDate(date.getDate() + direction);
    setSelectedDate(date.toISOString().split('T')[0]);
  };

  const goToToday = () => {
    setSelectedDate(new Date().toISOString().split('T')[0]);
  };

  const formatDate = (dateStr) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('ro-RO', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const formatShortDate = (dateStr) => {
    return new Date(dateStr).toLocaleDateString('ro-RO', {
      day: 'numeric',
      month: 'short'
    });
  };

  const isToday = (dateStr) => {
    return dateStr === new Date().toISOString().split('T')[0];
  };

  const isFuture = (dateStr) => {
    return new Date(dateStr) > new Date();
  };

  // Get reports for display (filtered by employee if admin)
  const displayReports = isAdmin() 
    ? (selectedEmployee === 'all' ? reports : reports.filter(r => r.user_id === selectedEmployee))
    : reports;

  // Get unique dates with reports
  const reportDates = [...new Set(displayReports.map(r => r.date))].sort((a, b) => new Date(b) - new Date(a));

  return (
    <div className="animate-fadeIn">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-heading font-bold tracking-tight">Rapoarte</h1>
          <p className="text-muted-foreground mt-1">
            {isAdmin() ? 'Vizualizează rapoartele echipei' : 'Scrie raportul tău zilnic'}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Panel - Report Editor */}
        <Card className="lg:col-span-2 border-border/50 shadow-sm">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Button variant="outline" size="icon" onClick={() => navigateDate(-1)}>
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <Button variant="outline" size="icon" onClick={() => navigateDate(1)}>
                  <ChevronRight className="h-4 w-4" />
                </Button>
                <div className="ml-2">
                  <CardTitle className="text-lg font-heading">
                    {formatDate(selectedDate)}
                  </CardTitle>
                  {isToday(selectedDate) && (
                    <Badge className="mt-1 bg-primary text-white">Astăzi</Badge>
                  )}
                </div>
              </div>
              <Button variant="outline" onClick={goToToday}>
                Astăzi
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {isAdmin() && selectedEmployee === 'all' ? (
              <div className="text-center py-8 text-muted-foreground">
                <User className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Selectează un angajat pentru a vedea sau edita raportul</p>
              </div>
            ) : (
              <>
                <div className="space-y-2">
                  <Label htmlFor="report-content">
                    {existingReportId ? 'Editează Raportul' : 'Scrie Raportul'}
                  </Label>
                  <Textarea
                    id="report-content"
                    value={currentReport}
                    onChange={(e) => setCurrentReport(e.target.value)}
                    placeholder={`Ce ai făcut pe ${formatDate(selectedDate)}?\n\n• Activitate 1\n• Activitate 2\n• Activitate 3`}
                    rows={12}
                    className="resize-none"
                  />
                </div>
                <div className="flex justify-end">
                  <Button 
                    onClick={handleSaveReport} 
                    disabled={saving || !currentReport.trim()}
                    className="active-scale"
                  >
                    <Save className="w-4 h-4 mr-2" />
                    {saving ? 'Se salvează...' : (existingReportId ? 'Actualizează' : 'Salvează')}
                  </Button>
                </div>
              </>
            )}
          </CardContent>
        </Card>

        {/* Right Panel - Reports List / Employee Filter */}
        <Card className="border-border/50 shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg font-heading flex items-center gap-2">
              <FileText className="h-5 w-5 text-primary" />
              {isAdmin() ? 'Angajați' : 'Rapoartele Mele'}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Employee Filter (Admin Only) */}
            {isAdmin() && (
              <Select value={selectedEmployee} onValueChange={setSelectedEmployee}>
                <SelectTrigger>
                  <User className="h-4 w-4 mr-2" />
                  <SelectValue placeholder="Selectează angajat" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Toți angajații</SelectItem>
                  {employees.map((emp) => (
                    <SelectItem key={emp.id} value={emp.id}>
                      <div className="flex items-center gap-2">
                        {emp.name}
                        {emp.role === 'admin' && (
                          <Badge variant="outline" className="text-xs ml-1">Admin</Badge>
                        )}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}

            {/* Reports List */}
            <ScrollArea className="h-[400px]">
              {loading ? (
                <div className="text-center text-muted-foreground py-8">Se încarcă...</div>
              ) : displayReports.length === 0 ? (
                <div className="text-center text-muted-foreground py-8">
                  <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>Niciun raport găsit</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {reportDates.map((date) => {
                    const dateReports = displayReports.filter(r => r.date === date);
                    const isSelected = date === selectedDate;
                    
                    return (
                      <div key={date}>
                        {isAdmin() && selectedEmployee === 'all' ? (
                          // Show all reports for this date (admin view)
                          dateReports.map((report) => (
                            <div
                              key={report.id}
                              onClick={() => {
                                setSelectedDate(report.date);
                                setSelectedEmployee(report.user_id);
                              }}
                              className={`p-3 rounded-lg border cursor-pointer transition-all mb-2 ${
                                isSelected && selectedEmployee === report.user_id
                                  ? 'border-primary bg-primary/5'
                                  : 'border-border/50 hover:bg-muted/50'
                              }`}
                            >
                              <div className="flex items-center gap-3">
                                <Avatar className="h-8 w-8">
                                  <AvatarFallback className="bg-primary/10 text-primary text-xs">
                                    {report.user?.name?.charAt(0)?.toUpperCase()}
                                  </AvatarFallback>
                                </Avatar>
                                <div className="flex-1 min-w-0">
                                  <p className="font-medium text-sm truncate">{report.user?.name}</p>
                                  <p className="text-xs text-muted-foreground">
                                    {formatShortDate(report.date)}
                                  </p>
                                </div>
                                {isToday(report.date) && (
                                  <Badge className="bg-primary text-white text-xs">Azi</Badge>
                                )}
                              </div>
                              <p className="text-xs text-muted-foreground mt-2 line-clamp-2">
                                {report.content}
                              </p>
                            </div>
                          ))
                        ) : (
                          // Single user view
                          <div
                            onClick={() => setSelectedDate(date)}
                            className={`p-3 rounded-lg border cursor-pointer transition-all ${
                              isSelected
                                ? 'border-primary bg-primary/5'
                                : 'border-border/50 hover:bg-muted/50'
                            }`}
                          >
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <Calendar className={`h-4 w-4 ${isSelected ? 'text-primary' : 'text-muted-foreground'}`} />
                                <span className="font-medium text-sm">{formatShortDate(date)}</span>
                              </div>
                              {isToday(date) && (
                                <Badge className="bg-primary text-white text-xs">Azi</Badge>
                              )}
                            </div>
                            <p className="text-xs text-muted-foreground mt-2 line-clamp-2">
                              {dateReports[0]?.content}
                            </p>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </ScrollArea>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
