import asyncio
import datetime
import random
import uuid
import socketio
from fastapi import FastAPI, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware

# Initialize Socket.IO server
sio = socketio.AsyncServer(async_mode='asgi', cors_allowed_origins='*')
app = FastAPI(title="ThreatPulse SIEM + SOAR Backend", version="1.0.0")

# Setup CORS for FastAPI
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Global Mock Data State
state = {
    "stats": {
        "total_events": 1420,
        "threats": 4,
        "iocs": 8,
        "risk_level": 82  # percentage
    },
    "timeline": [
        {
            "id": "evt-1",
            "timestamp": (datetime.datetime.now() - datetime.timedelta(hours=4)).isoformat(),
            "stage": "Reconnaissance",
            "mitre_id": "T1595",
            "confidence": 85,
            "description": "Nmap active port scan detected targeting DB-Server-01.",
            "agent": "Wazuh-Agent-01",
            "risk": "Low"
        },
        {
            "id": "evt-2",
            "timestamp": (datetime.datetime.now() - datetime.timedelta(hours=3)).isoformat(),
            "stage": "Initial Access",
            "mitre_id": "T1566",
            "confidence": 92,
            "description": "Spearphishing link clicked; connection opened from host to malicious domain.",
            "agent": "Wazuh-Agent-02",
            "risk": "Medium"
        },
        {
            "id": "evt-3",
            "timestamp": (datetime.datetime.now() - datetime.timedelta(hours=2)).isoformat(),
            "stage": "Execution",
            "mitre_id": "T1059.001",
            "confidence": 95,
            "description": "Malicious PowerShell script running hidden command execution.",
            "agent": "Wazuh-Agent-02",
            "risk": "High"
        },
        {
            "id": "evt-4",
            "timestamp": (datetime.datetime.now() - datetime.timedelta(hours=1)).isoformat(),
            "stage": "Persistence",
            "mitre_id": "T1547.001",
            "confidence": 90,
            "description": "Registry Run Keys modification pointing to unsigned binary svchost_mimic.exe.",
            "agent": "Wazuh-Agent-02",
            "risk": "High"
        }
    ],
    "ml": [
        {"stage": "Reconnaissance", "count": 145, "confidence": 85},
        {"stage": "Initial Access", "count": 22, "confidence": 92},
        {"stage": "Execution", "count": 18, "confidence": 95},
        {"stage": "Persistence", "count": 8, "confidence": 90},
        {"stage": "Privilege Escalation", "count": 0, "confidence": 0},
        {"stage": "Defense Evasion", "count": 0, "confidence": 0},
        {"stage": "Lateral Movement", "count": 0, "confidence": 0},
        {"stage": "Exfiltration", "count": 0, "confidence": 0},
        {"stage": "Impact — Encryption", "count": 0, "confidence": 0},
        {"stage": "Command and Control", "count": 3, "confidence": 89}
    ],
    "iocs": [
        {"type": "IP Address", "value": "185.220.101.5", "risk_level": "High", "agent": "Wazuh-Agent-01", "first_seen": (datetime.datetime.now() - datetime.timedelta(hours=4)).isoformat()},
        {"type": "URL", "value": "http://malicious-ransom-cnc.xyz/payload.exe", "risk_level": "Critical", "agent": "Wazuh-Agent-02", "first_seen": (datetime.datetime.now() - datetime.timedelta(hours=3)).isoformat()},
        {"type": "SHA256 File Hash", "value": "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855", "risk_level": "Critical", "agent": "Wazuh-Agent-02", "first_seen": (datetime.datetime.now() - datetime.timedelta(hours=2)).isoformat()},
        {"type": "Registry Key", "value": "HKLM\\Software\\Microsoft\\Windows\\CurrentVersion\\Run\\Mimic", "risk_level": "High", "agent": "Wazuh-Agent-02", "first_seen": (datetime.datetime.now() - datetime.timedelta(hours=1)).isoformat()}
    ],
    "agents": [
        {"agent": "Wazuh-Agent-01", "count": 185, "ip": "192.168.10.15", "status": "Online", "os": "Ubuntu 22.04 LTS", "last_seen": datetime.datetime.now().isoformat()},
        {"agent": "Wazuh-Agent-02", "count": 940, "ip": "192.168.10.22", "status": "Compromised", "os": "Windows Server 2022", "last_seen": datetime.datetime.now().isoformat()},
        {"agent": "DB-Server-01", "count": 295, "ip": "192.168.20.10", "status": "Online", "os": "Rocky Linux 9", "last_seen": datetime.datetime.now().isoformat()},
        {"agent": "Firewall-Edge", "count": 1420, "ip": "192.168.1.1", "status": "Online", "os": "OPNsense", "last_seen": datetime.datetime.now().isoformat()}
    ],
    "report": {
        "report": """# ThreatPulse Incident Report: Active Ransomware Assessment

## Executive Summary
On June 1, 2026, the ThreatPulse platform detected a coordinated intrusion progressing through multiple MITRE ATT&CK stages on **Wazuh-Agent-02** (Windows Server 2022). The attack sequence indicates an active ransomware deployment attempt. 

## Attack Sequence Analysis
1. **Reconnaissance (T1595)**: Active network mapping from external scanning nodes.
2. **Initial Access (T1566)**: Spearphishing link triggered host compromise.
3. **Execution (T1059.001)**: Malicious PowerShell scripts were executed.
4. **Persistence (T1547.001)**: Registry run keys modified to ensure survival on system reboot.

## Recommendations
- Isolate host **Wazuh-Agent-02** immediately from the network segment.
- Block the C2 IP Address `185.220.101.5` on the perimeter firewall.
- Revoke compromised domain credentials associated with the user session on Agent-02.
- Initiate a full registry clean and audit.
""",
        "created_at": (datetime.datetime.now() - datetime.timedelta(minutes=30)).isoformat(),
        "risk_level": "High"
    }
}

# Socket.IO event handlers
@sio.on('connect')
async def handle_connect(sid, environ):
    print(f"Socket.IO Client Connected: {sid}")
    # On connection, instantly send dashboard_update to the connected client
    await sio.emit('dashboard_update', {
        "stats": state["stats"],
        "timeline": state["timeline"],
        "ml": state["ml"],
        "iocs": state["iocs"],
        "agents": state["agents"],
        "timestamp": datetime.datetime.now().isoformat()
    }, room=sid)

@sio.on('disconnect')
async def handle_disconnect(sid):
    print(f"Socket.IO Client Disconnected: {sid}")

# REST API Endpoints
@app.get("/api/stats")
async def get_stats():
    return state["stats"]

@app.get("/api/timeline")
async def get_timeline():
    # Return sorted by timestamp descending
    return sorted(state["timeline"], key=lambda x: x["timestamp"], reverse=True)

@app.get("/api/ml")
async def get_ml():
    return state["ml"]

@app.get("/api/iocs")
async def get_iocs():
    return state["iocs"]

@app.get("/api/agents")
async def get_agents():
    # Return key values [{agent, count}] as expected but with extra details
    return state["agents"]

@app.get("/api/report")
async def get_report():
    return state["report"]

# Simulate a manual scan
async def run_manual_scan_task():
    await asyncio.sleep(2)
    # Simulate discovering 2 new warnings/events
    new_events = [
        {
            "id": f"evt-scan-{random.randint(100, 999)}",
            "timestamp": datetime.datetime.now().isoformat(),
            "stage": "Defense Evasion",
            "mitre_id": "T1562.001",
            "confidence": 97,
            "description": "Windows Defender Real-time Protection service disabled by SYSTEM.",
            "agent": "Wazuh-Agent-02",
            "risk": "Critical"
        }
    ]
    
    # Update state
    state["timeline"].extend(new_events)
    state["stats"]["total_events"] += 25
    state["stats"]["threats"] += 1
    state["stats"]["risk_level"] = min(state["stats"]["risk_level"] + 5, 100)
    
    # Update ML
    for m in state["ml"]:
        if m["stage"] == "Defense Evasion":
            m["count"] += 1
            m["confidence"] = 97
            
    # Update Agent Status
    for a in state["agents"]:
        if a["agent"] == "Wazuh-Agent-02":
            a["count"] += 25
            
    # Add new IOC
    new_ioc = {
        "type": "Registry Value",
        "value": "HKLM\\SYSTEM\\CurrentControlSet\\Services\\WinDefend\\Start = 4",
        "risk_level": "Critical",
        "agent": "Wazuh-Agent-02",
        "first_seen": datetime.datetime.now().isoformat()
    }
    state["iocs"].append(new_ioc)
    state["stats"]["iocs"] += 1
    
    # Emit dashboard_update
    await sio.emit('dashboard_update', {
        "stats": state["stats"],
        "timeline": state["timeline"],
        "ml": state["ml"],
        "iocs": state["iocs"],
        "agents": state["agents"],
        "timestamp": datetime.datetime.now().isoformat()
    })
    
    # Trigger critical alert since Defender is stopped
    await asyncio.sleep(0.5)
    await sio.emit('critical_alert', {
        "message": "CRITICAL THREAT: Windows Defender Service has been disabled on Wazuh-Agent-02!",
        "timestamp": datetime.datetime.now().isoformat()
    })

# Handle real wazuh webhook alerts
@app.post("/api/wazuh-webhook")
async def wazuh_webhook(payload: dict):
    rule = payload.get("rule", {})
    agent_info = payload.get("agent", {})
    
    rule_level = int(rule.get("level", 0))
    description = rule.get("description", "Unclassified Wazuh event detected.")
    
    # Map Risk
    if rule_level >= 12:
        risk = "Critical"
    elif rule_level >= 8:
        risk = "High"
    elif rule_level >= 4:
        risk = "Medium"
    else:
        risk = "Low"
        
    # Map MITRE ATT&CK
    mitre_data = rule.get("mitre", {})
    tactic_list = mitre_data.get("tactic", [])
    mitre_ids = mitre_data.get("id", [])
    
    stage = tactic_list[0] if tactic_list else "Execution"
    mitre_id = mitre_ids[0] if mitre_ids else "T1059"
    
    agent_name = agent_info.get("name", "Unknown-Agent")
    agent_ip = agent_info.get("ip", "0.0.0.0")
    
    # Find OS info or default
    os_name = "Linux Endpoint"
    if isinstance(agent_info.get("os"), dict):
        os_name = agent_info.get("os", {}).get("name", "Linux / Windows")
    elif isinstance(agent_info.get("os"), str):
        os_name = agent_info.get("os")
    
    alert_id = f"wazuh-{uuid.uuid4().hex[:6]}"
    
    new_alert = {
        "id": alert_id,
        "timestamp": datetime.datetime.now().isoformat(),
        "stage": stage,
        "mitre_id": mitre_id,
        "confidence": random.randint(85, 98),
        "description": description,
        "agent": agent_name,
        "risk": risk
    }
    
    # Update global state
    state["timeline"].append(new_alert)
    state["stats"]["total_events"] += 1
    
    if risk in ["High", "Critical"]:
        state["stats"]["threats"] += 1
    
    # Update ML count
    found_stage_in_ml = False
    for m in state["ml"]:
        if m["stage"].lower() == stage.lower() or stage.lower() in m["stage"].lower():
            m["count"] += 1
            m["confidence"] = new_alert["confidence"]
            found_stage_in_ml = True
            break
    if not found_stage_in_ml:
        state["ml"].append({"stage": stage, "count": 1, "confidence": new_alert["confidence"]})
        
    # Update Agents
    agent_found = False
    for a in state["agents"]:
        if a["agent"] == agent_name:
            a["count"] += 1
            a["last_seen"] = datetime.datetime.now().isoformat()
            if risk == "Critical":
                a["status"] = "Compromised"
            elif a["status"] == "Offline":
                a["status"] = "Online"
            agent_found = True
            break
            
    if not agent_found:
        state["agents"].append({
            "agent": agent_name,
            "count": 1,
            "ip": agent_ip,
            "status": "Compromised" if risk == "Critical" else "Online",
            "os": os_name,
            "last_seen": datetime.datetime.now().isoformat()
        })
        
    # Extract any source IP for Indicators of Compromise (IOC)
    src_ip = payload.get("data", {}).get("srcip") or payload.get("srcip")
    if src_ip:
        state["iocs"].append({
            "type": "IP Address",
            "value": src_ip,
            "risk_level": risk,
            "agent": agent_name,
            "first_seen": datetime.datetime.now().isoformat()
        })
        state["stats"]["iocs"] += 1
        
    # Emit Socket.IO updates to frontend
    await sio.emit('new_alert', {
        "alert": new_alert,
        "stats": state["stats"],
        "timeline": state["timeline"],
        "iocs": state["iocs"],
        "timestamp": datetime.datetime.now().isoformat()
    })
    
    if risk == "Critical":
        await asyncio.sleep(0.5)
        await sio.emit('critical_alert', {
            "message": f"CRITICAL SECURITY INCIDENT on {agent_name}: {description}",
            "timestamp": datetime.datetime.now().isoformat()
        })
        
    return {"status": "Wazuh alert processed", "alert_id": alert_id}

@app.post("/api/scantriggers")
async def trigger_scan(background_tasks: BackgroundTasks):
    background_tasks.add_task(run_manual_scan_task)
    return {"status": "Manual scan triggered successfully"}

# Generate AI report background simulation
async def run_generate_report_task():
    await asyncio.sleep(2.5)
    
    report_md = f"""# AI Incident Report: Ransomware Kill-Chain Analysis

## Executive Summary
A comprehensive correlation of security event telemetry reveals a highly structured ransomware campaign targeting enterprise directories. The intrusion has progressed to a **Defense Evasion** state, with the final stages of data exfiltration and volume encryption imminent.

## MITRE ATT&CK Mapping
- **Reconnaissance (T1595)**: Network mapping scans detected.
- **Initial Access (T1566)**: Phishing payload run by user.
- **Execution (T1059.001)**: Powershell commands ran obfuscated loaders.
- **Persistence (T1547.001)**: Auto-run keys created for svchost_mimic.exe.
- **Defense Evasion (T1562.001)**: Windows Defender was actively disabled.
- **Lateral Movement (T1021.004)**: RDP/SSH traversal logs identified.

## IOC Summary
- File Hash SHA256: `e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855`
- Malicious Domains: `http://malicious-ransom-cnc.xyz`
- Attacker IPs: `185.220.101.5`

## SOAR Automated Playbook Execution
1. **Network Containment**: Isolating Wazuh-Agent-02 (IP: 192.168.10.22).
2. **DNS Blocking**: Pushing malicious DNS blocks to Firewall-Edge.
3. **Password Reset**: Enforcing active directory session invalidation.

**Report Generated At:** {datetime.datetime.now().strftime('%Y-%m-%d %H:%M:%S')}
"""
    state["report"] = {
        "report": report_md,
        "created_at": datetime.datetime.now().isoformat(),
        "risk_level": "Critical"
    }
    
    # Emit report_ready
    await sio.emit('report_ready', {
        "report": state["report"]
    })

@app.post("/api/generate-report")
async def generate_report(background_tasks: BackgroundTasks):
    background_tasks.add_task(run_generate_report_task)
    return {"status": "AI report generation started"}

# Simulated live alert generator background loop
async def alert_simulator():
    """Simulate fresh alerts every 30 seconds to show dynamic Socket.IO notifications."""
    stages = [
        ("Privilege Escalation", "T1078", "High", "Domain admin credential harvesting attempt.", "Wazuh-Agent-02"),
        ("Lateral Movement", "T1021.004", "High", "Lateral traversal via RDP connection to DB-Server-01.", "DB-Server-01"),
        ("Exfiltration", "T1048", "Critical", "Suspected exfiltration of SQL database backup to external IP 203.0.113.12.", "DB-Server-01"),
        ("Impact — Encryption", "T1486", "Critical", "Ransomware encryption activity detected: volume shadow copies deleted and files renamed.", "DB-Server-01")
    ]
    
    stage_idx = 0
    await asyncio.sleep(20)  # Wait before starting mock alerts
    
    while True:
        try:
            # Sleep between alerts
            await asyncio.sleep(30)
            
            stage_info = stages[stage_idx]
            stage, mitre_id, risk, desc, agent = stage_info
            
            alert_id = f"evt-sim-{random.randint(1000, 9999)}"
            new_alert = {
                "id": alert_id,
                "timestamp": datetime.datetime.now().isoformat(),
                "stage": stage,
                "mitre_id": mitre_id,
                "confidence": random.randint(88, 99),
                "description": desc,
                "agent": agent,
                "risk": risk
            }
            
            # Update state
            state["timeline"].append(new_alert)
            state["stats"]["total_events"] += 15
            if risk in ["High", "Critical"]:
                state["stats"]["threats"] += 1
            state["stats"]["risk_level"] = min(state["stats"]["risk_level"] + 4, 100)
            
            # Add to IOCs if exfiltration or impact
            if stage == "Exfiltration":
                state["iocs"].append({
                    "type": "IP Address",
                    "value": "203.0.113.12",
                    "risk_level": "Critical",
                    "agent": agent,
                    "first_seen": datetime.datetime.now().isoformat()
                })
                state["stats"]["iocs"] += 1
            elif stage == "Impact — Encryption":
                state["iocs"].append({
                    "type": "File Extension",
                    "value": "*.locked",
                    "risk_level": "Critical",
                    "agent": agent,
                    "first_seen": datetime.datetime.now().isoformat()
                })
                state["stats"]["iocs"] += 1
                
            # Update ML counts
            for m in state["ml"]:
                if m["stage"] == stage:
                    m["count"] += 1
                    m["confidence"] = new_alert["confidence"]
                    
            # Update agent events
            for a in state["agents"]:
                if a["agent"] == agent:
                    a["count"] += 15
                    if risk == "Critical":
                        a["status"] = "Compromised"
            
            # Emit new_alert Socket.IO event
            print(f"Simulating alert: {stage} - {desc}")
            await sio.emit('new_alert', {
                "alert": new_alert,
                "stats": state["stats"],
                "timeline": state["timeline"],
                "iocs": state["iocs"],
                "timestamp": datetime.datetime.now().isoformat()
            })
            
            # Emit critical alert if critical
            if risk == "Critical":
                await asyncio.sleep(0.5)
                await sio.emit('critical_alert', {
                    "message": f"CRITICAL INCIDENT: {desc}",
                    "timestamp": datetime.datetime.now().isoformat()
                })
                
            # Cycle to the next stage in loop
            stage_idx = (stage_idx + 1) % len(stages)
            
        except asyncio.CancelledError:
            break
        except Exception as e:
            print(f"Error in alert simulator loop: {e}")

@app.on_event("startup")
async def startup_event():
    # Start the alert simulator in the background
    asyncio.create_task(alert_simulator())

# Mount Socket.IO to FastAPI app
socket_app = socketio.ASGIApp(sio, other_asgi_app=app)
