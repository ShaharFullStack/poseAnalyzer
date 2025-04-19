/**
 * Enhanced Gesture Logger - for tracking, analyzing, and displaying gesture detection events
 */
class GestureLogger {
    /** @type {HTMLElement} Log content container */
    logContent;
    
    /** @type {HTMLElement} Copy notification element */
    copyNotification;
    
    /** @type {Object} Active filters configuration */
    activeFilters;
    
    /** @type {Object} Previous landmark values for change detection */
    previousValues;
    
    /** @type {Object} Movement threshold settings */
    thresholds;
    
    /** @type {number} Maximum number of log entries to keep */
    maxLogEntries;
    
    /** @type {boolean} Whether to include milliseconds in timestamps */
    showMilliseconds;
    
    /** @type {boolean} Whether to display changes only */
    showChangesOnly;
    
    /** @type {Array} Log history buffer for statistics and pattern detection */
    logHistory;
    
    /** @type {Object} Statistics tracking for each landmark */
    landmarkStats;
    
    constructor() {
        // UI elements
        this.logContent = document.getElementById('log-content');
        this.copyNotification = document.getElementById('copy-notification');
        
        // Configuration
        this.activeFilters = {
            face: true,
            hand: true,
            pose: true,
            system: true,
            error: true
        };
        
        // Performance and usability settings
        this.maxLogEntries = 1000;
        this.showMilliseconds = true;
        this.showChangesOnly = false;
        
        // Movement detection
        this.thresholds = {
            position: 0.015,  // Min position change to be considered significant
            rotation: 0.05,   // Min rotation change to be considered significant
            visibility: 0.1   // Min visibility change to be considered significant
        };
        
        // Data tracking for analysis
        this.previousValues = {};
        this.logHistory = [];
        this.landmarkStats = {};
        
        // Initialize UI
        this.setupEventListeners();
        this.setupFilterUI();
        this.setupAdvancedOptions();
    }

    /**
     * Set up event listeners for logger controls
     */
    setupEventListeners() {
        const clearLogButton = document.getElementById('clear-log');
        const copyLogButton = document.getElementById('copy-log');
        
        clearLogButton.addEventListener('click', () => {
            this.clearLog();
        });
        
        copyLogButton.addEventListener('click', () => {
            this.copyLogToClipboard();
        });
    }
    
    /**
     * Set up UI for filtering landmark types
     */
    setupFilterUI() {
        // Create filter container
        const filterContainer = document.createElement('div');
        filterContainer.className = 'landmark-filter';
        
        // Add filter buttons
        const filterTypes = [
            { type: 'face', label: 'Face', icon: 'fa-face-smile' },
            { type: 'hand', label: 'Hands', icon: 'fa-hand' },
            { type: 'pose', label: 'Pose', icon: 'fa-person' },
            { type: 'system', label: 'System', icon: 'fa-gear' },
            { type: 'error', label: 'Errors', icon: 'fa-triangle-exclamation' }
        ];
        
        filterTypes.forEach(filter => {
            const button = document.createElement('button');
            button.className = 'filter-btn active';
            button.innerHTML = `<i class="fas ${filter.icon}"></i> ${filter.label}`;
            button.dataset.type = filter.type;
            
            button.addEventListener('click', () => {
                this.activeFilters[filter.type] = !this.activeFilters[filter.type];
                button.classList.toggle('active', this.activeFilters[filter.type]);
                this.applyFilters();
            });
            
            filterContainer.appendChild(button);
        });
        
        // Add export options
        const exportGroup = document.createElement('div');
        exportGroup.className = 'export-group';
        
        const exportCSVButton = document.createElement('button');
        exportCSVButton.innerHTML = '<i class="fas fa-file-csv"></i> CSV';
        exportCSVButton.addEventListener('click', () => {
            this.exportToCSV();
        });
        
        const exportJSONButton = document.createElement('button');
        exportJSONButton.innerHTML = '<i class="fas fa-file-code"></i> JSON';
        exportJSONButton.addEventListener('click', () => {
            this.exportToJSON();
        });
        
        exportGroup.appendChild(exportCSVButton);
        exportGroup.appendChild(exportJSONButton);
        filterContainer.appendChild(exportGroup);
        
        // Get log header and insert filter after it
        const logHeader = document.querySelector('.log-header');
        logHeader.insertAdjacentElement('afterend', filterContainer);
    }
    
    /**
     * Set up advanced options UI
     */
    setupAdvancedOptions() {
        // Create container for advanced options
        const optionsContainer = document.createElement('div');
        optionsContainer.className = 'advanced-options';
        
        // Add timestamp precision option
        const precisionToggle = document.createElement('div');
        precisionToggle.className = 'option-toggle';
        
        const precisionLabel = document.createElement('label');
        precisionLabel.htmlFor = 'toggle-ms';
        precisionLabel.textContent = 'Show milliseconds';
        
        const precisionCheckbox = document.createElement('input');
        precisionCheckbox.type = 'checkbox';
        precisionCheckbox.id = 'toggle-ms';
        precisionCheckbox.checked = this.showMilliseconds;
        precisionCheckbox.addEventListener('change', (e) => {
            this.showMilliseconds = e.target.checked;
            // We don't need to refresh existing logs, just affects new ones
        });
        
        precisionToggle.appendChild(precisionLabel);
        precisionToggle.appendChild(precisionCheckbox);
        
        // Add change detection option
        const changeToggle = document.createElement('div');
        changeToggle.className = 'option-toggle';
        
        const changeLabel = document.createElement('label');
        changeLabel.htmlFor = 'toggle-changes';
        changeLabel.textContent = 'Show significant changes only';
        
        const changeCheckbox = document.createElement('input');
        changeCheckbox.type = 'checkbox';
        changeCheckbox.id = 'toggle-changes';
        changeCheckbox.checked = this.showChangesOnly;
        changeCheckbox.addEventListener('change', (e) => {
            this.showChangesOnly = e.target.checked;
        });
        
        changeToggle.appendChild(changeLabel);
        changeToggle.appendChild(changeCheckbox);
        
        // Add threshold slider
        const thresholdControl = document.createElement('div');
        thresholdControl.className = 'threshold-control';
        
        const thresholdLabel = document.createElement('label');
        thresholdLabel.htmlFor = 'movement-threshold';
        thresholdLabel.textContent = 'Movement threshold: ';
        
        const thresholdValue = document.createElement('span');
        thresholdValue.id = 'threshold-value';
        thresholdValue.textContent = this.thresholds.position.toFixed(3);
        
        const thresholdSlider = document.createElement('input');
        thresholdSlider.type = 'range';
        thresholdSlider.id = 'movement-threshold';
        thresholdSlider.min = '0.001';
        thresholdSlider.max = '0.05';
        thresholdSlider.step = '0.001';
        thresholdSlider.value = this.thresholds.position;
        thresholdSlider.addEventListener('input', (e) => {
            const value = parseFloat(e.target.value);
            this.thresholds.position = value;
            thresholdValue.textContent = value.toFixed(3);
        });
        
        thresholdControl.appendChild(thresholdLabel);
        thresholdControl.appendChild(thresholdValue);
        thresholdControl.appendChild(thresholdSlider);
        
        // Add to options container
        optionsContainer.appendChild(precisionToggle);
        optionsContainer.appendChild(changeToggle);
        optionsContainer.appendChild(thresholdControl);
        
        // Add toggle button for advanced options
        const advancedToggle = document.createElement('button');
        advancedToggle.className = 'btn btn-primary advanced-toggle';
        advancedToggle.innerHTML = '<i class="fas fa-sliders"></i> Options';
        advancedToggle.addEventListener('click', () => {
            optionsContainer.classList.toggle('show');
        });
        
        // Add to header actions
        const headerActions = document.querySelector('.log-actions');
        headerActions.prepend(advancedToggle);
        
        // Add options container after filters
        const filterContainer = document.querySelector('.landmark-filter');
        filterContainer.insertAdjacentElement('afterend', optionsContainer);
        
        // Add statistics button
        const statsButton = document.createElement('button');
        statsButton.className = 'btn btn-info';
        statsButton.innerHTML = '<i class="fas fa-chart-line"></i> Stats';
        statsButton.addEventListener('click', () => {
            this.showStatistics();
        });
        
        headerActions.prepend(statsButton);
    }
    
    /**
     * Apply current filters to log entries
     */
    applyFilters() {
        const entries = this.logContent.querySelectorAll('.log-entry');
        
        entries.forEach(entry => {
            const typeMatch = entry.className.match(/log-type-(\w+)/);
            if (typeMatch) {
                const type = typeMatch[1];
                entry.style.display = this.activeFilters[type] ? '' : 'none';
            }
        });
    }

    /**
     * Get precision timestamp based on current settings
     * @returns {string} Formatted timestamp
     */
    getTimestamp() {
        const now = new Date();
        
        if (this.showMilliseconds) {
            return now.toLocaleTimeString() + '.' + now.getMilliseconds().toString().padStart(3, '0');
        } else {
            return now.toLocaleTimeString();
        }
    }
    
    /**
     * Check if the current coordinate change is significant
     * @param {string} id - Unique identifier for the landmark
     * @param {Object} coords - Current coordinates
     * @returns {boolean} Whether the change is significant
     */
    isSignificantChange(id, coords) {
        if (!this.showChangesOnly) return true;
        
        if (!this.previousValues[id]) {
            this.previousValues[id] = coords;
            return true;
        }
        
        const prev = this.previousValues[id];
        const xDiff = Math.abs(prev.x - coords.x);
        const yDiff = Math.abs(prev.y - coords.y);
        const zDiff = Math.abs(prev.z - coords.z);
        
        // Check if any dimension exceeds threshold
        const isSignificant = 
            xDiff > this.thresholds.position || 
            yDiff > this.thresholds.position || 
            zDiff > this.thresholds.position;
        
        // Update previous values if change is significant
        if (isSignificant) {
            this.previousValues[id] = coords;
        }
        
        return isSignificant;
    }
    
    /**
     * Analyze movement direction from previous position
     * @param {string} id - Unique identifier for the landmark
     * @param {Object} coords - Current coordinates
     * @returns {string} Movement description
     */
    getMovementDescription(id, coords) {
        if (!this.previousValues[id]) return '';
        
        const prev = this.previousValues[id];
        const movements = [];
        
        // X axis (left/right)
        if (coords.x - prev.x > this.thresholds.position) {
            movements.push('→');
        } else if (prev.x - coords.x > this.thresholds.position) {
            movements.push('←');
        }
        
        // Y axis (up/down)
        if (coords.y - prev.y > this.thresholds.position) {
            movements.push('↓');
        } else if (prev.y - coords.y > this.thresholds.position) {
            movements.push('↑');
        }
        
        // Z axis (forward/backward)
        if (coords.z - prev.z > this.thresholds.position) {
            movements.push('↗');
        } else if (prev.z - coords.z > this.thresholds.position) {
            movements.push('↘');
        }
        
        return movements.join('');
    }
    
    /**
     * Calculate velocity from previous position and time
     * @param {string} id - Unique identifier for the landmark
     * @param {Object} coords - Current coordinates
     * @returns {Object|null} Velocity vector or null if not available
     */
    calculateVelocity(id, coords) {
        if (!this.previousValues[id] || !this.previousValues[id].timestamp) {
            this.previousValues[id] = {
                ...coords,
                timestamp: performance.now()
            };
            return null;
        }
        
        const prev = this.previousValues[id];
        const currentTime = performance.now();
        const timeDiff = (currentTime - prev.timestamp) / 1000; // Convert to seconds
        
        if (timeDiff <= 0) return null;
        
        const velocity = {
            x: Math.abs((coords.x - prev.x) / timeDiff),
            y: Math.abs((coords.y - prev.y) / timeDiff),
            z: Math.abs((coords.z - prev.z) / timeDiff),
            magnitude: 0
        };
        
        // Calculate magnitude of velocity (3D)
        velocity.magnitude = Math.sqrt(
            velocity.x * velocity.x + 
            velocity.y * velocity.y + 
            velocity.z * velocity.z
        );
        
        // Update previous values with timestamp
        this.previousValues[id] = {
            ...coords,
            timestamp: currentTime
        };
        
        return velocity;
    }
    
    /**
     * Update statistics for a landmark
     * @param {string} id - Unique identifier for the landmark
     * @param {Object} coords - Current coordinates
     * @param {Object} velocity - Velocity data
     */
    updateStatistics(id, coords, velocity) {
        if (!this.landmarkStats[id]) {
            this.landmarkStats[id] = {
                count: 0,
                minX: coords.x,
                maxX: coords.x,
                minY: coords.y,
                maxY: coords.y,
                minZ: coords.z,
                maxZ: coords.z,
                totalVelocity: 0,
                maxVelocity: 0
            };
        }
        
        const stats = this.landmarkStats[id];
        stats.count++;
        
        // Update position ranges
        stats.minX = Math.min(stats.minX, coords.x);
        stats.maxX = Math.max(stats.maxX, coords.x);
        stats.minY = Math.min(stats.minY, coords.y);
        stats.maxY = Math.max(stats.maxY, coords.y);
        stats.minZ = Math.min(stats.minZ, coords.z);
        stats.maxZ = Math.max(stats.maxZ, coords.z);
        
        // Update velocity statistics
        if (velocity) {
            stats.totalVelocity += velocity.magnitude;
            stats.maxVelocity = Math.max(stats.maxVelocity, velocity.magnitude);
        }
    }

    /**
     * Log a detected gesture to the UI with enhanced information
     * @param {string} type - Gesture type (Face, Hand, Pose, System, Error)
     * @param {string} name - Name of the gesture
     * @param {string} confidence - Confidence score (optional)
     * @param {string} icon - FontAwesome icon class (optional)
     */
    logGesture(type, name, confidence = '', icon = '') {
        // Manage log entry limit
        if (this.logContent.childElementCount > this.maxLogEntries) {
            // Remove oldest entries when limit is reached
            while (this.logContent.childElementCount > this.maxLogEntries) {
                if (this.logContent.firstChild) {
                    this.logContent.removeChild(this.logContent.firstChild);
                } else {
                    break;
                }
            }
        }
        
        const timestamp = this.getTimestamp();
        
        // Extract coordinate data if present
        let coords = null;
        let landmarkId = '';
        let movement = '';
        let velocity = null;
        
        // Process landmark data in coordinate logs
        if ((type === 'Face' || type === 'Hand' || type === 'Pose') && 
            name.includes('[') && name.includes('x=')) {
            
            // Extract landmark name and index
            const landmarkMatch = name.match(/(.*?) \[(\d+)\]:/);
            if (landmarkMatch) {
                const landmarkName = landmarkMatch[1].trim();
                const landmarkIndex = landmarkMatch[2];
                landmarkId = `${type.toLowerCase()}-${landmarkName}-${landmarkIndex}`;
                
                // Extract coordinates
                const coordsMatch = name.match(/x=([\d\.-]+), y=([\d\.-]+), z=([\d\.-]+)(?:, vis=([\d\.-]+))?/);
                if (coordsMatch) {
                    coords = {
                        x: parseFloat(coordsMatch[1]),
                        y: parseFloat(coordsMatch[2]),
                        z: parseFloat(coordsMatch[3]),
                        visibility: coordsMatch[4] ? parseFloat(coordsMatch[4]) : null
                    };
                    
                    // Check if change is significant
                    if (!this.isSignificantChange(landmarkId, coords)) {
                        return; // Skip logging if change is not significant
                    }
                    
                    // Calculate movement description and velocity
                    movement = this.getMovementDescription(landmarkId, coords);
                    velocity = this.calculateVelocity(landmarkId, coords);
                    
                    // Update statistics
                    this.updateStatistics(landmarkId, coords, velocity);
                }
            }
        }
        
        // Create log entry element
        const logLine = document.createElement('div');
        logLine.className = `log-entry log-type-${type.toLowerCase()}`;
        
        // Store data attributes for filtering and JSON export
        if (coords) {
            logLine.dataset.x = coords.x;
            logLine.dataset.y = coords.y;
            logLine.dataset.z = coords.z;
            if (coords.visibility !== null) {
                logLine.dataset.visibility = coords.visibility;
            }
            
            if (velocity) {
                logLine.dataset.velocity = velocity.magnitude.toFixed(3);
            }
        }
        
        logLine.dataset.timestamp = new Date().toISOString();
        logLine.dataset.type = type;
        
        // Apply filters immediately
        if (!this.activeFilters[type.toLowerCase()]) {
            logLine.style.display = 'none';
        }
        
        // Add icon if provided
        if (icon) {
            const iconElement = document.createElement('i');
            iconElement.className = `fas ${icon} gesture-icon`;
            logLine.appendChild(iconElement);
        }
        
        // Create timestamp span
        const timestampSpan = document.createElement('span');
        timestampSpan.className = 'log-timestamp';
        timestampSpan.textContent = `[${timestamp}]`;
        logLine.appendChild(timestampSpan);
        
        // Create type span
        const typeSpan = document.createElement('span');
        typeSpan.className = 'log-type';
        typeSpan.textContent = ` ${type}: `;
        logLine.appendChild(typeSpan);
        
        // Create content span
        const contentSpan = document.createElement('span');
        contentSpan.className = 'log-content-text';
        contentSpan.textContent = name;
        logLine.appendChild(contentSpan);
        
        // Add velocity indicator if available
        if (velocity && velocity.magnitude > 0) {
            const velocitySpan = document.createElement('span');
            velocitySpan.className = 'log-velocity';
            
            // Color based on velocity
            const velocityValue = velocity.magnitude;
            let velocityClass = 'low-velocity';
            
            if (velocityValue > 1.0) {
                velocityClass = 'high-velocity';
            } else if (velocityValue > 0.5) {
                velocityClass = 'medium-velocity';
            }
            
            velocitySpan.classList.add(velocityClass);
            velocitySpan.textContent = ` (v=${velocityValue.toFixed(2)})`;
            logLine.appendChild(velocitySpan);
        }
        
        // Add confidence if provided
        if (confidence) {
            const confidenceSpan = document.createElement('span');
            confidenceSpan.className = 'log-confidence';
            confidenceSpan.textContent = ` (conf: ${confidence})`;
            logLine.appendChild(confidenceSpan);
        }
        
        // Add movement indicators if available
        if (movement) {
            const movementSpan = document.createElement('span');
            movementSpan.className = 'log-movement';
            movementSpan.textContent = ` ${movement}`;
            logLine.appendChild(movementSpan);
        }
        
        // Add copy button for landmark data
        if (coords) {
            const copyButton = document.createElement('button');
            copyButton.className = 'btn-copy-data';
            copyButton.innerHTML = '<i class="fas fa-copy"></i>';
            copyButton.title = 'Copy landmark data';
            copyButton.onclick = (e) => {
                e.stopPropagation();
                
                // Create JSON representation
                const dataToCopy = JSON.stringify({
                    type: type,
                    landmark: landmarkId,
                    coordinates: coords,
                    velocity: velocity,
                    timestamp: new Date().toISOString()
                }, null, 2);
                
                navigator.clipboard.writeText(dataToCopy);
                
                // Show mini notification
                copyButton.innerHTML = '<i class="fas fa-check"></i>';
                setTimeout(() => {
                    copyButton.innerHTML = '<i class="fas fa-copy"></i>';
                }, 1000);
            };
            logLine.appendChild(copyButton);
            
            // Add visualization button
            const visualizeButton = document.createElement('button');
            visualizeButton.className = 'btn-visualize-data';
            visualizeButton.innerHTML = '<i class="fas fa-chart-simple"></i>';
            visualizeButton.title = 'Visualize data';
            visualizeButton.onclick = (e) => {
                e.stopPropagation();
                this.visualizeLandmark(landmarkId);
            };
            logLine.appendChild(visualizeButton);
        }
        
        // Add to log content
        this.logContent.appendChild(logLine);
        
        // Store in log history buffer (limited size)
        this.logHistory.push({
            type: type,
            name: name,
            timestamp: new Date(),
            landmarkId: landmarkId,
            coords: coords,
            velocity: velocity,
            movement: movement
        });
        
        if (this.logHistory.length > 100) {
            this.logHistory.shift(); // Remove oldest entry
        }
        
        // Auto-scroll to bottom (if already at bottom)
        const isAtBottom = this.logContent.scrollHeight - this.logContent.clientHeight <= 
                          this.logContent.scrollTop + 50;
                          
        if (isAtBottom) {
            this.logContent.scrollTop = this.logContent.scrollHeight;
        }
    }

    /**
     * Clear the log content
     */
    clearLog() {
        this.logContent.innerHTML = '';
        this.logGesture('System', 'Log cleared', '', 'fa-trash');
        
        // Reset tracking data
        this.previousValues = {};
        this.logHistory = [];
        this.landmarkStats = {};
    }

    /**
     * Copy log content to clipboard
     */
    copyLogToClipboard() {
        const logText = this.logContent.innerText;
        
        // Copy to clipboard
        navigator.clipboard.writeText(logText).then(() => {
            // Show notification
            this.copyNotification.classList.add('show');
            
            // Hide notification after 2 seconds
            setTimeout(() => {
                this.copyNotification.classList.remove('show');
            }, 2000);
            
            this.logGesture('System', 'Log copied to clipboard', '', 'fa-copy');
        }).catch(err => {
            console.error('Failed to copy log:', err);
            this.logGesture('Error', 'Failed to copy log: ' + err.message, '', 'fa-exclamation-triangle');
        });
    }
    
    /**
     * Export log data to CSV file
     */
    exportToCSV() {
        // Get all visible landmark entries
        const entries = Array.from(this.logContent.querySelectorAll('.log-entry')).filter(
            entry => entry.style.display !== 'none' && 
            (entry.classList.contains('log-type-face') || 
             entry.classList.contains('log-type-hand') || 
             entry.classList.contains('log-type-pose'))
        );
        
        if (entries.length === 0) {
            this.logGesture('Error', 'No landmark data to export', '', 'fa-exclamation-triangle');
            return;
        }
        
        // CSV header - extended with velocity and movement data
        let csv = 'timestamp,type,landmark,index,x,y,z,visibility,velocity,movement\n';
        
        // Process each entry
        entries.forEach(entry => {
            const text = entry.textContent;
            
            // Extract timestamp
            const timestampMatch = text.match(/\[(.*?)\]/);
            const timestamp = timestampMatch ? timestampMatch[1] : '';
            
            // Extract type
            const typeMatch = text.match(/\] (Face|Hand|Pose):/);
            const type = typeMatch ? typeMatch[1] : '';
            
            // Extract landmark name and index
            const landmarkMatch = text.match(/(.*?) \[(\d+)\]:/);
            if (!landmarkMatch) return;
            
            const landmarkName = landmarkMatch[1].trim();
            const landmarkIndex = landmarkMatch[2];
            
            // Extract coordinates
            const coordsMatch = text.match(/x=([\d\.-]+), y=([\d\.-]+), z=([\d\.-]+)(?:, vis=([\d\.-]+))?/);
            if (!coordsMatch) return;
            
            const x = coordsMatch[1];
            const y = coordsMatch[2];
            const z = coordsMatch[3];
            const visibility = coordsMatch[4] || 'N/A';
            
            // Extract velocity if available
            let velocity = 'N/A';
            const velocityMatch = text.match(/\(v=([\d\.-]+)\)/);
            if (velocityMatch) {
                velocity = velocityMatch[1];
            }
            
            // Extract movement
            let movement = '';
            const movementMatch = text.match(/([←→↑↓↗↘]+)/);
            if (movementMatch) {
                movement = movementMatch[1];
            }
            
            // Add to CSV
            csv += `${timestamp},${type},${landmarkName},${landmarkIndex},${x},${y},${z},${visibility},${velocity},${movement}\n`;
        });
        
        // Create download link
        const blob = new Blob([csv], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        
        // Current date/time for filename
        const now = new Date();
        const filename = `landmarks_${now.getFullYear()}-${(now.getMonth()+1).toString().padStart(2, '0')}-${now.getDate().toString().padStart(2, '0')}_${now.getHours().toString().padStart(2, '0')}-${now.getMinutes().toString().padStart(2, '0')}.csv`;
        
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        
        // Clean up
        setTimeout(() => {
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
        }, 0);
        
        this.logGesture('System', `Exported to ${filename}`, '', 'fa-file-export');
    }
    
    /**
     * Export log data to JSON file
     */
    exportToJSON() {
        // Get all visible landmark entries with data attributes
        const entries = Array.from(this.logContent.querySelectorAll('.log-entry')).filter(
            entry => entry.style.display !== 'none' && 
            (entry.classList.contains('log-type-face') || 
             entry.classList.contains('log-type-hand') || 
             entry.classList.contains('log-type-pose'))
        );
        
        if (entries.length === 0) {
            this.logGesture('Error', 'No landmark data to export', '', 'fa-exclamation-triangle');
            return;
        }
        
        // Process entries into structured JSON data
        const jsonData = {
            metadata: {
                exportDate: new Date().toISOString(),
                totalEntries: entries.length,
                device: navigator.userAgent
            },
            landmarks: []
        };
        
        // Process each entry
        entries.forEach(entry => {
            const text = entry.textContent;
            
            // Extract timestamp
            const timestampMatch = text.match(/\[(.*?)\]/);
            const displayTimestamp = timestampMatch ? timestampMatch[1] : '';
            
            // Use ISO timestamp if available in dataset
            const isoTimestamp = entry.dataset.timestamp || new Date().toISOString();
            
            // Extract type
            const typeMatch = text.match(/\] (Face|Hand|Pose):/);
            const type = typeMatch ? typeMatch[1] : '';
            
            // Extract landmark name and index
            const landmarkMatch = text.match(/(.*?) \[(\d+)\]:/);
            if (!landmarkMatch) return;
            
            const landmarkName = landmarkMatch[1].trim();
            const landmarkIndex = landmarkMatch[2];
            
            // Get coordinates from data attributes if available, otherwise extract from text
            let coords = null;
            
            if (entry.dataset.x && entry.dataset.y && entry.dataset.z) {
                coords = {
                    x: parseFloat(entry.dataset.x),
                    y: parseFloat(entry.dataset.y),
                    z: parseFloat(entry.dataset.z)
                };
                
                if (entry.dataset.visibility) {
                    coords.visibility = parseFloat(entry.dataset.visibility);
                }
            } else {
                // Extract from text content
                const coordsMatch = text.match(/x=([\d\.-]+), y=([\d\.-]+), z=([\d\.-]+)(?:, vis=([\d\.-]+))?/);
                if (coordsMatch) {
                    coords = {
                        x: parseFloat(coordsMatch[1]),
                        y: parseFloat(coordsMatch[2]),
                        z: parseFloat(coordsMatch[3]),
                    };
                    
                    if (coordsMatch[4]) {
                        coords.visibility = parseFloat(coordsMatch[4]);
                    }
                }
            }
            
            // Extract velocity
            let velocity = null;
            if (entry.dataset.velocity) {
                velocity = parseFloat(entry.dataset.velocity);
            } else {
                const velocityMatch = text.match(/\(v=([\d\.-]+)\)/);
                if (velocityMatch) {
                    velocity = parseFloat(velocityMatch[1]);
                }
            }
            
            // Extract movement
            let movement = '';
            const movementMatch = text.match(/([←→↑↓↗↘]+)/);
            if (movementMatch) {
                movement = movementMatch[1];
            }
            
            // Add to JSON data
            jsonData.landmarks.push({
                timestamp: isoTimestamp,
                displayTimestamp: displayTimestamp,
                type: type,
                name: landmarkName,
                index: parseInt(landmarkIndex),
                coordinates: coords,
                velocity: velocity,
                movement: movement
            });
        });
        
        // Create download link
        const blob = new Blob([JSON.stringify(jsonData, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        
        // Current date/time for filename
        const now = new Date();
        const filename = `landmarks_${now.getFullYear()}-${(now.getMonth()+1).toString().padStart(2, '0')}-${now.getDate().toString().padStart(2, '0')}_${now.getHours().toString().padStart(2, '0')}-${now.getMinutes().toString().padStart(2, '0')}.json`;
        
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        
        // Clean up
        setTimeout(() => {
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
        }, 0);
        
        this.logGesture('System', `Exported to ${filename}`, '', 'fa-file-export');
    }
    
    /**
     * Show statistics modal with landmark data
     */
    showStatistics() {
        // Create modal container if it doesn't exist
        let statsModal = document.getElementById('stats-modal');
        
        if (!statsModal) {
            statsModal = document.createElement('div');
            statsModal.id = 'stats-modal';
            statsModal.className = 'stats-modal';
            
            // Add modal header
            const modalHeader = document.createElement('div');
            modalHeader.className = 'stats-modal-header';
            
            const modalTitle = document.createElement('h3');
            modalTitle.textContent = 'Landmark Statistics';
            
            const closeButton = document.createElement('button');
            closeButton.innerHTML = '<i class="fas fa-times"></i>';
            closeButton.addEventListener('click', () => {
                statsModal.classList.remove('show');
            });
            
            modalHeader.appendChild(modalTitle);
            modalHeader.appendChild(closeButton);
            
            // Add modal content
            const modalContent = document.createElement('div');
            modalContent.className = 'stats-modal-content';
            modalContent.id = 'stats-content';
            
            statsModal.appendChild(modalHeader);
            statsModal.appendChild(modalContent);
            
            document.body.appendChild(statsModal);
        }
        
        // Get modal content element
        const statsContent = document.getElementById('stats-content');
        statsContent.innerHTML = '';
        
        // Generate statistics
        if (Object.keys(this.landmarkStats).length === 0) {
            statsContent.innerHTML = '<p>No landmark data available yet.</p>';
        } else {
            // Create tabs for different types
            const tabContainer = document.createElement('div');
            tabContainer.className = 'stats-tabs';
            
            const tabContent = document.createElement('div');
            tabContent.className = 'stats-tab-content';
            
            // Group by type (Face, Hand, Pose)
            const groupedStats = {
                'Face': {},
                'Hand': {},
                'Pose': {}
            };
            
            // Sort landmarks into groups
            Object.keys(this.landmarkStats).forEach(id => {
                if (id.startsWith('face-')) {
                    groupedStats['Face'][id] = this.landmarkStats[id];
                } else if (id.startsWith('hand-')) {
                    groupedStats['Hand'][id] = this.landmarkStats[id];
                } else if (id.startsWith('pose-')) {
                    groupedStats['Pose'][id] = this.landmarkStats[id];
                }
            });
            
            // Create tabs
            Object.keys(groupedStats).forEach((type, index) => {
                const tab = document.createElement('button');
                tab.className = 'stats-tab';
                if (index === 0) tab.classList.add('active');
                tab.textContent = type;
                tab.dataset.type = type;
                
                tab.addEventListener('click', (e) => {
                    // Remove active class from all tabs
                    document.querySelectorAll('.stats-tab').forEach(t => {
                        t.classList.remove('active');
                    });
                    
                    // Hide all content
                    document.querySelectorAll('.stats-panel').forEach(p => {
                        p.style.display = 'none';
                    });
                    
                    // Activate clicked tab
                    e.target.classList.add('active');
                    
                    // Show corresponding content
                    const panel = document.getElementById(`stats-panel-${e.target.dataset.type.toLowerCase()}`);
                    if (panel) {
                        panel.style.display = 'block';
                    }
                });
                
                tabContainer.appendChild(tab);
            });
            
            statsContent.appendChild(tabContainer);
            
            // Create content for each type
            Object.keys(groupedStats).forEach((type, index) => {
                const panel = document.createElement('div');
                panel.id = `stats-panel-${type.toLowerCase()}`;
                panel.className = 'stats-panel';
                panel.style.display = index === 0 ? 'block' : 'none';
                
                const stats = groupedStats[type];
                
                if (Object.keys(stats).length === 0) {
                    panel.innerHTML = `<p>No ${type} landmarks have been tracked yet.</p>`;
                } else {
                    // Create a table for statistics
                    const table = document.createElement('table');
                    table.className = 'stats-table';
                    
                    // Add header
                    const thead = document.createElement('thead');
                    thead.innerHTML = `
                        <tr>
                            <th>Landmark</th>
                            <th>Samples</th>
                            <th>X Range</th>
                            <th>Y Range</th>
                            <th>Z Range</th>
                            <th>Avg Velocity</th>
                            <th>Max Velocity</th>
                        </tr>
                    `;
                    table.appendChild(thead);
                    
                    // Add rows
                    const tbody = document.createElement('tbody');
                    
                    Object.keys(stats).forEach(id => {
                        const data = stats[id];
                        const landmark = id.split('-')[1]; // Extract landmark name
                        
                        const row = document.createElement('tr');
                        
                        // Calculate average velocity
                        const avgVelocity = data.count > 0 ? data.totalVelocity / data.count : 0;
                        
                        row.innerHTML = `
                            <td>${landmark}</td>
                            <td>${data.count}</td>
                            <td>${data.minX.toFixed(3)} - ${data.maxX.toFixed(3)}</td>
                            <td>${data.minY.toFixed(3)} - ${data.maxY.toFixed(3)}</td>
                            <td>${data.minZ.toFixed(3)} - ${data.maxZ.toFixed(3)}</td>
                            <td>${avgVelocity.toFixed(3)}</td>
                            <td>${data.maxVelocity.toFixed(3)}</td>
                        `;
                        
                        tbody.appendChild(row);
                    });
                    
                    table.appendChild(tbody);
                    panel.appendChild(table);
                }
                
                tabContent.appendChild(panel);
            });
            
            statsContent.appendChild(tabContent);
        }
        
        // Show modal
        statsModal.classList.add('show');
    }
    
    /**
     * Visualize movement data for a specific landmark
     * @param {string} landmarkId - ID of the landmark to visualize
     */
    visualizeLandmark(landmarkId) {
        // Filter log history for this landmark
        const landmarkData = this.logHistory.filter(entry => entry.landmarkId === landmarkId);
        
        if (landmarkData.length < 2) {
            this.logGesture('Error', 'Not enough data to visualize this landmark', '', 'fa-exclamation-triangle');
            return;
        }
        
        // Extract landmark name for the title
        const nameMatch = landmarkId.match(/^(?:\w+)-(.+)-\d+$/);
        const landmarkName = nameMatch ? nameMatch[1] : landmarkId;
        
        // Create visualization modal
        let vizModal = document.getElementById('viz-modal');
        
        if (!vizModal) {
            vizModal = document.createElement('div');
            vizModal.id = 'viz-modal';
            vizModal.className = 'viz-modal';
            
            // Add modal header
            const modalHeader = document.createElement('div');
            modalHeader.className = 'viz-modal-header';
            
            const modalTitle = document.createElement('h3');
            modalTitle.id = 'viz-title';
            modalTitle.textContent = 'Movement Visualization';
            
            const closeButton = document.createElement('button');
            closeButton.innerHTML = '<i class="fas fa-times"></i>';
            closeButton.addEventListener('click', () => {
                vizModal.classList.remove('show');
            });
            
            modalHeader.appendChild(modalTitle);
            modalHeader.appendChild(closeButton);
            
            // Add modal content
            const modalContent = document.createElement('div');
            modalContent.className = 'viz-modal-content';
            
            // Add canvas for visualization
            const canvas = document.createElement('canvas');
            canvas.id = 'viz-canvas';
            canvas.width = 500;
            canvas.height = 400;
            
            modalContent.appendChild(canvas);
            
            // Add controls
            const controls = document.createElement('div');
            controls.className = 'viz-controls';
            
            // Add axis selector
            const axisSelector = document.createElement('div');
            axisSelector.className = 'viz-axis-selector';
            
            const axisLabel = document.createElement('span');
            axisLabel.textContent = 'View: ';
            
            const axisXYButton = document.createElement('button');
            axisXYButton.textContent = 'X-Y (Front)';
            axisXYButton.classList.add('active');
            axisXYButton.addEventListener('click', () => {
                document.querySelectorAll('.viz-axis-selector button').forEach(btn => {
                    btn.classList.remove('active');
                });
                axisXYButton.classList.add('active');
                this.renderVisualization(landmarkData, 'xy');
            });
            
            const axisXZButton = document.createElement('button');
            axisXZButton.textContent = 'X-Z (Top)';
            axisXZButton.addEventListener('click', () => {
                document.querySelectorAll('.viz-axis-selector button').forEach(btn => {
                    btn.classList.remove('active');
                });
                axisXZButton.classList.add('active');
                this.renderVisualization(landmarkData, 'xz');
            });
            
            const axisYZButton = document.createElement('button');
            axisYZButton.textContent = 'Y-Z (Side)';
            axisYZButton.addEventListener('click', () => {
                document.querySelectorAll('.viz-axis-selector button').forEach(btn => {
                    btn.classList.remove('active');
                });
                axisYZButton.classList.add('active');
                this.renderVisualization(landmarkData, 'yz');
            });
            
            axisSelector.appendChild(axisLabel);
            axisSelector.appendChild(axisXYButton);
            axisSelector.appendChild(axisXZButton);
            axisSelector.appendChild(axisYZButton);
            
            controls.appendChild(axisSelector);
            modalContent.appendChild(controls);
            
            vizModal.appendChild(modalHeader);
            vizModal.appendChild(modalContent);
            
            document.body.appendChild(vizModal);
        }
        
        // Update modal title
        document.getElementById('viz-title').textContent = `Movement: ${landmarkName}`;
        
        // Show modal
        vizModal.classList.add('show');
        
        // Render visualization (default to XY view)
        this.renderVisualization(landmarkData, 'xy');
    }
    
    /**
     * Render visualization of landmark movement
     * @param {Array} data - Array of landmark data points
     * @param {string} view - View type ('xy', 'xz', or 'yz')
     */
    renderVisualization(data, view) {
        const canvas = document.getElementById('viz-canvas');
        const ctx = canvas.getContext('2d');
        
        // Clear canvas
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        // Set up coordinate mapping
        const padding = 40;
        const width = canvas.width - padding * 2;
        const height = canvas.height - padding * 2;
        
        // Extract coordinates based on view
        let coords = [];
        let axisLabels = [];
        
        switch (view) {
            case 'xy':
                coords = data.map(entry => {
                    return { 
                        x: entry.coords?.x || 0, 
                        y: entry.coords?.y || 0 
                    };
                });
                axisLabels = ['X', 'Y'];
                break;
            case 'xz':
                coords = data.map(entry => {
                    return { 
                        x: entry.coords?.x || 0, 
                        y: entry.coords?.z || 0 
                    };
                });
                axisLabels = ['X', 'Z'];
                break;
            case 'yz':
                coords = data.map(entry => {
                    return { 
                        x: entry.coords?.y || 0, 
                        y: entry.coords?.z || 0 
                    };
                });
                axisLabels = ['Y', 'Z'];
                break;
        }
        
        // Find min and max values for scaling
        let minX = Math.min(...coords.map(c => c.x));
        let maxX = Math.max(...coords.map(c => c.x));
        let minY = Math.min(...coords.map(c => c.y));
        let maxY = Math.max(...coords.map(c => c.y));
        
        // Add some padding to the ranges
        const paddingFactor = 0.1;
        const rangeX = maxX - minX || 1; // Prevent division by zero
        const rangeY = maxY - minY || 1;
        
        minX -= rangeX * paddingFactor;
        maxX += rangeX * paddingFactor;
        minY -= rangeY * paddingFactor;
        maxY += rangeY * paddingFactor;
        
        // Helper function to convert coordinates to canvas position
        const mapToCanvas = (x, y) => {
            const canvasX = padding + (x - minX) / (maxX - minX) * width;
            const canvasY = padding + (maxY - y) / (maxY - minY) * height; // Invert Y axis
            return { x: canvasX, y: canvasY };
        };
        
        // Draw axes
        ctx.strokeStyle = '#cccccc';
        ctx.lineWidth = 1;
        ctx.beginPath();
        
        // X axis
        ctx.moveTo(padding, canvas.height - padding);
        ctx.lineTo(canvas.width - padding, canvas.height - padding);
        
        // Y axis
        ctx.moveTo(padding, canvas.height - padding);
        ctx.lineTo(padding, padding);
        
        ctx.stroke();
        
        // Draw axes labels
        ctx.fillStyle = '#666666';
        ctx.font = '12px Arial';
        ctx.textAlign = 'center';
        
        // X axis label
        ctx.fillText(axisLabels[0], canvas.width / 2, canvas.height - 10);
        
        // Y axis label
        ctx.save();
        ctx.translate(10, canvas.height / 2);
        ctx.rotate(-Math.PI / 2);
        ctx.fillText(axisLabels[1], 0, 0);
        ctx.restore();
        
        // Draw axis ticks and values
        ctx.textAlign = 'right';
        
        // Y axis ticks
        for (let i = 0; i <= 5; i++) {
            const y = minY + (maxY - minY) * i / 5;
            const pos = mapToCanvas(minX, y);
            
            ctx.beginPath();
            ctx.moveTo(pos.x, pos.y);
            ctx.lineTo(pos.x - 5, pos.y);
            ctx.stroke();
            
            ctx.fillText(y.toFixed(2), pos.x - 8, pos.y + 4);
        }
        
        // X axis ticks
        ctx.textAlign = 'center';
        for (let i = 0; i <= 5; i++) {
            const x = minX + (maxX - minX) * i / 5;
            const pos = mapToCanvas(x, minY);
            
            ctx.beginPath();
            ctx.moveTo(pos.x, pos.y);
            ctx.lineTo(pos.x, pos.y + 5);
            ctx.stroke();
            
            ctx.fillText(x.toFixed(2), pos.x, pos.y + 16);
        }
        
        // Draw movement path
        if (coords.length > 1) {
            ctx.strokeStyle = 'rgba(92, 107, 192, 0.8)';
            ctx.lineWidth = 2;
            ctx.beginPath();
            
            const start = mapToCanvas(coords[0].x, coords[0].y);
            ctx.moveTo(start.x, start.y);
            
            for (let i = 1; i < coords.length; i++) {
                const pos = mapToCanvas(coords[i].x, coords[i].y);
                ctx.lineTo(pos.x, pos.y);
            }
            
            ctx.stroke();
            
            // Draw points
            for (let i = 0; i < coords.length; i++) {
                const pos = mapToCanvas(coords[i].x, coords[i].y);
                
                // Size based on index (more recent = larger)
                const pointSize = 3 + (i / coords.length) * 5;
                
                // Color gradient from green to red
                const hue = 120 - (i / (coords.length - 1)) * 120;
                ctx.fillStyle = `hsl(${hue}, 70%, 50%)`;
                
                ctx.beginPath();
                ctx.arc(pos.x, pos.y, pointSize, 0, Math.PI * 2);
                ctx.fill();
            }
            
            // Mark start and end points
            const startPos = mapToCanvas(coords[0].x, coords[0].y);
            const endPos = mapToCanvas(coords[coords.length - 1].x, coords[coords.length - 1].y);
            
            // Start point (green)
            ctx.fillStyle = '#4CAF50';
            ctx.beginPath();
            ctx.arc(startPos.x, startPos.y, 6, 0, Math.PI * 2);
            ctx.fill();
            
            // End point (red)
            ctx.fillStyle = '#F44336';
            ctx.beginPath();
            ctx.arc(endPos.x, endPos.y, 6, 0, Math.PI * 2);
            ctx.fill();
            
            // Labels
            ctx.fillStyle = '#000000';
            ctx.font = '12px Arial';
            ctx.textAlign = 'center';
            ctx.fillText('Start', startPos.x, startPos.y - 10);
            ctx.fillText('End', endPos.x, endPos.y - 10);
        }
    }
}

// Create global logger instance
export const gestureLogger = new GestureLogger()
