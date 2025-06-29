// Configuration file
const CONFIG = {
  // ThingSpeak configuration - YOUR REAL CREDENTIALS
  THINGSPEAK_CHANNEL_ID: '2999884',
  THINGSPEAK_READ_KEY: '31U1XHPKZZG6J4FT',
  
  // App configuration
  UPDATE_INTERVAL: 5 * 60 * 1000, // 5 minutes
  MAX_DATA_POINTS: 100,
  
  // Chart colors
  COLORS: {
    temperature: '#ef4444',
    humidity: '#3b82f6',
    weight: '#10b981',
    activity: '#f59e0b'
  },
  
  // Feature flags
  FEATURES: {
    PWA_INSTALL: true,
    OFFLINE_MODE: true,
    PUSH_NOTIFICATIONS: false,
    DEMO_MODE: false  // Using real data!
  },
  
  // ThingSpeak field mapping
  FIELD_MAPPING: {
    temperature: 'field1',
    humidity: 'field2',
    weight: 'field3',
    activity: 'field4'
  },
  
  // Units
  UNITS: {
    temperature: '°C',
    humidity: '%',
    weight: 'kg',
    activity: 'level'
  }
};