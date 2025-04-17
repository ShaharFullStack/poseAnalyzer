/**
 * MediaPipe detectors initialization and management
 */
class DetectorsManager {
    /** @type {FaceMesh} */
    faceMesh;
    
    /** @type {Hands} */
    hands;
    
    /** @type {Pose} */
    pose;
    
    /** @type {boolean} */
    isFaceActive;
    
    /** @type {boolean} */
    isHandsActive;
    
    /** @type {boolean} */
    isPoseActive;
    
    constructor() {
        // Detector instances
        this.faceMesh = null;
        this.hands = null;
        this.pose = null;
        
        // Detector active states
        this.isFaceActive = false;
        this.isHandsActive = false;
        this.isPoseActive = false;
    }

    /**
     * Initialize all detectors
     */
    initializeAll() {
        this.initializeFaceMesh();
        this.initializeHands();
        this.initializePose();
    }

    /**
     * Initialize the FaceMesh detector
     */
    initializeFaceMesh() {
        this.faceMesh = new FaceMesh({
            locateFile: (file) => {
                return `https://cdn.jsdelivr.net/npm/@mediapipe/face_mesh/${file}`;
            }
        });
        
        this.faceMesh.setOptions({
            maxNumFaces: CONFIG.detector.face.maxNumFaces,
            minDetectionConfidence: CONFIG.detectionConfidence.face,
            minTrackingConfidence: CONFIG.trackingConfidence.face
        });
    }

    /**
     * Initialize the Hands detector
     */
    initializeHands() {
        this.hands = new Hands({
            locateFile: (file) => {
                return `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`;
            }
        });
        
        this.hands.setOptions({
            maxNumHands: CONFIG.detector.hands.maxNumHands,
            modelComplexity: CONFIG.detector.hands.modelComplexity,
            minDetectionConfidence: CONFIG.detectionConfidence.hands,
            minTrackingConfidence: CONFIG.trackingConfidence.hands
        });
    }

    /**
     * Initialize the Pose detector
     */
    initializePose() {
        this.pose = new Pose({
            locateFile: (file) => {
                return `https://cdn.jsdelivr.net/npm/@mediapipe/pose/${file}`;
            }
        });
        
        this.pose.setOptions({
            modelComplexity: CONFIG.detector.pose.modelComplexity,
            smoothLandmarks: CONFIG.detector.pose.smoothLandmarks,
            minDetectionConfidence: CONFIG.detectionConfidence.pose,
            minTrackingConfidence: CONFIG.trackingConfidence.pose
        });
    }

    /**
     * Set event handlers for the detectors
     * @param {Object} handlers - Object containing handler functions for each detector
     */
    setHandlers(handlers) {
        if (this.faceMesh && handlers.onFaceResults) {
            this.faceMesh.onResults(handlers.onFaceResults);
        }
        
        if (this.hands && handlers.onHandsResults) {
            this.hands.onResults(handlers.onHandsResults);
        }
        
        if (this.pose && handlers.onPoseResults) {
            this.pose.onResults(handlers.onPoseResults);
        }
    }

    /**
     * Toggle face detection
     * @returns {boolean} New active state
     */
    toggleFace() {
        this.isFaceActive = !this.isFaceActive;
        return this.isFaceActive;
    }

    /**
     * Toggle hands detection
     * @returns {boolean} New active state
     */
    toggleHands() {
        this.isHandsActive = !this.isHandsActive;
        return this.isHandsActive;
    }

    /**
     * Toggle pose detection
     * @returns {boolean} New active state
     */
    togglePose() {
        this.isPoseActive = !this.isPoseActive;
        return this.isPoseActive;
    }

    /**
     * Reset all detector active states
     */
    resetAll() {
        this.isFaceActive = false;
        this.isHandsActive = false;
        this.isPoseActive = false;
    }

    /**
     * Process the current video frame with active detectors
     * @param {HTMLVideoElement} videoElement - The video element to process
     */
    async processFrame(videoElement) {
        // Process only active detectors
        if (this.isFaceActive && this.faceMesh) {
            await this.faceMesh.send({image: videoElement});
        }
        
        if (this.isHandsActive && this.hands) {
            await this.hands.send({image: videoElement});
        }
        
        if (this.isPoseActive && this.pose) {
            await this.pose.send({image: videoElement});
        }
    }
}

// Create global detectors manager instance
const detectorsManager = new DetectorsManager();