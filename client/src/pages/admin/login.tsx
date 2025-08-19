import React, { useState } from 'react';
import { useLocation } from 'wouter';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Eye, EyeOff, Loader, Mail, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import logoPath from "@assets/Parksys smart Management 2_1755620540116.png";

const loginSchema = z.object({
  username: z.string().min(1, { message: 'El nombre de usuario es requerido' }),
  password: z.string().min(1, { message: 'La contraseña es requerida' }),
});

const forgotPasswordSchema = z.object({
  email: z.string().email({ message: 'Email inválido' }),
});

type LoginFormValues = z.infer<typeof loginSchema>;
type ForgotPasswordFormValues = z.infer<typeof forgotPasswordSchema>;

const AdminLogin: React.FC = () => {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [forgotPasswordLoading, setForgotPasswordLoading] = useState(false);
  
  const form = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      username: '',
      password: '',
    },
  });

  const forgotPasswordForm = useForm<ForgotPasswordFormValues>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: {
      email: '',
    },
  });
  
  const onSubmit = async (data: LoginFormValues) => {
    try {
      setIsLoading(true);
      
      // Usar directamente la URL completa para evitar cualquier problema de ruta
      const response = await fetch('/api/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(data),
        credentials: 'include'
      });
      
      // Verificar si la respuesta es exitosa
      if (!response.ok) {
        throw new Error('Credenciales incorrectas');
      }
      
      const result = await response.json();
      
      console.log("Respuesta del servidor:", result);
      
      // El servidor devuelve directamente los datos del usuario
      if (result && result.user) {
        // Guardar información del usuario (en una app real usaríamos un estado global)
        localStorage.setItem('user', JSON.stringify(result.user));
        localStorage.setItem('token', result.token);
        
        toast({
          title: 'Inicio de sesión exitoso',
          description: `Bienvenido, ${result.user.fullName || result.user.username}`,
        });
        
        // Redirigir al dashboard
        setLocation('/admin');
      } else {
        throw new Error('Respuesta de inicio de sesión inválida');
      }
    } catch (error) {
      console.error('Error de inicio de sesión:', error);
      toast({
        title: 'Error al iniciar sesión',
        description: 'Usuario o contraseña incorrectos',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const onForgotPasswordSubmit = async (data: ForgotPasswordFormValues) => {
    try {
      setForgotPasswordLoading(true);
      
      const response = await fetch('/api/password/forgot', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(data),
        credentials: 'include'
      });
      
      const result = await response.json();
      
      if (result.success) {
        toast({
          title: '✅ Email enviado',
          description: result.message + ' También puedes acceder directamente desde aquí.',
        });
        
        // Obtener el token más reciente para navegar directamente
        setTimeout(async () => {
          try {
            const tokenResponse = await fetch(`/api/password/get-latest-token/${data.email}`, {
              method: 'GET',
              headers: { 'Content-Type': 'application/json' },
              credentials: 'include'
            });
            
            if (tokenResponse.ok) {
              const tokenData = await tokenResponse.json();
              if (tokenData.token) {
                // Navegar directamente al reset sin usar localhost
                setLocation(`/auth/reset-password?token=${tokenData.token}`);
              }
            }
          } catch (error) {
            console.error('Error obteniendo token:', error);
          }
        }, 1000);
        
        setShowForgotPassword(false);
        forgotPasswordForm.reset();
      } else {
        throw new Error(result.message || 'Error al enviar email');
      }
    } catch (error) {
      console.error('Error en recuperación:', error);
      toast({
        title: 'Error',
        description: 'No se pudo enviar el email de recuperación. Inténtalo más tarde.',
        variant: 'destructive',
      });
    } finally {
      setForgotPasswordLoading(false);
    }
  };
  
  if (showForgotPassword) {
    return (
      <div className="h-screen w-screen fixed inset-0 flex items-center justify-center bg-white px-4 z-[60]">
        <Card className="w-full max-w-md" style={{ backgroundColor: '#003D49' }}>
          <CardHeader className="space-y-1">
            <div className="flex items-center justify-center mb-4">
              <img src={logoPath} alt="ParkSys" className="h-16 w-auto" />
            </div>
            <CardTitle className="text-xl text-white">Recuperar Contraseña</CardTitle>
            <CardDescription className="text-gray-200">
              Ingresa tu email para recibir un enlace de recuperación
            </CardDescription>
          </CardHeader>
          <form onSubmit={forgotPasswordForm.handleSubmit(onForgotPasswordSubmit)}>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email" className="text-white">Email</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="tu@email.com"
                    className="pl-10"
                    {...forgotPasswordForm.register('email')}
                  />
                </div>
                {forgotPasswordForm.formState.errors.email && (
                  <p className="text-sm text-red-500">{forgotPasswordForm.formState.errors.email.message}</p>
                )}
              </div>
            </CardContent>
            <CardFooter className="flex flex-col space-y-2">
              <Button className="w-full" type="submit" disabled={forgotPasswordLoading}>
                {forgotPasswordLoading ? (
                  <>
                    <Loader className="mr-2 h-4 w-4 animate-spin" />
                    Enviando...
                  </>
                ) : (
                  <>
                    <Mail className="mr-2 h-4 w-4" />
                    Enviar Enlace
                  </>
                )}
              </Button>
              <Button
                type="button"
                variant="outline"
                className="w-full"
                onClick={() => setShowForgotPassword(false)}
              >
                <ArrowLeft className="mr-2 h-4 w-4" />
                Volver al Login
              </Button>
            </CardFooter>
          </form>
        </Card>
      </div>
    );
  }

  return (
    <div className="h-screen w-screen fixed inset-0 flex items-center justify-center bg-white px-4 z-[60]">
      <Card className="w-full max-w-md" style={{ backgroundColor: '#003D49' }}>
        <CardHeader className="space-y-1">
          <div className="flex items-center justify-center mb-4">
            <a href="/" className="hover:opacity-80 transition-opacity">
              <img src={logoPath} alt="ParkSys" className="h-16 w-auto" />
            </a>
          </div>
          <CardTitle className="text-xl text-white">Panel Administrativo</CardTitle>
          <CardDescription className="text-gray-200">
            Inicia sesión con tus credenciales institucionales
          </CardDescription>
        </CardHeader>
        <form onSubmit={form.handleSubmit(onSubmit)}>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="username" className="text-white">Usuario</Label>
              <Input
                id="username"
                placeholder="Ingresa tu nombre de usuario"
                {...form.register('username')}
              />
              {form.formState.errors.username && (
                <p className="text-sm text-red-500">{form.formState.errors.username.message}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="password" className="text-white">Contraseña</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Ingresa tu contraseña"
                  {...form.register('password')}
                />
                <button
                  type="button"
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>
              {form.formState.errors.password && (
                <p className="text-sm text-red-500">{form.formState.errors.password.message}</p>
              )}
              <div className="text-right">
                <button
                  type="button"
                  className="text-sm text-blue-300 hover:text-blue-100 hover:underline"
                  onClick={() => setShowForgotPassword(true)}
                >
                  ¿Olvidaste tu contraseña?
                </button>
              </div>
            </div>
          </CardContent>
          <CardFooter className="flex flex-col">
            <Button className="w-full" type="submit" disabled={isLoading}>
              {isLoading && <Loader className="mr-2 h-4 w-4 animate-spin" />}
              Iniciar Sesión
            </Button>
            <div className="mt-4 text-center">
              <p className="text-sm text-gray-300">
                Usuario de prueba: <span className="font-medium text-white">admin</span>
              </p>
              <p className="text-sm text-gray-300">
                Contraseña: <span className="font-medium text-white">admin123</span>
              </p>
            </div>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
};

export default AdminLogin;
