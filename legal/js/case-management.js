// Enhanced Case Management Functions
class CaseManager {
    constructor() {
        this.apiBase = 'http://localhost:5001/api/police';
    }

    async updateCaseStatus(firNumber, status, notes = '') {
        try {
            const response = await fetch(`${this.apiBase}/cases/${firNumber}/status`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    status: status,
                    notes: notes
                })
            });

            const data = await response.json();
            return data;
        } catch (error) {
            console.error('Error updating case status:', error);
            return { success: false, error: error.message };
        }
    }

    async addCaseNote(firNumber, note, officerName) {
        try {
            // Implementation for adding case notes
            const response = await fetch(`${this.apiBase}/cases/${firNumber}/notes`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    note: note,
                    officer: officerName,
                    timestamp: new Date().toISOString()
                })
            });

            return await response.json();
        } catch (error) {
            console.error('Error adding case note:', error);
            return { success: false, error: error.message };
        }
    }

    async getCaseTimeline(firNumber) {
        try {
            const response = await fetch(`${this.apiBase}/cases/${firNumber}/timeline`);
            return await response.json();
        } catch (error) {
            console.error('Error fetching case timeline:', error);
            return { success: false, error: error.message };
        }
    }

    async exportCaseReport(firNumber, format = 'pdf') {
        try {
            const response = await fetch(`${this.apiBase}/cases/${firNumber}/export?format=${format}`);
            if (response.ok) {
                const blob = await response.blob();
                const url = window.URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `case-${firNumber}.${format}`;
                a.click();
                window.URL.revokeObjectURL(url);
                return { success: true };
            }
            return { success: false, error: 'Export failed' };
        } catch (error) {
            console.error('Error exporting case:', error);
            return { success: false, error: error.message };
        }
    }
}

// Initialize case manager
window.caseManager = new CaseManager();