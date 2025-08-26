import React, { useState, useEffect, useRef } from "react";
import {
 Upload,
 Button,
 Typography,
 Space,
 Divider,
 Progress,
 Drawer,
 App,
} from "antd";
import { FileTextOutlined } from "@ant-design/icons";
import type { RcFile, UploadFile, UploadProps } from "antd/es/upload";
import { uploadCsvData, ImportProgress, getImportProgress } from "../api";

const { Text } = Typography;
const { Dragger } = Upload;

// --- Constants ---
// 11 Required Dimensions
export const REQUIRED_DIMENSIONS = [
 "date", // Date
 "mobile_app_resolved_id", // Mobile App Resolved ID
 "mobile_app_name", // Mobile App Name
 "ad_unit_name", // Ad Unit Name
 "inventory_format_name", // Inventory Format Name
 "domain", // Domain
 "operating_system_version_name", // Operating System Version Name
 "operating_system_name", // Operating System Name
 "country_name", // Country Name
 "country_criteria_id", // Country Criteria ID
 "ad_unit_id", // Ad Unit ID
];

// 8 Metrics
export const METRICS = [
 "ad_exchange_total_requests", // AD Exchange Total Requests
 "ad_exchange_responses_served", // AD Exchange Responses Served
 "ad_exchange_line_item_level_impressions", // AD Exchange Line Item Level Impressions
 "ad_exchange_line_item_level_clicks", // AD Exchange Line Item Level Clicks
 "average_ecpm", // Average eCPM
 "payout", // Payout
 "ad_exchange_cost_per_click", // AD Exchange Cost Per Click
 "ad_exchange_line_item_level_ctr", // AD Exchange Line Item Level CTR
 "ad_exchange_match_rate", // AD Exchange Match Rate
];

// All expected headers (dimensions + metrics)
export const EXPECTED_HEADERS = [
 ...REQUIRED_DIMENSIONS,
 ...METRICS,
];

// Mapping for user-friendly display names
const HEADER_DISPLAY_NAMES: { [key: string]: string } = {
 // Dimensions
 date: "Date",
 mobile_app_resolved_id: "App ID",
 mobile_app_name: "App Name",
 domain: "Domain",
 ad_unit_name: "Ad Unit",
 ad_unit_id: "Ad Unit ID",
 inventory_format_name: "Inventory Format",
 operating_system_version_name: "OS Version",
 operating_system_name: "OS",
 country_name: "Country",
 country_criteria_id: "Country ID",
  // Metrics
 ad_exchange_total_requests: "Total Requests",
 ad_exchange_responses_served: "Responses Served",
 ad_exchange_match_rate: "Match Rate",
 ad_exchange_line_item_level_impressions: "Impressions",
 ad_exchange_line_item_level_clicks: "Clicks",
 ad_exchange_line_item_level_ctr: "CTR",
 average_ecpm: "Average eCPM",
 payout: "Payout",
 ad_exchange_cost_per_click: "Cost Per Click",
};

// --- File validation function ---
const validateFile = async (file: RcFile): Promise<{ isValid: boolean; missingHeaders: string[]; isSizeValid: boolean }> => {
 try {
   // Check file size first (10MB = 10 * 1024 * 1024 bytes)
   const maxSizeInBytes = 10 * 1024 * 1024;
   const isSizeValid = file.size <= maxSizeInBytes;
  
   if (!isSizeValid) {
     return { isValid: false, missingHeaders: [], isSizeValid: false };
   }

   const text = await file.text();
   const firstLine = text.split("\n")[0].trim();
   const headers = firstLine.split(",").map((h) => h.trim());

   // Create a mapping from user-friendly names to internal field names
   const userFriendlyToInternal: { [key: string]: string } = {};
   Object.entries(HEADER_DISPLAY_NAMES).forEach(([internalName, userFriendlyName]) => {
     userFriendlyToInternal[userFriendlyName] = internalName;
   });

   // Check only required dimensions using user-friendly names
   const missingHeaders = REQUIRED_DIMENSIONS.filter((internalName) => {
     const userFriendlyName = HEADER_DISPLAY_NAMES[internalName];
     return !headers.includes(userFriendlyName);
   });
  
   const isValid = missingHeaders.length === 0;

   return { isValid, missingHeaders, isSizeValid: true };
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
 const { message } = App.useApp();
 const [fileList, setFileList] = useState<UploadFile[]>([]);
 const [uploading, setUploading] = useState(false);
 const [jobId, setJobId] = useState<string | null>(null);
 const [progress, setProgress] = useState<ImportProgress | null>(null);
 const [validationError, setValidationError] = useState<string[]>([]);
 const [isFileValid, setIsFileValid] = useState(false);
 const [isFileSizeValid, setIsFileSizeValid] = useState(true);

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
     } catch (error: any) {
       console.error("Progress polling failed:", error);
       stopProgressPolling();
       setUploading(false);
       message.error("API request failed");
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
     console.log("Starting file upload...");
     const response = await uploadCsvData(selectedFile.originFileObj as File);
     console.log("Upload response:", response);

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
     console.error("Error details:", {
       message: error.message,
       status: error.response?.status,
       data: error.response?.data,
       url: error.config?.url
     });
     message.error("API request failed");
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
       const validation = await validateFile(file);
      
       // Check file size first
       if (!validation.isSizeValid) {
         const fileSizeInMB = (file.size / (1024 * 1024)).toFixed(2);
         const errorMessage = `File size (${fileSizeInMB}MB) exceeds the maximum allowed size of 10MB`;
         message.error(errorMessage);
         setIsFileValid(false);
         setIsFileSizeValid(false);
         setValidationError([]);
         return Promise.reject(new Error(errorMessage));
       }
      
       if (validation.isValid) {
         message.success(`${file.name} selected successfully.`);
         setIsFileValid(true);
         setIsFileSizeValid(true);
         setValidationError([]);
         return Promise.resolve(file);
       } else {
         const missingHeadersText = validation.missingHeaders
           .map(h => HEADER_DISPLAY_NAMES[h] || h)
           .join(", ");
         const errorMessage = `Missing required headers: ${missingHeadersText}`;
         message.error(errorMessage);
         setIsFileValid(false);
         setIsFileSizeValid(true);
         setValidationError(validation.missingHeaders);
         return Promise.reject(new Error(errorMessage));
       }
     } catch (error: any) {
       message.error(
         error.message || "File validation failed. Please check file headers."
       );
       setIsFileValid(false);
       setIsFileSizeValid(true);
       setValidationError([]);
       return Promise.reject(error);
     }
   },

   customRequest: ({ file, onSuccess, onError }) => {
     // This prevents the default upload behavior
     onSuccess?.(file);
   },
   fileList,
   accept: ".csv",
   maxCount: 1,
 };

 const handleClose = () => {
   // Only reset UI state, keep progress state if upload is in progress
   setFileList([]);
   setValidationError([]);
   setIsFileValid(false);
   setIsFileSizeValid(true);

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
         all of the following 11 required dimensions:
       </Text>

       <Divider orientation="left" style={{ margin: "8px 0" }}>
         Required Dimensions (11 fields)
       </Divider>
       <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
         {REQUIRED_DIMENSIONS.map((header: string, index: number) => (
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
      
       {validationError.length > 0 && (
         <div style={{ marginTop: "12px" }}>
           <Text type="danger" style={{ fontSize: "12px" }}>
             ❌ Missing required headers: {validationError.map(h => HEADER_DISPLAY_NAMES[h] || h).join(", ")}
           </Text>
         </div>
       )}
      
       {!isFileSizeValid && selectedFile && selectedFile.size && (
         <div style={{ marginTop: "12px" }}>
           <Text type="danger" style={{ fontSize: "12px" }}>
             ❌ File size ({(selectedFile.size / (1024 * 1024)).toFixed(2)}MB) exceeds the maximum allowed size of 10MB
           </Text>
         </div>
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
         disabled={!selectedFile || uploading || !isFileValid || !isFileSizeValid}
         loading={uploading}
         style={{ marginTop: "16px", width: "100%" }}
         size="large"
       >
         {uploading
           ? "Processing..."
           : !isFileSizeValid
             ? "File Too Large (>10MB)"
             : !isFileValid
               ? "File Validation Failed"
               : "Start Upload"
         }
       </Button>
     </Space>
   </Drawer>
 );
}


