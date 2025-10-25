# CSIT321-FYP-25-S3-07-PROJECT-SENTINEL

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

## Table of Contents

- [Overview](#overview)
- [Features](#features)
- [Complete Setup Guide](#complete-setup-guide)
  - [Prerequisites](#prerequisites)
  - [Step 1: Install Required Software](#step-1-install-required-software)
  - [Step 2: Clone the Repository](#step-2-clone-the-repository)
  - [Step 3: MySQL Database Setup](#step-3-mysql-database-setup)
  - [Step 4: Backend Setup](#step-4-backend-setup)
  - [Step 5: Frontend Setup](#step-5-frontend-setup)
  - [Step 6: Running the Application](#step-6-running-the-application)
  - [Step 7: Access the Application](#step-7-access-the-application)
- [Using the Application](#using-the-application)
- [IDS Integration](#ids-integration)
- [PCAP Upload and Alert Matching](#pcap-upload-and-alert-matching)
- [Database Seeding](#database-seeding)
- [Subsequent Runs](#subsequent-runs)
- [Testing](#testing)
- [Troubleshooting](#troubleshooting)
- [Project Structure](#project-structure)
- [Security Notes](#security-notes)
- [Future Enhancements](#future-enhancements)

---

## Overview

Sentinel is a comprehensive security monitoring platform designed for seamless deployment and real-time threat analysis. The system consists of three main components:

- **Frontend**: React + TypeScript + Vite application for visualization
- **Backend**: Flask REST API with MySQL database
- **Agent**: Python-based monitoring agent with live alert streaming

---

## Features

- 🔧 **Full-stack setup guidance:** Simplifies the initialization of backend, frontend, and database components for efficient system deployment.

- 📡 **Real-time alert streaming:** Enables instant monitoring and notification of security events through WebSocket integration.

- 📊 **Advanced data visualization:** Supports dynamic, time-based charts and detailed network insights using Chart.js and Leaflet maps.

- 🔍 **Automated packet-alert matching:** Upload PCAP files and automatically correlate network packets with existing alerts for forensic investigations.

- 🔒 **Secure data management:** Organizes log sources, API keys, and user data with robust access controls and JWT authentication.

- 🌐 **Modular architecture:** Provides flexible API endpoints and UI components for customization and scalability.

- 🎯 **Live Agent Monitoring:** Real-time agent status tracking and alert generation.

- 📋 **Dashboard Customization:** Personalize your security dashboard with customizable widgets and layouts.

---

## Complete Setup Guide

### Prerequisites

Before you begin, ensure you have the following installed:

- **Python 3.8+** - [Download here](https://www.python.org/downloads/)
- **Node.js 16+** and **npm** - [Download here](https://nodejs.org/)
- **MySQL 8.0+** - [Download here](https://dev.mysql.com/downloads/installer/)
- **Git** - [Download here](https://git-scm.com/downloads/)

**Verify installations:**

```bash
python --version
node --version
npm --version
mysql --version
git --version
```

---

### Step 1: Install Required Software

#### Windows:

1. **Python 3.8+**
   - Download from [python.org](https://www.python.org/downloads/)
   - ✅ Check "Add Python to PATH" during installation
   - Verify: `python --version`

2. **Node.js and npm**
   - Download from [nodejs.org](https://nodejs.org/)
   - Install LTS version
   - Verify: `node --version` and `npm --version`

3. **MySQL 8.0+**
   - Download MySQL Installer from [mysql.com](https://dev.mysql.com/downloads/installer/)
   - Choose "Developer Default" setup
   - During setup:
     - Use **port 3306** (default)
     - Set a **root password** (remember this!)
     - Complete installation
   - Verify: Open "MySQL 8.0 Command Line Client" from Start Menu

4. **Git**
   - Download from [git-scm.com](https://git-scm.com/downloads)
   - Install with default settings
   - Verify: `git --version`

---

### Step 2: Clone the Repository

Open **PowerShell** or **Command Prompt**:

```bash
# Navigate to your desired directory
cd C:\Users\YourUsername\Documents

# Clone the repository
git clone https://github.com/Roh00t/CSIT321-FYP-25-S3-07-Project-Sentinel

# Navigate into the project
cd CSIT321-FYP-25-S3-07-Project-Sentinel
```

---

### Step 3: MySQL Database Setup

#### Option A: Using MySQL Command Line Client

1. Open **MySQL 8.0 Command Line Client** from Start Menu
2. Enter your root password when prompted
3. Copy and paste each command **one at a time**:

```sql
CREATE DATABASE sentinel_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

Press Enter. You should see: `Query OK, 1 row affected`

```sql
CREATE USER 'sentinel_user'@'localhost' IDENTIFIED BY 'sentinel_fyp';
```

Press Enter. You should see: `Query OK, 0 rows affected`

```sql
GRANT ALL PRIVILEGES ON sentinel_db.* TO 'sentinel_user'@'localhost';
```

Press Enter. You should see: `Query OK, 0 rows affected`

```sql
FLUSH PRIVILEGES;
```

Press Enter. You should see: `Query OK, 0 rows affected`

```sql
EXIT;
```

#### Option B: Using MySQL Workbench

1. Open MySQL Workbench
2. Connect to your local MySQL instance
3. Open a new SQL tab
4. Copy and paste all commands at once:

```sql
CREATE DATABASE sentinel_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER 'sentinel_user'@'localhost' IDENTIFIED BY 'sentinel_fyp';
GRANT ALL PRIVILEGES ON sentinel_db.* TO 'sentinel_user'@'localhost';
FLUSH PRIVILEGES;
```

5. Click the lightning bolt icon to execute

---

### Step 4: Backend Setup

Open **PowerShell** (right-click and "Run as Administrator" recommended):

```bash
# Navigate to backend directory
cd CSIT321-FYP-25-S3-07-Project-Sentinel/backend

# Create virtual environment
python -m venv venv

# Activate virtual environment
.\venv\Scripts\Activate.ps1
```

**If you get an execution policy error:**

```powershell
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
```

Then try activating again.

**You should see `(venv)` at the start of your prompt.**

```bash
# Install all dependencies
pip install -r requirements.txt

# Seed the database with initial data
# This creates tables and adds sample users, alerts, and configurations
python seed.py
```

**Expected output from seeding:**

```
Database seeded successfully!
- Created X users
- Created Y alerts
- Created Z log sources
Default credentials:
  Username: admin / Password: admin123
  Username: analyst / Password: analyst123
```

---

### Step 5: Frontend Setup

Open a **new PowerShell window** (keep the backend one open):

```bash
# Navigate to frontend directory
cd CSIT321-FYP-25-S3-07-Project-Sentinel/frontend

# Install dependencies (this may take a few minutes)
npm install
```

**Wait for installation to complete.** You should see:

```
added XXX packages in XXs
```

---

### Step 6: Running the Application

You need **3 terminal windows** open:

#### Terminal 1: Backend Server

```bash
cd CSIT321-FYP-25-S3-07-Project-Sentinel/backend
.\venv\Scripts\Activate.ps1
python run.py
```

**You should see:**

```
 * Running on http://127.0.0.1:5000
 * Running on http://localhost:5000
```

**✅ Backend is ready!**

#### Terminal 2: Frontend Server

```bash
cd CSIT321-FYP-25-S3-07-Project-Sentinel/frontend
npm run dev
```

**You should see:**

```
  VITE vX.X.X  ready in XXX ms

  ➜  Local:   http://localhost:5173/
  ➜  Network: use --host to expose
```

**✅ Frontend is ready!**

#### Terminal 3: Agent UI (Optional - for live monitoring)

```bash
cd CSIT321-FYP-25-S3-07-Project-Sentinel/backend
.\venv\Scripts\Activate.ps1
python agentUI.py
```

**This terminal will show real-time agent activity.**

---

### Step 7: Access the Application

1. Open your web browser
2. Navigate to: **http://localhost:5173**
3. You should see the Sentinel login page

**Default Login Credentials:**

- **Admin Account:**
  - Username: `admin`
  - Password: `admin123`

- **Analyst Account:**
  - Username: `analyst`
  - Password: `analyst123`

---

## Using the Application

### First Steps After Login

1. **Dashboard Overview**
   - View real-time alert statistics
   - See geographic distribution of threats
   - Monitor system health

2. **Upload Alert Files**
   - Click "Upload Alert File" button
   - Select JSON alert files from `frontend/resources/` folder
   - Alerts will be processed and displayed

3. **Upload PCAP Files**
   - Click "📦 Upload PCAP" button
   - Select `.pcap`, `.pcapng`, or `.cap` files
   - System will automatically match packets to alerts

4. **Inspect Alerts**
   - Navigate to Alerts page
   - Double-click any alert to view detailed information
   - See matched PCAP packets (if available)

5. **Customize Dashboard**
   - Click on dashboard customization options
   - Arrange widgets to your preference
   - Save your layout

---

## IDS Integration

### Suricata Configuration

Sentinel works with Suricata IDS out of the box as it outputs JSON by default.

**Configuration file included:** `frontend/resources/suricata.yaml`

To use with Suricata:

1. Copy the config file to your Suricata installation
2. Ensure EVE JSON output is enabled
3. Point the agent to the Suricata log directory

### Snort Configuration

For Snort integration, additional setup is required:

**Configuration file included:** `frontend/resources/snort.conf`

To use with Snort:

1. Copy the config file to your Snort installation
2. Enable JSON output plugin
3. Configure alert output format
4. Point the agent to the Snort log directory

**Note:** Both IDS configuration files are located in `frontend/resources/` for easy access.

---

## PCAP Upload and Alert Matching

### Overview

This feature allows users to upload PCAP (Packet Capture) files and automatically match packet data to existing alerts based on IP addresses, ports, and timestamps.

### How It Works

**Matching Criteria:**

- Source IP must match (required)
- Destination IP must match (required)
- Source/Destination ports (optional, improves confidence)
- Protocol (TCP/UDP/ICMP) (optional, improves confidence)
- Timestamp within ±5 seconds (configurable)

**Confidence Scoring:**

```
Base confidence: 1.0

Adjustments:
- Protocol mismatch: × 0.8
- Time difference > 1 second: × (1 - time_diff/window × 0.2)

Final confidence: product of all adjustments
```

### Using the Feature

1. **Upload a PCAP File:**
   - Click the "📦 Upload PCAP" button
   - Select a `.pcap`, `.pcapng`, or `.cap` file
   - Wait for processing (may take time for large files)
   - Toast notification shows:
     - Number of packets parsed
     - Number of matches found

2. **View Matched Packets:**
   - Navigate to Alerts page
   - Double-click any alert to inspect
   - See "📦 Matched PCAP Packets" section
   - Review table with:
     - PCAP filename
     - Packet number
     - Timestamp
     - Source → Destination (with ports)
     - Protocol
     - Packet length
     - Match confidence (color-coded)

### API Endpoints

**Upload PCAP:**

```http
POST /api/pcaps/upload
```

**List all PCAPs:**

```http
GET /api/pcaps
```

**Delete PCAP:**

```http
DELETE /api/pcaps/<id>
```

**Get packets for specific alert:**

```http
GET /api/alerts/<alert_id>/packets
```

**Get all packets from a PCAP:**

```http
GET /api/pcaps/<pcap_id>/packets
```

### Storage

- **PCAP Files:** Stored in `backend/app/uploads/pcaps/`
- **Packet Data:** First 10KB of each packet stored in database
- **Metadata:** All packet metadata (IPs, ports, timestamps) indexed for fast queries

---

## Database Seeding

The `seed.py` script populates your database with initial data for testing and development.

### What Gets Seeded:

1. **User Accounts:**
   - Admin user (full privileges)
   - Analyst user (read/write privileges)
   - Viewer user (read-only)

2. **Sample Alerts:**
   - Various alert types (SSH brute force, port scans, malware, etc.)
   - Different severity levels (Critical, High, Medium, Low)
   - Realistic timestamps and metadata

3. **Log Sources:**
   - Sample IDS configurations
   - API key examples
   - Integration endpoints

4. **System Configuration:**
   - Default thresholds
   - Notification settings
   - Dashboard preferences

### Re-seeding the Database:

If you need to reset your database:

```bash
cd backend
.\venv\Scripts\Activate.ps1

# This will drop existing data and recreate everything
python seed.py
```

**⚠️ Warning:** This will delete all existing data!

---

## Subsequent Runs

After initial setup, you only need 2-3 terminals:

**Terminal 1 - Backend:**

```bash
cd backend
.\venv\Scripts\Activate.ps1
python run.py
```

**Terminal 2 - Frontend:**

```bash
cd frontend
npm run dev
```

**Terminal 3 - Agent (optional):**

```bash
cd backend
.\venv\Scripts\Activate.ps1
python agentUI.py
```

Then open **http://localhost:5173** in your browser!

---

## Testing

### Backend Tests

```bash
cd backend
.\venv\Scripts\Activate.ps1
pytest
```

### Frontend Tests

```bash
cd frontend
npm test
```

---

## Troubleshooting

### Common Issues

#### "MySQL service not running"

1. Press `Windows + R`
2. Type `services.msc`
3. Find "MySQL80"
4. Right-click → Start

#### "Cannot activate virtual environment"

```powershell
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
```

#### "pip install fails"

```bash
python -m pip install --upgrade pip
pip install -r requirements.txt
```

#### "npm install fails"

```bash
npm cache clean --force
npm install
```

#### "Port already in use"

**Backend (port 5000):**

```bash
# Find process
netstat -ano | findstr :5000

# Kill process (replace <PID> with actual PID)
taskkill /PID <PID> /F
```

**Frontend (port 5173):**

```bash
# Find process
netstat -ano | findstr :5173

# Kill process (replace <PID> with actual PID)
taskkill /PID <PID> /F
```

#### "Database connection error"

Check `backend/config.py`:

```python
SQLALCHEMY_DATABASE_URI = 'mysql+pymysql://sentinel_user:sentinel_fyp@localhost:3306/sentinel_db'
```

Verify:

- MySQL is running
- Database `sentinel_db` exists
- User `sentinel_user` has correct password
- Port 3306 is correct

#### "scapy not installed" (for PCAP features)

```bash
pip install scapy==2.5.0
```

#### "No matches found" (PCAP)

- Ensure alert timestamps are close to packet timestamps
- Check that IPs match exactly
- Try increasing time window parameter

---

## Project Structure

```
CSIT321-FYP-25-S3-07-PROJECT-SENTINEL/
├── agent/                    # Monitoring agent
│   ├── main.py
│   ├── main.spec
│   └── requirements.txt
├── backend/                  # Flask API
│   ├── app/
│   │   ├── models/          # Database models
│   │   ├── routes/          # API endpoints
│   │   └── uploads/pcaps/   # PCAP storage
│   ├── instance/
│   ├── venv/                # Virtual environment (created during setup)
│   ├── config.py           # Configuration settings
│   ├── requirements.txt    # Python dependencies
│   ├── run.py              # Main entry point
│   ├── seed.py             # Database seeding script
│   └── agentUI.py          # Agent monitoring interface
├── frontend/                # React application
│   ├── node_modules/       # NPM packages (created during setup)
│   ├── public/
│   ├── src/
│   ├── resources/          # IDS configs and alert samples
│   │   ├── suricata.yaml   # Suricata configuration
│   │   ├── snort.conf      # Snort configuration
│   │   └── *.json          # Sample alert files
│   ├── package.json
│   ├── vite.config.ts
│   └── tsconfig.json
└── README.md               # This file
```

---

## Security Notes

- PCAP files are isolated per user (user_id)
- JWT authentication required for all API operations
- File paths use `secure_filename()` to prevent directory traversal
- Files stored outside web root
- Password hashing with bcrypt
- CORS configured for development
- Default credentials should be changed in production

---

## Future Enhancements

### Planned Features

- [ ] **AI-Powered Threat Detection**
  - Machine learning models for anomaly detection
  - Predictive analytics for attack patterns
  - Automated threat classification

- [ ] **Enhanced IDS Integration**
  - Real-time Suricata/Snort rule management
  - Custom rule creation interface
  - Automated signature updates

- [ ] **Advanced Notifications**
  - Configurable alert thresholds
  - Multi-channel notifications (email, SMS, Slack)
  - Escalation policies

- [ ] **PCAP Analysis**
  - Hex dump viewer for packet data
  - Download matched packets as new PCAP
  - Filter packets by protocol/IP
  - Packet reassembly for TCP streams
  - Deep packet inspection (payload analysis)

- [ ] **Dashboard Enhancements**
  - More customization options
  - Real-time threat intelligence feeds
  - Executive summary reports
  - Export capabilities (PDF, CSV)

- [ ] **Deployment**
  - Packaged EXE file for Windows
  - Linux support and testing
  - Docker containerization
  - Cloud deployment guides

---

## Support

For issues and questions:

- Check the [Troubleshooting](#troubleshooting) section
- Review project documentation
- Contact the development team

---

## License

This project is part of CSIT321 Final Year Project at SIM.

---

## Contributors

**Team S3-07**

- Project Sentinel Development Team

---

## Acknowledgments

Special thanks to:

- Min Han (Industry Advisor) for security analyst insights
- Course instructors for guidance
- All team members for their contributions

---

*Last Updated: October 2025*