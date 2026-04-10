/**
 * IoT Service - API calls for live sensor data
 */

// Get current sensor status from IoT server
export const getSensorStatus = async () => {
  try {
    const response = await fetch('http://localhost:5005/api/usb-status');
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    return await response.json();
  } catch (error) {
    throw new Error('Failed to connect to IoT sensor server');
  }
};

// Check if IoT server is running
export const checkIoTServer = async () => {
  try {
    const response = await fetch('http://localhost:5005/api/test');
    return response.ok;
  } catch (error) {
    return false;
  }
};

// Generate dummy sensor values (similar to IoT page)
export const generateSensorValues = () => {
  const randomVal = (min, max, dec = 0) =>
    Number((min + Math.random() * (max - min)).toFixed(dec));

  return {
    N: randomVal(0, 140),
    P: randomVal(0, 145), 
    K: randomVal(0, 205),
    temperature: randomVal(15, 40, 1),
    humidity: randomVal(30, 90, 1),
    ph: randomVal(4, 9, 1),
    rainfall: randomVal(0, 300)
  };
};