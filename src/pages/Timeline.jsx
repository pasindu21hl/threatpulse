import React, { useState } from "react";
import { 
  Row, 
  Col, 
  Card, 
  Timeline as AntTimeline, 
  Input, 
  Select, 
  Slider, 
  Tag, 
  Typography, 
  Space, 
  Button, 
  Badge, 
  Skeleton,
  Empty,
  Divider
} from "antd";
import { useThreatPulse } from "../context/ThreatPulseContext";
import { 
  HistoryOutlined, 
  SearchOutlined, 
  FilterOutlined, 
  ClearOutlined,
  CompassOutlined,
  LaptopOutlined,
  SafetyOutlined
} from "@ant-design/icons";

const { Title, Text, Paragraph } = Typography;
const { Option } = Select;

const ATTACK_STAGES = [
  "Reconnaissance",
  "Initial Access",
  "Execution",
  "Privilege Escalation",
  "Persistence",
  "Defense Evasion",
  "Lateral Movement",
  "Exfiltration",
  "Impact — Encryption",
  "Command and Control"
];

const Timeline = () => {
  const { timeline, loading } = useThreatPulse();

  // Filters State
  const [searchText, setSearchText] = useState("");
  const [selectedStage, setSelectedStage] = useState("ALL");
  const [selectedRisk, setSelectedRisk] = useState("ALL");
  const [minConfidence, setMinConfidence] = useState(0);

  // Inspector State (Selected event to view in detail)
  const [inspectorEvent, setInspectorEvent] = useState(null);

  // Clear filters helper
  const handleClearFilters = () => {
    setSearchText("");
    setSelectedStage("ALL");
    setSelectedRisk("ALL");
    setMinConfidence(0);
  };

  // Color mappings
  const getRiskColor = (risk) => {
    switch (String(risk).toLowerCase()) {
      case "critical":
        return "#ff4d4f";
      case "high":
        return "#faad14";
      case "medium":
        return "#1890ff";
      case "low":
        return "#52c41a";
      default:
        return "#d9d9d9";
    }
  };

  const getRiskTagColor = (risk) => {
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

  // Apply filters to timeline list
  const filteredEvents = timeline.filter((evt) => {
    const matchesSearch = 
      evt.description.toLowerCase().includes(searchText.toLowerCase()) ||
      evt.agent.toLowerCase().includes(searchText.toLowerCase()) ||
      evt.mitre_id.toLowerCase().includes(searchText.toLowerCase());

    const matchesStage = selectedStage === "ALL" || evt.stage === selectedStage;
    
    const matchesRisk = selectedRisk === "ALL" || evt.risk.toUpperCase() === selectedRisk.toUpperCase();

    const matchesConfidence = evt.confidence >= minConfidence;

    return matchesSearch && matchesStage && matchesRisk && matchesConfidence;
  });

  // Sort: show latest first
  const sortedEvents = [...filteredEvents].sort(
    (a, b) => new Date(b.timestamp) - new Date(a.timestamp)
  );

  return (
    <Space direction="vertical" size="large" style={{ width: "100%" }}>
      {/* Header */}
      <div>
        <Title level={2} style={{ margin: 0 }}>
          <HistoryOutlined /> MITRE ATT&CK Incident Timeline
        </Title>
        <Text type="secondary">
          Track and inspect the sequential steps of active ransomware execution.
        </Text>
      </div>

      <Row gutter={[16, 16]}>
        {/* Filters Card */}
        <Col xs={24}>
          <Card bordered={false} bodyStyle={{ padding: "16px 24px" }}>
            <Row gutter={[16, 16]} align="middle">
              <Col xs={24} sm={12} md={6}>
                <Text strong style={{ display: "block", marginBottom: 6 }}>Search Description / Agent</Text>
                <Input
                  placeholder="e.g. Mimic, Wazuh-Agent..."
                  prefix={<SearchOutlined />}
                  value={searchText}
                  onChange={(e) => setSearchText(e.target.value)}
                  allowClear
                />
              </Col>
              
              <Col xs={24} sm={12} md={5}>
                <Text strong style={{ display: "block", marginBottom: 6 }}>MITRE ATT&CK Stage</Text>
                <Select
                  style={{ width: "100%" }}
                  value={selectedStage}
                  onChange={setSelectedStage}
                >
                  <Option value="ALL">All Stages</Option>
                  {ATTACK_STAGES.map(stage => (
                    <Option key={stage} value={stage}>{stage}</Option>
                  ))}
                </Select>
              </Col>

              <Col xs={24} sm={12} md={4}>
                <Text strong style={{ display: "block", marginBottom: 6 }}>Risk Severity</Text>
                <Select
                  style={{ width: "100%" }}
                  value={selectedRisk}
                  onChange={setSelectedRisk}
                >
                  <Option value="ALL">All Severities</Option>
                  <Option value="CRITICAL">Critical</Option>
                  <Option value="HIGH">High</Option>
                  <Option value="MEDIUM">Medium</Option>
                  <Option value="LOW">Low</Option>
                </Select>
              </Col>

              <Col xs={24} sm={12} md={6}>
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <Text strong>Min ML Confidence</Text>
                  <Text type="secondary">{minConfidence}%</Text>
                </div>
                <Slider
                  min={0}
                  max={100}
                  value={minConfidence}
                  onChange={setMinConfidence}
                  style={{ margin: "10px 0 0 0" }}
                />
              </Col>

              <Col xs={24} md={3} style={{ display: "flex", justifyContent: "flex-end" }}>
                <Button 
                  icon={<ClearOutlined />} 
                  onClick={handleClearFilters}
                  disabled={searchText === "" && selectedStage === "ALL" && selectedRisk === "ALL" && minConfidence === 0}
                >
                  Reset
                </Button>
              </Col>
            </Row>
          </Card>
        </Col>

        {/* Visual Timeline and Inspector */}
        <Col xs={24} lg={14}>
          <Card 
            title={
              <Space>
                <FilterOutlined /> 
                <span>Correlated Attack Path ({sortedEvents.length} Events)</span>
              </Space>
            } 
            bordered={false}
          >
            {loading ? (
              <Skeleton active paragraph={{ rows: 10 }} />
            ) : sortedEvents.length > 0 ? (
              <div style={{ padding: "10px 10px 0 10px", maxHeight: "60vh", overflowY: "auto" }}>
                <AntTimeline
                  mode="left"
                  items={sortedEvents.map((evt) => {
                    const isSelected = inspectorEvent?.id === evt.id;
                    return {
                      dot: (
                        <div 
                          style={{
                            width: "12px",
                            height: "12px",
                            borderRadius: "50%",
                            background: getRiskColor(evt.risk),
                            border: isSelected ? "3px solid #ffffff" : "none",
                            cursor: "pointer",
                            boxShadow: isSelected ? "0 0 8px rgba(255, 255, 255, 0.6)" : "none"
                          }}
                          onClick={() => setInspectorEvent(evt)}
                        />
                      ),
                      children: (
                        <div 
                          onClick={() => setInspectorEvent(evt)}
                          style={{
                            cursor: "pointer",
                            background: isSelected ? "rgba(24, 144, 255, 0.08)" : "transparent",
                            padding: "10px 14px",
                            borderRadius: "6px",
                            transition: "background 0.3s",
                            border: isSelected ? "1px solid rgba(24, 144, 255, 0.3)" : "1px solid transparent"
                          }}
                        >
                          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                            <Text strong style={{ fontSize: "14px" }}>{evt.stage}</Text>
                            <Space size="small">
                              <Tag color={getRiskTagColor(evt.risk)} style={{ marginRight: 0 }}>
                                {evt.risk}
                              </Tag>
                            </Space>
                          </div>
                          
                          <Paragraph style={{ margin: "6px 0", fontSize: "13px" }}>
                            {evt.description}
                          </Paragraph>

                          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: "12px" }}>
                            <Space>
                              <Tag color="blue">{evt.mitre_id}</Tag>
                              <Text type="secondary" code>{evt.agent}</Text>
                            </Space>
                            <Text type="secondary">
                              {new Date(evt.timestamp).toLocaleString()}
                            </Text>
                          </div>
                        </div>
                      )
                    };
                  })}
                />
              </div>
            ) : (
              <Empty description="No events match current filter conditions." />
            )}
          </Card>
        </Col>

        {/* Inspector Detail Card */}
        <Col xs={24} lg={10}>
          <Card 
            title={
              <Space>
                <CompassOutlined />
                <span>Evidence Inspector</span>
              </Space>
            }
            bordered={false}
            style={{ height: "100%" }}
          >
            {inspectorEvent ? (
              <Space direction="vertical" size="middle" style={{ width: "100%" }}>
                <div>
                  <Text type="secondary">MITRE ATT&CK Stage</Text>
                  <Title level={4} style={{ margin: "4px 0" }}>{inspectorEvent.stage}</Title>
                  <Tag color={getRiskTagColor(inspectorEvent.risk)}>{inspectorEvent.risk} Severity</Tag>
                  <Tag color="cyan">ML Confidence: {inspectorEvent.confidence}%</Tag>
                </div>
                
                <Divider style={{ margin: "8px 0" }} />

                <div>
                  <Text type="secondary">Description</Text>
                  <Paragraph style={{ marginTop: "4px", fontSize: "14px" }}>
                    {inspectorEvent.description}
                  </Paragraph>
                </div>

                <div style={{ display: "flex", gap: "24px" }}>
                  <div>
                    <Text type="secondary" style={{ display: "block" }}>MITRE Technique</Text>
                    <a 
                      href={`https://attack.mitre.org/techniques/${inspectorEvent.mitre_id.split(".")[0]}`} 
                      target="_blank" 
                      rel="noopener noreferrer"
                    >
                      <Tag color="blue" style={{ marginTop: "4px", cursor: "pointer" }}>{inspectorEvent.mitre_id}</Tag>
                    </a>
                  </div>
                  <div>
                    <Text type="secondary" style={{ display: "block" }}>Source Node</Text>
                    <Text strong style={{ display: "inline-block", marginTop: "4px" }}>
                      <LaptopOutlined /> {inspectorEvent.agent}
                    </Text>
                  </div>
                </div>

                <div>
                  <Text type="secondary">Correlation Timestamp</Text>
                  <div style={{ marginTop: "4px" }}>
                    {new Date(inspectorEvent.timestamp).toLocaleString()}
                  </div>
                </div>

                <Divider style={{ margin: "8px 0" }} />

                <div>
                  <Text type="secondary" style={{ display: "block", marginBottom: 6 }}>SOAR Playbook Status</Text>
                  {inspectorEvent.risk === "Critical" || inspectorEvent.risk === "High" ? (
                    <Badge status="warning" text="Mitigation required (Isolate host, reset credentials)" />
                  ) : (
                    <Badge status="success" text="Monitored (Automatic ingestion complete)" />
                  )}
                </div>
              </Space>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: 280 }}>
                <SafetyOutlined style={{ fontSize: "48px", color: "rgba(255, 255, 255, 0.2)", marginBottom: 16 }} />
                <Text type="secondary">Select any event timeline node or dot to inspect its deep security headers.</Text>
              </div>
            )}
          </Card>
        </Col>
      </Row>
    </Space>
  );
};

export default Timeline;
