# CSIT321-FYP-25-S3-07-PROJECT-SENTINEL

![LIVE APPLICATION](https://frontend-production-32cc.up.railway.app/)

*Unleashing Real-Time Security, Empowering Instant Response*

![last commit](https://img.shields.io/badge/last_commit-today-blue)
![typescript](https://img.shields.io/badge/typescript-56.9%25-blue)
![languages](https://img.shields.io/badge/languages-7-blue)

## Built with the tools and technologies:

![JSON](https://img.shields.io/badge/JSON-black?logo=json)
![Markdown](https://img.shields.io/badge/Markdown-gray?logo=markdown)
![npm](https://img.shields.io/badge/npm-red?logo=npm)
![JavaScript](https://img.shields.io/badge/JavaScript-yellow?logo=javascript)
![Leaflet](https://img.shields.io/badge/Leaflet-green?logo=leaflet)
![React](https://img.shields.io/badge/React-blue?logo=react)
![Python](https://img.shields.io/badge/Python-blue?logo=python)
![TypeScript](https://img.shields.io/badge/TypeScript-blue?logo=typescript)
![Vite](https://img.shields.io/badge/Vite-purple?logo=vite)
![Lua](https://img.shields.io/badge/Lua-gray?logo=lua)
![ESLint](https://img.shields.io/badge/ESLint-purple?logo=eslint)
![Axios](https://img.shields.io/badge/Axios-purple?logo=axios)
![Chart.js](https://img.shields.io/badge/Chart.js-pink?logo=chartdotjs)
![MySQL](https://img.shields.io/badge/MySQL-blue?logo=mysql)
![Flask](https://img.shields.io/badge/Flask-black?logo=flask)


## 📋 Table of Contents

- [Overview](#overview)
- [Key Features](#key-features)
- [System Architecture](#system-architecture)
- [Deployment vs Local Installation](#-deployment-vs-local-installation)
- [Complete Setup Guide](#-complete-setup-guide)
  - [Prerequisites](#prerequisites)
  - [Step 1: Install Required Software](#step-1-install-required-software)
  - [Step 2: Install ngrok (Local Development Only)](#step-2-install-ngrok-local-development-only)
  - [Step 3: Install Suricata IDS](#step-3-install-suricata-ids)
  - [Step 4: Clone the Repository](#step-4-clone-the-repository)
  - [Step 5: MySQL Database Setup](#step-5-mysql-database-setup)
  - [Step 6: Backend Setup](#step-6-backend-setup)
  - [Step 7: Frontend Setup](#step-7-frontend-setup)
  - [Step 8: Running the Application](#step-8-running-the-application)
  - [Step 9: Access the Application](#step-9-access-the-application)
- [Using the Application](#-using-the-application)
- [IDS Integration Guide](#-ids-integration-guide)
- [PCAP Upload and Alert Matching](#-pcap-upload-and-alert-matching)
- [Database Seeding](#database-seeding)
- [Subsequent Runs](#-subsequent-runs)
- [Testing](#-testing)
- [Troubleshooting](#-troubleshooting)
- [Project Structure](#-project-structure)
- [Security Considerations](#-security-considerations)
- [Production Deployment](#-production-deployment)
- [FAQ](#-faq)
- [Contributing](#-contributing)
- [Support](#-support)
- [License](#license)
- [Contributors](#contributors)
- [Acknowledgements](#acknowledgments)

---

## Overview

**Sentinel** is a comprehensive, enterprise-grade security monitoring platform designed for seamless deployment and real-time threat analysis. Built as a Final Year Project for CSIT321 at Singapore Institute of Management (SIM), Sentinel provides security analysts with powerful tools to monitor, analyze, and respond to network security events in real-time.

### System Components

The platform consists of three integrated components:

1. **Frontend Application**
   - Modern React + TypeScript + Vite SPA
   - Real-time dashboards with Chart.js visualizations
   - Interactive geographic threat maps using Leaflet
   - Responsive design for desktop and tablet access

2. **Backend API Server**
   - RESTful Flask API with comprehensive endpoints
   - MySQL 8.0+ database with optimized schemas
   - JWT-based authentication and authorization
   - WebSocket support for real-time updates

3. **Monitoring Agent**
   - Python-based IDS log ingestion
   - Live alert streaming capabilities
   - Automated threat correlation
   - PCAP file processing and packet analysis

### Target Users

- **Security Operations Center (SOC) Analysts**: Real-time threat monitoring and incident response
- **Network Administrators**: Infrastructure security oversight
- **Security Researchers**: Forensic analysis and threat investigation
- **IT Managers**: Security posture reporting and compliance

---

## Key Features

### Core Capabilities

- **🔧 Full-Stack Security Platform**
  - Integrated frontend, backend, and monitoring components
  - Unified security event management
  - Centralized alert correlation and analysis

- **📡 Real-Time Alert Streaming**
  - WebSocket-based live updates
  - Instant notification of critical events
  - Configurable alert thresholds and filters

- **📊 Advanced Data Visualization**
  - Time-series charts for trend analysis
  - Geographic threat mapping with IP geolocation
  - Customizable dashboard widgets
  - Export capabilities for reports

- **🔍 Automated Packet-Alert Matching**
  - Upload PCAP files for forensic analysis
  - Automatic correlation with existing alerts
  - Confidence scoring for packet matches
  - Detailed packet inspection interface

- **🔒 Enterprise Security**
  - JWT authentication with role-based access control (RBAC)
  - Secure password hashing with bcrypt
  - SQL injection prevention
  - XSS protection and CSRF tokens

- **🌐 Modular Architecture**
  - RESTful API design
  - Pluggable IDS support (Suricata, Snort)
  - Extensible data models
  - Microservices-ready structure

- **🎯 Live Agent Monitoring**
  - Real-time agent status tracking
  - Health monitoring and alerting
  - Automatic reconnection handling

- **📋 Dashboard Customization**
  - Drag-and-drop widget arrangement
  - Personalized views per user role
  - Saved dashboard configurations

---

## System Architecture

```
┌─────────────────┐         ┌─────────────────┐         ┌─────────────────┐
│   Web Browser   │────────▶│  React Frontend │────────▶│   Flask API     │
│   (User)        │  HTTP/  │  (Port 5173)    │  REST   │   (Port 5000)   │
└─────────────────┘  WS     └─────────────────┘         └────────┬────────┘
                                                                  │
                                                                  │
                    ┌─────────────────────────────────────────────┼────────┐
                    │                                             │        │
                    ▼                                             ▼        ▼
         ┌─────────────────┐                          ┌──────────────────────┐
         │  MySQL Database │                          │   Python Agent       │
         │  (Port 3306)    │                          │   Monitoring         │
         └─────────────────┘                          └──────────┬───────────┘
                                                                  │
                                                                  │
                                                       ┌──────────▼───────────┐
                                                       │   Suricata IDS       │
                                                       │   (eve.json logs)    │
                                                       └──────────────────────┘
```

### Data Flow

1. **Alert Generation**: Suricata IDS detects network anomalies and logs to `eve.json`
2. **Alert Ingestion**: Python agent monitors log files and sends alerts to API
3. **Alert Processing**: Backend validates, enriches, and stores alerts in MySQL
4. **Real-Time Updates**: WebSocket pushes new alerts to connected frontend clients
5. **User Interaction**: Analysts view, filter, and investigate alerts through React UI
6. **PCAP Analysis**: Users upload packet captures for correlation with alerts

---

## Deployment vs Local Installation

### Production Deployment (Cloud/Server)

**✅ Required Components:**
- MySQL 8.0+ database server
- Production web server (nginx/Apache)
- SSL/TLS certificates (Let's Encrypt recommended)
- Firewall configuration (UFW/iptables)
- Domain name with DNS configuration

**❌ NOT Required:**
- ngrok tunneling service
- Manual Suricata installation (containerized alternative)
- MySQL Workbench (use CLI or remote management)

**Benefits:**
- Permanent public URL
- No bandwidth/connection limits
- Enhanced security with HTTPS
- Scalable infrastructure
- Professional deployment

### Local Development (Laptop/Desktop)

**✅ Required Components:**
1. **Python 3.8+** - Backend and agent runtime
2. **Node.js 16+** - Frontend build and development server
3. **MySQL 8.0+ & Workbench** - Database and visual management
4. **Git** - Version control
5. **ngrok** - Secure tunneling for webhook testing
6. **Suricata IDS** - Real-time network monitoring

**Why Each Tool?**
- **ngrok**: Test payment webhooks, plan management, external API integrations
- **MySQL Workbench**: Visual database management, easier troubleshooting
- **Suricata**: Generate real network alerts for testing

**Use Cases:**
- Feature development
- Bug fixing
- Testing new integrations
- Learning the platform
- Demo preparation

⚠️ **Important**: ngrok free plan has limits (40 connections/min, random URLs). Only for development!

---

## 🚀 Complete Setup Guide

### Prerequisites

**System Requirements:**
- **Operating System**: Windows 10/11 (64-bit)
- **RAM**: 8GB minimum, 16GB recommended
- **Storage**: 10GB free space
- **Network**: Stable internet connection
- **Privileges**: Administrator access

**Required Software:**

| Software | Version | Purpose | Download Link |
|----------|---------|---------|---------------|
| Python | 3.8+ | Backend runtime | [python.org](https://www.python.org/downloads/) |
| Node.js | 16+ LTS | Frontend tooling | [nodejs.org](https://nodejs.org/) |
| MySQL | 8.0+ | Database server | [mysql.com](https://dev.mysql.com/downloads/installer/) |
| Git | Latest | Version control | [git-scm.com](https://git-scm.com/downloads) |
| ngrok | Latest | Local tunneling | [ngrok.com/download](https://ngrok.com/download) |
| Suricata | 8.0.1+ | IDS monitoring | [suricata.io/download](https://suricata.io/download/) |

**Verify Installations:**

```bash
python --version          # Should show 3.8 or higher
node --version            # Should show v16 or higher
npm --version             # Comes with Node.js
mysql --version           # Should show 8.0 or higher
git --version             # Any recent version
ngrok version             # After installation
suricata --version        # After installation
```

---

### Step 1: Install Required Software

#### 1.1 Python 3.8+

**Installation Steps:**
1. Download installer from [python.org/downloads](https://www.python.org/downloads/)
2. Run installer
3. ✅ **CRITICAL**: Check "Add Python to PATH"
4. Choose "Install Now"
5. Wait for completion
6. Verify in PowerShell: `python --version`

**Expected Output:**
```
Python 3.10.11  (or higher)
```

**Troubleshooting:**
- If `python` not recognized, reinstall and check PATH option
- Use `py --version` as alternative command on Windows

---

#### 1.2 Node.js 16+ and npm

**Installation Steps:**
1. Visit [nodejs.org](https://nodejs.org/)
2. Download "LTS" version (recommended)
3. Run installer with default settings
4. Verify installations:
   ```bash
   node --version
   npm --version
   ```

**Expected Output:**
```
v18.17.1  (or higher)
9.8.1     (or higher)
```

**npm Configuration:**
```bash
# Speed up future installs
npm config set registry https://registry.npmjs.org/

# Check configuration
npm config list
```

---

#### 1.3 MySQL 8.0+ and MySQL Workbench

**Installation Steps:**

1. **Download MySQL Installer**
   - Visit [mysql.com/downloads/installer](https://dev.mysql.com/downloads/installer/)
   - Choose "mysql-installer-community" (larger file, includes all tools)
   - Size: ~400MB

2. **Run MySQL Installer**
   - Choose "Developer Default" setup type
   - This includes:
     - MySQL Server 8.0
     - MySQL Workbench (GUI tool)
     - MySQL Shell
     - Connectors and utilities

3. **Configuration During Install**
   - **Port**: Leave as 3306 (default)
   - **Root Password**: Choose a strong password (remember this!)
   - **User Accounts**: Skip for now (we'll create later)
   - **Windows Service**: Yes, start at system startup
   - **Service Name**: MySQL80

4. **Complete Installation**
   - Wait for all components to install
   - Click "Execute" to apply configuration
   - Finish and close installer

5. **Verify Installation**
   - Open "MySQL Workbench" from Start Menu
   - You should see "Local instance MySQL80"
   - Click to connect (enter root password)
   - Success if you see the main interface!

**MySQL Command Line (Alternative)**:
- Open "MySQL 8.0 Command Line Client" from Start Menu
- Enter root password
- Type `STATUS;` and press Enter
- Should show server version and status

---

#### 1.4 Git Version Control

**Installation Steps:**
1. Download from [git-scm.com/downloads](https://git-scm.com/downloads)
2. Run installer with default settings
3. Verify: `git --version`

**Expected Output:**
```
git version 2.42.0.windows.1  (or higher)
```

**Git Configuration (Recommended):**
```bash
git config --global user.name "Your Name"
git config --global user.email "your.email@example.com"
```

---

### Step 2: Install ngrok (Local Development Only)

⚠️ **Skip this step if deploying to production server**

#### 2.1 Why ngrok?

ngrok creates secure HTTPS tunnels from public URLs to your localhost, enabling:

**Essential For:**
- ✅ Testing payment webhooks (Stripe, PayPal)
- ✅ Plan/subscription management features
- ✅ External API callback testing
- ✅ Mobile device testing over internet
- ✅ Demo presentations to remote stakeholders

**Not Needed For:**
- ❌ Basic local UI development
- ❌ Database operations
- ❌ Backend API development (without webhooks)
- ❌ Production deployment

#### 2.2 Installation Steps

**1. Download ngrok**
```
URL: https://ngrok.com/download
File: ngrok-v3-stable-windows-amd64.zip
Size: ~10MB
```

**2. Extract to Permanent Location**
```bash
# Recommended path
C:\ngrok\ngrok.exe

# Do NOT place in:
# - Desktop (not permanent)
# - Downloads (may be cleaned)
# - Temp folders
```

**3. Create Free ngrok Account**
- Visit [ngrok.com/signup](https://ngrok.com/signup)
- Sign up with email
- Verify email address
- Login to dashboard

**4. Get Your Authtoken**
- After login, you'll see your authtoken
- Format: `2abc...xyz` (long alphanumeric string)
- Alternative: [dashboard.ngrok.com/get-started/your-authtoken](https://dashboard.ngrok.com/get-started/your-authtoken)

**5. Configure ngrok with Your Token**

Open PowerShell:
```powershell
# Navigate to ngrok directory
cd C:\ngrok

# Configure authtoken (replace with YOUR token)
.\ngrok config add-authtoken 2abc...YOUR_TOKEN_HERE...xyz
```

**Expected Output:**
```
Authtoken saved to configuration file: C:\Users\YourName\AppData\Local\ngrok\ngrok.yml
```

**6. Verify Installation**
```bash
# Check version
.\ngrok version

# Expected output:
# ngrok version 3.3.5
```

**7. Add to System PATH (Optional but Recommended)**

This allows running `ngrok` from any directory without `cd C:\ngrok` first.

**Windows 11 Steps:**
1. Right-click Start → System
2. Click "Advanced system settings"
3. Click "Environment Variables"
4. Under "System variables", find "Path"
5. Click "Edit"
6. Click "New"
7. Enter: `C:\ngrok`
8. Click "OK" on all dialogs
9. **Restart PowerShell**

**Test PATH configuration:**
```bash
# Open NEW PowerShell window
ngrok version

# If working, you'll see version number
# If not working, use: C:\ngrok\ngrok
```

#### 2.3 ngrok Free Plan Limits

Understanding the limitations:

| Feature | Free Plan | Paid Plan |
|---------|-----------|-----------|
| Online processes | 1 | Unlimited |
| Tunnels per process | 4 | Unlimited |
| Connections/minute | 40 | Unlimited |
| Custom domains | ❌ No | ✅ Yes |
| Subdomain format | Random | Custom |
| Bandwidth | Limited | Higher |
| HTTP requests | ✅ Yes | ✅ Yes |
| TCP tunnels | ✅ Yes | ✅ Yes |

**Free Plan Subdomain Example:**
- `https://transcolour-antonia-indictional.ngrok-free.app`
- Changes every time ngrok restarts
- Long, random names

**What This Means:**
- Good for development and testing
- Must update webhook URLs each restart
- May hit rate limits during heavy testing
- Upgrade to paid if needed for serious development

#### 2.4 Testing ngrok

**Start a Test Tunnel:**
```bash
cd C:\ngrok
.\ngrok http 8080
```

**Expected Output:**
```
ngrok

Session Status                online
Account                       Your Name (Plan: Free)
Version                       3.3.5
Region                        Asia Pacific (ap)
Latency                       46ms
Web Interface                 http://127.0.0.1:4040
Forwarding                    https://abc123.ngrok-free.app -> http://localhost:8080

Connections                   ttl     opn     rt1     rt5     p50     p90
                              0       0       0.00    0.00    0.00    0.00

HTTP Requests
-------------
(empty)
```

**Key Information:**
- **Forwarding URL**: `https://abc123.ngrok-free.app` - Your public URL
- **Web Interface**: `http://127.0.0.1:4040` - Local dashboard
- **Status**: "online" means working

**Access ngrok Dashboard:**
1. Open browser
2. Go to `http://127.0.0.1:4040`
3. You'll see request inspector interface
4. Real-time logs of all HTTP requests

**Stop ngrok:**
- Press `Ctrl+C` in terminal
- Or close the PowerShell window

✅ **ngrok is now installed and ready!**

---

### Step 3: Install Suricata IDS

Suricata is an open-source Intrusion Detection System (IDS) that monitors network traffic in real-time and generates security alerts.

#### 3.1 Why Suricata?

**Purpose in Sentinel:**
- Monitors network packets in real-time
- Detects suspicious patterns and attacks
- Generates structured JSON alerts
- Provides eve.json logs that Sentinel ingests

**Use Cases:**
- Live threat detection during development
- Testing alert correlation features
- Demonstrating real IDS integration
- Validating PCAP matching algorithms

#### 3.2 Installation Steps

**1. Download Suricata**
```
URL: https://suricata.io/download/
File: Suricata-8.0.1-1-64bit.msi
Size: ~103 MB
Version: 8.0.1 (latest stable)
```

**2. Run MSI Installer**
- Double-click `Suricata-8.0.1-1-64bit.msi`
- Click "Next" through wizard
- Installation directory: `C:\Program Files\Suricata` (default)
- Complete installation

**3. Install Network Capture Driver (Npcap)**

Suricata requires a packet capture library:

```
URL: https://npcap.com/#download
File: npcap-1.76.exe
```

**Npcap Installation:**
- Run installer as Administrator
- ✅ Check "Install Npcap in WinPcap API-compatible Mode"
- ✅ Check "Support loopback traffic capture"
- Complete installation
- **Restart computer** after installing Npcap

**4. Configure Suricata for Sentinel**

Sentinel includes a pre-configured `suricata.yaml`:

```bash
# Open PowerShell
cd C:\Users\YourUsername\Documents\CSIT321-FYP-25-S3-07-Project-Sentinel

# Copy configuration
copy frontend\resources\suricata.yaml "C:\Program Files\Suricata\suricata.yaml"
```

**Configuration Highlights:**
- ✅ EVE JSON output enabled (required for Sentinel)
- ✅ Alert logging configured
- ✅ HTTP, DNS, TLS logging
- ✅ Log directory: `C:\Program Files\Suricata\log\`

**5. Update Suricata Rules**

Rules define what traffic patterns to detect:

```bash
# Navigate to Suricata directory
cd "C:\Program Files\Suricata"

# Update rules from internet sources
suricata-update
```

**Expected Output:**
```
Updating Emerging Threats Open ruleset...
Downloaded 30,000+ rules
Enabled 28,000+ rules
Suricata rules updated successfully
```

**6. Verify Installation**

```bash
# Check version
suricata --version

# Expected output:
# This is Suricata version 8.0.1

# Test configuration
suricata -T -c suricata.yaml

# Expected output:
# Configuration provided was successfully loaded.
# All 28,000+ rules loaded
```

#### 3.3 Configure Network Interface

**Find Your Network Interface:**
```bash
# List all network interfaces
suricata --list-interfaces
```

**Example Output:**
```
Interface: \Device\NPF_{ABC-123-DEF}
  Name: Ethernet
  Description: Intel(R) Ethernet Connection
  
Interface: \Device\NPF_{XYZ-456-GHI}
  Name: Wi-Fi
  Description: Intel(R) Wireless Adapter
```

**Choose Interface:**
- Use `Ethernet` if connected via cable
- Use `Wi-Fi` if on wireless
- Note the exact name (case-sensitive)

**Update suricata.yaml (if needed):**
```yaml
# Edit C:\Program Files\Suricata\suricata.yaml
# Find the 'af-packet' section and update interface name

af-packet:
  - interface: Ethernet  # Change this to your interface name
```

#### 3.4 Running Suricata

**Start Suricata in Live Capture Mode:**

```bash
# Open PowerShell AS ADMINISTRATOR (right-click → Run as administrator)
cd "C:\Program Files\Suricata"

# Start with your interface name
suricata -c suricata.yaml -i Ethernet

# Or for Wi-Fi:
suricata -c suricata.yaml -i Wi-Fi
```

**Expected Output:**
```
[INFO] Suricata started
[INFO] Using interface Ethernet
[INFO] Rules loaded: 28,000+
[INFO] Capture started
[INFO] Monitoring traffic...
```

**What It's Doing:**
- Capturing packets from your network interface
- Analyzing traffic against 28,000+ rules
- Logging alerts to `C:\Program Files\Suricata\log\eve.json`
- Running continuously until stopped (Ctrl+C)

**Where Alerts Go:**
```
Alert File: C:\Program Files\Suricata\log\eve.json
Format: JSON (one alert per line)
Sample: {"timestamp":"2025-10-25T10:30:00","alert":{"severity":1,...}}
```

**Sentinel Integration:**
- Sentinel's agent monitors this `eve.json` file
- New alerts automatically ingested into Sentinel database
- Real-time display in Sentinel dashboard

#### 3.5 Suricata Management

**Stop Suricata:**
- Press `Ctrl+C` in the PowerShell window
- Or close the window

**Update Rules (Weekly Recommended):**
```bash
cd "C:\Program Files\Suricata"
suricata-update
```

**View Suricata Logs:**
```bash
# Alert log
type "C:\Program Files\Suricata\log\eve.json"

# Statistics
type "C:\Program Files\Suricata\log\stats.log"

# System log
type "C:\Program Files\Suricata\log\suricata.log"
```

**Performance Tuning:**
```yaml
# Edit suricata.yaml for better performance

# Increase workers for multi-core systems
threading:
  set-cpu-affinity: yes
  detect-thread-ratio: 1.5

# Adjust buffer sizes
stream:
  memcap: 64mb
  max-sessions: 262144
```

✅ **Suricata is now installed and ready to generate alerts!**

---

### Step 4: Clone the Repository

**1. Choose Installation Directory**

Recommended locations:
```bash
# Windows
C:\Users\YourUsername\Documents
C:\Users\YourUsername\Projects
C:\Dev
```

**2. Open PowerShell**
- Press `Windows + X`
- Select "Windows PowerShell" or "Terminal"

**3. Navigate to Directory**
```bash
# Example: Using Documents folder
cd C:\Users\YourUsername\Documents

# Or create a Projects folder
mkdir C:\Users\YourUsername\Projects
cd C:\Users\YourUsername\Projects
```

**4. Clone Repository**
```bash
git clone https://github.com/Roh00t/CSIT321-FYP-25-S3-07-Project-Sentinel.git

# Wait for download to complete
# Size: ~50-100MB depending on commit history
```

**Expected Output:**
```
Cloning into 'CSIT321-FYP-25-S3-07-Project-Sentinel'...
remote: Enumerating objects: 1234, done.
remote: Counting objects: 100% (1234/1234), done.
remote: Compressing objects: 100% (789/789), done.
remote: Total 1234 (delta 445), reused 1200 (delta 420)
Receiving objects: 100% (1234/1234), 45.67 MiB | 5.23 MiB/s, done.
Resolving deltas: 100% (445/445), done.
```

**5. Navigate into Project**
```bash
cd CSIT321-FYP-25-S3-07-Project-Sentinel
```

**6. Verify Directory Structure**
```bash
dir  # Windows
ls   # If using PowerShell 7+

# You should see:
# - agent/
# - backend/
# - frontend/
# - README.md
```

✅ **Repository cloned successfully!**

---

### Step 5: MySQL Database Setup

#### 5.1 Start MySQL Service

**Verify MySQL is Running:**
```bash
# Open Services Manager
# Press Windows + R
# Type: services.msc
# Press Enter

# Find: MySQL80
# Status should be: Running
# If not, right-click → Start
```

#### 5.2 Database Setup (MySQL Workbench - Recommended)

**1. Open MySQL Workbench**
- Launch from Start Menu
- Look for "MySQL Workbench 8.0"

**2. Connect to Local MySQL**
- Click on "Local instance MySQL80"
- Enter root password (set during MySQL installation)
- Click "OK"

**3. Open SQL Editor**
- You're now in the main interface
- Click "Create a new SQL tab" (icon looks like: 📄)
- Or press: `Ctrl+T`

**4. Execute Database Setup Script**

Copy and paste this entire script:

```sql
-- Create database with UTF-8 support
CREATE DATABASE sentinel_db 
CHARACTER SET utf8mb4 
COLLATE utf8mb4_unicode_ci;

-- Create dedicated user for Sentinel
CREATE USER 'sentinel_user'@'localhost' IDENTIFIED BY 'sentinel_fyp';

-- Grant all privileges on sentinel_db
GRANT ALL PRIVILEGES ON sentinel_db.* TO 'sentinel_user'@'localhost';

-- Grant specific global privileges needed
GRANT PROCESS ON *.* TO 'sentinel_user'@'localhost';

-- Apply privilege changes
FLUSH PRIVILEGES;

-- Verify database creation
SHOW DATABASES LIKE 'sentinel%';

-- Verify user creation
SELECT user, host FROM mysql.user WHERE user = 'sentinel_user';
```

**5. Run the Script**
- Click lightning bolt icon (⚡)
- Or press: `Ctrl+Shift+Enter`
- Or click: Query → Execute All Statements

**Expected Output in "Action Output" Panel:**
```
1. CREATE DATABASE sentinel_db...
   Query OK, 1 row affected

2. CREATE USER 'sentinel_user'...
   Query OK, 0 rows affected

3. GRANT ALL PRIVILEGES...
   Query OK, 0 rows affected

4. GRANT PROCESS...
   Query OK, 0 rows affected

5. FLUSH PRIVILEGES...
   Query OK, 0 rows affected

6. SHOW DATABASES...
   sentinel_db

7. SELECT user, host...
   sentinel_user | localhost
```

**6. Verify Database in Navigator**
- Look at left sidebar ("Navigator" panel)
- Click refresh icon (🔄)
- Expand "SCHEMAS"
- You should see `sentinel_db`
- Expand it - it will be empty (tables created during seeding)

**7. Test User Connection**
- Click "Database" menu → "Connect to Database"
- Connection Method: Standard (TCP/IP)
- Hostname: localhost
- Port: 3306
- Username: `sentinel_user`
- Password: `sentinel_fyp`
- Default Schema: sentinel_db
- Click "Test Connection"
- Should show: "Successfully made the MySQL connection"
- Click "OK" to save

#### 5.3 Alternative: MySQL Command Line

**1. Open MySQL Command Line Client**
- Start Menu → "MySQL 8.0 Command Line Client"
- Enter root password

**2. Execute Commands One by One**

```sql
-- Create database
CREATE DATABASE sentinel_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
-- Press Enter, wait for: Query OK, 1 row affected

-- Create user
CREATE USER 'sentinel_user'@'localhost' IDENTIFIED BY 'sentinel_fyp';
-- Press Enter, wait for: Query OK, 0 rows affected

-- Grant privileges
GRANT ALL PRIVILEGES ON sentinel_db.* TO 'sentinel_user'@'localhost';
-- Press Enter, wait for: Query OK, 0 rows affected

-- Grant process privilege
GRANT PROCESS ON *.* TO 'sentinel_user'@'localhost';
-- Press Enter, wait for: Query OK, 0 rows affected

-- Apply changes
FLUSH PRIVILEGES;
-- Press Enter, wait for: Query OK, 0 rows affected

-- Verify
SHOW DATABASES LIKE 'sentinel%';
-- Should show: sentinel_db

-- Exit
EXIT;
```

#### 5.4 Database Credentials Summary

**Save these credentials - you'll need them!**

| Parameter | Value |
|-----------|-------|
| Database Name | `sentinel_db` |
| Username | `sentinel_user` |
| Password | `sentinel_fyp` |
| Host | `localhost` |
| Port | `3306` |
| Character Set | `utf8mb4` |
| Collation | `utf8mb4_unicode_ci` |

**Connection String Format:**
```
mysql+pymysql://sentinel_user:sentinel_fyp@localhost:3306/sentinel_db
```

✅ **Database setup complete!**

---

### Step 6: Backend Setup

#### 6.1 Navigate to Backend Directory

```bash
# From project root
cd backend

# Verify you're in correct location
# You should see: config.py, requirements.txt, run.py
dir  # Windows
ls   # PowerShell 7+
```

#### 6.2 Create Python Virtual Environment

**What is a Virtual Environment?**
- Isolated Python environment for this project
- Prevents conflicts with other Python projects
- Contains project-specific packages

**Create venv:**
```bash
# Create virtual environment named 'venv'
python -m venv venv

# Wait for completion (takes ~30 seconds)
```

**Expected Result:**
- New folder created: `backend/venv/`
- Contains Python interpreter and pip

#### 6.3 Activate Virtual Environment

**Windows PowerShell:**
```powershell
.\venv\Scripts\Activate.ps1
```

**If You Get Execution Policy Error:**

```
.\venv\Scripts\Activate.ps1 : File cannot be loaded because running scripts 
is disabled on this system.
```

**Solution:**
```powershell
# Allow script execution for current user
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser

# Confirm with: Y (Yes)

# Try activation again
.\venv\Scripts\Activate.ps1
```

**Expected Result:**
```
(venv) PS C:\...\backend>
```

The `(venv)` prefix shows virtual environment is active!

**Alternative Method (if PowerShell fails):**
```bash
# Use Command Prompt instead
cmd

# Then activate
venv\Scripts\activate.bat
```

#### 6.4 Install Python Dependencies

**With venv active:**
```bash
# Upgrade pip first
python -m pip install --upgrade pip

# Install all required packages
pip install -r requirements.txt
```

**Installation Process:**
```
Collecting Flask==2.3.3
  Downloading Flask-2.3.3-py3-none-any.whl (96 kB)
Collecting flask-cors==4.0.0
  Downloading Flask_Cors-4.0.0-py2.py3-none-any.whl (14 kB)
Collecting PyMySQL==1.1.0
  ...
Installing collected packages: ...
Successfully installed Flask-2.3.3 PyMySQL-1.1.0 ...
```

**This installs (~50 packages):**
- Flask - Web framework
- PyMySQL - MySQL connector
- Flask-CORS - Cross-origin support
- SQLAlchemy - ORM
- Flask-JWT-Extended - Authentication
- bcrypt - Password hashing
- python-dotenv - Environment variables
- scapy - PCAP processing
- And many more...

**Verify Installation:**
```bash
# Check installed packages
pip list

# Should show ~50 packages including:
# Flask, PyMySQL, SQLAlchemy, Flask-JWT-Extended, etc.
```

#### 6.5 Configure Backend

**Check Configuration File:**
```bash
# View config.py
type config.py  # Windows
cat config.py   # PowerShell 7+
```

**Key Configuration (default values):**
```python
# Database connection
SQLALCHEMY_DATABASE_URI = 'mysql+pymysql://sentinel_user:sentinel_fyp@localhost:3306/sentinel_db'

# JWT secret (change in production!)
JWT_SECRET_KEY = 'your-secret-key-change-this-in-production'

# Server settings
HOST = '0.0.0.0'
PORT = 5000
DEBUG = True  # Development mode
```

**If you changed MySQL password, update config.py:**
```python
# Edit the connection string
SQLALCHEMY_DATABASE_URI = 'mysql+pymysql://sentinel_user:YOUR_PASSWORD@localhost:3306/sentinel_db'
```

#### 6.6 Seed the Database

**What does seeding do?**
- Creates all database tables
- Adds sample users (admin, analyst)
- Inserts sample alerts
- Creates log source configurations
- Sets up initial data for testing

**Run Seed Script:**
```bash
# Make sure venv is active (you should see (venv) in prompt)
python seed.py
```

**Expected Output:**
```
Connecting to database...
Creating database tables...
Seeding users...
  Created user: admin
  Created user: analyst
  Created user: viewer

Seeding alerts...
  Created 50 sample alerts
  Severities: 10 Critical, 15 High, 15 Medium, 10 Low

Seeding log sources...
  Created 3 log sources
  Created 5 API keys

Database seeded successfully!

================================= DEFAULT LOGIN CREDENTIALS =================================
Admin Account:
  Username: admin
  Password: admin123
  Role: Administrator

Analyst Account:
  Username: analyst
  Password: analyst123
  Role: Analyst

Viewer Account:
  Username: viewer
  Password: viewer123
  Role: Viewer
=================================
IMPORTANT: Change passwords after first login!
=================================
```

**Verify in MySQL Workbench:**
```sql
-- Connect to sentinel_db
USE sentinel_db;

-- Show all tables
SHOW TABLES;

-- Expected tables:
-- users, alerts, log_sources, pcaps, packets, etc.

-- Count users
SELECT COUNT(*) FROM users;
-- Should show: 3

-- Count alerts
SELECT COUNT(*) FROM alerts;
-- Should show: 50

-- View admin user
SELECT username, email, role FROM users WHERE username='admin';
```

#### 6.7 Test Backend

**Start Backend Server:**
```bash
# Make sure you're in backend/ directory with venv active
python run.py
```

**Expected Output:**
```
 * Serving Flask app 'run'
 * Debug mode: on
WARNING: This is a development server. Do not use it in production.
 * Running on http://127.0.0.1:5000
 * Running on http://localhost:5000
Press CTRL+C to quit
 * Restarting with stat
 * Debugger is active!
 * Debugger PIN: 123-456-789
```

**✅ Backend is running!**

**Test API (in new terminal/browser):**
```bash
# Test health endpoint
curl http://localhost:5000/api/health

# Expected response:
# {"status":"healthy","database":"connected"}
```

**Or open in browser:**
```
http://localhost:5000/api/health
```

**Stop Backend:**
- Press `Ctrl+C` in terminal

✅ **Backend setup complete!**

---

### Step 7: Frontend Setup

#### 7.1 Open New Terminal

**Keep backend terminal open!** Open a new PowerShell window:
- Right-click Start → Terminal (Admin)
- Or open new tab in Windows Terminal

#### 7.2 Navigate to Frontend Directory

```bash
# From project root
cd C:\Users\YourUsername\Documents\CSIT321-FYP-25-S3-07-Project-Sentinel\frontend

# Or if you're in backend/
cd ..\frontend

# Verify location
dir  # Should see: package.json, vite.config.ts, src/
```

#### 7.3 Install Node Dependencies

**Install npm packages:**
```bash
npm install
```

**This process:**
- Reads `package.json`
- Downloads ~1000 packages
- Takes 2-5 minutes
- Downloads ~200-300 MB

**Expected Output:**
```
npm WARN deprecated @babel/plugin-proposal-numeric-separator@...
...
added 1243 packages, and audited 1244 packages in 3m

142 packages are looking for funding
  run `npm fund` for details

found 0 vulnerabilities
```

**Result:**
- New folder created: `frontend/node_modules/`
- File created: `package-lock.json`

**If Installation Fails:**
```bash
# Clear npm cache
npm cache clean --force

# Delete node_modules if exists
rm -r node_modules  # PowerShell
rmdir /s node_modules  # CMD

# Try again
npm install
```

#### 7.4 Configure Frontend

**Check Environment Configuration:**

**Development Configuration:**
```bash
# Check if .env.development exists
type .env.development

# Default contents:
# VITE_API_URL=http://localhost:5000
```

**If file doesn't exist, create it:**
```bash
# Create .env.development
echo VITE_API_URL=http://localhost:5000 > .env.development
```

**Production Configuration (for later):**
```bash
# .env.production
VITE_API_URL=https://your-domain.com/api
```

#### 7.5 Verify Frontend Structure

**Key Files:**
```
frontend/
├── node_modules/       # Installed packages (large!)
├── public/             # Static assets
├── resources/          # IDS configs, sample files
│   ├── suricata.yaml
│   ├── snort.conf
│   └── sample_alerts.json
├── src/                # Source code
│   ├── components/     # React components
│   ├── pages/          # Page components
│   ├── services/       # API services
│   └── App.tsx         # Main app component
├── .env.development    # Development config
├── package.json        # Dependencies
├── vite.config.ts      # Vite configuration
└── tsconfig.json       # TypeScript config
```

#### 7.6 Test Frontend Build

**Start Development Server:**
```bash
npm run dev
```

**Expected Output:**
```
  VITE v4.4.9  ready in 2345 ms

  ➜  Local:   http://localhost:5173/
  ➜  Network: use --host to expose
  ➜  press h to show help
```

**✅ Frontend is running!**

**Open in Browser:**
```
http://localhost:5173
```

**You should see:**
- Sentinel login page
- Clean, modern interface
- No error messages in browser console

**Check Browser Console:**
- Press F12 (Developer Tools)
- Click "Console" tab
- Should be empty or show info messages only
- No red error messages

**Stop Frontend:**
- Press `Ctrl+C` in terminal
- Or type `q` and press Enter

✅ **Frontend setup complete!**

---

### Step 8: Running the Application

#### 8.1 Terminal Setup Overview

For full local development, you need **multiple terminals** running simultaneously:

**Required (Minimum Setup):**
1. Backend Server (port 5000)
2. Frontend Server (port 5173)

**Optional (Full Features):**
3. ngrok Tunnel (for webhooks)
4. Suricata IDS (for live alerts)
5. Agent Monitor (for agent management)

**Window Management Tips:**
- Use Windows Terminal with multiple tabs
- Or arrange PowerShell windows in tiles
- Label each window clearly
- Don't close any window while developing!

#### 8.2 Terminal 1: Backend Server

**Open PowerShell (Admin recommended)**

```bash
# Navigate to backend
cd C:\Users\YourUsername\Documents\CSIT321-FYP-25-S3-07-Project-Sentinel\backend

# Activate virtual environment
.\venv\Scripts\Activate.ps1

# You should see: (venv) in prompt

# Start backend
python run.py
```

**Expected Output:**
```
 * Serving Flask app 'run'
 * Debug mode: on
 * Running on http://127.0.0.1:5000
 * Running on http://localhost:5000
```

**Status Messages:**
```
[2025-10-25 10:30:00] Database connected successfully
[2025-10-25 10:30:00] JWT configured
[2025-10-25 10:30:00] CORS enabled for localhost:5173
[2025-10-25 10:30:00] WebSocket initialized
[2025-10-25 10:30:00] Backend ready!
```

**✅ Backend Running - Keep this terminal open!**

#### 8.3 Terminal 2: Frontend Server

**Open New PowerShell Window**

```bash
# Navigate to frontend
cd C:\Users\YourUsername\Documents\CSIT321-FYP-25-S3-07-Project-Sentinel\frontend

# Start frontend
npm run dev
```

**Expected Output:**
```
  VITE v4.4.9  ready in 1234 ms

  ➜  Local:   http://localhost:5173/
  ➜  Network: http://192.168.1.100:5173/
  ➜  press h to show help
```

**Frontend is now serving:**
- Local: http://localhost:5173
- Network: http://your-ip:5173 (for testing on other devices)

**✅ Frontend Running - Keep this terminal open!**

#### 8.4 Terminal 3: ngrok Tunnel (Optional)

**⚠️ Only needed for webhook testing or plan management**

**Open New PowerShell Window**

```bash
# Navigate to ngrok
cd C:\ngrok

# Start tunnel to backend port 5000
.\ngrok http 5000
```

**Expected Output:**
```
ngrok

Session Status                online
Account                       Your Name (Plan: Free)
Version                       3.3.5
Region                        Asia Pacific (ap)
Latency                       46ms
Web Interface                 http://127.0.0.1:4040
Forwarding                    https://abc-def-123.ngrok-free.app -> http://localhost:5000

Connections                   ttl     opn     rt1     rt5     p50     p90
                              0       0       0.00    0.00    0.00    0.00

HTTP Requests
-------------
(empty - waiting for requests)
```

**📋 IMPORTANT: Copy the Forwarding URL!**
```
https://abc-def-123.ngrok-free.app
```

**What to do with this URL:**
1. Use it for webhook configurations (Stripe, PayPal, etc.)
2. Configure in application settings for plan management
3. Test external API callbacks
4. Share for remote testing

**ngrok Web Dashboard:**
- Open browser: http://127.0.0.1:4040
- Real-time request inspection
- Replay requests for debugging
- View request/response details

**✅ ngrok Running - Keep this terminal open!**

**⚠️ Remember:** This URL changes every time you restart ngrok (free plan)

#### 8.5 Terminal 4: Suricata IDS (Optional)

**⚠️ Only needed for live network monitoring**

**Open New PowerShell AS ADMINISTRATOR**
- Right-click PowerShell → Run as Administrator

```bash
# Navigate to Suricata
cd "C:\Program Files\Suricata"

# Start with your network interface
suricata -c suricata.yaml -i Ethernet

# Or for Wi-Fi:
suricata -c suricata.yaml -i Wi-Fi
```

**Expected Output:**
```
[2025-10-25 10:35:00] - <Info> - Using Suricata 8.0.1
[2025-10-25 10:35:00] - <Info> - Using 28000+ rules
[2025-10-25 10:35:01] - <Info> - Interface 'Ethernet' running in IDS mode
[2025-10-25 10:35:01] - <Info> - Capture started
```

**What It's Doing:**
- Monitoring network traffic
- Matching against 28,000+ rules
- Writing alerts to `C:\Program Files\Suricata\log\eve.json`
- Generating events for Sentinel to ingest

**View Alerts:**
```bash
# In another terminal
type "C:\Program Files\Suricata\log\eve.json"
```

**✅ Suricata Running - Keep this terminal open!**

#### 8.6 Terminal 5: Agent Monitor (Optional)

**⚠️ Only needed for agent management features**

**Open New PowerShell Window**

```bash
# Navigate to backend
cd C:\Users\YourUsername\Documents\CSIT321-FYP-25-S3-07-Project-Sentinel\backend

# Activate venv
.\venv\Scripts\Activate.ps1

# Run agent UI
python agentUI.py
```

**Expected Output:**
```
=================================
    SENTINEL AGENT MONITOR
=================================
Agent Status: Active
Monitoring: C:\Program Files\Suricata\log\eve.json
Update Interval: 5 seconds

Press Ctrl+C to stop
=================================

[10:40:00] Agent started
[10:40:05] Checking for new alerts...
[10:40:05] Found 0 new alerts
[10:40:10] Checking for new alerts...
```

**When Suricata detects something:**
```
[10:42:15] Found 3 new alerts
[10:42:15] Alert 1: ET SCAN Nmap Scripting Engine User-Agent
[10:42:15] Alert 2: ET POLICY HTTP Request to a *.tk domain
[10:42:15] Alert 3: ET INFO Suspicious User-Agent
[10:42:15] Sent to API: 3 alerts ingested successfully
```

**✅ Agent Running - Keep this terminal open!**

#### 8.7 Verify Everything is Running

**Check All Terminals:**

| Terminal | Process | Status Check | Port |
|----------|---------|--------------|------|
| 1 | Backend | http://localhost:5000/api/health | 5000 |
| 2 | Frontend | http://localhost:5173 | 5173 |
| 3 | ngrok | http://127.0.0.1:4040 | 4040 |
| 4 | Suricata | Check for "Capture started" | N/A |
| 5 | Agent | Check for "Agent started" | N/A |

**Quick Health Check Script:**
```powershell
# Create healthcheck.ps1
# Test all services

Write-Host "Checking Backend..." -ForegroundColor Yellow
try {
    $response = Invoke-WebRequest -Uri "http://localhost:5000/api/health" -UseBasicParsing
    Write-Host "✓ Backend: Running" -ForegroundColor Green
} catch {
    Write-Host "✗ Backend: Not Running" -ForegroundColor Red
}

Write-Host "`nChecking Frontend..." -ForegroundColor Yellow
try {
    $response = Invoke-WebRequest -Uri "http://localhost:5173" -UseBasicParsing
    Write-Host "✓ Frontend: Running" -ForegroundColor Green
} catch {
    Write-Host "✗ Frontend: Not Running" -ForegroundColor Red
}

Write-Host "`nChecking ngrok..." -ForegroundColor Yellow
try {
    $response = Invoke-WebRequest -Uri "http://127.0.0.1:4040/api/tunnels" -UseBasicParsing
    Write-Host "✓ ngrok: Running" -ForegroundColor Green
} catch {
    Write-Host "✗ ngrok: Not Running (Optional)" -ForegroundColor Yellow
}
```

**Run Health Check:**
```powershell
.\healthcheck.ps1
```

#### 8.8 Startup Order (Important!)

**Always start in this order:**

1. **Backend First** (5-10 seconds to start)
2. **Frontend Second** (after backend is ready)
3. **ngrok Third** (after backend is running)
4. **Suricata Fourth** (independent timing)
5. **Agent Last** (requires backend and Suricata)

**Why This Order?**
- Frontend needs backend API to be available
- ngrok needs backend port to be open
- Agent needs backend API for alert submission
- Agent needs Suricata logs to exist

#### 8.9 Common Startup Issues

**"Port 5000 already in use"**
```bash
# Find what's using port 5000
netstat -ano | findstr :5000

# Kill the process
taskkill /PID <PID_NUMBER> /F

# Try starting backend again
```

**"Frontend can't connect to API"**
```bash
# Check backend is actually running
curl http://localhost:5000/api/health

# Check CORS configuration in backend/config.py
# Ensure CORS_ORIGINS includes http://localhost:5173
```

**"ngrok tunnel not found"**
- Make sure backend started successfully first
- Restart ngrok after backend is running
- Check ngrok dashboard at http://127.0.0.1:4040

**"Suricata permission denied"**
- Run PowerShell as Administrator
- Check Npcap is installed correctly
- Verify interface name is correct

✅ **All services are now running!**

---

### Step 9: Access the Application

#### 9.1 Open Web Browser

**Recommended Browsers:**
- ✅ Google Chrome (best compatibility)
- ✅ Microsoft Edge (Chromium)
- ✅ Firefox
- ⚠️ Safari (may have issues)

#### 9.2 Navigate to Application

**Primary Access URL:**
```
http://localhost:5173
```

**Alternative URLs:**
```
http://127.0.0.1:5173          # Same as localhost
http://your-ip-address:5173    # Network access (find IP with ipconfig)
```

#### 9.3 Login Page

**You should see:**
- Clean, modern login interface
- "Welcome to SENTINEL" heading
- Username and password fields
- "Login" button
- No error messages

**If You See Errors:**
- Check browser console (F12)
- Verify backend is running (Terminal 1)
- Check network tab for failed requests

#### 9.4 Default Login Credentials

**Administrator Account:**
```
Username: admin
Password: admin123
Role: Full access to all features
```

**Security Analyst Account:**
```
Username: analyst
Password: analyst123
Role: Alert management, analysis, PCAP upload
```

**Viewer Account:**
```
Username: viewer
Password: viewer123
Role: Read-only access to dashboards
```

#### 9.5 First Login

**Step-by-Step:**

1. **Enter Credentials**
   - Type: `admin`
   - Password: `admin123`

2. **Click Login**
   - Button should process for 1-2 seconds
   - Loading indicator appears

3. **Successful Login**
   - Redirected to main dashboard
   - Welcome message appears
   - User menu shows "admin" in top-right

4. **Failed Login**
   - Error message: "Invalid credentials"
   - Check username/password
   - Verify backend is running

#### 9.6 Main Dashboard Overview

**After successful login, you'll see:**

**Top Navigation Bar:**
- Logo: "SENTINEL"
- Menu: Dashboard, Alerts, PCAP, Settings
- User dropdown: Profile, Logout
- Notification bell

**Dashboard Widgets:**
1. **Alert Statistics**
   - Total alerts today
   - By severity (Critical, High, Medium, Low)
   - Trend chart

2. **Geographic Map**
   - World map with threat locations
   - Markers for source IPs
   - Click for details

3. **Recent Alerts Table**
   - Latest 10 alerts
   - Timestamp, severity, type, source/dest IP
   - Click row to view details

4. **System Health**
   - Backend status
   - Database status
   - Agent status
   - IDS status

**Sidebar (if present):**
- Quick filters
- Date range selector
- Severity filters
- Alert type filters

#### 9.7 Explore Main Features

**1. View Alerts**
- Click "Alerts" in navigation
- See table of all alerts
- Use filters to narrow down
- Double-click alert for full details

**2. Upload Alert File**
- Click "Upload Alert File" button
- Select JSON file from `frontend/resources/`
- Watch processing progress
- Alerts appear in table

**3. Upload PCAP File**
- Click "📦 Upload PCAP" button
- Select .pcap/.pcapng file
- Wait for packet parsing
- See matched packets in alert details

**4. Customize Dashboard**
- Click gear icon on widgets
- Drag to rearrange
- Resize widgets
- Save layout

**5. User Profile**
- Click username dropdown
- View profile information
- Change password
- Update email

#### 9.8 Testing with ngrok (Optional)

**If running ngrok:**

**Get ngrok URL from Terminal 3:**
```
Forwarding: https://abc-def-123.ngrok-free.app -> http://localhost:5000
```

**Access Backend via ngrok:**
```
https://abc-def-123.ngrok-free.app/api/health
```

**Use for Webhooks:**
```
Stripe Webhook: https://abc-def-123.ngrok-free.app/api/webhooks/stripe
PayPal Webhook: https://abc-def-123.ngrok-free.app/api/webhooks/paypal
```

**Monitor Webhooks:**
- Open: http://127.0.0.1:4040
- See real-time webhook calls
- Inspect request/response
- Replay for debugging

#### 9.9 Verify All Features Working

**Checklist:**

| Feature | Test | Expected Result |
|---------|------|-----------------|
| Login | Use admin/admin123 | Dashboard loads |
| Dashboard | View widgets | Stats display |
| Alerts | Click Alerts menu | Alert list shows |
| Upload Alert | Upload JSON | File processes |
| Upload PCAP | Upload .pcap | Packets parse |
| Geographic Map | View map | Markers show |
| Alert Details | Double-click alert | Modal opens |
| Filters | Apply severity filter | List updates |
| Search | Search by IP | Results show |
| Logout | Click logout | Return to login |

**All Checked? ✅ Application is fully functional!**

#### 9.10 Bookmark Important URLs

**Save these in browser:**

```
Application:     http://localhost:5173
Backend API:     http://localhost:5000
API Health:      http://localhost:5000/api/health
API Docs:        http://localhost:5000/api/docs
ngrok Dashboard: http://127.0.0.1:4040
```

✅ **Setup Complete! You can now use Sentinel!**

---

## 📚 Using the Application

### First Steps After Login

#### 1. Dashboard Overview

**Main Components:**

**Alert Statistics Card:**
- Shows total alerts in selected time period
- Breakdown by severity
- Trend line for last 7 days
- Click for detailed stats

**Geographic Threat Map:**
- Interactive world map
- Red markers = threat sources
- Size indicates alert count
- Click marker for IP details
- Zoom in/out with mouse wheel

**Recent Alerts Table:**
- Latest alerts (default: 10)
- Columns: Time, Severity, Type, Source → Destination
- Color-coded severity (Red=Critical, Orange=High, etc.)
- Double-click row to inspect
- Right-click for quick actions

**System Status Panel:**
- Backend: Green = healthy
- Database: Shows connection status
- IDS: Shows if Suricata active
- Agent: Shows if agent connected

#### 2. Upload Alert Files

**Purpose:** Import historical alerts for analysis

**Steps:**

1. **Click "Upload Alert File" Button**
   - Located in top-right of dashboard
   - Or in Alerts page toolbar

2. **Select File**
   - Navigate to `frontend/resources/`
   - Sample files available:
     - `sample_alerts.json` - 100 varied alerts
     - `critical_alerts.json` - High-severity alerts
     - `network_scan.json` - Port scan alerts

3. **File Format Requirements**
   - Format: JSON
   - Structure: Array of alert objects or newline-delimited JSON
   - Max size: 50MB per file
   - Example structure:
   ```json
   {
     "timestamp": "2025-10-25T10:30:00",
     "alert": {
       "severity": 1,
       "signature": "ET SCAN Nmap Scripting Engine",
       "category": "Network Scan"
     },
     "src_ip": "192.168.1.100",
     "dest_ip": "10.0.0.1",
     "src_port": 54321,
     "dest_port": 22,
     "proto": "TCP"
   }
   ```

4. **Processing**
   - Progress bar shows upload status
   - Backend validates each alert
   - Duplicate detection runs
   - Geolocation lookup for IPs
   - Takes 5-10 seconds per 1000 alerts

5. **Success Notification**
   ```
   ✓ Alert file uploaded successfully!
   - Processed: 100 alerts
   - New alerts: 95
   - Duplicates skipped: 5
   - Processing time: 8.5s
   ```

6. **View Imported Alerts**
   - Automatically appears in alerts table
   - Use filters to find specific imports
   - Check timestamp range matches

**Supported Alert Formats:**
- **Suricata EVE JSON** (native)
- **Snort Unified2** (with converter)
- **Custom JSON** (follow schema)

#### 3. Upload PCAP Files

**Purpose:** Match network packets with existing alerts for forensics

**Steps:**

1. **Click "📦 Upload PCAP" Button**
   - In Alerts page or alert detail modal
   - Shows upload dialog

2. **Select PCAP File**
   - Supported formats:
     - `.pcap` - Standard PCAP
     - `.pcapng` - PCAP Next Generation
     - `.cap` - Wireshark captures
   - Max size: 2GB (configurable)
   - Can be gzipped (.pcap.gz)

3. **Upload and Parse**
   ```
   Uploading PCAP...
   ████████████████░░░░  75%
   
   Parsing packets...
   - Packets found: 45,234
   - Parsing progress: 80%
   ```

4. **Matching Process**
   - Compares packet IPs with alert IPs
   - Matches timestamps (±5 seconds window)
   - Checks ports and protocols
   - Calculates confidence score

5. **Results Notification**
   ```
   ✓ PCAP processed successfully!
   - Total packets: 45,234
   - Matched to alerts: 1,247
   - High confidence: 1,100
   - Medium confidence: 147
   - Processing time: 2m 15s
   ```

6. **View Matched Packets**
   - Go to Alerts page
   - Find alerts with 📦 icon
   - Double-click to open detail
   - See "Matched PCAP Packets" section

**PCAP Packet Details:**
- Packet number in PCAP
- Timestamp (microsecond precision)
- Source → Destination with ports
- Protocol (TCP/UDP/ICMP/etc.)
- Packet length
- Confidence score (color-coded)
- First 10KB of packet data stored

**Confidence Scoring:**
```
High (90-100%):  Exact IP match + port match + time < 1s
Medium (70-89%): IP match + (port OR time within window)
Low (50-69%):    IP match only, timestamp within window
```

#### 4. Inspect Alerts

**Purpose:** Deep dive into alert details for investigation

**Access Alert Details:**
- **Method 1:** Double-click alert row in table
- **Method 2:** Click alert in map marker popup
- **Method 3:** Click "View Details" button on alert card

**Alert Detail Modal:**

**Header Section:**
```
[Critical] ET SCAN Nmap Scripting Engine User-Agent
Detected: 2025-10-25 10:30:15
Source: 192.168.1.100:54321 → Destination: 10.0.0.1:22
```

**Tabs:**

1. **Overview Tab**
   - Alert signature/rule name
   - Severity level (visual indicator)
   - Category (Attempted Admin, Network Scan, etc.)
   - Protocol information
   - Timestamp with timezone
   - Detection source (Suricata, Snort, etc.)

2. **Details Tab**
   - Full alert metadata
   - Source IP geolocation (country, city, ISP)
   - Destination IP details
   - Port information
   - Application protocol
   - HTTP details (if applicable)
     - User-Agent
     - URL path
     - HTTP method
     - Response code

3. **PCAP Packets Tab** (if matches exist)
   - Table of matched packets
   - Columns: Packet #, Time, Flow, Protocol, Length, Confidence
   - Click row to see packet hex dump
   - Download individual packet
   - View packet in Wireshark format

4. **Related Alerts Tab**
   - Other alerts from same source IP
   - Alerts to same destination
   - Similar alert signatures
   - Timeline of related activity

5. **Actions Tab**
   - Mark as false positive
   - Add to whitelist
   - Create incident ticket
   - Export alert details
   - Share alert (generate link)

**Quick Actions Bar:**
- 🚨 Escalate to incident
- ✓ Mark as reviewed
- 🔍 Investigate source IP
- 📊 View in timeline
- 💾 Export as JSON/PDF

#### 5. Customize Dashboard

**Dashboard Customization Features:**

**Layout Customization:**
1. **Click gear icon** (⚙️) in top-right of dashboard
2. **Enable Edit Mode**
   - Widgets get drag handles
   - Resize handles appear on corners

3. **Rearrange Widgets:**
   - Click and drag widget header
   - Drop in new position
   - Grid automatically adjusts

4. **Resize Widgets:**
   - Drag corner/edge handles
   - Minimum size enforced
   - Maintains aspect ratio

5. **Add/Remove Widgets:**
   - Click "+ Add Widget" button
   - Choose from widget library:
     - Alert Counter
     - Severity Pie Chart
     - Time Series Graph
     - Top Source IPs
     - Geographic Map
     - Protocol Distribution
     - Top Signatures
     - System Health

6. **Widget Settings:**
   - Click widget gear icon
   - Configure:
     - Title
     - Time range
     - Refresh interval
     - Filters
     - Colors/theme

7. **Save Layout:**
   - Click "Save Layout" button
   - Name your layout
   - Set as default (optional)
   - Can create multiple layouts

**Pre-configured Layouts:**
- SOC Analyst View
- Executive Summary
- Network Overview
- Incident Response
- Compliance Reporting

**Export/Import Layouts:**
```json
// Export layout to JSON
{
  "name": "My Custom Layout",
  "widgets": [
    {
      "type": "alert-counter",
      "position": {"x": 0, "y": 0},
      "size": {"w": 4, "h": 2},
      "config": {"timeRange": "24h"}
    }
  ]
}
```

#### 6. Configure Plan Management (Local Development)

**⚠️ Only applicable when using ngrok for local development**

**Purpose:** Test subscription/payment features locally

**Steps:**

1. **Get ngrok URL**
   - From Terminal 3 running ngrok
   - Copy: `https://abc-def-123.ngrok-free.app`

2. **Configure Webhook Endpoint**
   - Go to Settings → Integrations
   - Find "Payment Webhooks" section
   - Enter ngrok URL + webhook path:
   ```
   Stripe: https://abc-def-123.ngrok-free.app/api/webhooks/stripe
   PayPal: https://abc-def-123.ngrok-free.app/api/webhooks/paypal
   ```

3. **Configure in Payment Provider**
   - **Stripe Dashboard:**
     - Developers → Webhooks
     - Add endpoint: [your ngrok URL]
     - Select events to listen for
     - Get signing secret

   - **PayPal Developer Portal:**
     - Apps & Credentials
     - Webhook settings
     - Add webhook URL
     - Choose events

4. **Test Webhooks**
   - Make test payment
   - Check ngrok dashboard (http://127.0.0.1:4040)
   - See webhook request details
   - Verify Sentinel receives and processes

5. **Monitor in Real-Time**
   - Open ngrok web interface
   - Watch webhook calls live
   - Inspect headers, body, response
   - Replay failed webhooks

**Subscription Plans Configuration:**
```
Settings → Plans → Configure
- Free Plan: 100 alerts/month
- Basic Plan: 10,000 alerts/month ($9.99)
- Pro Plan: 100,000 alerts/month ($49.99)
- Enterprise: Unlimited ($199.99)
```

**Testing Scenarios:**
- New subscription
- Subscription upgrade
- Subscription cancellation
- Payment failed
- Trial expiration

---

## 🔌 IDS Integration Guide

### Suricata Integration (Primary)

**Status:** ✅ Fully Supported (Native)

Sentinel is designed to work seamlessly with Suricata IDS out of the box.

#### Suricata Configuration

**Pre-configured File:** `frontend/resources/suricata.yaml`

**Key Configuration Sections:**

```yaml
# EVE JSON Output (Required for Sentinel)
outputs:
  - eve-log:
      enabled: yes
      filetype: regular  # or unix_stream for socket
      filename: eve.json
      
      # Event types to log
      types:
        - alert:
            payload: yes           # Include packet payload
            payload-buffer-size: 4kb
            payload-printable: yes # ASCII representation
            packet: yes            # Include packet info
            metadata: yes          # Include rule metadata
            
        - http:
            extended: yes          # Extended HTTP logging
            
        - dns:
            query: yes             # Log DNS queries
            answer: yes            # Log DNS answers
            
        - tls:
            extended: yes          # TLS handshake details
            
        - files:
            force-magic: yes       # Force file type detection
            
        - ssh:
            enabled: yes           # SSH events
            
        - flow:
            enabled: yes           # Flow records

# Alert Settings
alert-threshold:
  type: threshold
  track: by_src
  count: 5
  seconds: 60

# Performance Tuning
threading:
  set-cpu-affinity: yes
  detect-thread-ratio: 1.5

# Logging
logging:
  default-log-level: info
  outputs:
    - console:
        enabled: yes
    - file:
        enabled: yes
        filename: suricata.log
```

#### Connecting Sentinel Agent to Suricata

**Sentinel Agent Configuration:**

The agent monitors Suricata's `eve.json` file and ingests alerts into Sentinel.

**Configure Agent:**

1. **Edit agent configuration** (if needed):
```python
# backend/agentUI.py or agent/config.py

SURICATA_LOG_PATH = "C:\\Program Files\\Suricata\\log\\eve.json"
SENTINEL_API_URL = "http://localhost:5000/api/alerts"
POLL_INTERVAL = 5  # seconds
BATCH_SIZE = 100   # alerts per batch
```

2. **Start Agent** (Terminal 5):
```bash
cd backend
.\venv\Scripts\Activate.ps1
python agentUI.py
```

3. **Agent Output:**
```
=================================
    SENTINEL AGENT MONITOR
=================================
Configuration:
- Suricata Log: C:\Program Files\Suricata\log\eve.json
- API Endpoint: http://localhost:5000/api/alerts
- Poll Interval: 5 seconds
- Batch Size: 100 alerts

[10:30:00] Agent started
[10:30:00] Monitoring file: eve.json
[10:30:05] Checking for new alerts...
[10:30:05] Found 0 new alerts
[10:30:10] Checking for new alerts...
[10:30:10] Found 3 new alerts
[10:30:10]   - ET SCAN Nmap Scripting Engine
[10:30:10]   - ET POLICY Suspicious User-Agent
[10:30:10]   - ET INFO DNS Query to Dynamic DNS Provider
[10:30:11] Sent batch to API: 3 alerts ingested
[10:30:11] API Response: 201 Created
```

#### Data Flow: Suricata → Agent → Sentinel

```
1. Network Traffic
   ↓
2. Suricata IDS (analyzes packets)
   ↓
3. Rules Engine (matches signatures)
   ↓
4. EVE JSON Logger (writes to eve.json)
   ↓
5. Sentinel Agent (monitors file, detects new alerts)
   ↓
6. Alert Processing (enrichment, deduplication)
   ↓
7. REST API (POST to /api/alerts)
   ↓
8. Backend Validation (schema check, sanitization)
   ↓
9. Database Storage (MySQL insert)
   ↓
10. WebSocket Broadcast (real-time update to frontend)
    ↓
11. Dashboard Update (alert appears in UI)
```

#### Suricata Rule Management

**Viewing Active Rules:**
```bash
cd "C:\Program Files\Suricata\rules"
dir *.rules

# Common rulesets:
# - suricata.rules (enabled rules)
# - emerging-threats.rules
# - local.rules (your custom rules)
```

**Adding Custom Rules:**

Create `local.rules`:
```bash
# Navigate to rules directory
cd "C:\Program Files\Suricata\rules"

# Create local.rules
notepad local.rules
```

**Example Custom Rules:**
```
# Detect SSH brute force attempts
alert tcp any any -> $HOME_NET 22 (msg:"SSH Brute Force Attempt"; flow:to_server,established; content:"SSH"; threshold:type both, track by_src, count 5, seconds 60; sid:1000001; rev:1;)

# Detect suspicious user agents
alert http any any -> any any (msg:"Suspicious User-Agent Python"; flow:to_server,established; content:"User-Agent|3a| Python"; http_header; sid:1000002; rev:1;)

# Detect port scanning
alert tcp any any -> $HOME_NET any (msg:"Potential Port Scan"; flags:S; threshold:type threshold, track by_src, count 20, seconds 10; sid:1000003; rev:1;)

# Detect DNS tunneling
alert dns any any -> any any (msg:"Potential DNS Tunneling - Long Query"; dns_query; content:"|00|"; depth:1; byte_test:1,>,50,0; sid:1000004; rev:1;)
```

**Enable Local Rules:**
```yaml
# Edit suricata.yaml
rule-files:
  - suricata.rules
  - local.rules  # Add this line
```

**Update and Reload Rules:**
```bash
# Update from internet sources
suricata-update

# Reload without restarting
# (Requires suricata running with unix socket)
suricatasc -c reload-rules

# Or restart Suricata
# Stop: Ctrl+C in Suricata terminal
# Start: suricata -c suricata.yaml -i Ethernet
```

#### Suricata Performance Optimization

**For High-Traffic Environments:**

```yaml
# suricata.yaml optimizations

# Increase workers
threading:
  set-cpu-affinity: yes
  cpu-affinity:
    - management-cpu-set:
        cpu: [ 0 ]
    - receive-cpu-set:
        cpu: [ 0 ]
    - worker-cpu-set:
        cpu: [ "all" ]
        mode: "exclusive"
  detect-thread-ratio: 1.5

# Increase buffer sizes
stream:
  memcap: 256mb
  checksum-validation: no  # If behind NAT
  
defrag:
  memcap: 256mb
  
flow:
  memcap: 512mb
  hash-size: 65536

# Disable unnecessary features if not needed
app-layer:
  protocols:
    http:
      enabled: yes
      memcap: 256mb
    tls:
      enabled: yes
    dns:
      enabled: yes
    smtp:
      enabled: no  # Disable if not monitoring email
    ftp:
      enabled: no  # Disable if not needed
```

**Monitoring Performance:**
```bash
# View stats
type "C:\Program Files\Suricata\log\stats.log"

# Key metrics to watch:
# - capture.kernel_packets (packets captured)
# - capture.kernel_drops (dropped packets - should be 0)
# - flow.memuse (memory usage)
# - tcp.memuse (TCP memory)
```

**Target Metrics:**
- Packet drop rate: < 0.1%
- CPU usage: < 80%
- Memory usage: < 80%
- Alert processing delay: < 1 second

### Snort Integration (Secondary)

**Status:** ⚠️ Requires Additional Setup

Snort requires configuration to output JSON format that Sentinel can ingest.

#### Snort Configuration

**Pre-configured File:** `frontend/resources/snort.conf`

**Key Configuration:**

```conf
# Output JSON format
output alert_json: /var/log/snort/alert.json

# Or for Snort 3:
alert_json = {
    file = true,
    limit = 100
}

# Sentinel-compatible format
config output: alert_json, filename=/var/log/snort/alert.json

# Include other standard Snort configs
include classification.config
include reference.config
include threshold.conf

# Rule files
include $RULE_PATH/local.rules
include $RULE_PATH/community.rules
```

**Converting Snort Unified2 to JSON:**

If Snort outputs Unified2 format:

```bash
# Install u2json converter
pip install u2json

# Convert to JSON
u2json /var/log/snort/snort.log.1234567890 > alerts.json

# Upload to Sentinel via UI or API
curl -X POST http://localhost:5000/api/alerts/upload \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d @alerts.json
```

#### Snort Agent Integration

**Custom Agent for Snort:**

```python
# agent/snort_agent.py
import json
import time
import requests
from pathlib import Path

SNORT_LOG = "/var/log/snort/alert.json"
API_URL = "http://localhost:5000/api/alerts"
API_KEY = "your-api-key"

def monitor_snort_log():
    """Monitor Snort JSON log file"""
    last_position = 0
    
    while True:
        try:
            with open(SNORT_LOG, 'r') as f:
                f.seek(last_position)
                new_alerts = []
                
                for line in f:
                    try:
                        alert = json.loads(line)
                        # Transform Snort format to Sentinel format
                        sentinel_alert = transform_snort_alert(alert)
                        new_alerts.append(sentinel_alert)
                    except json.JSONDecodeError:
                        continue
                
                last_position = f.tell()
                
                if new_alerts:
                    # Send to Sentinel API
                    response = requests.post(
                        API_URL,
                        json=new_alerts,
                        headers={"Authorization": f"Bearer {API_KEY}"}
                    )
                    print(f"Sent {len(new_alerts)} alerts: {response.status_code}")
            
            time.sleep(5)  # Poll every 5 seconds
            
        except FileNotFoundError:
            print(f"Waiting for {SNORT_LOG}...")
            time.sleep(10)
        except Exception as e:
            print(f"Error: {e}")
            time.sleep(5)

def transform_snort_alert(snort_alert):
    """Transform Snort alert to Sentinel format"""
    return {
        "timestamp": snort_alert.get("timestamp"),
        "alert": {
            "signature": snort_alert.get("msg"),
            "severity": map_snort_priority(snort_alert.get("priority")),
            "category": snort_alert.get("classification")
        },
        "src_ip": snort_alert.get("src_ip"),
        "src_port": snort_alert.get("src_port"),
        "dest_ip": snort_alert.get("dst_ip"),
        "dest_port": snort_alert.get("dst_port"),
        "proto": snort_alert.get("protocol"),
        "metadata": {
            "gid": snort_alert.get("gid"),
            "sid": snort_alert.get("sid"),
            "rev": snort_alert.get("rev")
        }
    }

def map_snort_priority(priority):
    """Map Snort priority to Sentinel severity"""
    # Snort: 1=high, 2=medium, 3=low
    # Sentinel: 1=critical, 2=high, 3=medium, 4=low
    mapping = {1: 2, 2: 3, 3: 4}
    return mapping.get(priority, 3)

if __name__ == "__main__":
    monitor_snort_log()
```

### Other IDS Integration

**Zeek (formerly Bro):**
- Outputs JSON logs natively
- Use Zeek's `conn.log`, `dns.log`, `http.log`
- Parse with custom agent
- Similar to Suricata integration

**OSSEC:**
- Export alerts in JSON format
- Configure alert output format
- Use OSSEC API or log files
- Map severity levels to Sentinel format

**Generic IDS:**
- Most IDS can output JSON or XML
- Write custom parser agent
- Transform to Sentinel alert schema
- Submit via REST API

**Required Alert Schema:**
```json
{
  "timestamp": "ISO-8601 format",
  "alert": {
    "signature": "Alert rule name",
    "severity": 1-4,
    "category": "Alert category"
  },
  "src_ip": "Source IP",
  "src_port": 12345,
  "dest_ip": "Destination IP",
  "dest_port": 80,
  "proto": "TCP/UDP/ICMP",
  "metadata": {}  // Optional additional fields
}
```

---

## 📦 PCAP Upload and Alert Matching

### Overview

The PCAP feature allows security analysts to upload network packet captures and automatically correlate them with existing alerts in the Sentinel database. This is crucial for forensic analysis and incident investigation.

### How Packet Matching Works

#### Matching Algorithm

**Primary Matching Criteria (Required):**
1. **Source IP Address** - Must match exactly
2. **Destination IP Address** - Must match exactly

**Secondary Matching Criteria (Improves Confidence):**
3. **Source Port** - Increases confidence if matches
4. **Destination Port** - Increases confidence if matches
5. **Protocol** (TCP/UDP/ICMP/etc.) - Increases confidence if matches
6. **Timestamp Window** - Packet timestamp within ±5 seconds of alert (configurable)

#### Confidence Scoring Algorithm

```python
def calculate_confidence(packet, alert):
    """
    Calculate match confidence score
    Base: 1.0 (100%)
    Adjustments based on criteria
    """
    confidence = 1.0
    
    # IP addresses must match (required)
    if packet.src_ip != alert.src_ip or packet.dest_ip != alert.dest_ip:
        return 0.0  # No match
    
    # Protocol mismatch penalty
    if packet.protocol != alert.protocol:
        confidence *= 0.8  # -20%
    
    # Port mismatch penalty
    if packet.src_port != alert.src_port or packet.dest_port != alert.dest_port:
        confidence *= 0.9  # -10%
    
    # Time difference penalty
    time_diff = abs((packet.timestamp - alert.timestamp).total_seconds())
    time_window = 5.0  # seconds
    
    if time_diff > time_window:
        return 0.0  # Outside time window
    elif time_diff > 1.0:
        # Linear penalty for time difference > 1s
        time_penalty = 1 - (time_diff / time_window * 0.2)
        confidence *= time_penalty
    
    return confidence

# Confidence Ranges:
# 0.90 - 1.00: High confidence (green)
# 0.70 - 0.89: Medium confidence (yellow)
# 0.50 - 0.69: Low confidence (orange)
# 0.00 - 0.49: No match (not shown)
```

**Example Scenarios:**

| Scenario | IPs | Ports | Protocol | Time Diff | Confidence |
|----------|-----|-------|----------|-----------|------------|
| Perfect match | ✓ | ✓ | ✓ | 0.5s | 100% |
| Port mismatch | ✓ | ✗ | ✓ | 0.5s | 90% |
| Protocol mismatch | ✓ | ✓ | ✗ | 0.5s | 80% |
| Time 3s | ✓ | ✓ | ✓ | 3.0s | 88% |
| Multiple mismatches | ✓ | ✗ | ✗ | 4.0s | 58% |

### Using the PCAP Upload Feature

#### Step-by-Step Guide

**1. Prepare PCAP File**

**Supported Formats:**
- `.pcap` - Standard libpcap format
- `.pcapng` - PCAP Next Generation (newer format)
- `.cap` - Wireshark capture format
- `.pcap.gz` - Gzipped PCAP (automatically decompressed)

**File Size Limits:**
- Maximum: 2GB per file (configurable in backend)
- Recommended: < 500MB for faster processing
- Large files can be split with Wireshark:
  ```
  editcap -c 100000 large.pcap split.pcap
  # Creates: split_00000.pcap, split_00001.pcap, etc.
  ```

**2. Navigate to PCAP Upload**

**Option A - From Alerts Page:**
- Go to Alerts menu
- Click "📦 Upload PCAP" button in toolbar

**Option B - From Alert Detail:**
- Open any alert (double-click)
- Click "📦 Upload PCAP" button in actions bar

**Option C - From Dashboard:**
- Click "PCAP" in main navigation
- Click "Upload New PCAP" button

**3. Select and Upload File**

**Upload Dialog:**
```
┌─────────────────────────────────────┐
│   Upload PCAP File                  │
├─────────────────────────────────────┤
│                                     │
│  [Choose File]  capture.pcap        │
│                                     │
│  File Info:                         │
│  - Size: 45.2 MB                   │
│  - Format: PCAP                     │
│  - Estimated packets: ~150,000      │
│                                     │
│  Matching Options:                  │
│  ☑ Match source IP                 │
│  ☑ Match destination IP            │
│  ☑ Match ports (if available)      │
│  ☑ Match protocol                  │
│  Time window: [5] seconds          │
│                                     │
│  [ Cancel ]  [ Upload & Process ]  │
└─────────────────────────────────────┘
```

**4. Processing**

**Upload Progress:**
```
Uploading PCAP file...
████████████████████░░  85% (38.4 MB / 45.2 MB)
```

**Parsing Progress:**
```
Parsing packets...
████████████████░░░░░░  70% (105,000 / 150,000 packets)

Current stats:
- Packets parsed: 105,000
- Potential matches found: 847
- Processing rate: 5,000 packets/sec
- Estimated time remaining: 9 seconds
```

**Matching Progress:**
```
Matching with alerts...
████████████████████░░  95% (805 / 847 candidates)

Confidence breakdown:
- High (>90%): 623
- Medium (70-90%): 147
- Low (50-70%): 35
```

**5. Results Summary**

**Success Notification:**
```
✓ PCAP processed successfully!

File: capture.pcap (45.2 MB)
Processing time: 32.4 seconds

Packets Statistics:
├─ Total packets: 150,234
├─ TCP: 98,456 (65.5%)
├─ UDP: 45,123 (30.0%)
└─ Other: 6,655 (4.5%)

Matching Results:
├─ Matched to alerts: 1,247 (0.8%)
├─ High confidence: 1,100 (88.2%)
├─ Medium confidence: 147 (11.8%)
└─ Low confidence: 0 (0.0%)

Storage:
├─ Packet data stored: 12.3 MB (first 10KB each)
├─ Metadata indexed: All packets
└─ Database size increase: 15.7 MB

[ View Matches ] [ Download Report ] [ Close ]
```

**6. View Matched Packets**

**Navigate to Alert with Matches:**
- Alerts with matched packets show 📦 icon
- Badge shows number of matches: `📦 15`

**Alert Detail - PCAP Tab:**
```
┌────────────────────────────────────────────────────────────┐
│ 📦 Matched PCAP Packets (15 matches)                       │
├────────────────────────────────────────────────────────────┤
│ PCAP File: capture.pcap                                    │
│ Uploaded: 2025-10-25 10:45:00                             │
│ [Download Full PCAP] [Export Matched Packets]            │
├────────────────────────────────────────────────────────────┤
│ Pkt#  │ Timestamp         │ Flow              │ Proto│ Len │ Conf│
├───────┼───────────────────┼───────────────────┼──────┼─────┼─────┤
│ 1,234 │ 10:30:15.123456  │ 192.168.1.100:54321│ TCP │ 1,514│ 100%│
│       │                   │  → 10.0.0.1:22    │      │     │🟢   │
├───────┼───────────────────┼───────────────────┼──────┼─────┼─────┤
│ 1,235 │ 10:30:15.234567  │ 10.0.0.1:22       │ TCP │ 1,514│ 100%│
│       │                   │  → 192.168.1.100:54321 │  │     │🟢   │
├───────┼───────────────────┼───────────────────┼──────┼─────┼─────┤
│ 1,240 │ 10:30:15.456789  │ 192.168.1.100:54321│ TCP │  60 │ 100%│
│       │                   │  → 10.0.0.1:22    │      │     │🟢   │
└───────┴───────────────────┴───────────────────┴──────┴─────┴─────┘

[Show] More details: Payload | Hex Dump | Dissection
```

**Click Packet Row for Details:**
```
┌────────────────────────────────────────────────────────────┐
│ Packet #1,234 Details                                      │
├────────────────────────────────────────────────────────────┤
│ Timestamp: 2025-10-25 10:30:15.123456                     │
│ Capture Length: 1,514 bytes                                │
│ Wire Length: 1,514 bytes                                   │
│                                                            │
│ Ethernet II:                                               │
│ ├─ Source: 00:11:22:33:44:55                             │
│ └─ Destination: AA:BB:CC:DD:EE:FF                        │
│                                                            │
│ IP:                                                        │
│ ├─ Version: 4                                             │
│ ├─ Header Length: 20 bytes                                │
│ ├─ TTL: 64                                                │
│ ├─ Protocol: TCP (6)                                      │
│ ├─ Source: 192.168.1.100                                  │
│ └─ Destination: 10.0.0.1                                  │
│                                                            │
│ TCP:                                                       │
│ ├─ Source Port: 54321                                     │
│ ├─ Destination Port: 22 (SSH)                            │
│ ├─ Sequence: 1234567890                                   │
│ ├─ Acknowledgment: 987654321                              │
│ ├─ Flags: PSH, ACK                                        │
│ └─ Window Size: 65535                                     │
│                                                            │
│ Payload (first 256 bytes):                                │
│ 53 53 48 2d 32 2e 30 2d 4f 70 65 6e 53 53 48 5f  SSH-2.0-OpenSSH_│
│ 37 2e 34 0d 0a 00 00 00 4c 64 69 66 66 69 65 2d  7.4.....Ldiffie-│
│ ...                                                        │
│                                                            │
│ [ Download Packet ] [ View in Wireshark ] [ Copy Hex ]   │
└────────────────────────────────────────────────────────────┘
```

### API Endpoints for PCAP

**Upload PCAP:**
```http
POST /api/pcaps/upload
Content-Type: multipart/form-data
Authorization: Bearer <jwt_token>

Form Data:
- file: <pcap_file>
- time_window: 5 (optional, default 5 seconds)
- match_ports: true (optional, default true)
- match_protocol: true (optional, default true)
```

**Response:**
```json
{
  "success": true,
  "pcap_id": 123,
  "filename": "capture.pcap",
  "stats": {
    "total_packets": 150234,
    "total_matches": 1247,
    "high_confidence": 1100,
    "medium_confidence": 147,
    "low_confidence": 0,
    "processing_time": 32,
  },
}
json```
```

## Database Seeding

### Overview

The `seed.py` script populates your database with initial data for testing and development. This is essential for getting started with Sentinel as it creates the necessary database schema, user accounts, and sample data.

### What Gets Seeded

**1. Database Tables**
- Creates all necessary tables (users, alerts, log_sources, pcaps, packets, etc.)
- Sets up relationships and indexes
- Configures UTF-8 character encoding

**2. User Accounts**
```
Admin Account:
  Username: admin
  Password: admin123
  Role: Administrator (full system access)
  
Analyst Account:
  Username: analyst
  Password: analyst123
  Role: Analyst (alert management, PCAP upload, analysis)
  
Viewer Account:
  Username: viewer
  Password: viewer123
  Role: Viewer (read-only dashboard access)
```

**3. Sample Alerts**
- 50+ pre-configured security alerts
- Various severity levels: Critical, High, Medium, Low
- Different alert types:
  - Network scans (Nmap, port scanning)
  - SSH brute force attempts
  - Suspicious user agents
  - Malware communication
  - Policy violations
- Realistic timestamps and metadata
- Geographic distribution (multiple source countries)

**4. Log Sources**
- Sample IDS configurations (Suricata, Snort)
- API key examples for integrations
- Integration endpoint configurations

**5. System Configuration**
- Default alert thresholds
- Notification settings
- Dashboard preferences

### Running the Seed Script

**Initial Setup:**
```bash
# Navigate to backend directory
cd backend

# Activate virtual environment
.\venv\Scripts\Activate.ps1  # Windows
source venv/bin/activate      # Linux/Mac

# Run seed script
python seed.py
```

**Expected Output:**
```
Connecting to database...
Creating database tables...
✓ Tables created successfully

Seeding users...
  ✓ Created user: admin
  ✓ Created user: analyst
  ✓ Created user: viewer

Seeding alerts...
  ✓ Created 50 sample alerts
  Severities: 10 Critical, 15 High, 15 Medium, 10 Low

Seeding log sources...
  ✓ Created 3 log sources
  ✓ Created 5 API keys

Database seeded successfully!

================================= DEFAULT LOGIN CREDENTIALS =================================
Admin Account:
  Username: admin
  Password: admin123
  Role: Administrator

Analyst Account:
  Username: analyst
  Password: analyst123
  Role: Analyst

Viewer Account:
  Username: viewer
  Password: viewer123
  Role: Viewer
============================================================================================
⚠️  IMPORTANT: Change passwords after first login!
============================================================================================
```

### Re-seeding the Database

If you need to reset your database to initial state:

```bash
cd backend
.\venv\Scripts\Activate.ps1

# This will drop existing data and recreate everything
python seed.py
```

**⚠️ Warning:** Re-seeding will:
- Delete ALL existing data (alerts, users, uploads, etc.)
- Reset all tables
- Recreate initial sample data
- Cannot be undone

**Use Cases for Re-seeding:**
- Testing new features with clean data
- Resetting after development experiments
- Fixing corrupted database state
- Demo preparation

### Customizing Seed Data

You can modify `seed.py` to add custom data:

```python
# Example: Add custom user
from app.models.user import User

custom_user = User(
    username='custom_admin',
    email='custom@example.com',
    role='admin'
)
custom_user.set_password('secure_password')
db.session.add(custom_user)
db.session.commit()
```

---

## 🔄 Subsequent Runs

After completing the initial setup, running Sentinel is straightforward. You only need to start the required services.

### Quick Start (Minimum Setup)

For basic functionality, you need **2 terminals**:

**Terminal 1 - Backend Server:**
```bash
# Navigate to backend
cd C:\path\to\CSIT321-FYP-25-S3-07-Project-Sentinel\backend

# Activate virtual environment
.\venv\Scripts\Activate.ps1

# Start backend
python run.py
```

**Expected Output:**
```
 * Serving Flask app 'run'
 * Debug mode: on
 * Running on http://127.0.0.1:5000
 * Running on http://localhost:5000
Press CTRL+C to quit
```

**Terminal 2 - Frontend Server:**
```bash
# Navigate to frontend
cd C:\path\to\CSIT321-FYP-25-S3-07-Project-Sentinel\frontend

# Start frontend
npm run dev
```

**Expected Output:**
```
  VITE v4.4.9  ready in 1234 ms

  ➜  Local:   http://localhost:5173/
  ➜  Network: use --host to expose
  ➜  press h to show help
```

**Access Application:**
- Open browser: `http://localhost:5173`
- Login with default credentials

### Full Setup (All Features)

For complete functionality including live monitoring, you need **3-5 terminals**:

**Terminal 1 - Backend** (Required)
```bash
cd backend
.\venv\Scripts\Activate.ps1
python run.py
```

**Terminal 2 - Frontend** (Required)
```bash
cd frontend
npm run dev
```

**Terminal 3 - Suricata IDS** (Optional - for live alerts)
```bash
# Run as Administrator
cd "C:\Program Files\Suricata"
suricata -c suricata.yaml -i Ethernet
```

**Terminal 4 - Agent Monitor** (Optional - for agent management)
```bash
cd backend
.\venv\Scripts\Activate.ps1
python agentUI.py
```

**Terminal 5 - ngrok** (Optional - for webhook testing)
```bash
cd C:\ngrok
.\ngrok http 5000
```

### Startup Order

**Important:** Always start services in this order:

1. **MySQL** (should be running as Windows service)
2. **Backend** (wait 5-10 seconds for initialization)
3. **Frontend** (after backend is ready)
4. **Suricata** (independent, can start anytime)
5. **Agent** (requires backend and Suricata)
6. **ngrok** (requires backend)

### Quick Health Check

After starting services, verify everything is running:

**Backend Health:**
```bash
curl http://localhost:5000/api/health
```

**Expected Response:**
```json
{"status":"healthy","database":"connected"}
```

**Frontend Health:**
- Open `http://localhost:5173` in browser
- Should see login page
- Check browser console (F12) for errors

### Shutdown Procedure

**Proper Shutdown Order:**

1. **Close Frontend** (Terminal 2)
   - Press `Ctrl+C` or type `q`

2. **Stop Agent** (Terminal 4)
   - Press `Ctrl+C`

3. **Stop Suricata** (Terminal 3)
   - Press `Ctrl+C`

4. **Stop Backend** (Terminal 1)
   - Press `Ctrl+C`

5. **Stop ngrok** (Terminal 5)
   - Press `Ctrl+C`

**Don't Close MySQL** - It runs as a Windows service and should remain active.

### Automated Startup Scripts

**Windows PowerShell Script (start_sentinel.ps1):**
```powershell
# Start Backend
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd C:\path\to\backend; .\venv\Scripts\Activate.ps1; python run.py"

# Wait for backend to initialize
Start-Sleep -Seconds 10

# Start Frontend
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd C:\path\to\frontend; npm run dev"

Write-Host "Sentinel is starting..."
Write-Host "Backend: http://localhost:5000"
Write-Host "Frontend: http://localhost:5173"
```

**Usage:**
```powershell
.\start_sentinel.ps1
```

---

## 🧪 Testing

### Backend Tests

**Running All Tests:**
```bash
cd backend
.\venv\Scripts\Activate.ps1

# Run all tests
pytest

# Run with coverage
pytest --cov=app --cov-report=html

# Run specific test file
pytest tests/test_alerts.py

# Run with verbose output
pytest -v
```

**Expected Output:**
```
========================= test session starts =========================
platform win32 -- Python 3.10.11, pytest-7.4.0
collected 45 items

tests/test_alerts.py ..................                         [ 40%]
tests/test_auth.py ..........                                   [ 62%]
tests/test_pcaps.py ............                                [ 89%]
tests/test_users.py .....                                       [100%]

========================= 45 passed in 12.34s =========================
```

**Test Categories:**

1. **Authentication Tests** (`test_auth.py`)
   - User registration
   - Login/logout
   - JWT token validation
   - Password hashing

2. **Alert Tests** (`test_alerts.py`)
   - Alert creation
   - Alert retrieval
   - Filtering and searching
   - Alert validation

3. **PCAP Tests** (`test_pcaps.py`)
   - File upload
   - Packet parsing
   - Alert matching
   - Confidence scoring

4. **User Tests** (`test_users.py`)
   - User CRUD operations
   - Role management
   - Permissions

### Frontend Tests

**Running All Tests:**
```bash
cd frontend

# Run tests
npm test

# Run tests with coverage
npm run test:coverage

# Run tests in watch mode
npm run test:watch
```

**Expected Output:**
```
 PASS  src/components/Dashboard.test.tsx
 PASS  src/components/AlertTable.test.tsx
 PASS  src/services/api.test.ts

Test Suites: 3 passed, 3 total
Tests:       24 passed, 24 total
Snapshots:   0 total
Time:        5.678 s
```

### Integration Tests

**API Integration Tests:**
```bash
cd backend
pytest tests/integration/
```

**End-to-End Tests (if configured):**
```bash
cd frontend
npm run test:e2e
```

### Manual Testing Checklist

**Authentication:**
- [ ] Login with admin account
- [ ] Login with analyst account
- [ ] Login with viewer account
- [ ] Logout functionality
- [ ] Invalid credentials handling

**Dashboard:**
- [ ] Statistics display correctly
- [ ] Geographic map loads
- [ ] Recent alerts table populates
- [ ] System health indicators work

**Alerts:**
- [ ] View all alerts
- [ ] Filter by severity
- [ ] Search by IP address
- [ ] Double-click to view details
- [ ] Upload alert file

**PCAP Upload:**
- [ ] Upload PCAP file
- [ ] View matched packets
- [ ] Confidence scores display
- [ ] Packet details accessible

**Customization:**
- [ ] Rearrange dashboard widgets
- [ ] Save dashboard layout
- [ ] Change user preferences

---

## 🔧 Troubleshooting

### Common Issues and Solutions

#### Database Issues

**Issue: "MySQL service not running"**

**Solution:**
```bash
# Windows
1. Press Windows + R
2. Type: services.msc
3. Find "MySQL80"
4. Right-click → Start

# Or via Command Line
net start MySQL80
```

**Issue: "Access denied for user 'sentinel_user'"**

**Solution:**
```sql
-- Reconnect to MySQL as root
mysql -u root -p

-- Recreate user with correct password
DROP USER IF EXISTS 'sentinel_user'@'localhost';
CREATE USER 'sentinel_user'@'localhost' IDENTIFIED BY 'sentinel_fyp';
GRANT ALL PRIVILEGES ON sentinel_db.* TO 'sentinel_user'@'localhost';
FLUSH PRIVILEGES;
```

**Issue: "Database connection timeout"**

**Solution:**
```python
# Check backend/config.py
SQLALCHEMY_DATABASE_URI = 'mysql+pymysql://sentinel_user:sentinel_fyp@localhost:3306/sentinel_db'

# Verify:
# - MySQL is running on port 3306
# - Database 'sentinel_db' exists
# - Credentials are correct
```

#### Virtual Environment Issues

**Issue: "Cannot activate virtual environment"**

**Solution (PowerShell):**
```powershell
# Check execution policy
Get-ExecutionPolicy

# If Restricted, change it
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser

# Try activation again
.\venv\Scripts\Activate.ps1
```

**Solution (Alternative):**
```bash
# Use Command Prompt instead
cmd
cd backend
venv\Scripts\activate.bat
```

**Issue: "venv folder not found"**

**Solution:**
```bash
cd backend

# Recreate virtual environment
python -m venv venv

# Activate and reinstall dependencies
.\venv\Scripts\Activate.ps1
pip install -r requirements.txt
```

#### Port Conflicts

**Issue: "Port 5000 already in use"**

**Solution:**
```bash
# Find what's using port 5000
netstat -ano | findstr :5000

# Output shows PID, e.g., TCP 0.0.0.0:5000 LISTENING 12345
# Kill the process
taskkill /PID 12345 /F

# Or change backend port in config.py
PORT = 5001
```

**Issue: "Port 5173 already in use"**

**Solution:**
```bash
# Find and kill process
netstat -ano | findstr :5173
taskkill /PID <PID> /F

# Or change frontend port in vite.config.ts
server: {
  port: 5174
}
```

#### Dependency Issues

**Issue: "pip install fails"**

**Solution:**
```bash
# Upgrade pip
python -m pip install --upgrade pip

# Clear cache
pip cache purge

# Retry installation
pip install -r requirements.txt

# If specific package fails, install manually
pip install scapy==2.5.0
```

**Issue: "npm install fails"**

**Solution:**
```bash
# Clear npm cache
npm cache clean --force

# Delete node_modules
rm -r node_modules  # PowerShell
rmdir /s node_modules  # CMD

# Delete package-lock.json
rm package-lock.json

# Retry installation
npm install
```

#### PCAP Upload Issues

**Issue: "Scapy not installed" error**

**Solution:**
```bash
cd backend
.\venv\Scripts\Activate.ps1
pip install scapy==2.5.0
```

**Issue: "No matches found" for PCAP**

**Possible Causes:**
- Alert timestamps don't match packet timestamps (check ±5 second window)
- IP addresses don't match exactly
- Wrong PCAP file uploaded

**Solution:**
```bash
# Verify alert exists with matching IPs
# Check alert details in database
# Ensure PCAP contains traffic for those IPs
```

**Issue: "PCAP upload timeout"**

**Solution:**
```python
# Increase timeout in frontend/src/services/api.ts
const response = await axios.post('/api/pcaps/upload', formData, {
  timeout: 300000  // 5 minutes
});
```

#### Frontend Issues

**Issue: "Frontend can't connect to API"**

**Solution:**
1. Check backend is running: `curl http://localhost:5000/api/health`
2. Verify CORS configuration in `backend/config.py`:
```python
CORS_ORIGINS = [
    "http://localhost:5173",
    "http://127.0.0.1:5173"
]
```
3. Check `.env.development`:
```
VITE_API_URL=http://localhost:5000
```

**Issue: "White screen on frontend"**

**Solution:**
1. Check browser console (F12) for errors
2. Clear browser cache
3. Restart frontend server
4. Check for TypeScript errors: `npm run type-check`

#### Suricata Issues

**Issue: "Suricata permission denied"**

**Solution:**
- Run PowerShell as Administrator
- Check Npcap is installed correctly
- Verify interface name: `suricata --list-interfaces`

**Issue: "Cannot find eve.json"**

**Solution:**
```bash
# Check Suricata log directory
dir "C:\Program Files\Suricata\log\"

# If eve.json missing, check suricata.yaml:
outputs:
  - eve-log:
      enabled: yes
      filename: eve.json
```

#### Agent Issues

**Issue: "Agent not connecting to backend"**

**Solution:**
```python
# Check agent configuration
# Verify API endpoint URL
SENTINEL_API_URL = "http://localhost:5000/api/alerts"

# Test manually
curl -X POST http://localhost:5000/api/alerts -H "Content-Type: application/json"
```

### Getting Help

**Debug Mode:**
```bash
# Enable Flask debug mode for detailed errors
# In backend/config.py
DEBUG = True
```

**Check Logs:**
```bash
# Backend logs (console output)
# Frontend logs (browser console F12)
# Suricata logs
type "C:\Program Files\Suricata\log\suricata.log"
```

**Common Log Locations:**
- Backend: Console output (Terminal 1)
- Frontend: Browser DevTools Console
- Suricata: `C:\Program Files\Suricata\log\`
- MySQL: Check MySQL Workbench logs

---

## 📁 Project Structure

```
CSIT321-FYP-25-S3-07-PROJECT-SENTINEL/
│
├── agent/                          # Monitoring Agent
│   ├── main.py                     # Agent entry point
│   ├── main.spec                   # PyInstaller spec
│   └── requirements.txt            # Agent dependencies
│
├── backend/                        # Flask API Backend
│   ├── app/                        # Application package
│   │   ├── __init__.py            # App factory
│   │   ├── models/                # Database models
│   │   │   ├── __init__.py
│   │   │   ├── user.py           # User model
│   │   │   ├── alert.py          # Alert model
│   │   │   ├── pcap.py           # PCAP model
│   │   │   ├── packet.py         # Packet model
│   │   │   └── log_source.py     # Log source model
│   │   │
│   │   ├── routes/                # API endpoints
│   │   │   ├── __init__.py
│   │   │   ├── auth.py           # Authentication routes
│   │   │   ├── alerts.py         # Alert management
│   │   │   ├── pcaps.py          # PCAP upload/management
│   │   │   ├── users.py          # User management
│   │   │   └── dashboard.py      # Dashboard data
│   │   │
│   │   ├── services/              # Business logic
│   │   │   ├── __init__.py
│   │   │   ├── alert_service.py  # Alert processing
│   │   │   ├── pcap_service.py   # PCAP parsing
│   │   │   └── auth_service.py   # Authentication
│   │   │
│   │   └── uploads/               # File storage
│   │       └── pcaps/             # PCAP files (created at runtime)
│   │
│   ├── instance/                   # Instance-specific files
│   ├── tests/                      # Backend tests
│   │   ├── test_alerts.py
│   │   ├── test_auth.py
│   │   ├── test_pcaps.py
│   │   └── test_users.py
│   │
│   ├── venv/                       # Virtual environment (created during setup)
│   ├── config.py                   # Configuration settings
│   ├── requirements.txt            # Python dependencies
│   ├── run.py                      # Application entry point
│   ├── seed.py                     # Database seeding script
│   └── agentUI.py                  # Agent monitoring interface
│
├── frontend/                       # React Frontend
│   ├── node_modules/              # NPM packages (created during setup)
│   │
│   ├── public/                    # Static assets
│   │   └── vite.svg
│   │
│   ├── resources/                 # Configuration & samples
│   │   ├── suricata.yaml         # Suricata IDS config
│   │   ├── snort.conf            # Snort IDS config
│   │   ├── sample_alerts.json    # Sample alert file
│   │   └── *.pcap                # Sample PCAP files
│   │
│   ├── src/                       # Source code
│   │   ├── assets/               # Images, fonts, etc.
│   │   │
│   │   ├── components/           # React components
│   │   │   ├── common/          # Reusable components
│   │   │   │   ├── Button.tsx
│   │   │   │   ├── Input.tsx
│   │   │   │   ├── Modal.tsx
│   │   │   │   └── Table.tsx
│   │   │   │
│   │   │   ├── dashboard/       # Dashboard widgets
│   │   │   │   ├── StatCard.tsx
│   │   │   │   ├── AlertChart.tsx
│   │   │   │   └── GeographicMap.tsx
│   │   │   │
│   │   │   └── alerts/          # Alert components
│   │   │       ├── AlertTable.tsx
│   │   │       ├── AlertDetail.tsx
│   │   │       └── AlertFilter.tsx
│   │   │
│   │   ├── pages/                # Page components
│   │   │   ├── Login.tsx
│   │   │   ├── Dashboard.tsx
│   │   │   ├── Alerts.tsx
│   │   │   ├── PcapUpload.tsx
│   │   │   └── Settings.tsx
│   │   │
│   │   ├── services/             # API services
│   │   │   ├── api.ts           # Axios configuration
│   │   │   ├── authService.ts   # Authentication API
│   │   │   ├── alertService.ts  # Alert API
│   │   │   └── pcapService.ts   # PCAP API
│   │   │
│   │   ├── hooks/                # Custom React hooks
│   │   │   ├── useAuth.ts
│   │   │   ├── useAlerts.ts
│   │   │   └── useWebSocket.ts
│   │   │
│   │   ├── utils/                # Utility functions
│   │   │   ├── formatters.ts
│   │   │   ├── validators.ts
│   │   │   └── constants.ts
│   │   │
│   │   ├── types/                # TypeScript types
│   │   │   ├── alert.ts
│   │   │   ├── user.ts
│   │   │   └── pcap.ts
│   │   │
│   │   ├── App.tsx               # Main app component
│   │   ├── main.tsx              # Entry point
│   │   └── index.css             # Global styles
│   │
│   ├── .env.development           # Development environment variables
│   ├── .env.production            # Production environment variables
│   ├── package.json               # NPM dependencies
│   ├── package-lock.json          # Locked dependency versions
│   ├── tsconfig.json              # TypeScript configuration
│   ├── vite.config.ts             # Vite configuration
│   └── index.html                 # HTML template
│
├── .gitignore                     # Git ignore rules
├── README.md                      # This file
└── LICENSE                        # Project license
```

### Key Directories Explained

**Backend:**
- `app/models/` - SQLAlchemy ORM models (database tables)
- `app/routes/` - Flask route handlers (API endpoints)
- `app/services/` - Business logic (separated from routes)
- `app/uploads/` - File storage (PCAP files)
- `tests/` - Pytest test suite

**Frontend:**
- `src/components/` - Reusable React components
- `src/pages/` - Full page components (routes)
- `src/services/` - API integration layer
- `src/hooks/` - Custom React hooks for state management
- `resources/` - IDS configurations and sample data

**Agent:**
- Standalone Python application
- Monitors IDS logs (Suricata/Snort)
- Sends alerts to backend API

---

## 🔒 Security Considerations

### Authentication & Authorization

**JWT Implementation:**
- JWT tokens expire after 24 hours (configurable)
- Refresh tokens not implemented (planned enhancement)
- Tokens stored in browser localStorage
- Must be included in Authorization header for API calls

**Password Security:**
```python
# Passwords hashed with bcrypt
# Salt rounds: 12 (configurable in config.py)
# Never store plain-text passwords
from flask_bcrypt import Bcrypt
bcrypt = Bcrypt()
password_hash = bcrypt.generate_password_hash('password')
```

**Role-Based Access Control (RBAC):**
```
Admin Role:
  - Full system access
  - User management
  - System configuration
  
Analyst Role:
  - View and manage alerts
  - Upload PCAP files
  - Create reports
  
Viewer Role:
  - Read-only dashboard access
  - View alerts
  - Cannot modify data
```

### Input Validation

**SQL Injection Prevention:**
- SQLAlchemy ORM with parameterized queries
- No raw SQL execution
- Input sanitization on all endpoints

**XSS Prevention:**
- React automatically escapes output
- CSP headers configured
- DOMPurify for user-generated content

**File Upload Security:**
```python
# Secure filename handling
from werkzeug.utils import secure_filename

# Allowed file extensions
ALLOWED_PCAP_EXTENSIONS = {'.pcap', '.pcapng', '.cap'}

# File size limits
MAX_PCAP_SIZE = 2 * 1024 * 1024 * 1024  # 2GB

# Files stored outside web root
UPLOAD_FOLDER = 'app/uploads/pcaps/'
```

### CORS Configuration

**Development:**
```python
CORS_ORIGINS = [
    "http://localhost:5173",
    "http://127.0.0.1:5173"
]
```

**Production:**
```python
CORS_ORIGINS = [
    "https://yourdomain.com",
    "https://www.yourdomain.com"
]
```

### Database Security

**Connection Security:**
```python
# Use environment variables for credentials (production)
import os
DB_USER = os.getenv('DB_USER', 'sentinel_user')
DB_PASS = os.getenv('DB_PASS', 'sentinel_fyp')
```

**User Isolation:**
- PCAP files isolated per user_id
- Users can only access their own uploads
- Admin can view all data

### API Security

**Rate Limiting (planned):**
```python
# Install flask-limiter
# pip install flask-limiter

from flask_limiter import Limiter

limiter = Limiter(
    app,
    default_limits=["200 per day", "50 per hour"]
)

@app.route("/api/alerts")
@limiter.limit("10 per minute")
def get_alerts():
    pass
```

**HTTPS Enforcement (production):**
```python
# Redirect HTTP to HTTPS
from flask_sslify import SSLify

if not app.debug:
    sslify = SSLify(app)
```

### Data Privacy

**GDPR Considerations:**
- User data deletion capability
- Data export functionality
- Audit logs for data access

**PCAP Data:**
- First 10KB of each packet stored (configurable)
- Full PCAP files can be deleted
- Automatic cleanup after 90 days (configurable)

### Security Best Practices

**Production Deployment Checklist:**
```
[ ] Change default passwords
[ ] Use environment variables for secrets
[ ] Enable HTTPS/TLS
[ ] Configure firewall rules
[ ] Disable debug mode (DEBUG=False)
[ ] Set secure JWT_SECRET_KEY
[ ] Enable rate limiting
[ ] Configure log rotation
[ ] Regular security updates
[ ] Database backups enabled
[ ] Monitor error logs
[ ] Implement intrusion detection
```

**Secret Management:**
```bash
# Never commit secrets to Git
# Use .env files (add to .gitignore)

# backend/.env
JWT_SECRET_KEY=your-very-long-random-secret-key-here
DB_PASSWORD=your-secure-database-password
```

**Logging:**
```python
# Log security events
import logging

logging.info(f"User {username} logged in from {ip_address}")
logging.warning(f"Failed login attempt for {username}")
logging.error(f"Unauthorized access attempt to {endpoint}")
```

---

## 🚀 Production Deployment

### Pre-Deployment Checklist

**Code Preparation:**
```
[ ] All tests passing
[ ] Debug mode disabled
[ ] Production configuration set
[ ] Environment variables configured
[ ] Secrets rotated (JWT keys, DB passwords)
[ ] Dependencies up to date
[ ] Security audit completed
```

**Infrastructure:**
```
[ ] Server provisioned (VPS/Cloud)
[ ] Domain name registered
[ ] SSL/TLS certificate obtained
[ ] Database server configured
[ ] Firewall rules set
[ ] Backup solution in place
[ ] Monitoring tools configured
```

### Deployment Options

#### Option 1: Traditional VPS (Ubuntu 22.04)

**1. Server Setup:**
```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install dependencies
sudo apt install -y python3.10 python3-pip python3-venv
sudo apt install -y nodejs npm
sudo apt install -y nginx
sudo apt install -y mysql-server

# Install certbot for SSL
sudo apt install -y certbot python3-certbot-nginx
```

**2. MySQL Configuration:**
```bash
# Secure MySQL installation
sudo mysql_secure_installation

# Create database
sudo mysql -u root -p

CREATE DATABASE sentinel_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER 'sentinel_user'@'localhost' IDENTIFIED BY 'STRONG_PASSWORD_HERE';
GRANT ALL PRIVILEGES ON sentinel_db.* TO 'sentinel_user'@'localhost';
FLUSH PRIVILEGES;
EXIT;
```

**3. Deploy Backend:**
```bash
# Clone repository
cd /var/www
sudo git clone https://github.com/Roh00t/CSIT321-FYP-25-S3-07-Project-Sentinel.git
sudo chown -R $USER:$USER CSIT321-FYP-25-S3-07-Project-Sentinel

cd CSIT321-FYP-25-S3-07-Project-Sentinel/backend

# Create virtual environment
python3 -m venv venv
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt
pip install gunicorn  # WSGI server

# Configure environment
nano .env
# Add production settings

# Seed database
python seed.py
```

**4. Gunicorn Configuration:**
```bash
# Create gunicorn config
nano gunicorn_config.py
```

```python
# gunicorn_config.py
bind = "127.0.0.1:5000"
workers = 4
threads = 2
worker_class = "sync"
timeout = 120
keepalive = 5
errorlog = "/var/log/sentinel/gunicorn-error.log"
accesslog = "/var/log/sentinel/gunicorn-access.log"
loglevel = "info"
```

**5. Create systemd service:**
```bash
sudo nano /etc/systemd/system/sentinel-backend.service
```

```ini
[Unit]
Description=Sentinel Backend Service
After=network.target mysql.service

[Service]
Type=notify
User=www-data
Group=www-data
WorkingDirectory=/var/www/CSIT321-FYP-25-S3-07-Project-Sentinel/backend
Environment="PATH=/var/www/CSIT321-FYP-25-S3-07-Project-Sentinel/backend/venv/bin"
ExecStart=/var/www/CSIT321-FYP-25-S3-07-Project-Sentinel/backend/venv/bin/gunicorn \
    --config gunicorn_config.py \
    run:app
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
```

```bash
# Start service
sudo systemctl daemon-reload
sudo systemctl enable sentinel-backend
sudo systemctl start sentinel-backend
sudo systemctl status sentinel-backend
```

**6. Deploy Frontend:**
```bash
cd /var/www/CSIT321-FYP-25-S3-07-Project-Sentinel/frontend

# Create production environment file
nano .env.production
```

```
VITE_API_URL=https://yourdomain.com/api
```

```bash
# Install dependencies and build
npm install
npm run build

# Build output is in dist/ folder
```

**7. Nginx Configuration:**
```bash
sudo nano /etc/nginx/sites-available/sentinel
```

```nginx
server {
    listen 80;
    server_name yourdomain.com www.yourdomain.com;
    
    # Redirect HTTP to HTTPS
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name yourdomain.com www.yourdomain.com;

    # SSL Configuration (will be added by certbot)
    ssl_certificate /etc/letsencrypt/live/yourdomain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/yourdomain.com/privkey.pem;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;

    # Frontend (React build)
    root /var/www/CSIT321-FYP-25-S3-07-Project-Sentinel/frontend/dist;
    index index.html;

    # Frontend routes
    location / {
        try_files $uri $uri/ /index.html;
    }

    # API proxy to backend
    location /api/ {
        proxy_pass http://127.0.0.1:5000/api/;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        
        # WebSocket support
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        
        # Timeouts
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }

    # File upload size limit
    client_max_body_size 2G;

    # Logs
    access_log /var/log/nginx/sentinel-access.log;
    error_log /var/log/nginx/sentinel-error.log;

    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header Referrer-Policy "no-referrer-when-downgrade" always;
}
```

```bash
# Enable site
sudo ln -s /etc/nginx/sites-available/sentinel /etc/nginx/sites-enabled/
sudo nginx -t  # Test configuration
sudo systemctl restart nginx

# Obtain SSL certificate
sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com
```

**8. Firewall Configuration:**
```bash
# Configure UFW firewall
sudo ufw allow 22/tcp    # SSH
sudo ufw allow 80/tcp    # HTTP
sudo ufw allow 443/tcp   # HTTPS
sudo ufw enable
sudo ufw status
```

**9. Deploy Agent (Optional):**
```bash
# If using agent for live monitoring
cd /var/www/CSIT321-FYP-25-S3-07-Project-Sentinel/agent

# Create systemd service
sudo nano /etc/systemd/system/sentinel-agent.service
```

```ini
[Unit]
Description=Sentinel Agent
After=network.target sentinel-backend.service

[Service]
Type=simple
User=root
WorkingDirectory=/var/www/CSIT321-FYP-25-S3-07-Project-Sentinel/agent
ExecStart=/usr/bin/python3 main.py
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
```

```bash
sudo systemctl enable sentinel-agent
sudo systemctl start sentinel-agent
```

#### Option 2: Docker Deployment

**1. Create Dockerfiles:**

**Backend Dockerfile:**
```dockerfile
# backend/Dockerfile
FROM python:3.10-slim

WORKDIR /app

# Install dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt gunicorn

# Copy application
COPY . .

# Create uploads directory
RUN mkdir -p app/uploads/pcaps

EXPOSE 5000

CMD ["gunicorn", "--bind", "0.0.0.0:5000", "--workers", "4", "run:app"]
```

**Frontend Dockerfile:**
```dockerfile
# frontend/Dockerfile
FROM node:18-alpine as builder

WORKDIR /app

# Install dependencies
COPY package*.json ./
RUN npm ci

# Copy source and build
COPY . .
RUN npm run build

# Production stage
FROM nginx:alpine

COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
```

**2. Docker Compose Configuration:**
```yaml
# docker-compose.yml
version: '3.8'

services:
  mysql:
    image: mysql:8.0
    container_name: sentinel-mysql
    restart: always
    environment:
      MYSQL_ROOT_PASSWORD: ${MYSQL_ROOT_PASSWORD}
      MYSQL_DATABASE: sentinel_db
      MYSQL_USER: sentinel_user
      MYSQL_PASSWORD: ${MYSQL_PASSWORD}
    volumes:
      - mysql_data:/var/lib/mysql
    ports:
      - "3306:3306"
    networks:
      - sentinel-network

  backend:
    build: ./backend
    container_name: sentinel-backend
    restart: always
    environment:
      DATABASE_URL: mysql+pymysql://sentinel_user:${MYSQL_PASSWORD}@mysql:3306/sentinel_db
      JWT_SECRET_KEY: ${JWT_SECRET_KEY}
      FLASK_ENV: production
    volumes:
      - ./backend/app/uploads:/app/app/uploads
    ports:
      - "5000:5000"
    depends_on:
      - mysql
    networks:
      - sentinel-network

  frontend:
    build: ./frontend
    container_name: sentinel-frontend
    restart: always
    ports:
      - "80:80"
      - "443:443"
    depends_on:
      - backend
    networks:
      - sentinel-network

volumes:
  mysql_data:

networks:
  sentinel-network:
    driver: bridge
```

**3. Deploy with Docker Compose:**
```bash
# Create .env file
nano .env
```

```
MYSQL_ROOT_PASSWORD=your_secure_root_password
MYSQL_PASSWORD=your_secure_user_password
JWT_SECRET_KEY=your_long_random_jwt_secret
```

```bash
# Build and start containers
docker-compose up -d

# Check status
docker-compose ps

# View logs
docker-compose logs -f backend

# Seed database (one-time)
docker-compose exec backend python seed.py

# Stop all containers
docker-compose down
```

#### Option 3: Cloud Platform (AWS Example)

**AWS Architecture:**
```
Internet
    ↓
Application Load Balancer (HTTPS)
    ↓
    ├── EC2 Instance (Backend) - Auto Scaling Group
    │   └── Gunicorn + Flask
    ├── S3 (Frontend Static Files) + CloudFront CDN
    └── RDS MySQL (Database)
```

**1. RDS MySQL Setup:**
- Create RDS MySQL instance
- Security group: Allow port 3306 from backend EC2
- Enable automated backups
- Note endpoint and credentials

**2. EC2 Backend Setup:**
```bash
# Launch EC2 instance (Ubuntu 22.04)
# Security group: Allow 5000 from ALB, 22 from your IP

# SSH into instance
ssh -i your-key.pem ubuntu@ec2-instance

# Follow VPS deployment steps above
# Update database connection to RDS endpoint
```

**3. S3 + CloudFront Frontend:**
```bash
# Build frontend locally
cd frontend
npm run build

# Upload to S3
aws s3 sync dist/ s3://your-bucket-name/ --acl public-read

# Create CloudFront distribution
# Point to S3 bucket
# Enable HTTPS with ACM certificate
```

**4. Application Load Balancer:**
- Create ALB
- Target group: Backend EC2 instances (port 5000)
- Listener: HTTPS (port 443) with SSL certificate
- Health check: `/api/health`

### Post-Deployment

**1. Database Seeding (Production):**
```bash
# SSH into server
cd /var/www/CSIT321-FYP-25-S3-07-Project-Sentinel/backend
source venv/bin/activate
python seed.py
```

**2. Create Admin User:**
```bash
# After seeding, change default password immediately
# Login to web interface and change admin password
```

**3. Setup Monitoring:**

**Health Check Endpoint:**
```bash
# Test API health
curl https://yourdomain.com/api/health

# Should return:
# {"status":"healthy","database":"connected"}
```

**Uptime Monitoring:**
- Use UptimeRobot, Pingdom, or CloudWatch
- Monitor `/api/health` endpoint
- Alert on downtime

**Log Monitoring:**
```bash
# Setup log rotation
sudo nano /etc/logrotate.d/sentinel
```

```
/var/log/sentinel/*.log {
    daily
    missingok
    rotate 14
    compress
    delaycompress
    notifempty
    create 0640 www-data www-data
    sharedscripts
    postrotate
        systemctl reload sentinel-backend > /dev/null
    endscript
}
```

**4. Backup Strategy:**

**Database Backups:**
```bash
# Create backup script
nano /usr/local/bin/backup-sentinel-db.sh
```

```bash
#!/bin/bash
BACKUP_DIR="/var/backups/sentinel"
DATE=$(date +%Y%m%d_%H%M%S)
FILENAME="sentinel_db_$DATE.sql.gz"

mkdir -p $BACKUP_DIR

mysqldump -u sentinel_user -p'password' sentinel_db | gzip > $BACKUP_DIR/$FILENAME

# Keep only last 7 days
find $BACKUP_DIR -name "sentinel_db_*.sql.gz" -mtime +7 -delete

echo "Backup completed: $FILENAME"
```

```bash
chmod +x /usr/local/bin/backup-sentinel-db.sh

# Schedule daily backup (2 AM)
sudo crontab -e
0 2 * * * /usr/local/bin/backup-sentinel-db.sh
```

**PCAP File Backups:**
```bash
# Backup PCAP uploads
rsync -avz /var/www/.../backend/app/uploads/ /backup/pcaps/
```

**5. Security Hardening:**

**Fail2ban (Prevent brute force):**
```bash
sudo apt install fail2ban

sudo nano /etc/fail2ban/jail.local
```

```ini
[sentinel-backend]
enabled = true
port = 443
filter = sentinel-backend
logpath = /var/log/nginx/sentinel-error.log
maxretry = 5
bantime = 3600
```

**Automatic Security Updates:**
```bash
sudo apt install unattended-upgrades
sudo dpkg-reconfigure --priority=low unattended-upgrades
```

**6. Performance Optimization:**

**Redis Caching (Optional):**
```bash
sudo apt install redis-server

# Update backend to use Redis for session storage
pip install redis flask-session
```

**Database Optimization:**
```sql
-- Add indexes for common queries
CREATE INDEX idx_alerts_timestamp ON alerts(timestamp);
CREATE INDEX idx_alerts_severity ON alerts(severity);
CREATE INDEX idx_alerts_src_ip ON alerts(src_ip);
CREATE INDEX idx_packets_alert_id ON packets(alert_id);
```

**Nginx Caching:**
```nginx
# Add to nginx config
location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg)$ {
    expires 1y;
    add_header Cache-Control "public, immutable";
}
```

**7. Monitoring Dashboard:**

**Install monitoring tools:**
```bash
# Prometheus + Grafana (optional)
# Or use cloud monitoring (CloudWatch, Azure Monitor, etc.)
```

### Maintenance

**Regular Tasks:**
```
Daily:
- Check error logs
- Verify backups completed
- Monitor disk usage

Weekly:
- Review security alerts
- Check system updates
- Analyze performance metrics

Monthly:
- Rotate secrets/keys
- Review user accounts
- Update dependencies
- Security audit
```

**Update Deployment:**
```bash
# Pull latest code
cd /var/www/CSIT321-FYP-25-S3-07-Project-Sentinel
git pull origin main

# Backend updates
cd backend
source venv/bin/activate
pip install -r requirements.txt
sudo systemctl restart sentinel-backend

# Frontend updates
cd ../frontend
npm install
npm run build
# No restart needed (static files)

# Database migrations (if any)
python manage.py db upgrade  # If using Flask-Migrate
```

### Rollback Procedure

**If deployment fails:**
```bash
# Backend rollback
cd backend
git checkout <previous-commit-hash>
sudo systemctl restart sentinel-backend

# Frontend rollback
cd frontend
git checkout <previous-commit-hash>
npm run build

# Database rollback
# Restore from backup
gunzip < /var/backups/sentinel/sentinel_db_YYYYMMDD.sql.gz | mysql -u root -p sentinel_db
```

### Production Configuration Checklist

```
Environment Variables:
[ ] DEBUG=False
[ ] JWT_SECRET_KEY (long random string)
[ ] DATABASE_URL (production database)
[ ] CORS_ORIGINS (production domain)
[ ] MAX_UPLOAD_SIZE configured

Security:
[ ] HTTPS enabled
[ ] SSL certificate valid
[ ] Firewall configured
[ ] Fail2ban enabled
[ ] Security headers set
[ ] Rate limiting enabled

Performance:
[ ] Gunicorn workers configured
[ ] Database indexes created
[ ] Nginx caching enabled
[ ] CDN configured (if needed)

Monitoring:
[ ] Uptime monitoring active
[ ] Error tracking configured
[ ] Log aggregation setup
[ ] Alerts configured

Backup:
[ ] Database backup automated
[ ] PCAP backup scheduled
[ ] Backup restoration tested

Documentation:
[ ] Production credentials documented (secure location)
[ ] Deployment runbook created
[ ] Incident response plan ready
```

---

## ❓ FAQ

### General Questions

**Q: What is Sentinel?**
A: Sentinel is a comprehensive security monitoring platform that provides real-time threat analysis, alert management, and packet capture analysis for network security professionals.

**Q: Who should use Sentinel?**
A: Security Operations Center (SOC) analysts, network administrators, security researchers, and IT managers responsible for network security monitoring.

**Q: What are the system requirements?**
A: 
- OS: Windows 10/11 (64-bit) or Linux (Ubuntu 20.04+)
- RAM: 8GB minimum, 16GB recommended
- Storage: 10GB+ free space
- Network: Stable internet connection

**Q: Is Sentinel free?**
A: Yes, Sentinel is an open-source project developed as part of CSIT321 Final Year Project at SIM.

### Installation Questions

**Q: How long does installation take?**
A: First-time setup takes approximately 30-45 minutes, including downloading dependencies and configuring services.

**Q: Can I install on macOS?**
A: While primarily developed for Windows, Sentinel should work on macOS with minor adjustments. Linux is fully supported.

**Q: Do I need administrator privileges?**
A: Yes, administrator access is required for installing dependencies and running certain services like Suricata.

**Q: What if I don't have MySQL installed?**
A: Follow the MySQL installation guide in Step 1 of the setup process. MySQL 8.0+ is required.

### Usage Questions

**Q: How do I upload alert files?**
A: Click "Upload Alert File" button on the dashboard, select a JSON file from the `frontend/resources/` folder, and the alerts will be automatically processed and displayed.

**Q: What PCAP file formats are supported?**
A: Sentinel supports `.pcap`, `.pcapng`, and `.cap` file formats, with a maximum size of 2GB per file.

**Q: How does packet-alert matching work?**
A: The system matches packets to alerts based on IP addresses (source and destination), ports, protocol, and timestamp (within a ±5 second window). Confidence scores indicate match quality.

**Q: Can I customize the dashboard?**
A: Yes, you can rearrange widgets, add/remove components, and save custom layouts for different use cases.

**Q: How do I change default passwords?**
A: Login with default credentials, go to user profile settings, and update your password. This should be done immediately after first login.

### Technical Questions

**Q: Which IDS systems are supported?**
A: Sentinel natively supports Suricata IDS (JSON output). Snort requires additional configuration to output JSON format. Other IDS systems can be integrated with custom parsers.

**Q: Can I use Sentinel with existing IDS deployments?**
A: Yes, Sentinel can ingest logs from existing Suricata or Snort deployments. Point the agent to your IDS log directory.

**Q: What database does Sentinel use?**
A: MySQL 8.0+ with UTF-8 character encoding for proper internationalization support.

**Q: How is real-time alerting implemented?**
A: Through WebSocket connections for instant updates and a Python agent that monitors IDS logs and pushes alerts to the backend API.

**Q: What happens to uploaded PCAP files?**
A: PCAP files are stored securely in `backend/app/uploads/pcaps/` directory, isolated per user. First 10KB of each matched packet is stored in the database for quick access.

### Troubleshooting Questions

**Q: Backend won't start - "Port 5000 already in use"**
A: Another application is using port 5000. Find and kill the process with `netstat -ano | findstr :5000` and `taskkill /PID <PID> /F`, or change the backend port in `config.py`.

**Q: Frontend shows "Cannot connect to API"**
A: Ensure the backend is running (`python run.py`), verify CORS configuration includes `http://localhost:5173`, and check that `.env.development` has correct API URL.

**Q: "MySQL service not running" error**
A: Open Services Manager (`services.msc`), find "MySQL80", and start the service.

**Q: PCAP upload fails with "No matches found"**
A: Verify that alerts exist with matching IP addresses and timestamps within the configured time window (default ±5 seconds).

**Q: Virtual environment activation fails**
A: Change PowerShell execution policy with `Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser` and try again.

### Performance Questions

**Q: How many alerts can Sentinel handle?**
A: Sentinel can handle millions of alerts. Performance depends on hardware and configuration. Database indexing optimizes query performance.

**Q: What's the maximum PCAP file size?**
A: Default maximum is 2GB per file, configurable in backend settings. Large files can be split using Wireshark's `editcap` tool.

**Q: How long does PCAP processing take?**
A: Processing time varies by file size and packet count. Approximately 5,000-10,000 packets per second on typical hardware.

**Q: Can Sentinel run on low-end hardware?**
A: Minimum 8GB RAM is required. Performance will be limited on lower-spec machines, especially for large PCAP files.

### Security Questions

**Q: How are passwords stored?**
A: Passwords are hashed using bcrypt with 12 salt rounds. Plain-text passwords are never stored.

**Q: Is data encrypted in transit?**
A: Yes, in production deployment with HTTPS/TLS. Local development uses HTTP.

**Q: Who can access uploaded PCAP files?**
A: Only the user who uploaded the file and administrators can access PCAP files. Files are isolated by user_id.

**Q: What about compliance (GDPR, etc.)?**
A: Sentinel includes user data deletion and export capabilities. Organizations should implement additional controls based on their specific compliance requirements.

### Deployment Questions

**Q: Can Sentinel be deployed to production?**
A: Yes, see the Production Deployment section for detailed instructions on VPS, Docker, and cloud deployments.

**Q: What's the difference between ngrok and production deployment?**
A: ngrok is for local development/testing only (temporary URLs, bandwidth limits). Production requires a permanent server with your own domain.

**Q: Do I need Suricata for production?**
A: Only if you want live network monitoring. You can use Sentinel just for alert analysis and PCAP investigation without Suricata.

**Q: How do I scale Sentinel?**
A: Horizontal scaling with multiple backend instances behind a load balancer, database replication, and CDN for frontend assets.

---

## 🤝 Contributing

Sentinel is an open-source project and we welcome contributions from the community!

### How to Contribute

**1. Report Bugs**
- Use GitHub Issues to report bugs
- Include detailed steps to reproduce
- Provide error logs and screenshots
- Specify your environment (OS, versions, etc.)

**2. Suggest Features**
- Open a feature request on GitHub Issues
- Describe the use case and benefits
- Provide examples or mockups if possible

**3. Submit Code**

**Fork and Clone:**
```bash
# Fork repository on GitHub
# Clone your fork
git clone https://github.com/YOUR_USERNAME/CSIT321-FYP-25-S3-07-Project-Sentinel.git
cd CSIT321-FYP-25-S3-07-Project-Sentinel

# Add upstream remote
git remote add upstream https://github.com/Roh00t/CSIT321-FYP-25-S3-07-Project-Sentinel.git
```

**Create Feature Branch:**
```bash
git checkout -b feature/your-feature-name
```

**Make Changes:**
- Write clean, commented code
- Follow existing code style
- Add tests for new features
- Update documentation

**Commit and Push:**
```bash
git add .
git commit -m "Add feature: your feature description"
git push origin feature/your-feature-name
```

**Submit Pull Request:**
- Go to GitHub and create a Pull Request
- Describe your changes clearly
- Reference any related issues
- Wait for code review

### Development Guidelines

**Code Style:**
- **Python**: Follow PEP 8
- **TypeScript**: Follow ESLint configuration
- **Naming**: Use descriptive variable names
- **Comments**: Document complex logic

**Testing:**
```bash
# Backend tests
cd backend
pytest

# Frontend tests
cd frontend
npm test

# All tests must pass before PR merge
```

**Documentation:**
- Update README for new features
- Add docstrings to Python functions
- Comment complex TypeScript logic
- Update API documentation

### Project Roadmap

**Planned Features:**
- AI-powered threat detection
- Advanced packet inspection
- Custom rule creation interface
- Multi-language support
- Mobile application
- Advanced reporting

---

## 📞 Support

### Getting Help

**Documentation:**
- Read this README thoroughly
- Check the Troubleshooting section
- Review code comments

**Community Support:**
- GitHub Discussions (coming soon)
- Issue tracker for bugs and features

**Contact:**
- Project Team: [Contact via GitHub]
- Course Instructor: CSIT321 Faculty
- Industry Advisor: Min Han

### Reporting Issues

**Bug Reports:**
```
Title: [Component] Brief description

Environment:
- OS: Windows 11
- Python: 3.10.11
- Node.js: 18.17.1
- MySQL: 8.0.33

Steps to Reproduce:
1. Navigate to...
2. Click on...
3. Error occurs...

Expected Behavior:
What should happen

Actual Behavior:
What actually happens

Error Logs:
[Paste relevant logs]

Screenshots:
[Attach if applicable]
```

**Feature Requests:**
```
Title: [Feature] Brief description

Problem:

```

## License

This project is part of CSIT321 Final Year Project at SIM.

## Contributors

**Team S3-07**

- Project Sentinel Development Team

---

## Acknowledgments

Special thanks to:

- Min Han (Supervisor) for security analyst insights
- Course instructors for guidance
- All team members for their contributions

---

*Last Updated: Today*