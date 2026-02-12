"use client";

import { useState, useEffect, useMemo } from "react";
import { Modal, ModalContent, ModalHeader, ModalBody } from "@heroui/modal";
import { Button } from "@heroui/button";
import { Input } from "@heroui/input";
import { Textarea } from "@heroui/input";
import { Select, SelectItem } from "@heroui/select";
import { DatePicker, DatePickerProps } from "@heroui/react";
import { parseDate, getLocalTimeZone } from "@internationalized/date";
import { useLocations } from "@/hooks/useLocations";

export interface BatchEventData {
  Event_Title: string;
  Location: string;
  Start_Date: string; // ISO date string
  End_Date?: string; // ISO date string
  Email?: string;
  Phone_Number?: string;
  Event_Description?: string;
  Category?: string;
  // Category-specific fields
  Target_Donation?: number;
  TrainingType?: string;
  MaxParticipants?: number;
  Topic?: string;
  TargetAudience?: string;
  ExpectedAudienceSize?: number;
  PartnerOrganization?: string;
  StaffAssignmentID?: string;
  // Location references
  province?: string;
  district?: string;
  municipalityId?: string;
  organizationId?: string;
  coverageAreaId?: string;
  coordinator_id?: string;
  stakeholder_id?: string;
}

interface BatchEventFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  event?: BatchEventData | null;
  onSubmit: (eventData: BatchEventData) => void;
  isSubmitting?: boolean;
  error?: string | null;
}

const EVENT_CATEGORIES = [
  { value: "BloodDrive", label: "Blood Drive" },
  { value: "Training", label: "Training" },
  { value: "Advocacy", label: "Advocacy" },
] as const;

export default function BatchEventFormModal({
  isOpen,
  onClose,
  event,
  onSubmit,
  isSubmitting = false,
  error: externalError = null,
}: BatchEventFormModalProps) {
  // Location data
  const { tree, flat } = useLocations(isOpen);
  
  // Form state
  const [formData, setFormData] = useState<BatchEventData>({
    Event_Title: "",
    Location: "",
    Start_Date: "",
    End_Date: "",
    Email: "",
    Phone_Number: "",
    Event_Description: "",
    Category: "",
  });

  // Date and time state (separate for better UX)
  type DatePickerValue = DatePickerProps["value"];
  const [date, setDate] = useState<DatePickerValue>(null);
  const [startTime, setStartTime] = useState("08:00");
  const [endTime, setEndTime] = useState("17:00");

  // Location selection state
  const [selectedProvince, setSelectedProvince] = useState<string>("");
  const [selectedDistrict, setSelectedDistrict] = useState<string>("");
  const [selectedMunicipality, setSelectedMunicipality] = useState<string>("");

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [internalError, setInternalError] = useState<string | null>(null);

  // Get provinces, districts, and municipalities from location data
  const provinces = useMemo(() => {
    return flat.filter((loc) => loc.type === "province" && loc.isActive);
  }, [flat]);

  const districts = useMemo(() => {
    if (!selectedProvince) return [];
    return flat.filter(
      (loc) =>
        (loc.type === "district" || (loc.type === "city" && loc.metadata?.isCity === true)) &&
        loc.isActive &&
        (loc.province === selectedProvince ||
          (typeof loc.parent === "string" && loc.parent === selectedProvince) ||
          (typeof loc.parent === "object" && loc.parent?._id === selectedProvince))
    );
  }, [flat, selectedProvince]);

  const municipalities = useMemo(() => {
    if (!selectedDistrict) return [];
    return flat.filter(
      (loc) =>
        loc.type === "municipality" &&
        loc.isActive &&
        (loc.district === selectedDistrict ||
          (typeof loc.parent === "string" && loc.parent === selectedDistrict) ||
          (typeof loc.parent === "object" && loc.parent?._id === selectedDistrict))
    );
  }, [flat, selectedDistrict]);

  // Initialize form when event changes
  useEffect(() => {
    if (event) {
      setFormData({
        Event_Title: event.Event_Title || "",
        Location: event.Location || "",
        Start_Date: event.Start_Date || "",
        End_Date: event.End_Date || "",
        Email: event.Email || "",
        Phone_Number: event.Phone_Number || "",
        Event_Description: event.Event_Description || "",
        Category: event.Category || "",
        Target_Donation: event.Target_Donation,
        TrainingType: event.TrainingType || "",
        MaxParticipants: event.MaxParticipants,
        Topic: event.Topic || "",
        TargetAudience: event.TargetAudience || "",
        ExpectedAudienceSize: event.ExpectedAudienceSize,
        PartnerOrganization: event.PartnerOrganization || "",
        StaffAssignmentID: event.StaffAssignmentID || "",
        province: event.province,
        district: event.district,
        municipalityId: event.municipalityId,
        organizationId: event.organizationId,
        coverageAreaId: event.coverageAreaId,
        coordinator_id: event.coordinator_id,
        stakeholder_id: event.stakeholder_id,
      });

      // Parse date and time from Start_Date
      if (event.Start_Date) {
        try {
          const startDate = new Date(event.Start_Date);
          const dateStr = startDate.toISOString().split("T")[0];
          const parsedDate = parseDate(dateStr);
          // Cast to the DatePicker's value type to avoid duplicate @internationalized/date instances in Vercel builds.
          setDate(parsedDate as unknown as DatePickerValue);
          setStartTime(
            `${String(startDate.getHours()).padStart(2, "0")}:${String(startDate.getMinutes()).padStart(2, "0")}`
          );
        } catch (e) {
          console.error("Error parsing start date:", e);
        }
      }

      // Parse end time from End_Date
      if (event.End_Date) {
        try {
          const endDate = new Date(event.End_Date);
          setEndTime(
            `${String(endDate.getHours()).padStart(2, "0")}:${String(endDate.getMinutes()).padStart(2, "0")}`
          );
        } catch (e) {
          console.error("Error parsing end date:", e);
        }
      }

      // Set location selections
      setSelectedProvince(event.province || "");
      setSelectedDistrict(event.district || "");
      setSelectedMunicipality(event.municipalityId || "");
    } else {
      // Reset for new event
      setFormData({
        Event_Title: "",
        Location: "",
        Start_Date: "",
        End_Date: "",
        Email: "",
        Phone_Number: "",
        Event_Description: "",
        Category: "",
      });
      setDate(null);
      setStartTime("08:00");
      setEndTime("17:00");
      setSelectedProvince("");
      setSelectedDistrict("");
      setSelectedMunicipality("");
    }
    setErrors({});
    setInternalError(null);
  }, [event, isOpen]);

  // Reset district and municipality when province changes
  useEffect(() => {
    if (!selectedProvince) {
      setSelectedDistrict("");
      setSelectedMunicipality("");
    }
  }, [selectedProvince]);

  // Reset municipality when district changes
  useEffect(() => {
    if (!selectedDistrict) {
      setSelectedMunicipality("");
    }
  }, [selectedDistrict]);

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.Event_Title.trim()) {
      newErrors.Event_Title = "Event title is required";
    } else if (formData.Event_Title.length < 3) {
      newErrors.Event_Title = "Event title must be at least 3 characters";
    }

    if (!formData.Location.trim()) {
      newErrors.Location = "Location is required";
    } else if (formData.Location.length < 3) {
      newErrors.Location = "Location must be at least 3 characters";
    }

    if (!date) {
      newErrors.date = "Date is required";
    }

    if (!startTime) {
      newErrors.startTime = "Start time is required";
    }

    if (!selectedProvince) {
      newErrors.province = "Province is required";
    }

    if (!selectedDistrict) {
      newErrors.district = "District is required";
    }

    if (!formData.Category || !formData.Category.trim()) {
      newErrors.Category = "Event category is required";
    }

    if (endTime && startTime) {
      const [sh, sm] = startTime.split(":").map(Number);
      const [eh, em] = endTime.split(":").map(Number);
      const startMinutes = sh * 60 + sm;
      const endMinutes = eh * 60 + em;
      if (endMinutes <= startMinutes) {
        newErrors.endTime = "End time must be after start time";
      }
    }

    // Email validation (optional but must be valid if provided)
    if (formData.Email && formData.Email.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.Email)) {
      newErrors.Email = "Invalid email address";
    }

    // Category-specific validation
    if (formData.Category) {
      const category = formData.Category.toLowerCase();
      if (category === "blooddrive" || category.includes("blood")) {
        if (formData.Target_Donation === undefined || formData.Target_Donation === null) {
          newErrors.Target_Donation = "Target donation is required for Blood Drive events";
        } else if (formData.Target_Donation < 0) {
          newErrors.Target_Donation = "Target donation must be a positive number";
        }
      } else if (category === "training" || category.includes("train")) {
        if (formData.MaxParticipants === undefined || formData.MaxParticipants === null) {
          newErrors.MaxParticipants = "Max participants is required for Training events";
        } else if (formData.MaxParticipants < 1) {
          newErrors.MaxParticipants = "Max participants must be at least 1";
        }
      } else if (category === "advocacy" || category.includes("advoc")) {
        if (!formData.Topic && !formData.TargetAudience) {
          newErrors.Topic = "Topic or Target Audience is required for Advocacy events";
        }
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setInternalError(null);

    if (!validateForm()) {
      return;
    }

    try {
      // Combine date and time into ISO datetime strings
      if (!date) {
        throw new Error("Date is required");
      }

      const dateObj = date.toDate(getLocalTimeZone());
      const [sh, sm] = startTime.split(":").map(Number);
      dateObj.setHours(sh || 0, sm || 0, 0, 0);
      const startISO = dateObj.toISOString();

      let endISO: string | undefined;
      if (endTime) {
        const endDateObj = date.toDate(getLocalTimeZone());
        const [eh, em] = endTime.split(":").map(Number);
        endDateObj.setHours(eh || 0, em || 0, 0, 0);
        endISO = endDateObj.toISOString();
      } else {
        // Default to 2 hours after start
        const defaultEnd = new Date(dateObj);
        defaultEnd.setHours(defaultEnd.getHours() + 2);
        endISO = defaultEnd.toISOString();
      }

      const eventData: BatchEventData = {
        ...formData,
        Start_Date: startISO,
        End_Date: endISO,
        // Location references
        province: selectedProvince || undefined,
        district: selectedDistrict || undefined,
        municipalityId: selectedMunicipality || undefined,
        // Remove empty optional fields
        Email: formData.Email?.trim() || undefined,
        Phone_Number: formData.Phone_Number?.trim() || undefined,
        Event_Description: formData.Event_Description?.trim() || undefined,
        Category: formData.Category || undefined,
        Target_Donation: formData.Target_Donation !== undefined ? formData.Target_Donation : undefined,
        TrainingType: formData.TrainingType?.trim() || undefined,
        MaxParticipants: formData.MaxParticipants !== undefined ? formData.MaxParticipants : undefined,
        Topic: formData.Topic?.trim() || undefined,
        TargetAudience: formData.TargetAudience?.trim() || undefined,
        ExpectedAudienceSize: formData.ExpectedAudienceSize !== undefined ? formData.ExpectedAudienceSize : undefined,
        PartnerOrganization: formData.PartnerOrganization?.trim() || undefined,
        StaffAssignmentID: formData.StaffAssignmentID?.trim() || undefined,
      };

      onSubmit(eventData);
    } catch (error: any) {
      setInternalError(error.message || "Failed to save event");
    }
  };

  const handleClose = () => {
    setErrors({});
    setInternalError(null);
    onClose();
  };

  const displayError = externalError || internalError;

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      size="3xl"
      scrollBehavior="inside"
      isDismissable={false}
      classNames={{
        base: "max-h-[95vh]",
        body: "overflow-y-auto max-h-[calc(95vh-80px)] py-4",
        wrapper: "overflow-hidden",
      }}
    >
      <ModalContent>
        <form onSubmit={handleSubmit}>
          <ModalHeader>
            {event ? "Edit Event" : "Add Event to Batch"}
          </ModalHeader>
          <ModalBody className="gap-4 py-4">
            {displayError && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-md">
                <p className="text-sm text-red-800">{displayError}</p>
              </div>
            )}

            {/* Basic Information */}
            <div className="space-y-4">
              <h4 className="text-sm font-semibold text-gray-700">Basic Information</h4>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input
                  label="Event Title"
                  placeholder="Enter event title"
                  value={formData.Event_Title}
                  onChange={(e) =>
                    setFormData({ ...formData, Event_Title: e.target.value })
                  }
                  isRequired
                  errorMessage={errors.Event_Title}
                  isInvalid={!!errors.Event_Title}
                />

                <Input
                  label="Location"
                  placeholder="Enter event location"
                  value={formData.Location}
                  onChange={(e) =>
                    setFormData({ ...formData, Location: e.target.value })
                  }
                  isRequired
                  errorMessage={errors.Location}
                  isInvalid={!!errors.Location}
                />
              </div>

              {/* Date and Time Selection */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">Date & Time *</label>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <DatePicker
                    label="Date"
                    hideTimeZone
                    granularity="day"
                    value={date}
                    onChange={setDate}
                    variant="bordered"
                    classNames={{
                      base: "w-full",
                    }}
                    errorMessage={errors.date}
                    isInvalid={!!errors.date}
                  />
                  <Input
                    type="time"
                    label="Start Time"
                    value={startTime}
                    onChange={(e) => setStartTime(e.target.value)}
                    variant="bordered"
                    errorMessage={errors.startTime}
                    isInvalid={!!errors.startTime}
                  />
                  <Input
                    type="time"
                    label="End Time"
                    value={endTime}
                    onChange={(e) => setEndTime(e.target.value)}
                    variant="bordered"
                    errorMessage={errors.endTime}
                    isInvalid={!!errors.endTime}
                  />
                </div>
              </div>

              {/* Contact Information (Optional) */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input
                  type="email"
                  label="Email"
                  placeholder="contact@example.com (optional)"
                  value={formData.Email || ""}
                  onChange={(e) =>
                    setFormData({ ...formData, Email: e.target.value })
                  }
                  errorMessage={errors.Email}
                  isInvalid={!!errors.Email}
                />

                <Input
                  label="Phone Number"
                  placeholder="+1234567890 (optional)"
                  value={formData.Phone_Number || ""}
                  onChange={(e) =>
                    setFormData({ ...formData, Phone_Number: e.target.value })
                  }
                />
              </div>

              <Textarea
                label="Event Description"
                placeholder="Enter event description (optional)"
                value={formData.Event_Description || ""}
                onChange={(e) =>
                  setFormData({ ...formData, Event_Description: e.target.value })
                }
                minRows={3}
              />
            </div>

            {/* Location Selection */}
            <div className="space-y-4 pt-2 border-t border-gray-200">
              <h4 className="text-sm font-semibold text-gray-700">Geographic Location</h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Select
                  label="Province"
                  placeholder="Select province"
                  selectedKeys={selectedProvince ? [selectedProvince] : []}
                  onSelectionChange={(keys) => {
                    const selected = Array.from(keys)[0] as string;
                    setSelectedProvince(selected || "");
                  }}
                  isRequired
                  errorMessage={errors.province}
                  isInvalid={!!errors.province}
                >
                  {provinces.map((province) => (
                    <SelectItem key={province._id}>
                      {province.name}
                    </SelectItem>
                  ))}
                </Select>

                <Select
                  label="District"
                  placeholder="Select district"
                  selectedKeys={selectedDistrict ? [selectedDistrict] : []}
                  onSelectionChange={(keys) => {
                    const selected = Array.from(keys)[0] as string;
                    setSelectedDistrict(selected || "");
                  }}
                  isDisabled={!selectedProvince || districts.length === 0}
                  isRequired
                  errorMessage={errors.district}
                  isInvalid={!!errors.district}
                >
                  {districts.map((district) => (
                    <SelectItem key={district._id}>
                      {district.name}
                    </SelectItem>
                  ))}
                </Select>

                <Select
                  label="Municipality"
                  placeholder="Select municipality"
                  selectedKeys={selectedMunicipality ? [selectedMunicipality] : []}
                  onSelectionChange={(keys) => {
                    const selected = Array.from(keys)[0] as string;
                    setSelectedMunicipality(selected || "");
                  }}
                  isDisabled={!selectedDistrict || municipalities.length === 0}
                >
                  {municipalities.map((municipality) => (
                    <SelectItem key={municipality._id}>
                      {municipality.name}
                    </SelectItem>
                  ))}
                </Select>
              </div>
            </div>

            {/* Category Selection */}
            <div className="space-y-4 pt-2 border-t border-gray-200">
              <Select
                label="Category"
                placeholder="Select event category"
                selectedKeys={formData.Category ? [formData.Category] : []}
                onSelectionChange={(keys) => {
                  const selected = Array.from(keys)[0] as string;
                  setFormData({ ...formData, Category: selected || undefined });
                  // Clear category-specific errors when category changes
                  setErrors((prev) => {
                    const newErrors = { ...prev };
                    delete newErrors.Target_Donation;
                    delete newErrors.MaxParticipants;
                    delete newErrors.Topic;
                    delete newErrors.Category;
                    return newErrors;
                  });
                }}
                isRequired
                errorMessage={errors.Category}
                isInvalid={!!errors.Category}
              >
                {EVENT_CATEGORIES.map((category) => (
                  <SelectItem key={category.value}>
                    {category.label}
                  </SelectItem>
                ))}
              </Select>

              {/* Category-specific fields */}
              {(formData.Category?.toLowerCase().includes("blood") || formData.Category === "BloodDrive") && (
                <div className="space-y-4">
                  <Input
                    type="number"
                    label="Target Donation"
                    placeholder="Enter target donation count"
                    value={formData.Target_Donation?.toString() || ""}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        Target_Donation: e.target.value ? parseInt(e.target.value, 10) : undefined,
                      })
                    }
                    isRequired
                    errorMessage={errors.Target_Donation}
                    isInvalid={!!errors.Target_Donation}
                  />
                </div>
              )}

              {(formData.Category?.toLowerCase().includes("train") || formData.Category === "Training") && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Input
                    type="number"
                    label="Max Participants"
                    placeholder="Enter maximum participants"
                    value={formData.MaxParticipants?.toString() || ""}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        MaxParticipants: e.target.value ? parseInt(e.target.value, 10) : undefined,
                      })
                    }
                    isRequired
                    errorMessage={errors.MaxParticipants}
                    isInvalid={!!errors.MaxParticipants}
                  />

                  <Input
                    label="Training Type"
                    placeholder="Enter training type (optional)"
                    value={formData.TrainingType || ""}
                    onChange={(e) =>
                      setFormData({ ...formData, TrainingType: e.target.value })
                    }
                  />
                </div>
              )}

              {(formData.Category?.toLowerCase().includes("advoc") || formData.Category === "Advocacy") && (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Input
                      label="Topic"
                      placeholder="Enter advocacy topic"
                      value={formData.Topic || ""}
                      onChange={(e) =>
                        setFormData({ ...formData, Topic: e.target.value })
                      }
                      errorMessage={errors.Topic}
                      isInvalid={!!errors.Topic}
                      description="Required if Target Audience is not provided"
                    />

                    <Input
                      label="Target Audience"
                      placeholder="Enter target audience"
                      value={formData.TargetAudience || ""}
                      onChange={(e) =>
                        setFormData({ ...formData, TargetAudience: e.target.value })
                      }
                      description="Required if Topic is not provided"
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Input
                      type="number"
                      label="Expected Audience Size"
                      placeholder="Enter expected audience size (optional)"
                      value={formData.ExpectedAudienceSize?.toString() || ""}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          ExpectedAudienceSize: e.target.value ? parseInt(e.target.value, 10) : undefined,
                        })
                      }
                    />

                    <Input
                      label="Partner Organization"
                      placeholder="Enter partner organization (optional)"
                      value={formData.PartnerOrganization || ""}
                      onChange={(e) =>
                        setFormData({ ...formData, PartnerOrganization: e.target.value })
                      }
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Action Buttons */}
            <div className="flex justify-end gap-2 pt-4 mt-4 border-t border-gray-200">
              <Button color="danger" variant="light" onPress={handleClose}>
                Cancel
              </Button>
              <Button color="primary" type="submit" isLoading={isSubmitting}>
                {event ? "Update" : "Add"} Event
              </Button>
            </div>
          </ModalBody>
        </form>
      </ModalContent>
    </Modal>
  );
}
