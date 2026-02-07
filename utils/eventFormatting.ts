/**
 * Event Formatting Utilities
 * 
 * Provides consistent, context-aware formatting for calendar event displays.
 * Handles blood drive events with blood targets and non-blood-drive events with locations.
 */

export type EventType = 'BloodDrive' | 'Training' | 'Advocacy' | string;

export interface FormattedEventData {
  summary: string;
  title: string;
  location: string | null;
  bloodCount: number | null;
  eventType: EventType;
}

/**
 * Extract location from event, prioritizing municipality over district
 * @param event - Event object with location data
 * @returns Municipality name, or district name if municipality missing, or null
 */
export function extractEventLocation(event: any): string | null {
  if (!event) return null;

  // Try municipality first
  const municipality =
    event.municipality?.name ||
    event.municipality ||
    event.Municipality ||
    event.Municipality_Name ||
    null;

  if (municipality && typeof municipality === 'string' && municipality.trim()) {
    return municipality.trim();
  }

  // Fallback to district
  const district =
    event.district?.name ||
    event.district ||
    event.District ||
    event.District_Name ||
    null;

  if (district && typeof district === 'string' && district.trim()) {
    return district.trim();
  }

  return null;
}

/**
 * Extract blood target/count from event
 * Handles multiple field name variations from backend
 * @param event - Event object with blood-drive-specific data
 * @returns Blood target count, or null if not available or event is not a blood drive
 */
export function extractBloodCount(event: any): number | null {
  if (!event) return null;

  const count =
    event.bloodTarget ||
    event.Target_Donation ||
    event.blood_target ||
    event.Blood_Target ||
    event.bloodCount ||
    event.Blood_Count ||
    event.target ||
    event.categoryData?.Target_Donation ||
    event.categoryData?.bloodTarget ||
    event.categoryData?.bloodCount ||
    event.categoryData?.target ||
    null;

  // Validate it's a number
  const numCount = count ? parseInt(String(count), 10) : null;
  return Number.isNaN(numCount) || numCount === null ? null : numCount;
}

/**
 * Determine if event is a blood drive based on category data
 * @param event - Event object
 * @returns True if event is a blood drive
 */
export function isBloodDriveEvent(event: any): boolean {
  if (!event) return false;

  const category = (event.category || event.Category || event.type || '').toString().toLowerCase();
  const isBloodDrive = category.includes('blood');

  return isBloodDrive;
}

/**
 * Format event data for calendar display
 * Produces context-aware summaries:
 *   - Blood Drive: "Title (Location) - Count"
 *   - Other: "Title (Location)"
 *
 * @param event - Event object from API
 * @returns Formatted event summary and metadata
 */
export function formatEventSummary(
  event: any,
  options?: {
    showBloodCount?: boolean;
  }
): FormattedEventData {
  const showBloodCount = options?.showBloodCount !== false;
  const title = (event.Event_Title || event.title || event.Title || 'Event').toString();
  const location = extractEventLocation(event);
  const eventType = (event.category || event.Category || event.type || 'Event').toString();

  let summary = title;

  // Add location in parentheses if available
  if (location) {
    summary = `${summary} (${location})`;
  }

  // For blood drive events, append blood target count
  const isBloodDrive = isBloodDriveEvent(event);
  if (isBloodDrive && showBloodCount) {
    const bloodCount = extractBloodCount(event);
    if (bloodCount !== null) {
      summary = `${summary} - ${bloodCount}`;
    }
  }

  return {
    summary,
    title,
    location,
    bloodCount: isBloodDrive && showBloodCount ? extractBloodCount(event) : null,
    eventType,
  };
}

/**
 * Format event for display with optional max length truncation
 * Useful for UI layouts with space constraints
 * @param event - Event object
 * @param maxLength - Optional max character length (CSS handles visual truncation)
 * @returns Display-ready formatted string
 */
export function getEventDisplayText(
  event: any,
  maxLength?: number,
  options?: {
    showBloodCount?: boolean;
  }
): string {
  const formatted = formatEventSummary(event, options);
  let text = formatted.summary;

  if (maxLength && text.length > maxLength) {
    text = text.substring(0, maxLength) + '…';
  }

  return text;
}
