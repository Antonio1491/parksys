import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useHybridAuth } from '@/hooks/useHybridAuth';
import { apiRequest } from '@/lib/queryClient';
import { User } from '@/hooks/useAuth';

export function HybridLoginForm() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const { loginFirebase, firebaseError } = useHybridAuth();

  // Login tradicional del sistema existente
  const handleTraditionalLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      const response = await apiRequest('/api/auth/login', {
        method: 'POST',
        body: JSON.stringify({ username, password }),
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (response.user && response.token) {
        localStorage.setItem('user', JSON.stringify(response.user));
        localStorage.setItem('token', response.token);
        window.location.href = '/admin';
      }
    } catch (error: any) {
      console.error('Error en login:', error);
      setError('Usuario o contraseña incorrectos');
    } finally {
      setIsLoading(false);
    }
  };

  const handleFirebaseLogin = async () => {
    try {
      setError('');
      await loginFirebase();
    } catch (error: any) {
      console.error('Error en Firebase login:', error);
      setError('Error al conectar con Google');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-2xl font-bold text-center">
            🌳 ParkSys Login
          </CardTitle>
          <CardDescription className="text-center">
            Accede al sistema de gestión de parques
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <form onSubmit={handleTraditionalLogin} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="username">Usuario</Label>
              <Input
                id="username"
                type="text"
                placeholder="Ingresa tu usuario"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Contraseña</Label>
              <Input
                id="password"
                type="password"
                placeholder="Ingresa tu contraseña"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
            
            {error && (
              <div className="text-red-600 text-sm text-center">
                {error}
              </div>
            )}
            
            <Button 
              type="submit" 
              className="w-full" 
              disabled={isLoading}
            >
              {isLoading ? 'Iniciando sesión...' : 'Iniciar Sesión'}
            </Button>
          </form>

          <div className="my-4 text-center text-sm text-gray-500">
            O continúa con
          </div>

          <Button 
            type="button"
            variant="outline" 
            className="w-full"
            onClick={handleFirebaseLogin}
          >
            <span className="mr-2">🔥</span>
            Continuar con Google/Firebase
          </Button>

          {firebaseError && (
            <div className="text-red-600 text-sm text-center">
              {firebaseError}
            </div>
          )}

          <div className="text-center text-sm text-gray-500 mt-4">
            Sistema de gestión municipal de parques urbanos
          </div>
        </CardContent>
      </Card>
    </div>
  );
}