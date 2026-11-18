/**
 * PRD: Registration Password & Transaction Password Validation
 * Shared validation logic for both Frontend and Backend.
 */

export interface PasswordComplexityResult {
  isValid: boolean;
  hasMinLength: boolean;
  hasUppercase: boolean;
  hasLowercase: boolean;
  hasNumber: boolean;
  hasSpecialChar: boolean;
  errors: string[];
}

export interface RegistrationPasswordFields {
  password: string;
  confirmPassword: string;
  transactionPin: string;
  repeatTransactionPin: string;
}

export interface PasswordValidationResult {
  isValid: boolean;
  errors: {
    password?: string;
    confirmPassword?: string;
    transactionPin?: string;
    repeatTransactionPin?: string;
    separation?: string;
  };
}

export const EXACT_PRD_SEPARATION_ERROR =
  'Your Transaction Password and Repeat Transaction Password must be different from your Login Password and Confirm Password. Please choose a separate Transaction Password.';

/**
 * Validates that a password satisfies the 5 complexity rules:
 * - At least 8 characters
 * - At least one uppercase letter
 * - At least one lowercase letter
 * - At least one number
 * - At least one special character
 */
export function validatePasswordComplexity(password: string): PasswordComplexityResult {
  const hasMinLength = password.length >= 8;
  const hasUppercase = /[A-Z]/.test(password);
  const hasLowercase = /[a-z]/.test(password);
  const hasNumber = /[0-9]/.test(password);
  const hasSpecialChar = /[^A-Za-z0-9]/.test(password);

  const errors: string[] = [];
  if (!hasMinLength) errors.push('Must be at least 8 characters long');
  if (!hasUppercase) errors.push('Must contain at least one uppercase letter (A-Z)');
  if (!hasLowercase) errors.push('Must contain at least one lowercase letter (a-z)');
  if (!hasNumber) errors.push('Must contain at least one number (0-9)');
  if (!hasSpecialChar) errors.push('Must contain at least one special character (!@#$%^&*...)');

  const isValid = hasMinLength && hasUppercase && hasLowercase && hasNumber && hasSpecialChar;

  return {
    isValid,
    hasMinLength,
    hasUppercase,
    hasLowercase,
    hasNumber,
    hasSpecialChar,
    errors,
  };
}

/**
 * Full validation of the four registration password fields:
 * - Password satisfies complexity
 * - Confirm Password matches Password
 * - Transaction Password satisfies complexity
 * - Repeat Transaction Password matches Transaction Password
 * - Transaction Password is NOT identical to Login Password
 * - Repeat Transaction Password is NOT identical to Confirm Password
 */
export function validateRegistrationPasswords(
  fields: RegistrationPasswordFields
): PasswordValidationResult {
  const { password, confirmPassword, transactionPin, repeatTransactionPin } = fields;
  const errors: PasswordValidationResult['errors'] = {};

  // 1. Password Complexity
  const passwordComp = validatePasswordComplexity(password);
  if (!passwordComp.isValid) {
    errors.password = passwordComp.errors[0];
  }

  // 2. Confirm Password Match
  if (confirmPassword && password !== confirmPassword) {
    errors.confirmPassword = 'Confirm Password does not match Password';
  } else if (!confirmPassword && password) {
    errors.confirmPassword = 'Please confirm your login password';
  }

  // 3. Transaction Password Complexity
  const transComp = validatePasswordComplexity(transactionPin);
  if (!transComp.isValid) {
    errors.transactionPin = transComp.errors[0];
  }

  // 4. Repeat Transaction Password Match
  if (repeatTransactionPin && transactionPin !== repeatTransactionPin) {
    errors.repeatTransactionPin = 'Repeat Transaction Password does not match Transaction Password';
  } else if (!repeatTransactionPin && transactionPin) {
    errors.repeatTransactionPin = 'Please repeat your transaction password';
  }

  // 5. Critical Separation Requirement:
  // Transaction Password must NOT be identical to Login Password
  // Repeat Transaction Password must NOT be identical to Confirm Password
  const isSeparationViolated =
    (password && transactionPin && password === transactionPin) ||
    (confirmPassword && repeatTransactionPin && confirmPassword === repeatTransactionPin) ||
    (password && repeatTransactionPin && password === repeatTransactionPin) ||
    (confirmPassword && transactionPin && confirmPassword === transactionPin);

  if (isSeparationViolated) {
    errors.separation = EXACT_PRD_SEPARATION_ERROR;
    if (!errors.transactionPin) {
      errors.transactionPin = 'Must be different from login password';
    }
  }

  const isValid = Object.keys(errors).length === 0;

  return {
    isValid,
    errors,
  };
}

/**
 * Secure password hashing using Web Crypto API (SHA-256 with salt)
 * Avoids plain text credential storage.
 */
export async function hashPasswordWithSalt(password: string, salt: string): Promise<string> {
  const enc = new TextEncoder();
  const data = enc.encode(`${salt}:${password}`);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
}

/**
 * Verify a plain password against a stored hash with a known salt.
 */
export async function verifyPasswordWithSalt(
  password: string,
  storedHash: string,
  salt: string
): Promise<boolean> {
  if (!password || !storedHash || !salt) return false;
  const computedHash = await hashPasswordWithSalt(password, salt);
  return computedHash === storedHash;
}

/**
 * Verify a plain password against a combined hash format `salt$hash` or `salt:hash`.
 */
export async function verifyCombinedPasswordHash(
  password: string,
  combinedHash: string
): Promise<boolean> {
  if (!password || !combinedHash) return false;
  
  if (combinedHash.includes('$')) {
    const [salt, expectedHash] = combinedHash.split('$');
    if (!salt || !expectedHash) return false;
    return verifyPasswordWithSalt(password, expectedHash, salt);
  }
  
  if (combinedHash.includes(':')) {
    const [salt, expectedHash] = combinedHash.split(':');
    if (!salt || !expectedHash) return false;
    return verifyPasswordWithSalt(password, expectedHash, salt);
  }

  return false;
}

