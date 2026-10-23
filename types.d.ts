declare module "handsfree" {
  export type HandsfreeModelName =
    | "weboji"
    | "hands"
    | "facemesh"
    | "pose"
    | "handpose";

  export interface Landmark {
    x: number;
    y: number;
    z?: number;
    visibility?: number;
  }

  export interface Handedness {
    label: "Left" | "Right";
    score: number;
    index?: number;
  }

  export interface HandsData {
    image?: HTMLCanvasElement | HTMLImageElement | HTMLVideoElement;
    multiHandLandmarks?: Landmark[][];
    multiHandWorldLandmarks?: Landmark[][];
    multiHandedness?: Handedness[];
    /** Four slots in order: right, left, right (secondary), left (secondary). */
    landmarks?: Landmark[][];
    landmarksVisible?: boolean[];
    [key: string]: unknown;
  }

  export interface FaceMeshData {
    image?: HTMLCanvasElement | HTMLImageElement | HTMLVideoElement;
    multiFaceLandmarks?: Landmark[][];
    [key: string]: unknown;
  }

  export interface PoseData {
    image?: HTMLCanvasElement | HTMLImageElement | HTMLVideoElement;
    poseLandmarks?: Landmark[];
    poseWorldLandmarks?: Landmark[];
    segmentationMask?: CanvasImageSource;
    [key: string]: unknown;
  }

  export interface WebojiState {
    smileRight?: boolean;
    smileLeft?: boolean;
    smile?: boolean;
    smirk?: boolean;
    pursed?: boolean;
    browLeftUp?: boolean;
    browRightUp?: boolean;
    browsUp?: boolean;
    browLeftDown?: boolean;
    browRightDown?: boolean;
    browsDown?: boolean;
    browsUpDown?: boolean;
    eyeLeftClosed?: boolean;
    eyeRightClosed?: boolean;
    eyesClosed?: boolean;
    mouthClosed?: boolean;
    mouthOpen?: boolean;
    [key: string]: boolean | undefined;
  }

  export interface WebojiData {
    rotation: number[];
    translation: number[];
    morphs: number[];
    state: WebojiState;
    degree: number[];
    isDetected: boolean;
  }

  export interface HandposeData {
    /** 3D keypoint coordinates returned by TensorFlow handpose. */
    landmarks?: number[][];
    annotations?: Record<string, number[][]>;
    boundingBox?: { topLeft: number[]; bottomRight: number[] };
    handInViewConfidence?: number;
    normalized?: number[][];
    meshes?: unknown[];
    [key: string]: unknown;
  }

  export interface HandsfreeData {
    weboji?: WebojiData;
    hands?: HandsData;
    facemesh?: FaceMeshData;
    pose?: PoseData;
    handpose?: HandposeData;
    [key: string]: unknown;
  }

  export interface ModelConfig {
    enabled?: boolean;
    throttle?: number;
    [key: string]: unknown;
  }

  export interface WebojiConfig extends ModelConfig {
    videoSettings?: {
      videoElement?: HTMLVideoElement | HTMLCanvasElement | HTMLImageElement | null;
      deviceId?: string | null;
      facingMode?: "user" | "environment";
      idealWidth?: number;
      idealHeight?: number;
      minWidth?: number;
      maxWidth?: number;
      minHeight?: number;
      maxHeight?: number;
    };
    morphs?: {
      threshold?: Partial<Record<
        | "smileRight"
        | "smileLeft"
        | "browLeftDown"
        | "browRightDown"
        | "browLeftUp"
        | "browRightUp"
        | "eyeLeftClosed"
        | "eyeRightClosed"
        | "mouthOpen"
        | "mouthRound"
        | "upperLip",
        number
      >>;
    };
  }

  export interface HandsConfig extends ModelConfig {
    maxNumHands?: number;
    minDetectionConfidence?: number;
    minTrackingConfidence?: number;
  }

  export interface FaceMeshConfig extends ModelConfig {
    maxNumFaces?: number;
    minDetectionConfidence?: number;
    minTrackingConfidence?: number;
  }

  export interface PoseConfig extends ModelConfig {
    upperBodyOnly?: boolean;
    smoothLandmarks?: boolean;
    minDetectionConfidence?: number;
    minTrackingConfidence?: number;
  }

  export interface HandposeConfig extends ModelConfig {
    backend?: "webgl" | "wasm";
    maxContinuousChecks?: number;
    detectionConfidence?: number;
    iouThreshold?: number;
    scoreThreshold?: number;
  }

  export interface PluginConfig {
    enabled?: boolean;
    [key: string]: unknown;
  }

  export interface HandsfreePluginDefinition {
    name?: string;
    models?: HandsfreeModelName | HandsfreeModelName[];
    tags?: string | string[];
    enabled?: boolean;
    config?: Record<string, unknown>;
    onFrame?: (data: HandsfreeData) => void;
    onUse?: (handsfree: Handsfree) => void;
    onEnable?: (handsfree: Handsfree) => void;
    onDisable?: (handsfree: Handsfree) => void;
  }

  export interface HandsfreePlugin extends HandsfreePluginDefinition {
    name: string;
    enabled: boolean;
    handsfree: Handsfree;
    enable(): void;
    disable(): void;
  }

  export interface HandsfreeGestureConfig {
    name?: string;
    algorithm?: "fingerpose" | (string & {});
    description?: unknown[];
    models?: HandsfreeModelName | HandsfreeModelName[];
    tags?: string | string[];
    enabled?: boolean;
    confidence?: number;
    [key: string]: unknown;
  }

  export interface HandsfreeGesture extends HandsfreeGestureConfig {
    name: string;
    enabled: boolean;
    enable(): void;
    disable(): void;
  }

  export interface HandsfreeModel {
    name: HandsfreeModelName;
    enabled: boolean;
    dependenciesLoaded: boolean;
    config: ModelConfig;
    data: unknown;
    plugins: string[];
    gestures: string[];
    enable(loadDependencies?: boolean): void;
    disable(): void;
    getData(): unknown | Promise<unknown>;
    runPlugins(): void;
  }

  export interface HandsfreeCanvasConfig {
    $el?: HTMLCanvasElement | null;
    width?: number;
    height?: number;
  }

  export interface HandsfreeConfig {
    autostart?: boolean;
    assetsPath?: string;
    isClient?: boolean;
    showDebug?: boolean;
    setup?: {
      canvas?: Partial<Record<HandsfreeModelName | "video", HandsfreeCanvasConfig>>;
      video?: {
        $el?: HTMLVideoElement | null;
        width?: number;
        height?: number;
      };
      wrap?: {
        $el?: HTMLElement | null;
        $parent?: HTMLElement | null;
      };
    };
    weboji?: boolean | WebojiConfig;
    hands?: boolean | HandsConfig;
    facemesh?: boolean | FaceMeshConfig;
    pose?: boolean | PoseConfig;
    handpose?: boolean | HandposeConfig;
    plugin?: Record<string, boolean | PluginConfig>;
    gesture?: Record<string, boolean | HandsfreeGestureConfig>;
    [key: string]: unknown;
  }

  export interface HandsfreeDebugger {
    $wrap: HTMLElement;
    $video: HTMLVideoElement;
    $canvas: Partial<Record<HandsfreeModelName | "video", HTMLCanvasElement>>;
    context: Partial<Record<HandsfreeModelName | "video", CanvasRenderingContext2D | null>>;
    stream?: MediaStream;
    isGettingStream?: boolean;
  }

  export default class Handsfree {
    constructor(config?: HandsfreeConfig);

    readonly id: number;
    readonly version: string;
    config: HandsfreeConfig;
    data: HandsfreeData;
    debug: HandsfreeDebugger;
    model: Record<HandsfreeModelName, HandsfreeModel>;
    plugin: Record<string, HandsfreePlugin>;
    gesture: Record<string, HandsfreeGesture>;
    taggedPlugins: Record<string, string[]>;
    taggedGestures: Record<string, string[]>;
    mediapipeWarmups: Record<string, boolean>;
    isDebugging: boolean;
    isLooping: boolean;
    isUsingWebcam: boolean;
    hasAddedBodyClass: boolean;

    cleanConfig(config: HandsfreeConfig, defaults?: HandsfreeConfig): HandsfreeConfig;
    update(config: HandsfreeConfig, callback?: () => void): void;
    start(callback?: (model: HandsfreeModel) => void): void;
    stop(): void;
    pause(): void;
    unpause(): void;
    loop(): void;
    use(name: string, config: HandsfreePluginDefinition | HandsfreePluginDefinition["onFrame"]): HandsfreePlugin;
    enablePlugins(tags?: string | string[]): void;
    disablePlugins(tags?: string | string[]): void;
    runPlugins(data: HandsfreeData): void;
    useGesture(config: HandsfreeGestureConfig): HandsfreeGesture;
    enableGestures(tags?: string | string[]): void;
    disableGestures(tags?: string | string[]): void;
    emit(eventName: string, detail?: unknown): void;
    on(eventName: "data", callback: (detail: HandsfreeData) => void, options?: AddEventListenerOptions): void;
    on(eventName: "init", callback: (detail: Handsfree) => void, options?: AddEventListenerOptions): void;
    on(eventName: "gotUserMedia", callback: (detail: MediaStream) => void, options?: AddEventListenerOptions): void;
    on(eventName: "modelReady", callback: (detail: HandsfreeModel) => void, options?: AddEventListenerOptions): void;
    on(eventName: string, callback: (detail: unknown) => void, options?: AddEventListenerOptions): void;
    normalize(value: number, max: number, min?: number): number;
    getUserMedia(callback?: () => void): void;
    showDebugger(): void;
    hideDebugger(): void;
  }
}
