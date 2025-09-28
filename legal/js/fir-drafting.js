document.addEventListener('DOMContentLoaded', function() {
    // DOM Elements
    const nextStep1Btn = document.getElementById('nextStep1');
    const nextStep2Btn = document.getElementById('nextStep2');
    const nextStep3Btn = document.getElementById('nextStep3');
    const prevStep2Btn = document.getElementById('prevStep2');
    const prevStep3Btn = document.getElementById('prevStep3');
    const prevStep4Btn = document.getElementById('prevStep4');
    const submitFIRBtn = document.getElementById('submitFIR');
    const resetFormBtn = document.getElementById('resetForm');
    
    // Check if elements exist
    if (!nextStep1Btn || !submitFIRBtn) {
        console.error('Required DOM elements not found!');
        return;
    }
    
    // FIR API endpoint
    const FIR_API_URL = 'http://localhost:5001/api/fir';
    
    let currentStep = 1;
    let suggestedSections = [];
    let selectedSectionNumbers = [];
    let currentFIRNumber = '';
    let fallbackSections = []; // Store sections from fallback text

    // Form navigation
    function goToStep(step) {
        const currentStepElem = document.getElementById(`formStep${currentStep}`);
        const currentStepIndicator = document.getElementById(`step${currentStep}`);
        
        if (currentStepElem) currentStepElem.classList.remove('active');
        if (currentStepIndicator) currentStepIndicator.classList.remove('active');
        
        const newStepElem = document.getElementById(`formStep${step}`);
        const newStepIndicator = document.getElementById(`step${step}`);
        
        if (newStepElem) newStepElem.classList.add('active');
        if (newStepIndicator) newStepIndicator.classList.add('active');
        
        for (let i = 1; i <= 4; i++) {
            const stepIndicator = document.getElementById(`step${i}`);
            if (stepIndicator) {
                if (i < step) {
                    stepIndicator.classList.add('completed');
                } else {
                    stepIndicator.classList.remove('completed');
                }
            }
        }
        
        currentStep = step;
    }
    
    // Validate Step 1
    function validateStep1() {
        const incidentType = document.getElementById('incidentType')?.value;
        const location = document.getElementById('location')?.value;
        const incidentDate = document.getElementById('incidentDate')?.value;
        const incidentDescription = document.getElementById('incidentDescription')?.value;
        
        if (!incidentType || !location || !incidentDate || !incidentDescription) {
            alert('Please fill all required fields in Incident Details');
            return false;
        }
        return true;
    }
    
    // Validate Step 2
    function validateStep2() {
        const victimName = document.getElementById('victimName')?.value;
        const victimContact = document.getElementById('victimContact')?.value;
        
        if (!victimName || !victimContact) {
            alert('Please fill all required fields in Victim Information');
            return false;
        }
        return true;
    }

    // Parse sections from Gemini fallback text
    function parseSectionsFromText(text) {
        const sections = [];
        const sectionRegex = /Section\s+(\d+[A-Z]*):\s*([^–-]+)[–-]\s*([^.]+)/g;
        let match;
        
        while ((match = sectionRegex.exec(text)) !== null) {
            sections.push({
                section_number: match[1],
                section_title: match[2].trim(),
                description: match[3].trim(),
                confidence: 0.8, // High confidence for direct AI suggestion
                is_from_fallback: true
            });
        }
        
        return sections;
    }

    // Create manual section input for fallback cases
    function createManualSectionInput() {
        const sectionsContainer = document.getElementById('sectionsContainer');
        sectionsContainer.innerHTML = `
            <div class="manual-section-input">
                <h4>Manual Section Entry</h4>
                <p>Since AI suggestions are in text format, you can manually enter the relevant IPC sections:</p>
                
                <div class="manual-section-form">
                    <div class="form-row">
                        <div class="form-col">
                            <input type="text" id="manualSectionNumber" placeholder="IPC Section Number (e.g., 279)">
                        </div>
                        <div class="form-col">
                            <input type="text" id="manualSectionTitle" placeholder="Section Title">
                        </div>
                    </div>
                    <textarea id="manualSectionDesc" placeholder="Section Description" rows="2"></textarea>
                    <button class="btn-add-manual" onclick="addManualSection()">Add Section</button>
                </div>

                <div class="common-sections">
                    <h5>Common Sections for Road Accidents:</h5>
                    <div class="common-section-list">
                        <div class="common-section" onclick="addCommonSection('279', 'Rash driving', 'Rash driving or riding on a public way')">
                            <strong>IPC 279:</strong> Rash driving on public way
                        </div>
                        <div class="common-section" onclick="addCommonSection('337', 'Causing hurt', 'Causing hurt by act endangering life or personal safety')">
                            <strong>IPC 337:</strong> Causing hurt by endangerment
                        </div>
                        <div class="common-section" onclick="addCommonSection('338', 'Causing grievous hurt', 'Causing grievous hurt by act endangering life or personal safety')">
                            <strong>IPC 338:</strong> Causing grievous hurt by endangerment
                        </div>
                        <div class="common-section" onclick="addCommonSection('304A', 'Death by negligence', 'Causing death by negligence')">
                            <strong>IPC 304A:</strong> Death by negligence
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    // Add manual section to selected sections
    window.addManualSection = function() {
        const sectionNum = document.getElementById('manualSectionNumber')?.value;
        const sectionTitle = document.getElementById('manualSectionTitle')?.value;
        const sectionDesc = document.getElementById('manualSectionDesc')?.value;

        if (!sectionNum) {
            alert('Please enter a section number');
            return;
        }

        const manualSection = {
            section_number: sectionNum,
            section_title: sectionTitle || `IPC Section ${sectionNum}`,
            description: sectionDesc || 'Manually added section',
            confidence: 0.7,
            is_manual: true
        };

        // Add to suggested sections if not already there
        if (!suggestedSections.find(s => s.section_number === sectionNum)) {
            suggestedSections.push(manualSection);
        }

        // Select the section
        selectSectionByNumber(sectionNum);
        
        // Clear manual inputs
        document.getElementById('manualSectionNumber').value = '';
        document.getElementById('manualSectionTitle').value = '';
        document.getElementById('manualSectionDesc').value = '';
    }

    // Add common section
    window.addCommonSection = function(sectionNum, title, description) {
        const commonSection = {
            section_number: sectionNum,
            section_title: title,
            description: description,
            confidence: 0.9,
            is_common: true
        };

        if (!suggestedSections.find(s => s.section_number === sectionNum)) {
            suggestedSections.push(commonSection);
        }

        selectSectionByNumber(sectionNum);
    }

    // Select section by number
    function selectSectionByNumber(sectionNum) {
        const sectionIndex = suggestedSections.findIndex(s => s.section_number === sectionNum);
        if (sectionIndex !== -1) {
            selectSection(sectionIndex);
        }
    }
    
    // AI Section Suggestion
    async function suggestSections() {
        const incidentDescription = document.getElementById('incidentDescription')?.value;
        const sectionsContainer = document.getElementById('sectionsContainer');
        
        if (!sectionsContainer || !incidentDescription) {
            alert('Incident description is required');
            return;
        }
        
        sectionsContainer.innerHTML = '<div class="loading-sections"><i class="material-icons">search</i><p>AI is analyzing the incident...</p></div>';
        
        try {
            const response = await fetch(`${FIR_API_URL}/suggest-sections`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ 
                    incident_description: incidentDescription 
                })
            });
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            const data = await response.json();
            sectionsContainer.innerHTML = '';
            
            if (data.success) {
                if (data.suggestions && data.suggestions.length > 0) {
                    // Structured sections from RAG
                    suggestedSections = data.suggestions;
                    renderStructuredSections();
                } else if (data.fallback_response) {
                    // Fallback text response from Gemini
                    fallbackSections = parseSectionsFromText(data.fallback_response);
                    
                    if (fallbackSections.length > 0) {
                        suggestedSections = fallbackSections;
                        renderStructuredSections();
                    } else {
                        // No parsable sections found, show manual input
                        createManualSectionInput();
                        sectionsContainer.innerHTML += `
                            <div class="gemini-fallback">
                                <h4>AI Analysis:</h4>
                                <p>${data.fallback_response}</p>
                            </div>
                        `;
                    }
                } else {
                    // No suggestions at all
                    createManualSectionInput();
                }
            } else {
                createManualSectionInput();
                sectionsContainer.innerHTML += `
                    <div class="error-message">
                        <p>Error: ${data.error || 'Unable to get section suggestions'}</p>
                    </div>
                `;
            }
            
        } catch (error) {
            console.error('Section suggestion error:', error);
            createManualSectionInput();
            sectionsContainer.innerHTML += `
                <div class="error-message">
                    <p>Connection error. Please manually enter sections or try common sections below.</p>
                </div>
            `;
        }
    }

    // Render structured sections with select buttons
    function renderStructuredSections() {
        const sectionsContainer = document.getElementById('sectionsContainer');
        sectionsContainer.innerHTML = '<h4>AI-Suggested Sections:</h4>';
        
        suggestedSections.forEach((section, index) => {
            const sectionCard = document.createElement('div');
            sectionCard.className = 'section-card';
            sectionCard.innerHTML = `
                <div class="section-header">
                    <h4>IPC Section ${section.section_number}</h4>
                    <span class="confidence">${((section.confidence || 0) * 100).toFixed(1)}% match</span>
                </div>
                <p class="section-title"><strong>${section.section_title}</strong></p>
                <p class="section-desc">${section.description}</p>
                ${section.punishment ? `<p class="section-punishment"><strong>Punishment:</strong> ${section.punishment}</p>` : ''}
                <div class="section-actions">
                    <button class="btn-select" onclick="selectSection(${index})">Select</button>
                </div>
            `;
            sectionsContainer.appendChild(sectionCard);
        });

        // Add manual input option at the bottom
        sectionsContainer.innerHTML += `
            <div class="manual-option">
                <h4>Can't find the right section?</h4>
                <button class="btn-manual-toggle" onclick="showManualInput()">Enter Section Manually</button>
                <div id="manualInputContainer" style="display: none; margin-top: 15px;">
                    <div class="form-row">
                        <div class="form-col">
                            <input type="text" id="manualSectionNumber" placeholder="IPC Section Number">
                        </div>
                        <div class="form-col">
                            <input type="text" id="manualSectionTitle" placeholder="Section Title">
                        </div>
                    </div>
                    <textarea id="manualSectionDesc" placeholder="Description" rows="2"></textarea>
                    <button class="btn-add-manual" onclick="addManualSection()">Add Section</button>
                </div>
            </div>
        `;
    }

    // Show/hide manual input
    window.showManualInput = function() {
        const container = document.getElementById('manualInputContainer');
        if (container) {
            container.style.display = container.style.display === 'none' ? 'block' : 'none';
        }
    }
    
    // Select section for application
    window.selectSection = function(index) {
        const selectedSection = suggestedSections[index];
        if (!selectedSection) return;
        
        let selectedSectionsContainer = document.getElementById('selectedSections');
        
        // Create container if it doesn't exist
        if (!selectedSectionsContainer) {
            selectedSectionsContainer = document.createElement('div');
            selectedSectionsContainer.id = 'selectedSections';
            selectedSectionsContainer.className = 'selected-sections-container';
            selectedSectionsContainer.innerHTML = '<h4>Selected Sections:</h4>';
            
            const sectionsContainer = document.getElementById('sectionsContainer');
            if (sectionsContainer) {
                sectionsContainer.parentNode.insertBefore(selectedSectionsContainer, sectionsContainer);
            }
        }
        
        // Check if section already selected
        if (selectedSectionNumbers.includes(selectedSection.section_number)) {
            alert('This section is already selected');
            return;
        }
        
        // Add to selected sections
        selectedSectionNumbers.push(selectedSection.section_number);
        
        const selectedDiv = document.createElement('div');
        selectedDiv.className = 'selected-section';
        selectedDiv.innerHTML = `
            <span>IPC ${selectedSection.section_number} - ${selectedSection.section_title}</span>
            <button onclick="removeSelectedSection('${selectedSection.section_number}')">×</button>
        `;
        selectedSectionsContainer.appendChild(selectedDiv);
        
        // Remove "no sections" message if it exists
        const noSectionsMsg = selectedSectionsContainer.querySelector('.no-sections');
        if (noSectionsMsg) {
            noSectionsMsg.remove();
        }
        
        // Visual feedback
        const sectionCards = document.querySelectorAll('.section-card');
        if (sectionCards[index]) {
            sectionCards[index].classList.add('selected');
            const selectBtn = sectionCards[index].querySelector('.btn-select');
            if (selectBtn) {
                selectBtn.disabled = true;
                selectBtn.textContent = 'Selected';
            }
        }
    }
    
    // Remove selected section
    window.removeSelectedSection = function(sectionNumber) {
        const selectedSectionsContainer = document.getElementById('selectedSections');
        if (!selectedSectionsContainer) return;
        
        // Remove from array
        selectedSectionNumbers = selectedSectionNumbers.filter(num => num !== sectionNumber);
        
        // Remove from DOM
        const sections = selectedSectionsContainer.querySelectorAll('.selected-section');
        sections.forEach(section => {
            if (section.textContent.includes(`IPC ${sectionNumber}`)) {
                section.remove();
            }
        });
        
        // Add "no sections" message if empty
        if (selectedSectionNumbers.length === 0) {
            selectedSectionsContainer.innerHTML = '<h4>Selected Sections:</h4><p class="no-sections">No sections selected yet.</p>';
        }
        
        // Update visual selection
        const sectionCards = document.querySelectorAll('.section-card');
        sectionCards.forEach((card, index) => {
            if (suggestedSections[index] && suggestedSections[index].section_number === sectionNumber) {
                card.classList.remove('selected');
                const selectBtn = card.querySelector('.btn-select');
                if (selectBtn) {
                    selectBtn.disabled = false;
                    selectBtn.textContent = 'Select';
                }
            }
        });
    }
    
    // Populate review data
    // Populate review data - UPDATED TO SHOW ALL FIELDS
function populateReviewData() {
    // Incident Details
    setReviewContent('reviewIncidentType', document.getElementById('incidentType')?.value);
    setReviewContent('reviewIncidentDate', document.getElementById('incidentDate')?.value);
    setReviewContent('reviewIncidentTime', document.getElementById('incidentTime')?.value);
    setReviewContent('reviewLocation', document.getElementById('location')?.value);
    setReviewContent('reviewIncidentDescription', document.getElementById('incidentDescription')?.value);
    
    // Victim Information
    setReviewContent('reviewVictimName', document.getElementById('victimName')?.value);
    setReviewContent('reviewVictimContact', document.getElementById('victimContact')?.value);
    setReviewContent('reviewVictimAge', document.getElementById('victimAge')?.value);
    setReviewContent('reviewVictimGender', document.getElementById('victimGender')?.value);
    setReviewContent('reviewVictimAddress', document.getElementById('victimAddress')?.value);
    
    // Accused Information
    const accusedName = document.getElementById('accusedName')?.value;
    const accusedDesc = document.getElementById('accusedDescription')?.value;
    const accusedSection = document.getElementById('accusedReviewSection');
    
    if (accusedName || accusedDesc) {
        setReviewContent('reviewAccusedName', accusedName);
        setReviewContent('reviewAccusedDescription', accusedDesc);
        if (accusedSection) accusedSection.style.display = 'block';
    } else {
        if (accusedSection) accusedSection.style.display = 'none';
    }
    
    // Investigation Details - ADDED THIS SECTION
    const investigatingOfficer = document.getElementById('investigatingOfficer')?.value;
    const additionalComments = document.getElementById('additionalComments')?.value;
    
    setReviewContent('reviewInvestigatingOfficer', investigatingOfficer);
    setReviewContent('reviewAdditionalComments', additionalComments);
    
    // Show/hide investigation section based on content
    const investigationSection = document.getElementById('investigationReviewSection');
    if (investigationSection) {
        if (investigatingOfficer || additionalComments) {
            investigationSection.style.display = 'block';
        } else {
            investigationSection.style.display = 'none';
        }
    }
    
    // Selected Sections
    const reviewSections = document.getElementById('reviewSections');
    if (reviewSections) {
        reviewSections.innerHTML = '';
        
        if (selectedSectionNumbers.length === 0) {
            reviewSections.innerHTML = '<p class="no-sections">No sections selected</p>';
        } else {
            selectedSectionNumbers.forEach(sectionNum => {
                const section = suggestedSections.find(s => s.section_number == sectionNum);
                if (section) {
                    const p = document.createElement('p');
                    p.innerHTML = `<strong>IPC ${section.section_number}:</strong> ${section.section_title}`;
                    reviewSections.appendChild(p);
                }
            });
        }
    }
}
    
    // Helper function to safely set review content
    function setReviewContent(elementId, content) {
        const element = document.getElementById(elementId);
        if (element) {
            element.textContent = content || 'Not provided';
        }
    }
    
    // Submit FIR
    async function submitFIR() {
        if (!submitFIRBtn) return;
        
        const originalText = submitFIRBtn.textContent;
        submitFIRBtn.disabled = true;
        submitFIRBtn.textContent = 'Generating FIR...';
        
        try {
            // Collect form data
            const formData = {
                police_station: "Local Police Station",
                district: "District", 
                state: "State",
                incident_type: document.getElementById('incidentType')?.value || '',
                incident_date: document.getElementById('incidentDate')?.value || '',
                incident_time: document.getElementById('incidentTime')?.value || '',
                location: document.getElementById('location')?.value || '',
                incident_description: document.getElementById('incidentDescription')?.value || '',
                victim_name: document.getElementById('victimName')?.value || '',
                victim_contact: document.getElementById('victimContact')?.value || '',
                victim_address: document.getElementById('victimAddress')?.value || '',
                victim_age: document.getElementById('victimAge')?.value || '',
                victim_gender: document.getElementById('victimGender')?.value || '',
                accused_name: document.getElementById('accusedName')?.value || '',
                accused_description: document.getElementById('accusedDescription')?.value || '',
                sections_applied: [],
                investigating_officer: document.getElementById('investigatingOfficer')?.value || 'Investigation Officer',
                additional_comments: document.getElementById('additionalComments')?.value || ''
            };
            
            // Add selected sections
            selectedSectionNumbers.forEach(sectionNum => {
                const section = suggestedSections.find(s => s.section_number == sectionNum);
                if (section) {
                    formData.sections_applied.push(section);
                }
            });
            
            // Generate PDF
            const response = await fetch(`${FIR_API_URL}/generate-pdf`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(formData)
            });
            
            const data = await response.json();
            
            if (data.success) {
                currentFIRNumber = data.fir_number;
                alert(`FIR ${data.fir_number} generated successfully!`);
                goToStep(5);
                
                // Show download link
                const completionStep = document.querySelector('#formStep5 .completion-step');
                if (completionStep) {
                    completionStep.innerHTML += `
                        <div class="download-section">
                            <p>FIR Number: <strong>${data.fir_number}</strong></p>
                            <button class="download-btn" onclick="downloadFIR()">
                                <i class="material-icons">download</i> Download FIR PDF
                            </button>
                        </div>
                    `;
                }
            } else {
                alert('Error generating FIR: ' + (data.error || 'Unknown error'));
            }
            
        } catch (error) {
            alert('Error submitting FIR: ' + error.message);
        } finally {
            submitFIRBtn.disabled = false;
            submitFIRBtn.textContent = originalText;
        }
    }
    
    // Download FIR
    window.downloadFIR = function() {
        if (!currentFIRNumber) {
            alert('No FIR generated yet.');
            return;
        }
        
        const downloadFirNumber = currentFIRNumber.replace(/\//g, '_');
        const downloadUrl = `${FIR_API_URL}/download/${downloadFirNumber}`;
        window.open(downloadUrl, '_blank');
    }
    
    // Reset form
    function resetForm() {
        document.querySelectorAll('input, textarea, select').forEach(element => {
            if (element.type !== 'button' && element.id !== 'logoutBtn') {
                element.value = '';
            }
        });
        
        const selectedSectionsContainer = document.getElementById('selectedSections');
        if (selectedSectionsContainer) {
            selectedSectionsContainer.innerHTML = '<h4>Selected Sections:</h4><p class="no-sections">No sections selected yet.</p>';
        }
        
        suggestedSections = [];
        selectedSectionNumbers = [];
        currentFIRNumber = '';
        
        document.querySelectorAll('.section-card').forEach(card => {
            card.classList.remove('selected');
            const selectBtn = card.querySelector('.btn-select');
            if (selectBtn) {
                selectBtn.disabled = false;
                selectBtn.textContent = 'Select';
            }
        });
        
        goToStep(1);
    }
    
    // Event listeners
    if (nextStep1Btn) nextStep1Btn.addEventListener('click', function() {
        if (validateStep1()) {
            suggestSections();
            goToStep(2);
        }
    });
    
    if (nextStep2Btn) nextStep2Btn.addEventListener('click', function() {
        if (validateStep2()) goToStep(3);
    });
    
    if (nextStep3Btn) nextStep3Btn.addEventListener('click', function() {
        populateReviewData();
        goToStep(4);
    });
    
    if (prevStep2Btn) prevStep2Btn.addEventListener('click', () => goToStep(1));
    if (prevStep3Btn) prevStep3Btn.addEventListener('click', () => goToStep(2));
    if (prevStep4Btn) prevStep4Btn.addEventListener('click', () => goToStep(3));
    if (submitFIRBtn) submitFIRBtn.addEventListener('click', submitFIR);
    if (resetFormBtn) resetFormBtn.addEventListener('click', resetForm);
});