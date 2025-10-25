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
- [Getting Started](#getting-started)
  - [Prerequisites](#prerequisites)
  - [MySQL Setup](#mysql-setup)
  - [Installation](#installation)
  - [Usage](#usage)
- [PCAP Upload and Alert Matching](#pcap-upload-and-alert-matching)
- [Testing](#testing)
- [Troubleshooting](#troubleshooting)

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

---

## Getting Started

### Prerequisites

This project requires the following dependencies:

- **Programming Language:** Python 3.8+
- **Package Managers:** npm (Node.js), pip
- **Database:** MySQL 8.0+ (default port 3306)
- **Additional Tools:** Git

### MySQL Setup

Open MySQL Command Line Client and execute the following commands:
```sql
-- Create your FYP database
CREATE DATABASE sentinel_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- Create a dedicated user (don't use root in code!)
CREATE USER 'sentinel_user'@'localhost' IDENTIFIED BY 'sentinel_fyp';

-- Give user full access to your database
GRANT ALL PRIVILEGES ON sentinel_db.* TO 'sentinel_user'@'localhost';

-- Refresh permissions
FLUSH PRIVILEGES;

-- Exit
EXIT;
```

**If MySQL doesn't start on Windows startup:**
1. Press `Windows + R`
2. Type `services.msc`
3. Find MySQL Service (MySQL80)
4. If it's not running, right-click and click "Start"

### Installation

#### First Time Setup

**Terminal 1 - Frontend:**
```bash
cd frontend
npm install
npm run dev
```

**Terminal 2 - Backend:**
```bash
cd backend
python -m venv venv

# Activate virtual environment (Windows PowerShell)
.\venv\Scripts\Activate.ps1

# Install dependencies
pip install -r requirements.txt

# Seed the database with initial data
python seed.py

# Run the backend with live monitoring support
python run.py
```

**Terminal 3 - Agent UI (Optional for live monitoring):**
```bash
cd backend
.\venv\Scripts\Activate.ps1
python agentUI.py
```

#### Subsequent Runs

**Terminal 1 - Frontend:**
```bash
cd frontend
npm run dev
```

**Terminal 2 - Backend:**
```bash
cd backend
.\venv\Scripts\Activate.ps1
python run.py
```

**Terminal 3 - Agent (if needed):**
```bash
cd backend
.\venv\Scripts\Activate.ps1
python agentUI.py
```

### Usage

1. **Access the application:**
   - Frontend: `http://localhost:5173` (default Vite port)
   - Backend API: `http://localhost:5000`

2. **Login/Register:**
   - Create an account or use seeded credentials

3. **Upload Alerts:**
   - Use the "Upload Alert File" button to import alert JSON files

4. **Upload PCAP Files:**
   - Click "📦 Upload PCAP" to analyze network captures

5. **View Dashboard:**
   - Monitor real-time alerts and system statistics
   - Visualize network traffic on interactive maps
   - Analyze threat patterns with dynamic charts

---

## PCAP Upload and Alert Matching

### Overview
This feature allows users to upload PCAP (Packet Capture) files and automatically match packet data to existing alerts based on IP addresses, ports, and timestamps.

### How It Works

**Matching Criteria:**
- Source IP must match
- Destination IP must match
- Optional: Source/Destination ports, Protocol (TCP/UDP/ICMP)
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
   - Wait for processing (large files may take time)
   - View toast notification showing parsed packets and matches

2. **View Matched Packets:**
   - Navigate to the Alerts page
   - Double-click any alert to inspect it
   - See "📦 Matched PCAP Packets" section at the bottom
   - Review table with:
     - PCAP filename
     - Packet number
     - Timestamp
     - Source → Destination (with ports)
     - Protocol
     - Packet length
     - Match confidence (color-coded: green=high, yellow=medium, gray=low)

### API Endpoints

**Upload PCAP:**
```bash
POST /api/pcaps/upload
```

**List PCAPs:**
```bash
GET /api/pcaps
```

**Delete PCAP:**
```bash
DELETE /api/pcaps/<id>
```

**Get Alert Packets:**
```bash
GET /api/alerts/<alert_id>/packets
```

**Get PCAP Packets:**
```bash
GET /api/pcaps/<pcap_id>/packets
```

### Storage
- **PCAP Files:** Stored in `backend/app/uploads/pcaps/`
- **Packet Data:** First 10KB of each packet stored in database
- **Metadata:** All packet metadata (IPs, ports, timestamps) indexed for fast queries

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

**"scapy not installed" Error:**
```bash
pip install scapy==2.5.0
```

**No PCAP Matches Found:**
- Ensure alert timestamps are close to packet timestamps
- Check that IPs match exactly
- Try increasing time window parameter in upload

**Large PCAP Upload Fails:**
- Check Flask max upload size configuration
- Consider splitting large PCAPs into smaller files
- Increase timeout settings in frontend

**Virtual Environment Issues (Windows):**
- If PowerShell execution policy blocks activation:
```powershell
  Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
```

**MySQL Connection Errors:**
- Verify MySQL service is running
- Check credentials in `backend/config.py`
- Ensure database `sentinel_db` exists

**Port Already in Use:**
- Backend: Change Flask port in `run.py`
- Frontend: Change Vite port in `vite.config.ts`

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
│   ├── venv/
│   ├── config.py
│   ├── requirements.txt
│   ├── run.py              # Main entry point
│   └── seed.py             # Database seeding
├── frontend/                # React application
│   ├── node_modules/
│   ├── public/
│   ├── src/
│   ├── resources/          # Alert JSON files
│   ├── package.json
│   ├── vite.config.ts
│   └── tsconfig.json
└── README.md
```

---

## Security Notes

- PCAP files are isolated per user (user_id)
- JWT authentication required for all API operations
- File paths use `secure_filename()` to prevent directory traversal
- Files stored outside web root
- Password hashing with bcrypt
- CORS configured for development

---

## Future Enhancements

- [ ] Hex dump viewer for packet data
- [ ] Download matched packets as new PCAP
- [ ] Filter packets by protocol/IP
- [ ] Packet reassembly for TCP streams
- [ ] Deep packet inspection (payload analysis)
- [ ] PCAP file management dashboard
- [ ] Bulk PCAP upload
- [ ] Configurable matching parameters UI
- [ ] Multi-tenant support
- [ ] Advanced threat intelligence integration

---

## Support

For issues and questions:
- Check the troubleshooting section above
- Review existing issues in the repository
- Create a new issue with detailed information

---

## License

This project is part of CSIT321 Final Year Project.

---

## Contributors

**Team S3-07**
- Project Sentinel Development Team

---

*Last Updated: October 2025*
