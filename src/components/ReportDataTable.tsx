import React from "react";
import { Card, Spin, Table, Typography } from "antd";
import type { ColumnsType, TablePaginationConfig } from "antd/es/table";
import { AdReportData } from "../api";

const { Text } = Typography;

const PAGE_SIZE_OPTIONS = ["10", "20", "50", "100", "200", "500"];

interface ReportDataTableProps {
  tableData: AdReportData[];
  columns: ColumnsType<AdReportData>;
  loading: boolean;
  currentPage: number;
  pageSize: number;
  total: number;
  hasMoreData: boolean;
  allDataLength: number;
  onChange: (pagination: TablePaginationConfig) => void;
}

export default function ReportDataTable({
  tableData,
  columns,
  loading,
  currentPage,
  pageSize,
  total,
  hasMoreData,
  allDataLength,
  onChange,
}: ReportDataTableProps) {
  return (
    <Card title={<Text strong>Detailed Report Data</Text>}>
      <Spin spinning={loading}>
        <Table
          columns={columns}
          dataSource={tableData}
          rowKey="id"
          pagination={{
            current: currentPage,
            pageSize: pageSize,
            total: total,
            showSizeChanger: true,
            pageSizeOptions: PAGE_SIZE_OPTIONS,
            showTotal: (_, range) =>
              `${range[0]}-${range[1]} of ${allDataLength} items${
                hasMoreData ? " (more available)" : ""
              }`,
          }}
          onChange={onChange}
          scroll={{ x: "max-content" }}
          bordered
        />
      </Spin>
    </Card>
  );
}