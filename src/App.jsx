import React, { useState } from "react";
import { BrowserRouter as Router, Routes, Route, Link, useLocation } from "react-router-dom";
import { 
  ConfigProvider, 
  Layout, 
  Menu, 
  theme, 
  Alert, 
  Tag, 
  Space, 
  Typography,
  Button
} from "antd";
import {
  DashboardOutlined,
  HistoryOutlined,
  SafetyCertificateOutlined,
  FileTextOutlined,
  LaptopOutlined,
  AlertOutlined,
  ThunderboltOutlined,
  MenuFoldOutlined,
  MenuUnfoldOutlined,
  SyncOutlined
} from "@ant-design/icons";

// Context & Pages
import { ThreatPulseProvider, useThreatPulse } from "./context/ThreatPulseContext";
import Dashboard from "./pages/Dashboard";
import Timeline from "./pages/Timeline";
import IOCs from "./pages/IOCs";
import Report from "./pages/Report";
import Agents from "./pages/Agents";

const { Header, Sider, Content } = Layout;
const { Title, Text } = Typography;

const AppContent = () => {
  const [collapsed, setCollapsed] = useState(false);
  const location = useLocation();
  
  // Extract custom hooks from Context
  const { connected, criticalAlerts, dismissCriticalAlert, lastUpdated } = useThreatPulse();

  // Highlight active menu item based on routing path
  const getSelectedKey = () => {
    const path = location.pathname;
    if (path === "/timeline") return "timeline";
    if (path === "/iocs") return "iocs";
    if (path === "/report") return "report";
    if (path === "/agents") return "agents";
    return "dashboard";
  };

  const menuItems = [
    {
      key: "dashboard",
      icon: <DashboardOutlined />,
      label: <Link to="/">Dashboard</Link>,
    },
    {
      key: "timeline",
      icon: <HistoryOutlined />,
      label: <Link to="/timeline">Attack Timeline</Link>,
    },
    {
      key: "iocs",
      icon: <SafetyCertificateOutlined />,
      label: <Link to="/iocs">Indicators (IOCs)</Link>,
    },
    {
      key: "report",
      icon: <FileTextOutlined />,
      label: <Link to="/report">Incident Report</Link>,
    },
    {
      key: "agents",
      icon: <LaptopOutlined />,
      label: <Link to="/agents">Wazuh Agents</Link>,
    },
  ];

  return (
    <Layout style={{ minHeight: "100vh" }}>
      {/* Sidebar Navigation */}
      <Sider 
        trigger={null} 
        collapsible 
        collapsed={collapsed}
        breakpoint="lg"
        onCollapse={(value) => setCollapsed(value)}
        theme="dark"
        style={{
          borderRight: "1px solid rgba(255, 255, 255, 0.05)",
          position: "sticky",
          top: 0,
          height: "100vh"
        }}
      >
        <div style={{ 
          height: "64px", 
          display: "flex", 
          alignItems: "center", 
          justifyContent: collapsed ? "center" : "flex-start",
          padding: "0 24px",
          gap: "12px",
          borderBottom: "1px solid rgba(255, 255, 255, 0.05)"
        }}>
          <ThunderboltOutlined style={{ fontSize: "22px", color: "#1890ff" }} />
          {!collapsed && (
            <Title level={4} style={{ margin: 0, color: "#fff", letterSpacing: "1px" }}>
              ThreatPulse
            </Title>
          )}
        </div>
        <Menu
          theme="dark"
          mode="inline"
          selectedKeys={[getSelectedKey()]}
          items={menuItems}
          style={{ borderRight: 0, marginTop: "16px" }}
        />
      </Sider>

      {/* Main App Layout */}
      <Layout>
        {/* Top Header */}
        <Header style={{ 
          background: "#141414", 
          padding: "0 24px", 
          display: "flex", 
          alignItems: "center", 
          justifyContent: "space-between",
          borderBottom: "1px solid rgba(255, 255, 255, 0.05)",
          position: "sticky",
          top: 0,
          zIndex: 10,
          height: "64px"
        }}>
          <Button
            type="text"
            icon={collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
            onClick={() => setCollapsed(!collapsed)}
            style={{ fontSize: "16px", width: 64, height: 64, color: "#fff" }}
          />

          <Space size="middle">
            {/* Live Connection Badges */}
            {connected ? (
              <Tag color="success" icon={<SyncOutlined spin />} style={{ margin: 0 }}>
                STREAM ACTIVE
              </Tag>
            ) : (
              <Tag color="error" style={{ margin: 0 }}>
                STREAM DISCONNECTED
              </Tag>
            )}

            <div style={{ display: "none", display: "md-inline" }}>
              <Text type="secondary" style={{ fontSize: "12px" }}>SIEM Engine v1.0</Text>
            </div>
          </Space>
        </Header>

        {/* Critical Alerts Banner Container */}
        {criticalAlerts.length > 0 && (
          <div style={{ padding: "16px 24px 0 24px" }}>
            <Space direction="vertical" style={{ width: "100%" }} size="small">
              {criticalAlerts.map((alert) => (
                <Alert
                  key={alert.id}
                  message={
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <Text strong style={{ color: "#ffffff" }}>{alert.message}</Text>
                      <Text style={{ fontSize: "11px", color: "rgba(255, 255, 255, 0.7)" }}>
                        {new Date(alert.timestamp).toLocaleTimeString()}
                      </Text>
                    </div>
                  }
                  type="error"
                  showIcon
                  icon={<AlertOutlined />}
                  closable
                  onClose={() => dismissCriticalAlert(alert.id)}
                  style={{
                    background: "rgba(255, 77, 79, 0.15)",
                    border: "1px solid #ff4d4f",
                  }}
                />
              ))}
            </Space>
          </div>
        )}

        {/* Dynamic Pages Content */}
        <Content style={{ 
          padding: "24px", 
          background: "#0a0a0a", 
          minHeight: "calc(100vh - 64px)",
          overflowY: "auto"
        }}>
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/timeline" element={<Timeline />} />
            <Route path="/iocs" element={<IOCs />} />
            <Route path="/report" element={<Report />} />
            <Route path="/agents" element={<Agents />} />
          </Routes>
        </Content>
      </Layout>
    </Layout>
  );
};

const App = () => {
  return (
    <ConfigProvider
      theme={{
        algorithm: theme.darkAlgorithm,
        token: {
          colorPrimary: "#1890ff",
          colorSuccess: "#52c41a",
          colorWarning: "#faad14",
          colorError: "#ff4d4f",
          colorInfo: "#1890ff",
          colorBgBase: "#0a0a0a",
          colorBgContainer: "#141414",
          borderRadius: 6,
          fontFamily: "Inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif"
        },
      }}
    >
      <Router>
        <ThreatPulseProvider>
          <AppContent />
        </ThreatPulseProvider>
      </Router>
    </ConfigProvider>
  );
};

export default App;
