import React from "react";
import { Space, Typography, DatePicker } from "antd";
import dayjs from "dayjs";
import type { RangePickerProps } from "antd/lib/date-picker";

const { Text } = Typography;
const { RangePicker } = DatePicker;

interface DateRangeFilterProps {
  startDate?: string;
  endDate?: string;
  onChange: RangePickerProps["onChange"];
}

export default function DateRangeFilter({
  startDate,
  endDate,
  onChange,
}: DateRangeFilterProps) {
  return (
    <Space direction="vertical" style={{ width: "100%" }}>
      <Text strong>Date Range:</Text>
      <RangePicker
        value={[
          startDate ? dayjs(startDate) : null,
          endDate ? dayjs(endDate) : null,
        ]}
        onChange={onChange}
        style={{ width: "100%" }}
        format="YYYY-MM-DD"
        disabledDate={(current) =>
          current && current > dayjs().endOf("day")
        }
        allowClear
      />
    </Space>
  );
}