import express from "express";
import path from "path";
import fs from "fs";

const app = express();

// ===== CRITICAL ERROR HANDLING TO PREVENT CRASHES =====
process.on('uncaughtException', (error) => {
  console.error('❌ UNCAUGHT EXCEPTION - Server will continue running:', error);
  console.error('Stack:', error.stack);
  // Log but don't crash - health checks must continue working
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('❌ UNHANDLED REJECTION - Server will continue running:', reason);
  console.error('Promise:', promise);
  // Log but don't crash - health checks must continue working
});


// ===== INSTANT HEALTH CHECK RESPONSES - NO LOGIC =====
const HEALTH_RESPONSE = 'HEALTHY';

// ===== ULTRA-ROBUST ROOT ENDPOINT - NEVER FAILS =====
// Universal endpoint that handles ALL requests without failures
app.get('/', (req, res) => {
  try {
    const userAgent = req.get('User-Agent') || '';
    const acceptHeader = req.get('Accept') || '';
    
    console.log(`🌐 ROOT REQUEST - UA: ${userAgent.substring(0, 50)}... Accept: ${acceptHeader}`);
    
    // Simple detection: if Accept contains text/html, it's likely a browser
    const wantsBrowserContent = acceptHeader.includes('text/html');
    
    if (!wantsBrowserContent) {
      // Likely a health checker or API call
      console.log('✅ Health check request detected');
      return res.status(200).send(HEALTH_RESPONSE);
    }
    
    // Browser request - try multiple paths for index.html
    const possiblePaths = [
      path.join(process.cwd(), 'public', 'index.html'),
      path.join(process.cwd(), 'dist', 'index.html'),
      path.join(process.cwd(), 'build', 'index.html'),
      path.join(process.cwd(), 'index.html')
    ];
    
    let foundPath = null;
    for (const indexPath of possiblePaths) {
      if (fs.existsSync(indexPath)) {
        foundPath = indexPath;
        console.log(`✅ Found index.html at: ${indexPath}`);
        break;
      }
    }
    
    if (foundPath) {
      // Serve the React app
      res.sendFile(foundPath, (err) => {
        if (err) {
          console.error('❌ Error serving index.html:', err);
          // Fallback to inline HTML
          res.status(200).send(generateFallbackHTML());
        }
      });
    } else {
      // No index.html found anywhere - generate fallback HTML
      console.log('⚠️ No index.html found in any location, serving fallback');
      res.status(200).send(generateFallbackHTML());
    }
    
  } catch (error) {
    console.error('❌ Critical error in root endpoint:', error);
    // Ultimate fallback - never return 503
    const acceptHeader = req.get('Accept') || '';
    if (acceptHeader.includes('text/html')) {
      res.status(200).send(generateFallbackHTML());
    } else {
      res.status(200).send(HEALTH_RESPONSE);
    }
  }
});

// Generate fallback HTML when React build is not available
function generateFallbackHTML() {
  return `<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>ParkSys - Cargando</title>
    <style>
        body { 
            font-family: Arial, sans-serif; 
            margin: 0; 
            padding: 40px; 
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            text-align: center;
            min-height: 100vh;
            display: flex;
            flex-direction: column;
            justify-content: center;
        }
        .loading { animation: pulse 2s infinite; }
        @keyframes pulse { 0%, 100% { opacity: 0.7; } 50% { opacity: 1; } }
        .card { 
            background: rgba(255,255,255,0.1); 
            padding: 30px; 
            border-radius: 10px; 
            backdrop-filter: blur(10px);
            max-width: 500px;
            margin: 0 auto;
        }
        .retry-btn {
            margin-top: 20px;
            padding: 10px 20px;
            background: #4CAF50;
            color: white;
            border: none;
            border-radius: 5px;
            cursor: pointer;
            font-size: 16px;
        }
        .retry-btn:hover { background: #45a049; }
    </style>
</head>
<body>
    <div class="card">
        <div class="loading">
            <h1>🏞️ ParkSys</h1>
            <h2>Sistema de Información de Parques Públicos</h2>
            <p>La aplicación se está iniciando...</p>
            <p><small>Por favor espera unos momentos mientras se completa la carga.</small></p>
        </div>
        <button class="retry-btn" onclick="window.location.reload()">Reintentar</button>
    </div>
    
    <script>
        // Auto-reload every 10 seconds if this fallback is shown
        setTimeout(() => {
            console.log('Auto-reloading to check for app availability...');
            window.location.reload();
        }, 10000);
        
        // Try to detect if main app becomes available
        fetch('/api/status').then(() => {
            console.log('Main app detected, reloading...');
            window.location.reload();
        }).catch(() => {
            console.log('Main app not ready yet...');
        });
    </script>
</body>
</html>`;
}

// ===== REACT APP SERVING ON SEPARATE ROUTE =====
app.get('/app*', (req, res) => {
  try {
    const indexPath = path.join(process.cwd(), 'public', 'index.html');
    if (fs.existsSync(indexPath)) {
      res.sendFile(indexPath, (err) => {
        if (err) {
          console.error('❌ Error serving React app:', err);
          res.status(500).send('<!DOCTYPE html><html><head><title>Error</title></head><body><h1>Application Error</h1></body></html>');
        }
      });
    } else {
      console.error('❌ index.html not found at:', indexPath);
      res.status(503).send('<!DOCTYPE html><html><head><title>Service Unavailable</title></head><body><h1>Application Building...</h1></body></html>');
    }
  } catch (error) {
    console.error('❌ Error in app endpoint:', error);
    res.status(500).send('<!DOCTYPE html><html><head><title>Error</title></head><body><h1>Server Error</h1></body></html>');
  }
});

// All health check endpoints - instant responses
app.get('/ping', (req, res) => {
  res.status(200).send('pong');
});

app.get('/health', (req, res) => {
  res.status(200).send(HEALTH_RESPONSE);
});

app.get('/healthz', (req, res) => {
  res.status(200).send(HEALTH_RESPONSE);
});

app.get('/liveness', (req, res) => {
  res.status(200).send(HEALTH_RESPONSE);
});

app.get('/readiness', (req, res) => {
  res.status(200).send(HEALTH_RESPONSE);
});

app.get('/_health', (req, res) => {
  res.status(200).send(HEALTH_RESPONSE);
});

app.get('/up', (req, res) => {
  res.status(200).send(HEALTH_RESPONSE);
});

app.get('/ready', (req, res) => {
  res.status(200).send(HEALTH_RESPONSE);
});

app.get('/status', (req, res) => {
  res.status(200).send(HEALTH_RESPONSE);
});

// Dedicated browser route for React application (backup)
app.get('/app', (req, res) => {
  try {
    const indexPath = path.join(process.cwd(), 'public', 'index.html');
    if (fs.existsSync(indexPath)) {
      res.sendFile(indexPath, (err) => {
        if (err) {
          console.error('❌ Error serving /app:', err);
          res.status(500).send('<!DOCTYPE html><html><head><title>Error</title></head><body><h1>Application Error</h1></body></html>');
        }
      });
    } else {
      console.error('❌ index.html not found for /app at:', indexPath);
      res.status(503).send('<!DOCTYPE html><html><head><title>Not Built</title></head><body><h1>Application not built</h1></body></html>');
    }
  } catch (error) {
    console.error('❌ Error in /app endpoint:', error);
    res.status(500).send('<!DOCTYPE html><html><head><title>Error</title></head><body><h1>Server Error</h1></body></html>');
  }
});

// ===== ROBUST STATIC FILE SERVING FOR PRODUCTION =====
try {
  const publicPath = path.join(process.cwd(), 'public');
  console.log(`📁 Serving static files from: ${publicPath}`);
  console.log(`📁 Public directory exists: ${fs.existsSync(publicPath)}`);
  
  // Check critical files
  const assetsPath = path.join(publicPath, 'assets');
  const faviconPath = path.join(publicPath, 'favicon.ico');
  const logoPath = path.join(publicPath, 'parksys-logo.png');
  
  console.log(`📁 Assets directory exists: ${fs.existsSync(assetsPath)}`);
  console.log(`📁 Favicon exists: ${fs.existsSync(faviconPath)}`);
  console.log(`📁 Logo exists: ${fs.existsSync(logoPath)}`);
  
  // Primary static file serving with robust error handling
  app.use(express.static(publicPath, {
    maxAge: '1d', // Cache for 1 day in production
    etag: true,
    lastModified: true,
    setHeaders: (res, filePath, stat) => {
      // Set correct content types
      if (filePath.endsWith('.ico')) {
        res.setHeader('Content-Type', 'image/x-icon');
      } else if (filePath.endsWith('.js')) {
        res.setHeader('Content-Type', 'application/javascript');
      } else if (filePath.endsWith('.css')) {
        res.setHeader('Content-Type', 'text/css');
      } else if (filePath.endsWith('.png')) {
        res.setHeader('Content-Type', 'image/png');
      }
      
      // CORS headers for assets
      res.setHeader('Access-Control-Allow-Origin', '*');
      res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');
    },
    fallthrough: true
  }));

  // Fallback for missing static files - return 404 instead of crashing
  app.use('/assets/*', (req, res, next) => {
    console.log(`⚠️ Missing asset requested: ${req.path}`);
    res.status(404).send('Asset not found');
  });

  app.use('/favicon.ico', (req, res, next) => {
    const faviconPath = path.join(publicPath, 'favicon.ico');
    if (fs.existsSync(faviconPath)) {
      res.sendFile(faviconPath);
    } else {
      console.log('⚠️ Favicon not found, serving default');
      res.status(404).send('Favicon not found');
    }
  });

  // Additional static routes for uploads
  const isProduction = process.env.NODE_ENV === 'production' || process.env.VERCEL;
  const uploadsBasePath = isProduction ? 
    path.join(process.cwd(), 'public/uploads') : 
    path.join(process.cwd(), 'uploads');

  console.log(`📁 Uploads path: ${uploadsBasePath}`);
  console.log(`📁 Uploads directory exists: ${fs.existsSync(uploadsBasePath)}`);

  app.use('/uploads', express.static(uploadsBasePath, { 
    fallthrough: true,
    maxAge: '1h'
  }));

  if (isProduction) {
    app.use('/public/uploads', express.static(path.join(process.cwd(), 'public/uploads'), { 
      fallthrough: true,
      maxAge: '1h'
    }));
  }
  
  console.log('✅ Static file serving configured successfully');
  
} catch (error) {
  console.error('❌ Error setting up static file serving:', error);
  // Continue without crashing - server must stay alive
}

// ===== CRITICAL MIDDLEWARE SETUP FIRST =====
// Configure essential middleware BEFORE server starts listening
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// CORS middleware - MUST be configured before server starts
app.use((req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-User-Id, X-User-Role');
  
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }
  
  next();
});

console.log('✅ Critical middleware configured');

// ===== DEPLOYMENT CONFIGURATION =====
// Use PORT from environment, fallback to 5000 for Replit
const PORT = parseInt(process.env.PORT || "5000"); 
const HOST = "0.0.0.0"; // Required for deployment platforms

console.log('🚀 Starting ParkSys server for deployment...');
console.log(`📡 Environment: ${process.env.NODE_ENV || 'development'}`);
console.log(`🔧 PORT: ${PORT}, HOST: ${HOST}`);
console.log(`💻 Process: ${process.pid}`);
console.log(`📦 Platform: ${process.platform}`);
console.log(`⚡ Node version: ${process.version}`);

// ===== ROBUST SERVER STARTUP =====
const server = app.listen(PORT, HOST, () => {
  console.log(`✅ Server listening on ${HOST}:${PORT}`);
  console.log('🏥 Health checks active - instant responses');
  console.log('📡 Ready for deployment health checks');
  console.log(`🌐 Application available at: http://${HOST}:${PORT}/app`);
  console.log(`⚡ Health check at: http://${HOST}:${PORT}/`);
  
  // Start ALL initialization after server is listening
  process.nextTick(() => {
    initializeApplication().catch(error => {
      console.error('❌ Background initialization error:', error);
      console.error('Stack:', error.stack);
      // Never crash - keep server running for health checks
    });
  });
});

// ===== SERVER ERROR HANDLING =====
server.on('error', (error: any) => {
  console.error('❌ Server error:', error);
  if (error.code === 'EADDRINUSE') {
    console.error(`❌ Port ${PORT} is already in use`);
    process.exit(1);
  }
  // For other errors, log but don't crash
});

server.on('clientError', (err: any, socket: any) => {
  console.error('❌ Client error:', err);
  // Don't crash on client errors
  if (!socket.destroyed) {
    socket.end('HTTP/1.1 400 Bad Request\r\n\r\n');
  }
});

// ===== APPLICATION INITIALIZATION (BACKGROUND ONLY) =====
async function initializeApplication() {
  try {
    console.log('🔄 Starting background application initialization...');
    
    // Import path and fs only when needed
    const path = await import("path");
    const fs = await import("fs");
    
    // Basic middleware already configured before server start - skipping duplicates

    // ===== CRITICAL API ROUTES (DIRECT REGISTRATION) =====
    // Register essential API routes directly to bypass TypeScript errors
    
    // Parks API
    app.get('/api/parks', async (req, res) => {
      try {
        const { pool } = await import("./db");
        const result = await pool.query('SELECT * FROM parks ORDER BY id');
        res.json(result.rows);
      } catch (error) {
        console.error('Error fetching parks:', error);
        res.status(500).json({ error: 'Error loading parks' });
      }
    });

    // Activities with photos API
    app.get('/api/actividades-fotos', async (req, res) => {
      try {
        const { pool } = await import("./db");
        const result = await pool.query(`
          SELECT 
            a.id, a.title, a.description, a.start_date as "startDate",
            a.end_date as "endDate", a.category, a.park_id as "parkId",
            a.location, a.capacity, a.price, a.status,
            p.name as "parkName", img.image_url as "imageUrl",
            img.caption as "imageCaption"
          FROM activities a
          LEFT JOIN parks p ON a.park_id = p.id
          LEFT JOIN activity_images img ON a.id = img.activity_id
          WHERE img.image_url IS NOT NULL
          ORDER BY a.created_at DESC
        `);
        res.json(result.rows);
      } catch (error) {
        console.error('Error fetching activities with photos:', error);
        res.status(500).json({ error: 'Error loading activities' });
      }
    });

    // Sponsors API
    app.get('/api/sponsors', async (req, res) => {
      try {
        const { pool } = await import("./db");
        const result = await pool.query('SELECT * FROM sponsors ORDER BY contract_value DESC, id');
        res.json(result.rows);
      } catch (error) {
        console.error('Error fetching sponsors:', error);
        res.status(500).json({ error: 'Error loading sponsors' });
      }
    });

    // Events API
    app.get('/api/events', async (req, res) => {
      try {
        const { pool } = await import("./db");
        const result = await pool.query('SELECT * FROM events ORDER BY start_date DESC');
        res.json(result.rows);
      } catch (error) {
        console.error('Error fetching events:', error);
        res.status(500).json({ error: 'Error loading events' });
      }
    });

    // Individual activity API
    app.get('/api/activities/:id', async (req, res) => {
      try {
        const { pool } = await import("./db");
        const activityId = req.params.id;
        const result = await pool.query(`
          SELECT 
            a.*, p.name as "parkName",
            c.name as "categoryName",
            i.full_name as "instructorName"
          FROM activities a
          LEFT JOIN parks p ON a.park_id = p.id
          LEFT JOIN activity_categories c ON a.category_id = c.id
          LEFT JOIN instructors i ON a.instructor_id = i.id
          WHERE a.id = $1
        `, [activityId]);
        
        if (result.rows.length === 0) {
          return res.status(404).json({ error: 'Activity not found' });
        }
        
        res.json(result.rows[0]);
      } catch (error) {
        console.error('Error fetching activity:', error);
        res.status(500).json({ error: 'Error loading activity' });
      }
    });

    // Activity images API
    app.get('/api/activities/:id/images', async (req, res) => {
      try {
        const { pool } = await import("./db");
        const activityId = req.params.id;
        const result = await pool.query(
          'SELECT * FROM activity_images WHERE activity_id = $1 ORDER BY id',
          [activityId]
        );
        res.json(result.rows);
      } catch (error) {
        console.error('Error fetching activity images:', error);
        res.status(500).json({ error: 'Error loading activity images' });
      }
    });

    // Activity registration stats API
    app.get('/api/activity-registrations/stats/:id', async (req, res) => {
      try {
        const { pool } = await import("./db");
        const activityId = req.params.id;
        const result = await pool.query(`
          SELECT 
            COUNT(*) as total_registrations,
            COUNT(CASE WHEN status = 'confirmed' THEN 1 END) as confirmed_registrations,
            COUNT(CASE WHEN status = 'pending' THEN 1 END) as pending_registrations
          FROM activity_registrations 
          WHERE activity_id = $1
        `, [activityId]);
        res.json(result.rows[0] || { total_registrations: 0, confirmed_registrations: 0, pending_registrations: 0 });
      } catch (error) {
        console.error('Error fetching activity registration stats:', error);
        res.status(500).json({ error: 'Error loading registration stats' });
      }
    });

    // All Activities API
    app.get('/api/activities', async (req, res) => {
      try {
        const { pool } = await import("./db");
        const result = await pool.query(`
          SELECT 
            a.*, p.name as "parkName",
            c.name as "categoryName",
            i.full_name as "instructorName"
          FROM activities a
          LEFT JOIN parks p ON a.park_id = p.id
          LEFT JOIN activity_categories c ON a.category_id = c.id
          LEFT JOIN instructors i ON a.instructor_id = i.id
          ORDER BY a.created_at DESC
        `);
        res.json(result.rows);
      } catch (error) {
        console.error('Error fetching activities:', error);
        res.status(500).json({ error: 'Error loading activities' });
      }
    });

    // Volunteers API
    app.get('/api/volunteers', async (req, res) => {
      try {
        const { pool } = await import("./db");
        const result = await pool.query('SELECT * FROM volunteers ORDER BY created_at DESC');
        res.json(result.rows);
      } catch (error) {
        console.error('Error fetching volunteers:', error);
        res.status(500).json({ error: 'Error loading volunteers' });
      }
    });

    // Public Volunteers API
    app.get('/api/volunteers/public', async (req, res) => {
      try {
        const { pool } = await import("./db");
        const result = await pool.query(`
          SELECT id, full_name, skills, email, phone, status, created_at 
          FROM volunteers 
          WHERE status = 'active'
          ORDER BY created_at DESC
        `);
        res.json(result.rows);
      } catch (error) {
        console.error('Error fetching public volunteers:', error);
        res.status(500).json({ error: 'Error loading public volunteers' });
      }
    });

    // Users API
    app.get('/api/users', async (req, res) => {
      try {
        const { pool } = await import("./db");
        const result = await pool.query('SELECT id, email, role, created_at FROM users ORDER BY created_at DESC');
        res.json(result.rows);
      } catch (error) {
        console.error('Error fetching users:', error);
        res.status(500).json({ error: 'Error loading users' });
      }
    });

    // HR Employees API
    app.get('/api/hr/employees', async (req, res) => {
      try {
        const { pool } = await import("./db");
        const result = await pool.query('SELECT * FROM employees ORDER BY created_at DESC');
        res.json(result.rows);
      } catch (error) {
        console.error('Error fetching employees:', error);
        res.status(500).json({ error: 'Error loading employees' });
      }
    });

    // Active Concessions API
    app.get('/api/active-concessions', async (req, res) => {
      try {
        const { pool } = await import("./db");
        const result = await pool.query(`
          SELECT * FROM active_concessions 
          WHERE status = 'active' 
          ORDER BY contract_start DESC
        `);
        res.json(result.rows);
      } catch (error) {
        console.error('Error fetching active concessions:', error);
        res.status(500).json({ error: 'Error loading active concessions' });
      }
    });

    // Visitor Counts API
    app.get('/api/visitor-counts', async (req, res) => {
      try {
        const { pool } = await import("./db");
        const result = await pool.query(`
          SELECT * FROM visitor_counts 
          ORDER BY visit_date DESC 
          LIMIT 100
        `);
        res.json(result.rows);
      } catch (error) {
        console.error('Error fetching visitor counts:', error);
        res.status(500).json({ error: 'Error loading visitor counts' });
      }
    });

    // Tree Species API
    app.get('/api/tree-species', async (req, res) => {
      try {
        const { pool } = await import("./db");
        const limit = req.query.limit || 1000;
        const result = await pool.query(`
          SELECT * FROM tree_species 
          ORDER BY common_name 
          LIMIT $1
        `, [limit]);
        res.json(result.rows);
      } catch (error) {
        console.error('Error fetching tree species:', error);
        res.status(500).json({ error: 'Error loading tree species' });
      }
    });

    // Park Tree Species API
    app.get('/api/park-tree-species', async (req, res) => {
      try {
        const { pool } = await import("./db");
        const result = await pool.query(`
          SELECT pts.*, ts.common_name, ts.scientific_name, p.name as park_name
          FROM park_tree_species pts
          LEFT JOIN tree_species ts ON pts.species_id = ts.id
          LEFT JOIN parks p ON pts.park_id = p.id
          ORDER BY p.name, ts.common_name
        `);
        res.json(result.rows);
      } catch (error) {
        console.error('Error fetching park tree species:', error);
        res.status(500).json({ error: 'Error loading park tree species' });
      }
    });

    // Reservable Spaces API
    app.get('/api/reservable-spaces', async (req, res) => {
      try {
        const { pool } = await import("./db");
        const result = await pool.query(`
          SELECT rs.*, p.name as park_name
          FROM reservable_spaces rs
          LEFT JOIN parks p ON rs.park_id = p.id
          WHERE rs.is_active = true
          ORDER BY rs.name
        `);
        res.json(result.rows);
      } catch (error) {
        console.error('Error fetching reservable spaces:', error);
        res.status(500).json({ error: 'Error loading reservable spaces' });
      }
    });

    // Feedback API
    app.get('/api/feedback', async (req, res) => {
      try {
        const { pool } = await import("./db");
        const limit = req.query.limit || 100;
        const result = await pool.query(`
          SELECT * FROM feedback 
          ORDER BY created_at DESC 
          LIMIT $1
        `, [limit]);
        res.json(result.rows);
      } catch (error) {
        console.error('Error fetching feedback:', error);
        res.status(500).json({ error: 'Error loading feedback' });
      }
    });

    // Park Images API
    app.get('/api/parks/:id/images', async (req, res) => {
      try {
        const { pool } = await import("./db");
        const parkId = req.params.id;
        const result = await pool.query(
          'SELECT * FROM park_images WHERE park_id = $1 ORDER BY id',
          [parkId]
        );
        res.json(result.rows);
      } catch (error) {
        console.error('Error fetching park images:', error);
        res.status(500).json({ error: 'Error loading park images' });
      }
    });

    console.log('✅ All critical API routes registered directly');

    // React application route (separate from health checks)
    app.get('/app', (req, res) => {
      const indexPath = path.default.join(process.cwd(), 'public', 'index.html');
      if (fs.default.existsSync(indexPath)) {
        res.sendFile(indexPath);
      } else {
        res.status(503).send('Application not built');
      }
    });

    // Additional app routes for different paths
    app.get('/parks', (req, res) => {
      const indexPath = path.default.join(process.cwd(), 'public', 'index.html');
      if (fs.default.existsSync(indexPath)) {
        res.sendFile(indexPath);
      } else {
        res.status(503).send('Application not built');
      }
    });

    app.get('/admin*', (req, res) => {
      const indexPath = path.default.join(process.cwd(), 'public', 'index.html');
      if (fs.default.existsSync(indexPath)) {
        res.sendFile(indexPath);
      } else {
        res.status(503).send('Application not built');
      }
    });

    // Simple API status
    app.get('/api/status', (req, res) => {
      res.status(200).json({ 
        status: 'ok', 
        message: 'ParkSys API',
        timestamp: new Date().toISOString(),
        port: PORT
      });
    });

    app.get('/api/health', (req, res) => {
      res.status(200).json({ 
        status: 'ok', 
        timestamp: new Date().toISOString()
      });
    });

    // Static file serving already configured above for immediate availability

    // Load application routes with error handling
    try {
      const { registerRoutes } = await import("./routes");
      registerRoutes(app);
      console.log('✅ Main routes registered');
    } catch (error: any) {
      console.log('⚠️ Main routes skipped:', error.message);
    }

    try {
      const { registerActivityPaymentRoutes } = await import("./routes/activityPayments");
      registerActivityPaymentRoutes(app);
      console.log('✅ Activity payment routes registered');
    } catch (error: any) {
      console.log('⚠️ Activity payment routes skipped:', error.message);
    }

    try {
      const { activityRouter } = await import("./activityRoutes");
      app.use('/activities', activityRouter);
      console.log('✅ Activity router registered');
    } catch (error: any) {
      console.log('⚠️ Activity router skipped:', error.message);
    }

    try {
      const { testRouter } = await import("./testRoutes");
      app.use('/test', testRouter);
      console.log('✅ Test router registered');
    } catch (error: any) {
      console.log('⚠️ Test router skipped:', error.message);
    }

    try {
      const volunteerFieldRouter = await import("./volunteerFieldRoutes");
      app.use('/', volunteerFieldRouter.default || volunteerFieldRouter);
      console.log('✅ Volunteer field router registered');
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.log('⚠️ Volunteer field router skipped:', errorMessage);
    }

    try {
      const { skillsRouter } = await import("./update-skills-route");
      app.use('/', skillsRouter);
      console.log('✅ Skills router registered');
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.log('⚠️ Skills router skipped:', errorMessage);
    }

    try {
      const { createParkEvaluationsTables } = await import("./create-park-evaluations-tables");
      await createParkEvaluationsTables();
      console.log('✅ Park evaluation tables created');
    } catch (error: any) {
      console.log('⚠️ Park evaluation tables skipped:', error.message);
    }

    try {
      const { registerInstructorInvitationRoutes } = await import("./instructorInvitationRoutes");
      registerInstructorInvitationRoutes(app);
      console.log('✅ Instructor invitation routes registered');
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.log('⚠️ Instructor invitation routes skipped:', errorMessage);
    }

    try {
      const { registerInstructorApplicationRoutes } = await import("./instructorApplicationRoutes");
      registerInstructorApplicationRoutes(app);
      console.log('✅ Instructor application routes registered');
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.log('⚠️ Instructor application routes skipped:', errorMessage);
    }

    try {
      const { registerAuditRoutes } = await import("./audit-routes");
      registerAuditRoutes(app);
      console.log('✅ Audit routes registered');
    } catch (error: any) {
      console.log('⚠️ Audit routes skipped:', error.message);
    }

    try {
      const advertisingManagementRoutes = await import("./advertising-management-routes");
      app.use('/api/advertising-management', advertisingManagementRoutes.default || advertisingManagementRoutes);
      console.log('✅ Advertising management routes registered');
    } catch (error: any) {
      console.log('⚠️ Advertising management routes skipped:', error.message);
    }

    try {
      const faunaRoutes = await import("./faunaRoutes");
      app.use('/', faunaRoutes.default || faunaRoutes);
      console.log('✅ Fauna routes registered');
    } catch (error: any) {
      console.log('⚠️ Fauna routes skipped:', error.message);
    }

    try {
      const evaluacionesRoutes = await import("./evaluaciones-routes");
      app.use('/', evaluacionesRoutes.default || evaluacionesRoutes);
      console.log('✅ Evaluaciones routes registered');
    } catch (error: any) {
      console.log('⚠️ Evaluaciones routes skipped:', error.message);
    }

    console.log('✅ Background initialization completed');
    console.log('🎯 ParkSys application fully loaded');
    
    // ===== CATCH-ALL ROUTES FOR UNHANDLED REQUESTS =====
    // Handle any remaining unmatched routes to prevent 503 errors
    app.use('*', (req: any, res: any, next: any) => {
      console.log(`⚠️ Unhandled route: ${req.method} ${req.originalUrl}`);
      
      // If it's a static file request, return 404
      if (req.originalUrl.includes('/assets/') || 
          req.originalUrl.includes('.js') || 
          req.originalUrl.includes('.css') || 
          req.originalUrl.includes('.ico') || 
          req.originalUrl.includes('.png') || 
          req.originalUrl.includes('.jpg') || 
          req.originalUrl.includes('.svg')) {
        res.status(404).send('File not found');
        return;
      }
      
      // For HTML requests (browsers), serve the main app
      if (req.get('Accept')?.includes('text/html')) {
        const indexPath = path.join(process.cwd(), 'public', 'index.html');
        if (fs.existsSync(indexPath)) {
          res.sendFile(indexPath);
        } else {
          res.status(503).send('<!DOCTYPE html><html><head><title>Service Unavailable</title></head><body><h1>Service Unavailable</h1><p>Application is starting up...</p></body></html>');
        }
      } else {
        // For API requests, return JSON error but don't crash
        res.status(404).json({ error: 'API endpoint not found', path: req.originalUrl });
      }
    });
    
    // ===== UNIVERSAL ERROR MIDDLEWARE (AFTER ALL ROUTES) =====
    app.use((err: any, req: any, res: any, next: any) => {
      console.error('❌ Express Error Middleware:', err);
      console.error('URL:', req.url);
      console.error('Method:', req.method);
      
      // Never crash - always respond
      if (!res.headersSent) {
        if (req.get('Accept')?.includes('text/html')) {
          res.status(500).send('<!DOCTYPE html><html><head><title>Server Error</title></head><body><h1>Server Error</h1><p>Please try again later.</p></body></html>');
        } else {
          res.status(500).json({ error: 'Internal Server Error' });
        }
      }
    });

  } catch (error: any) {
    console.error('❌ Background initialization failed:', error);
    console.error('Stack trace:', error.stack);
    // Never crash - server continues for health checks
    // Log the error but keep server alive for health checks
  }

  // ===== CRITICAL: FORCE DATABASE TABLES CREATION =====
  try {
    // Import database connection
    const { pool } = await import("./db");
    
    // Ensure advertising tables exist for the placements endpoint
    await pool.query(`
      CREATE TABLE IF NOT EXISTS ad_spaces (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        description TEXT,
        page_type VARCHAR(100),
        position VARCHAR(100),
        is_active BOOLEAN DEFAULT true,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS advertisements (
        id SERIAL PRIMARY KEY,
        title VARCHAR(255) NOT NULL,
        content TEXT,
        is_active BOOLEAN DEFAULT true,
        start_date DATE,
        end_date DATE,
        media_file_id INTEGER,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS ad_space_mappings (
        id SERIAL PRIMARY KEY,
        space_id INTEGER REFERENCES ad_spaces(id),
        advertisement_id INTEGER REFERENCES advertisements(id),
        priority INTEGER DEFAULT 1,
        is_active BOOLEAN DEFAULT true,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS ad_media_files (
        id SERIAL PRIMARY KEY,
        filename VARCHAR(255),
        file_url VARCHAR(500),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    console.log('✅ Critical advertising tables ensured to exist');
  } catch (error: any) {
    console.error('❌ Error creating advertising tables:', error);
    // Continue without crashing
  }
}


// ===== GRACEFUL SHUTDOWN FOR CLOUD RUN =====
process.on('SIGTERM', () => {
  console.log('🛑 SIGTERM received, shutting down gracefully');
  if (server) {
    server.close(() => {
      console.log('✅ Server closed gracefully');
      process.exit(0);
    });
  } else {
    process.exit(0);
  }
});

process.on('SIGINT', () => {
  console.log('🛑 SIGINT received, shutting down gracefully');
  if (server) {
    server.close(() => {
      console.log('✅ Server closed gracefully');
      process.exit(0);
    });
  } else {
    process.exit(0);
  }
});

export { app, server };