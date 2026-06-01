import React, { useState } from "react";
import { 
  Row, 
  Col, 
  Card, 
  Badge, 
  Typography, 
  Space, 
  Button, 
  Tag, 
  Progress, 
  Skeleton, 
  Modal, 
  List, 
  Divider,
  Statistic 
} from "antd";
import { useThreatPulse } from "../context/ThreatPulseContext";
import { 
  LaptopOutlined, 
  InfoCircleOutlined, 
  ReloadOutlined, 
  SafetyOutlined, 
  WindowsOutlined, 
  InfoOutlined,
  DashboardOutlined 
} from "@ant-design/icons";

const { Title, Text, Paragraph } = Typography;

const Agents = () => {
  const { agents, loading, syncData } = useThreatPulse();
  const [selectedAgent, setSelectedAgent] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);

  // Helper to get OS icon
  const getOSIcon = (os) => {
    if (!os) return <LaptopOutlined />;
    const lowercaseOS = os.toLowerCase();
    if (lowercaseOS.includes("windows")) {
      return <WindowsOutlined style={{ color: "#1890ff" }} />;
    }
    // Linux representation
    return <LaptopOutlined style={{ color: "#fa8c16" }} />;
  };

  // Helper to determine status color
  const getStatusBadge = (status) => {
    switch (status) {
      case "Online":
        return <Badge status="success" text="Online" />;
      case "Compromised":
        return <Badge status="error" text="Compromised" />;
      case "Offline":
        return <Badge status="default" text="Offline" />;
      default:
        return <Badge status="processing" text={status} />;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "Online":
        return "success";
      case "Compromised":
        return "error";
      default:
        return "default";
    }
  };

  // Stats calculators
  const totalAgents = agents.length;
  const onlineAgents = agents.filter(a => a.status === "Online").length;
  const compromisedAgents = agents.filter(a => a.status === "Compromised").length;
  const offlineAgents = agents.filter(a => a.status === "Offline").length;

  const onlineRatio = totalAgents > 0 ? Math.round((onlineAgents / totalAgents) * 100) : 0;

  const showDetails = (agent) => {
    setSelectedAgent(agent);
    setModalVisible(true);
  };

  return (
    <Space direction="vertical" size="large" style={{ width: "100%" }}>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div>
          <Title level={2} style={{ margin: 0 }}>
            <LaptopOutlined /> Connected Wazuh Agents
          </Title>
          <Text type="secondary">
            Monitor connection health, operating systems, and alert logs across endpoints.
          </Text>
        </div>
        <Button icon={<ReloadOutlined />} onClick={syncData}>
          Refresh Sync
        </Button>
      </div>

      {/* Agents Summary Statistics Card */}
      {loading ? (
        <Skeleton active paragraph={{ rows: 2 }} />
      ) : (
        <Card bordered={false}>
          <Row gutter={[24, 24]} align="middle">
            <Col xs={24} sm={6}>
              <Statistic title="Total Registered Nodes" value={totalAgents} />
            </Col>
            <Col xs={12} sm={6}>
              <Statistic 
                title="Active / Online" 
                value={onlineAgents} 
                valueStyle={{ color: "#52c41a" }} 
              />
            </Col>
            <Col xs={12} sm={6}>
              <Statistic 
                title="Active Compromised" 
                value={compromisedAgents} 
                valueStyle={{ color: "#ff4d4f" }} 
              />
            </Col>
            <Col xs={24} sm={6}>
              <Text type="secondary" style={{ display: "block", marginBottom: 6 }}>Network Status Health Ratio</Text>
              <Progress 
                percent={onlineRatio} 
                success={{ percent: onlineRatio }} 
                status={compromisedAgents > 0 ? "exception" : "normal"}
              />
            </Col>
          </Row>
        </Card>
      )}

      {/* Grid of Agent Cards */}
      {loading ? (
        <Row gutter={[16, 16]}>
          {[1, 2, 3, 4].map(i => (
            <Col xs={24} sm={12} md={8} xl={6} key={i}>
              <Card><Skeleton active /></Card>
            </Col>
          ))}
        </Row>
      ) : (
        <Row gutter={[16, 16]}>
          {agents.map((ag) => (
            <Col xs={24} sm={12} md={8} xl={6} key={ag.agent}>
              <Card 
                hoverable 
                bordered={false} 
                bodyStyle={{ padding: "20px" }}
                actions={[
                  <Button 
                    type="link" 
                    icon={<InfoCircleOutlined />} 
                    onClick={() => showDetails(ag)}
                    style={{ padding: 0 }}
                  >
                    View Agent Details
                  </Button>
                ]}
                style={{
                  borderTop: ag.status === "Compromised" ? "3px solid #ff4d4f" : "3px solid transparent"
                }}
              >
                <Space direction="vertical" style={{ width: "100%" }} size="middle">
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                    <Space size="middle">
                      {getOSIcon(ag.os)}
                      <div>
                        <Text strong style={{ fontSize: "15px" }}>{ag.agent}</Text>
                        <div style={{ fontSize: "12px", color: "rgba(255, 255, 255, 0.45)" }}>IP: {ag.ip}</div>
                      </div>
                    </Space>
                    <Tag color={getStatusColor(ag.status)}>
                      {ag.status}
                    </Tag>
                  </div>

                  <div>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                      <Text type="secondary" style={{ fontSize: "12px" }}>Ingested Events</Text>
                      <Text strong style={{ fontSize: "12px" }}>{ag.count}</Text>
                    </div>
                    <Progress 
                      percent={Math.min(100, Math.round((ag.count / 1200) * 100))} 
                      showInfo={false} 
                      size="small"
                      status={ag.status === "Compromised" ? "exception" : "active"}
                    />
                  </div>

                  <div style={{ fontSize: "11px", color: "rgba(255, 255, 255, 0.45)", display: "flex", justifyContent: "space-between" }}>
                    <span>OS: {ag.os.split(" ")[0]}</span>
                    <span>Seen: {new Date(ag.last_seen).toLocaleTimeString()}</span>
                  </div>
                </Space>
              </Card>
            </Col>
          ))}
        </Row>
      )}

      {/* Detailed Agent Modal */}
      <Modal
        title={selectedAgent ? `Agent Inspector: ${selectedAgent.agent}` : "Agent Details"}
        open={modalVisible}
        onCancel={() => setModalVisible(false)}
        footer={[
          <Button key="close" type="primary" onClick={() => setModalVisible(false)}>
            Done
          </Button>
        ]}
      >
        {selectedAgent && (
          <Space direction="vertical" style={{ width: "100%" }} size="middle">
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <Space>
                {getOSIcon(selectedAgent.os)}
                <Text strong style={{ fontSize: "16px" }}>{selectedAgent.agent}</Text>
              </Space>
              {getStatusBadge(selectedAgent.status)}
            </div>

            <Divider style={{ margin: "12px 0" }} />

            <List size="small" bordered={false}>
              <List.Item>
                <Text type="secondary">Endpoint IP Address</Text>
                <Text code>{selectedAgent.ip}</Text>
              </List.Item>
              <List.Item>
                <Text type="secondary">Operating System</Text>
                <Text>{selectedAgent.os}</Text>
              </List.Item>
              <List.Item>
                <Text type="secondary">Last Heartbeat Sync</Text>
                <Text>{new Date(selectedAgent.last_seen).toLocaleString()}</Text>
              </List.Item>
              <List.Item>
                <Text type="secondary">Aggregated Logs Ingested</Text>
                <Text strong>{selectedAgent.count} Events</Text>
              </List.Item>
              <List.Item>
                <Text type="secondary">Wazuh Active Profile</Text>
                <Tag color="blue">Ransomware-Evasion-Rulepack v3</Tag>
              </List.Item>
            </List>

            <Divider style={{ margin: "12px 0" }} />

            {selectedAgent.status === "Compromised" ? (
              <Card size="small" style={{ background: "rgba(255, 77, 79, 0.05)", border: "1px solid rgba(255, 77, 79, 0.2)" }}>
                <Space>
                  <SafetyOutlined style={{ color: "#ff4d4f", fontSize: "18px" }} />
                  <div>
                    <Text strong style={{ color: "#ff4d4f" }}>Incident Isolation Recommended</Text>
                    <Paragraph style={{ margin: 0, fontSize: "12px" }}>
                      This agent has reported active registry changes and defender disablement. Deploy SOAR isolation playbook immediately.
                    </Paragraph>
                  </div>
                </Space>
              </Card>
            ) : (
              <Card size="small" style={{ background: "rgba(82, 196, 26, 0.05)", border: "1px solid rgba(82, 196, 26, 0.2)" }}>
                <Space>
                  <SafetyOutlined style={{ color: "#52c41a", fontSize: "18px" }} />
                  <div>
                    <Text strong style={{ color: "#52c41a" }}>Endpoint Node Secured</Text>
                    <Paragraph style={{ margin: 0, fontSize: "12px" }}>
                      Standard telemetry checks passed. No high-risk anomalies reported in last 24 hours.
                    </Paragraph>
                  </div>
                </Space>
              </Card>
            )}
          </Space>
        )}
      </Modal>
    </Space>
  );
};

export default Agents;
