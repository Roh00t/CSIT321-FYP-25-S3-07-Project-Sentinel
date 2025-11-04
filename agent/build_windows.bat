@echo off
echo Building Sentinel Agent for Windows...
echo.

REM Install dependencies
pip install -r requirements.txt

REM Build executable
pyinstaller --onefile --windowed --name "SentinelAgent" main.py

echo.
echo Build complete! Executable is in dist\SentinelAgent.exe
pause
