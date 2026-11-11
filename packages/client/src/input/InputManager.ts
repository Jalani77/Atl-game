export interface InputState {
  moveX: number;
  moveZ: number;
  rotation: number;
  dash: boolean;
  attack: boolean;
  switchWeapon: boolean;
  interact: boolean;
  mouseX: number;
  mouseY: number;
  isPointerLocked: boolean;
}

export class InputManager {
  private container: HTMLElement;
  private state: InputState = {
    moveX: 0,
    moveZ: 0,
    rotation: 0,
    dash: false,
    attack: false,
    switchWeapon: false,
    interact: false,
    mouseX: 0,
    mouseY: 0,
    isPointerLocked: false,
  };

  private keys = new Set<string>();
  private mouseButtons = new Set<number>();
  private touchJoystick: { active: boolean; startX: number; startY: number; currentX: number; currentY: number } = {
    active: false,
    startX: 0,
    startY: 0,
    currentX: 0,
    currentY: 0,
  };

  private cameraYaw = 0;
  private cameraPitch = 0.5;
  private cameraDistance = 20;

  constructor(container: HTMLElement) {
    this.container = container;
    this.setupEventListeners();
  }

  private setupEventListeners(): void {
    window.addEventListener('keydown', this.onKeyDown);
    window.addEventListener('keyup', this.onKeyUp);
    this.container.addEventListener('mousedown', this.onMouseDown);
    window.addEventListener('mouseup', this.onMouseUp);
    window.addEventListener('mousemove', this.onMouseMove);
    this.container.addEventListener('wheel', this.onWheel);
    this.container.addEventListener('contextmenu', (e) => e.preventDefault());

    this.container.addEventListener('touchstart', this.onTouchStart, { passive: false });
    this.container.addEventListener('touchmove', this.onTouchMove, { passive: false });
    this.container.addEventListener('touchend', this.onTouchEnd);
  }

  private onKeyDown = (e: KeyboardEvent): void => {
    if (e.target instanceof HTMLInputElement) return;
    this.keys.add(e.code);

    if (e.code === 'Space') {
      this.state.dash = true;
    }
    if (e.code === 'KeyQ') {
      this.state.switchWeapon = true;
    }
    if (e.code === 'KeyE' || e.code === 'KeyF') {
      this.state.interact = true;
    }
  };

  private onKeyUp = (e: KeyboardEvent): void => {
    this.keys.delete(e.code);
  };

  private onMouseDown = (e: MouseEvent): void => {
    this.mouseButtons.add(e.button);
    if (e.button === 0) {
      this.state.attack = true;
    }
    if (e.button === 2) {
      this.container.requestPointerLock?.();
    }
  };

  private onMouseUp = (e: MouseEvent): void => {
    this.mouseButtons.delete(e.button);
    if (e.button === 2) {
      document.exitPointerLock?.();
    }
  };

  private onMouseMove = (e: MouseEvent): void => {
    this.state.mouseX = e.clientX;
    this.state.mouseY = e.clientY;

    if (document.pointerLockElement === this.container || this.mouseButtons.has(2)) {
      this.cameraYaw -= e.movementX * 0.003;
      this.cameraPitch = Math.max(0.1, Math.min(1.4, this.cameraPitch - e.movementY * 0.003));
    }
  };

  private onWheel = (e: WheelEvent): void => {
    this.cameraDistance = Math.max(5, Math.min(50, this.cameraDistance + e.deltaY * 0.02));
  };

  private onTouchStart = (e: TouchEvent): void => {
    if (e.touches.length === 1) {
      const touch = e.touches[0];
      if (touch.clientX < this.container.clientWidth / 2) {
        this.touchJoystick.active = true;
        this.touchJoystick.startX = touch.clientX;
        this.touchJoystick.startY = touch.clientY;
        this.touchJoystick.currentX = touch.clientX;
        this.touchJoystick.currentY = touch.clientY;
        e.preventDefault();
      } else {
        this.state.attack = true;
      }
    }
  };

  private onTouchMove = (e: TouchEvent): void => {
    if (this.touchJoystick.active && e.touches.length >= 1) {
      const touch = e.touches[0];
      this.touchJoystick.currentX = touch.clientX;
      this.touchJoystick.currentY = touch.clientY;
      e.preventDefault();
    }
  };

  private onTouchEnd = (e: TouchEvent): void => {
    if (e.touches.length === 0) {
      this.touchJoystick.active = false;
    }
  };

  update(): void {
    let moveX = 0;
    let moveZ = 0;

    if (this.keys.has('KeyW') || this.keys.has('ArrowUp')) moveZ -= 1;
    if (this.keys.has('KeyS') || this.keys.has('ArrowDown')) moveZ += 1;
    if (this.keys.has('KeyA') || this.keys.has('ArrowLeft')) moveX -= 1;
    if (this.keys.has('KeyD') || this.keys.has('ArrowRight')) moveX += 1;

    if (this.touchJoystick.active) {
      const dx = this.touchJoystick.currentX - this.touchJoystick.startX;
      const dy = this.touchJoystick.currentY - this.touchJoystick.startY;
      const maxDist = 50;
      moveX = Math.max(-1, Math.min(1, dx / maxDist));
      moveZ = Math.max(-1, Math.min(1, dy / maxDist));
    }

    const cos = Math.cos(this.cameraYaw);
    const sin = Math.sin(this.cameraYaw);
    this.state.moveX = moveX * cos - moveZ * sin;
    this.state.moveZ = moveX * sin + moveZ * cos;

    if (Math.abs(this.state.moveX) > 0.01 || Math.abs(this.state.moveZ) > 0.01) {
      this.state.rotation = Math.atan2(this.state.moveX, this.state.moveZ);
    }
  }

  getState(): InputState {
    return this.state;
  }

  consumeDash(): boolean {
    const was = this.state.dash;
    this.state.dash = false;
    return was;
  }

  consumeAttack(): boolean {
    const was = this.state.attack;
    this.state.attack = false;
    return was;
  }

  consumeSwitchWeapon(): boolean {
    const was = this.state.switchWeapon;
    this.state.switchWeapon = false;
    return was;
  }

  consumeInteract(): boolean {
    const was = this.state.interact;
    this.state.interact = false;
    return was;
  }

  getCameraYaw(): number {
    return this.cameraYaw;
  }

  getCameraPitch(): number {
    return this.cameraPitch;
  }

  getCameraDistance(): number {
    return this.cameraDistance;
  }

  dispose(): void {
    window.removeEventListener('keydown', this.onKeyDown);
    window.removeEventListener('keyup', this.onKeyUp);
    window.removeEventListener('mouseup', this.onMouseUp);
    window.removeEventListener('mousemove', this.onMouseMove);
  }
}
