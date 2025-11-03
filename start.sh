#!/bin/bash

# Install Python dependencies if not already installed
if ! command -v python3 &> /dev/null; then
    echo "Python3 not found!"
    exit 1
fi

# Start the application
node index.js
