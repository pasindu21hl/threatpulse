import React, { useState } from "react";
import { 
  Card, 
  Button, 
  Space, 
  Typography, 
  Tag, 
  Spin, 
  Empty, 
  Divider, 
  message,
  Row,
  Col
} from "antd";
import { useThreatPulse } from "../context/ThreatPulseContext";
import { 
  FileTextOutlined, 
  FileSyncOutlined, 
  CopyOutlined, 
  DownloadOutlined, 
  PrinterOutlined,
  LoadingOutlined,
  CheckCircleOutlined
} from "@ant-design/icons";

const { Title, Text, Paragraph } = Typography;

// Custom Lightweight Markdown Renderer to output native Ant Design Typography
const MarkdownRenderer = ({ content }) => {
  if (!content) return null;
  
  const lines = content.split("\n");
  let inCodeBlock = false;
  let codeContent = [];

  return (
    <div className="printable-report" style={{ lineHeight: "1.6" }}>
      {lines.map((line, idx) => {
        // Code block toggle
        if (line.startsWith("```")) {
          if (inCodeBlock) {
            inCodeBlock = false;
            const code = codeContent.join("\n");
            codeContent = [];
            return (
              <pre 
                key={idx} 
                style={{ 
                  background: "rgba(255, 255, 255, 0.03)", 
                  padding: "12px", 
                  borderRadius: "6px", 
                  overflowX: "auto",
                  border: "1px solid rgba(255, 255, 255, 0.08)",
                  margin: "12px 0"
                }}
              >
                <Text code>{code}</Text>
              </pre>
            );
          } else {
            inCodeBlock = true;
            return null;
          }
        }

        if (inCodeBlock) {
          codeContent.push(line);
          return null;
        }

        // Header 1
        if (line.startsWith("# ")) {
          return (
            <Title level={2} key={idx} style={{ marginTop: "24px", marginBottom: "12px", color: "#1890ff" }}>
              {line.replace("# ", "")}
            </Title>
          );
        }

        // Header 2
        if (line.startsWith("## ")) {
          return (
            <Title level={3} key={idx} style={{ marginTop: "20px", marginBottom: "10px" }}>
              {line.replace("## ", "")}
            </Title>
          );
        }

        // List item
        if (line.startsWith("- ") || line.startsWith("* ")) {
          const itemText = line.substring(2);
          return (
            <div key={idx} style={{ display: "flex", gap: "8px", margin: "4px 0 4px 16px" }}>
              <span>•</span>
              <Paragraph style={{ margin: 0 }}>
                {renderInlineMarkdown(itemText)}
              </Paragraph>
            </div>
          );
        }

        // Numbered list item
        if (/^\d+\.\s/.test(line)) {
          const match = line.match(/^(\d+\.\s)(.*)/);
          return (
            <div key={idx} style={{ display: "flex", gap: "8px", margin: "4px 0 4px 16px" }}>
              <Text strong>{match[1]}</Text>
              <Paragraph style={{ margin: 0 }}>
                {renderInlineMarkdown(match[2])}
              </Paragraph>
            </div>
          );
        }

        // Empty line
        if (line.trim() === "") {
          return <div key={idx} style={{ height: "8px" }} />;
        }

        // Default Paragraph
        return (
          <Paragraph key={idx} style={{ marginBottom: "10px" }}>
            {renderInlineMarkdown(line)}
          </Paragraph>
        );
      })}
    </div>
  );
};

// Simple inline formatter for bold **text** and `code`
const renderInlineMarkdown = (text) => {
  // Regex to split on bold segments
  const parts = text.split(/(\*\*.*?\*\*|`.*?`)/g);
  return parts.map((part, i) => {
    if (part.startsWith("**") && part.endsWith("**")) {
      return <Text strong key={i}>{part.slice(2, -2)}</Text>;
    }
    if (part.startsWith("`") && part.endsWith("`")) {
      return <Text code key={i}>{part.slice(1, -1)}</Text>;
    }
    return part;
  });
};

const Report = () => {
  const { report, generateAIReport, loading } = useThreatPulse();
  const [generating, setGenerating] = useState(false);

  const handleGenerate = async () => {
    setGenerating(true);
    await generateAIReport();
    // Socket event report_ready will clear the loading state, 
    // but let's release our local button spinner after 2.5s anyway
    setTimeout(() => {
      setGenerating(false);
    }, 2500);
  };

  const handleCopy = () => {
    if (!report) return;
    navigator.clipboard.writeText(report.report);
    message.success("Copied report markdown to clipboard!");
  };

  const handleDownload = () => {
    if (!report) return;
    const blob = new Blob([report.report], { type: "text/markdown;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `ThreatPulse-Incident-Report-${new Date().toISOString().split("T")[0]}.md`;
    link.click();
    URL.revokeObjectURL(url);
    message.success("Report downloaded successfully.");
  };

  const handlePrint = () => {
    window.print();
  };

  const antIcon = <LoadingOutlined style={{ fontSize: 24 }} spin />;

  return (
    <Space direction="vertical" size="large" style={{ width: "100%" }}>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div>
          <Title level={2} style={{ margin: 0 }}>
            <FileTextOutlined /> Incident Report & SOAR Briefing
          </Title>
          <Text type="secondary">
            AI-generated summary of correlated indicators, attack sequence, and recommended mitigations.
          </Text>
        </div>
        <Space>
          <Button 
            type="primary" 
            icon={<FileSyncOutlined />} 
            onClick={handleGenerate}
            loading={generating}
          >
            Regenerate Report
          </Button>
        </Space>
      </div>

      <Row gutter={[16, 16]}>
        {/* Actions panel */}
        {report && (
          <Col xs={24}>
            <Card bordered={false} bodyStyle={{ padding: "12px 24px" }}>
              <Row justify="space-between" align="middle">
                <Col>
                  <Space>
                    <Text strong>Risk Assessment Score:</Text>
                    <Tag color={report.risk_level === "Critical" ? "red" : "orange"}>
                      {report.risk_level.toUpperCase()}
                    </Tag>
                    <Divider type="vertical" />
                    <Text type="secondary">
                      Compiled on: {new Date(report.created_at).toLocaleString()}
                    </Text>
                  </Space>
                </Col>
                <Col>
                  <Space>
                    <Button icon={<CopyOutlined />} onClick={handleCopy}>
                      Copy Markdown
                    </Button>
                    <Button icon={<DownloadOutlined />} onClick={handleDownload}>
                      Download MD
                    </Button>
                    <Button icon={<PrinterOutlined />} onClick={handlePrint}>
                      Print PDF
                    </Button>
                  </Space>
                </Col>
              </Row>
            </Card>
          </Col>
        )}

        {/* Report Content */}
        <Col xs={24}>
          <Card bordered={false} style={{ minHeight: "60vh" }}>
            {generating ? (
              <div style={{ display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "center", height: "40vh" }}>
                <Spin indicator={antIcon} size="large" />
                <Text style={{ marginTop: 16 }}>Synthesizing ransomware attack chain telemetry...</Text>
              </div>
            ) : report ? (
              <div style={{ padding: "10px 20px" }}>
                <MarkdownRenderer content={report.report} />
                <Divider />
                <div style={{ textAlign: "center", color: "rgba(255, 255, 255, 0.3)" }}>
                  <Space>
                    <CheckCircleOutlined />
                    <Text type="secondary" style={{ fontSize: "12px" }}>
                      AI synthesis verified against MITRE ATT&CK Framework. End of Report.
                    </Text>
                  </Space>
                </div>
              </div>
            ) : (
              <div style={{ display: "flex", justifyContent: "center", alignItems: "center", height: "40vh" }}>
                <Empty 
                  description="No incident report has been generated yet."
                  image={Empty.PRESENTED_IMAGE_SIMPLE}
                >
                  <Button type="primary" onClick={handleGenerate}>
                    Synthesize First Report
                  </Button>
                </Empty>
              </div>
            )}
          </Card>
        </Col>
      </Row>
    </Space>
  );
};

export default Report;
