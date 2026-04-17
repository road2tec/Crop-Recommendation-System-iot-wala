import sys
import time
import threading
import subprocess
import json
from flask import Flask, jsonify
from flask_cors import CORS
import logging

app = Flask(__name__)
CORS(app)

usb_state = {
    "connected": False,
    "device_name": None,
    "device_count": 0,
    "device_list": []
}


def get_usb_devices_via_powershell():
    """
    Use PowerShell to quickly get connected USB devices.
    Much faster and more reliable than WMI Python bindings.
    """
    ps_script = """
    $devices = Get-PnpDevice -Class USB -Status OK -ErrorAction SilentlyContinue
    $hid = Get-PnpDevice -Class HIDClass -Status OK -ErrorAction SilentlyContinue
    $all = @()
    if ($devices) { $all += $devices }
    if ($hid) { $all += $hid }
    $unique = $all | Sort-Object InstanceId -Unique
    $result = $unique | Select-Object FriendlyName, InstanceId | ConvertTo-Json -Compress
    if (-not $result) { Write-Output '[]' } else { Write-Output $result }
    """
    try:
        result = subprocess.run(
            ["powershell", "-NoProfile", "-Command", ps_script],
            capture_output=True, text=True, timeout=8
        )
        raw = result.stdout.strip()
        if not raw or raw == "[]":
            return {}
        data = json.loads(raw)
        if isinstance(data, dict):
            data = [data]
        return {d["InstanceId"]: d["FriendlyName"] or "USB Device" for d in data if d.get("InstanceId")}
    except Exception as e:
        print(f"[IoT] PowerShell query error: {e}")
        return {}


def update_state(device_map):
    """Update global usb_state."""
    count = len(device_map)
    names = [n for n in device_map.values() if n]
    usb_state["device_count"] = count
    usb_state["device_list"] = names[:10]  # keep list manageable

    if count > 0:
        usb_state["connected"] = True
        # Prefer human-readable names
        readable = [n for n in names if n and len(n) > 3]
        usb_state["device_name"] = readable[-1] if readable else "USB Device"
    else:
        usb_state["connected"] = False
        usb_state["device_name"] = None


def monitor_usb_devices():
    """Main monitoring loop using PowerShell-backed USB queries."""
    print("[IoT] Initial USB scan starting (using PowerShell)...")

    # --- Initial Scan ---
    current_devices = get_usb_devices_via_powershell()
    update_state(current_devices)

    if current_devices:
        print(f"[IoT] {len(current_devices)} USB/HID device(s) detected at startup:")
        for name in list(current_devices.values())[:5]:
            print(f"       + {name}")
        print(f"[IoT] Status: CONNECTED  |  Sensor: {usb_state['device_name']}")
    else:
        print("[IoT] No USB devices found. Plug in a USB device to activate sensor.")

    previous_ids = set(current_devices.keys())
    print("[IoT] Monitoring for plug/unplug events every 2s...")

    while True:
        time.sleep(2.0)
        try:
            current_devices = get_usb_devices_via_powershell()
            current_ids = set(current_devices.keys())

            added = current_ids - previous_ids
            removed = previous_ids - current_ids

            if added:
                for dev_id in added:
                    name = current_devices.get(dev_id, "Unknown")
                    print(f"[IoT] CONNECTED: {name}")
                update_state(current_devices)
                print(f"[IoT] Total: {usb_state['device_count']} | Status: CONNECTED | Active: {usb_state['device_name']}")

            if removed:
                for dev_id in removed:
                    name = previous_ids  # just log count
                    print(f"[IoT] REMOVED device | Remaining: {len(current_ids)}")
                update_state(current_devices)
                status = "CONNECTED" if usb_state["connected"] else "DISCONNECTED"
                print(f"[IoT] Total: {usb_state['device_count']} | Status: {status}")

            previous_ids = current_ids

        except Exception as e:
            print(f"[IoT] Monitor error: {e}")


@app.route('/api/usb-status', methods=['GET'])
def get_usb_status():
    return jsonify(usb_state)


@app.route('/api/test', methods=['GET'])
def test_endpoint():
    return jsonify({
        "status": "IoT server running",
        "timestamp": time.time(),
        "devices": usb_state["device_count"]
    })


if __name__ == '__main__':
    # Start monitor thread
    t = threading.Thread(target=monitor_usb_devices, daemon=True)
    t.start()

    print("=" * 60)
    print("  IoT Sensor Server  |  port: 5005")
    print("  Endpoints:")
    print("    GET /api/usb-status  -> sensor connection state")
    print("    GET /api/test        -> health check")
    print("=" * 60)

    log = logging.getLogger('werkzeug')
    log.setLevel(logging.ERROR)

    try:
        app.run(port=5005, host="0.0.0.0", debug=False, use_reloader=False)
    except Exception as e:
        print(f"Failed to start server: {e}")
        print("Run: pip install flask flask-cors")
