import { PerspectiveCamera } from 'https://unpkg.com/three@0.117.0/build/three.module.js';

function createCamera(cameraPosition, fov, aspectRatio, { pitch = 0, yaw = 0, roll = 0 } = {}) {
  const camera = new PerspectiveCamera(fov, aspectRatio, 0.1, 100);
  camera.position.set(cameraPosition[0], cameraPosition[1], cameraPosition[2]);
  camera.rotation.order = 'YXZ';
  camera.rotation.set(pitch, yaw, roll);
  return camera;
}

export { createCamera };
