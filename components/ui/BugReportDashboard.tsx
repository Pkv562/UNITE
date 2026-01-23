"use client";

import { useState, useEffect } from "react";
import {
  Table,
  TableHeader,
  TableColumn,
  TableBody,
  TableRow,
  TableCell,
} from "@heroui/table";
import { Chip } from "@heroui/chip";
import { Button } from "@heroui/button";
import { Select, SelectItem } from "@heroui/select";
import { Modal, ModalContent, ModalHeader, ModalBody, ModalFooter } from "@heroui/modal";
import { fetchJsonWithAuth } from "@/utils/fetchWithAuth";
import { format } from "date-fns";

/**
 * BugReportDashboard - Admin view for managing bug reports
 * 
 * Features:
 * - List all bug reports with filtering
 * - View details including images
 * - Update status and priority
 * - Assign to admins
 * - Add admin notes
 */
export default function BugReportDashboard() {
  const [reports, setReports] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedReport, setSelectedReport] = useState<any | null>(null);
  const [detailsModalOpen, setDetailsModalOpen] = useState(false);
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [imageUrls, setImageUrls] = useState<Record<string, string>>({});
  const [loadingImages, setLoadingImages] = useState(false);

  useEffect(() => {
    loadBugReports();
  }, [statusFilter]);

  const loadBugReports = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (statusFilter !== "all") {
        params.append("status", statusFilter);
      }
      params.append("limit", "50");
      params.append("sortBy", "createdAt");
      params.append("sortOrder", "desc");

      const response = await fetchJsonWithAuth(`/api/utility/bug-reports?${params.toString()}`);
      
      if (response.success && response.data) {
        setReports(response.data);
      }
    } catch (error: any) {
      console.error("Failed to load bug reports:", error);
    } finally {
      setLoading(false);
    }
  };

  const updateReportStatus = async (reportId: string, newStatus: string) => {
    try {
      const response = await fetchJsonWithAuth(`/api/utility/bug-reports/${reportId}`, {
        method: 'PUT',
        body: JSON.stringify({ Status: newStatus })
      });

      if (response.success) {
        loadBugReports();
        if (selectedReport?.Report_ID === reportId) {
          setSelectedReport(response.data);
        }
      }
    } catch (error: any) {
      console.error("Failed to update status:", error);
    }
  };

  const loadImageUrls = async (imageKeys: any[]) => {
    if (!imageKeys || imageKeys.length === 0) return;
    
    setLoadingImages(true);
    const urls: Record<string, string> = {};
    
    try {
      for (const img of imageKeys) {
        if (img.key) {
          const response = await fetchJsonWithAuth(`/api/files/signed-url?key=${encodeURIComponent(img.key)}&expires=3600`);
          if (response.success && response.data?.url) {
            urls[img.key] = response.data.url;
          }
        }
      }
      setImageUrls(urls);
    } catch (error: any) {
      console.error("Failed to load image URLs:", error);
    } finally {
      setLoadingImages(false);
    }
  };

  useEffect(() => {
    if (selectedReport && selectedReport.Image_Keys) {
      loadImageUrls(selectedReport.Image_Keys);
    }
  }, [selectedReport]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Open": return "danger";
      case "In Progress": return "warning";
      case "Resolved": return "success";
      case "Closed": return "default";
      case "Cannot Reproduce": return "secondary";
      default: return "default";
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "Critical": return "danger";
      case "High": return "warning";
      case "Medium": return "primary";
      case "Low": return "default";
      default: return "default";
    }
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Bug Reports</h1>
        <Select
          label="Filter by Status"
          selectedKeys={[statusFilter]}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="w-48"
        >
          <SelectItem key="all">All</SelectItem>
          <SelectItem key="Open">Open</SelectItem>
          <SelectItem key="In Progress">In Progress</SelectItem>
          <SelectItem key="Resolved">Resolved</SelectItem>
          <SelectItem key="Closed">Closed</SelectItem>
          <SelectItem key="Cannot Reproduce">Cannot Reproduce</SelectItem>
        </Select>
      </div>

      <Table aria-label="Bug reports table">
        <TableHeader>
          <TableColumn>Report ID</TableColumn>
          <TableColumn>Reporter</TableColumn>
          <TableColumn>Description</TableColumn>
          <TableColumn>Status</TableColumn>
          <TableColumn>Priority</TableColumn>
          <TableColumn>Created</TableColumn>
          <TableColumn>Actions</TableColumn>
        </TableHeader>
        <TableBody
          isLoading={loading}
          emptyContent="No bug reports found"
        >
          {reports.map((report) => (
            <TableRow key={report.Report_ID}>
              <TableCell className="font-mono text-xs">{report.Report_ID}</TableCell>
              <TableCell>{report.Reporter_Name}</TableCell>
              <TableCell className="max-w-xs truncate">{report.Description}</TableCell>
              <TableCell>
                <Chip color={getStatusColor(report.Status)} size="sm" variant="flat">
                  {report.Status}
                </Chip>
              </TableCell>
              <TableCell>
                <Chip color={getPriorityColor(report.Priority)} size="sm" variant="dot">
                  {report.Priority}
                </Chip>
              </TableCell>
              <TableCell>
                {format(new Date(report.createdAt), "MMM dd, yyyy HH:mm")}
              </TableCell>
              <TableCell>
                <Button
                  size="sm"
                  variant="flat"
                  onPress={() => {
                    setSelectedReport(report);
                    setDetailsModalOpen(true);
                  }}
                >
                  View
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      {/* Details Modal */}
      <Modal
        isOpen={detailsModalOpen}
        onClose={() => setDetailsModalOpen(false)}
        size="3xl"
        scrollBehavior="inside"
      >
        <ModalContent>
          {(onClose) => (
            <>
              <ModalHeader>Bug Report Details</ModalHeader>
              <ModalBody>
                {selectedReport && (
                  <div className="space-y-4">
                    <div>
                      <p className="text-sm text-default-500">Report ID</p>
                      <p className="font-mono">{selectedReport.Report_ID}</p>
                    </div>
                    
                    <div>
                      <p className="text-sm text-default-500">Reporter</p>
                      <p>{selectedReport.Reporter_Name} ({selectedReport.Reporter_Email})</p>
                    </div>

                    <div>
                      <p className="text-sm text-default-500">Description</p>
                      <p className="whitespace-pre-wrap">{selectedReport.Description}</p>
                    </div>

                    {selectedReport.Image_Keys && selectedReport.Image_Keys.length > 0 && (
                      <div>
                        <p className="text-sm text-default-500 mb-3">Screenshots ({selectedReport.Image_Keys.length})</p>
                        {loadingImages ? (
                          <div className="text-sm text-default-400">Loading images...</div>
                        ) : (
                          <div className="grid grid-cols-2 gap-4">
                            {selectedReport.Image_Keys.map((img: any, index: number) => {
                              const imageUrl = imageUrls[img.key];
                              return (
                                <div key={index} className="border rounded-lg overflow-hidden">
                                  {imageUrl ? (
                                    <a 
                                      href={imageUrl} 
                                      target="_blank" 
                                      rel="noopener noreferrer"
                                      className="block group relative"
                                    >
                                      <img 
                                        src={imageUrl} 
                                        alt={img.filename}
                                        className="w-full h-48 object-cover group-hover:opacity-90 transition-opacity"
                                      />
                                      <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-10 transition-all flex items-center justify-center">
                                        <span className="text-white opacity-0 group-hover:opacity-100 text-sm font-medium">
                                          Click to open
                                        </span>
                                      </div>
                                    </a>
                                  ) : (
                                    <div className="w-full h-48 bg-default-100 flex items-center justify-center">
                                      <span className="text-sm text-default-400">Image unavailable</span>
                                    </div>
                                  )}
                                  <div className="p-2 bg-default-50">
                                    <p className="text-xs text-default-600 truncate">{img.filename}</p>
                                    {img.size && (
                                      <p className="text-xs text-default-400">
                                        {(img.size / 1024 / 1024).toFixed(2)} MB
                                      </p>
                                    )}
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    )}

                    <div className="flex gap-4">
                      <div className="flex-1">
                        <p className="text-sm text-default-500">Status</p>
                        <Select
                          selectedKeys={[selectedReport.Status]}
                          onChange={(e) => updateReportStatus(selectedReport.Report_ID, e.target.value)}
                        >
                          <SelectItem key="Open">Open</SelectItem>
                          <SelectItem key="In Progress">In Progress</SelectItem>
                          <SelectItem key="Resolved">Resolved</SelectItem>
                          <SelectItem key="Closed">Closed</SelectItem>
                          <SelectItem key="Cannot Reproduce">Cannot Reproduce</SelectItem>
                        </Select>
                      </div>
                      <div className="flex-1">
                        <p className="text-sm text-default-500">Priority</p>
                        <Chip color={getPriorityColor(selectedReport.Priority)} variant="flat">
                          {selectedReport.Priority}
                        </Chip>
                      </div>
                    </div>

                    {selectedReport.Page_URL && (
                      <div>
                        <p className="text-sm text-default-500">Page URL</p>
                        <a href={selectedReport.Page_URL} target="_blank" rel="noopener noreferrer" className="text-primary text-sm hover:underline">
                          {selectedReport.Page_URL}
                        </a>
                      </div>
                    )}

                    {selectedReport.Admin_Notes && (
                      <div>
                        <p className="text-sm text-default-500">Admin Notes</p>
                        <p className="text-sm">{selectedReport.Admin_Notes}</p>
                      </div>
                    )}
                  </div>
                )}
              </ModalBody>
              <ModalFooter>
                <Button color="primary" onPress={onClose}>
                  Close
                </Button>
              </ModalFooter>
            </>
          )}
        </ModalContent>
      </Modal>
    </div>
  );
}
