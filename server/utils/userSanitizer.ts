/**
 * Utility functions to sanitize user objects and remove sensitive fields
 * before sending to frontend to prevent security vulnerabilities
 */

// Fields that should NEVER be sent to the frontend
const SENSITIVE_FIELDS = [
  'password',
  'hashedPassword', 
  'salt',
  'resetToken',
  'emailVerificationToken',
  'twoFactorSecret'
] as const;

export interface SanitizedUser {
  id: number;
  username: string;
  email: string;
  fullName: string;
  role?: string;
  roleId?: number;
  municipalityId?: number | null;
  phone?: string | null;
  gender?: string | null;
  birthDate?: string | Date | null;
  bio?: string | null;
  profileImageUrl?: string | null;
  firebaseUid?: string | null;
  isActive?: boolean;
  needsPasswordReset?: boolean;
  notificationPreferences?: any;
  lastLogin?: Date | null;
  department?: string | null;
  position?: string | null;
  createdAt?: Date;
  updatedAt?: Date;
  roles?: Array<{ roleId: number }>;
  // Volunteer specific fields
  preferredParkId?: number | null;
  legalConsent?: boolean;
  volunteerExperience?: string | null;
  availability?: string | null;
  address?: string | null;
  emergencyContactName?: string | null;
  emergencyContactPhone?: string | null;
  // Any other safe fields...
  [key: string]: any;
}

/**
 * Sanitizes a single user object by removing sensitive fields
 * @param user - Raw user object from database
 * @returns Sanitized user object safe for frontend
 */
export function sanitizeUser(user: any): SanitizedUser | null {
  if (!user) return null;

  // Create a copy of the user object
  const sanitized = { ...user };

  // Remove all sensitive fields
  SENSITIVE_FIELDS.forEach(field => {
    delete sanitized[field];
  });

  return sanitized;
}

/**
 * Sanitizes an array of user objects
 * @param users - Array of raw user objects from database
 * @returns Array of sanitized user objects safe for frontend
 */
export function sanitizeUsers(users: any[]): SanitizedUser[] {
  if (!Array.isArray(users)) return [];
  
  return users
    .map(user => sanitizeUser(user))
    .filter(user => user !== null) as SanitizedUser[];
}

/**
 * Creates a sanitized user response with additional metadata
 * @param user - Raw user object from database
 * @param additionalData - Additional safe data to include
 * @returns Sanitized user response
 */
export function createUserResponse(user: any, additionalData: any = {}): any {
  const sanitizedUser = sanitizeUser(user);
  
  if (!sanitizedUser) return null;

  return {
    ...sanitizedUser,
    ...additionalData
  };
}

/**
 * Validation function to ensure no sensitive data is being sent
 * @param data - Data to validate
 * @returns true if safe, throws error if sensitive data found
 */
export function validateSafeResponse(data: any): boolean {
  const dataString = JSON.stringify(data);
  
  // Check for password hashes (bcrypt pattern)
  if (dataString.includes('"password":"$2b$') || dataString.includes('"password":"$2a$')) {
    throw new Error('SECURITY VIOLATION: Password hash detected in response data');
  }
  
  // Check for other sensitive field patterns
  SENSITIVE_FIELDS.forEach(field => {
    if (dataString.includes(`"${field}":`) && !dataString.includes(`"${field}":null`)) {
      console.warn(`⚠️ WARNING: Sensitive field '${field}' detected in response`);
    }
  });
  
  return true;
}

// Log function for debugging (should be removed in production)
export function debugLogUserFields(user: any, context: string = 'Unknown'): void {
  if (!user) return;
  
  const fields = Object.keys(user);
  const sensitiveFound = fields.filter(field => 
    SENSITIVE_FIELDS.includes(field as any) && user[field] !== null
  );
  
  if (sensitiveFound.length > 0) {
    console.error(`🚨 SECURITY ALERT [${context}]: Sensitive fields found:`, sensitiveFound);
  } else {
    console.log(`✅ SECURITY CHECK [${context}]: No sensitive fields detected`);
  }
}