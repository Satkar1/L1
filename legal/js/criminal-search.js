// Criminal Pattern Matching System
class CriminalSearch {
    constructor() {
        this.apiBase = 'http://localhost:5001/api/police';
    }

    async findCriminalMatches() {
        const caseDescription = document.getElementById('caseDescription').value;
        
        if (!caseDescription.trim()) {
            alert('Please enter case details to search for matches');
            return;
        }

        try {
            this.showLoading();
            
            const response = await fetch(`${this.apiBase}/criminal/match`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    case_description: caseDescription,
                    suspect_details: {} // Can be enhanced with form data
                })
            });

            const data = await response.json();
            
            if (data.success) {
                this.displayMatches(data.matches);
            } else {
                this.showError('Failed to find criminal matches');
            }
        } catch (error) {
            console.error('Criminal matching error:', error);
            this.showError('Error searching for criminal patterns');
        }
    }

    displayMatches(matches) {
        const container = document.getElementById('matchingResults');
        if (!container) return;

        if (matches.length === 0) {
            container.innerHTML = `
                <div class="no-matches">
                    <i class="material-icons">search_off</i>
                    <h3>No Similar Patterns Found</h3>
                    <p>No matching criminal patterns were found in the database.</p>
                </div>
            `;
            return;
        }

        container.innerHTML = `
            <h3>Potential Matches Found</h3>
            <div class="matches-grid">
                ${matches.map(match => `
                    <div class="match-card">
                        <div class="match-header">
                            <h4>${match.name}</h4>
                            <span class="confidence ${this.getConfidenceClass(match.match_confidence)}">
                                ${match.match_confidence}% Match
                            </span>
                        </div>
                        
                        <div class="match-details">
                            <p><strong>Modus Operandi:</strong> ${match.modus_operandi}</p>
                            <p><strong>Crime Types:</strong> ${match.crime_types.join(', ')}</p>
                            <p><strong>Preferred Locations:</strong> ${match.preferred_locations.join(', ')}</p>
                            ${match.physical_description ? 
                                `<p><strong>Description:</strong> ${match.physical_description}</p>` : ''}
                        </div>

                        <div class="match-analysis">
                            <div class="match-factors">
                                <span class="factor">MO: ${match.matched_elements.modus_operandi}%</span>
                                <span class="factor">Crime Type: ${match.matched_elements.crime_type_match ? '✓' : '✗'}</span>
                                <span class="factor">Location: ${match.matched_elements.location_match ? '✓' : '✗'}</span>
                            </div>
                        </div>

                        <div class="match-actions">
                            <button class="btn-view-profile" onclick="viewCriminalProfile(${match.id})">
                                View Full Profile
                            </button>
                            <button class="btn-flag-match" onclick="flagPotentialMatch(${match.id})">
                                Flag as Potential Match
                            </button>
                        </div>
                    </div>
                `).join('')}
            </div>
        `;
    }

    getConfidenceClass(confidence) {
        if (confidence >= 80) return 'high-confidence';
        if (confidence >= 60) return 'medium-confidence';
        return 'low-confidence';
    }

    showLoading() {
        const container = document.getElementById('matchingResults');
        if (container) {
            container.innerHTML = `
                <div class="loading">
                    <i class="material-icons">fingerprint</i>
                    <p>Analyzing criminal patterns...</p>
                </div>
            `;
        }
    }

    showError(message) {
        const container = document.getElementById('matchingResults');
        if (container) {
            container.innerHTML = `
                <div class="error-message">
                    <i class="material-icons">error</i>
                    <p>${message}</p>
                </div>
            `;
        }
    }

    async searchCriminalProfiles(searchTerm) {
        try {
            const response = await fetch(`${this.apiBase}/criminal/profiles?search=${encodeURIComponent(searchTerm)}`);
            const data = await response.json();
            return data;
        } catch (error) {
            console.error('Profile search error:', error);
            return { success: false, error: error.message };
        }
    }
}

// Initialize criminal search
window.criminalSearch = new CriminalSearch();

// Global functions
function findCriminalMatches() {
    window.criminalSearch.findCriminalMatches();
}

function viewCriminalProfile(profileId) {
    alert(`Viewing criminal profile ${profileId} - Implementation needed`);
}

function flagPotentialMatch(profileId) {
    alert(`Flagging profile ${profileId} as potential match - Implementation needed`);
}