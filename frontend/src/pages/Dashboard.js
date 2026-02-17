import { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Users, CheckSquare, Briefcase, TrendingUp, Clock, CheckCircle } from 'lucide-react';

const API_URL = process.env.REACT_APP_BACKEND_URL;

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
      currency: 'MDL',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
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
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card className="hover-lift border-border/50 shadow-sm" data-testid="stat-employees">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Total Angajați
              </CardTitle>
              <div className="p-2 bg-primary/10 rounded-lg">
                <Users className="h-5 w-5 text-primary" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-heading font-bold tabular-nums">
                {stats?.total_employees || 0}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Membri activi în echipă
              </p>
            </CardContent>
          </Card>

          <Card className="hover-lift border-border/50 shadow-sm" data-testid="stat-tasks">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Sarcini Active
              </CardTitle>
              <div className="p-2 bg-orange-500/10 rounded-lg">
                <CheckSquare className="h-5 w-5 text-orange-500" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-heading font-bold tabular-nums">
                {stats?.pending_tasks || 0}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                din {stats?.total_tasks || 0} total
              </p>
            </CardContent>
          </Card>

          <Card className="hover-lift border-border/50 shadow-sm" data-testid="stat-clients">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Total Clienți
              </CardTitle>
              <div className="p-2 bg-emerald-500/10 rounded-lg">
                <Briefcase className="h-5 w-5 text-emerald-500" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-heading font-bold tabular-nums">
                {stats?.total_clients || 0}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Parteneri activi
              </p>
            </CardContent>
          </Card>

          <Card className="hover-lift border-border/50 shadow-sm" data-testid="stat-budget">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Buget Total
              </CardTitle>
              <div className="p-2 bg-blue-500/10 rounded-lg">
                <TrendingUp className="h-5 w-5 text-blue-500" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-heading font-bold tabular-nums">
                {formatCurrency(stats?.total_budget || 0)}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Valoare proiecte
              </p>
            </CardContent>
          </Card>
        </div>
      ) : (
        /* Employee Dashboard */
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="hover-lift border-border/50 shadow-sm" data-testid="stat-my-tasks">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Sarcinile Mele
              </CardTitle>
              <div className="p-2 bg-primary/10 rounded-lg">
                <CheckSquare className="h-5 w-5 text-primary" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-heading font-bold tabular-nums">
                {stats?.my_tasks || 0}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Total sarcini alocate
              </p>
            </CardContent>
          </Card>

          <Card className="hover-lift border-border/50 shadow-sm" data-testid="stat-my-pending">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                În Așteptare
              </CardTitle>
              <div className="p-2 bg-orange-500/10 rounded-lg">
                <Clock className="h-5 w-5 text-orange-500" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-heading font-bold tabular-nums">
                {stats?.my_pending || 0}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Sarcini de completat
              </p>
            </CardContent>
          </Card>

          <Card className="hover-lift border-border/50 shadow-sm" data-testid="stat-my-completed">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Finalizate
              </CardTitle>
              <div className="p-2 bg-emerald-500/10 rounded-lg">
                <CheckCircle className="h-5 w-5 text-emerald-500" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-heading font-bold tabular-nums">
                {stats?.my_completed || 0}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Sarcini completate
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Quick Actions for Admin */}
      {isAdmin() && (
        <div className="mt-8">
          <h2 className="text-xl font-heading font-semibold mb-4">Statistici Sarcini</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card className="border-border/50 shadow-sm">
              <CardHeader>
                <CardTitle className="text-lg font-heading">Progres Sarcini</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-muted-foreground">Finalizate</span>
                      <span className="font-medium tabular-nums">{stats?.completed_tasks || 0}</span>
                    </div>
                    <div className="h-2 bg-muted rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-emerald-500 rounded-full transition-all duration-500"
                        style={{ 
                          width: `${stats?.total_tasks ? (stats.completed_tasks / stats.total_tasks * 100) : 0}%` 
                        }}
                      />
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-muted-foreground">În Așteptare</span>
                      <span className="font-medium tabular-nums">{stats?.pending_tasks || 0}</span>
                    </div>
                    <div className="h-2 bg-muted rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-orange-500 rounded-full transition-all duration-500"
                        style={{ 
                          width: `${stats?.total_tasks ? (stats.pending_tasks / stats.total_tasks * 100) : 0}%` 
                        }}
                      />
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-border/50 shadow-sm">
              <CardHeader>
                <CardTitle className="text-lg font-heading">Rezumat</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center justify-between py-2 border-b border-border/50">
                    <span className="text-muted-foreground">Total Sarcini</span>
                    <span className="font-semibold tabular-nums">{stats?.total_tasks || 0}</span>
                  </div>
                  <div className="flex items-center justify-between py-2 border-b border-border/50">
                    <span className="text-muted-foreground">Rata de Finalizare</span>
                    <span className="font-semibold tabular-nums">
                      {stats?.total_tasks 
                        ? Math.round((stats.completed_tasks / stats.total_tasks) * 100) 
                        : 0}%
                    </span>
                  </div>
                  <div className="flex items-center justify-between py-2">
                    <span className="text-muted-foreground">Angajați per Client</span>
                    <span className="font-semibold tabular-nums">
                      {stats?.total_clients 
                        ? (stats.total_employees / stats.total_clients).toFixed(1) 
                        : 0}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      )}
    </div>
  );
};
