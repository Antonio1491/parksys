import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useFirebaseAuth } from '@/hooks/useFirebaseAuth';
import { Loader2, User, Mail, Lock, UserPlus } from 'lucide-react';

export function FirebaseLoginForm() {
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [registerEmail, setRegisterEmail] = useState('');
  const [registerPassword, setRegisterPassword] = useState('');
  const [registerConfirmPassword, setRegisterConfirmPassword] = useState('');
  const [registerDisplayName, setRegisterDisplayName] = useState('');
  const [resetEmail, setResetEmail] = useState('');
  const [showResetForm, setShowResetForm] = useState(false);
  const [localError, setLocalError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  const { 
    login, 
    register, 
    resetPassword, 
    loading, 
    error, 
    userStatus,
    user
  } = useFirebaseAuth();

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

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-2xl font-bold text-center">
            🌳 ParkSys
          </CardTitle>
          <CardDescription className="text-center">
            Sistema de gestión de parques urbanos
          </CardDescription>
        </CardHeader>
        <CardContent>
          {showResetForm ? (
            <form onSubmit={handlePasswordReset} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="resetEmail">
                  <Mail className="w-4 h-4 inline mr-2" />
                  Email para restablecer contraseña
                </Label>
                <Input
                  id="resetEmail"
                  type="email"
                  placeholder="tu-email@ejemplo.com"
                  value={resetEmail}
                  onChange={(e) => setResetEmail(e.target.value)}
                  required
                />
              </div>
              
              <div className="flex gap-2">
                <Button 
                  type="submit" 
                  disabled={loading}
                  className="flex-1"
                >
                  {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Enviar Email
                </Button>
                <Button 
                  type="button"
                  variant="outline"
                  onClick={() => setShowResetForm(false)}
                  disabled={loading}
                >
                  Cancelar
                </Button>
              </div>
            </form>
          ) : (
            <Tabs defaultValue="login" className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="login">Iniciar Sesión</TabsTrigger>
                <TabsTrigger value="register">Registrarse</TabsTrigger>
              </TabsList>
              
              <TabsContent value="login" className="space-y-4">
                <form onSubmit={handleLogin} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="loginEmail">
                      <Mail className="w-4 h-4 inline mr-2" />
                      Email
                    </Label>
                    <Input
                      id="loginEmail"
                      type="email"
                      placeholder="tu-email@ejemplo.com"
                      value={loginEmail}
                      onChange={(e) => setLoginEmail(e.target.value)}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="loginPassword">
                      <Lock className="w-4 h-4 inline mr-2" />
                      Contraseña
                    </Label>
                    <Input
                      id="loginPassword"
                      type="password"
                      placeholder="Tu contraseña"
                      value={loginPassword}
                      onChange={(e) => setLoginPassword(e.target.value)}
                      required
                    />
                  </div>
                  
                  <Button 
                    type="submit" 
                    className="w-full" 
                    disabled={loading}
                  >
                    {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Iniciar Sesión
                  </Button>
                  
                  <Button
                    type="button"
                    variant="link"
                    className="w-full text-sm"
                    onClick={() => setShowResetForm(true)}
                  >
                    ¿Olvidaste tu contraseña?
                  </Button>
                </form>
              </TabsContent>
              
              <TabsContent value="register" className="space-y-4">
                <form onSubmit={handleRegister} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="registerDisplayName">
                      <User className="w-4 h-4 inline mr-2" />
                      Nombre completo
                    </Label>
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
                    <Label htmlFor="registerEmail">
                      <Mail className="w-4 h-4 inline mr-2" />
                      Email
                    </Label>
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
                    <Label htmlFor="registerPassword">
                      <Lock className="w-4 h-4 inline mr-2" />
                      Contraseña
                    </Label>
                    <Input
                      id="registerPassword"
                      type="password"
                      placeholder="Mínimo 6 caracteres"
                      value={registerPassword}
                      onChange={(e) => setRegisterPassword(e.target.value)}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="registerConfirmPassword">
                      <Lock className="w-4 h-4 inline mr-2" />
                      Confirmar contraseña
                    </Label>
                    <Input
                      id="registerConfirmPassword"
                      type="password"
                      placeholder="Repite tu contraseña"
                      value={registerConfirmPassword}
                      onChange={(e) => setRegisterConfirmPassword(e.target.value)}
                      required
                    />
                  </div>
                  
                  <div className="p-4 bg-blue-50 rounded-lg">
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
          )}

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