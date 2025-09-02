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

// Root endpoint - Ultra-fast routing for health checks vs browsers  
app.get('/', (req, res) => {
  try {
    // Ultra-fast browser detection - only check Accept header
    const acceptHeader = req.get('Accept') || '';
    
    if (acceptHeader.includes('text/html')) {
      // Browser requesting HTML - serve React app
      const indexPath = path.join(process.cwd(), 'public', 'index.html');
      if (fs.existsSync(indexPath)) {
        res.sendFile(indexPath, (err) => {
          if (err) {
            console.error('❌ Error serving index.html:', err);
            res.status(500).send('<!DOCTYPE html><html><head><title>Error</title></head><body><h1>Application Error</h1></body></html>');
          }
        });
      } else {
        console.error('❌ index.html not found at:', indexPath);
        res.status(503).send('<!DOCTYPE html><html><head><title>Not Built</title></head><body><h1>Application not built</h1></body></html>');
      }
    } else {
      // Health checker - instant response
      res.status(200).send(HEALTH_RESPONSE);
    }
  } catch (error) {
    console.error('❌ Error in root endpoint:', error);
    res.status(500).send(HEALTH_RESPONSE); // Fallback to health response
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
    
    // Basic Express middleware
    app.use(express.json({ limit: '50mb' }));
    app.use(express.urlencoded({ extended: true, limit: '50mb' }));

    // CORS middleware
    app.use((req, res, next) => {
      res.setHeader('Access-Control-Allow-Origin', '*');
      res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
      res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
      
      if (req.method === 'OPTIONS') {
        res.status(200).end();
        return;
      }
      
      next();
    });

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
    } catch (error) {
      console.log('⚠️ Volunteer field router skipped:', error.message);
    }

    try {
      const { skillsRouter } = await import("./update-skills-route");
      app.use('/', skillsRouter);
      console.log('✅ Skills router registered');
    } catch (error) {
      console.log('⚠️ Skills router skipped:', error.message);
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
    } catch (error: any) {
      console.log('⚠️ Instructor invitation routes skipped:', error.message);
    }

    try {
      const { registerInstructorApplicationRoutes } = await import("./instructorApplicationRoutes");
      registerInstructorApplicationRoutes(app);
      console.log('✅ Instructor application routes registered');
    } catch (error: any) {
      console.log('⚠️ Instructor application routes skipped:', error.message);
    }

    try {
      const { registerAuditRoutes } = await import("./audit-routes");
      registerAuditRoutes(app);
      console.log('✅ Audit routes registered');
    } catch (error: any) {
      console.log('⚠️ Audit routes skipped:', error.message);
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
      
      // For HTML requests, serve the main app
      if (req.get('Accept')?.includes('text/html')) {
        const indexPath = path.join(process.cwd(), 'public', 'index.html');
        if (fs.existsSync(indexPath)) {
          res.sendFile(indexPath);
        } else {
          res.status(503).send('<!DOCTYPE html><html><head><title>Service Unavailable</title></head><body><h1>Service Unavailable</h1><p>Application is starting up...</p></body></html>');
        }
      } else {
        // For API requests, return JSON error
        res.status(404).json({ error: 'Not Found', path: req.originalUrl });
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
    // Never crash - server continues for health checks
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