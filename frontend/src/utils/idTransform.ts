/**
 * Utility functions to transform between short and full ID formats
 * 
 * Short Format (User Input):
 * - Clinic: c-001
 * - Clinician: u-001
 * - Patient: c-001-p-01
 * 
 * Full Format (Database):
 * - Clinic: clinic-001
 * - Clinician: user-001
 * - Patient: clinic-001-patient-01
 */

/**
 * Convert short clinic ID to full format
 * c-001 -> clinic-001
 */
export function expandClinicId(shortId: string): string {
  if (!shortId) return '';
  
  // If already in full format, return as is
  if (shortId.startsWith('clinic-')) {
    return shortId;
  }
  
  // Convert c-001 to clinic-001
  if (shortId.match(/^c-\d+$/i)) {
    return shortId.replace(/^c-/i, 'clinic-');
  }
  
  return shortId;
}

/**
 * Convert short clinician ID to full format
 * u-001 -> user-001
 */
export function expandClinicianId(shortId: string): string {
  if (!shortId) return '';
  
  // If already in full format, return as is
  if (shortId.startsWith('user-')) {
    return shortId;
  }
  
  // Convert u-001 to user-001
  if (shortId.match(/^u-\d+$/i)) {
    return shortId.replace(/^u-/i, 'user-');
  }
  
  return shortId;
}

/**
 * Convert short patient ID to full format
 * c-001-p-01 -> clinic-001-patient-01
 */
export function expandPatientId(shortId: string): string {
  if (!shortId) return '';
  
  // If already in full format, return as is
  if (shortId.startsWith('clinic-') && shortId.includes('-patient-')) {
    return shortId;
  }
  
  // Convert c-001-p-01 to clinic-001-patient-01
  if (shortId.match(/^c-\d+-p-\d+$/i)) {
    return shortId
      .replace(/^c-/i, 'clinic-')
      .replace(/-p-/i, '-patient-');
  }
  
  return shortId;
}

/**
 * Convert full clinic ID to short format
 * clinic-001 -> c-001
 */
export function shortenClinicId(fullId: string): string {
  if (!fullId) return '';
  
  // If already in short format, return as is
  if (fullId.match(/^c-\d+$/i)) {
    return fullId;
  }
  
  // Convert clinic-001 to c-001
  if (fullId.startsWith('clinic-')) {
    return fullId.replace(/^clinic-/i, 'c-');
  }
  
  return fullId;
}

/**
 * Convert full clinician ID to short format
 * user-001 -> u-001
 */
export function shortenClinicianId(fullId: string): string {
  if (!fullId) return '';
  
  // If already in short format, return as is
  if (fullId.match(/^u-\d+$/i)) {
    return fullId;
  }
  
  // Convert user-001 to u-001
  if (fullId.startsWith('user-')) {
    return fullId.replace(/^user-/i, 'u-');
  }
  
  return fullId;
}

/**
 * Convert full patient ID to short format
 * clinic-001-patient-01 -> c-001-p-01
 */
export function shortenPatientId(fullId: string): string {
  if (!fullId) return '';
  
  // If already in short format, return as is
  if (fullId.match(/^c-\d+-p-\d+$/i)) {
    return fullId;
  }
  
  // Convert clinic-001-patient-01 to c-001-p-01
  if (fullId.startsWith('clinic-') && fullId.includes('-patient-')) {
    return fullId
      .replace(/^clinic-/i, 'c-')
      .replace(/-patient-/i, '-p-');
  }
  
  return fullId;
}
