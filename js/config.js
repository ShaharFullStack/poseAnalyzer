/**
 * Configuration settings for the Gesture Recognition application
 */
const CONFIG = {
    // Camera settings
    camera: {
        width: { ideal: 640 },
        height: { ideal: 480 },
        facingMode: "user"
    },
    
    // Detection confidence thresholds
    detectionConfidence: {
        face: 0.5,
        hands: 0.5,
        pose: 0.5
    },
    
    // Tracking confidence thresholds
    trackingConfidence: {
        face: 0.5,
        hands: 0.5,
        pose: 0.5
    },
    
    // Detector settings
    detector: {
        face: {
            maxNumFaces: 1
        },
        hands: {
            maxNumHands: 2,
            modelComplexity: 1
        },
        pose: {
            modelComplexity: 1,
            smoothLandmarks: true
        }
    },
    
    // Logging settings
    logging: {
        throttleMs: 1000, // Log at most every 1000ms per detector for coordinates (increased to reduce log spam)
        faceLandmarkCount: 15, // Number of face landmarks to display in log
        handLandmarkCount: 6,  // Number of hand landmarks to display in log
        poseLandmarkCount: 14  // Number of pose landmarks to display in log
    }
};