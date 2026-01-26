/**
 * Event Creation Modal - V2.0
 * 
 * Features:
 * - Removed manual coordinator selection (broadcast model)
 * - Auto-discovery of valid jurisdictions
 * - Category-specific fields with conditional rendering
 * - Real-time validation aligned with backend schemas
 * - Proper error handling and user feedback
 * - Support for v1.0 fallback via feature flag
 * 
 * @version 2.0
 * @author UNITE Development Team
 */

'use client';

import React, { useState, useEffect } from 'react';
import type { ChangeEvent, FormEvent } from 'react';
import type { CreateEventRequestV2Data, ValidationResult } from '@/services/createEventRequestV2Service';
import {
  createEventRequestV2,
  validateEventRequestV2,
  getValidJurisdictionsV2,
  validateJurisdictionV2,
} from '@/services/createEventRequestV2Service';

// ============================================================================
// TYPES
// ============================================================================

export interface EventCreationModalV2Props {
  isOpen: boolean;
  onClose: () => void;
  onEventCreated?: (eventId: string) => void;
  useV1Fallback?: boolean; // Feature flag for v1 compatibility
}

interface FormState extends Partial<CreateEventRequestV2Data> {
  // Added for form convenience
  startTime?: string;
  endTime?: string;
}

interface LocationData {
  provinces: Array<{ _id: string; name: string }>;
  districts: Array<{ _id: string; name: string; province: string }>;
  organizationTypes: string[];
}

// ============================================================================
// SIMPLE TOAST NOTIFICATION
// ============================================================================

interface ToastProps {
  title: string;
  description: string;
  variant?: 'default' | 'destructive';
}

const showToast = (props: ToastProps) => {
  // Simple console-based toast for now (can be replaced with your toast library)
  if (props.variant === 'destructive') {
    console.error(`[${props.title}]`, props.description);
  } else {
    console.log(`[${props.title}]`, props.description);
  }
  // In production, replace with your actual toast implementation
  alert(`${props.title}: ${props.description}`);
};

// ============================================================================
// COMPONENT
// ============================================================================

export function EventCreationModalV2({
  isOpen,
  onClose,
  onEventCreated,
  useV1Fallback = false,
}: EventCreationModalV2Props) {
  // State Management
  const [formData, setFormData] = useState<FormState>({});
  const [validationResult, setValidationResult] = useState<ValidationResult>({
    valid: true,
    errors: [],
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [locations, setLocations] = useState<LocationData>({
    provinces: [],
    districts: [],
    organizationTypes: [],
  });
  const [isLoadingLocations, setIsLoadingLocations] = useState(false);

  // Load valid jurisdictions on mount
  useEffect(() => {
    if (isOpen && !useV1Fallback) {
      loadJurisdictions();
    }
  }, [isOpen, useV1Fallback]);

  // Load jurisdictions from API
  const loadJurisdictions = async () => {
    setIsLoadingLocations(true);
    try {
      const data = await getValidJurisdictionsV2();
      setLocations(data);
    } catch (error) {
      console.error('Failed to load jurisdictions:', error);
      showToast({
        title: 'Error',
        description: 'Failed to load available locations',
        variant: 'destructive',
      });
    } finally {
      setIsLoadingLocations(false);
    }
  };

  // Reset form when modal closes
  useEffect(() => {
    if (!isOpen) {
      setFormData({});
      setValidationResult({ valid: true, errors: [] });
    }
  }, [isOpen]);

  // Real-time validation on form change
  useEffect(() => {
    if (Object.keys(formData).length > 0) {
      const result = validateEventRequestV2(formData);
      setValidationResult(result);
    }
  }, [formData]);

  // ========================================================================
  // EVENT HANDLERS
  // ========================================================================

  const handleInputChange = (
    e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSelectChange = (name: string, value: string): void => {
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleProvinceChange = (provinceId: string): void => {
    setFormData((prev) => ({
      ...prev,
      province: provinceId,
      district: '', // Reset district when province changes
    }));
  };

  const handleDateChange = (
    e: ChangeEvent<HTMLInputElement>,
    field: 'Start_Date' | 'End_Date'
  ): void => {
    const { value } = e.target;
    if (value) {
      const date = new Date(value);
      setFormData((prev) => ({
        ...prev,
        [field]: date.toISOString(),
      }));
    }
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    // Validate form
    const validation = validateEventRequestV2(formData);
    setValidationResult(validation);

    if (!validation.valid) {
      showToast({
        title: 'Validation Error',
        description: 'Please correct the errors below',
        variant: 'destructive',
      });
      return;
    }

    // Validate jurisdiction if available
    if (formData.province) {
      try {
        const jurisdictionCheck = await validateJurisdictionV2(
          formData.province,
          formData.district,
          formData.organizationType
        );
        if (!jurisdictionCheck.valid) {
          showToast({
            title: 'Invalid Location',
            description:
              jurisdictionCheck.message ||
              'The selected location is not within your coverage area',
            variant: 'destructive',
          });
          return;
        }
      } catch (error) {
        console.error('Jurisdiction validation error:', error);
      }
    }

    // Submit request
    setIsSubmitting(true);
    try {
      // Prepare complete form data
      const completeData = {
        Event_Title: formData.Event_Title || '',
        Location: formData.Location || '',
        Start_Date: formData.Start_Date || new Date().toISOString(),
        End_Date: formData.End_Date,
        Event_Description: formData.Event_Description,
        Email: formData.Email,
        Phone_Number: formData.Phone_Number,
        Category: formData.Category as 'Training' | 'BloodDrive' | 'Advocacy',
        // Category-specific
        TrainingType: formData.TrainingType,
        MaxParticipants: formData.MaxParticipants,
        Target_Donation: formData.Target_Donation,
        VenueType: formData.VenueType,
        TargetAudience: formData.TargetAudience,
        Topic: formData.Topic,
        ExpectedAudienceSize: formData.ExpectedAudienceSize,
        // Location
        province: formData.province,
        district: formData.district,
        municipalityId: formData.municipalityId,
        organizationType: formData.organizationType,
      } as CreateEventRequestV2Data;

      const createdRequest = await createEventRequestV2(completeData);

      showToast({
        title: 'Success',
        description: 'Event request created successfully',
      });

      if (onEventCreated) {
        onEventCreated(createdRequest._id);
      }

      onClose();
    } catch (error: any) {
      console.error('Failed to create request:', error);
      showToast({
        title: 'Error',
        description: error?.message || 'Failed to create event request',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // ========================================================================
  // HELPER: Get field error message
  // ========================================================================

  const getFieldError = (fieldName: string): string | undefined => {
    return validationResult.errors.find((e) => e.field === fieldName)?.message;
  };

  const hasFieldError = (fieldName: string): boolean => {
    return !!getFieldError(fieldName);
  };

  // ========================================================================
  // HELPER: Get filtered districts for selected province
  // ========================================================================

  const getDistrictsForProvince = () => {
    if (!formData.province) return [];
    return locations.districts.filter((d) => d.province === formData.province);
  };

  // ========================================================================
  // RENDER
  // ========================================================================

  if (!isOpen) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="relative max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-lg bg-white p-6 shadow-lg">
        {/* Header */}
        <div className="mb-6 border-b pb-4">
          <h2 className="text-2xl font-bold">Create Event Request (V2.0)</h2>
          <p className="mt-2 text-sm text-gray-600">
            Create a new event request. Reviewers will be automatically assigned based on
            location and category matching.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* ================================================================ */}
          {/* EVENT BASICS */}
          {/* ================================================================ */}

          <div className="space-y-4 border-b pb-4">
            <h3 className="font-semibold text-lg">Event Details</h3>

            {/* Event Title */}
            <div>
              <label className="block text-sm font-medium mb-1">
                Event Title *
              </label>
              <input
                type="text"
                name="Event_Title"
                value={formData.Event_Title || ''}
                onChange={handleInputChange}
                placeholder="Enter event title"
                className={`w-full rounded border px-3 py-2 ${
                  hasFieldError('Event_Title') ? 'border-red-500' : 'border-gray-300'
                }`}
                disabled={isSubmitting || isLoadingLocations}
              />
              {getFieldError('Event_Title') && (
                <p className="text-red-500 text-sm mt-1">{getFieldError('Event_Title')}</p>
              )}
            </div>

            {/* Event Description */}
            <div>
              <label className="block text-sm font-medium mb-1">
                Event Description
              </label>
              <textarea
                name="Event_Description"
                value={formData.Event_Description || ''}
                onChange={handleInputChange}
                placeholder="Describe your event (optional)"
                rows={3}
                className="w-full rounded border border-gray-300 px-3 py-2"
                disabled={isSubmitting || isLoadingLocations}
              />
            </div>

            {/* Category */}
            <div>
              <label className="block text-sm font-medium mb-1">
                Category *
              </label>
              <select
                value={formData.Category || ''}
                onChange={(e) => handleSelectChange('Category', e.target.value)}
                className={`w-full rounded border px-3 py-2 ${
                  hasFieldError('Category') ? 'border-red-500' : 'border-gray-300'
                }`}
                disabled={isSubmitting || isLoadingLocations}
              >
                <option value="">Select category</option>
                <option value="Training">Training</option>
                <option value="BloodDrive">Blood Drive</option>
                <option value="Advocacy">Advocacy</option>
              </select>
              {getFieldError('Category') && (
                <p className="text-red-500 text-sm mt-1">{getFieldError('Category')}</p>
              )}
            </div>
          </div>

          {/* ================================================================ */}
          {/* CATEGORY-SPECIFIC FIELDS */}
          {/* ================================================================ */}

          {formData.Category === 'Training' && (
            <div className="space-y-4 border-b pb-4">
              <h3 className="font-semibold text-lg">Training Details</h3>

              <div>
                <label className="block text-sm font-medium mb-1">
                  Training Type *
                </label>
                <input
                  type="text"
                  name="TrainingType"
                  value={formData.TrainingType || ''}
                  onChange={handleInputChange}
                  placeholder="e.g., First Aid, Blood Banking"
                  className={`w-full rounded border px-3 py-2 ${
                    hasFieldError('TrainingType') ? 'border-red-500' : 'border-gray-300'
                  }`}
                  disabled={isSubmitting || isLoadingLocations}
                />
                {getFieldError('TrainingType') && (
                  <p className="text-red-500 text-sm mt-1">{getFieldError('TrainingType')}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">
                  Max Participants
                </label>
                <input
                  type="number"
                  name="MaxParticipants"
                  value={formData.MaxParticipants || ''}
                  onChange={handleInputChange}
                  placeholder="Maximum participants"
                  min="1"
                  max="10000"
                  className="w-full rounded border border-gray-300 px-3 py-2"
                  disabled={isSubmitting || isLoadingLocations}
                />
                {getFieldError('MaxParticipants') && (
                  <p className="text-red-500 text-sm mt-1">
                    {getFieldError('MaxParticipants')}
                  </p>
                )}
              </div>
            </div>
          )}

          {formData.Category === 'BloodDrive' && (
            <div className="space-y-4 border-b pb-4">
              <h3 className="font-semibold text-lg">Blood Drive Details</h3>

              <div>
                <label className="block text-sm font-medium mb-1">
                  Target Donation (units)
                </label>
                <input
                  type="number"
                  name="Target_Donation"
                  value={formData.Target_Donation || ''}
                  onChange={handleInputChange}
                  placeholder="e.g., 100"
                  min="1"
                  max="100000"
                  className={`w-full rounded border px-3 py-2 ${
                    hasFieldError('Target_Donation') ? 'border-red-500' : 'border-gray-300'
                  }`}
                  disabled={isSubmitting || isLoadingLocations}
                />
                {getFieldError('Target_Donation') && (
                  <p className="text-red-500 text-sm mt-1">
                    {getFieldError('Target_Donation')}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">
                  Venue Type
                </label>
                <input
                  type="text"
                  name="VenueType"
                  value={formData.VenueType || ''}
                  onChange={handleInputChange}
                  placeholder="e.g., Hospital, Community Center"
                  className="w-full rounded border border-gray-300 px-3 py-2"
                  disabled={isSubmitting || isLoadingLocations}
                />
              </div>
            </div>
          )}

          {formData.Category === 'Advocacy' && (
            <div className="space-y-4 border-b pb-4">
              <h3 className="font-semibold text-lg">Advocacy Details</h3>

              <div>
                <label className="block text-sm font-medium mb-1">
                  Topic *
                </label>
                <input
                  type="text"
                  name="Topic"
                  value={formData.Topic || ''}
                  onChange={handleInputChange}
                  placeholder="e.g., Blood Donation Awareness"
                  className={`w-full rounded border px-3 py-2 ${
                    hasFieldError('Topic') ? 'border-red-500' : 'border-gray-300'
                  }`}
                  disabled={isSubmitting || isLoadingLocations}
                />
                {getFieldError('Topic') && (
                  <p className="text-red-500 text-sm mt-1">{getFieldError('Topic')}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">
                  Target Audience
                </label>
                <input
                  type="text"
                  name="TargetAudience"
                  value={formData.TargetAudience || ''}
                  onChange={handleInputChange}
                  placeholder="e.g., Students, Healthcare Workers"
                  className="w-full rounded border border-gray-300 px-3 py-2"
                  disabled={isSubmitting || isLoadingLocations}
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">
                  Expected Audience Size
                </label>
                <input
                  type="number"
                  name="ExpectedAudienceSize"
                  value={formData.ExpectedAudienceSize || ''}
                  onChange={handleInputChange}
                  placeholder="Number of people expected"
                  min="1"
                  className="w-full rounded border border-gray-300 px-3 py-2"
                  disabled={isSubmitting || isLoadingLocations}
                />
              </div>
            </div>
          )}

          {/* ================================================================ */}
          {/* LOCATION & TIMING */}
          {/* ================================================================ */}

          <div className="space-y-4 border-b pb-4">
            <h3 className="font-semibold text-lg">Location & Timing</h3>

            {/* Location */}
            <div>
              <label className="block text-sm font-medium mb-1">
                Location Name *
              </label>
              <input
                type="text"
                name="Location"
                value={formData.Location || ''}
                onChange={handleInputChange}
                placeholder="Enter event location"
                className={`w-full rounded border px-3 py-2 ${
                  hasFieldError('Location') ? 'border-red-500' : 'border-gray-300'
                }`}
                disabled={isSubmitting || isLoadingLocations}
              />
              {getFieldError('Location') && (
                <p className="text-red-500 text-sm mt-1">{getFieldError('Location')}</p>
              )}
            </div>

            {/* Province */}
            <div>
              <label className="block text-sm font-medium mb-1">
                Province
              </label>
              <select
                value={formData.province || ''}
                onChange={(e) => handleProvinceChange(e.target.value)}
                className="w-full rounded border border-gray-300 px-3 py-2"
                disabled={isSubmitting || isLoadingLocations}
              >
                <option value="">Select province</option>
                {locations.provinces.map((p) => (
                  <option key={p._id} value={p._id}>
                    {p.name}
                  </option>
                ))}
              </select>
            </div>

            {/* District */}
            {formData.province && (
              <div>
                <label className="block text-sm font-medium mb-1">
                  District
                </label>
                <select
                  value={formData.district || ''}
                  onChange={(e) => handleSelectChange('district', e.target.value)}
                  className="w-full rounded border border-gray-300 px-3 py-2"
                  disabled={isSubmitting || isLoadingLocations}
                >
                  <option value="">Select district</option>
                  {getDistrictsForProvince().map((d) => (
                    <option key={d._id} value={d._id}>
                      {d.name}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Start Date */}
            <div>
              <label className="block text-sm font-medium mb-1">
                Start Date & Time *
              </label>
              <input
                type="datetime-local"
                value={
                  formData.Start_Date
                    ? new Date(formData.Start_Date).toISOString().slice(0, 16)
                    : ''
                }
                onChange={(e) => handleDateChange(e, 'Start_Date')}
                className={`w-full rounded border px-3 py-2 ${
                  hasFieldError('Start_Date') ? 'border-red-500' : 'border-gray-300'
                }`}
                disabled={isSubmitting || isLoadingLocations}
              />
              {getFieldError('Start_Date') && (
                <p className="text-red-500 text-sm mt-1">{getFieldError('Start_Date')}</p>
              )}
            </div>

            {/* End Date */}
            <div>
              <label className="block text-sm font-medium mb-1">
                End Date & Time
              </label>
              <input
                type="datetime-local"
                value={
                  formData.End_Date
                    ? new Date(formData.End_Date).toISOString().slice(0, 16)
                    : ''
                }
                onChange={(e) => handleDateChange(e, 'End_Date')}
                className={`w-full rounded border px-3 py-2 ${
                  getFieldError('End_Date') ? 'border-red-500' : 'border-gray-300'
                }`}
                disabled={isSubmitting || isLoadingLocations}
              />
              {getFieldError('End_Date') && (
                <p className="text-red-500 text-sm mt-1">{getFieldError('End_Date')}</p>
              )}
            </div>
          </div>

          {/* ================================================================ */}
          {/* CONTACT INFORMATION */}
          {/* ================================================================ */}

          <div className="space-y-4 border-b pb-4">
            <h3 className="font-semibold text-lg">Contact Information</h3>

            {/* Email */}
            <div>
              <label className="block text-sm font-medium mb-1">
                Email
              </label>
              <input
                type="email"
                name="Email"
                value={formData.Email || ''}
                onChange={handleInputChange}
                placeholder="your@email.com"
                className={`w-full rounded border px-3 py-2 ${
                  hasFieldError('Email') ? 'border-red-500' : 'border-gray-300'
                }`}
                disabled={isSubmitting || isLoadingLocations}
              />
              {getFieldError('Email') && (
                <p className="text-red-500 text-sm mt-1">{getFieldError('Email')}</p>
              )}
            </div>

            {/* Phone */}
            <div>
              <label className="block text-sm font-medium mb-1">
                Phone Number
              </label>
              <input
                type="tel"
                name="Phone_Number"
                value={formData.Phone_Number || ''}
                onChange={handleInputChange}
                placeholder="+1 (555) 123-4567"
                className={`w-full rounded border px-3 py-2 ${
                  hasFieldError('Phone_Number') ? 'border-red-500' : 'border-gray-300'
                }`}
                disabled={isSubmitting || isLoadingLocations}
              />
              {getFieldError('Phone_Number') && (
                <p className="text-red-500 text-sm mt-1">
                  {getFieldError('Phone_Number')}
                </p>
              )}
            </div>
          </div>

          {/* ================================================================ */}
          {/* NOTE: NO COORDINATOR SELECTION */}
          {/* ================================================================ */}

          <div className="bg-blue-50 border border-blue-200 rounded p-3 text-sm text-blue-800">
            <strong>Note:</strong> This request uses the broadcast model. All reviewers
            matching this event&apos;s location and category will automatically be assigned
            visibility and notified.
          </div>

          {/* ================================================================ */}
          {/* ACTIONS */}
          {/* ================================================================ */}

          <div className="flex justify-end gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting || isLoadingLocations}
              className="rounded border border-gray-300 px-4 py-2 text-sm font-medium hover:bg-gray-50 disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting || isLoadingLocations || !validationResult.valid}
              className="rounded bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
            >
              {isSubmitting ? 'Creating...' : 'Create Request'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default EventCreationModalV2;
