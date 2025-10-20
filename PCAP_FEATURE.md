# PCAP Upload and Alert Matching Feature

## Overview
This feature allows users to upload PCAP (Packet Capture) files and automatically match packet data to existing alerts based on IP addresses, ports, and timestamps.

## How It Works

### Backend Implementation

1. **New Models** (`app/models/pcap.py`):
   - `PcapFile`: Stores uploaded PCAP file metadata
   - `PcapPacket`: Individual packet information extracted from PCAP
   - `AlertPcapMatch`: Links alerts to matched packets with confidence scores

2. **New Routes** (`app/routes/pcap.py`):
   - `POST /api/pcaps/upload`: Upload and parse PCAP files
   - `GET /api/pcaps`: List all uploaded PCAPs for current user
   - `DELETE /api/pcaps/<id>`: Delete a PCAP file
   - `GET /api/alerts/<alert_id>/packets`: Get all packets matched to an alert
   - `GET /api/pcaps/<pcap_id>/packets`: Get all packets from a PCAP

3. **Matching Algorithm**:
   - Compares packet data against alerts using:
     - Source IP + Destination IP (required)
     - Source Port + Destination Port (if available)
     - Timestamp within configurable window (default: ±5 seconds)
   - Calculates confidence score (0-1) based on:
     - Protocol match
     - Time proximity
     - Port match

### Frontend Implementation

1. **New Upload Button**:
   - Purple "📦 Upload PCAP" button next to "Upload Alert File"
   - Accepts `.pcap`, `.pcapng`, `.cap` files

2. **Enhanced Alert Inspection**:
   - When inspecting an alert (double-click), matched PCAP packets are fetched
   - Displays table showing:
     - PCAP filename
     - Packet number
     - Timestamp
     - Source → Destination (with ports)
     - Protocol
     - Packet length
     - Match confidence (color-coded)

## Installation

### Backend Requirements

1. Install scapy library:
   ```bash
   pip install scapy==2.5.0
   ```
   Or install all requirements:
   ```bash
   cd backend
   pip install -r requirements.txt
   ```

2. Create database tables:
   The new tables will be created automatically when you run the Flask app:
   ```bash
   python run.py
   ```

### Frontend
No additional dependencies needed - uses existing axios for API calls.

## Usage

### Uploading a PCAP File

1. Click the "📦 Upload PCAP" button
2. Select a PCAP file from your system
3. Wait for processing (may take a few moments for large files)
4. Toast notification will show:
   - Number of packets parsed
   - Number of matches found with existing alerts

### Viewing Matched Packets

1. Navigate to the Alerts page
2. Double-click any alert to inspect it
3. If the alert has matching PCAP packets, you'll see:
   - "📦 Matched PCAP Packets" section at the bottom
   - Table with all matched packets
   - Confidence scores (green = high, yellow = medium, gray = low)

## Technical Details

### Matching Criteria

**Required Matches:**
- Source IP must match
- Destination IP must match

**Optional Matches (improve confidence):**
- Source port matches
- Destination port matches
- Protocol matches (TCP/UDP/ICMP)
- Timestamp within ±5 seconds

### Confidence Scoring

```
Base confidence: 1.0

Adjustments:
- Protocol mismatch: × 0.8
- Time difference > 1 second: × (1 - time_diff/window * 0.2)

Final confidence: product of all adjustments
```

### Storage

- **PCAP Files**: Stored in `backend/app/uploads/pcaps/`
- **Packet Data**: First 10KB of each packet stored in database
- **Metadata**: All packet metadata (IPs, ports, timestamps) stored

### Performance Considerations

- Large PCAP files (>1000 packets) may take time to process
- Packet data is limited to 10KB per packet to avoid database bloat
- Matching queries are optimized with timestamp and IP indexes

## Database Schema

```sql
-- PCAP Files
CREATE TABLE pcap_files (
    id INT PRIMARY KEY AUTO_INCREMENT,
    filename VARCHAR(256),
    user_id INT,
    upload_time DATETIME,
    packet_count INT,
    file_size INT,
    file_path VARCHAR(512)
);

-- PCAP Packets
CREATE TABLE pcap_packets (
    id INT PRIMARY KEY AUTO_INCREMENT,
    pcap_file_id INT,
    packet_number INT,
    timestamp DATETIME,
    src_ip VARCHAR(64),
    dst_ip VARCHAR(64),
    src_port INT,
    dst_port INT,
    protocol VARCHAR(16),
    packet_length INT,
    packet_data LONGBLOB
);

-- Alert-PCAP Matches
CREATE TABLE alert_pcap_matches (
    id INT PRIMARY KEY AUTO_INCREMENT,
    alert_id INT,
    pcap_packet_id INT,
    match_confidence FLOAT,
    matched_at DATETIME
);
```

## API Examples

### Upload PCAP
```bash
curl -X POST http://localhost:5000/api/pcaps/upload \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -F "file=@capture.pcap" \
  -F "time_window=5"
```

### Get Alert Packets
```bash
curl http://localhost:5000/api/alerts/123/packets \
  -H "Authorization: Bearer YOUR_TOKEN"
```

## Future Enhancements

Potential improvements:
- [ ] Hex dump viewer for packet data
- [ ] Download matched packets as new PCAP
- [ ] Filter packets by protocol/IP
- [ ] Packet reassembly for TCP streams
- [ ] Deep packet inspection (payload analysis)
- [ ] PCAP file management dashboard
- [ ] Bulk PCAP upload
- [ ] Configurable matching parameters (time window, confidence threshold)

## Troubleshooting

### "scapy not installed" Error
Run: `pip install scapy`

### No Matches Found
- Ensure alert timestamps are close to packet timestamps
- Check that IPs match exactly
- Try increasing time window parameter

### Large File Upload Fails
- Check Flask max upload size configuration
- Consider splitting large PCAPs into smaller files
- Increase timeout settings

## Security Notes

- PCAP files are stored per user (isolated by user_id)
- File paths use secure_filename() to prevent directory traversal
- JWT authentication required for all PCAP operations
- Files are stored outside web root
