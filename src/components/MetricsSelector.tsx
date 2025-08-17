import React from "react";
import { Space, Typography, Select } from "antd";

const { Text } = Typography;
const { Option } = Select;

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

interface MetricsSelectorProps {
  value?: string[];
  onChange: (values: string[]) => void;
}

export default function MetricsSelector({
  value,
  onChange,
}: MetricsSelectorProps) {
  return (
    <Space direction="vertical" style={{ width: "100%" }}>
      <Text strong>Metrics:</Text>
      <Select
        mode="multiple"
        placeholder="Select metrics to display"
        value={value}
        onChange={onChange}
        style={{ width: "100%" }}
        allowClear
      >
        {METRICS_OPTIONS.map((metric) => (
          <Option key={metric.value} value={metric.value}>
            {metric.label}
          </Option>
        ))}
      </Select>
    </Space>
  );
}