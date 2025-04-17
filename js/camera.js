/**
 * Camera handling module
 */
class CameraManager {
    /** @type {HTMLVideoElement} */
    videoElement;
    
    /** @type {HTMLCanvasElement} */
    canvasElement;
    
    /** @type {CanvasRenderingContext2D} */
    canvasCtx;
    
    /** @type {MediaStream} */
    mediaStream;
    
    /** @type {boolean} */
    isRunning;
    
    /** @type {number} */
    animationId;
    
    constructor() {
        this.videoElement = document.getElementById('output-video');
        this.canvasElement = document.getElementById('output-canvas');
        this.canvasCtx = this.canvasElement.getContext('2d');
        this.mediaStream = null;
        this.isRunning = false;
        this.animationId = null;
    }

    /**
     * Initialize and start the camera
     * @returns {Promise} Resolves when camera is started
     */
    async start() {
        try {
            // Get media stream
            this.mediaStream = await navigator.mediaDevices.getUserMedia({
                video: CONFIG.camera
            });
            
            // Set video source
            this.videoElement.srcObject = this.mediaStream;
            
            // Wait for video to be ready
            await new Promise((resolve) => {
                this.videoElement.onloadedmetadata = () => {
                    this.videoElement.play();
                    resolve(true); // Return a value to satisfy TypeScript
                };
            });
            
            // Set canvas dimensions based on video
            this.canvasElement.width = this.videoElement.videoWidth;
            this.canvasElement.height = this.videoElement.videoHeight;
            
            this.isRunning = true;
            return true;
        } catch (error) {
            console.error('Camera start error:', error);
            throw new Error(`Camera access error: ${error.message}`);
        }
    }

    /**
     * Stop the camera and clean up resources
     */
    stop() {
        // Stop animation frame
        if (this.animationId) {
            cancelAnimationFrame(this.animationId);
            this.animationId = null;
        }
        
        // Stop media tracks
        if (this.mediaStream) {
            this.mediaStream.getTracks().forEach(track => track.stop());
            this.mediaStream = null;
        }
        
        // Clear canvas
        this.canvasCtx.clearRect(0, 0, this.canvasElement.width, this.canvasElement.height);
        
        this.isRunning = false;
    }

    /**
     * Clear the canvas
     */
    clearCanvas() {
        this.canvasCtx.clearRect(0, 0, this.canvasElement.width, this.canvasElement.height);
    }

    /**
     * Start the frame processing loop
     * @param {Function} processFrame - Function to process each frame
     */
    startProcessing(processFrame) {
        const loop = async () => {
            if (!this.isRunning) return;
            
            // Clear the canvas at the beginning of each frame
            this.clearCanvas();
            
            await processFrame();
            this.animationId = requestAnimationFrame(loop);
        };
        
        loop();
    }
}

// Create global camera manager instance
const cameraManager = new CameraManager();