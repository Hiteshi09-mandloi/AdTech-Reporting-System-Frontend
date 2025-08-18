import { useEffect, useState, useCallback, useMemo } from "react";//hooks
import { Typography, message } from "antd";
import {
  getReport,
  aggregateReport,
  getAllFilters,
  ReportQueryRequest,
  AdReportData,
} from "../api";
import { debounce } from "../utils/debounce";
import dayjs from "dayjs";
import type { RangePickerProps } from "antd/lib/date-picker";
import type { ColumnsType, TablePaginationConfig } from "antd/es/table";
import axios from "axios";
import ImportDrawer from "../components/ImportDrawer";
import SummaryMetricsCard from "../components/SummaryMetricsCard";
import ReportBuilderCard from "../components/ReportBuilderCard";
import ReportDataTable from "../components/ReportDataTable";

const { Title } = Typography;

interface SummaryMetrics {
  totalRequests: number;
  totalImpressions: number;
  totalClicks: number;
  totalPayout: number;
}

interface AllFilters {
  mobileAppResolvedIds: string[];
  mobileAppNames: string[];
  domains: string[];
  adUnitNames: string[];
  adUnitIds: string[];
  inventoryFormatNames: string[];
  operatingSystemVersionNames: string[];
}

const DIMENSIONS_OPTIONS = [
  { label: "Mobile ID", value: "mobile_app_resolved_id" },
  { label: "App Name", value: "mobile_app_name" },
  { label: "Domain", value: "domain" },
  { label: "Ad Unit Name", value: "ad_unit_name" },
  { label: "Ad Unit ID", value: "ad_unit_id" },
  { label: "Format", value: "inventory_format_name" },
  { label: "OS Version", value: "operating_system_version_name" },
  { label: "Date", value: "date" },
];

const METRICS_OPTIONS = [
  { label: "Total Requests", value: "ad_exchange_total_requests" },
  { label: "Responses Served", value: "ad_exchange_responses_served" },
  { label: "Match Rate", value: "ad_exchange_match_rate" },
  { label: "Impressions", value: "ad_exchange_line_item_level_impressions" },
  { label: "Clicks", value: "ad_exchange_line_item_level_clicks" },
  { label: "CTR", value: "ad_exchange_line_item_level_ctr" },
  { label: "eCPM", value: "average_ecpm" },
  { label: "Payout", value: "payout" },
];

const CHUNK_SIZE = 20000;
const DEFAULT_PAGE_SIZE = 100;

const DashboardPage = () => {
  const [availableDimensions] = useState<string[]>(
    DIMENSIONS_OPTIONS.map((d) => d.value)
  );
  const [availableMetrics] = useState<string[]>(
    METRICS_OPTIONS.map((m) => m.value)
  );
  const [allFilters, setAllFilters] = useState<AllFilters>({
    mobileAppResolvedIds: [],
    mobileAppNames: [],
    domains: [],
    adUnitNames: [],
    adUnitIds: [],
    inventoryFormatNames: [],
    operatingSystemVersionNames: [],
  });
  const [allData, setAllData] = useState<AdReportData[]>([]);
  const [tableData, setTableData] = useState<AdReportData[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [summaryLoading, setSummaryLoading] = useState<boolean>(false);
  const [tableColumns, setTableColumns] = useState<ColumnsType<AdReportData>>(
    []
  );
  const [summaryData, setSummaryData] = useState<SummaryMetrics>({
    totalRequests: 0,
    totalImpressions: 0,
    totalClicks: 0,
    totalPayout: 0,
  });
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [pageSize, setPageSize] = useState<number>(DEFAULT_PAGE_SIZE);
  const [hasMoreData, setHasMoreData] = useState<boolean>(true);
  const [importDrawerOpen, setImportDrawerOpen] = useState<boolean>(false);

  const [queryParams, setQueryParams] = useState<ReportQueryRequest>({
    groupByDimensions: [],
    metrics: [],
    offset: 0,
    limit: CHUNK_SIZE,
    startDate: dayjs().subtract(7, "days").format("YYYY-MM-DD"),
    endDate: dayjs().format("YYYY-MM-DD"),
    mobileAppNames: [],
    inventoryFormatNames: [],
    operatingSystemVersionNames: [],
    mobileAppResolvedIds: [],
    domains: [],
    adUnitNames: [],
    adUnitIds: [],
    searchQuery: undefined,
  });

  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        const filters = await getAllFilters(
          queryParams.startDate!,
          queryParams.endDate!
        );
        setAllFilters(
          filters || {
            mobileAppResolvedIds: [],
            mobileAppNames: [],
            domains: [],
            adUnitNames: [],
            adUnitIds: [],
            inventoryFormatNames: [],
            operatingSystemVersionNames: [],
          }
        );
      } catch (err) {
        message.error("Failed to fetch filter options.");
        console.error("Error fetching filter options:", err);
      }
    };
    fetchInitialData();
  }, []);

  const buildCleanPayload = (params: ReportQueryRequest) => {
    const hasFilters =
      params.groupByDimensions?.length ||
      params.metrics?.length ||
      params.mobileAppNames?.length ||
      params.inventoryFormatNames?.length ||
      params.operatingSystemVersionNames?.length ||
      params.mobileAppResolvedIds?.length ||
      params.domains?.length ||
      params.adUnitNames?.length ||
      params.adUnitIds?.length ||
      params.searchQuery;

    if (!hasFilters) {
      return {
        startDate: params.startDate,
        endDate: params.endDate,
        offset: params.offset,
        limit: params.limit,
      };
    }

    return params;
  };

  const fetchReportData = useCallback(
    debounce(async (params: ReportQueryRequest, append: boolean = false) => {
      setLoading(true);
      try {
        const cleanPayload = buildCleanPayload(params);
        const response = await getReport(cleanPayload);

        if (append) {
          setAllData((prev) => [...prev, ...response]);
        } else {
          setAllData(response);
          setCurrentPage(1);
          // Generate and set table columns only when new data is fetched
          if (response.length > 0) {
            const newColumns = generateColumnsForData(params);
            setTableColumns(newColumns);
          }
        }

        setHasMoreData(response.length === params.limit);
      } catch (error) {
        console.error("Error fetching report data:", error);
        if (axios.isAxiosError(error) && error.response) {
          console.error(
            "Backend Error Response (Report Data):",
            error.response.data
          );
          message.error(
            `Error fetching report data: ${
              error.response.data.message || "Unknown error"
            }`
          );
        } else {
          message.error("Failed to fetch report data. Please check network.");
        }
        if (!append) {
          setAllData([]);
          setTableColumns([]);
        }
      } finally {
        setLoading(false);
      }
    }, 500),
    [allData.length]
  );

  const fetchSummaryData = useCallback(
    debounce(async (params: ReportQueryRequest) => {
      setSummaryLoading(true);
      try {
        const cleanPayload = buildCleanPayload(params);
        const { offset, limit, ...aggregateParams } = cleanPayload;
        const response = await aggregateReport(aggregateParams);
        setSummaryData({
          totalRequests: (response as any).total_requests || 0,
          totalImpressions: (response as any).total_impressions || 0,
          totalClicks: (response as any).total_clicks || 0,
          totalPayout: (response as any).total_payout || 0,
        });
      } catch (error) {
        console.error("Error fetching summary data:", error);
        if (axios.isAxiosError(error) && error.response) {
          console.error(
            "Backend Error Response (Summary Data):",
            error.response.data
          );
          message.error(
            `Error fetching summary data: ${
              error.response.data.message || "Unknown error"
            }`
          );
        } else {
          message.error("Failed to fetch summary data. Please check network.");
        }
        setSummaryData({
          totalRequests: 0,
          totalImpressions: 0,
          totalClicks: 0,
          totalPayout: 0,
        });
      } finally {
        setSummaryLoading(false);
      }
    }, 500),
    []
  );

  useEffect(() => {
    fetchReportData(queryParams);
    fetchSummaryData(queryParams);
  }, []);

  // Update table data when page or page size changes
  useEffect(() => {
    const startIndex = (currentPage - 1) * pageSize;
    const endIndex = startIndex + pageSize;
    setTableData(allData.slice(startIndex, endIndex));
  }, [allData, currentPage, pageSize]);

  const handleDateRangeChange: RangePickerProps["onChange"] = async (
    _,
    dateStrings
  ) => {
    // If both dates are cleared, reset to initial 7-day range
    if (!dateStrings[0] && !dateStrings[1]) {
      const newParams = {
        ...queryParams,
        startDate: dayjs().subtract(7, "days").format("YYYY-MM-DD"),
        endDate: dayjs().format("YYYY-MM-DD"),
        offset: 0,
      };
      setQueryParams(newParams);

      try {
        const filters = await getAllFilters(
          newParams.startDate!,
          newParams.endDate!
        );
        setAllFilters(filters);
      } catch (error) {
        console.error("Error refreshing filters:", error);
        message.error("Failed to refresh filters for the selected date range.");
      }
    } else {
      // Just update the state, don't call APIs automatically
      const newParams = {
        ...queryParams,
        startDate: dateStrings[0],
        endDate: dateStrings[1],
        offset: 0,
      };
      setQueryParams(newParams);

      if (dateStrings[0] && dateStrings[1]) {
        try {
          const filters = await getAllFilters(dateStrings[0], dateStrings[1]);
          setAllFilters(filters);
        } catch (error) {
          console.error("Error refreshing filters:", error);
          message.error(
            "Failed to refresh filters for the selected date range."
          );
        }
      }
    }
  };

  const handleMultiSelectChange =
    (field: keyof ReportQueryRequest) => (values: string[]) => {
      const newParams = { ...queryParams, [field]: values, offset: 0 };
      setQueryParams(newParams);
      // Don't fetch data immediately - wait for user to click Apply Filters
    };

  const handleDynamicSelectChange =
    (field: "groupByDimensions" | "metrics") => (values: string[]) => {
      const newParams = { ...queryParams, [field]: values, offset: 0 };
      setQueryParams(newParams);
      // Don't fetch data immediately - wait for user to click Apply Filters or Get Report
    };

  const handleTableChange = (
    pagination: TablePaginationConfig
  ) => {
    const newPage = Math.max(1, pagination.current || 1);
    const newSize = Math.max(1, pagination.pageSize || DEFAULT_PAGE_SIZE);

    setCurrentPage(newPage);
    setPageSize(newSize);

    // Check if we need to load more data for pagination
    const requiredDataLength = newPage * newSize;
    if (requiredDataLength > allData.length && hasMoreData) {
      const newOffset = Math.floor(allData.length / CHUNK_SIZE) * CHUNK_SIZE;
      if (newOffset === allData.length) {
        // Only fetch report data for pagination, NOT aggregate data
        fetchReportData({ ...queryParams, offset: newOffset }, true);
      }
    }
  };

  const handleApplyFilters = () => {
    fetchReportData(queryParams);
    fetchSummaryData(queryParams);
  };

  const handleGetReport = () => {
    fetchReportData(queryParams);
    fetchSummaryData(queryParams);
  };

  const handleImportComplete = () => {
    // Refresh the dashboard data after successful import
    fetchReportData(queryParams);
    fetchSummaryData(queryParams);
    message.success("Dashboard data refreshed after import!");
  };

  const handleResetFilters = () => {
    const defaultParams = {
      groupByDimensions: [],
      metrics: [],
      offset: 0,
      limit: CHUNK_SIZE,
      startDate: dayjs().subtract(7, "days").format("YYYY-MM-DD"),
      endDate: dayjs().format("YYYY-MM-DD"),
      mobileAppNames: [],
      inventoryFormatNames: [],
      operatingSystemVersionNames: [],
      mobileAppResolvedIds: [],
      domains: [],
      adUnitNames: [],
      adUnitIds: [],
      searchQuery: undefined,
    };
    setQueryParams(defaultParams);
    setCurrentPage(1);
    setPageSize(DEFAULT_PAGE_SIZE);
  };

  const handleCSVDownload = () => {
    if (allData.length === 0) {
      message.warning("No data available to download");
      return;
    }

    try {
      // Get the keys from the first row of data
      const keys = Object.keys(allData[0]).filter((key) => key !== "id");

      // Create CSV header
      const header = keys.map((key) => {
        const option =
          DIMENSIONS_OPTIONS.find((d) => d.value === key) ||
          METRICS_OPTIONS.find((m) => m.value === key);
        return option
          ? option.label
          : key
              .replace(/([A-Z])/g, " $1")
              .replace(/^./, (str) => str.toUpperCase());
      });

      // Create CSV rows
      const csvRows = [
        header.join(","), // Header row
        ...allData.map((row) =>
          keys
            .map((key) => {
              let value = row[key as keyof AdReportData];

              // Handle different data types
              if (value === null || value === undefined) {
                return "";
              }

              // Format dates
              if (key === "date" && value) {
                value = dayjs(value).format("YYYY-MM-DD");
              }

              // Handle strings that might contain commas or quotes
              if (
                typeof value === "string" &&
                (value.includes(",") || value.includes('"'))
              ) {
                value = `"${value.replace(/"/g, '""')}"`;
              }

              return value;
            })
            .join(",")
        ),
      ];

      // Create and download the file
      const csvContent = csvRows.join("\n");
      const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
      const link = document.createElement("a");

      if (link.download !== undefined) {
        const url = URL.createObjectURL(blob);
        link.setAttribute("href", url);
        link.setAttribute(
          "download",
          `dashboard_report_${dayjs().format("YYYY-MM-DD_HH-mm-ss")}.csv`
        );
        link.style.visibility = "hidden";
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);

        message.success(
          `CSV downloaded successfully! (${allData.length} records)`
        );
      }
    } catch (error) {
      console.error("Error downloading CSV:", error);
      message.error("Failed to download CSV. Please try again.");
    }
  };

  const generateColumnsForData = useCallback(
    (params: ReportQueryRequest): ColumnsType<AdReportData> => {
      // Determine which columns to show based on selection or default
      let dimensionKeys: string[] = [];
      let metricKeys: string[] = [];

      if (params.groupByDimensions?.length || params.metrics?.length) {
        // User has selected specific dimensions/metrics
        dimensionKeys = params.groupByDimensions || [];
        metricKeys = params.metrics || [];
      } else {
        // No selection, show all available columns in proper order
        dimensionKeys = [...availableDimensions];
        metricKeys = [...availableMetrics];
      }

      // Ensure date comes first in dimensions if it's included
      const dateIndex = dimensionKeys.indexOf("date");
      if (dateIndex > 0) {
        dimensionKeys.splice(dateIndex, 1);
        dimensionKeys.unshift("date");
      } else if (
        dateIndex === -1 &&
        !params.groupByDimensions?.length &&
        !params.metrics?.length
      ) {
        // If no specific selection and date is not in dimensions, add it as first
        dimensionKeys.unshift("date");
      }

      // Combine in proper order: dimensions first, then metrics
      const orderedKeys = [...dimensionKeys, ...metricKeys].filter(
        (key) => key !== "id"
      );

      const baseColumns = orderedKeys.map((key) => ({
        title:
          DIMENSIONS_OPTIONS.find((d) => d.value === key)?.label ||
          METRICS_OPTIONS.find((m) => m.value === key)?.label ||
          key
            .replace(/([A-Z])/g, " $1")
            .replace(/^./, (str) => str.toUpperCase()),
        dataIndex: key,
        key: key,
        render: (text: any) => {
          if (key === "date") {
            return text ? dayjs(text).format("YYYY-MM-DD") : "";
          }
          if (
            typeof text === "number" &&
            ["ecpm", "payout", "ctr", "rate"].some((term) =>
              key.toLowerCase().includes(term)
            )
          ) {
            return text.toFixed(2);
          }
          return text;
        },
      }));

      const serialNumberColumn: ColumnsType<AdReportData>[0] = {
        title: "S.No.",
        key: "serialNumber",
        width: 70,
        fixed: "left",
        render: (_: any, __: any, index: number) =>
          (currentPage - 1) * pageSize + index + 1,
      };

      return [serialNumberColumn, ...baseColumns];
    },
    [availableDimensions, availableMetrics]
  );

  // Update serial number column when pagination changes
  const updatedColumns = useMemo(() => {
    if (tableColumns.length === 0) return [];

    const [serialColumn, ...otherColumns] = tableColumns;
    const updatedSerialColumn = {
      ...serialColumn,
      render: (_: any, __: any, index: number) =>
        (currentPage - 1) * pageSize + index + 1,
    };

    return [updatedSerialColumn, ...otherColumns];
  }, [tableColumns, currentPage, pageSize]);

  const getPaginationTotal = useMemo(() => {
    return hasMoreData ? allData.length + 1 : allData.length;
  }, [allData.length, hasMoreData]);

  return (
    <div style={{ padding: "24px", minHeight: "100vh" }}>
      <Title level={2} style={{ color: "#ffffff", marginBottom: "24px" }}>
        Ad Reporting Dashboard 📈
      </Title>

      <SummaryMetricsCard
        summaryData={summaryData}
        summaryLoading={summaryLoading}
      />

      <ReportBuilderCard
        queryParams={queryParams}
        allFilters={allFilters}
        loading={loading}
        allDataLength={allData.length}
        onDateRangeChange={handleDateRangeChange}
        onDimensionsChange={handleDynamicSelectChange("groupByDimensions")}
        onMetricsChange={handleDynamicSelectChange("metrics")}
        onFilterChange={handleMultiSelectChange}
        onApplyFilters={handleApplyFilters}
        onResetFilters={handleResetFilters}
        onGetReport={handleGetReport}
        onCSVDownload={handleCSVDownload}
        onImportOpen={() => setImportDrawerOpen(true)}
      />

      <ReportDataTable
        tableData={tableData}
        columns={updatedColumns}
        loading={loading}
        currentPage={currentPage}
        pageSize={pageSize}
        total={getPaginationTotal}
        hasMoreData={hasMoreData}
        allDataLength={allData.length}
        onChange={handleTableChange}
      />

      <ImportDrawer
        open={importDrawerOpen}
        onClose={() => setImportDrawerOpen(false)}
        onImportComplete={handleImportComplete}
      />
    </div>
  );
};

export default DashboardPage;
