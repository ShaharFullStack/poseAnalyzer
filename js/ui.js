/**
 * UI manager for handling user interface interactions
 */
class UIManager {
    constructor() {
        // UI elements
        this.startCameraButton = document.getElementById('start-camera');
        this.stopCameraButton = document.getElementById('stop-camera');
        this.toggleFaceButton = document.getElementById('toggle-face');
        this.toggleHandsButton = document.getElementById('toggle-hands');
        this.togglePoseButton = document.getElementById('toggle-pose');
        this.themeToggleButton = document.getElementById('theme-toggle');
        
        // Status indicators
        this.cameraStatus = document.getElementById('camera-status');
        this.faceStatus = document.getElementById('face-status');
        this.handsStatus = document.getElementById('hands-status');
        this.poseStatus = document.getElementById('pose-status');
        
        // Theme state
        this.isDarkMode = false;
        
        // Set up event listeners
        this.setupEventListeners();
    }

    /**
     * Set up event listeners for UI elements
     */
    setupEventListeners() {
        // Camera controls
        this.startCameraButton.addEventListener('click', () => this.handleStartCamera());
        this.stopCameraButton.addEventListener('click', () => this.handleStopCamera());
        
        // Detection toggles
        this.toggleFaceButton.addEventListener('click', () => this.handleToggleFace());
        this.toggleHandsButton.addEventListener('click', () => this.handleToggleHands());
        this.togglePoseButton.addEventListener('click', () => this.handleTogglePose());
        
        // Theme toggle
        this.themeToggleButton.addEventListener('click', () => this.toggleDarkMode());
    }

    /**
     * Handle start camera button click
     */
    async handleStartCamera() {
        if (!cameraManager.isRunning) {
            try {
                // Show loading state
                this.startCameraButton.disabled = true;
                this.startCameraButton.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Starting...';
                
                // Initialize camera and detectors
                await cameraManager.start();
                detectorsManager.initializeAll();
                
                // Set up gesture recognition
                const gestureRecognition = new GestureRecognition(gestureLogger);
                
                // Set detector handlers
                detectorsManager.setHandlers({
                    onFaceResults: results => gestureRecognition.onFaceResults(results),
                    onHandsResults: results => gestureRecognition.onHandsResults(results),
                    onPoseResults: results => gestureRecognition.onPoseResults(results)
                });
                
                // Start processing frames
                cameraManager.startProcessing(async () => {
                    await detectorsManager.processFrame(cameraManager.videoElement);
                });
                
                // Update UI
                this.updateCameraStartedUI();
                
                // Log success
                gestureLogger.logGesture('System', 'Camera started', '', 'fa-video');
            } catch (error) {
                console.error('Error starting camera:', error);
                
                // Reset UI
                this.startCameraButton.disabled = false;
                this.startCameraButton.innerHTML = '<i class="fas fa-video"></i> Start Camera';
                
                // Log error
                gestureLogger.logGesture('Error', 'Failed to start camera: ' + error.message, '', 'fa-exclamation-triangle');
            }
        }
    }

    /**
     * Handle stop camera button click
     */
    handleStopCamera() {
        if (cameraManager.isRunning) {
            // Stop camera
            cameraManager.stop();
            
            // Reset detector states
            detectorsManager.resetAll();
            
            // Update UI
            this.updateCameraStoppedUI();
            
            // Log
            gestureLogger.logGesture('System', 'Camera stopped', '', 'fa-video-slash');
        }
    }

    /**
     * Handle face detection toggle button click
     */
    handleToggleFace() {
        const isActive = detectorsManager.toggleFace();
        this.updateToggleButton(this.toggleFaceButton, this.faceStatus, isActive, 'Face');
        
        gestureLogger.logGesture(
            'System', 
            `Face detection ${isActive ? 'enabled' : 'disabled'}`, 
            '', 
            isActive ? 'fa-check-circle' : 'fa-times-circle'
        );
    }

    /**
     * Handle hands detection toggle button click
     */
    handleToggleHands() {
        const isActive = detectorsManager.toggleHands();
        this.updateToggleButton(this.toggleHandsButton, this.handsStatus, isActive, 'Hands');
        
        gestureLogger.logGesture(
            'System', 
            `Hand detection ${isActive ? 'enabled' : 'disabled'}`, 
            '', 
            isActive ? 'fa-check-circle' : 'fa-times-circle'
        );
    }

    /**
     * Handle pose detection toggle button click
     */
    handleTogglePose() {
        const isActive = detectorsManager.togglePose();
        this.updateToggleButton(this.togglePoseButton, this.poseStatus, isActive, 'Pose');
        
        gestureLogger.logGesture(
            'System', 
            `Pose detection ${isActive ? 'enabled' : 'disabled'}`, 
            '', 
            isActive ? 'fa-check-circle' : 'fa-times-circle'
        );
    }

    /**
     * Update UI after camera is started
     */
    updateCameraStartedUI() {
        // Update camera control buttons
        this.startCameraButton.disabled = true;
        this.startCameraButton.innerHTML = '<i class="fas fa-video"></i> Start Camera';
        this.stopCameraButton.disabled = false;
        
        // Enable detection toggle buttons
        this.toggleFaceButton.disabled = false;
        this.toggleHandsButton.disabled = false;
        this.togglePoseButton.disabled = false;
        
        // Update camera status indicator
        this.cameraStatus.classList.remove('inactive-indicator');
        this.cameraStatus.classList.add('active-indicator');
    }

    /**
     * Update UI after camera is stopped
     */
    updateCameraStoppedUI() {
        // Update camera control buttons
        this.startCameraButton.disabled = false;
        this.stopCameraButton.disabled = true;
        
        // Disable detection toggle buttons
        this.toggleFaceButton.disabled = true;
        this.toggleHandsButton.disabled = true;
        this.togglePoseButton.disabled = true;
        
        // Reset camera status indicator
        this.cameraStatus.classList.remove('active-indicator');
        this.cameraStatus.classList.add('inactive-indicator');
        
        // Reset detection toggle buttons
        this.updateToggleButton(this.toggleFaceButton, this.faceStatus, false, 'Face');
        this.updateToggleButton(this.toggleHandsButton, this.handsStatus, false, 'Hands');
        this.updateToggleButton(this.togglePoseButton, this.poseStatus, false, 'Pose');
    }

    /**
     * Update a toggle button's appearance based on its active state
     * @param {HTMLElement} button - The button element
     * @param {HTMLElement} indicator - The status indicator element
     * @param {boolean} isActive - Whether the feature is active
     * @param {string} label - The feature label
     */
    updateToggleButton(button, indicator, isActive, label) {
        // Update button text and icon
        const icon = button.querySelector('i').className.split(' ')[1]; // Get the icon class
        button.innerHTML = `<i class="fas ${icon}"></i> ${label}: ${isActive ? 'ON' : 'OFF'}`;
        
        // Update button styling
        if (isActive) {
            button.classList.remove('btn-inactive');
            button.classList.add('btn-success');
            indicator.classList.remove('inactive-indicator');
            indicator.classList.add('active-indicator');
        } else {
            button.classList.remove('btn-success');
            button.classList.add('btn-inactive');
            indicator.classList.remove('active-indicator');
            indicator.classList.add('inactive-indicator');
        }
    }

    /**
     * Toggle dark mode
     */
    toggleDarkMode() {
        this.isDarkMode = !this.isDarkMode;
        document.body.classList.toggle('dark-mode');
        
        // Update icon
        this.themeToggleButton.innerHTML = this.isDarkMode ? 
            '<i class="fas fa-sun"></i>' : 
            '<i class="fas fa-moon"></i>';
        
        gestureLogger.logGesture(
            'System', 
            `Theme switched to ${this.isDarkMode ? 'dark' : 'light'} mode`, 
            '', 
            this.isDarkMode ? 'fa-moon' : 'fa-sun'
        );
    }
}

// Create global UI manager instance
const uiManager = new UIManager();