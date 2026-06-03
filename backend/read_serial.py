import sys
import os
import time

# Attempt to import serial, install if missing
try:
    import serial
except ImportError:
    print("pyserial package not found. Installing...")
    import subprocess
    subprocess.check_call([sys.executable, "-m", "pip", "install", "pyserial"])
    import serial

port = '/dev/cu.usbserial-5AB50034191'
baud = 115200

print(f"📡 Opening serial port {port} at {baud} baud...")
try:
    # Open connection
    ser = serial.Serial(port, baud, timeout=2)
    print("✅ Connected! Press Reset (EN) on your ESP32 board to reboot it.")
    print("Press Ctrl+C to exit this serial reader.\n")
    
    # Read loop
    while True:
        line = ser.readline()
        if line:
            # Decode and print log lines
            print(line.decode('utf-8', errors='ignore'), end='')
except KeyboardInterrupt:
    print("\n👋 Closed serial connection.")
except Exception as e:
    print(f"\n❌ Error: {e}")
    print("Please make sure the ESP32 is plugged in and no other program (like Arduino IDE) is using the port.")
