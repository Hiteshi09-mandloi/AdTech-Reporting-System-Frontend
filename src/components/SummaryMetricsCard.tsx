import React from "react";
import { Card, Row, Col, Space, Spin, Typography } from "antd";
import {
  DollarCircleOutlined,
  DashboardOutlined,
  InteractionOutlined,
  EyeOutlined,
} from "@ant-design/icons";
import { formatNumber } from "../utils/numberFormat";

const { Text } = Typography;

interface SummaryMetrics {
  totalRequests: number;
  totalImpressions: number;
  totalClicks: number;
  totalPayout: number;
}

interface SummaryMetricsCardProps {
  summaryData: SummaryMetrics;
  summaryLoading: boolean;
}

export default function SummaryMetricsCard({
  summaryData,
  summaryLoading,
}: SummaryMetricsCardProps) {
  return (
    <Card
      title={<Text strong>Summary Metrics</Text>}
      style={{ marginBottom: "24px" }}
    >
      <Row gutter={[16, 16]} justify="space-between">
        {/* Total Requests */}
        <Col xs={24} sm={12} md={12} lg={6} xl={6}>
          <Card
            style={{
              backgroundColor: "rgba(24, 144, 255, 0.1)",
              border: "1px solid rgba(24, 144, 255, 0.3)",
              borderRadius: "8px",
            }}
          >
            <Space direction="vertical" align="center" style={{ width: "100%" }}>
              <DashboardOutlined style={{ fontSize: "24px", color: "#1890ff" }} />
              <Text>Total Requests</Text>
              {summaryLoading ? (
                <Spin size="small" />
              ) : (
                <Text strong>{formatNumber(summaryData.totalRequests)}</Text>
              )}
            </Space>
          </Card>
        </Col>

        {/* Impressions */}
        <Col xs={24} sm={12} md={12} lg={6} xl={6}>
          <Card
            style={{
              backgroundColor: "rgba(250, 173, 20, 0.1)",
              border: "1px solid rgba(250, 173, 20, 0.3)",
              borderRadius: "8px",
            }}
          >
            <Space direction="vertical" align="center" style={{ width: "100%" }}>
              <EyeOutlined style={{ fontSize: "24px", color: "#faad14" }} />
              <Text>Impressions</Text>
              {summaryLoading ? (
                <Spin size="small" />
              ) : (
                <Text strong>
                  {formatNumber(summaryData.totalImpressions)}
                </Text>
              )}
            </Space>
          </Card>
        </Col>

        {/* Clicks */}
        <Col xs={24} sm={12} md={12} lg={6} xl={6}>
          <Card
            style={{
              backgroundColor: "rgba(146, 84, 222, 0.1)",
              border: "1px solid rgba(146, 84, 222, 0.3)",
              borderRadius: "8px",
            }}
          >
            <Space direction="vertical" align="center" style={{ width: "100%" }}>
              <InteractionOutlined style={{ fontSize: "24px", color: "#9254de" }} />
              <Text>Clicks</Text>
              {summaryLoading ? (
                <Spin size="small" />
              ) : (
                <Text strong>{formatNumber(summaryData.totalClicks)}</Text>
              )}
            </Space>
          </Card>
        </Col>

        {/* Total Payout */}
        <Col xs={24} sm={12} md={12} lg={6} xl={6}>
          <Card
            style={{
              backgroundColor: "rgba(19, 194, 194, 0.1)",
              border: "1px solid rgba(19, 194, 194, 0.3)",
              borderRadius: "8px",
            }}
          >
            <Space direction="vertical" align="center" style={{ width: "100%" }}>
              <DollarCircleOutlined style={{ fontSize: "24px", color: "#13c2c2" }} />
              <Text>Total Payout</Text>
              {summaryLoading ? (
                <Spin size="small" />
              ) : (
                <Text strong>{formatNumber(summaryData.totalPayout, true)}</Text>
              )}
            </Space>
          </Card>
        </Col>
      </Row>
    </Card>
  );
}
