import type { Express } from "express";

export function registerTestRoleCreationRoutes(app: Express) {
  // Página de prueba simple para verificar la funcionalidad de crear roles
  app.get("/test-role-creation", (req, res) => {
    const html = `
<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Prueba - Crear Rol</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 40px; }
        .container { max-width: 800px; margin: 0 auto; }
        .form-group { margin: 20px 0; }
        label { display: block; margin-bottom: 5px; font-weight: bold; }
        input, textarea, select { width: 100%; padding: 10px; border: 1px solid #ddd; border-radius: 4px; }
        button { background: #22c55e; color: white; padding: 12px 24px; border: none; border-radius: 4px; cursor: pointer; font-size: 16px; }
        button:hover { background: #16a34a; }
        .success { color: #22c55e; margin: 20px 0; }
        .error { color: #ef4444; margin: 20px 0; }
        .info { background: #f0f9ff; padding: 15px; border-left: 4px solid #0ea5e9; margin: 20px 0; }
    </style>
</head>
<body>
    <div class="container">
        <h1>🔧 Prueba - Funcionalidad Crear Rol</h1>
        
        <div class="info">
            <strong>Esta es una página de prueba para verificar que la funcionalidad de crear roles esté funcionando.</strong><br>
            Solo usuarios con rol "super-admin" o "admin" pueden crear roles.
        </div>

        <form id="roleForm">
            <div class="form-group">
                <label for="name">Nombre del Rol:</label>
                <input type="text" id="name" name="name" required placeholder="ej: Coordinador de Actividades">
            </div>

            <div class="form-group">
                <label for="slug">Slug (Identificador):</label>
                <input type="text" id="slug" name="slug" required placeholder="ej: coordinador-actividades">
            </div>

            <div class="form-group">
                <label for="description">Descripción:</label>
                <textarea id="description" name="description" rows="3" placeholder="Descripción del rol y sus responsabilidades..."></textarea>
            </div>

            <div class="form-group">
                <label for="level">Nivel (1-10):</label>
                <select id="level" name="level" required>
                    <option value="">Seleccionar nivel</option>
                    <option value="1">Nivel 1 (Super Admin)</option>
                    <option value="2">Nivel 2 (Admin)</option>
                    <option value="3">Nivel 3 (Coordinación)</option>
                    <option value="4">Nivel 4 (Coordinación)</option>
                    <option value="5">Nivel 5 (Operativo)</option>
                    <option value="6">Nivel 6 (Operativo)</option>
                    <option value="7">Nivel 7 (Operativo)</option>
                    <option value="8">Nivel 8 (Operativo)</option>
                    <option value="9">Nivel 9 (Operativo)</option>
                    <option value="10">Nivel 10 (Operativo)</option>
                </select>
            </div>

            <div class="form-group">
                <label for="color">Color:</label>
                <input type="color" id="color" name="color" value="#6366f1">
            </div>

            <button type="submit">✅ Crear Rol</button>
        </form>

        <div id="result"></div>

        <div style="margin-top: 40px; padding: 20px; background: #f8fafc; border-radius: 8px;">
            <h3>Estado de la API:</h3>
            <button onclick="testAPI()" style="background: #3b82f6;">🧪 Probar Conexión API</button>
            <div id="apiStatus"></div>
        </div>
    </div>

    <script>
        document.getElementById('roleForm').addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const formData = new FormData(e.target);
            const roleData = {
                name: formData.get('name'),
                slug: formData.get('slug'),
                description: formData.get('description'),
                level: parseInt(formData.get('level')),
                color: formData.get('color'),
                permissions: {},
                isActive: true
            };

            try {
                const response = await fetch('/api/roles', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify(roleData)
                });

                const result = await response.json();
                const resultDiv = document.getElementById('result');
                
                if (response.ok) {
                    resultDiv.innerHTML = '<div class="success">✅ Rol creado exitosamente: ' + JSON.stringify(result, null, 2) + '</div>';
                    document.getElementById('roleForm').reset();
                } else {
                    resultDiv.innerHTML = '<div class="error">❌ Error: ' + (result.error || 'Error desconocido') + '</div>';
                }
            } catch (error) {
                document.getElementById('result').innerHTML = '<div class="error">❌ Error de conexión: ' + error.message + '</div>';
            }
        });

        async function testAPI() {
            try {
                const response = await fetch('/api/roles');
                const roles = await response.json();
                const statusDiv = document.getElementById('apiStatus');
                
                if (response.ok) {
                    statusDiv.innerHTML = '<div class="success">✅ API funcionando. Roles encontrados: ' + roles.length + '</div>';
                } else {
                    statusDiv.innerHTML = '<div class="error">❌ Error en API: ' + response.status + '</div>';
                }
            } catch (error) {
                document.getElementById('apiStatus').innerHTML = '<div class="error">❌ Error de conexión: ' + error.message + '</div>';
            }
        }

        // Auto-generar slug basado en el nombre
        document.getElementById('name').addEventListener('input', (e) => {
            const slug = e.target.value
                .toLowerCase()
                .replace(/[^a-z0-9]+/g, '-')
                .replace(/^-+|-+$/g, '');
            document.getElementById('slug').value = slug;
        });
    </script>
</body>
</html>
    `;
    
    res.setHeader('Content-Type', 'text/html');
    res.send(html);
  });
}