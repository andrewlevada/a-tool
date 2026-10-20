import {
  Clock
} from 'https://unpkg.com/three@0.117.0/build/three.module.js';
import {
  createCamera
} from '../components/camera.js';
import {
  Movement
} from './Movement.js';

const clock = new Clock();

const MSPF = 1000 / 60

class Loop {
  constructor(camera, scene, renderer, faceTracker) {
    this.camera = camera;
    this.cameraPosition = [0, 0, 0.5];
    this.headOrientation = { pitch: 0, yaw: 0, roll: 0 };
    this.fov = 43.6;
    this.aspectRatio = 1;
    this.scene = scene;
    this.lastUpdate = 0;
    this.renderer = renderer;
    this.faceTracker = faceTracker;
    this.canvas = document.createElement('canvas')
    this.movement = new Movement();
    this.updatables = [];
  }

  getCameraPosition() {
    const offset = this.movement.getOffset();
    return [
      this.cameraPosition[0] + offset[0],
      this.cameraPosition[1] + offset[1],
      this.cameraPosition[2] + offset[2],
    ];
  }

  async init() {
    await this.faceTracker.init();
  }

  async updateCameraParameters() {
    const timestamp = Date.now();
    if (timestamp - this.lastUpdate > MSPF) {
      const result = await this.faceTracker.getCameraParameters();
      
      if (result !== null) {
        const [cameraPosition, fov, headOrientation] = result;
        this.cameraPosition = cameraPosition;
        this.headOrientation = headOrientation;
        // this.fov = fov;
        this.lastUpdate = Date.now();
      }
    }
  }

  setAspectRatio(ar) {
    this.aspectRatio = ar;
  }

  start() {
    this.renderer.setAnimationLoop(() => {
      this.updateCameraParameters().then(() => {
        this.tick();
        this.camera = createCamera(this.getCameraPosition(), this.fov, this.aspectRatio, this.headOrientation);
        this.renderer.render(this.scene, this.camera);
      });
    });
  }

  stop() {
    this.renderer.setAnimationLoop(null);
  }

  tick() {
    const delta = clock.getDelta();
    this.movement.tick(delta, this.headOrientation.yaw);
    for (const object of this.updatables) {
      object.tick(delta);
    }
  }
}

export {
  Loop
};