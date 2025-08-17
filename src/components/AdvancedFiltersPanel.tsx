import React from "react";
import { Collapse, Row, Col, Space, Typography, Select, Button } from "antd";
import { FilterOutlined } from "@ant-design/icons";
import { ReportQueryRequest } from "../api";

const { Text } = Typography;
const { Option } = Select;
const { Panel } = Collapse;

interface AllFilters {
  mobileAppResolvedIds: string[];
  mobileAppNames: string[];
  domains: string[];
  adUnitNames: string[];
  adUnitIds: string[];
  inventoryFormatNames: string[];
  operatingSystemVersionNames: string[];
}

interface AdvancedFiltersPanelProps {
  queryParams: ReportQueryRequest;
  allFilters: AllFilters;
  onFilterChange: (field: keyof ReportQueryRequest) => (values: string[]) => void;
  onApplyFilters: () => void;
  onResetFilters: () => void;
}

export default function AdvancedFiltersPanel({
  queryParams,
  allFilters,
  onFilterChange,
  onApplyFilters,
  onResetFilters,
}: AdvancedFiltersPanelProps) {
  return (
    <Collapse
      ghost
      expandIconPosition="end"
      style={{
        backgroundColor: "#1f1f1f",
        border: "1px solid #303030",
        borderRadius: "6px",
      }}
    >
      <Panel
        header={
          <Space>
            <FilterOutlined style={{ color: "#1890ff" }} />
            <Text strong>Advanced Filters</Text>
          </Space>
        }
        key="1"
      >
        <Row gutter={[24, 24]}>
          <Col xs={24} md={12}>
            <Space direction="vertical" style={{ width: "100%" }}>
              <Text strong>Mobile App Resolved ID:</Text>
              <Select
                mode="multiple"
                placeholder="Filter by app resolved IDs"
                value={queryParams.mobileAppResolvedIds}
                onChange={onFilterChange("mobileAppResolvedIds")}
                style={{ width: "100%" }}
                allowClear
              >
                {allFilters.mobileAppResolvedIds.map((id) => (
                  <Option key={id} value={id}>
                    {id}
                  </Option>
                ))}
              </Select>
            </Space>
          </Col>
          <Col xs={24} md={12}>
            <Space direction="vertical" style={{ width: "100%" }}>
              <Text strong>Mobile App Name:</Text>
              <Select
                mode="multiple"
                placeholder="Filter by app names"
                value={queryParams.mobileAppNames}
                onChange={onFilterChange("mobileAppNames")}
                style={{ width: "100%" }}
                allowClear
              >
                {allFilters.mobileAppNames.map((appName) => (
                  <Option key={appName} value={appName}>
                    {appName}
                  </Option>
                ))}
              </Select>
            </Space>
          </Col>
          <Col xs={24} md={12}>
            <Space direction="vertical" style={{ width: "100%" }}>
              <Text strong>Domain:</Text>
              <Select
                mode="multiple"
                placeholder="Filter by domains"
                value={queryParams.domains}
                onChange={onFilterChange("domains")}
                style={{ width: "100%" }}
                allowClear
              >
                {allFilters.domains.map((domain) => (
                  <Option key={domain} value={domain}>
                    {domain}
                  </Option>
                ))}
              </Select>
            </Space>
          </Col>
          <Col xs={24} md={12}>
            <Space direction="vertical" style={{ width: "100%" }}>
              <Text strong>Ad Unit Name:</Text>
              <Select
                mode="multiple"
                placeholder="Filter by ad unit names"
                value={queryParams.adUnitNames}
                onChange={onFilterChange("adUnitNames")}
                style={{ width: "100%" }}
                allowClear
              >
                {allFilters.adUnitNames.map((adUnitName) => (
                  <Option key={adUnitName} value={adUnitName}>
                    {adUnitName}
                  </Option>
                ))}
              </Select>
            </Space>
          </Col>
          <Col xs={24} md={12}>
            <Space direction="vertical" style={{ width: "100%" }}>
              <Text strong>Ad Unit ID:</Text>
              <Select
                mode="multiple"
                placeholder="Filter by ad unit IDs"
                value={queryParams.adUnitIds}
                onChange={onFilterChange("adUnitIds")}
                style={{ width: "100%" }}
                allowClear
              >
                {allFilters.adUnitIds.map((adUnitId) => (
                  <Option key={adUnitId} value={adUnitId}>
                    {adUnitId}
                  </Option>
                ))}
              </Select>
            </Space>
          </Col>
          <Col xs={24} md={12}>
            <Space direction="vertical" style={{ width: "100%" }}>
              <Text strong>Inventory Format Name:</Text>
              <Select
                mode="multiple"
                placeholder="Filter by inventory formats"
                value={queryParams.inventoryFormatNames}
                onChange={onFilterChange("inventoryFormatNames")}
                style={{ width: "100%" }}
                allowClear
              >
                {allFilters.inventoryFormatNames.map((format) => (
                  <Option key={format} value={format}>
                    {format}
                  </Option>
                ))}
              </Select>
            </Space>
          </Col>
          <Col xs={24} md={12}>
            <Space direction="vertical" style={{ width: "100%" }}>
              <Text strong>Operating System Version:</Text>
              <Select
                mode="multiple"
                placeholder="Filter by OS versions"
                value={queryParams.operatingSystemVersionNames}
                onChange={onFilterChange("operatingSystemVersionNames")}
                style={{ width: "100%" }}
                allowClear
              >
                {allFilters.operatingSystemVersionNames.map((osVersion) => (
                  <Option key={osVersion} value={osVersion}>
                    {osVersion}
                  </Option>
                ))}
              </Select>
            </Space>
          </Col>
        </Row>
        <Row style={{ marginTop: "16px", justifyContent: "flex-end" }}>
          <Col>
            <Space>
              <Button onClick={onResetFilters}>Reset Filters</Button>
              <Button type="primary" onClick={onApplyFilters}>
                Apply Filters
              </Button>
            </Space>
          </Col>
        </Row>
      </Panel>
    </Collapse>
  );
}