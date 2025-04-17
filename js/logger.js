/**
 * Logger module for tracking and displaying gesture detection events
 */
class GestureLogger {
    /** @type {HTMLElement} */
    logContent;
    
    /** @type {HTMLElement} */
    copyNotification;
    
    /** @type {Object} */
    activeFilters;
    
    constructor() {
        this.logContent = document.getElementById('log-content');
        this.copyNotification = document.getElementById('copy-notification');
        this.activeFilters = {
            face: true,
            hand: true,
            pose: true,
            system: true
        };
        
        // Set up event listeners for logger UI controls
        this.setupEventListeners();
        this.setupFilterUI();
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
            { type: 'system', label: 'System', icon: 'fa-gear' }
        ];
        
        filterTypes.forEach(filter => {
            const button = document.createElement('button');
            button.className = 'active';
            button.innerHTML = `<i class="fas ${filter.icon}"></i> ${filter.label}`;
            button.dataset.type = filter.type;
            
            button.addEventListener('click', () => {
                this.activeFilters[filter.type] = !this.activeFilters[filter.type];
                button.classList.toggle('active', this.activeFilters[filter.type]);
                this.applyFilters();
            });
            
            filterContainer.appendChild(button);
        });
        
        // Add export all button
        const exportButton = document.createElement('button');
        exportButton.innerHTML = '<i class="fas fa-file-export"></i> Export CSV';
        exportButton.addEventListener('click', () => {
            this.exportToCSV();
        });
        filterContainer.appendChild(exportButton);
        
        // Get log header and insert filter after it
        const logHeader = document.querySelector('.log-header');
        logHeader.insertAdjacentElement('afterend', filterContainer);
    }
    
    /**
     * Apply current filters to log entries
     */
    applyFilters() {
        const entries = this.logContent.querySelectorAll('.log-entry');
        
        entries.forEach(entry => {
            const type = entry.className.match(/log-type-(\w+)/)[1];
            entry.style.display = this.activeFilters[type] ? '' : 'none';
        });
    }

    /**
     * Log a detected gesture to the UI
     * @param {string} type - Gesture type (Face, Hand, Pose, System, Error)
     * @param {string} name - Name of the gesture
     * @param {string} confidence - Confidence score (optional)
     * @param {string} icon - FontAwesome icon class (optional)
     */
    logGesture(type, name, confidence = '', icon = '') {
        const timestamp = new Date().toLocaleTimeString();
        const logEntry = `[${timestamp}] ${type}: ${name}${confidence ? ' (conf: ' + confidence + ')' : ''}`;
        
        const logLine = document.createElement('div');
        logLine.className = `log-entry log-type-${type.toLowerCase()}`;
        
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
        
        // Add text content
        const textContent = document.createTextNode(logEntry);
        logLine.appendChild(textContent);
        
        // Add a copy button for landmark data
        if ((type === 'Pose' || type === 'Face' || type === 'Hand') && 
            name.includes('[') && name.includes('x=')) {
            const copyButton = document.createElement('button');
            copyButton.className = 'btn-copy-data';
            copyButton.innerHTML = '<i class="fas fa-copy"></i>';
            copyButton.title = 'Copy landmark data';
            copyButton.onclick = (e) => {
                e.stopPropagation();
                // Extract just the coordinates portion
                const dataMatch = name.match(/x=.*$/);
                const dataToCopy = dataMatch ? dataMatch[0] : name;
                navigator.clipboard.writeText(dataToCopy);
                
                // Show mini notification
                copyButton.innerHTML = '<i class="fas fa-check"></i>';
                setTimeout(() => {
                    copyButton.innerHTML = '<i class="fas fa-copy"></i>';
                }, 1000);
            };
            logLine.appendChild(copyButton);
        }
        
        this.logContent.appendChild(logLine);
        
        // Auto-scroll to bottom
        this.logContent.scrollTop = this.logContent.scrollHeight;
    }

    /**
     * Clear the log content
     */
    clearLog() {
        this.logContent.innerHTML = '';
        this.logGesture('System', 'Log cleared', '', 'fa-trash');
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
        
        // CSV header
        let csv = 'timestamp,type,landmark,index,x,y,z,visibility\n';
        
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
            
            // Add to CSV
            csv += `${timestamp},${type},${landmarkName},${landmarkIndex},${x},${y},${z},${visibility}\n`;
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
}

// Create global logger instance
const gestureLogger = new GestureLogger();