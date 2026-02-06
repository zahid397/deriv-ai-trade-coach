// Main application initialization
class TradingApp {
  constructor() {
    this.state = window.TradingState;
    this.dashboard = window.DashboardUI;
    this.coach = window.CoachUI;
    this.api = window.TradingAPI;
    
    this.init();
  }

  init() {
    console.log('🚀 AI Trading Coach Initializing...');
    
    this.setupThemeToggle();
    this.setupClearData();
    this.setupExportImport();
    this.setupErrorHandling();
    this.checkHealth();
    
    // Initialize components when DOM is ready
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', () => this.onDOMReady());
    } else {
      this.onDOMReady();
    }
  }

  onDOMReady() {
    console.log('📊 DOM Ready - Initializing UI Components');
    
    // Update UI indicators
    this.updateAIModeIndicator();
    this.updateThemeIcon();
    
    // Show welcome message if no data
    setTimeout(() => {
      if (this.state.getState().trades.length === 0) {
        this.showWelcomeTips();
      }
    }, 2000);
  }

  setupThemeToggle() {
    const toggleBtn = document.getElementById('theme-toggle');
    if (toggleBtn) {
      toggleBtn.addEventListener('click', () => {
        this.state.toggleTheme();
        this.updateThemeIcon();
      });
    }
  }

  updateThemeIcon() {
    const themeIcon = document.querySelector('.theme-icon');
    if (themeIcon) {
      const theme = this.state.getState().ui.theme;
      themeIcon.textContent = theme === 'dark' ? '🌙' : '☀️';
    }
  }

  updateAIModeIndicator() {
    const modeIndicator = document.getElementById('ai-mode');
    if (modeIndicator) {
      // Check if API is in mock mode
      // This would require the API to expose its mode
      // For now, we'll assume it's live if we have a session
      const sessionId = localStorage.getItem('trading_session_id');
      modeIndicator.textContent = sessionId ? 'Live AI' : 'Demo Mode';
      modeIndicator.className = sessionId ? 'badge badge-success' : 'badge badge-warning';
    }
  }

  setupClearData() {
    const clearBtn = document.getElementById('clear-data');
    if (clearBtn) {
      clearBtn.addEventListener('click', () => {
        if (confirm('Are you sure you want to clear all data? This cannot be undone.')) {
          this.state.clearAllData();
          this.coach.addMessage('ai', 'All data has been cleared. Ready to start fresh!', 'system');
          
          // Reload the page to reset everything
          setTimeout(() => {
            window.location.reload();
          }, 1000);
        }
      });
    }
  }

  setupExportImport() {
    const exportBtn = document.getElementById('export-data');
    const importBtn = document.getElementById('import-data');
    
    if (exportBtn) {
      exportBtn.addEventListener('click', () => {
        this.state.exportData();
      });
    }
    
    if (importBtn) {
      importBtn.addEventListener('click', (e) => {
        const file = e.target.files[0];
        if (file) {
          this.state.importData(file)
            .then(() => {
              alert('Data imported successfully!');
              window.location.reload();
            })
            .catch(error => {
              alert('Import failed: ' + error.message);
            });
        }
      });
    }
  }

  setupErrorHandling() {
    window.addEventListener('error', (event) => {
      console.error('Global error:', event.error);
      this.state.setError('Application error occurred. Please refresh.');
    });
    
    window.addEventListener('unhandledrejection', (event) => {
      console.error('Unhandled promise rejection:', event.reason);
      this.state.setError('Network error. Please check connection.');
    });
  }

  async checkHealth() {
    try {
      const health = await this.api.getHealth();
      console.log('✅ Backend health:', health.status);
      
      // Update connection status
      const statusIndicator = document.getElementById('coach-status');
      if (statusIndicator) {
        statusIndicator.textContent = 'AI Coach Active';
        statusIndicator.className = 'status-indicator active';
      }
    } catch (error) {
      console.warn('⚠️ Backend not responding, using offline mode');
      
      const statusIndicator = document.getElementById('coach-status');
      if (statusIndicator) {
        statusIndicator.textContent = 'Offline Mode';
        statusIndicator.className = 'status-indicator inactive';
      }
      
      this.state.setError('Running in offline mode. Some features may be limited.');
    }
  }

  showWelcomeTips() {
    // Create welcome modal
    const modalHTML = `
      <div class="modal-overlay">
        <div class="modal" style="max-width: 600px;">
          <div class="modal-header">
            <h3 class="modal-title">🎉 Welcome to AI Trading Coach!</h3>
            <button class="btn btn-icon close-modal">&times;</button>
          </div>
          <div class="modal-body">
            <div class="space-y-4">
              <div class="flex items-start gap-3">
                <div class="text-2xl">📊</div>
                <div>
                  <h4 class="font-semibold mb-1">Track Your Trades</h4>
                  <p class="text-sm text-tertiary">Add trades manually or import your trading history to get personalized analysis.</p>
                </div>
              </div>
              
              <div class="flex items-start gap-3">
                <div class="text-2xl">🤖</div>
                <div>
                  <h4 class="font-semibold mb-1">AI-Powered Coaching</h4>
                  <p class="text-sm text-tertiary">Get real-time feedback on your trades, detect psychological biases, and improve your strategy.</p>
                </div>
              </div>
              
              <div class="flex items-start gap-3">
                <div class="text-2xl">📈</div>
                <div>
                  <h4 class="font-semibold mb-1">Performance Analytics</h4>
                  <p class="text-sm text-tertiary">Monitor your win rate, profit factor, drawdown, and other key metrics with interactive charts.</p>
                </div>
              </div>
              
              <div class="flex items-start gap-3">
                <div class="text-2xl">🧠</div>
                <div>
                  <h4 class="font-semibold mb-1">Behavioral Insights</h4>
                  <p class="text-sm text-tertiary">Identify and overcome trading psychology biases like loss aversion and revenge trading.</p>
                </div>
              </div>
              
              <div class="p-3 bg-primary-50 rounded border border-primary-200">
                <p class="text-sm text-primary-700">
                  <strong>Disclaimer:</strong> This is an educational tool for self-improvement. 
                  Not financial advice. Always do your own research and manage risk appropriately.
                </p>
              </div>
            </div>
          </div>
          <div class="modal-footer">
            <button class="btn btn-primary start-using">Start Using</button>
          </div>
        </div>
      </div>
    `;
    
    document.body.insertAdjacentHTML('beforeend', modalHTML);
    
    // Add event listeners
    document.querySelector('.close-modal')?.addEventListener('click', () => {
      this.closeModal();
    });
    
    document.querySelector('.start-using')?.addEventListener('click', () => {
      this.closeModal();
      // Focus on coach input
      const coachInput = document.getElementById('coach-input');
      if (coachInput) {
        coachInput.focus();
      }
    });
  }

  closeModal() {
    const modal = document.querySelector('.modal-overlay');
    if (modal) {
      modal.remove();
    }
  }
}

// Start the application
document.addEventListener('DOMContentLoaded', () => {
  window.TradingApp = new TradingApp();
});
