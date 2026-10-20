const MOVE_SPEED = 0.5;

class Movement {
  constructor() {
    this.keys = { w: false, a: false, s: false, d: false };
    this.offset = [0, 0, 0];

    window.addEventListener('keydown', (e) => this.onKey(e, true));
    window.addEventListener('keyup', (e) => this.onKey(e, false));
  }

  onKey(e, pressed) {
    const key = e.key.toLowerCase();
    if (!(key in this.keys)) {
      return;
    }
    this.keys[key] = pressed;
    e.preventDefault();
  }

  tick(delta, yaw = 0) {
    let forward = 0;
    let strafe = 0;

    if (this.keys.w) forward += 1;
    if (this.keys.s) forward -= 1;
    if (this.keys.d) strafe += 1;
    if (this.keys.a) strafe -= 1;

    if (forward === 0 && strafe === 0) {
      return;
    }

    const sin = Math.sin(yaw);
    const cos = Math.cos(yaw);
    const forwardX = -sin;
    const forwardZ = -cos;
    const rightX = cos;
    const rightZ = -sin;
    const distance = MOVE_SPEED * delta;

    this.offset[0] += (forwardX * forward + rightX * strafe) * distance;
    this.offset[2] += (forwardZ * forward + rightZ * strafe) * distance;
  }

  getOffset() {
    return this.offset;
  }
}

export { Movement };
