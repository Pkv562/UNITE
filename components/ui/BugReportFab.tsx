"use client";

import { useState, useRef } from "react";
import { Modal, ModalContent, ModalHeader, ModalBody, ModalFooter } from "@heroui/modal";
import { Button } from "@heroui/button";
import { Textarea } from "@heroui/input";
import { motion, AnimatePresence } from "framer-motion";
import { fetchJsonWithAuth, fetchWithAuth } from "@/utils/fetchWithAuth";

/**
 * BugReportFab - Floating Action Button for Bug Reporting
 * 
 * A persistent circular button in the bottom-right corner that opens a modal
 * for users to report bugs with descriptions and image attachments.
 * 
 * Features:
 * - Client-side S3 upload using presigned URLs
 * - Multiple image support (up to 5 images)
 * - Animated FAB with Framer Motion
 * - Integrates with existing backend API
 */
export default function BugReportFab() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [description, setDescription] = useState("");
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const MAX_FILES = 5;
  const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB per file

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    
    // Validate file count
    if (selectedFiles.length + files.length > MAX_FILES) {
      setError(`Maximum ${MAX_FILES} images allowed`);
      return;
    }

    // Validate file sizes and types
    const validFiles = files.filter(file => {
      if (file.size > MAX_FILE_SIZE) {
        setError(`File ${file.name} exceeds 5MB limit`);
        return false;
      }
      if (!file.type.startsWith('image/')) {
        setError(`File ${file.name} is not an image`);
        return false;
      }
      return true;
    });

    setSelectedFiles([...selectedFiles, ...validFiles]);
    setError(null);
  };

  const removeFile = (index: number) => {
    setSelectedFiles(selectedFiles.filter((_, i) => i !== index));
  };

  const uploadToS3 = async (file: File): Promise<{ key: string; filename: string; contentType: string; size: number } | null> => {
    try {
      // Get presigned URL from backend
      const presignResponse = await fetchWithAuth('/api/files/presign', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          filename: file.name,
          contentType: file.type,
          key: `bug-reports/${Date.now()}_${file.name}`
        })
      });

      if (!presignResponse.ok) {
        throw new Error('Failed to get upload URL');
      }

      const presignJson = await presignResponse.json();
      const { uploadUrl, key } = presignJson.data || presignJson;

      if (!uploadUrl) {
        throw new Error('Presign response missing uploadUrl');
      }

      // Upload file directly to S3
      const uploadResponse = await fetch(uploadUrl, {
        method: 'PUT',
        headers: {
          'Content-Type': file.type
        },
        body: file
      });

      if (!uploadResponse.ok) {
        throw new Error('Failed to upload to S3');
      }

      return {
        key,
        filename: file.name,
        contentType: file.type,
        size: file.size
      };
    } catch (error: any) {
      console.error('S3 upload error:', error);
      setError(`Failed to upload ${file.name}: ${error.message}`);
      return null;
    }
  };

  const handleSubmit = async () => {
    // Validation
    if (!description.trim()) {
      setError('Please describe the bug');
      return;
    }

    setIsSubmitting(true);
    setError(null);
    setSuccess(null);

    try {
      // Upload images to S3 first
      const uploadedImages = [];
      if (selectedFiles.length > 0) {
        const uploadPromises = selectedFiles.map(file => uploadToS3(file));
        const results = await Promise.all(uploadPromises);
        
        // Filter out failed uploads
        for (const result of results) {
          if (result) {
            uploadedImages.push(result);
          }
        }
      }

      // Submit bug report to backend
      const reportData = {
        description: description.trim(),
        imageKeys: uploadedImages,
        userAgent: navigator.userAgent,
        pageUrl: window.location.href,
        priority: 'Medium'
      };

      const response = await fetchJsonWithAuth('/api/utility/bug-reports', {
        method: 'POST',
        body: JSON.stringify(reportData)
      });

      if (response.success) {
        setSuccess('Bug report submitted successfully! Our team will review it soon.');
        setDescription('');
        setSelectedFiles([]);
        
        // Close modal after 2 seconds
        setTimeout(() => {
          setIsModalOpen(false);
          setSuccess(null);
        }, 2000);
      } else {
        setError(response.message || 'Failed to submit bug report');
      }
    } catch (error: any) {
      console.error('Bug report submission error:', error);
      setError(error.message || 'An error occurred while submitting the bug report');
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetModal = () => {
    setDescription('');
    setSelectedFiles([]);
    setError(null);
    setSuccess(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <>
      {/* Floating Action Button */}
      <AnimatePresence>
        <motion.div
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0, opacity: 0 }}
          transition={{ type: "spring", stiffness: 260, damping: 20 }}
          style={{
            position: 'fixed',
            bottom: '24px',
            right: '24px',
            zIndex: 9999
          }}
        >
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={() => setIsModalOpen(true)}
            className="w-12 h-12 rounded-full bg-danger text-white shadow-lg flex items-center justify-center hover:shadow-xl transition-shadow"
            aria-label="Report a bug"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={2}
              stroke="currentColor"
              className="w-5 h-5"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M12 12.75c1.148 0 2.278.08 3.383.237 1.037.146 1.866.966 1.866 2.013 0 3.728-2.35 6.75-5.25 6.75S6.75 18.728 6.75 15c0-1.046.83-1.867 1.866-2.013A24.204 24.204 0 0112 12.75zm0 0c2.883 0 5.647.508 8.207 1.44a23.91 23.91 0 01-1.152 6.06M12 12.75c-2.883 0-5.647.508-8.208 1.44.125 2.104.52 4.136 1.153 6.06M12 12.75a2.25 2.25 0 002.248-2.354M12 12.75a2.25 2.25 0 01-2.248-2.354M12 8.25c.995 0 1.971-.08 2.922-.236.403-.066.74-.358.795-.762a3.778 3.778 0 00-.399-2.25M12 8.25c-.995 0-1.97-.08-2.922-.236-.402-.066-.74-.358-.795-.762a3.734 3.734 0 01.4-2.253M12 8.25a2.25 2.25 0 00-2.248 2.146M12 8.25a2.25 2.25 0 012.248 2.146M8.683 5a6.032 6.032 0 01-1.155-1.002c.07-.63.27-1.222.574-1.747m.581 2.749A3.75 3.75 0 0115.318 5m0 0c.427-.283.815-.62 1.155-.999a4.471 4.471 0 00-.575-1.752M4.921 6a24.048 24.048 0 00-.392 3.314c1.668.546 3.416.914 5.223 1.082M19.08 6c.205 1.08.337 2.187.392 3.314a23.882 23.882 0 01-5.223 1.082"
              />
            </svg>
          </motion.button>
        </motion.div>
      </AnimatePresence>

      {/* Bug Report Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          resetModal();
        }}
        size="2xl"
        scrollBehavior="inside"
        backdrop="blur"
      >
        <ModalContent>
          {(onClose) => (
            <>
              <ModalHeader className="flex flex-col gap-1">
                <h2 className="text-2xl font-bold">Report a Bug</h2>
                <p className="text-sm text-default-500">
                  Help us improve by reporting issues you encounter
                </p>
              </ModalHeader>
              <ModalBody>
                {/* Error Message */}
                {error && (
                  <div className="p-3 rounded-lg bg-danger-50 border border-danger-200 text-danger-700 text-sm">
                    {error}
                  </div>
                )}

                {/* Success Message */}
                {success && (
                  <div className="p-3 rounded-lg bg-success-50 border border-success-200 text-success-700 text-sm">
                    {success}
                  </div>
                )}

                {/* Description Input */}
                <Textarea
                  label="Bug Description"
                  placeholder="Please describe the bug in detail. What were you doing? What happened? What did you expect to happen?"
                  value={description}
                  onValueChange={setDescription}
                  minRows={6}
                  maxRows={12}
                  isRequired
                  classNames={{
                    input: "resize-y"
                  }}
                />

                {/* File Upload */}
                <div className="space-y-2">
                  <label className="text-sm font-medium text-default-700">
                    Screenshots (Optional)
                  </label>
                  <p className="text-xs text-default-500">
                    Upload up to {MAX_FILES} images (max 5MB each)
                  </p>
                  
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={handleFileSelect}
                    className="hidden"
                    id="bug-report-file-input"
                  />
                  
                  <Button
                    color="default"
                    variant="bordered"
                    onPress={() => fileInputRef.current?.click()}
                    isDisabled={selectedFiles.length >= MAX_FILES}
                  >
                    Choose Images
                  </Button>

                  {/* Selected Files Preview */}
                  {selectedFiles.length > 0 && (
                    <div className="space-y-2 mt-3">
                      {selectedFiles.map((file, index) => (
                        <div
                          key={index}
                          className="flex items-center justify-between p-2 rounded-lg border border-default-200 bg-default-50"
                        >
                          <div className="flex items-center gap-2 flex-1 min-w-0">
                            <svg
                              xmlns="http://www.w3.org/2000/svg"
                              fill="none"
                              viewBox="0 0 24 24"
                              strokeWidth={1.5}
                              stroke="currentColor"
                              className="w-5 h-5 text-default-400 flex-shrink-0"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 001.5-1.5V6a1.5 1.5 0 00-1.5-1.5H3.75A1.5 1.5 0 002.25 6v12a1.5 1.5 0 001.5 1.5zm10.5-11.25h.008v.008h-.008V8.25zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z"
                              />
                            </svg>
                            <span className="text-sm truncate">{file.name}</span>
                            <span className="text-xs text-default-400 flex-shrink-0">
                              ({(file.size / 1024 / 1024).toFixed(2)} MB)
                            </span>
                          </div>
                          <Button
                            isIconOnly
                            size="sm"
                            variant="light"
                            color="danger"
                            onPress={() => removeFile(index)}
                          >
                            <svg
                              xmlns="http://www.w3.org/2000/svg"
                              fill="none"
                              viewBox="0 0 24 24"
                              strokeWidth={2}
                              stroke="currentColor"
                              className="w-4 h-4"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                d="M6 18L18 6M6 6l12 12"
                              />
                            </svg>
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </ModalBody>
              <ModalFooter>
                <Button
                  color="danger"
                  variant="light"
                  onPress={() => {
                    onClose();
                    resetModal();
                  }}
                  isDisabled={isSubmitting}
                >
                  Cancel
                </Button>
                <Button
                  color="primary"
                  onPress={handleSubmit}
                  isLoading={isSubmitting}
                  isDisabled={!description.trim() || isSubmitting}
                >
                  {isSubmitting ? 'Submitting...' : 'Submit Bug Report'}
                </Button>
              </ModalFooter>
            </>
          )}
        </ModalContent>
      </Modal>
    </>
  );
}
