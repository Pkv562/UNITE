import { useCallback } from 'react';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { determineEventCategory, getCategoryColor, getCategoryLabel } from '@/components/calendar/calendar-event-utils';

interface CalendarEvent {
  id?: string;
  Event_ID?: string;
  EventId?: string;
  title?: string;
  Event_Title?: string;
  date: Date | string;
  Start_Date?: Date | string;
  End_Date?: Date | string;
  startTime?: string;
  endTime?: string;
  location?: string;
  Location?: string;
  eventType?: string;
  category?: string;
  Category?: string;
  description?: string;
  Event_Description?: string;
  coordinatorName?: string;
  ownerName?: string;
  raw?: any;
  Target_Donation?: number;
  ExpectedAudienceSize?: number;
  MaxParticipants?: number;
  units?: number;
}

interface ExportEvent {
  title: string;
  units: number;
  category: string;
  categoryLabel: string;
  categoryType: 'blood-drive' | 'training' | 'advocacy' | 'event';
  color: string;
  isSpecial: boolean;
}

interface CalendarDay {
  date: Date;
  dayNumber: number;
  isCurrentMonth: boolean;
  isFirstDayOfWeek: boolean;
  dateKey: string;
  events: ExportEvent[];
  notes: string[];
}

type NotesByDate = Record<string, { content?: string }[]>;

const escapeHTML = (value: string): string => {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
};

// Helper function to extract Target_Donation from event (similar to extractCategoryData)
const getTargetDonation = (event: any): number | undefined => {
  const raw = event.raw || event;
  
  // Helper to find value across different locations
  const getVal = (keys: string[]) => {
    // Check categoryData first (backend returns it directly)
    if (raw.categoryData) {
      for (const k of keys) {
        if (raw.categoryData[k] !== undefined && raw.categoryData[k] !== null) {
          return raw.categoryData[k];
        }
      }
    }
    // Check direct properties
    for (const k of keys) {
      if (raw[k] !== undefined && raw[k] !== null) {
        return raw[k];
      }
    }
    return undefined;
  };
  
  return getVal(['Target_Donation', 'TargetDonation', 'Target_Donations']);
};

// Helper function to determine if event is blood drive
const isBloodDrive = (event: any): boolean => {
  const raw = event.raw || event;
  const category = (raw.Category || raw.category || raw.categoryType || '').toString().toLowerCase();
  return category.includes('blood') || category === 'blooddrive';
};

// Helper function to transform events for export
const transformEventsForExport = (monthEventsByDate: Record<string, any[]>): Record<string, ExportEvent[]> => {
  const transformed: Record<string, ExportEvent[]> = {};
  
  Object.entries(monthEventsByDate).forEach(([dateKey, events]) => {
    transformed[dateKey] = events.map((event: any) => {
      const raw = event.raw || event;
      const title = raw.Event_Title || raw.title || raw.EventTitle || 'Untitled Event';
      
      // Determine category
      const category = raw.Category || raw.category || raw.categoryType || 'Event';
      const categoryType = determineEventCategory(category);
      const categoryLabel = getCategoryLabel(categoryType);
      const color = getCategoryColor(categoryType);
      const categoryLower = category.toString().toLowerCase();
      const isBloodDriveEvent = categoryType === 'blood-drive';
      
      // Extract units - only Target_Donation for blood drives, 0 for others
      let units = 0;
      if (isBloodDriveEvent) {
        const targetDonation = getTargetDonation(event);
        units = targetDonation !== undefined ? Number(targetDonation) : 0;
      }
      
      // Determine if special event (red background) - typically large events or special types
      const isSpecial = units >= 200 || 
                       title.toLowerCase().includes('relaunch') ||
                       title.toLowerCase().includes('meeting') ||
                       categoryLower.includes('special');
      
      return {
        title,
        units, // Only blood drive Target_Donation, 0 for others
        category,
        categoryLabel,
        categoryType,
        color,
        isSpecial,
      };
    });
  });
  
  return transformed;
};

const transformNotesForExport = (notesByDate: NotesByDate = {}): Record<string, string[]> => {
  const output: Record<string, string[]> = {};

  Object.entries(notesByDate || {}).forEach(([dateKey, notes]) => {
    const safeNotes = (notes || [])
      .map((note) => (note?.content || '').trim())
      .filter(Boolean)
      .map((note) => escapeHTML(note));

    if (safeNotes.length) {
      output[dateKey] = safeNotes;
    }
  });

  return output;
};

// Helper function to build calendar grid
const buildCalendarGrid = (
  currentDate: Date,
  eventsByDate: Record<string, ExportEvent[]>,
  notesByDate: Record<string, string[]> = {}
): CalendarDay[] => {
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  
  // Get first and last day of month
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  
  // Get first day of week for the first day of month (0 = Sunday)
  const startDayOfWeek = firstDay.getDay();
  
  // Calculate start date (include previous month days to fill first week)
  const startDate = new Date(firstDay);
  startDate.setDate(startDate.getDate() - startDayOfWeek);
  
  // Calculate end date (include next month days to fill last week)
  const endDate = new Date(lastDay);
  const endDayOfWeek = lastDay.getDay();
  const daysToAdd = 6 - endDayOfWeek;
  endDate.setDate(endDate.getDate() + daysToAdd);
  
  const days: CalendarDay[] = [];
  const current = new Date(startDate);
  
  while (current <= endDate) {
    const dateKey = `${current.getFullYear()}-${String(current.getMonth() + 1).padStart(2, '0')}-${String(current.getDate()).padStart(2, '0')}`;
    const dayOfWeek = current.getDay();
    const isFirstDayOfWeek = dayOfWeek === 1; // Monday (first day of week in reference)
    const isCurrentMonth = current.getMonth() === month;
    
    days.push({
      date: new Date(current),
      dayNumber: current.getDate(),
      isCurrentMonth,
      isFirstDayOfWeek,
      dateKey,
      events: eventsByDate[dateKey] || [],
      notes: notesByDate[dateKey] || [],
    });
    
    current.setDate(current.getDate() + 1);
  }
  
  return days;
};

// Helper function to calculate weekly totals (only blood drive events)
const calculateWeeklyTotals = (weeks: CalendarDay[][]): number[] => {
  return weeks.map(week => {
    return week.reduce((weekTotal, day) => {
      // Only sum units from blood drive events
      const dayTotal = day.events.reduce((sum, event) => {
        // Only count if it's a blood drive event (has units > 0 means it's a blood drive)
        // Units will be 0 for non-blood-drive events
        return sum + event.units;
      }, 0);
      return weekTotal + dayTotal;
    }, 0);
  });
};

// Helper function to generate complete HTML
const generateCalendarHTML = (
  eventsByDate: Record<string, ExportEvent[]>,
  currentDate: Date,
  organizationName: string = 'Bicol Transfusion Service Centre',
  notesByDate: Record<string, string[]> = {}
): string => {
  const monthYear = currentDate.toLocaleString('default', { month: 'long', year: 'numeric' });
  
  // Calculate grand total early for header display
  const allEvents = Object.values(eventsByDate).flat();
  const grandTotal = allEvents.reduce((sum, event) => sum + event.units, 0);
  
  const days = buildCalendarGrid(currentDate, eventsByDate, notesByDate);
  
  // Group days into weeks (rows)
  const weeks: CalendarDay[][] = [];
  let currentWeek: CalendarDay[] = [];
  
  days.forEach((day, index) => {
    currentWeek.push(day);
    if (day.date.getDay() === 6 || index === days.length - 1) {
      weeks.push([...currentWeek]);
      currentWeek = [];
    }
  });
  
  // Calculate weekly totals after grouping into weeks (only blood drive events)
  const weeklyTotals = calculateWeeklyTotals(weeks);
  
  // Build day headers HTML (Sunday is implied but not labeled in reference)
  const dayHeaders = ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];
  const dayHeadersHTML = `<th class="day-header"></th>` + dayHeaders.map(day => `<th class="day-header">${day}</th>`).join('');
  
  // Build calendar rows HTML
  let calendarRowsHTML = '';
  let totalWeekIndex = 0;
  
  weeks.forEach((week, weekIndex) => {
    calendarRowsHTML += '<tr>';
    
    week.forEach((day) => {
      const dateClass = day.isCurrentMonth ? 'date-current' : 'date-other';
      const eventCount = day.events.length;
      
      // Render events WITHOUT category chips (color-only)
      const eventsHTML = day.events.map(event => {
        const unitsText = event.units > 0 ? ` - ${event.units}` : '';
        const bgColor = `${event.color}22`;
        const borderColor = `${event.color}55`;
        const textColor = event.color;
        return `
          <div class="event-block ${event.isSpecial ? 'event-special' : ''}" style="background-color: ${bgColor}; color: ${textColor}; border: 1px solid ${borderColor};">
            <div class="event-title">${escapeHTML(event.title)}${unitsText}</div>
          </div>
        `;
      }).join('');
      
      // Smart notes rendering:
      // - Hide if 3+ events
      // - Center if 0 events
      // - Show below events if 1-2 events
      let notesHTML = '';
      if (day.notes.length > 0 && eventCount < 3) {
        const notesCentered = eventCount === 0 ? 'notes-centered' : '';
        notesHTML = `
          <div class="notes-container ${notesCentered}">
            ${day.notes.slice(0, 2).map((note) => `<div class="note-pill" title="${note}">${note}</div>`).join('')}
            ${day.notes.length > 2 ? `<div class="note-more">+${day.notes.length - 2} more</div>` : ''}
          </div>
        `;
      }
      
      calendarRowsHTML += `
        <td class="calendar-cell ${dateClass}">
          <div class="date-number">${day.dayNumber}</div>
          <div class="events-container">${eventsHTML}</div>
          ${notesHTML}
        </td>
      `;
    });
    
    // Add TOTAL column (only blood drive totals)
    const weekTotal = weeklyTotals[totalWeekIndex] || 0;
    calendarRowsHTML += `<td class="total-sc-cell">${weekTotal > 0 ? weekTotal.toLocaleString() : ''}</td>`;
    totalWeekIndex++;
    
    calendarRowsHTML += '</tr>';
  });
  
  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Calendar Export - ${monthYear}</title>
  <style>
    /* === RESET & BASE === */
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Helvetica Neue', Arial, sans-serif;
      padding: 8mm;
      background: #ffffff;
      margin: 0;
      color: #1a1a1a;
      -webkit-font-smoothing: antialiased;
      -moz-osx-font-smoothing: grayscale;
    }
    
    /* === CONTAINER === */
    .calendar-container {
      width: 100%;
      max-width: 100%;
      padding: 0;
      box-sizing: border-box;
    }
    
    /* === HEADER SECTION === */
    .calendar-header {
      margin-bottom: 24px;
      padding-bottom: 16px;
      border-bottom: 3px solid #c62828;
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
    }
    
    .header-left {
      flex: 1;
    }
    
    .header-right {
      display: flex;
      flex-direction: row;
      align-items: center;
      gap: 20px;
    }
    
    .month-year {
      font-size: 32px;
      font-weight: 700;
      color: #1a1a1a;
      margin-bottom: 8px;
      letter-spacing: -0.5px;
      line-height: 1.2;
    }
    
    .organization-name {
      font-size: 18px;
      font-weight: 600;
      color: #c62828;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }
    
    .monthly-total {
      background: linear-gradient(135deg, #c62828 0%, #b71c1c 100%);
      color: #ffffff;
      padding: 12px 20px;
      border-radius: 8px;
      box-shadow: 0 2px 8px rgba(198, 40, 40, 0.25);
    }
    
    .monthly-total-label {
      font-size: 11px;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      opacity: 0.9;
      margin-bottom: 4px;
    }
    
    .monthly-total-value {
      font-size: 24px;
      font-weight: 700;
      letter-spacing: 0.3px;
    }
    
    .legend {
      display: flex;
      gap: 16px;
      align-items: center;
    }
    
    .legend-item {
      display: flex;
      align-items: center;
      gap: 6px;
      font-size: 11px;
      font-weight: 600;
      color: #2c2c2c;
    }
    
    .legend-color {
      width: 20px;
      height: 20px;
      border-radius: 4px;
      box-shadow: 0 1px 3px rgba(0, 0, 0, 0.15);
    }
    
    .legend-color.blood-drive {
      background: #dc2626;
    }
    
    .legend-color.advocacy {
      background: #2563eb;
    }
    
    .legend-color.training {
      background: #f97316;
    }
    
    /* === TABLE STRUCTURE === */
    .calendar-table {
      width: 100%;
      border-collapse: separate;
      border-spacing: 0;
      border: 2px solid #d0d0d0;
      table-layout: fixed;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
      border-radius: 4px;
      overflow: hidden;
    }
    
    /* === TABLE HEADERS === */
    .day-header {
      background: linear-gradient(180deg, #f8f9fa 0%, #e9ecef 100%);
      font-weight: 700;
      text-align: center;
      padding: 12px 8px;
      border-right: 1px solid #d0d0d0;
      border-bottom: 2px solid #c62828;
      font-size: 11px;
      color: #2c2c2c;
      text-transform: uppercase;
      letter-spacing: 0.8px;
    }
    
    .day-header:last-child {
      border-right: none;
    }
    
    /* === CALENDAR CELLS === */
    .calendar-cell {
      border-right: 1px solid #e0e0e0;
      border-bottom: 1px solid #e0e0e0;
      padding: 6px;
      min-height: 85px;
      vertical-align: top;
      width: calc((100% - 90px) / 7);
      background-color: #ffffff;
      transition: background-color 0.2s ease;
    }
    
    .calendar-cell:nth-child(7) {
      border-right: 2px solid #d0d0d0;
    }
    
    .date-other {
      background-color: #fafafa;
    }
    
    .date-other .date-number {
      color: #9e9e9e;
      font-weight: 500;
    }
    
    /* === EVENTS CONTAINER === */
    .events-container {
      min-height: 55px;
      margin-top: 2px;
    }
    
    /* === EVENT BLOCKS === */
    .event-block {
      padding: 6px 8px;
      margin: 4px 0;
      border-radius: 6px;
      font-size: 10px;
      line-height: 1.4;
      word-wrap: break-word;
      overflow: hidden;
      box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
      transition: all 0.2s ease;
    }
    
    .event-title {
      font-weight: 700;
      margin-bottom: 0;
      font-size: 10.5px;
      line-height: 1.3;
    }
    
    .event-special {
      box-shadow: 0 2px 6px rgba(0, 0, 0, 0.15);
      border-width: 1.5px;
      font-weight: 700;
    }

    /* === NOTES SECTION === */
    .notes-container {
      margin-top: 6px;
      display: flex;
      flex-direction: column;
      gap: 4px;
      border-top: 1px dashed #e0e0e0;
      padding-top: 6px;
    }
    
    .notes-container.notes-centered {
      border-top: none;
      margin-top: 0;
      padding-top: 0;
      justify-content: center;
      align-items: center;
      min-height: 55px;
    }
    
    .note-pill {
      background: linear-gradient(135deg, #fffbea 0%, #fff4d6 100%);
      color: #7c5e10;
      border: 1px solid #f0e0b0;
      border-left: 3px solid #f59e0b;
      border-radius: 4px;
      padding: 4px 6px;
      font-size: 9.5px;
      line-height: 1.4;
      word-break: break-word;
      box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
      font-weight: 500;
    }
    
    .note-more {
      color: #757575;
      font-size: 9px;
      padding: 2px 4px;
      font-style: italic;
      font-weight: 500;
    }
    
    /* === TOTAL COLUMN === */
    .total-sc-cell {
      border-right: none;
      border-bottom: 1px solid #e0e0e0;
      padding: 12px 10px;
      text-align: center;
      font-weight: 700;
      font-size: 14px;
      background: linear-gradient(180deg, #f1f3f5 0%, #e5e7eb 100%);
      width: 90px;
      min-width: 90px;
      color: #c62828;
      letter-spacing: 0.3px;
    }
    
    thead .total-sc-cell {
      background: linear-gradient(180deg, #f8f9fa 0%, #e9ecef 100%);
      border-bottom: 2px solid #c62828;
      font-size: 11px;
      color: #2c2c2c;
      text-transform: uppercase;
      letter-spacing: 0.8px;
    }
    
    /* === PRINT OPTIMIZATION === */
    @media print {
      body {
        padding: 5mm;
        margin: 0;
      }
      
      .calendar-container {
        padding: 0;
      }
      
      .calendar-table {
        page-break-inside: auto;
        box-shadow: none;
      }
      
      .calendar-cell {
        page-break-inside: avoid;
      }
      
      .event-block {
        box-shadow: 0 1px 2px rgba(0, 0, 0, 0.15);
      }
      
      @page {
        size: A4 landscape;
        margin: 5mm;
      }
    }
  </style>
</head>
<body>
  <div class="calendar-container">
    <div class="calendar-header">
      <div class="header-left">
        <div class="month-year">${monthYear}</div>
        <div class="organization-name">${organizationName}</div>
      </div>
      <div class="header-right">
        <div class="legend">
          <div class="legend-item">
            <div class="legend-color blood-drive"></div>
            <span>Blood Drive</span>
          </div>
          <div class="legend-item">
            <div class="legend-color advocacy"></div>
            <span>Advocacy</span>
          </div>
          <div class="legend-item">
            <div class="legend-color training"></div>
            <span>Training</span>
          </div>
        </div>
        <div class="monthly-total">
          <div class="monthly-total-label">Monthly Target</div>
          <div class="monthly-total-value">${grandTotal.toLocaleString()}</div>
        </div>
      </div>
    </div>
    
    <table class="calendar-table">
      <thead>
        <tr>
          ${dayHeadersHTML}
          <th class="total-sc-cell">TOTAL</th>
        </tr>
      </thead>
      <tbody>
        ${calendarRowsHTML}
      </tbody>
    </table>
  </div>
</body>
</html>`;
  
  return html;
};

// Helper function to generate PDF from HTML using html2canvas
const generatePDFFromHTML = async (
  htmlContent: string,
  filename: string,
  currentDate: Date
): Promise<void> => {
  return new Promise((resolve, reject) => {
    try {
      // Create a temporary container
      const container = document.createElement('div');
      container.style.position = 'fixed';
      container.style.left = '-9999px';
      container.style.top = '0';
      container.style.width = '297mm'; // A4 landscape width
      container.style.padding = '0';
      container.style.margin = '0';
      container.innerHTML = htmlContent;
      document.body.appendChild(container);
      
      // Wait for DOM to be ready, then capture
      setTimeout(async () => {
        try {
          const calendarElement = container.querySelector('.calendar-container') as HTMLElement;
          
          if (!calendarElement) {
            throw new Error('Calendar element not found');
          }
          
          // Capture the element as canvas with high quality
          const canvas = await html2canvas(calendarElement, {
            scale: 2, // Higher quality
            useCORS: true,
            logging: false,
            backgroundColor: '#ffffff',
            windowWidth: 1122, // A4 landscape width in pixels at 96 DPI (297mm)
            windowHeight: calendarElement.scrollHeight,
          });
          
          // Remove the temporary container
          document.body.removeChild(container);
          
          // Create PDF with A4 landscape orientation
          const pdf = new jsPDF({
            orientation: 'landscape',
            unit: 'mm',
            format: 'a4',
          });
          
          // A4 landscape dimensions with margins
          const pageWidth = 297; // A4 landscape width in mm
          const pageHeight = 210; // A4 landscape height in mm
          const margin = 5; // 5mm margins
          const contentWidth = pageWidth - (2 * margin); // Available width
          
          // Calculate scaled image dimensions to fit within margins
          const imgWidth = contentWidth;
          const imgHeight = (canvas.height * imgWidth) / canvas.width;
          
          // Add image to PDF with margins
          const imgData = canvas.toDataURL('image/png', 1.0);
          pdf.addImage(imgData, 'PNG', margin, margin, imgWidth, imgHeight, undefined, 'FAST');
          
          // Save the PDF
          const monthYear = currentDate.toLocaleString('default', { month: 'long', year: 'numeric' });
          pdf.save(`${filename || `calendar-${monthYear.replace(' ', '-').toLowerCase()}`}.pdf`);
          
          resolve();
        } catch (error) {
          // Clean up on error
          if (document.body.contains(container)) {
            document.body.removeChild(container);
          }
          reject(error);
        }
      }, 100);
    } catch (error) {
      reject(error);
    }
  });
};

export const useCalendarExport = () => {
  const exportVisualPDF = useCallback(async (
    monthEventsByDate: Record<string, any[]>,
    currentDate: Date,
    organizationName?: string,
    notesByDate?: NotesByDate
  ) => {
    try {
      // Transform events for export
      const transformedEvents = transformEventsForExport(monthEventsByDate);
      const transformedNotes = transformNotesForExport(notesByDate || {});
      
      // Generate HTML calendar
      const htmlContent = generateCalendarHTML(
        transformedEvents,
        currentDate,
        organizationName || 'Bicol Transfusion Service Centre',
        transformedNotes
      );
      
      // Generate PDF from HTML using html2canvas
      const monthYear = currentDate.toLocaleString('default', { month: 'long', year: 'numeric' });
      const filename = `calendar-${monthYear.replace(' ', '-').toLowerCase()}`;
      await generatePDFFromHTML(htmlContent, filename, currentDate);
      
      return { success: true };
    } catch (error) {
      console.error('Export failed:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      return { success: false, error: errorMessage };
    }
  }, []);

  const exportOrganizedPDF = useCallback((events: CalendarEvent[], monthYear: string, filename: string) => {
    try {
      const pdf = new jsPDF();
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      const margin = 20;
      let yPosition = margin;

      // Title
      pdf.setFontSize(18);
      pdf.setFont('helvetica', 'bold');
      pdf.text(`Calendar Events - ${monthYear}`, margin, yPosition);
      yPosition += 15;

      // Check if there are any events
      if (!events || events.length === 0) {
        pdf.setFontSize(12);
        pdf.setFont('helvetica', 'normal');
        pdf.text('No events scheduled for this month.', margin, yPosition);
        pdf.save(`${filename}.pdf`);
        return { success: true };
      }

      // Transform and sort events by date
      const transformedEvents = events.map((event) => {
        const raw = event.raw || event;
        return {
          id: event.Event_ID || event.EventId || event.id || '',
          title: event.Event_Title || event.title || 'Untitled Event',
          date: event.Start_Date || event.date,
          startTime: event.startTime || '',
          endTime: event.endTime || '',
          location: event.Location || event.location || 'TBA',
          eventType: event.Category || event.category || event.eventType || 'Event',
          description: event.Event_Description || event.description || '',
          coordinator: event.coordinatorName || event.ownerName || '',
        };
      });

      const sortedEvents = transformedEvents.sort((a, b) => {
        const dateA = new Date(a.date);
        const dateB = new Date(b.date);
        return dateA.getTime() - dateB.getTime();
      });

      // Group events by date
      const eventsByDate = sortedEvents.reduce((acc, event) => {
        const dateKey = new Date(event.date).toLocaleDateString('en-US', {
          weekday: 'long',
          year: 'numeric',
          month: 'long',
          day: 'numeric'
        });
        if (!acc[dateKey]) acc[dateKey] = [];
        acc[dateKey].push(event);
        return acc;
      }, {} as Record<string, typeof transformedEvents>);

      // Render events grouped by date
      Object.entries(eventsByDate).forEach(([date, dateEvents]) => {
        // Check if we need a new page
        if (yPosition > pageHeight - 40) {
          pdf.addPage();
          yPosition = margin;
        }

        // Date header
        pdf.setFontSize(14);
        pdf.setFont('helvetica', 'bold');
        pdf.setTextColor(0, 0, 0);
        pdf.text(date, margin, yPosition);
        yPosition += 10;

        // Events for this date
        dateEvents.forEach((event, index) => {
          if (yPosition > pageHeight - 60) {
            pdf.addPage();
            yPosition = margin;
          }

          pdf.setFontSize(11);
          pdf.setFont('helvetica', 'normal');

          // Event title
          pdf.setFont('helvetica', 'bold');
          const titleText = `${index + 1}. ${event.title}`;
          const titleLines = pdf.splitTextToSize(titleText, pageWidth - margin * 2);
          titleLines.forEach((line: string) => {
            if (yPosition > pageHeight - 20) {
              pdf.addPage();
              yPosition = margin;
            }
            pdf.text(line, margin + 5, yPosition);
            yPosition += 6;
          });

          // Event details
          pdf.setFont('helvetica', 'normal');
          pdf.setFontSize(10);

          if (event.startTime || event.endTime) {
            const timeText = `Time: ${event.startTime || 'N/A'} - ${event.endTime || 'N/A'}`;
            pdf.text(timeText, margin + 10, yPosition);
            yPosition += 5;
          }

          if (event.location) {
            const locationLines = pdf.splitTextToSize(`Location: ${event.location}`, pageWidth - margin * 2 - 10);
            locationLines.forEach((line: string) => {
              if (yPosition > pageHeight - 20) {
                pdf.addPage();
                yPosition = margin;
              }
              pdf.text(line, margin + 10, yPosition);
              yPosition += 5;
            });
          }

          if (event.eventType) {
            pdf.text(`Type: ${event.eventType}`, margin + 10, yPosition);
            yPosition += 5;
          }

          if (event.coordinator) {
            const coordLines = pdf.splitTextToSize(`Coordinator: ${event.coordinator}`, pageWidth - margin * 2 - 10);
            coordLines.forEach((line: string) => {
              if (yPosition > pageHeight - 20) {
                pdf.addPage();
                yPosition = margin;
              }
              pdf.text(line, margin + 10, yPosition);
              yPosition += 5;
            });
          }

          if (event.description) {
            const descLines = pdf.splitTextToSize(`Description: ${event.description}`, pageWidth - margin * 2 - 10);
            descLines.forEach((line: string) => {
              if (yPosition > pageHeight - 20) {
                pdf.addPage();
                yPosition = margin;
              }
              pdf.text(line, margin + 10, yPosition);
              yPosition += 5;
            });
          }

          yPosition += 8; // Space between events
        });

        yPosition += 5; // Space between dates
      });

      // Footer with page numbers
      const totalPages = (pdf as any).internal.getNumberOfPages();
      for (let i = 1; i <= totalPages; i++) {
        pdf.setPage(i);
        pdf.setFontSize(9);
        pdf.setFont('helvetica', 'normal');
        pdf.setTextColor(128, 128, 128);
        pdf.text(
          `Page ${i} of ${totalPages}`,
          pageWidth / 2,
          pageHeight - 10,
          { align: 'center' }
        );
      }

      pdf.save(`${filename}.pdf`);
      return { success: true };
    } catch (error) {
      console.error('Export failed:', error);
      return { success: false, error };
    }
  }, []);

  return { exportVisualPDF, exportOrganizedPDF };
};
