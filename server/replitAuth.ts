import * as client from "openid-client";
import { Strategy, type VerifyFunction } from "openid-client/passport";

import passport from "passport";
import session from "express-session";
import type { Express, RequestHandler } from "express";
import memoize from "memoizee";
import connectPg from "connect-pg-simple";
import { storage } from "./storage";
import { pool } from "./db";

if (!process.env.REPLIT_DOMAINS) {
  throw new Error("Environment variable REPLIT_DOMAINS not provided");
}

// Memoize la configuración OpenID para evitar llamadas repetidas
const getOidcConfig = memoize(
  async () => {
    return await client.discovery(
      new URL(process.env.ISSUER_URL ?? "https://replit.com/oidc"),
      process.env.REPL_ID!
    );
  },
  { maxAge: 3600 * 1000 } // Cache de 1 hora
);

// Configuración de la sesión
export function getSession() {
  const sessionTtl = 7 * 24 * 60 * 60 * 1000; // 1 semana
  const pgStore = connectPg(session);
  const sessionStore = new pgStore({
    pool: pool,
    createTableIfMissing: true,
    tableName: "sessions",
    ttl: sessionTtl,
  });
  
  return session({
    secret: process.env.SESSION_SECRET || "parquesmx-development-secret",
    store: sessionStore,
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      maxAge: sessionTtl,
    },
  });
}

// Actualiza la sesión del usuario con la información de tokens
function updateUserSession(
  user: any,
  tokens: client.TokenEndpointResponse & client.TokenEndpointResponseHelpers
) {
  user.claims = tokens.claims();
  user.access_token = tokens.access_token;
  user.refresh_token = tokens.refresh_token;
  user.expires_at = user.claims?.exp;
}

// Actualiza o crea un usuario en la base de datos basado en los claims de OpenID
async function upsertUser(
  claims: any,
) {
  // Intentamos buscar al usuario por email si está disponible
  let existingUser = null;
  if (claims["email"]) {
    const [userByEmail] = await db.select().from(users).where(eq(users.email, claims["email"]));
    existingUser = userByEmail;
  }
  
  // Creamos un nombre completo combinando first_name y last_name
  const fullName = claims["first_name"] && claims["last_name"] 
    ? `${claims["first_name"]} ${claims["last_name"]}` 
    : claims["first_name"] || claims["last_name"] || "Usuario";
  
  if (existingUser) {
    // Actualizar información si ya existe
    return await storage.updateUser(existingUser.id, {
      email: claims["email"],
      fullName: fullName
    });
  } else {
    // Crear nuevo usuario si no existe
    return await storage.createUser({
      username: claims["email"] ? claims["email"].split('@')[0] : `user-${Date.now()}`,
      email: claims["email"],
      password: "", // No password for OAuth users
      fullName: fullName,
      role: "user", // Default role
    });
  }
}

// Configura la autenticación en la aplicación
export async function setupAuth(app: Express) {
  app.set("trust proxy", 1);
  app.use(getSession());
  app.use(passport.initialize());
  app.use(passport.session());

  const config = await getOidcConfig();

  // Función que se ejecuta cuando el usuario se autentica
  const verify: VerifyFunction = async (
    tokens: client.TokenEndpointResponse & client.TokenEndpointResponseHelpers,
    verified: passport.AuthenticateCallback
  ) => {
    const user = {};
    updateUserSession(user, tokens);
    await upsertUser(tokens.claims());
    verified(null, user);
  };

  // Configura la estrategia de autenticación para cada dominio de Replit
  for (const domain of process.env.REPLIT_DOMAINS!.split(",")) {
    const strategy = new Strategy(
      {
        name: `replitauth:${domain}`,
        config,
        scope: "openid email profile offline_access",
        callbackURL: `https://${domain}/api/callback`,
      },
      verify,
    );
    passport.use(strategy);
  }

  // Serialización y deserialización de usuarios
  passport.serializeUser((user: Express.User, cb) => cb(null, user));
  passport.deserializeUser((user: Express.User, cb) => cb(null, user));

  // Ruta para iniciar sesión
  app.get("/api/login", (req, res, next) => {
    passport.authenticate(`replitauth:${req.hostname}`, {
      prompt: "login consent",
      scope: ["openid", "email", "profile", "offline_access"],
    })(req, res, next);
  });

  // Ruta de callback para el proceso de autenticación
  app.get("/api/callback", (req, res, next) => {
    passport.authenticate(`replitauth:${req.hostname}`, {
      successReturnToOrRedirect: "/",
      failureRedirect: "/api/login",
    })(req, res, next);
  });

  // Ruta para cerrar sesión
  app.get("/api/logout", (req, res) => {
    req.logout(() => {
      // Determinar si viene de la página de administración
      const referer = req.get('Referer') || '';
      const isAdmin = referer.includes('/admin');
      
      // Si viene de la administración, redirigir a la página principal
      const redirectTo = isAdmin ? '/' : `${req.protocol}://${req.hostname}`;
      
      res.redirect(
        client.buildEndSessionUrl(config, {
          client_id: process.env.REPL_ID!,
          post_logout_redirect_uri: redirectTo,
        }).href
      );
    });
  });
}

// Middleware para verificar si el usuario está autenticado
export const isAuthenticated: RequestHandler = async (req, res, next) => {
  const user = req.user as any;

  if (!req.isAuthenticated() || !user.expires_at) {
    return res.status(401).json({ message: "No autorizado" });
  }

  const now = Math.floor(Date.now() / 1000);
  
  // Si el token no ha expirado, continuar
  if (now <= user.expires_at) {
    return next();
  }

  // Si el token ha expirado pero tiene refresh token, renovarlo
  const refreshToken = user.refresh_token;
  if (!refreshToken) {
    return res.redirect("/api/login");
  }

  try {
    const config = await getOidcConfig();
    const tokenResponse = await client.refreshTokenGrant(config, refreshToken);
    updateUserSession(user, tokenResponse);
    return next();
  } catch (error) {
    return res.redirect("/api/login");
  }
};