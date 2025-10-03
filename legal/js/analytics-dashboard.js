// Crime Analytics Dashboard
class AnalyticsDashboard {
    constructor() {
        this.apiBase = 'http://localhost:5001/api/police';
        this.charts = {};
    }

    async generateAnalytics(timeRange = 'month') {
        try {
            // Show loading state
            this.showLoading();
            
            // Fetch analytics data
            const [statsResponse, patternsResponse, hotspotsResponse] = await Promise.all([
                fetch(`${this.apiBase}/analytics/statistics?range=${timeRange}`),
                fetch(`${this.apiBase}/analytics/patterns`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ time_range: 30 }) // Last 30 days
                }),
                fetch(`${this.apiBase}/analytics/hotspots`)
            ]);

            const stats = await statsResponse.json();
            const patterns = await patternsResponse.json();
            const hotspots = await hotspotsResponse.json();

            if (stats.success && patterns.success && hotspots.success) {
                this.displayAnalytics(stats.statistics, patterns.analysis, hotspots.hotspots);
            } else {
                this.showError('Failed to load analytics data');
            }
        } catch (error) {
            console.error('Analytics error:', error);
            this.showError('Error generating analytics report');
        }
    }

    displayAnalytics(stats, patterns, hotspots) {
        const container = document.getElementById('analyticsResults');
        if (!container) return;

        container.innerHTML = `
            <div class="analytics-grid">
                <div class="analytics-card">
                    <h3>Crime Statistics</h3>
                    <div class="stats-overview">
                        <div class="stat-item">
                            <span>Total Cases:</span>
                            <strong>${stats.total_cases || 0}</strong>
                        </div>
                        <div class="stat-item">
                            <span>Resolution Rate:</span>
                            <strong>${stats.resolution_rate || 0}%</strong>
                        </div>
                        <div class="stat-item">
                            <span>Avg Response Time:</span>
                            <strong>${stats.average_response_time || 'N/A'}</strong>
                        </div>
                    </div>
                </div>

                <div class="analytics-card">
                    <h3>Crime Patterns</h3>
                    <div class="patterns-list">
                        ${patterns.insights && patterns.insights.length > 0 ? 
                            patterns.insights.map(insight => `<div class="insight">🔍 ${insight}</div>`).join('') :
                            '<p>No significant patterns detected</p>'
                        }
                    </div>
                </div>

                <div class="analytics-card">
                    <h3>Crime Hotspots</h3>
                    <div class="hotspots-list">
                        ${Object.keys(hotspots).length > 0 ? 
                            Object.entries(hotspots).slice(0, 5).map(([location, count]) => `
                                <div class="hotspot-item">
                                    <span class="location">📍 ${location}</span>
                                    <span class="count">${count} cases</span>
                                </div>
                            `).join('') :
                            '<p>No hotspot data available</p>'
                        }
                    </div>
                </div>
            </div>

            <div class="crime-breakdown">
                <h3>Crime Type Distribution</h3>
                <div class="breakdown-chart">
                    ${stats.case_types ? this.generateTypeChart(stats.case_types) : '<p>No data available</p>'}
                </div>
            </div>
        `;
    }

    generateTypeChart(caseTypes) {
        const total = Object.values(caseTypes).reduce((sum, count) => sum + count, 0);
        if (total === 0) return '<p>No cases recorded</p>';

        return Object.entries(caseTypes).map(([type, count]) => {
            const percentage = ((count / total) * 100).toFixed(1);
            return `
                <div class="chart-row">
                    <span class="crime-type">${type}</span>
                    <div class="chart-bar">
                        <div class="bar-fill" style="width: ${percentage}%"></div>
                    </div>
                    <span class="crime-count">${count} (${percentage}%)</span>
                </div>
            `;
        }).join('');
    }

    showLoading() {
        const container = document.getElementById('analyticsResults');
        if (container) {
            container.innerHTML = `
                <div class="loading">
                    <i class="material-icons">analytics</i>
                    <p>Generating analytics report...</p>
                </div>
            `;
        }
    }

    showError(message) {
        const container = document.getElementById('analyticsResults');
        if (container) {
            container.innerHTML = `
                <div class="error-message">
                    <i class="material-icons">error</i>
                    <p>${message}</p>
                </div>
            `;
        }
    }
}

// Initialize analytics dashboard
window.analyticsDashboard = new AnalyticsDashboard();

// Global function for HTML onclick
function generateAnalytics() {
    const timeRange = document.getElementById('timeRange').value;
    window.analyticsDashboard.generateAnalytics(timeRange);
}