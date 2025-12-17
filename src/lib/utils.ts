import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Development-only logger - logs only in development mode
 * Prevents sensitive data from being exposed in production
 */
export const devLog = {
  log: (...args: any[]) => {
    if (import.meta.env.DEV) {
      console.log(...args);
    }
  },
  error: (...args: any[]) => {
    // Always log errors, but sanitize sensitive data
    if (import.meta.env.DEV) {
      console.error(...args);
    } else {
      // In production, log errors without sensitive data
      const sanitized = args.map(arg => {
        if (typeof arg === 'object' && arg !== null) {
          const sanitized: any = {};
          for (const [key, value] of Object.entries(arg)) {
            // Don't log sensitive fields
            if (!['password', 'token', 'email', 'name', 'user', 'userId'].includes(key.toLowerCase())) {
              sanitized[key] = value;
            } else {
              sanitized[key] = '[REDACTED]';
            }
          }
          return sanitized;
        }
        return arg;
      });
      console.error(...sanitized);
    }
  },
  warn: (...args: any[]) => {
    if (import.meta.env.DEV) {
      console.warn(...args);
    }
  }
};

/**
 * Formats a date/time string to India Standard Time (IST)
 * @param dateString - ISO date string or date object
 * @returns Formatted time string in IST (e.g., "11:45:30 AM")
 */
export function formatTimeIST(dateString: string | Date | null | undefined): string {
  if (!dateString) return 'N/A';
  
  try {
    const date = typeof dateString === 'string' ? new Date(dateString) : dateString;
    
    // Check if date is valid
    if (isNaN(date.getTime())) return 'N/A';
    
    // Format time in IST (Asia/Kolkata) timezone
    return date.toLocaleTimeString('en-IN', {
      timeZone: 'Asia/Kolkata',
      hour: 'numeric',
      minute: '2-digit',
      second: '2-digit',
      hour12: true
    });
  } catch (error) {
    // Error logging is safe - no sensitive data
    if (import.meta.env.DEV) {
      console.error('Error formatting time to IST:', error);
    }
    return 'N/A';
  }
}

/**
 * Calculates estimated pickup time by adding minutes to a base date, then formats it in IST
 * @param baseDateString - ISO date string or date object to add time to
 * @param minutesToAdd - Number of minutes to add
 * @returns Formatted time string in IST
 */
export function calculatePickupTimeIST(baseDateString: string | Date | null | undefined, minutesToAdd: number): string {
  if (!baseDateString) return 'N/A';
  
  try {
    const baseDate = typeof baseDateString === 'string' ? new Date(baseDateString) : baseDateString;
    
    // Check if date is valid
    if (isNaN(baseDate.getTime())) return 'N/A';
    
    // Add minutes to the base date
    const pickupDate = new Date(baseDate.getTime() + minutesToAdd * 60000);
    
    // Format in IST
    return formatTimeIST(pickupDate);
  } catch (error) {
    // Error logging is safe - no sensitive data
    if (import.meta.env.DEV) {
      console.error('Error calculating pickup time:', error);
    }
    return 'N/A';
  }
}
