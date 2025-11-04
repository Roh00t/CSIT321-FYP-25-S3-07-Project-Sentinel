#!/bin/bash
echo "Building Sentinel Agent for Linux..."
echo ""

# Install system dependencies
echo "Installing python3-tk and python3-venv (may require sudo)..."
sudo apt-get update
sudo apt-get install -y python3-tk python3-venv

# Create and activate virtual environment
if [ -d "venv" ]; then
	echo "Removing old venv..."
	rm -rf venv
fi
python3 -m venv venv
source venv/bin/activate

# Upgrade pip and install dependencies
if ! pip install --upgrade pip; then
	echo "ERROR: pip upgrade failed. Aborting build."
	exit 1
fi
if ! pip install -r requirements.txt; then
	echo "ERROR: pip install failed. Aborting build."
	exit 1
fi

# Build executable
if pyinstaller --onefile --name "SentinelAgent" main.py; then
	echo ""
	echo "Build complete! Executable is in dist/SentinelAgent"
	echo "Make it executable with: chmod +x dist/SentinelAgent"
else
	echo "ERROR: Build failed. Check error messages above."
	exit 1
fi
