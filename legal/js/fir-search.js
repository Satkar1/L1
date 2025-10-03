// fir-search.js - FIR Search and Management
class FIRSearch {
    constructor() {
        this.apiUrl = 'http://localhost:5001/api/fir';
        this.currentPage = 1;
        this.pageSize = 10;
        this.currentFilters = {};
    }

    // Search FIR records
    async searchFIR(filters = {}) {
        try {
            const response = await fetch(`${this.apiUrl}/search`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(filters)
            });

            const data = await response.json();
            
            if (data.success) {
                this.displayResults(data.records);
                this.updateSearchStats(data.count);
                this.currentFilters = filters;
            } else {
                this.showError(data.error);
            }
        } catch (error) {
            this.showError('Failed to search FIR records');
        }
    }

    // Display search results
    displayResults(records) {
        const resultsContainer = document.getElementById('firResults');
        if (!resultsContainer) return;

        if (records.length === 0) {
            resultsContainer.innerHTML = '<div class="no-results">No FIR records found</div>';
            return;
        }

        resultsContainer.innerHTML = records.map(fir => `
            <div class="fir-record-card">
                <div class="fir-header">
                    <h4>FIR: ${fir.fir_number}</h4>
                    <span class="fir-date">${new Date(fir.incident_date).toLocaleDateString()}</span>
                </div>
                <div class="fir-details">
                    <p><strong>Type:</strong> ${fir.incident_type}</p>
                    <p><strong>Location:</strong> ${fir.incident_location}</p>
                    <p><strong>Victim:</strong> ${fir.victim_name}</p>
                    <p><strong>Sections:</strong> ${JSON.parse(fir.ipc_sections).map(s => s.section_number).join(', ')}</p>
                    <p><strong>Officer:</strong> ${fir.investigating_officer}</p>
                </div>
                <div class="fir-actions">
                    <button class="btn-view" onclick="firSearch.viewFIR('${fir.fir_number}')">View Details</button>
                    <button class="btn-download" onclick="firSearch.downloadFIR('${fir.fir_number}')">Download PDF</button>
                </div>
            </div>
        `).join('');
    }

    // View FIR details
    async viewFIR(firNumber) {
        try {
            const response = await fetch(`${this.apiUrl}/${firNumber}`);
            const data = await response.json();
            
            if (data.success) {
                this.showFIRDetails(data.record);
            } else {
                this.showError(data.error);
            }
        } catch (error) {
            this.showError('Failed to fetch FIR details');
        }
    }

    // Download FIR
    downloadFIR(firNumber) {
        const downloadUrl = `http://localhost:5001/api/fir/download/${firNumber.replace(/\//g, '_')}`;
        window.open(downloadUrl, '_blank');
    }

    // Show FIR details modal
    showFIRDetails(fir) {
        // Create and show modal with FIR details
        const modal = document.createElement('div');
        modal.className = 'fir-details-modal';
        modal.innerHTML = `
            <div class="modal-content">
                <h3>FIR Details: ${fir.fir_number}</h3>
                <div class="fir-details-grid">
                    <!-- Display all FIR details here -->
                </div>
                <button class="btn-close" onclick="this.closest('.fir-details-modal').remove()">Close</button>
            </div>
        `;
        document.body.appendChild(modal);
    }

    // Update search statistics
    updateSearchStats(count) {
        const statsElement = document.getElementById('searchStats');
        if (statsElement) {
            statsElement.textContent = `Found ${count} FIR records`;
        }
    }

    // Show error message
    showError(message) {
        alert(`Error: ${message}`);
    }
}

// Initialize FIR Search
const firSearch = new FIRSearch();