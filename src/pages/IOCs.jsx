import React, { useState } from "react";
import { 
  Table, 
  Card, 
  Input, 
  Select, 
  Tag, 
  Space, 
  Button, 
  Typography, 
  Skeleton,
  message,
  Tooltip,
  Row,
  Col
} from "antd";
import { useThreatPulse } from "../context/ThreatPulseContext";
import { 
  SafetyCertificateOutlined, 
  SearchOutlined, 
  CopyOutlined, 
  FilterOutlined,
  ExclamationCircleOutlined
} from "@ant-design/icons";

const { Title, Text } = Typography;
const { Option } = Select;

const IOCs = () => {
  const { iocs, loading } = useThreatPulse();

  const [searchText, setSearchText] = useState("");
  const [selectedType, setSelectedType] = useState("ALL");
  const [selectedRisk, setSelectedRisk] = useState("ALL");

  // Get unique IOC types in list for select dropdown
  const uniqueTypes = ["ALL", ...new Set(iocs.map(ioc => ioc.type))];

  const handleCopy = (value) => {
    navigator.clipboard.writeText(value);
    message.success({
      content: `Copied IOC value: ${value.length > 20 ? value.substring(0, 20) + "..." : value}`,
      duration: 2
    });
  };

  // Color mapping helper
  const getRiskLevelColor = (risk) => {
    switch (String(risk).toLowerCase()) {
      case "critical":
        return "red";
      case "high":
        return "volcano";
      case "medium":
        return "orange";
      case "low":
        return "green";
      default:
        return "blue";
    }
  };

  // Filtered IOC list
  const filteredIOCs = iocs.filter((ioc) => {
    const matchesSearch = 
      ioc.value.toLowerCase().includes(searchText.toLowerCase()) ||
      ioc.agent.toLowerCase().includes(searchText.toLowerCase()) ||
      ioc.type.toLowerCase().includes(searchText.toLowerCase());

    const matchesType = selectedType === "ALL" || ioc.type === selectedType;
    const matchesRisk = selectedRisk === "ALL" || ioc.risk_level.toUpperCase() === selectedRisk.toUpperCase();

    return matchesSearch && matchesType && matchesRisk;
  });

  const columns = [
    {
      title: "Indicator Type",
      dataIndex: "type",
      key: "type",
      width: "18%",
      render: (type) => {
        let color = "default";
        if (type.includes("IP")) color = "blue";
        else if (type.includes("Hash")) color = "purple";
        else if (type.includes("URL") || type.includes("Domain")) color = "cyan";
        else if (type.includes("Registry")) color = "magenta";
        
        return <Tag color={color}>{type}</Tag>;
      },
      sorter: (a, b) => a.type.localeCompare(b.type),
    },
    {
      title: "Value",
      dataIndex: "value",
      key: "value",
      width: "42%",
      render: (value) => (
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <Text code style={{ wordBreak: "break-all" }}>{value}</Text>
          <Tooltip title="Copy to clipboard">
            <Button 
              type="text" 
              size="small" 
              icon={<CopyOutlined />} 
              onClick={() => handleCopy(value)}
              style={{ marginLeft: 8 }}
            />
          </Tooltip>
        </div>
      ),
    },
    {
      title: "Risk Level",
      dataIndex: "risk_level",
      key: "risk_level",
      width: "12%",
      sorter: (a, b) => a.risk_level.localeCompare(b.risk_level),
      render: (risk) => <Tag color={getRiskLevelColor(risk)}>{risk.toUpperCase()}</Tag>,
    },
    {
      title: "Source Agent",
      dataIndex: "agent",
      key: "agent",
      width: "14%",
      sorter: (a, b) => a.agent.localeCompare(b.agent),
      render: (agent) => <Text strong>{agent}</Text>,
    },
    {
      title: "First Seen",
      dataIndex: "first_seen",
      key: "first_seen",
      width: "14%",
      render: (time) => <Text type="secondary">{new Date(time).toLocaleString()}</Text>,
    },
  ];

  return (
    <Space direction="vertical" size="large" style={{ width: "100%" }}>
      {/* Header */}
      <div>
        <Title level={2} style={{ margin: 0 }}>
          <SafetyCertificateOutlined /> Indicators of Compromise (IOCs)
        </Title>
        <Text type="secondary">
          Centralized database of security identifiers correlated from network and host logs.
        </Text>
      </div>

      {/* Filter Options */}
      <Card bordered={false}>
        <Row gutter={[16, 16]} align="middle">
          <Col xs={24} sm={10}>
            <Text strong style={{ display: "block", marginBottom: 6 }}>Search Indicator Value</Text>
            <Input
              placeholder="Search by IP, file hash, key or agent name..."
              prefix={<SearchOutlined />}
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              allowClear
            />
          </Col>
          <Col xs={24} sm={7}>
            <Text strong style={{ display: "block", marginBottom: 6 }}>Filter by Type</Text>
            <Select
              style={{ width: "100%" }}
              value={selectedType}
              onChange={setSelectedType}
            >
              {uniqueTypes.map((t) => (
                <Option key={t} value={t}>
                  {t === "ALL" ? "All Types" : t}
                </Option>
              ))}
            </Select>
          </Col>
          <Col xs={24} sm={7}>
            <Text strong style={{ display: "block", marginBottom: 6 }}>Filter by Risk Level</Text>
            <Select
              style={{ width: "100%" }}
              value={selectedRisk}
              onChange={setSelectedRisk}
            >
              <Option value="ALL">All Risks</Option>
              <Option value="CRITICAL">Critical</Option>
              <Option value="HIGH">High</Option>
              <Option value="MEDIUM">Medium</Option>
              <Option value="LOW">Low</Option>
            </Select>
          </Col>
        </Row>
      </Card>

      {/* IOC Table */}
      <Card bordered={false}>
        {loading ? (
          <Skeleton active paragraph={{ rows: 10 }} />
        ) : (
          <Table
            columns={columns}
            dataSource={filteredIOCs}
            rowKey={(record) => record.value}
            pagination={{ defaultPageSize: 10, showSizeChanger: true }}
            footer={() => (
              <Space>
                <ExclamationCircleOutlined />
                <Text type="secondary">
                  Showing {filteredIOCs.length} correlated indicators. Export values directly for SIEM/Firewall ingestion rules.
                </Text>
              </Space>
            )}
          />
        )}
      </Card>
    </Space>
  );
};

export default IOCs;
