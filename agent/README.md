# Sentinel Agent - Cross-Platform Installation Guide

Desktop application for forwarding Suricata/IDS alerts to the Sentinel backend.

---

## Windows

### Prerequisites
- Python 3.7+ (if building from source)
- If using the .exe, no Python required

### Build from Source
1. Open Command Prompt and navigate to the `agent` folder:
	```cmd
	cd path\to\agent
	build_windows.bat
	```
2. The executable will be in `dist/SentinelAgent.exe`

### Run
- Double-click `SentinelAgent.exe` in the `dist` folder
- Or run from source:
	```cmd
	python main.py
	```

---

## Linux

### Prerequisites
- Python 3.7+ (recommended: Python 3.11)
- tkinter GUI library:
	```bash
	sudo apt-get update
	sudo apt-get install python3-tk python3-venv
	```

### Build from Source
1. Open Terminal and navigate to the `agent` folder:
	```bash
	cd ~/agent
	python3 -m venv venv
	source venv/bin/activate
	pip install --upgrade pip
	pip install -r requirements.txt
	chmod +x build_linux.sh
	./build_linux.sh
	```
2. The executable will be in `dist/SentinelAgent`

### Run
- Run the executable:
	```bash
	chmod +x dist/SentinelAgent
	./dist/SentinelAgent
	```
- Or run from source:
	```bash
	python3 main.py
	```

---

## macOS

### Prerequisites
- Python 3.7+ (recommended: Python 3.11)
- tkinter GUI library (usually included)

### Build from Source
1. Open Terminal and navigate to the `agent` folder:
	```bash
	cd ~/agent
	python3 -m venv venv
	source venv/bin/activate
	pip install --upgrade pip
	pip install -r requirements.txt
	chmod +x build_macos.sh
	./build_macos.sh
	```
2. The executable will be in `dist/SentinelAgent`

### Run
- Run the executable:
	```bash
	chmod +x dist/SentinelAgent
	./dist/SentinelAgent
	```
- Or run from source:
	```bash
	python3 main.py
	```

---

## Usage
1. Start the agent
2. Click "Add Source" and select your Snort3 output file (can be `.json` or `.txt`)
3. Enter your API key
4. Click "Start Selected" or "Start All" to begin forwarding alerts

**Note:** The agent accepts files with either `.json` or `.txt` extension, but each line must be valid JSON (Snort3 `alert_json` output format). If your file is not in JSON lines format, the agent will skip those lines and log a JSON error.

---


## Troubleshooting
- **tkinter errors:** Install with `sudo apt-get install python3-tk` (Linux)
- **venv errors:** Install with `sudo apt-get install python3-venv` (Linux)
- **Build errors:** Ensure you are using a virtual environment and have all dependencies installed
- **Connection errors:** Check your backend URL and internet connection
- **File format errors:** The agent requires each line in the selected file to be valid JSON. If you see repeated JSON errors in the log, check your Snort3 output format.

### Linux: Still getting `No module named 'tkinter'`?
If you see this error even after installing `python3-tk`, delete and recreate your virtual environment:
```bash
rm -rf venv
python3 -m venv venv
source venv/bin/activate
pip install --upgrade pip
pip install -r requirements.txt
```
Then rebuild and run the executable as usual.

---

## Notes
- You must build on the target platform (Windows for .exe, Linux for ELF, macOS for .app)
- PyInstaller does not support cross-compiling
- Distribute the built executable to users for easy installation
- The agent accepts `.json` and `.txt` files, but the contents must be one JSON object per line (Snort3 `alert_json` output format).

---

## Support
For issues or questions, open an issue on GitHub or contact the project maintainer.
# Sentinel Agent

Desktop application for forwarding Suricata/IDS alerts to the Sentinel platform.

## Features
- Multi-source monitoring (monitor multiple eve.json files)
- Real-time alert forwarding via WebSocket
- Persistent configuration
- Cross-platform support (Windows, Linux, macOS)

## Installation

### Windows
1. Download `SentinelAgent.exe` from releases
2. Run the executable (no installation required)

**OR build from source:**
```cmd
cd agent
build_windows.bat
```

### Linux
**Prerequisites:**
```bash
# Ubuntu/Debian
sudo apt-get install python3 python3-pip python3-tk

# Fedora
sudo dnf install python3 python3-pip python3-tkinter

# Arch
sudo pacman -S python python-pip tk
```

**Run or Build:**
```bash
# Option 1: Run directly
cd agent
python3 -m venv venv
source venv/bin/activate
pip install --upgrade pip
pip install -r requirements.txt
python3 main.py

# Option 2: Build executable
cd agent
chmod +x build_linux.sh
./build_linux.sh
./dist/SentinelAgent
```

### macOS
```bash
cd agent
chmod +x build_macos.sh
./build_macos.sh
./dist/SentinelAgent
```

## Usage

1. **Connect:** The agent automatically connects to the Sentinel backend
2. **Add Source:** Click "Add Source" and select your `eve.json` file
3. **Enter API Key:** Provide your API key from the Sentinel dashboard
4. **Start Forwarding:** Click "Start Selected" or "Start All"

## Building Executables

### For Windows (on Windows):
```cmd
cd agent
build_windows.bat
```
Output: `dist/SentinelAgent.exe`

### For Linux (on Linux):
```bash
cd agent
chmod +x build_linux.sh
./build_linux.sh
chmod +x dist/SentinelAgent
```
Output: `dist/SentinelAgent`

### For macOS (on macOS):
```bash
cd agent
chmod +x build_macos.sh
./build_macos.sh
```
Output: `dist/SentinelAgent`

**Important:** You must build on the target platform:
- Build Windows .exe on Windows
- Build Linux binary on Linux
- Build macOS app on macOS

Cross-compilation is not supported by PyInstaller.

## Distribution

After building:
1. Test the executable on the target platform
2. Upload to GitHub Releases or your distribution method
3. Provide download links for each platform

## Troubleshooting

### Linux: "ImportError: No module named _tkinter"
Install tkinter:
```bash
sudo apt-get install python3-tk  # Ubuntu/Debian
sudo dnf install python3-tkinter  # Fedora
```

### "Connection failed"
- Check your internet connection
- Verify the backend URL in `main.py` is correct
- Check if the backend is running

### "File not found" errors
Make sure the `eve.json` file path is correct and accessible

## Development

### Requirements
```bash
pip install -r requirements.txt
```

### Run from source
```bash
python main.py  # Windows
python3 main.py  # Linux/macOS
```

## Support
For issues or questions, please open an issue on GitHub.
