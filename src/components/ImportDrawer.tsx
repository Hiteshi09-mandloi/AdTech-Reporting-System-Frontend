import React, { useState, useEffect, useRef } from "react";
import {
  Upload,
  Button,
  message,
  Typography,
  Space,
  Divider,
  Progress,
  Drawer,
} from "antd";
import { FileTextOutlined } from "@ant-design/icons";
import type { RcFile, UploadFile, UploadProps } from "antd/es/upload";
import { uploadCsvData, ImportProgress, getImportProgress } from "../api";

const { Text } = Typography;
const { Dragger } = Upload;

// --- Constants ---
export const EXPECTED_HEADERS = [
  "timestamp", // Date
  "mobile_app_resolved_id", // App ID
  "mobile_app_name", // App Name
  "domain", // Domain
  "ad_unit_name", // Ad Unit
  "ad_unit_id", // Ad Unit ID
  "inventory_format_name", // Inventory Format
  "operating_system_version_name", // OS Version
  "ad_exchange_total_requests", // Total Requests
  "ad_exchange_responses_served", // Responses Served
  "ad_exchange_match_rate", // Match Rate
  "ad_exchange_line_item_level_impressions", // Impressions
  "ad_exchange_line_item_level_clicks", // Clicks
  "ad_exchange_line_item_level_ctr", // CTR
  "average_ecpm", // Average eCPM
  "payout", // Payout
];

// Mapping for user-friendly display names
const HEADER_DISPLAY_NAMES: { [key: string]: string } = {
  timestamp: "Date",
  mobile_app_resolved_id: "App ID",
  mobile_app_name: "App Name",
  domain: "Domain",
  ad_unit_name: "Ad Unit",
  ad_unit_id: "Ad Unit ID",
  inventory_format_name: "Inventory Format",
  operating_system_version_name: "OS Version",
  ad_exchange_total_requests: "Total Requests",
  ad_exchange_responses_served: "Responses Served",
  ad_exchange_match_rate: "Match Rate",
  ad_exchange_line_item_level_impressions: "Impressions",
  ad_exchange_line_item_level_clicks: "Clicks",
  ad_exchange_line_item_level_ctr: "CTR",
  average_ecpm: "Average eCPM",
  payout: "Payout",
};

// --- File validation function ---
const validateFile = async (file: RcFile): Promise<boolean> => {
  try {
    const text = await file.text();
    const firstLine = text.split("\n")[0].trim();
    const headers = firstLine.split(",").map((h) => h.trim().toLowerCase());

    const isValid = EXPECTED_HEADERS.every((h) => headers.includes(h));
    if (!isValid) {
      throw new Error(
        "Invalid file headers. Please upload a file with correct headers."
      );
    }
    return true;
  } catch (error) {
    throw error;
  }
};

interface ImportDrawerProps {
  open: boolean;
  onClose: () => void;
  onImportComplete?: () => void;
}

export default function ImportDrawer({
  open,
  onClose,
  onImportComplete,
}: ImportDrawerProps) {
  const [fileList, setFileList] = useState<UploadFile[]>([]);
  const [uploading, setUploading] = useState(false);
  const [showHeaders, setShowHeaders] = useState(false);
  const [jobId, setJobId] = useState<string | null>(null);
  const [progress, setProgress] = useState<ImportProgress | null>(null);

  // Use useRef to store the interval ID to prevent it from being lost on re-renders
  const progressIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const selectedFile = fileList.length > 0 ? fileList[0] : null;

  // Cleanup interval on unmount
  useEffect(() => {
    return () => {
      if (progressIntervalRef.current) {
        clearInterval(progressIntervalRef.current);
        progressIntervalRef.current = null;
      }
    };
  }, []);

  // Function to stop polling
  const stopProgressPolling = () => {
    if (progressIntervalRef.current) {
      clearInterval(progressIntervalRef.current);
      progressIntervalRef.current = null;
    }
  };

  // Poll progress
  const startProgressPolling = (jobId: string) => {
    // Clear any existing interval first
    stopProgressPolling();

    progressIntervalRef.current = setInterval(async () => {
      try {
        console.log(`Polling progress for job ${jobId}...`); // Debug log
        const progressData = await getImportProgress(jobId);
        console.log("Progress data:", progressData); // Debug log
        setProgress(progressData);

        // Stop polling when completed or failed
        if (progressData.currentPhase === "Completed") {
          console.log("Import completed, stopping polling");
          stopProgressPolling();
          setUploading(false);
          message.success("Import completed successfully!");

          // Call the callback to refresh dashboard data
          if (onImportComplete) {
            onImportComplete();
          }
        }
      } catch (error) {
        console.error("Progress polling failed:", error);
        stopProgressPolling();
        setUploading(false);
        message.error("Failed to track progress. Import may still be running.");
      }
    }, 1000); // Poll every 1 second for more responsive UI
  };

  const handleUpload = async () => {
    if (!selectedFile || !selectedFile.originFileObj) {
      message.warning("Please select a CSV file to upload first.");
      return;
    }

    setUploading(true);
    setProgress(null);
    setJobId(null);

    try {
      const response = await uploadCsvData(selectedFile.originFileObj as File);

      // Extract job ID from response (e.g., "CSV import started successfully with job ID: 123")
      const jobIdMatch = response.match(/job ID: (\d+)/);
      if (jobIdMatch) {
        const newJobId = jobIdMatch[1];
        setJobId(newJobId);
        message.success("Upload started! Tracking progress...");

        // Start polling after a short delay to give the backend time to initialize
        setTimeout(() => {
          startProgressPolling(newJobId);
        }, 1000);
      } else {
        throw new Error("Could not extract job ID from response");
      }

      setFileList([]);
    } catch (error: any) {
      console.error("File upload failed:", error);
      message.error(error.message || "File upload failed. Please try again.");
      setUploading(false);
    }
  };

  const uploadProps: UploadProps = {
    onChange: ({ fileList: newFileList }: { fileList: UploadFile[] }) => {
      const latestFile = newFileList[0];

      if (newFileList.length === 0) {
        setFileList([]);
        return;
      }

      if (latestFile.status === "done" || latestFile.status === "error") {
        if (latestFile.status === "done") {
          setFileList([latestFile]);
        } else {
          setFileList([]);
        }
      } else {
        setFileList([latestFile]);
      }
    },

    beforeUpload: async (file: RcFile) => {
      try {
        const isValid = await validateFile(file);
        if (isValid) {
          message.success(`${file.name} selected successfully.`);
          return Promise.resolve(file);
        }
        return Promise.reject("File validation failed.");
      } catch (error: any) {
        message.error(
          error.message || "File validation failed. Please check file headers."
        );
        return Promise.reject(error);
      }
    },

    fileList,
    accept: ".csv",
    maxCount: 1,
  };

  const handleClose = () => {
    // Only reset UI state, keep progress state if upload is in progress
    setFileList([]);
    setShowHeaders(false);

    // Only reset progress state if the upload is actually completed or there's no active job
    if (!uploading && (!progress || progress.currentPhase === "Completed")) {
      stopProgressPolling();
      setProgress(null);
      setJobId(null);
      setUploading(false);
    }

    onClose();
  };

  return (
    <Drawer
      title="Import Ad Report Data"
      placement="right"
      width={800}
      onClose={handleClose}
      open={open}
      styles={{
        body: { padding: "24px" },
      }}
    >
      <Space direction="vertical" style={{ width: "100%" }} size="large">
        <Text>
          To begin, please upload your ad report CSV file. The file must contain
          all of the following columns:
        </Text>

        <Button
          onClick={() => setShowHeaders(!showHeaders)}
          type="link"
          style={{ padding: 0 }}
        >
          {showHeaders ? "Hide Required Headers" : "Show Required Headers"}
        </Button>

        {showHeaders && (
          <>
            <Divider orientation="left" style={{ margin: "8px 0" }}>
              Required Headers
            </Divider>
            <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
              {EXPECTED_HEADERS.map((header: string, index: number) => (
                <Text
                  code
                  key={index}
                  style={{
                    padding: "4px 8px",
                    borderRadius: "4px",
                    border: "1px solid #434343",
                    backgroundColor: "#262626",
                    color: "#1890ff",
                  }}
                >
                  {HEADER_DISPLAY_NAMES[header] || header}
                </Text>
              ))}
            </div>
          </>
        )}

        <Dragger {...uploadProps} disabled={uploading}>
          <p className="ant-upload-drag-icon">
            <FileTextOutlined />
          </p>
          <p className="ant-upload-text">
            Click or drag CSV file to this area to upload
          </p>
          <p className="ant-upload-hint">
            Support for a single CSV file upload. Files will be validated before
            they are uploaded.
          </p>
        </Dragger>

        {/* Enhanced Progress Section with Full Dark Theme */}
        {progress && (
          <div
            style={{
              marginTop: "16px",
              backgroundColor: "#1f1f1f",
              padding: "16px",
              borderRadius: "8px",
              border: "1px solid #303030",
            }}
          >
            <Space direction="vertical" style={{ width: "100%" }} size="small">
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                }}
              >
                <Text strong style={{ color: "#ffffff" }}>
                  Import Progress
                </Text>
                <Text style={{ fontSize: "12px", color: "#8c8c8c" }}>
                  Job ID: {jobId}
                </Text>
              </div>

              {/* Main Progress Bar with precise percentage */}
              <Progress
                percent={progress.progressPercentage}
                status={
                  progress.progressPercentage === 100 ? "success" : "active"
                }
                strokeColor={{
                  "0%": "#108ee9",
                  "30%": "#1890ff",
                  "60%": "#52c41a",
                  "100%": "#87d068",
                }}
                trailColor="#262626"
                format={(percent) => `${percent}%`}
                strokeWidth={8}
              />

              {/* Current Phase Display */}
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                  marginTop: "8px",
                  padding: "8px 12px",
                  backgroundColor: "#141414",
                  borderRadius: "6px",
                  border: "1px solid #434343",
                }}
              >
                <Text strong style={{ color: "#1890ff", fontSize: "14px" }}>
                  🔄 {progress.currentPhase}
                </Text>
              </div>

              {/* Statistics Grid */}
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))",
                  gap: "12px",
                  marginTop: "12px",
                }}
              >
                <div
                  style={{
                    textAlign: "center",
                    padding: "12px 8px",
                    backgroundColor: "#141414",
                    borderRadius: "6px",
                    border: "1px solid #434343",
                  }}
                >
                  <Text
                    style={{
                      fontSize: "11px",
                      display: "block",
                      color: "#8c8c8c",
                      marginBottom: "4px",
                    }}
                  >
                    Total Records
                  </Text>
                  <Text strong style={{ color: "#1890ff", fontSize: "16px" }}>
                    {progress.totalRecords.toLocaleString()}
                  </Text>
                </div>

                <div
                  style={{
                    textAlign: "center",
                    padding: "12px 8px",
                    backgroundColor: "#141414",
                    borderRadius: "6px",
                    border: "1px solid #434343",
                  }}
                >
                  <Text
                    style={{
                      fontSize: "11px",
                      display: "block",
                      color: "#8c8c8c",
                      marginBottom: "4px",
                    }}
                  >
                    Processed
                  </Text>
                  <Text strong style={{ color: "#722ed1", fontSize: "16px" }}>
                    {progress.processedRecords.toLocaleString()}
                  </Text>
                </div>

                <div
                  style={{
                    textAlign: "center",
                    padding: "12px 8px",
                    backgroundColor: "#141414",
                    borderRadius: "6px",
                    border: "1px solid #434343",
                  }}
                >
                  <Text
                    style={{
                      fontSize: "11px",
                      display: "block",
                      color: "#8c8c8c",
                      marginBottom: "4px",
                    }}
                  >
                    Saved
                  </Text>
                  <Text strong style={{ color: "#52c41a", fontSize: "16px" }}>
                    {progress.savedRecords.toLocaleString()}
                  </Text>
                </div>

                {progress.errorRecords > 0 && (
                  <div
                    style={{
                      textAlign: "center",
                      padding: "12px 8px",
                      backgroundColor: "#2a1215",
                      borderRadius: "6px",
                      border: "1px solid #a8071a",
                    }}
                  >
                    <Text
                      style={{
                        fontSize: "11px",
                        display: "block",
                        color: "#ff7875",
                        marginBottom: "4px",
                      }}
                    >
                      Errors
                    </Text>
                    <Text strong style={{ color: "#ff4d4f", fontSize: "16px" }}>
                      {progress.errorRecords.toLocaleString()}
                    </Text>
                  </div>
                )}
              </div>

              {/* Processing Rate */}
              {progress.totalRecords > 0 && progress.processedRecords > 0 && (
                <div
                  style={{
                    textAlign: "center",
                    marginTop: "12px",
                    padding: "8px",
                    backgroundColor: "#262626",
                    borderRadius: "4px",
                  }}
                >
                  <Text style={{ fontSize: "12px", color: "#bfbfbf" }}>
                    Processing Rate:{" "}
                    <span style={{ color: "#ffffff", fontWeight: "600" }}>
                      {(
                        (progress.processedRecords / progress.totalRecords) *
                        100
                      ).toFixed(1)}
                      % completed
                    </span>
                  </Text>
                </div>
              )}

              {/* Phase Progress Indicators */}
              <div style={{ marginTop: "16px" }}>
                <Text
                  style={{
                    fontSize: "12px",
                    fontWeight: "600",
                    marginBottom: "12px",
                    display: "block",
                    color: "#ffffff",
                  }}
                >
                  📊 Progress Phases:
                </Text>
                <div
                  style={{
                    display: "flex",
                    flexWrap: "wrap",
                    gap: "8px",
                    padding: "12px",
                    backgroundColor: "#262626",
                    borderRadius: "6px",
                    border: "1px solid #434343",
                  }}
                >
                  {[
                    {
                      phase: "File uploaded, starting processing...",
                      range: "10%",
                      icon: "📤",
                    },
                    {
                      phase: "Reading and validating file headers...",
                      range: "20%",
                      icon: "🔍",
                    },
                    {
                      phase: "Counting total records...",
                      range: "30%",
                      icon: "📊",
                    },
                    {
                      phase: "Processing records...",
                      range: "40-80%",
                      icon: "⚙️",
                    },
                    {
                      phase: "Saving to database...",
                      range: "90%",
                      icon: "💾",
                    },
                    { phase: "Completed", range: "100%", icon: "✅" },
                  ].map((step, index) => {
                    const isCurrentStep = progress.currentPhase === step.phase;
                    const isCompletedStep =
                      (step.phase === "File uploaded, starting processing..." &&
                        progress.progressPercentage >= 10) ||
                      (step.phase ===
                        "Reading and validating file headers..." &&
                        progress.progressPercentage >= 20) ||
                      (step.phase === "Counting total records..." &&
                        progress.progressPercentage >= 30) ||
                      (step.phase === "Processing records..." &&
                        progress.progressPercentage >= 40) ||
                      (step.phase === "Saving to database..." &&
                        progress.progressPercentage >= 90) ||
                      (step.phase === "Completed" &&
                        progress.progressPercentage === 100);

                    return (
                      <div
                        key={index}
                        style={{
                          padding: "8px 12px",
                          borderRadius: "6px",
                          fontSize: "11px",
                          fontWeight: "600",
                          backgroundColor: isCurrentStep
                            ? "#1890ff"
                            : isCompletedStep
                            ? "#52c41a"
                            : "#434343",
                          color:
                            isCurrentStep || isCompletedStep
                              ? "#ffffff"
                              : "#8c8c8c",
                          border: isCurrentStep
                            ? "2px solid #40a9ff"
                            : "1px solid transparent",
                          boxShadow: isCurrentStep
                            ? "0 2px 8px rgba(24,144,255,0.4)"
                            : "none",
                          transition: "all 0.3s ease",
                          display: "flex",
                          alignItems: "center",
                          gap: "6px",
                          minWidth: "fit-content",
                        }}
                      >
                        <span style={{ fontSize: "12px" }}>{step.icon}</span>
                        <span>{step.range}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </Space>
          </div>
        )}

        <Button
          type="primary"
          onClick={handleUpload}
          disabled={!selectedFile || uploading}
          loading={uploading}
          style={{ marginTop: "16px", width: "100%" }}
          size="large"
        >
          {uploading ? "Processing..." : "Start Upload"}
        </Button>
      </Space>
    </Drawer>
  );
}
