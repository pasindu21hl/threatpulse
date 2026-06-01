import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { socket } from "../socket";
import api from "../api";
import { notification } from "antd";
import { 
  WifiOutlined, 
  DisconnectOutlined, 
  AlertOutlined, 
  InfoCircleOutlined,
  CheckCircleOutlined
} from "@ant-design/icons";

const ThreatPulseContext = createContext(null);

export const useThreatPulse = () => {
  const context = useContext(ThreatPulseContext);
  if (!context) {
    throw new Error("useThreatPulse must be used within a ThreatPulseProvider");
  }
  return context;
};

export const ThreatPulseProvider = ({ children }) => {
  const [stats, setStats] = useState({
    total_events: 0,
    threats: 0,
    iocs: 0,
    risk_level: 0,
  });
  const [timeline, setTimeline] = useState([]);
  const [ml, setMl] = useState([]);
  const [iocs, setIocs] = useState([]);
  const [agents, setAgents] = useState([]);
  const [report, setReport] = useState(null);
  
  const [connected, setConnected] = useState(false);
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState(null);
  
  // Keep list of critical alerts active in UI
  const [criticalAlerts, setCriticalAlerts] = useState([]);

  // Use Ant Design notification hook
  const [apiNotification, contextHolder] = notification.useNotification();

  // Fallback REST fetch to sync data if WebSocket is disconnected
  const fetchAllData = useCallback(async () => {
    try {
      setLoading(true);
      const [statsRes, timelineRes, mlRes, iocsRes, agentsRes, reportRes] = await Promise.all([
        api.get("/api/stats"),
        api.get("/api/timeline"),
        api.get("/api/ml"),
        api.get("/api/iocs"),
        api.get("/api/agents"),
        api.get("/api/report"),
      ]);

      setStats(statsRes.data);
      setTimeline(timelineRes.data);
      setMl(mlRes.data);
      setIocs(iocsRes.data);
      setAgents(agentsRes.data);
      setReport(reportRes.data);
      setLastUpdated(new Date().toISOString());
    } catch (error) {
      console.error("Failed to fetch dashboard data via REST fallback:", error);
      apiNotification.error({
        message: "API Sync Failure",
        description: "Failed to connect to ThreatPulse backend. Retrying...",
        placement: "bottomRight",
      });
    } finally {
      setLoading(false);
    }
  }, [apiNotification]);

  // Trigger manual scan
  const triggerScan = async () => {
    try {
      apiNotification.info({
        message: "Scan Initiated",
        description: "Requesting server to perform active file-system and registry audit.",
        icon: <InfoCircleOutlined style={{ color: "#1890ff" }} />,
        placement: "topRight",
      });
      await api.post("/api/scantriggers");
    } catch (error) {
      console.error("Error triggering scan:", error);
      apiNotification.error({
        message: "Scan Trigger Failed",
        description: "Could not request manual scan from SOAR controller.",
        placement: "topRight",
      });
    }
  };

  // Generate AI Incident Report
  const generateAIReport = async () => {
    try {
      apiNotification.info({
        message: "AI Generation Started",
        description: "Correlating active ransomware evidence to produce SOAR assessment.",
        icon: <InfoCircleOutlined style={{ color: "#1890ff" }} />,
        placement: "topRight",
      });
      await api.post("/api/generate-report");
    } catch (error) {
      console.error("Error generating report:", error);
      apiNotification.error({
        message: "Report Request Failed",
        description: "Failed to trigger AI reporting engine.",
        placement: "topRight",
      });
    }
  };

  // Dismiss a specific critical alert
  const dismissCriticalAlert = (alertId) => {
    setCriticalAlerts((prev) => prev.filter((item) => item.id !== alertId));
  };

  // Connect Socket.IO client and listen to events
  useEffect(() => {
    // Initial fetch to load skeletons and show data quickly
    fetchAllData();

    socket.connect();

    socket.on("connect", () => {
      setConnected(true);
      apiNotification.success({
        message: "SIEM Link Connected",
        description: "Real-time Socket.IO stream established with SOAR agent.",
        icon: <WifiOutlined style={{ color: "#52c41a" }} />,
        placement: "bottomRight",
      });
    });

    socket.on("disconnect", () => {
      setConnected(false);
      apiNotification.warning({
        message: "SIEM Link Disconnected",
        description: "Real-time socket stream interrupted. Attempting reconnection...",
        icon: <DisconnectOutlined style={{ color: "#f5222d" }} />,
        placement: "bottomRight",
      });
    });

    // 1. dashboard_update
    socket.on("dashboard_update", (data) => {
      setStats(data.stats);
      setTimeline(data.timeline);
      setMl(data.ml);
      setIocs(data.iocs);
      setAgents(data.agents);
      setLastUpdated(data.timestamp || new Date().toISOString());
      setLoading(false);
    });

    // 2. new_alert
    socket.on("new_alert", (data) => {
      setTimeline(data.timeline);
      setStats(data.stats);
      setIocs(data.iocs);
      setLastUpdated(data.timestamp || new Date().toISOString());
      
      // Toast notification for new alert
      const alert = data.alert;
      apiNotification.open({
        message: `New Threat Stage: ${alert.stage}`,
        description: `${alert.description} (Risk: ${alert.risk})`,
        icon: <AlertOutlined style={{ color: alert.risk === "Critical" ? "#ff4d4f" : "#faad14" }} />,
        duration: 5, // Auto dismiss after 5 seconds
        placement: "topRight",
      });
    });

    // 3. critical_alert
    socket.on("critical_alert", (data) => {
      const uniqueId = `crit-${Date.now()}`;
      const newCritAlert = {
        id: uniqueId,
        message: data.message,
        timestamp: data.timestamp || new Date().toISOString(),
      };
      
      // Add to global critical banners state (stays until dismissed)
      setCriticalAlerts((prev) => [newCritAlert, ...prev]);

      // Open a notification that does NOT auto dismiss (duration = 0)
      apiNotification.error({
        message: "CRITICAL SECURITY INCIDENT",
        description: data.message,
        duration: 0,
        placement: "topRight",
        key: uniqueId, // use key so we can close or manipulate
      });
    });

    // 4. report_ready
    socket.on("report_ready", (data) => {
      setReport(data.report);
      apiNotification.success({
        message: "AI Report Synthesized",
        description: "Ransomware correlation findings are ready for review.",
        icon: <CheckCircleOutlined style={{ color: "#52c41a" }} />,
        placement: "topRight",
      });
    });

    return () => {
      socket.off("connect");
      socket.off("disconnect");
      socket.off("dashboard_update");
      socket.off("new_alert");
      socket.off("critical_alert");
      socket.off("report_ready");
      socket.disconnect();
    };
  }, [fetchAllData, apiNotification]);

  return (
    <ThreatPulseContext.Provider
      value={{
        stats,
        timeline,
        ml,
        iocs,
        agents,
        report,
        connected,
        loading,
        lastUpdated,
        criticalAlerts,
        triggerScan,
        generateAIReport,
        dismissCriticalAlert,
        syncData: fetchAllData,
      }}
    >
      {contextHolder}
      {children}
    </ThreatPulseContext.Provider>
  );
};
