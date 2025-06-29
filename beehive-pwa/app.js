// App initialization
class BeehiveApp {
  constructor() {
    this.data = {
      temperature: [],
      humidity: [],
      weight: [],
      activity: []
    };
    this.charts = {};
    this.isOnline = navigator.onLine;
    
    this.init();
  }

  async init() {
    console.log('🐝 Beehive Analytics initializing...');
    
    // Register service worker
    this.registerServiceWorker();
    
    // Setup PWA install
    this.setupPWAInstall();
    
    // Setup event listeners
    this.setupEventListeners();
    
    // Initialize charts
    this.initializeCharts();
    
    // Load initial data
    await this.loadData();
    
    // Setup auto-refresh
    this.setupAutoRefresh();
    
    // Hide loading screen
    this.hideLoading();
  }

  registerServiceWorker() {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js')
        .then(registration => {
          console.log('SW registered:', registration.scope);
        })
        .catch(error => {
          console.log('SW registration failed:', error);
        });
    }
  }

  setupPWAInstall() {
    let deferredPrompt;
    const installBtn = document.getElementById('install-btn');

    window.addEventListener('beforeinstallprompt', (e) => {
      e.preventDefault();
      deferredPrompt = e;
      installBtn.style.display = 'block';
    });

    installBtn.addEventListener('click', async () => {
      if (deferredPrompt) {
        deferredPrompt.prompt();
        const result = await deferredPrompt.userChoice;
        if (result.outcome === 'accepted') {
          console.log('PWA installed');
          installBtn.style.display = 'none';
        }
        deferredPrompt = null;
      }
    });
  }

  setupEventListeners() {
    // Online/offline events
    window.addEventListener('online', () => {
      this.isOnline = true;
      this.updateConnectionStatus();
      this.loadData();
    });

    window.addEventListener('offline', () => {
      this.isOnline = false;
      this.updateConnectionStatus();
    });
  }

  initializeCharts() {
    // Temperature chart
    this.charts.temperature = createChart('tempChart', {
      label: 'Temperature (°C)',
      borderColor: '#ef4444',
      backgroundColor: 'rgba(239, 68, 68, 0.1)'
    });

    // Humidity chart
    this.charts.humidity = createChart('humidityChart', {
      label: 'Humidity (%)',
      borderColor: '#3b82f6',
      backgroundColor: 'rgba(59, 130, 246, 0.1)'
    });
  }

  async loadData() {
    try {
      console.log('📊 Loading ThingSpeak data...');
      
      const response = await fetch(
        `https://api.thingspeak.com/channels/${CONFIG.THINGSPEAK_CHANNEL_ID}/feeds.json?api_key=${CONFIG.THINGSPEAK_READ_KEY}&results=100`
      );
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }
      
      const data = await response.json();
      this.processData(data.feeds);
      this.updateUI();
      this.updateConnectionStatus(true);
      
      // Store data in localStorage for offline use
      localStorage.setItem('beehive-data', JSON.stringify(this.data));
      
    } catch (error) {
      console.error('Error loading data:', error);
      this.updateConnectionStatus(false);
      
      // Try to load cached data
      this.loadCachedData();
    }
  }

  processData(feeds) {
    this.data = {
      temperature: feeds.map(feed => ({
        x: new Date(feed.created_at),
        y: parseFloat(feed.field1) || 0
      })).filter(item => item.y !== 0),
      
      humidity: feeds.map(feed => ({
        x: new Date(feed.created_at),
        y: parseFloat(feed.field2) || 0
      })).filter(item => item.y !== 0),
      
      weight: feeds.map(feed => ({
        x: new Date(feed.created_at),
        y: parseFloat(feed.field3) || 0
      })).filter(item => item.y !== 0),
      
      activity: feeds.map(feed => ({
        x: new Date(feed.created_at),
        y: parseFloat(feed.field4) || 0
      })).filter(item => item.y !== 0)
    };
  }

  updateUI() {
    // Update status cards
    const latest = {
      temperature: this.data.temperature[this.data.temperature.length - 1]?.y || 0,
      humidity: this.data.humidity[this.data.humidity.length - 1]?.y || 0,
      weight: this.data.weight[this.data.weight.length - 1]?.y || 0,
      activity: this.data.activity[this.data.activity.length - 1]?.y || 0
    };

    document.getElementById('temp-value').textContent = `${latest.temperature.toFixed(1)}°C`;
    document.getElementById('humidity-value').textContent = `${latest.humidity.toFixed(1)}%`;
    document.getElementById('weight-value').textContent = `${latest.weight.toFixed(1)} kg`;
    document.getElementById('activity-value').textContent = latest.activity.toFixed(0);

    // Calculate trends
    this.updateTrends();

    // Update charts
    updateChart(this.charts.temperature, this.data.temperature);
    updateChart(this.charts.humidity, this.data.humidity);

    // Update last update time
    const lastUpdate = new Date().toLocaleString();
    document.getElementById('last-update').textContent = `Last update: ${lastUpdate}`;
  }

  updateTrends() {
    const trends = ['temp', 'humidity', 'weight', 'activity'];
    const dataKeys = ['temperature', 'humidity', 'weight', 'activity'];
    
    trends.forEach((trend, index) => {
      const dataKey = dataKeys[index];
      const data = this.data[dataKey];
      
      if (data.length >= 2) {
        const current = data[data.length - 1].y;
        const previous = data[data.length - 2].y;
        const change = current - previous;
        const percentage = previous !== 0 ? ((change / previous) * 100).toFixed(1) : 0;
        
        const arrow = change > 0 ? '↗️' : change < 0 ? '↘️' : '➡️';
        const color = change > 0 ? '#10b981' : change < 0 ? '#ef4444' : '#6b7280';
        
        const trendElement = document.getElementById(`${trend}-trend`);
        trendElement.textContent = `${arrow} ${Math.abs(percentage)}%`;
        trendElement.style.color = color;
      }
    });
  }

  updateConnectionStatus(isConnected = this.isOnline) {
    const indicator = document.getElementById('status-indicator');
    const statusText = document.getElementById('status-text');

    if (isConnected) {
      indicator.className = 'status-indicator online';
      statusText.textContent = 'Connected to ThingSpeak';
    } else {
      indicator.className = 'status-indicator';
      statusText.textContent = 'Offline - Using cached data';
    }
  }

  setupAutoRefresh() {
    // Refresh every 5 minutes
    setInterval(() => {
      if (this.isOnline) {
        this.loadData();
      }
    }, CONFIG.UPDATE_INTERVAL || 5 * 60 * 1000);
  }

  loadCachedData() {
    // Try to load data from localStorage
    const cachedData = localStorage.getItem('beehive-data');
    if (cachedData) {
      console.log('📦 Loading cached data...');
      try {
        this.data = JSON.parse(cachedData);
        this.updateUI();
      } catch (error) {
        console.error('Error parsing cached data:', error);
      }
    } else {
      // Show demo data if no cache
      this.loadDemoData();
    }
  }

  loadDemoData() {
    console.log('🎭 Loading demo data...');
    const now = new Date();
    const demoData = [];
    
    // Generate 24 hours of demo data
    for (let i = 23; i >= 0; i--) {
      const time = new Date(now - i * 60 * 60 * 1000);
      demoData.push({
        temperature: 22 + Math.sin(i / 4) * 3 + Math.random() * 2,
        humidity: 60 + Math.cos(i / 6) * 10 + Math.random() * 5,
        weight: 45 + Math.sin(i / 12) * 2 + Math.random() * 1,
        activity: Math.max(0, 50 + Math.sin(i / 3) * 30 + Math.random() * 20)
      });
    }
    
    this.data = {
      temperature: demoData.map((item, i) => ({
        x: new Date(now - (23 - i) * 60 * 60 * 1000),
        y: item.temperature
      })),
      humidity: demoData.map((item, i) => ({
        x: new Date(now - (23 - i) * 60 * 60 * 1000),
        y: item.humidity
      })),
      weight: demoData.map((item, i) => ({
        x: new Date(now - (23 - i) * 60 * 60 * 1000),
        y: item.weight
      })),
      activity: demoData.map((item, i) => ({
        x: new Date(now - (23 - i) * 60 * 60 * 1000),
        y: item.activity
      }))
    };
    
    this.updateUI();
  }

  hideLoading() {
    const loading = document.getElementById('loading');
    if (loading) {
      loading.classList.add('hidden');
    }
  }
}

// Initialize app when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  new BeehiveApp();
});
