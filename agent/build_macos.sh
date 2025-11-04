#!/bin/bash
echo "Building Sentinel Agent for macOS..."
echo ""

# Install dependencies
pip3 install -r requirements.txt

# Build executable
pyinstaller --onefile --windowed --name "SentinelAgent" main.py

echo ""
echo "Build complete! Application is in dist/SentinelAgent"
