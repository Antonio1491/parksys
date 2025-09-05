import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useFirebaseAuth } from '@/hooks/useFirebaseAuth';
import { useLocation } from 'wouter';
import { Loader2, User, Mail, Lock, UserPlus, Eye, EyeOff, ArrowLeft } from 'lucide-react';
import logoPath from "@assets/Parksys smart Management 2_1755620540116.png";

export function FirebaseLoginForm() {
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [registerEmail, setRegisterEmail] = useState('');
  const [registerPassword, setRegisterPassword] = useState('');
  const [registerConfirmPassword, setRegisterConfirmPassword] = useState('');
  const [registerDisplayName, setRegisterDisplayName] = useState('');
  const [resetEmail, setResetEmail] = useState('');
  const [showResetForm, setShowResetForm] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showRegisterPassword, setShowRegisterPassword] = useState(false);
  const [showRegisterConfirmPassword, setShowRegisterConfirmPassword] = useState(false);
  const [localError, setLocalError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  const { 
    login, 
    register, 
    resetPassword, 
    loading, 
    error, 
    userStatus,
    user,
    isAuthenticated
  } = useFirebaseAuth();

  const [, setLocation] = useLocation();

  // Redirección automática cuando el usuario está autenticado
  useEffect(() => {
    if (isAuthenticated) {
      console.log('✅ Usuario autenticado, redirigiendo al dashboard...');
      setLocation('/admin');
    }
  }, [isAuthenticated, setLocation]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLocalError('');
    setSuccessMessage('');

    try {
      await login(loginEmail, loginPassword);
    } catch (error: any) {
      setLocalError(error.message);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setLocalError('');
    setSuccessMessage('');

    if (registerPassword !== registerConfirmPassword) {
      setLocalError('Las contraseñas no coinciden');
      return;
    }

    if (registerPassword.length < 6) {
      setLocalError('La contraseña debe tener al menos 6 caracteres');
      return;
    }

    try {
      await register(registerEmail, registerPassword, registerDisplayName);
      setSuccessMessage('¡Registro exitoso! Tu solicitud está pendiente de aprobación por el administrador.');
    } catch (error: any) {
      setLocalError(error.message);
    }
  };

  const handlePasswordReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setLocalError('');
    setSuccessMessage('');

    try {
      await resetPassword(resetEmail);
      setSuccessMessage('Se ha enviado un email para restablecer tu contraseña');
      setShowResetForm(false);
    } catch (error: any) {
      setLocalError(error.message);
    }
  };

  // Mostrar estado de usuario autenticado pero pendiente
  if (user && userStatus.isPending) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl font-bold text-yellow-600">
              🕐 Solicitud Pendiente
            </CardTitle>
            <CardDescription>
              Tu cuenta está pendiente de aprobación
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center space-y-4">
            <div className="p-4 bg-yellow-50 rounded-lg">
              <p className="text-sm text-yellow-700">
                <strong>Email:</strong> {user.email}
              </p>
              <p className="text-sm text-yellow-700 mt-2">
                Tu solicitud ha sido enviada al administrador del sistema. 
                Recibirás una notificación cuando tu cuenta sea aprobada.
              </p>
            </div>
            <Button 
              variant="outline" 
              onClick={() => window.location.reload()}
              className="w-full"
            >
              Verificar Estado
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Mostrar estado de usuario rechazado
  if (user && userStatus.isRejected) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl font-bold text-red-600">
              ❌ Acceso Denegado
            </CardTitle>
            <CardDescription>
              Tu solicitud de acceso ha sido rechazada
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center space-y-4">
            <div className="p-4 bg-red-50 rounded-lg">
              <p className="text-sm text-red-700">
                Tu solicitud de acceso al sistema ha sido revisada y no fue aprobada.
                Para más información, contacta al administrador del sistema.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Mostrar formulario de reset de contraseña con diseño original
  if (showResetForm) {
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
          <form onSubmit={handlePasswordReset}>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="resetEmail" className="text-white">Email</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input
                    id="resetEmail"
                    type="email"
                    placeholder="tu@email.com"
                    className="pl-10"
                    value={resetEmail}
                    onChange={(e) => setResetEmail(e.target.value)}
                    required
                  />
                </div>
              </div>
            </CardContent>
            <CardContent className="pt-0">
              <div className="flex flex-col space-y-2">
                <Button className="w-full" type="submit" disabled={loading}>
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
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
                  onClick={() => setShowResetForm(false)}
                >
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Volver al Login
                </Button>
              </div>
            </CardContent>
          </form>
          
          {/* Mostrar errores */}
          {(error || localError) && (
            <CardContent className="pt-0">
              <Alert className="border-red-200 bg-red-50">
                <AlertDescription className="text-red-700">
                  {error || localError}
                </AlertDescription>
              </Alert>
            </CardContent>
          )}

          {/* Mostrar mensajes de éxito */}
          {successMessage && (
            <CardContent className="pt-0">
              <Alert className="border-green-200 bg-green-50">
                <AlertDescription className="text-green-700">
                  {successMessage}
                </AlertDescription>
              </Alert>
            </CardContent>
          )}
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
        <CardContent>
          <Tabs defaultValue="login" className="w-full">
            <TabsList className="grid w-full grid-cols-2 bg-white">
              <TabsTrigger value="login">Iniciar Sesión</TabsTrigger>
              <TabsTrigger value="register">Registrarse</TabsTrigger>
            </TabsList>
            
            <TabsContent value="login" className="space-y-4">
              <form onSubmit={handleLogin} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="loginEmail" className="text-white">Email</Label>
                  <Input
                    id="loginEmail"
                    type="email"
                    placeholder="Ingresa tu email"
                    value={loginEmail}
                    onChange={(e) => setLoginEmail(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="loginPassword" className="text-white">Contraseña</Label>
                  <div className="relative">
                    <Input
                      id="loginPassword"
                      type={showPassword ? 'text' : 'password'}
                      placeholder="Ingresa tu contraseña"
                      value={loginPassword}
                      onChange={(e) => setLoginPassword(e.target.value)}
                      required
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
                  <div className="text-right">
                    <button
                      type="button"
                      className="text-sm text-blue-300 hover:text-blue-100 hover:underline"
                      onClick={() => setShowResetForm(true)}
                    >
                      ¿Olvidaste tu contraseña?
                    </button>
                  </div>
                </div>
                
                <Button 
                  type="submit" 
                  className="w-full" 
                  disabled={loading}
                >
                  {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Iniciar Sesión
                </Button>
              </form>
            </TabsContent>
            
            <TabsContent value="register" className="space-y-4">
              <form onSubmit={handleRegister} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="registerDisplayName" className="text-white">Nombre completo</Label>
                  <Input
                    id="registerDisplayName"
                    type="text"
                    placeholder="Tu nombre completo"
                    value={registerDisplayName}
                    onChange={(e) => setRegisterDisplayName(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="registerEmail" className="text-white">Email</Label>
                  <Input
                    id="registerEmail"
                    type="email"
                    placeholder="tu-email@ejemplo.com"
                    value={registerEmail}
                    onChange={(e) => setRegisterEmail(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="registerPassword" className="text-white">Contraseña</Label>
                  <div className="relative">
                    <Input
                      id="registerPassword"
                      type={showRegisterPassword ? 'text' : 'password'}
                      placeholder="Mínimo 6 caracteres"
                      value={registerPassword}
                      onChange={(e) => setRegisterPassword(e.target.value)}
                      required
                    />
                    <button
                      type="button"
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
                      onClick={() => setShowRegisterPassword(!showRegisterPassword)}
                    >
                      {showRegisterPassword ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </button>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="registerConfirmPassword" className="text-white">Confirmar contraseña</Label>
                  <div className="relative">
                    <Input
                      id="registerConfirmPassword"
                      type={showRegisterConfirmPassword ? 'text' : 'password'}
                      placeholder="Repite tu contraseña"
                      value={registerConfirmPassword}
                      onChange={(e) => setRegisterConfirmPassword(e.target.value)}
                      required
                    />
                    <button
                      type="button"
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
                      onClick={() => setShowRegisterConfirmPassword(!showRegisterConfirmPassword)}
                    >
                      {showRegisterConfirmPassword ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </button>
                  </div>
                </div>
                
                <div className="p-3 bg-blue-100 rounded-lg border border-blue-200">
                  <p className="text-sm text-blue-700">
                    <UserPlus className="w-4 h-4 inline mr-1" />
                    Tu cuenta requiere aprobación del administrador antes de poder acceder al sistema.
                  </p>
                </div>
                
                <Button 
                  type="submit" 
                  className="w-full" 
                  disabled={loading}
                >
                  {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Crear Cuenta
                </Button>
              </form>
            </TabsContent>
          </Tabs>

          {/* Mostrar errores */}
          {(error || localError) && (
            <Alert className="mt-4 border-red-200 bg-red-50">
              <AlertDescription className="text-red-700">
                {error || localError}
              </AlertDescription>
            </Alert>
          )}

          {/* Mostrar mensajes de éxito */}
          {successMessage && (
            <Alert className="mt-4 border-green-200 bg-green-50">
              <AlertDescription className="text-green-700">
                {successMessage}
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>
    </div>
  );
}