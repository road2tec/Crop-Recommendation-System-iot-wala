import wmi
import time
import threading
from flask import Flask, jsonify
from flask_cors import CORS
import pythoncom
import logging

app = Flask(__name__)
CORS(app)

usb_state = {
    "connected": False,
    "device_name": None,
    "device_count": 0
}

def monitor_usb_devices():
    # Initialize COM library for the thread created
    pythoncom.CoInitialize()
    
    try:
        c = wmi.WMI()
        print("🔍 Scanning for initial USB devices...")
        
        previous_device_count = 0
        
        # Get initial device count using simpler approach
        try:
            # Count USB devices using Win32_PnPEntity with USB in DeviceID
            initial_devices = c.Win32_PnPEntity(DeviceID="USB*")
            previous_device_count = len(list(initial_devices))
            print(f"📊 Initial scan: {previous_device_count} USB devices found.")
            usb_state["device_count"] = previous_device_count
        except Exception as e:
            print(f"❌ Error during initial scan: {e}")
            # Fallback: assume no devices initially
            previous_device_count = 0
        
        print("👀 Now monitoring for USB device changes...")
        print("🔌 Plug in any USB device (mouse, pendrive, etc.) to simulate IoT sensor!")
        
        while True:
            try:
                # Count current USB devices
                current_devices = c.Win32_PnPEntity(DeviceID="USB*")
                current_device_count = len(list(current_devices))
                
                # Check for changes
                if current_device_count > previous_device_count:
                    # New device connected
                    print(f"✅ NEW USB DEVICE DETECTED! ({current_device_count} total)")
                    print("🎯 Treating as IoT Hardware Sensor...")
                    usb_state["connected"] = True
                    usb_state["device_name"] = "Hardware Sensor"
                    usb_state["device_count"] = current_device_count
                    
                elif current_device_count < previous_device_count:
                    # Device removed
                    print(f"❌ USB DEVICE REMOVED! ({current_device_count} total)")
                    print("🔴 IoT Sensor Disconnected...")
                    usb_state["connected"] = False
                    usb_state["device_name"] = None
                    usb_state["device_count"] = current_device_count
                
                previous_device_count = current_device_count
                
            except Exception as e:
                print(f"⚠️  Warning: WMI check failed: {e}")
                # Keep trying every few seconds
            
            time.sleep(1.5)  # Check every 1.5 seconds for responsiveness
            
    except Exception as e:
        print(f"💥 Critical error in monitor_usb_devices: {e}")
        print("🔄 IoT monitoring disabled, but server will continue running...")

@app.route('/api/usb-status', methods=['GET'])
def get_usb_status():
    return jsonify(usb_state)

@app.route('/api/test', methods=['GET'])  
def test_endpoint():
    return jsonify({"status": "IoT server running", "timestamp": time.time()})

if __name__ == '__main__':
    # Start monitor in detached thread
    t = threading.Thread(target=monitor_usb_devices, daemon=True)
    t.start()
    
    print("="*60)
    print("🚀 IoT Sensor Simulation Server STARTED!")
    print("📡 Running on: http://localhost:5005")
    print("🔌 PLUG/UNPLUG any USB device to simulate IoT sensor!")
    print("📋 API Endpoints:")
    print("   GET /api/usb-status - Get current sensor status")
    print("   GET /api/test - Test server health")
    print("="*60)
    
    # Suppress Flask logs for cleaner output
    log = logging.getLogger('werkzeug')
    log.setLevel(logging.ERROR)
    
    try:
        app.run(port=5005, host="0.0.0.0", debug=False, use_reloader=False)
    except Exception as e:
        print(f"💥 Failed to start Flask server: {e}")
        print("🔧 Try running: pip install flask flask-cors wmi")
