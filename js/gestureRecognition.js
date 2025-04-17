/**
 * Gesture recognition module for detecting and analyzing gestures
 */
class GestureRecognition {
    /** @type {GestureLogger} */
    logger;
    
    /** @type {number} */
    lastFaceLog;
    
    /** @type {number} */
    lastHandsLog;
    
    /** @type {number} */
    lastPoseLog;
    
    /**
     * @param {GestureLogger} loggerInstance - The logger instance
     */
    constructor(loggerInstance) {
        this.logger = loggerInstance;
        
        // Log timestamps for throttling
        this.lastFaceLog = 0;
        this.lastHandsLog = 0;
        this.lastPoseLog = 0;
    }

    /**
     * Handle face detection results
     * @param {Object} results - FaceMesh detection results
     */
    onFaceResults(results) {
        const canvasCtx = cameraManager.canvasCtx;
        
        // Don't clear the canvas here anymore - canvas clearing is now managed centrally
        canvasCtx.save();
        
        // Draw face landmarks if face is detected
        if (results.multiFaceLandmarks && results.multiFaceLandmarks.length > 0) {
            for (const landmarks of results.multiFaceLandmarks) {
                drawConnectors(canvasCtx, landmarks, FACEMESH_TESSELATION, 
                               {color: '#C0C0C070', lineWidth: 1});
                drawConnectors(canvasCtx, landmarks, FACEMESH_RIGHT_EYE, 
                               {color: '#FF3030', lineWidth: 2});
                drawConnectors(canvasCtx, landmarks, FACEMESH_LEFT_EYE, 
                               {color: '#30FF30', lineWidth: 2});
                drawConnectors(canvasCtx, landmarks, FACEMESH_FACE_OVAL, 
                               {color: '#E0E0E0', lineWidth: 2});
                drawConnectors(canvasCtx, landmarks, FACEMESH_LIPS, 
                               {color: '#E0E0E0', lineWidth: 2});
            }
            
            // Log face landmarks (with throttling)
            const now = Date.now();
            if (now - this.lastFaceLog > CONFIG.logging.throttleMs) {
                this.lastFaceLog = now;
                
                // Log the actual landmark coordinates instead of gestures
                this.logFaceLandmarks(results.multiFaceLandmarks[0]);
            }
        }
        
        canvasCtx.restore();
    }

    /**
     * Handle hand detection results
     * @param {Object} results - Hands detection results
     */
    onHandsResults(results) {
        const canvasCtx = cameraManager.canvasCtx;
        
        // Don't clear canvas as we want to overlay with face and pose
        canvasCtx.save();
        
        // Draw hand landmarks if hands are detected
        if (results.multiHandLandmarks && results.multiHandLandmarks.length > 0) {
            for (let i = 0; i < results.multiHandLandmarks.length; i++) {
                const landmarks = results.multiHandLandmarks[i];
                const handedness = results.multiHandedness[i].label;
                
                // Draw hand connections
                drawConnectors(canvasCtx, landmarks, HAND_CONNECTIONS, 
                               {color: handedness === 'Left' ? '#00FF00' : '#FF0000', lineWidth: 3});
                drawLandmarks(canvasCtx, landmarks, 
                             {color: handedness === 'Left' ? '#00FF00' : '#FF0000', lineWidth: 1});
            }
            
            // Log hand detection (with throttling)
            const now = Date.now();
            if (now - this.lastHandsLog > CONFIG.logging.throttleMs) {
                this.lastHandsLog = now;
                
                // Log landmark coordinates for each hand
                for (let i = 0; i < results.multiHandLandmarks.length; i++) {
                    const landmarks = results.multiHandLandmarks[i];
                    const handedness = results.multiHandedness[i].label;
                    this.logHandLandmarks(landmarks, handedness);
                }
            }
        }
        
        canvasCtx.restore();
    }

    /**
     * Handle pose detection results
     * @param {Object} results - Pose detection results
     */
    onPoseResults(results) {
        const canvasCtx = cameraManager.canvasCtx;
        
        // Don't clear canvas as we want to overlay with face and hands
        canvasCtx.save();
        
        // Draw pose landmarks if pose is detected
        if (results.poseLandmarks) {
            // Draw pose connections
            drawConnectors(canvasCtx, results.poseLandmarks, POSE_CONNECTIONS,
                          {color: '#00B5FF', lineWidth: 2});
            drawLandmarks(canvasCtx, results.poseLandmarks,
                         {color: '#FF0000', lineWidth: 1});
            
            // Log landmark coordinates (with throttling)
            const now = Date.now();
            if (now - this.lastPoseLog > CONFIG.logging.throttleMs) {
                this.lastPoseLog = now;
                
                // Log the actual landmark coordinates instead of gestures
                this.logPoseLandmarks(results.poseLandmarks);
            }
        }
        
        canvasCtx.restore();
    }

    /**
     * Log the coordinates of face landmarks
     * @param {Array} landmarks - Face landmarks array
     */
    logFaceLandmarks(landmarks) {
        // MediaPipe Face Mesh provides 468 landmarks - log key ones
        // Key face landmarks indices
        const keyFaceLandmarks = {
            0: "nose tip",
            5: "forehead",
            13: "upper lip", 
            14: "lower lip",
            33: "left cheek",
            263: "right cheek",
            61: "left eye inner",
            291: "right eye inner",
            133: "left eye outer",
            362: "right eye outer",
            234: "left eyebrow",
            156: "right eyebrow",
            58: "left ear",
            323: "right ear",
            152: "chin"
        };

        // Log the selected landmarks
        Object.entries(keyFaceLandmarks).forEach(([index, name]) => {
            if (landmarks[index]) {
                const landmark = landmarks[index];
                const x = landmark.x.toFixed(4);
                const y = landmark.y.toFixed(4);
                const z = landmark.z.toFixed(4);
                
                this.logger.logGesture(
                    'Face', 
                    `${name} [${index}]: x=${x}, y=${y}, z=${z}`, 
                    '', 
                    'fa-location-dot'
                );
            }
        });
    }

    /**
     * Log the coordinates of hand landmarks
     * @param {Array} landmarks - Hand landmarks array
     * @param {string} handedness - 'Left' or 'Right' hand
     */
    logHandLandmarks(landmarks, handedness) {
        // MediaPipe Hands provides 21 landmarks per hand
        const handLandmarkNames = [
            "wrist",
            "thumb_cmc", "thumb_mcp", "thumb_ip", "thumb_tip",
            "index_mcp", "index_pip", "index_dip", "index_tip",
            "middle_mcp", "middle_pip", "middle_dip", "middle_tip",
            "ring_mcp", "ring_pip", "ring_dip", "ring_tip",
            "pinky_mcp", "pinky_pip", "pinky_dip", "pinky_tip"
        ];

        // Log a selection of key points
        const keyHandPoints = [
            0,  // wrist
            4,  // thumb tip
            8,  // index tip
            12, // middle tip
            16, // ring tip
            20  // pinky tip
        ];

        keyHandPoints.forEach(index => {
            if (landmarks[index]) {
                const landmark = landmarks[index];
                const name = handLandmarkNames[index];
                const x = landmark.x.toFixed(4);
                const y = landmark.y.toFixed(4);
                const z = landmark.z.toFixed(4);
                
                this.logger.logGesture(
                    'Hand', 
                    `${handedness} ${name} [${index}]: x=${x}, y=${y}, z=${z}`, 
                    '', 
                    'fa-location-dot'
                );
            }
        });
    }

    /**
     * Log the coordinates of pose landmarks
     * @param {Array} landmarks - Pose landmarks array
     */
    logPoseLandmarks(landmarks) {
        // MediaPipe Pose provides 33 landmarks
        const landmarkNames = [
            'nose',
            'left_eye_inner', 'left_eye', 'left_eye_outer',
            'right_eye_inner', 'right_eye', 'right_eye_outer',
            'left_ear', 'right_ear',
            'mouth_left', 'mouth_right',
            'left_shoulder', 'right_shoulder',
            'left_elbow', 'right_elbow',
            'left_wrist', 'right_wrist',
            'left_pinky', 'right_pinky',
            'left_index', 'right_index',
            'left_thumb', 'right_thumb',
            'left_hip', 'right_hip',
            'left_knee', 'right_knee',
            'left_ankle', 'right_ankle',
            'left_heel', 'right_heel',
            'left_foot_index', 'right_foot_index'
        ];

        // Log a selection of key points (can be expanded to all 33 if needed)
        const keyPoints = [
            0,  // nose
            11, 12,  // shoulders
            13, 14,  // elbows
            15, 16,  // wrists
            23, 24,  // hips
            25, 26,  // knees
            27, 28   // ankles
        ];

        keyPoints.forEach(index => {
            if (landmarks[index]) {
                const landmark = landmarks[index];
                const name = landmarkNames[index];
                const x = landmark.x.toFixed(4);
                const y = landmark.y.toFixed(4);
                const z = landmark.z.toFixed(4);
                const visibility = landmark.visibility ? landmark.visibility.toFixed(2) : 'N/A';
                
                this.logger.logGesture(
                    'Pose', 
                    `${name} [${index}]: x=${x}, y=${y}, z=${z}, vis=${visibility}`, 
                    '', 
                    'fa-location-dot'
                );
            }
        });
    }
}