/**
 * Event Request Creation V2.0 Service Layer
 * 
 * Provides v2.0 API functions for creating event requests with the broadcast model.
 * Removes coordinator selection - all matching reviewers automatically get visibility.
 * 
 * @version 2.0
 * @author UNITE Development Team
 */

import { fetchJsonWithAuth } from "@/utils/fetchWithAuth";
import type { V2ApiResponse, V2EventRequest } from "@/services/eventRequestsV2Service";

const API_BASE = (() => {
  if (typeof process !== "undefined" && process.env?.NEXT_PUBLIC_API_URL) {
    return (process.env.NEXT_PUBLIC_API_URL || "").replace(/\/$/, "");
  }
  if (typeof window !== "undefined" && window.location) {
    return `${window.location.protocol}//${window.location.host}`;
  }
  return "http://localhost:6700";
})();

// ============================================================================
// TYPES
// ============================================================================

/**
 * V2.0 Event Request Creation Data
 * No coordinator selection (broadcast model)
 */
export interface CreateEventRequestV2Data {
  // Event Details
  Event_Title: string;
  Location: string;
  Start_Date: string; // ISO string
  End_Date?: string; // ISO string
  Event_Description?: string;
  
  // Contact Info
  Email?: string;
  Phone_Number?: string;
  
  // Category and Type
  Category: 'Training' | 'BloodDrive' | 'Advocacy';
  
  // Category-Specific Fields
  TrainingType?: string;
  MaxParticipants?: number;
  
  Target_Donation?: number;
  VenueType?: string;
  
  TargetAudience?: string;
  Topic?: string;
  ExpectedAudienceSize?: number;
  
  // Location/Jurisdiction
  province?: string; // ID or name
  district?: string; // ID or name
  municipalityId?: string; // ID
  organizationType?: string;
}

/**
 * Request Validation Error
 */
export interface ValidationError {
  field: string;
  message: string;
}

/**
 * Validation Result
 */
export interface ValidationResult {
  valid: boolean;
  errors: ValidationError[];
}

// ============================================================================
// VALIDATION FUNCTIONS
// ============================================================================

/**
 * Validate event request data against v2.0 schema
 * Aligns with backend Joi schemas
 */
export function validateEventRequestV2(data: Partial<CreateEventRequestV2Data>): ValidationResult {
  const errors: ValidationError[] = [];

  // Required: Event Title
  if (!data.Event_Title || data.Event_Title.trim().length === 0) {
    errors.push({
      field: 'Event_Title',
      message: 'Event title is required',
    });
  } else if (data.Event_Title.length > 255) {
    errors.push({
      field: 'Event_Title',
      message: 'Event title must be 255 characters or less',
    });
  }

  // Required: Location
  if (!data.Location || data.Location.trim().length === 0) {
    errors.push({
      field: 'Location',
      message: 'Location is required',
    });
  }

  // Required: Start Date
  if (!data.Start_Date) {
    errors.push({
      field: 'Start_Date',
      message: 'Start date is required',
    });
  } else {
    try {
      const startDate = new Date(data.Start_Date);
      if (isNaN(startDate.getTime())) {
        errors.push({
          field: 'Start_Date',
          message: 'Invalid start date format',
        });
      } else if (startDate < new Date()) {
        errors.push({
          field: 'Start_Date',
          message: 'Start date cannot be in the past',
        });
      }
    } catch (e) {
      errors.push({
        field: 'Start_Date',
        message: 'Invalid start date',
      });
    }
  }

  // Optional: End Date (must be after start)
  if (data.End_Date) {
    try {
      const endDate = new Date(data.End_Date);
      const startDate = data.Start_Date ? new Date(data.Start_Date) : null;
      
      if (isNaN(endDate.getTime())) {
        errors.push({
          field: 'End_Date',
          message: 'Invalid end date format',
        });
      } else if (startDate && endDate <= startDate) {
        errors.push({
          field: 'End_Date',
          message: 'End date must be after start date',
        });
      }
    } catch (e) {
      errors.push({
        field: 'End_Date',
        message: 'Invalid end date',
      });
    }
  }

  // Required: Category
  if (!data.Category) {
    errors.push({
      field: 'Category',
      message: 'Event category is required',
    });
  } else if (!['Training', 'BloodDrive', 'Advocacy'].includes(data.Category)) {
    errors.push({
      field: 'Category',
      message: 'Invalid category',
    });
  }

  // Category-specific validation
  if (data.Category === 'Training') {
    if (!data.TrainingType || data.TrainingType.trim().length === 0) {
      errors.push({
        field: 'TrainingType',
        message: 'Training type is required',
      });
    }
    if (data.MaxParticipants && (data.MaxParticipants < 1 || data.MaxParticipants > 10000)) {
      errors.push({
        field: 'MaxParticipants',
        message: 'Max participants must be between 1 and 10000',
      });
    }
  } else if (data.Category === 'BloodDrive') {
    if (data.Target_Donation && (data.Target_Donation < 1 || data.Target_Donation > 100000)) {
      errors.push({
        field: 'Target_Donation',
        message: 'Target donation must be between 1 and 100000 units',
      });
    }
  } else if (data.Category === 'Advocacy') {
    if (!data.Topic || data.Topic.trim().length === 0) {
      errors.push({
        field: 'Topic',
        message: 'Topic is required for advocacy events',
      });
    }
  }

  // Optional: Email validation
  if (data.Email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(data.Email)) {
      errors.push({
        field: 'Email',
        message: 'Invalid email format',
      });
    }
  }

  // Optional: Phone validation (basic)
  if (data.Phone_Number) {
    const phoneRegex = /^[0-9\-+().\s]+$/;
    if (data.Phone_Number.length < 7 || !phoneRegex.test(data.Phone_Number)) {
      errors.push({
        field: 'Phone_Number',
        message: 'Invalid phone number format',
      });
    }
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

// ============================================================================
// API FUNCTIONS
// ============================================================================

/**
 * Create an event request using v2.0 API (broadcast model)
 * 
 * Coordinator is not required - all matching reviewers get visibility
 * 
 * @param data - Event request data
 * @returns Created request
 */
export async function createEventRequestV2(
  data: CreateEventRequestV2Data
): Promise<V2EventRequest> {
  try {
    // Validate data
    const validation = validateEventRequestV2(data);
    if (!validation.valid) {
      const errorMessage = validation.errors
        .map((e) => `${e.field}: ${e.message}`)
        .join('; ');
      throw new Error(`Validation failed: ${errorMessage}`);
    }

    // Prepare payload (broadcast model - no coordinator)
    const payload = {
      ...data,
      // Don't include coordinator - backend will broadcast to all matching reviewers
      createdAt: new Date().toISOString(),
    };

    // Call v2.0 API
    const url = `${API_BASE}/api/v2/event-requests`;
    const response = await fetchJsonWithAuth(url, {
      method: 'POST',
      body: JSON.stringify(payload),
    });

    // Handle response
    if (!response.success) {
      throw new Error(response.message || 'Failed to create request');
    }

    // Extract request from data wrapper
    const request = response.data?.request || response.data;
    if (!request) {
      throw new Error('No request data returned from server');
    }

    return request as V2EventRequest;
  } catch (error: any) {
    console.error('[createEventRequestV2] Error:', error);
    throw error;
  }
}

/**
 * Get valid jurisdictions for current user
 * Helps auto-populate location fields based on user's coverage areas
 */
export async function getValidJurisdictionsV2(): Promise<{
  provinces: Array<{ _id: string; name: string }>;
  districts: Array<{ _id: string; name: string; province: string }>;
  organizationTypes: string[];
}> {
  try {
    const url = `${API_BASE}/api/v2/jurisdictions`;
    const response = await fetchJsonWithAuth(url, {
      method: 'GET',
    });

    if (!response.success) {
      throw new Error(response.message || 'Failed to fetch jurisdictions');
    }

    return response.data || {
      provinces: [],
      districts: [],
      organizationTypes: [],
    };
  } catch (error: any) {
    console.error('[getValidJurisdictionsV2] Error:', error);
    throw error;
  }
}

/**
 * Validate location jurisdiction against user's coverage area
 * Returns whether the location is valid for current user
 */
export async function validateJurisdictionV2(
  province?: string,
  district?: string,
  organizationType?: string
): Promise<{ valid: boolean; message?: string }> {
  try {
    const url = `${API_BASE}/api/v2/jurisdictions/validate`;
    const response = await fetchJsonWithAuth(url, {
      method: 'POST',
      body: JSON.stringify({
        province,
        district,
        organizationType,
      }),
    });

    if (!response.success) {
      return {
        valid: false,
        message: response.message || 'Invalid jurisdiction',
      };
    }

    return {
      valid: true,
    };
  } catch (error: any) {
    console.error('[validateJurisdictionV2] Error:', error);
    return {
      valid: false,
      message: error?.message || 'Error validating jurisdiction',
    };
  }
}
