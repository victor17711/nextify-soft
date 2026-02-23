import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { toast } from 'sonner';
import { Sun, Moon, LogIn } from 'lucide-react';
import logo from '../assets/new-logo.png';

export const Login = () => {
  const navigate = useNavigate();
  const { login } = useAuth();
  const { theme, toggleTheme } = useTheme();
  
  const [loginData, setLoginData] = useState({ email: '', password: '' });
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      await login(loginData.email, loginData.password);
      toast.success('Autentificare reușită!');
      navigate('/dashboard');
    } catch (error) {
      const message = error.response?.data?.detail || 'Eroare la autentificare';
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex">
      {/* Left Side - Image */}
      <div className="hidden lg:flex lg:w-1/2 relative">
        <img
          src="https://images.unsplash.com/photo-1580920900532-af6fcf2110df?crop=entropy&cs=srgb&fm=jpg&q=85"
          alt="Background"
          className="object-cover w-full h-full grayscale opacity-80"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-slate-900/80 to-slate-900/40 flex items-center justify-center">
          <div className="text-white text-center px-12">
            <div className="flex justify-center">
              <img 
                src={logo} 
                alt="Logo" 
                className="h-24 w-auto object-contain"
              />
            </div>
            <h1 className="text-5xl font-heading font-bold tracking-tight mb-4">
              Workspace Zone
            </h1>
            <p className="text-lg text-slate-300">
              Digital solutions for your business !
            </p>
          </div>
        </div>
      </div>

      {/* Right Side - Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8 bg-background">
        <div className="w-full max-w-md">
          {/* Theme Toggle */}
          <div className="flex justify-end mb-8">
            <Button
              variant="ghost"
              size="icon"
              onClick={toggleTheme}
              data-testid="login-theme-toggle"
              className="rounded-full"
            >
              {theme === 'light' ? <Moon className="h-5 w-5" /> : <Sun className="h-5 w-5" />}
            </Button>
          </div>

          <div className="text-center mb-6">
            <h2 className="text-3xl font-semibold tracking-tight">
              Conectează-te
            </h2>
            <p className="text-muted-foreground mt-1">
              Introdu datele tale pentru a continua
            </p>
          </div>

          <Card className="border-border/50 shadow-lg">
            <CardContent className="pt-6">
              <form onSubmit={handleLogin} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="login-email">Email</Label>
                  <Input
                    id="login-email"
                    type="email"
                    placeholder="email@nextify.md"
                    value={loginData.email}
                    onChange={(e) => setLoginData({ ...loginData, email: e.target.value })}
                    data-testid="login-email-input"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="login-password">Parolă</Label>
                  <Input
                    id="login-password"
                    type="password"
                    placeholder="••••••••"
                    value={loginData.password}
                    onChange={(e) => setLoginData({ ...loginData, password: e.target.value })}
                    data-testid="login-password-input"
                    required
                  />
                </div>
                <Button
                  type="submit"
                  className="w-full active-scale"
                  disabled={loading}
                  data-testid="login-submit-button"
                >
                  <LogIn className="w-4 h-4 mr-2" />
                  {loading ? 'Se încarcă...' : 'Autentificare'}
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};
