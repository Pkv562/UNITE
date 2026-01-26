/**
 * V2.0 Type Definitions
 * 
 * TypeScript types for the v2.0 permission-first, role-agnostic architecture.
 * These types align with the backend v2.0 API responses and ensure type safety
 * throughout the frontend application.
 * 
 * @version 2.0
 * @author UNITE Development Team
 */

// ============================================================================
// API RESPONSE TYPES
// ============================================================================

/**
 * Standardized API Response Format (v2.0)
 * All v2.0 endpoints return this structure
 */
export interface V2ApiResponse<T = any> {
  success: boolean;
  message?: string;
  data?: T;
  pagination?: V2Pagination;
}

/**
 * Pagination Metadata
 */
export interface V2Pagination {
  page: number;
  limit: number;
  total: number;
  pages: number;
}

// ============================================================================
// REQUEST TYPES
// ============================================================================

/**
 * Request States (v2.0 Simplified)
 */
export type V2RequestStatus =
  | 'pending-review'
  | 'approved'
  | 'rejected'
  | 'review-rescheduled'
  | 'cancelled';

/**
 * Request Actions (v2.0)
 */
export type V2RequestAction =
  | 'accept'
  | 'reject'
  | 'reschedule'
  | 'confirm'
  | 'decline'
  | 'cancel';

/**
 * Active Responder Relationship
 * Determines who should respond next in the reschedule loop
 */
export type V2ResponderRelationship = 'requester' | 'reviewer';

/**
 * Requester Information
 */
export interface V2Requester {
  userId: string;
  name: string;
  email?: string;
  phoneNumber?: string;
}

/**
 * Reviewer Information (Valid Coordinators)
 */
export interface V2Reviewer {
  _id: string;
  fullName: string;
  email: string;
  phoneNumber?: string;
  organizationType?: string;
  coverageAreas?: Array<{
    _id: string;
    name: string;
  }>;
}

/**
 * Active Responder
 * Indicates who should respond next
 */
export interface V2ActiveResponder {
  relationship: V2ResponderRelationship;
}

/**
 * Reschedule Proposal
 */
export interface V2RescheduleProposal {
  proposedBy: string;
  proposedDate: string;
  note?: string;
  timestamp?: Date;
}

/**
 * Status History Entry
 */
export interface V2StatusHistoryEntry {
  status: V2RequestStatus;
  timestamp: Date;
  actor?: string;
  note?: string;
}

/**
 * Decision History Entry
 */
export interface V2DecisionHistoryEntry {
  decision: 'accepted' | 'rejected' | 'rescheduled' | 'confirmed' | 'declined';
  timestamp: Date;
  actor: string;
  note?: string;
}

/**
 * Event Request (v2.0)
 * Core request object with all fields
 */
export interface V2EventRequest {
  _id: string;
  
  // Basic Information
  Event_Title: string;
  Event_Description?: string;
  Location: string;
  Category?: string;
  
  // Dates
  Date?: string;
  Start_Date?: string;
  End_Date?: string;
  
  // Status & Workflow
  status: V2RequestStatus;
  activeResponder?: V2ActiveResponder;
  rescheduleProposal?: V2RescheduleProposal;
  statusHistory?: V2StatusHistoryEntry[];
  decisionHistory?: V2DecisionHistoryEntry[];
  lastAction?: string;
  
  // Jurisdiction
  organizationType?: string;
  organizationId?: string;
  district?: string;
  province?: string;
  municipalityId?: string;
  coverageAreaId?: string;
  
  // People
  requester?: V2Requester;
  validCoordinators?: V2Reviewer[];
  
  // Category-Specific Data
  categoryData?: any;
  
  // Metadata
  notes?: string;
  createdAt?: string;
  updatedAt?: string;
  
  // Contact Information
  Email?: string;
  Phone_Number?: string;
  
  // Event-Specific Fields
  Target_Donation?: number;
  VenueType?: string;
  TrainingType?: string;
  MaxParticipants?: number;
  Topic?: string;
  TargetAudience?: string;
  ExpectedAudienceSize?: number;
  PartnerOrganization?: string;
}

/**
 * Request Creation Payload (v2.0)
 */
export interface V2CreateRequestPayload {
  Event_Title: string;
  Event_Description?: string;
  Location: string;
  Category?: string;
  Start_Date?: string;
  End_Date?: string;
  municipalityId?: string;
  organizationType?: string;
  notes?: string;
  
  // Contact
  Email?: string;
  Phone_Number?: string;
  
  // Category-specific
  Target_Donation?: number;
  VenueType?: string;
  TrainingType?: string;
  MaxParticipants?: number;
  Topic?: string;
  TargetAudience?: string;
  ExpectedAudienceSize?: number;
  PartnerOrganization?: string;
}

/**
 * Request Update Payload (v2.0)
 */
export interface V2UpdateRequestPayload {
  Event_Title?: string;
  Event_Description?: string;
  Location?: string;
  Category?: string;
  Start_Date?: string;
  End_Date?: string;
  municipalityId?: string;
  notes?: string;
  
  // Contact
  Email?: string;
  Phone_Number?: string;
  
  // Category-specific
  Target_Donation?: number;
  VenueType?: string;
  TrainingType?: string;
  MaxParticipants?: number;
  Topic?: string;
  TargetAudience?: string;
  ExpectedAudienceSize?: number;
  PartnerOrganization?: string;
}

/**
 * Request Action Payload (v2.0)
 */
export interface V2RequestActionPayload {
  action: V2RequestAction;
  note?: string;
  proposedDate?: string;
}

// ============================================================================
// FILTER TYPES
// ============================================================================

/**
 * Request List Filters (v2.0)
 */
export interface V2RequestFilters {
  status?: string;
  organizationId?: string;
  coverageAreaId?: string;
  municipalityId?: string;
  district?: string;
  province?: string;
  category?: string;
  page?: number;
  limit?: number;
}

// ============================================================================
// REVIEWER TYPES
// ============================================================================

/**
 * Valid Reviewers Response (v2.0)
 * Response from /api/v2/event-requests/:id/reviewers
 */
export interface V2ValidReviewersResponse {
  validReviewers: V2Reviewer[];
}

// ============================================================================
// PERMISSION TYPES
// ============================================================================

/**
 * Permission Resource Types
 */
export type V2PermissionResource =
  | 'request'
  | 'event'
  | 'user'
  | 'role'
  | 'organization'
  | '*';

/**
 * Permission Action Types
 */
export type V2PermissionAction =
  | 'create'
  | 'read'
  | 'update'
  | 'delete'
  | 'review'
  | 'approve'
  | 'manage'
  | '*';

/**
 * Permission Object
 */
export interface V2Permission {
  resource: V2PermissionResource;
  actions: V2PermissionAction[];
  metadata?: Record<string, any>;
}

/**
 * User with Permissions (v2.0)
 */
export interface V2UserWithPermissions {
  _id: string;
  fullName?: string;
  email?: string;
  phoneNumber?: string;
  permissions?: V2Permission[];
  roles?: Array<{
    _id: string;
    code: string;
    name: string;
    permissions?: V2Permission[];
  }>;
  authority?: number;
  organizationType?: string;
  coverageAreas?: Array<{
    _id: string;
    name: string;
  }>;
}

// ============================================================================
// UTILITY TYPES
// ============================================================================

/**
 * Capability String
 * Format: "resource.action" (e.g., "request.review", "event.create")
 */
export type V2Capability = `${V2PermissionResource}.${V2PermissionAction}`;

/**
 * Identity Type (for reschedule loop)
 */
export type V2IdentityType = 'requester' | 'reviewer';

// ============================================================================
// STATE MACHINE TYPES
// ============================================================================

/**
 * State Transition
 * Allowed transitions in the state machine
 */
export interface V2StateTransition {
  from: V2RequestStatus;
  to: V2RequestStatus;
  action: V2RequestAction;
  requiredCapability?: V2Capability;
}

/**
 * State Machine Configuration
 */
export interface V2StateMachineConfig {
  states: V2RequestStatus[];
  transitions: V2StateTransition[];
  initialState: V2RequestStatus;
  finalStates: V2RequestStatus[];
}

// ============================================================================
// EXPORTS
// ============================================================================

// Note: Types are exported individually via named exports above
// No default export needed for type-only modules
