/**
 * Main application entry point
 */
document.addEventListener('DOMContentLoaded', () => {
    // Initialize the application
    initApp();
});

/**
 * Initialize the application
 */
function initApp() {
    // Log initial messages
    gestureLogger.logGesture('System', 'Gesture Recognition Logger initialized', '', 'fa-check-circle');
    gestureLogger.logGesture('System', 'Click "Start Camera" to begin', '', 'fa-arrow-right');
    
    // Check for getUserMedia support
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        gestureLogger.logGesture(
            'Error', 
            'Your browser does not support camera access. Please use a modern browser like Chrome, Firefox, or Edge.', 
            '', 
            'fa-exclamation-triangle'
        );
        
        // Disable camera buttons
        document.getElementById('start-camera').disabled = true;
    }
    
    // Handle window resize to adjust canvas dimensions
    window.addEventListener('resize', debounce(() => {
        if (cameraManager.isRunning) {
            cameraManager.canvasElement.width = cameraManager.videoElement.videoWidth;
            cameraManager.canvasElement.height = cameraManager.videoElement.videoHeight;
        }
    }, 200));
}

/**
 * Debounce function for limiting how often a function can be called
 * @param {Function} func - The function to debounce
 * @param {number} wait - The debounce wait time in milliseconds
 * @returns {Function} The debounced function
 */
function debounce(func, wait) {
    let timeout;
    return function(...args) {
        const later = () => {
            clearTimeout(timeout);
            func.apply(this, args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

/**
 * Handle visibility change (tab switching)
 * This helps conserve resources when the page is not visible
 */
document.addEventListener('visibilitychange', () => {
    if (document.hidden && cameraManager.isRunning) {
        // Page is hidden, pause processing
        if (cameraManager.animationId) {
            cancelAnimationFrame(cameraManager.animationId);
            cameraManager.animationId = null;
            gestureLogger.logGesture('System', 'Processing paused (tab inactive)', '', 'fa-pause-circle');
        }
    } else if (!document.hidden && cameraManager.isRunning && !cameraManager.animationId) {
        // Page is visible again, resume processing
        cameraManager.startProcessing(async () => {
            await detectorsManager.processFrame(cameraManager.videoElement);
        });
        gestureLogger.logGesture('System', 'Processing resumed', '', 'fa-play-circle');
    }
});

/**
 * Handle errors that might occur during runtime
 */
window.addEventListener('error', (event) => {
    console.error('Application error:', event.error);
    gestureLogger.logGesture('Error', `Application error: ${event.error?.message || 'Unknown error'}`, '', 'fa-exclamation-triangle');
});