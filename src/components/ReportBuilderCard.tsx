import React from "react";
import { Card, Space, Row, Col, Button, Typography } from "antd";
import { DownloadOutlined, UploadOutlined } from "@ant-design/icons";
import { ReportQueryRequest } from "../api";
import DateRangeFilter from "./DateRangeFilter";
import DimensionsSelector from "./DimensionsSelector";
import MetricsSelector from "./MetricsSelector";
import AdvancedFiltersPanel from "./AdvancedFiltersPanel";
import type { RangePickerProps } from "antd/lib/date-picker";

const { Text } = Typography;

interface AllFilters {
  mobileAppResolvedIds: string[];
  mobileAppNames: string[];
  domains: string[];
  adUnitNames: string[];
  adUnitIds: string[];
  inventoryFormatNames: string[];
  operatingSystemVersionNames: string[];
}

interface ReportBuilderCardProps {
  queryParams: ReportQueryRequest;
  allFilters: AllFilters;
  loading: boolean;
  allDataLength: number;
  onDateRangeChange: RangePickerProps["onChange"];
  onDimensionsChange: (values: string[]) => void;
  onMetricsChange: (values: string[]) => void;
  onFilterChange: (field: keyof ReportQueryRequest) => (values: string[]) => void;
  onApplyFilters: () => void;
  onResetFilters: () => void;
  onGetReport: () => void;
  onCSVDownload: () => void;
  onImportOpen: () => void;
}

export default function ReportBuilderCard({
  queryParams,
  allFilters,
  loading,
  allDataLength,
  onDateRangeChange,
  onDimensionsChange,
  onMetricsChange,
  onFilterChange,
  onApplyFilters,
  onResetFilters,
  onGetReport,
  onCSVDownload,
  onImportOpen,
}: ReportBuilderCardProps) {
  return (
    <Card
      title={
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <Text strong>Report Builder</Text>
          <Space>
            <Button
              onClick={onImportOpen}
              icon={<UploadOutlined />}
            >
              Upload CSV
            </Button>
            <Button
              onClick={onCSVDownload}
              disabled={allDataLength === 0}
              icon={<DownloadOutlined />}
            >
              Download CSV
            </Button>
          </Space>
        </div>
      }
      style={{
        marginBottom: "24px",
        position: "sticky",
        top: "0px",
        zIndex: 1000,
        backgroundColor: "#141414",
        border: "1px solid #303030",
        paddingTop: "16px",
        marginTop: "-16px",
      }}
    >
      <Space direction="vertical" size="large" style={{ width: "100%" }}>
        <Row gutter={[24, 24]} align="middle">
          <Col xs={24} md={8}>
            <DateRangeFilter
              startDate={queryParams.startDate}
              endDate={queryParams.endDate}
              onChange={onDateRangeChange}
            />
          </Col>
          <Col xs={24} md={8}>
            <DimensionsSelector
              value={queryParams.groupByDimensions}
              onChange={onDimensionsChange}
            />
          </Col>
          <Col xs={24} md={8}>
            <MetricsSelector
              value={queryParams.metrics}
              onChange={onMetricsChange}
            />
          </Col>
        </Row>

        <AdvancedFiltersPanel
          queryParams={queryParams}
          allFilters={allFilters}
          onFilterChange={onFilterChange}
          onApplyFilters={onApplyFilters}
          onResetFilters={onResetFilters}
        />

        <Row
          gutter={16}
          style={{
            display: "flex",
            justifyContent: "flex-end",
            marginTop: "16px",
          }}
        >
          <Col>
            <Space>
              <Button
                type="primary"
                onClick={onGetReport}
                size="large"
                loading={loading}
              >
                Get Report
              </Button>
            </Space>
          </Col>
        </Row>
      </Space>
    </Card>
  );
}