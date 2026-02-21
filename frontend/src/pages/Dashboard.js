import { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Avatar, AvatarFallback } from '../components/ui/avatar';
import { ScrollArea } from '../components/ui/scroll-area';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { Users, CheckSquare, Briefcase, TrendingUp, Clock, CheckCircle, Calendar, ArrowUpRight, Wallet } from 'lucide-react';

const API_URL = process.env.REACT_APP_BACKEND_URL;

const COLORS = ['#4F46E5', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#06B6D4', '#EC4899'];

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

export const Dashboard = () => {
  const { user, isAdmin } = useAuth();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const response = await axios.get(`${API_URL}/api/dashboard/stats`);
      setStats(response.data);
    } catch (error) {
      console.error('Error fetching stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('ro-RO', {
      style: 'currency',
      currency: 'RON',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  // Prepare chart data
  const getTaskChartData = () => {
    if (!stats) return [];
    return [
      { name: 'În Așteptare', value: stats.pending_tasks || 0, color: '#F59E0B' },
      { name: 'În Progres', value: stats.in_progress_tasks || 0, color: '#3B82F6' },
      { name: 'Finalizate', value: stats.completed_tasks || 0, color: '#10B981' }
    ].filter(item => item.value > 0);
  };

  const getRevenueChartData = () => {
    if (!stats?.revenue_by_type) return [];
    return Object.entries(stats.revenue_by_type).map(([name, value], index) => ({
      name: name.length > 15 ? name.substring(0, 15) + '...' : name,
      fullName: name,
      value,
      fill: COLORS[index % COLORS.length]
    }));
  };

  if (loading) {
    return (
      <div className="animate-fadeIn">
        <h1 className="text-3xl font-heading font-bold tracking-tight mb-8">
          Panou de Control
        </h1>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-6">
                <div className="h-20 bg-muted rounded"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="animate-fadeIn">
      <div className="mb-8">
        <h1 className="text-3xl font-heading font-bold tracking-tight">
          Bun venit, {user?.name}!
        </h1>
        <p className="text-muted-foreground mt-1">
          {isAdmin() ? 'Iată o prezentare generală a activității.' : 'Iată sarcinile tale.'}
        </p>
      </div>

      {isAdmin() ? (
        /* Admin Dashboard */
        <>
          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <Card className="hover-lift border-border/50 shadow-sm" data-testid="stat-employees">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Angajați</p>
                    <p className="text-3xl font-heading font-bold tabular-nums mt-1">
                      {stats?.total_employees || 0}
                    </p>
                  </div>
                  <div className="p-3 bg-primary/10 rounded-xl">
                    <Users className="h-6 w-6 text-primary" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="hover-lift border-border/50 shadow-sm" data-testid="stat-tasks">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Sarcini Active</p>
                    <p className="text-3xl font-heading font-bold tabular-nums mt-1">
                      {(stats?.pending_tasks || 0) + (stats?.in_progress_tasks || 0)}
                    </p>
                  </div>
                  <div className="p-3 bg-orange-500/10 rounded-xl">
                    <CheckSquare className="h-6 w-6 text-orange-500" />
                  </div>
                </div>
                <p className="text-xs text-muted-foreground mt-2">
                  din {stats?.total_tasks || 0} total
                </p>
              </CardContent>
            </Card>

            <Card className="hover-lift border-border/50 shadow-sm" data-testid="stat-clients">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Clienți Activi</p>
                    <p className="text-3xl font-heading font-bold tabular-nums mt-1">
                      {stats?.active_clients || 0}
                    </p>
                  </div>
                  <div className="p-3 bg-emerald-500/10 rounded-xl">
                    <Briefcase className="h-6 w-6 text-emerald-500" />
                  </div>
                </div>
                <p className="text-xs text-muted-foreground mt-2">
                  din {stats?.total_clients || 0} total
                </p>
              </CardContent>
            </Card>

            <Card className="hover-lift border-border/50 shadow-sm" data-testid="stat-budget">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Venit Lunar</p>
                    <p className="text-2xl font-heading font-bold tabular-nums mt-1">
                      {formatCurrency(stats?.monthly_revenue || 0)}
                    </p>
                  </div>
                  <div className="p-3 bg-blue-500/10 rounded-xl">
                    <Wallet className="h-6 w-6 text-blue-500" />
                  </div>
                </div>
                <p className="text-xs text-muted-foreground mt-2">
                  Total: {formatCurrency(stats?.total_budget || 0)}
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Charts Row */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
            {/* Revenue by Project Type */}
            <Card className="border-border/50 shadow-sm">
              <CardHeader className="pb-2">
                <CardTitle className="text-lg font-heading flex items-center gap-2">
                  <TrendingUp className="h-5 w-5 text-primary" />
                  Venituri per Tip Proiect
                </CardTitle>
              </CardHeader>
              <CardContent>
                {getRevenueChartData().length > 0 ? (
                  <ResponsiveContainer width="100%" height={280}>
                    <BarChart data={getRevenueChartData()} layout="vertical" margin={{ left: 20, right: 20 }}>
                      <XAxis type="number" tickFormatter={(value) => `${(value/1000).toFixed(0)}k`} />
                      <YAxis type="category" dataKey="name" width={100} tick={{ fontSize: 12 }} />
                      <Tooltip 
                        formatter={(value) => formatCurrency(value)}
                        labelFormatter={(label, payload) => payload[0]?.payload?.fullName || label}
                        contentStyle={{ 
                          backgroundColor: 'hsl(var(--card))', 
                          border: '1px solid hsl(var(--border))',
                          borderRadius: '8px'
                        }}
                      />
                      <Bar dataKey="value" radius={[0, 4, 4, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-[280px] flex items-center justify-center text-muted-foreground">
                    Nu există date pentru afișare
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Task Progress Chart */}
            <Card className="border-border/50 shadow-sm">
              <CardHeader className="pb-2">
                <CardTitle className="text-lg font-heading flex items-center gap-2">
                  <CheckSquare className="h-5 w-5 text-primary" />
                  Progres Sarcini
                </CardTitle>
              </CardHeader>
              <CardContent>
                {getTaskChartData().length > 0 ? (
                  <div className="flex items-center gap-8">
                    <ResponsiveContainer width="50%" height={200}>
                      <PieChart>
                        <Pie
                          data={getTaskChartData()}
                          cx="50%"
                          cy="50%"
                          innerRadius={50}
                          outerRadius={80}
                          paddingAngle={4}
                          dataKey="value"
                        >
                          {getTaskChartData().map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip 
                          contentStyle={{ 
                            backgroundColor: 'hsl(var(--card))', 
                            border: '1px solid hsl(var(--border))',
                            borderRadius: '8px'
                          }}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                    <div className="flex-1 space-y-3">
                      {getTaskChartData().map((item, index) => (
                        <div key={index} className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <div 
                              className="w-3 h-3 rounded-full" 
                              style={{ backgroundColor: item.color }}
                            />
                            <span className="text-sm">{item.name}</span>
                          </div>
                          <span className="font-semibold tabular-nums">{item.value}</span>
                        </div>
                      ))}
                      <div className="pt-2 border-t border-border">
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-muted-foreground">Total</span>
                          <span className="font-bold tabular-nums">{stats?.total_tasks || 0}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="h-[200px] flex items-center justify-center text-muted-foreground">
                    Nu există sarcini
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Bottom Row */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Employees List */}
            <Card className="border-border/50 shadow-sm">
              <CardHeader className="pb-2">
                <CardTitle className="text-lg font-heading flex items-center gap-2">
                  <Users className="h-5 w-5 text-primary" />
                  Echipa
                </CardTitle>
              </CardHeader>
              <CardContent>
                {stats?.employees?.length > 0 ? (
                  <ScrollArea className="h-[250px]">
                    <div className="space-y-3">
                      {stats.employees.map((employee) => (
                        <div 
                          key={employee.id} 
                          className="flex items-center gap-3 p-3 rounded-lg hover:bg-muted/50 transition-colors"
                        >
                          <Avatar className="h-10 w-10">
                            <AvatarFallback className="bg-primary/10 text-primary font-medium">
                              {employee.name?.charAt(0)?.toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1 min-w-0">
                            <p className="font-medium truncate">{employee.name}</p>
                            <p className="text-sm text-muted-foreground truncate">{employee.email}</p>
                          </div>
                          {employee.phone && (
                            <p className="text-sm text-muted-foreground hidden sm:block">{employee.phone}</p>
                          )}
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                ) : (
                  <div className="h-[250px] flex items-center justify-center text-muted-foreground">
                    Nu există angajați
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Recent Tasks */}
            <Card className="border-border/50 shadow-sm">
              <CardHeader className="pb-2">
                <CardTitle className="text-lg font-heading flex items-center gap-2">
                  <Clock className="h-5 w-5 text-primary" />
                  Sarcini Recente
                </CardTitle>
              </CardHeader>
              <CardContent>
                {stats?.recent_tasks?.length > 0 ? (
                  <ScrollArea className="h-[250px]">
                    <div className="space-y-3">
                      {stats.recent_tasks.map((task) => (
                        <div 
                          key={task.id} 
                          className="p-3 rounded-lg border border-border/50 hover:bg-muted/50 transition-colors"
                        >
                          <div className="flex items-start justify-between gap-2 mb-2">
                            <p className="font-medium line-clamp-1">{task.title}</p>
                            <Badge className={`${statusColors[task.status]} text-white text-xs shrink-0`}>
                              {statusLabels[task.status]}
                            </Badge>
                          </div>
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            {task.due_date && (
                              <span className="flex items-center gap-1">
                                <Calendar className="h-3 w-3" />
                                {new Date(task.due_date).toLocaleDateString('ro-RO')}
                              </span>
                            )}
                            {task.assignees?.length > 0 && (
                              <span className="flex items-center gap-1">
                                <Users className="h-3 w-3" />
                                {task.assignees.map(a => a.name).join(', ')}
                              </span>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                ) : (
                  <div className="h-[250px] flex items-center justify-center text-muted-foreground">
                    Nu există sarcini
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </>
      ) : (
        /* Employee Dashboard */
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <Card className="hover-lift border-border/50 shadow-sm" data-testid="stat-my-tasks">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Sarcinile Mele</p>
                    <p className="text-3xl font-heading font-bold tabular-nums mt-1">
                      {stats?.my_tasks || 0}
                    </p>
                  </div>
                  <div className="p-3 bg-primary/10 rounded-xl">
                    <CheckSquare className="h-6 w-6 text-primary" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="hover-lift border-border/50 shadow-sm" data-testid="stat-my-pending">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">În Așteptare</p>
                    <p className="text-3xl font-heading font-bold tabular-nums mt-1">
                      {stats?.my_pending || 0}
                    </p>
                  </div>
                  <div className="p-3 bg-orange-500/10 rounded-xl">
                    <Clock className="h-6 w-6 text-orange-500" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="hover-lift border-border/50 shadow-sm" data-testid="stat-my-progress">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">În Progres</p>
                    <p className="text-3xl font-heading font-bold tabular-nums mt-1">
                      {stats?.my_in_progress || 0}
                    </p>
                  </div>
                  <div className="p-3 bg-blue-500/10 rounded-xl">
                    <ArrowUpRight className="h-6 w-6 text-blue-500" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="hover-lift border-border/50 shadow-sm" data-testid="stat-my-completed">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Finalizate</p>
                    <p className="text-3xl font-heading font-bold tabular-nums mt-1">
                      {stats?.my_completed || 0}
                    </p>
                  </div>
                  <div className="p-3 bg-emerald-500/10 rounded-xl">
                    <CheckCircle className="h-6 w-6 text-emerald-500" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Progress Bar */}
          <Card className="border-border/50 shadow-sm">
            <CardHeader>
              <CardTitle className="text-lg font-heading">Progresul Tău</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <div className="flex justify-between text-sm mb-2">
                    <span className="text-muted-foreground">Rata de finalizare</span>
                    <span className="font-semibold tabular-nums">
                      {stats?.my_tasks ? Math.round((stats.my_completed / stats.my_tasks) * 100) : 0}%
                    </span>
                  </div>
                  <div className="h-3 bg-muted rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-gradient-to-r from-primary to-emerald-500 rounded-full transition-all duration-500"
                      style={{ 
                        width: `${stats?.my_tasks ? (stats.my_completed / stats.my_tasks * 100) : 0}%` 
                      }}
                    />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
};
