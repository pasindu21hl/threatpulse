import React from "react";
import { 
  Row, 
  Col, 
  Card, 
  Statistic, 
  Progress, 
  Timeline as AntTimeline, 
  Table, 
  Tag, 
  Button, 
  Space, 
  Typography, 
  Tooltip, 
  Badge, 
  Skeleton, 
  Empty 
} from "antd";
import { Link } from "react-router-dom";
import { useThreatPulse } from "../context/ThreatPulseContext";
import { Column } from "@ant-design/charts";
import {
  AlertOutlined,
  SafetyCertificateOutlined,
  BugOutlined,
  SearchOutlined,
  ArrowRightOutlined,
  PlayCircleOutlined,
  FileSyncOutlined,
  DashboardOutlined,
  GlobalOutlined
} from "@ant-design/icons";

const { Title, Text, Paragraph } = Typography;

const Dashboard = () => {
  const { 
    stats, 
    timeline, 
    ml, 
    iocs, 
    agents, 
    report, 
    loading, 
    triggerScan, 
    generateAIReport,
    lastUpdated 
  } = useThreatPulse();

  // Color mappings for Risk Level
  const getRiskColor = (risk) => {
    if (risk >= 80) return "#ff4d4f"; // Red
    if (risk >= 50) return "#faad14"; // Orange
    return "#52c41a"; // Green
  };

  const getRiskTag = (risk) => {
    if (risk >= 80) return <Tag color="error">CRITICAL</Tag>;
    if (risk >= 50) return <Tag color="warning">HIGH RISK</Tag>;
    return <Tag color="success">STABLE</Tag>;
  };

  // Color mapping for threat levels in tables/timelines
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

  // Chart configuration for ML stage classification
  const chartData = ml.map(item => ({
    stage: item.stage.split(" ").slice(0, 2).join(" "), // Truncate stage names for readability
    count: item.count,
    confidence: item.confidence
  }));

  const chartConfig = {
    data: chartData,
    xField: "stage",
    yField: "count",
    style: {
      fill: ({ stage }) => {
        if (stage.includes("Impact") || stage.includes("Exfiltration")) return "#ff4d4f";
        if (stage.includes("Defense") || stage.includes("Lateral")) return "#faad14";
        return "#1890ff";
      },
      maxWidth: 40,
      radius: [4, 4, 0, 0]
    },
    tooltip: {
      title: "stage",
      items: [
        { channel: "y", name: "Events Count" },
        { name: "ML Confidence", field: "confidence", valueFormatter: (v) => `${v}%` }
      ]
    },
    label: {
      text: "count",
      position: "inside",
      style: {
        fill: "#fff",
        opacity: 0.8
      }
    },
    axis: {
      x: { labelAutoRotate: true }
    }
  };

  // IOC Columns for summary table
  const iocColumns = [
    {
      title: "IOC Type",
      dataIndex: "type",
      key: "type",
      render: (type) => <Text strong>{type}</Text>,
    },
    {
      title: "Value",
      dataIndex: "value",
      key: "value",
      ellipsis: true,
      render: (val) => <Text code>{val}</Text>,
    },
    {
      title: "Risk",
      dataIndex: "risk_level",
      key: "risk_level",
      render: (risk) => <Tag color={getRiskLevelColor(risk)}>{risk}</Tag>,
    },
  ];

  return (
    <Space direction="vertical" size="large" style={{ width: "100%" }}>
      {/* Page Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div>
          <Title level={2} style={{ margin: 0 }}>
            <DashboardOutlined /> Threat Intelligence Overview
          </Title>
          <Text type="secondary">
            Ransomware evidence correlation and active telemetry dashboard.
          </Text>
        </div>
        <div>
          {lastUpdated && (
            <Text type="secondary" style={{ fontSize: "12px" }}>
              Last updated: {new Date(lastUpdated).toLocaleTimeString()}
            </Text>
          )}
        </div>
      </div>

      {/* Stats Row */}
      {loading ? (
        <Row gap="middle" gutter={[16, 16]}>
          {[1, 2, 3, 4].map((i) => (
            <Col xs={24} sm={12} lg={6} key={i}>
              <Card><Skeleton active paragraph={{ rows: 1 }} /></Card>
            </Col>
          ))}
        </Row>
      ) : (
        <Row gutter={[16, 16]}>
          <Col xs={24} sm={12} lg={6}>
            <Card hoverable bordered={false}>
              <Statistic
                title="Total Correlated Events"
                value={stats.total_events}
                prefix={<GlobalOutlined style={{ color: "#1890ff" }} />}
              />
            </Card>
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <Card hoverable bordered={false}>
              <Statistic
                title="Active Threats"
                value={stats.threats}
                valueStyle={{ color: stats.threats > 0 ? "#ff4d4f" : "#52c41a" }}
                prefix={<BugOutlined />}
              />
            </Card>
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <Card hoverable bordered={false}>
              <Statistic
                title="Indicators of Compromise"
                value={stats.iocs}
                prefix={<SafetyCertificateOutlined style={{ color: "#722ed1" }} />}
              />
            </Card>
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <Card hoverable bordered={false}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                <div style={{ flexGrow: 1 }}>
                  <Text type="secondary">System Security Score</Text>
                  <div style={{ marginTop: "4px" }}>
                    <Progress
                      percent={stats.risk_level}
                      status={stats.risk_level > 80 ? "exception" : "active"}
                      strokeColor={getRiskColor(stats.risk_level)}
                      size="small"
                      showInfo={false}
                    />
                  </div>
                  <div style={{ marginTop: "8px", fontSize: "16px", fontWeight: "bold" }}>
                    Risk Level: {stats.risk_level}%
                  </div>
                </div>
                <div>
                  {getRiskTag(stats.risk_level)}
                </div>
              </div>
            </Card>
          </Col>
        </Row>
      )}

      {/* Main Dashboard Panels */}
      <Row gutter={[16, 16]}>
        {/* ML Attack Stage Chart */}
        <Col xs={24} xl={16}>
          <Card 
            title="MITRE ATT&CK Stage Classification (ML Confidence)" 
            bordered={false}
            extra={<Text type="secondary">Active Kill-Chain State</Text>}
          >
            {loading ? (
              <Skeleton active paragraph={{ rows: 8 }} />
            ) : chartData.some(d => d.count > 0) ? (
              <div style={{ height: 320 }}>
                <Column {...chartConfig} />
              </div>
            ) : (
              <Empty description="No machine learning logs classified." />
            )}
          </Card>
        </Col>

        {/* Live Attack Timeline Feed */}
        <Col xs={24} xl={8}>
          <Card 
            title="Live Incident Feed" 
            bordered={false} 
            extra={
              <Link to="/timeline">
                View All <ArrowRightOutlined />
              </Link>
            }
            bodyStyle={{ maxHeight: 360, overflowY: "auto" }}
          >
            {loading ? (
              <Skeleton active />
            ) : timeline.length > 0 ? (
              <AntTimeline
                items={timeline.slice(0, 5).map((evt) => ({
                  color: getRiskLevelColor(evt.risk),
                  children: (
                    <div style={{ marginBottom: "12px" }}>
                      <div style={{ display: "flex", justifyContent: "space-between" }}>
                        <Text strong style={{ fontSize: "13px" }}>{evt.stage}</Text>
                        <Tag color={getRiskLevelColor(evt.risk)} style={{ marginRight: 0 }}>
                          {evt.risk}
                        </Tag>
                      </div>
                      <Text style={{ display: "block", margin: "4px 0", fontSize: "12px" }}>
                        {evt.description}
                      </Text>
                      <div style={{ display: "flex", justifyContent: "space-between", fontSize: "11px" }}>
                        <Text type="secondary" code>{evt.agent}</Text>
                        <Text type="secondary">
                          {new Date(evt.timestamp).toLocaleTimeString()}
                        </Text>
                      </div>
                    </div>
                  ),
                }))}
              />
            ) : (
              <Empty description="No alerts recorded in the past 24 hours." />
            )}
          </Card>
        </Col>
      </Row>

      {/* Row for IOCs & AI Playbook */}
      <Row gutter={[16, 16]}>
        {/* IOCs Summary Table */}
        <Col xs={24} lg={12}>
          <Card 
            title="Indicators of Compromise (IOC) Summary" 
            bordered={false}
            extra={
              <Link to="/iocs">
                All IOCs <ArrowRightOutlined />
              </Link>
            }
          >
            {loading ? (
              <Skeleton active paragraph={{ rows: 5 }} />
            ) : (
              <Table
                dataSource={iocs.slice(0, 5)}
                columns={iocColumns}
                rowKey={(record) => record.value}
                pagination={false}
                size="small"
              />
            )}
          </Card>
        </Col>

        {/* SOAR / AI Playbook Card */}
        <Col xs={24} lg={12}>
          <Card 
            title="SOAR & AI Copilot Actions" 
            bordered={false}
            extra={<Tag color="purple">Automation</Tag>}
          >
            <Space direction="vertical" style={{ width: "100%" }} size="middle">
              <div style={{ padding: "12px", background: "rgba(255, 255, 255, 0.02)", borderRadius: "6px" }}>
                <Title level={5} style={{ marginTop: 0 }}>
                  <AlertOutlined style={{ color: "#faad14" }} /> Active Ransomware Playbooks
                </Title>
                <Paragraph style={{ fontSize: "13px" }}>
                  ThreatPulse intercepts Wazuh events, applies ML classifications, and enables direct execution of automated responses (containment, firewall blocks, or active scanning).
                </Paragraph>
              </div>

              {/* Action Buttons */}
              <Row gutter={[12, 12]}>
                <Col xs={12}>
                  <Button 
                    type="primary" 
                    icon={<PlayCircleOutlined />} 
                    onClick={triggerScan}
                    style={{ width: "100%" }}
                  >
                    Run Security Scan
                  </Button>
                </Col>
                <Col xs={12}>
                  <Button 
                    type="default" 
                    icon={<FileSyncOutlined />} 
                    onClick={generateAIReport}
                    style={{ width: "100%" }}
                  >
                    Synthesize AI Report
                  </Button>
                </Col>
              </Row>

              {/* Mini AI Preview */}
              {report ? (
                <div style={{ borderLeft: "3px solid #722ed1", paddingLeft: "12px" }}>
                  <Text strong style={{ fontSize: "13px" }}>Latest Incident Assessment</Text>
                  <Paragraph ellipsis={{ rows: 2 }} style={{ fontSize: "12px", margin: "4px 0 0 0" }}>
                    {report.report}
                  </Paragraph>
                  <Link to="/report" style={{ fontSize: "12px", display: "inline-block", marginTop: "4px" }}>
                    View full assessment <ArrowRightOutlined />
                  </Link>
                </div>
              ) : (
                <div style={{ borderLeft: "3px solid #d9d9d9", paddingLeft: "12px", color: "rgba(255, 255, 255, 0.45)" }}>
                  <Text style={{ fontSize: "12px" }}>No report generated yet. Click 'Synthesize AI Report' to begin.</Text>
                </div>
              )}
            </Space>
          </Card>
        </Col>
      </Row>

      {/* Connected Agents Bar (Online Status) */}
      <Card title="Connected Host Nodes Status" bordered={false}>
        {loading ? (
          <Skeleton active paragraph={{ rows: 1 }} />
        ) : (
          <Row gutter={[16, 16]}>
            {agents.map((ag) => {
              let statusColor = "processing";
              if (ag.status === "Compromised") statusColor = "error";
              else if (ag.status === "Offline") statusColor = "default";
              else if (ag.status === "Online") statusColor = "success";

              return (
                <Col xs={12} sm={6} key={ag.agent}>
                  <Card size="small" style={{ background: "rgba(255, 255, 255, 0.01)" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <div>
                        <Text strong style={{ fontSize: "13px" }}>{ag.agent}</Text>
                        <div style={{ fontSize: "11px", color: "rgba(255, 255, 255, 0.45)" }}>{ag.ip}</div>
                      </div>
                      <Badge status={statusColor} text={ag.status} />
                    </div>
                  </Card>
                </Col>
              );
            })}
          </Row>
        )}
      </Card>
    </Space>
  );
};

export default Dashboard;
