import React from "react";
import { Space, Typography, Select } from "antd";

const { Text } = Typography;
const { Option } = Select;

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

interface DimensionsSelectorProps {
  value?: string[];
  onChange: (values: string[]) => void;
}

export default function DimensionsSelector({
  value,
  onChange,
}: DimensionsSelectorProps) {
  return (
    <Space direction="vertical" style={{ width: "100%" }}>
      <Text strong>Dimensions:</Text>
      <Select
        mode="multiple"
        placeholder="Select dimensions to group by"
        value={value}
        onChange={onChange}
        style={{ width: "100%" }}
        allowClear
      >
        {DIMENSIONS_OPTIONS.map((dim) => (
          <Option key={dim.value} value={dim.value}>
            {dim.label}
          </Option>
        ))}
      </Select>
    </Space>
  );
}