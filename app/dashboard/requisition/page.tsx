"use client";

import { useState, useEffect } from "react";
import { getUserInfo } from "../../../utils/getUserInfo";
import { Search, Download, Filter, Plus, ChevronDown, X, MoreHorizontal, ThumbsUp, Share, ArrowUpRight } from "lucide-react";
import Topbar from "@/components/topbar";
import {
  Dropdown,
  DropdownTrigger,
  DropdownMenu,
  DropdownItem,
  Button,
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Select,
  SelectItem,
  Input,
} from "@heroui/react";

interface RequisitionFormData {
  bloodType: string;
  units: number;
  requestDate: string;
  location: string;
  status: string;
  bloodbankLocation: string;
}

interface Requisition {
  id: string;
  orderId: string;
  hospital: string;
  department: string;
  units: number;
  bloodType: string;
  priority: "Non-urgent" | "Emergent" | "Urgent" | "Normal";
  requestDate: string;
  requiredDate: string;
  eta?: string;
  status: "Open" | "Closed";
}

export default function RequisitionManagement() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedRequisitions, setSelectedRequisitions] = useState<string[]>([]);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [requisitions, setRequisitions] = useState<Requisition[]>([]);
  const [filteredRequisitions, setFilteredRequisitions] = useState<Requisition[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const [directionFilter, setDirectionFilter] = useState<"All" | "Incoming" | "Outgoing">("All");
  const [statusFilter, setStatusFilter] = useState<"All" | "Open" | "Closed">("All");
  
  const [filters, setFilters] = useState<{
    hospital?: string;
    department?: string;
    bloodType?: string;
    priority?: string;
    status?: string;
  }>({});
  const [openQuickFilter, setOpenQuickFilter] = useState(false);
  
  const [userInfo, setUserInfo] = useState<any | null>(null);
  const [displayName, setDisplayName] = useState("Bicol Medical Center");
  const [displayEmail, setDisplayEmail] = useState("bmc@gmail.com");
  const [canManageRequisitions, setCanManageRequisitions] = useState(false);

  const formatDateForInput = (date: Date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const [formData, setFormData] = useState<RequisitionFormData>({
    bloodType: "",
    units: 1,
    requestDate: formatDateForInput(new Date()),
    location: "",
    status: "",
    bloodbankLocation: "",
  });

  useEffect(() => {
    try {
      const info = getUserInfo();
      setUserInfo(info);
      
      const rawUser = info?.raw || null;
      const staffType = rawUser?.StaffType || rawUser?.staff_type || null;
      const isStaffAdmin = !!staffType && String(staffType).toLowerCase() === "admin";
      const resolvedRole = info?.role || null;
      const roleLower = resolvedRole ? String(resolvedRole).toLowerCase() : "";
      const isSystemAdmin = !!info?.isAdmin || (roleLower.includes("sys") && roleLower.includes("admin"));

      setCanManageRequisitions(
        Boolean(isSystemAdmin || isStaffAdmin || roleLower.includes("coordinator"))
      );
      setDisplayName(info?.displayName || "Bicol Medical Center");
      setDisplayEmail(info?.email || "bmc@gmail.com");
    } catch (e) {
      /* ignore */
    }
  }, []);

  const handleSearch = (query: string) => {
    setSearchQuery(query);
  };

  const handleUserClick = () => {
    // User profile clicked
  };

  const handleExport = () => {
    const dataStr = JSON.stringify(filteredRequisitions, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'requisitions-export.json';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleQuickFilter = () => {
    setOpenQuickFilter(true);
  };

  const handleAdvancedFilter = () => {
    console.log("Advanced filter clicked");
  };

  const handleAddRequisition = () => {
    setIsAddModalOpen(true);
  };

  const handleModalClose = () => {
    setIsAddModalOpen(false);
    setFormData({
      bloodType: "",
      units: 1,
      requestDate: formatDateForInput(new Date()),
      location: "",
      status: "",
      bloodbankLocation: "",
    });
  };

  const handleModalSubmit = async () => {
    setIsCreating(true);
    try {
      const base = (process.env.NEXT_PUBLIC_API_URL || "").replace(/\/$/, "");
      const token = typeof window !== "undefined"
        ? localStorage.getItem("unite_token") || sessionStorage.getItem("unite_token")
        : null;

      const url = base ? `${base}/api/requisitions` : `/api/requisitions`;

      const requestDate = new Date(formData.requestDate);
      
      const requisitionData = {
        bloodType: formData.bloodType,
        units: formData.units,
        requestDate: requestDate.toISOString().split('T')[0],
        location: formData.location,
        status: formData.status,
        bloodbankLocation: formData.bloodbankLocation,
        orderId: `ORDER-${Date.now().toString().slice(-6)}`,
        hospital: "Bicol Medical Center",
        department: "ER",
        priority: formData.status === "Emergent" ? "Emergent" : "Non-urgent",
        requiredDate: new Date(requestDate.getTime() + 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        eta: new Date(requestDate.getTime() + 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      };

      const headers: any = { "Content-Type": "application/json" };
      if (token) headers["Authorization"] = `Bearer ${token}`;

      const res = await fetch(url, {
        method: "POST",
        headers,
        body: JSON.stringify(requisitionData),
      });

      const text = await res.text();
      let json: any = null;

      try {
        json = text ? JSON.parse(text) : null;
      } catch (err) {
        throw new Error(
          `Invalid JSON response when creating requisition: ${text.slice(0, 200)}`
        );
      }

      if (!res.ok) {
        throw new Error(
          json?.message || `Failed to create requisition (status ${res.status})`
        );
      }

      await fetchRequisitions();
      setIsAddModalOpen(false);
    } catch (err: any) {
      alert(err?.message || "Failed to create requisition");
      console.error(err);
    } finally {
      setIsCreating(false);
    }
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedRequisitions(filteredRequisitions.map((r) => r.id));
    } else {
      setSelectedRequisitions([]);
    }
  };

  const handleSelectRequisition = (id: string, checked: boolean) => {
    if (checked) {
      setSelectedRequisitions([...selectedRequisitions, id]);
    } else {
      setSelectedRequisitions(selectedRequisitions.filter((rId) => rId !== id));
    }
  };

  const handleAcceptRequest = (id: string) => {
    console.log("Accept request for requisition:", id);
    // Add accept request logic here
  };

  const handleRedirectRequest = (id: string) => {
    console.log("Redirect request for requisition:", id);
    // Add redirect request logic here
  };

  const fetchRequisitions = async () => {
    const startTime = Date.now();
    setLoading(true);
    setError(null);
    
    try {
      const mockRequisitions: Requisition[] = [
        {
          id: "1",
          orderId: "ORDER 1234",
          hospital: "Bicol Medical Center",
          department: "ER",
          units: 1,
          bloodType: "A",
          priority: "Non-urgent",
          requestDate: "October 28, 2025",
          requiredDate: "October 28, 2025",
          eta: "October 29, 2025",
          status: "Open"
        },
        {
          id: "2",
          orderId: "ORDER 1235",
          hospital: "Bicol Medical Center",
          department: "ICU",
          units: 2,
          bloodType: "O+",
          priority: "Emergent",
          requestDate: "October 28, 2025",
          requiredDate: "October 28, 2025",
          eta: "October 29, 2025",
          status: "Closed"
        },
        {
          id: "3",
          orderId: "ORDER 1236",
          hospital: "Bicol Medical Center",
          department: "Pediatrics",
          units: 3,
          bloodType: "B+",
          priority: "Non-urgent",
          requestDate: "October 28, 2025",
          requiredDate: "October 28, 2025",
          eta: "October 29, 2025",
          status: "Open"
        },
        {
          id: "4",
          orderId: "ORDER 1237",
          hospital: "Bicol Medical Center",
          department: "Surgery",
          units: 4,
          bloodType: "AB+",
          priority: "Emergent",
          requestDate: "October 28, 2025",
          requiredDate: "October 28, 2025",
          eta: "October 29, 2025",
          status: "Closed"
        },
      ];

      setRequisitions(mockRequisitions);

      const elapsedTime = Date.now() - startTime;
      const minLoadingTime = 1000;
      if (elapsedTime < minLoadingTime) {
        await new Promise(resolve => setTimeout(resolve, minLoadingTime - elapsedTime));
      }

      setLoading(false);
    } catch (err: any) {
      setError(err.message || "Unknown error");
      setLoading(false);
    }
  };

  useEffect(() => {
    let filtered = [...requisitions];

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(r =>
        r.orderId.toLowerCase().includes(query) ||
        r.hospital.toLowerCase().includes(query) ||
        r.department.toLowerCase().includes(query) ||
        r.bloodType.toLowerCase().includes(query) ||
        r.priority.toLowerCase().includes(query) ||
        r.status.toLowerCase().includes(query)
      );
    }

    if (directionFilter === "Incoming") {
      filtered = filtered.filter(r => r.status === "Open");
    } else if (directionFilter === "Outgoing") {
      filtered = filtered.filter(r => r.status === "Closed");
    }

    if (statusFilter === "Open") {
      filtered = filtered.filter(r => r.status === "Open");
    } else if (statusFilter === "Closed") {
      filtered = filtered.filter(r => r.status === "Closed");
    }

    if (filters.hospital) {
      filtered = filtered.filter(r => r.hospital === filters.hospital);
    }
    if (filters.department) {
      filtered = filtered.filter(r => r.department === filters.department);
    }
    if (filters.bloodType) {
      filtered = filtered.filter(r => r.bloodType === filters.bloodType);
    }
    if (filters.priority) {
      filtered = filtered.filter(r => r.priority === filters.priority);
    }
    if (filters.status) {
      filtered = filtered.filter(r => r.status === filters.status);
    }

    setFilteredRequisitions(filtered);
  }, [requisitions, filters, searchQuery, directionFilter, statusFilter]);

  useEffect(() => {
    const init = async () => {
      await fetchRequisitions();
      setLoading(false);
    };
    init();
  }, []);

  const handleApplyFilters = (newFilters: {
    hospital?: string;
    department?: string;
    bloodType?: string;
    priority?: string;
    status?: string;
  }) => {
    setFilters(newFilters);
    setOpenQuickFilter(false);
  };

  const handleClearFilters = () => {
    setFilters({});
    setSearchQuery("");
    setDirectionFilter("All");
    setStatusFilter("All");
  };

  const bloodTypes = [
    { key: "A", label: "A" },
    { key: "B", label: "B" },
    { key: "AB", label: "AB" },
    { key: "O", label: "O" },
    { key: "A+", label: "A+" },
    { key: "A-", label: "A-" },
    { key: "B+", label: "B+" },
    { key: "B-", label: "B-" },
    { key: "AB+", label: "AB+" },
    { key: "AB-", label: "AB-" },
    { key: "O+", label: "O+" },
    { key: "O-", label: "O-" },
  ];

  const statusOptions = [
    { key: "Non-urgent", label: "Non-urgent" },
    { key: "Emergent", label: "Emergent" },
    { key: "Urgent", label: "Urgent" },
    { key: "Normal", label: "Normal" },
  ];

  const bloodbankLocations = [
    { key: "main", label: "Main Blood Bank" },
    { key: "north", label: "North Wing Blood Bank" },
    { key: "south", label: "South Wing Blood Bank" },
    { key: "emergency", label: "Emergency Blood Bank" },
  ];

  const directionTabWidths = {
    "All": 65,
    "Incoming": 85,
    "Outgoing": 85,
  };

  const directionTotalWidth = 65 + 85 + 85;

  const statusTabWidths = {
    "All": 65,
    "Open": 70,
    "Closed": 75,
  };

  const statusTotalWidth = 65 + 70 + 75;

  return (
    <div className="min-h-screen bg-white">
      <div className="px-6 pt-6 pb-4">
        <h1 className="text-2xl font-semibold text-gray-900">
          Requisition Management
        </h1>
      </div>

      <Topbar
        userEmail={displayEmail}
        userName={displayName}
        onUserClick={handleUserClick}
      />

      <div className="px-6 py-4">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="relative bg-gray-100 rounded-lg p-1 overflow-hidden">
              <div className="flex relative" style={{ width: `${directionTotalWidth}px`, height: '40px' }}>
                {["All", "Incoming", "Outgoing"].map((tab) => (
                  <button
                    key={tab}
                    className={`relative text-sm font-medium rounded-md z-10 transition-all duration-300 flex items-center justify-center ${
                      directionFilter === tab
                        ? "text-gray-900"
                        : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"
                    }`}
                    style={{ width: `${directionTabWidths[tab as keyof typeof directionTabWidths]}px`, height: '100%' }}
                    onClick={() => setDirectionFilter(tab as any)}
                  >
                    {tab}
                  </button>
                ))}
                <div 
                  className="absolute top-0 h-full bg-white shadow-sm rounded-md transition-all duration-300 ease-in-out"
                  style={{
                    width: `${directionFilter === "All" ? directionTabWidths["All"] : 
                            directionFilter === "Incoming" ? directionTabWidths["Incoming"] : 
                            directionTabWidths["Outgoing"]}px`,
                    height: '100%',
                    left: directionFilter === "All" ? "0px" : 
                          directionFilter === "Incoming" ? `${directionTabWidths["All"]}px` : 
                          `${directionTabWidths["All"] + directionTabWidths["Incoming"]}px`
                  }}
                />
              </div>
            </div>

            <div className="relative bg-gray-100 rounded-lg p-1 overflow-hidden">
              <div className="flex relative" style={{ width: `${statusTotalWidth}px`, height: '40px' }}>
                {["All", "Open", "Closed"].map((tab) => (
                  <button
                    key={tab}
                    className={`relative text-sm font-medium rounded-md z-10 transition-all duration-300 flex items-center justify-center ${
                      statusFilter === tab
                        ? "text-gray-900"
                        : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"
                    }`}
                    style={{ width: `${statusTabWidths[tab as keyof typeof statusTabWidths]}px`, height: '100%' }}
                    onClick={() => setStatusFilter(tab as any)}
                  >
                    {tab}
                  </button>
                ))}
                <div 
                  className="absolute top-0 h-full bg-white shadow-sm rounded-md transition-all duration-300 ease-in-out"
                  style={{
                    width: `${statusFilter === "All" ? statusTabWidths["All"] : 
                            statusFilter === "Open" ? statusTabWidths["Open"] : 
                            statusTabWidths["Closed"]}px`,
                    height: '100%',
                    left: statusFilter === "All" ? "0px" : 
                          statusFilter === "Open" ? `${statusTabWidths["All"]}px` : 
                          `${statusTabWidths["All"] + statusTabWidths["Open"]}px`
                  }}
                />
              </div>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center gap-4">
            <div className="flex items-center gap-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="text"
                  placeholder="Search files..."
                  className="w-full sm:w-64 pl-10 pr-4 h-10 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-300"
                  value={searchQuery}
                  onChange={(e) => handleSearch(e.target.value)}
                />
              </div>

              <Button
                variant="bordered"
                className="border-gray-300 text-gray-700 transition-all duration-300 hover:bg-gray-50 h-10"
                startContent={<Download className="w-4 h-4" />}
                onPress={handleExport}
              >
                Export
              </Button>
            </div>

            <div className="flex items-center gap-3">
              <Button
                variant="bordered"
                className="border-gray-300 text-gray-700 transition-all duration-300 hover:bg-gray-50 h-10"
                startContent={<Filter className="w-4 h-4" />}
                onPress={handleQuickFilter}
              >
                Quick Filter
              </Button>

              <Button
                variant="bordered"
                className="border-gray-300 text-gray-700 transition-all duration-300 hover:bg-gray-50 h-10"
                startContent={<Filter className="w-4 h-4" />}
                onPress={handleAdvancedFilter}
              >
                Advanced Filter
              </Button>

              <Button
                className="bg-black text-white transition-all duration-300 hover:bg-gray-800 hover:scale-105 h-10"
                startContent={<Plus className="w-4 h-4" />}
                onPress={handleAddRequisition}
              >
                Make a request
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Fixed Table Content with proper alignment */}
      <div className="px-6 py-4">
        <div className="overflow-x-auto rounded-lg border border-gray-200">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="py-3 px-6 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  <div className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      className="h-4 w-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
                      onChange={(e) => handleSelectAll(e.target.checked)}
                      checked={selectedRequisitions.length === filteredRequisitions.length && filteredRequisitions.length > 0}
                    />
                    <span className="font-medium">ORDER ID</span>
                  </div>
                </th>
                <th className="py-3 px-6 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  HOSPITAL
                </th>
                <th className="py-3 px-6 text-left text-xs font-medium text-gray-500 uppercase tracking-wider text-center">
                  DEPARTMENT
                </th>
                <th className="py-3 px-6 text-left text-xs font-medium text-gray-500 uppercase tracking-wider text-center">
                  UNITS
                </th>
                <th className="py-3 px-6 text-left text-xs font-medium text-gray-500 uppercase tracking-wider text-center">
                  BLOOD TYPE
                </th>
                <th className="py-3 px-6 text-left text-xs font-medium text-gray-500 uppercase tracking-wider text-center">
                  PRIORITY
                </th>
                <th className="py-3 px-6 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  REQUEST DATE
                </th>
                <th className="py-3 px-6 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  ETA
                </th>
                <th className="py-3 px-6 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  STATUS
                </th>
                <th className="py-3 px-6 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  ACTION
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {loading ? (
                [...Array(4)].map((_, index) => (
                  <tr key={index} className="animate-pulse">
                    <td className="py-4 px-6">
                      <div className="flex items-center gap-3">
                        <div className="h-4 bg-gray-200 rounded w-4"></div>
                        <div className="h-4 bg-gray-200 rounded w-24"></div>
                      </div>
                    </td>
                    {[...Array(9)].map((_, cellIndex) => (
                      <td key={cellIndex} className="py-4 px-6">
                        <div className="h-4 bg-gray-200 rounded w-20"></div>
                      </td>
                    ))}
                  </tr>
                ))
              ) : error ? (
                <tr>
                  <td colSpan={10} className="py-8 px-6 text-center text-red-600">
                    {error}
                  </td>
                </tr>
              ) : filteredRequisitions.length === 0 ? (
                <tr>
                  <td colSpan={10} className="py-8 px-6 text-center text-gray-500">
                    No requisitions found
                  </td>
                </tr>
              ) : (
                filteredRequisitions.map((requisition) => (
                  <tr key={requisition.id} className="hover:bg-gray-50">
                    <td className="py-4 px-6">
                      <div className="flex items-center gap-3">
                        <input
                          type="checkbox"
                          className="h-4 w-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
                          checked={selectedRequisitions.includes(requisition.id)}
                          onChange={(e) => handleSelectRequisition(requisition.id, e.target.checked)}
                        />
                        <span className="font-medium text-gray-900">
                          {requisition.orderId}
                        </span>
                      </div>
                    </td>
                    <td className="py-4 px-6 text-sm text-left text-gray-900">
                      {requisition.hospital}
                    </td>
                    <td className="py-4 px-14 text-sm text-left text-gray-900 text-center">
                      {requisition.department}
                    </td>
                    <td className="py-4 px-10 text-sm text-left text-gray-900 text-center">
                      {requisition.units}
                    </td>
                    <td className="py-4 px-14 text-sm text-left text-gray-900 text-center">
                      {requisition.bloodType}
                    </td>
                    <td className="py-4 px-6 text-left">
                      <span className={`inline-flex items-left px-3 py-1 rounded-full text-xs font-medium ${
                        requisition.priority === "Emergent" 
                          ? "bg-red-100 text-red-800 border border-red-200"
                          : "bg-gray-100 text-gray-800 border border-gray-200"
                      }`}>
                        {requisition.priority}
                      </span>
                    </td>
                    <td className="py-4 px-6 text-sm text-gray-900">
                      {requisition.requestDate}
                    </td>
                    <td className="py-4 px-6 text-sm text-gray-900">
                      {requisition.eta}
                    </td>
                    <td className="py-4 px-5">
                      <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${
                        requisition.status === "Open" 
                          ? "bg-green-100 text-green-800 border border-green-200"
                          : "bg-red-100 text-red-800 border border-red-200"
                      }`}>
                        {requisition.status}
                      </span>
                    </td>
                    <td className="py-4 px-8">
                      <div className="flex justify-start">
                        <Dropdown>
                          <DropdownTrigger>
                            <Button
                              variant="light"
                              size="sm"
                              className="min-w-0 p-2 bg-gray-100 hover:bg-gray-200 rounded-md"
                            >
                              <MoreHorizontal className="w-4 h-4 text-gray-600" />
                            </Button>
                          </DropdownTrigger>
                          <DropdownMenu 
                            aria-label="Requisition actions"
                            className="min-w-[180px] p-2 bg-white shadow-lg rounded-lg border border-gray-200"
                          >
                            <DropdownItem 
                              key="accept"
                              className="px-3 py-2 hover:bg-gray-50"
                              onPress={() => handleAcceptRequest(requisition.id)}
                            >
                              <div className="flex items-center gap-2">
                                <ThumbsUp className="w-4 h-4 text-gray-700" />
                                <div className="flex flex-col">
                                  <span className="font-medium text-gray-900">Accept Request</span>
                                  <span className="text-xs text-gray-500">Accept request</span>
                                </div>
                              </div>
                            </DropdownItem>
                            <DropdownItem 
                              key="redirect"
                              className="px-3 py-2 hover:bg-gray-50"
                              onPress={() => handleRedirectRequest(requisition.id)}
                            >
                              <div className="flex items-center gap-2">
                                <ArrowUpRight className="w-4 h-4 text-gray-700" />
                                <div className="flex flex-col">
                                  <span className="font-medium text-gray-900">Redirect Request</span>
                                  <span className="text-xs text-gray-500">Redirect Request</span>
                                </div>
                              </div>
                            </DropdownItem>
                          </DropdownMenu>
                        </Dropdown>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* "Make a Request" Modal */}
      <Modal 
        isOpen={isAddModalOpen} 
        onClose={handleModalClose}
        size="md"
      >
        <ModalContent>
          <ModalHeader className="flex flex-col gap-1">
            <h2 className="text-xl font-semibold">Make a request</h2>
            <p className="text-sm text-gray-500 font-normal">
              Start providing your information by selecting your blood type. Add details below to proceed.
            </p>
          </ModalHeader>
          <ModalBody>
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Blood Type *
                  </label>
                  <Select
                    placeholder="Select one"
                    className="w-full transition-all duration-300"
                    selectedKeys={formData.bloodType ? [formData.bloodType] : []}
                    onChange={(e) => setFormData({...formData, bloodType: e.target.value})}
                  >
                    {bloodTypes.map((type) => (
                      <SelectItem key={type.key}>{type.label}</SelectItem>
                    ))}
                  </Select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Unit/s *
                  </label>
                  <Input
                    type="number"
                    placeholder="Enter unit"
                    min="1"
                    value={formData.units.toString()}
                    onChange={(e) => setFormData({...formData, units: parseInt(e.target.value) || 1})}
                    className="transition-all duration-300"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Request Date
                </label>
                <input
                  type="date"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-300"
                  value={formData.requestDate}
                  onChange={(e) => setFormData({...formData, requestDate: e.target.value})}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Location *
                </label>
                <Input
                  placeholder="Enter location"
                  value={formData.location}
                  onChange={(e) => setFormData({...formData, location: e.target.value})}
                  className="transition-all duration-300"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Set Status *
                </label>
                <Select
                  placeholder="Select one"
                  className="w-full transition-all duration-300"
                  selectedKeys={formData.status ? [formData.status] : []}
                  onChange={(e) => setFormData({...formData, status: e.target.value})}
                >
                  {statusOptions.map((status) => (
                    <SelectItem key={status.key}>{status.label}</SelectItem>
                  ))}
                </Select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Bloodbank Location *
                </label>
                <Select
                  placeholder="Select one"
                  className="w-full transition-all duration-300"
                  selectedKeys={formData.bloodbankLocation ? [formData.bloodbankLocation] : []}
                  onChange={(e) => setFormData({...formData, bloodbankLocation: e.target.value})}
                >
                  {bloodbankLocations.map((location) => (
                    <SelectItem key={location.key}>{location.label}</SelectItem>
                  ))}
                </Select>
              </div>
            </div>
          </ModalBody>
          <ModalFooter>
            <Button
              variant="bordered"
              onPress={handleModalClose}
              className="border-gray-300 transition-all duration-300 hover:bg-gray-50"
            >
              Cancel
            </Button>
            <Button
              className="bg-black text-white transition-all duration-300 hover:bg-gray-800 hover:scale-105"
              onPress={handleModalSubmit}
              isLoading={isCreating}
            >
              {isCreating ? "Creating..." : "Make Request"}
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      <Modal 
        isOpen={openQuickFilter} 
        onClose={() => setOpenQuickFilter(false)}
        size="sm"
      >
        <ModalContent>
          <ModalHeader className="flex flex-col gap-1">
            <h2 className="text-xl font-semibold">Quick Filter</h2>
          </ModalHeader>
          <ModalBody>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Hospital
                </label>
                <Select
                  placeholder="Select hospital"
                  className="w-full transition-all duration-300"
                  selectedKeys={filters.hospital ? [filters.hospital] : []}
                  onChange={(e) => handleApplyFilters({...filters, hospital: e.target.value})}
                >
                  <SelectItem key="Bicol Medical Center">Bicol Medical Center</SelectItem>
                  <SelectItem key="General Hospital">General Hospital</SelectItem>
                </Select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Department
                </label>
                <Select
                  placeholder="Select department"
                  className="w-full transition-all duration-300"
                  selectedKeys={filters.department ? [filters.department] : []}
                  onChange={(e) => handleApplyFilters({...filters, department: e.target.value})}
                >
                  <SelectItem key="ER">ER</SelectItem>
                  <SelectItem key="ICU">ICU</SelectItem>
                  <SelectItem key="OR">OR</SelectItem>
                  <SelectItem key="Pediatrics">Pediatrics</SelectItem>
                </Select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Blood Type
                </label>
                <Select
                  placeholder="Select blood type"
                  className="w-full transition-all duration-300"
                  selectedKeys={filters.bloodType ? [filters.bloodType] : []}
                  onChange={(e) => handleApplyFilters({...filters, bloodType: e.target.value})}
                >
                  {bloodTypes.map((type) => (
                    <SelectItem key={type.key}>{type.label}</SelectItem>
                  ))}
                </Select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Priority
                </label>
                <Select
                  placeholder="Select priority"
                  className="w-full transition-all duration-300"
                  selectedKeys={filters.priority ? [filters.priority] : []}
                  onChange={(e) => handleApplyFilters({...filters, priority: e.target.value})}
                >
                  {statusOptions.map((status) => (
                    <SelectItem key={status.key}>{status.label}</SelectItem>
                  ))}
                </Select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Status
                </label>
                <Select
                  placeholder="Select status"
                  className="w-full transition-all duration-300"
                  selectedKeys={filters.status ? [filters.status] : []}
                  onChange={(e) => handleApplyFilters({...filters, status: e.target.value})}
                >
                  <SelectItem key="Open">Open</SelectItem>
                  <SelectItem key="Closed">Closed</SelectItem>
                </Select>
              </div>
            </div>
          </ModalBody>
          <ModalFooter>
            <Button
              variant="bordered"
              onPress={() => setOpenQuickFilter(false)}
              className="border-gray-300 transition-all duration-300 hover:bg-gray-50"
            >
              Close
            </Button>
            <Button
              onPress={() => {
                handleClearFilters();
                setOpenQuickFilter(false);
              }}
              className="bg-gray-100 text-gray-700 hover:bg-gray-200 transition-all duration-300"
            >
              Clear Filters
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </div>
  );
}