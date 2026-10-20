const MAX_WIDTH = 1280;
const FOCAL_LENGTH = 1430;
const DFOV = Math.PI / 3;

const distanceMethod = 2
const DEFAULT_DISTANCE = 0.5;

const IRIS_SIZE = 0.0117;
const NUM_KEYPOINTS = 468;
const NUM_IRIS_KEYPOINTS = 5;
const SMOOTHING = 0.8;

const HALF_DIAGONAL = 0.2;

// MediaPipe Face Mesh indices for head orientation
const RIGHT_EYE = 33;
const LEFT_EYE = 263;
const FOREHEAD = 10;
const CHIN = 152;

let model, HFOV, VFOV;
let canvas, video;
let width, height;

function distance(a, b) {
    return Math.sqrt(Math.pow(a[0] - b[0], 2) + Math.pow(a[1] - b[1], 2));
}

function fov(dfov, w, h) {
    const hypothenuse = Math.sqrt(Math.pow(w, 2) + Math.pow(h, 2));
    const tan_dfov = Math.tan(dfov / 2);
    return [2 * Math.atan(w * tan_dfov / hypothenuse), 2 * Math.atan(h * tan_dfov / hypothenuse)];
}

function toKeypointArrays(face) {
    if (face.scaledMesh) {
        return face.scaledMesh;
    }
    return face.keypoints.map((kp) => [kp.x, kp.y, kp.z ?? 0]);
}

function toWorldCoords([x, y, z = 0]) {
    return [x, -y, z];
}

function subtract(a, b) {
    return [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
}

function normalize(v, fallback = [0, 1, 0]) {
    const len = Math.hypot(v[0], v[1], v[2]);
    if (len < 1e-9) {
        return fallback;
    }
    return [v[0] / len, v[1] / len, v[2] / len];
}

function dot(a, b) {
    return a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
}

function cross(a, b) {
    return [
        a[1] * b[2] - a[2] * b[1],
        a[2] * b[0] - a[0] * b[2],
        a[0] * b[1] - a[1] * b[0]
    ];
}

function computeFaceForward(keypoints) {
    const leftEye = toWorldCoords(keypoints[LEFT_EYE]);
    const rightEye = toWorldCoords(keypoints[RIGHT_EYE]);
    const forehead = toWorldCoords(keypoints[FOREHEAD]);
    const chin = toWorldCoords(keypoints[CHIN]);

    const faceRight = subtract(rightEye, leftEye);
    const faceUp = subtract(forehead, chin);
    return normalize(cross(faceRight, faceUp), [0, 0, -1]);
}

function computeHeadPitchYaw(keypoints) {
    const forward = computeFaceForward(keypoints);

    return {
        yaw: -Math.atan2(-forward[0], -forward[2]),
        pitch: Math.atan2(forward[1], Math.hypot(forward[0], forward[2]))
    };
}

function computeHeadRoll(keypoints, cameraPosition) {
    const leftEye = toWorldCoords(keypoints[LEFT_EYE]);
    const rightEye = toWorldCoords(keypoints[RIGHT_EYE]);
    const eyeLine = subtract(rightEye, leftEye);

    const view = normalize([
        -cameraPosition[0],
        -cameraPosition[1],
        -cameraPosition[2]
    ]);
    const alongView = dot(eyeLine, view);
    const eyeLineInViewPlane = normalize([
        eyeLine[0] - view[0] * alongView,
        eyeLine[1] - view[1] * alongView,
        eyeLine[2] - view[2] * alongView
    ]);

    const refRight = normalize(cross([0, 1, 0], view), [1, 0, 0]);
    const refUp = normalize(cross(view, refRight));

    return Math.atan2(
        dot(eyeLineInViewPlane, refUp),
        dot(eyeLineInViewPlane, refRight)
    );
}

async function getLocation(ctx, width, height) {
    let predictions;
    const imageData = ctx.getImageData(0, 0, width, height);

    predictions = await model.estimateFaces(imageData, {
        predictIrises: (distanceMethod == 1),
        flipHorizontal: false
    });

    let centerX, centerY, keypoints, foreheadX, foreheadY;
    if (predictions.length > 0) {
        keypoints = toKeypointArrays(predictions[0]);
        centerX = keypoints[168][0];
        centerY = keypoints[168][1];
    
        foreheadX = keypoints[10][0];
        foreheadY = keypoints[10][1];
        
        let d;

        if (distanceMethod == 0) {
            d = DEFAULT_DISTANCE;
        } else if (distanceMethod == 2) {
            d = 0.06 * FOCAL_LENGTH * canvas.width / MAX_WIDTH / Math.sqrt(Math.pow(centerX - foreheadX, 2) * 0.5 + Math.pow(centerY - foreheadY, 2));
        } else if (keypoints.length > NUM_KEYPOINTS) {
            const leftDiameterY = distance(
                keypoints[NUM_KEYPOINTS + 4],
                keypoints[NUM_KEYPOINTS + 2]);
            const leftDiameterX = distance(
                keypoints[NUM_KEYPOINTS + 3],
                keypoints[NUM_KEYPOINTS + 1]);
            let diameter = Math.max(leftDiameterX, leftDiameterY);

            if (keypoints.length > NUM_KEYPOINTS + NUM_IRIS_KEYPOINTS) {
                const rightDiameterY = distance(
                    keypoints[NUM_KEYPOINTS + NUM_IRIS_KEYPOINTS + 2],
                    keypoints[NUM_KEYPOINTS + NUM_IRIS_KEYPOINTS + 4]);
                const rightDiameterX = distance(
                    keypoints[NUM_KEYPOINTS + NUM_IRIS_KEYPOINTS + 3],
                    keypoints[NUM_KEYPOINTS + NUM_IRIS_KEYPOINTS + 1]);
                diameter = Math.max(diameter, rightDiameterX, rightDiameterY);
            }

            d = IRIS_SIZE * FOCAL_LENGTH * canvas.width / MAX_WIDTH / diameter;
        }

        return [Math.atan(2 * (centerX - width / 2) / width * Math.tan(HFOV / 2)),
            Math.atan(2 * (centerY - height / 2) / height * Math.tan(VFOV / 2)),
            d,
            keypoints
        ];

    }
    return null;
}

class FaceTracker {
    constructor(container) {
        this.angle1 = 0;
        this.angle2 = 0;
        this.distance = 0;
        this.headPitch = 0;
        this.headYaw = 0;
        this.headRoll = 0;
        this.step = 1;
    }

    async init() {
        await tf.setBackend('wasm');

        const model_internal = faceLandmarksDetection.SupportedModels.MediaPipeFaceMesh;
        const detectorConfig = {
            runtime: 'tfjs',
            solutionPath: 'https://cdn.jsdelivr.net/npm/@mediapipe/face_mesh',
            shouldLoadIrisModel: (distanceMethod > 0),
            maxFaces: 1
        }
        model = await faceLandmarksDetection.createDetector(model_internal, detectorConfig);

        // if (BLAZE) {
        //     model = await blazeface.load();
        // } else {
        //     model = await faceLandmarksDetection.load(
        //         faceLandmarksDetection.SupportedPackages.mediapipeFacemesh, {
        //             shouldLoadIrisModel: (distanceMethod > 0),
        //             maxFaces: 1
        //         });
        // }

        if (navigator.mediaDevices.getUserMedia) {
            video = document.querySelector('#video');
            await navigator.mediaDevices.getUserMedia({
                    video : { facingMode : 'user' }
                })
                .then(function (stream) {
                    video.srcObject = stream;
                    width = stream.getTracks()[0].getSettings().width;
                    height = stream.getTracks()[0].getSettings().height;
                    [HFOV, VFOV] = fov(DFOV, width, height);
                })
                // permission denied:
                .catch(function (error) {
                    document.body.textContent = 'Could not access the camera. Error: ' + error.name;
                });
        }
        canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        
        video.addEventListener('click', this.locateFace);
    }

    async getCameraParameters(outputWidth, outputHeight) {
        let context = canvas.getContext('2d', { willReadFrequently: true });
        context.drawImage(video, 0, 0, width, height);
        const result = await getLocation(context, width, height);

        if (result !== null) {
            const [angle1, angle2, distance, keypoints] = result;

            this.angle1 = angle1;
            this.angle2 = angle2;
            this.distance = (1 - SMOOTHING) * distance + SMOOTHING * this.distance;
            this.keypoints = keypoints;

            if (this.step <= 10) {
                this.distance = this.distance / (1 - Math.pow(SMOOTHING, this.step))
            }

            this.step = this.step + 1;
        } else {
            return null;
        }

        let d = this.distance;
        const tan1 = -Math.tan(this.angle1);
        const tan2 = -Math.tan(this.angle2);
        const z = Math.sqrt(d * d / (1 + tan1 * tan1 + tan2 * tan2))
        const cameraPosition = [z * tan1, z * tan2, d];
        const fov = 180 / Math.PI * 2 * Math.atan(HALF_DIAGONAL / d);
        const { pitch, yaw } = computeHeadPitchYaw(this.keypoints);
        const roll = computeHeadRoll(this.keypoints, cameraPosition);

        this.headPitch = (1 - SMOOTHING) * pitch + SMOOTHING * this.headPitch;
        this.headYaw = (1 - SMOOTHING) * yaw + SMOOTHING * this.headYaw;
        this.headRoll = (1 - SMOOTHING) * roll + SMOOTHING * this.headRoll;

        return [cameraPosition, fov, {
            pitch: this.headPitch,
            yaw: this.headYaw,
            roll: this.headRoll
        }];
    }
}

export {
    FaceTracker
};