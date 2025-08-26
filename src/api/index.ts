import axios from "axios";

const api = axios.create({
  baseURL: process.env.REACT_APP_API_URL || "http://localhost:8080/api",
  timeout: 60000,
  maxRedirects: 0, // Prevent automatic redirects
});

// Add request interceptor for debugging
api.interceptors.request.use(
  (config) => {
    console.log("Making request to:", config.url);
    return config;
  },
  (error) => {
    console.error("Request error:", error);
    return Promise.reject(error);
  }
);

// --- API Interfaces ---
export interface ReportQueryRequest {
  startDate?: string;
  endDate?: string;
  mobileAppNames?: string[];
  inventoryFormatNames?: string[];
  operatingSystemVersionNames?: string[];
  mobileAppResolvedIds?: string[];
  domains?: string[];
  adUnitNames?: string[];
  adUnitIds?: string[];
  searchQuery?: string;
  groupByDimensions?: string[];
  metrics?: string[];
  offset: number;
  limit: number;
  sortBy?: string;
  sortOrder?: "ASC" | "DESC";
}

export interface AdReportData {
  id: number;
  mobileAppResolvedId: string;
  mobileAppName: string;
  domain: string;
  adUnitName: string;
  adUnitId: string;
  inventoryFormatName: string;
  operatingSystemVersionName: string;
  date: string;
  adExchangeTotalRequests: number;
  adExchangeResponsesServed: number;
  adExchangeMatchRate: number;
  adExchangeLineItemLevelImpressions: number;
  adExchangeLineItemLevelClicks: number;
  adExchangeLineItemLevelCtr: number;
  averageEcpm: number;
  payout: number;
}
// NOTE: It's good practice to define a more specific type for aggregated data
// as it may have different fields or formats than the raw data.
// export interface AggregatedReportData {
//   dimension1: string;
//   dimension2: string;
//   sumOfMetric1: number;
//   ...
// }

// --- API Functions ---
export const getDimensions = async (): Promise<string[]> => {
  const response = await api.get<string[]>("/reports/dimensions");
  return response.data;
};

export const getMetrics = async (): Promise<string[]> => {
  const response = await api.get<string[]>("/reports/metrics");
  return response.data;
};

export const getReport = async (
  query: ReportQueryRequest
): Promise<AdReportData[]> => {
  const response = await api.post<AdReportData[]>("/reports/getreport", query);
  return response.data;
};

export const aggregateReport = async (
  query: Omit<ReportQueryRequest, 'offset' | 'limit'>
): Promise<{
  total_requests: number;
  total_impressions: number;
  total_clicks: number;
  total_payout: number;
}> => {
  const response = await api.post<{
    total_requests: number;
    total_impressions: number;
    total_clicks: number;
    total_payout: number;
  }>("/reports/aggregate", query);
  return response.data;
};


// Add a single, comprehensive response interceptor for global error handling
// NOTE: I've removed the duplicate interceptor from your original code.
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (axios.isAxiosError(error)) {
      if (error.response) {
        // The request was made and the server responded with a status code
        // that falls out of the range of 2xx
        console.error("API Error Response:", error.response.data);
        console.error("API Error Status:", error.response.status);
        
        // Preserve the original axios error structure so components can access response data
        // Just throw the original error to maintain access to error.response.data
        throw error;
      } else if (error.request) {
        // The request was made but no response was received
        console.error("API Error Request:", error.request);
        throw new Error(
          "No response from server. Please check your network connection."
        );
      } else {
        // Something happened in setting up the request that triggered an Error
        console.error("API Error Message:", error.message);
        throw new Error(`Request setup error: ${error.message}`);
      }
    } else {
      // Non-axios error
      console.error("API Error (Non-Axios):", error);
      throw new Error(`An unexpected error occurred: ${error.message}`);
    }
  }
);

// --- CSV Upload ---
export const uploadCsvData = async (file: File): Promise<string> => {
  const formData: FormData = new FormData();
  formData.append("file", file);

  try {
    console.log("Making API call to /reports/upload");
    const response = await api.post<string>("/reports/upload", formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });
    console.log("API response received:", response);
    return response.data;
  } catch (error: any) {
    console.error("Error in uploadCsvData:", error);
    console.error("Error response:", error.response);
    throw error;
  }
};

// NEW API FUNCTIONS to fetch distinct values for filters
export const getAllFilters = async (
  startDate: string,
  endDate: string
): Promise<{
  mobileAppResolvedIds: string[];
  mobileAppNames: string[];
  domains: string[];
  adUnitNames: string[];
  adUnitIds: string[];
  inventoryFormatNames: string[];
  operatingSystemVersionNames: string[];
}> => {
  const response = await api.get<{
    mobileAppResolvedIds: string[];
    mobileAppNames: string[];
    domains: string[];
    adUnitNames: string[];
    adUnitIds: string[];
    inventoryFormatNames: string[];
    operatingSystemVersionNames: string[];
  }>("/reports/filters", {
    params: {
      startDate,
      endDate,
    },
  });
  return response.data;
};

export const getImportProgress = async (
  jobId: string
): Promise<ImportProgress> => {
  try {
    const response = await api.get<ImportProgress>(
      `/reports/upload/progress/${jobId}`
    );
    return response.data;
  } catch (error) {
    console.error("Progress fetch failed:", error);
    throw error;
  }
};

// Also add the ImportProgress interface to your api.ts
export interface ImportProgress {
  totalRecords: number;
  processedRecords: number;
  savedRecords: number;
  errorRecords: number;
  currentPhase: string;
  progressPercentage: number;
}
