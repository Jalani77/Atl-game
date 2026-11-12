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
  private cameraPitch = 0.42;
  private cameraDistance = 12;
  private overview = false;
  private savedView = { pitch: 0.42, distance: 12 };
  private lookTouch: { id: number; x: number; y: number; moved: boolean } | null = null;
  private pinchDistance: number | null = null;

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
    this.container.addEventListener('wheel', this.onWheel, { passive: false });
    this.container.addEventListener('contextmenu', (e) => {
      if (e.target instanceof HTMLCanvasElement) e.preventDefault();
    });

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

  private isUi(target: EventTarget | null): boolean {
    return target instanceof Element && !!target.closest('button, input, textarea, details, .hud-panel, .screen');
  }

  private onMouseDown = (e: MouseEvent): void => {
    if (this.isUi(e.target)) return;
    this.mouseButtons.add(e.button);
    if (e.button === 0 && e.target instanceof HTMLCanvasElement) {
      this.state.attack = true;
    }
  };

  private onMouseUp = (e: MouseEvent): void => {
    this.mouseButtons.delete(e.button);
  };

  private onMouseMove = (e: MouseEvent): void => {
    this.state.mouseX = e.clientX;
    this.state.mouseY = e.clientY;
    if (!this.mouseButtons.has(2)) return;
    this.cameraYaw -= e.movementX * 0.005;
    this.cameraPitch = Math.max(0.15, Math.min(1.15, this.cameraPitch - e.movementY * 0.004));
  };

  private onWheel = (e: WheelEvent): void => {
    if (this.isUi(e.target)) return;
    e.preventDefault();
    const delta = Math.max(-40, Math.min(40, e.deltaY));
    this.cameraDistance = Math.max(4.5, Math.min(48, this.cameraDistance + delta * 0.02));
  };

  private onTouchStart = (e: TouchEvent): void => {
    if (this.isUi(e.target)) return;
    if (e.touches.length >= 2) {
      const a = e.touches[0];
      const b = e.touches[1];
      this.pinchDistance = Math.hypot(a.clientX - b.clientX, a.clientY - b.clientY);
      e.preventDefault();
      return;
    }
    const touch = e.touches[0];
    if (touch.clientX < this.container.clientWidth * 0.42) {
      this.touchJoystick.active = true;
      this.touchJoystick.startX = touch.clientX;
      this.touchJoystick.startY = touch.clientY;
      this.touchJoystick.currentX = touch.clientX;
      this.touchJoystick.currentY = touch.clientY;
      e.preventDefault();
      return;
    }
    this.lookTouch = { id: touch.identifier, x: touch.clientX, y: touch.clientY, moved: false };
  };

  private onTouchMove = (e: TouchEvent): void => {
    if (e.touches.length >= 2 && this.pinchDistance !== null) {
      const a = e.touches[0];
      const b = e.touches[1];
      const next = Math.hypot(a.clientX - b.clientX, a.clientY - b.clientY);
      this.cameraDistance = Math.max(4.5, Math.min(48, this.cameraDistance - (next - this.pinchDistance) * 0.05));
      this.pinchDistance = next;
      e.preventDefault();
      return;
    }
    if (this.lookTouch) {
      const touch = Array.from(e.touches).find((item) => item.identifier === this.lookTouch!.id);
      if (touch) {
        const dx = touch.clientX - this.lookTouch.x;
        const dy = touch.clientY - this.lookTouch.y;
        if (Math.hypot(dx, dy) > 8) this.lookTouch.moved = true;
        this.cameraYaw -= dx * 0.008;
        this.cameraPitch = Math.max(0.15, Math.min(1.15, this.cameraPitch - dy * 0.006));
        this.lookTouch.x = touch.clientX;
        this.lookTouch.y = touch.clientY;
        e.preventDefault();
      }
    }
    if (this.touchJoystick.active) {
      const touch = e.touches[0];
      this.touchJoystick.currentX = touch.clientX;
      this.touchJoystick.currentY = touch.clientY;
      e.preventDefault();
    }
  };

  private onTouchEnd = (e: TouchEvent): void => {
    if (e.touches.length < 2) this.pinchDistance = null;
    if (e.touches.length === 0) this.touchJoystick.active = false;
    if (this.lookTouch && !Array.from(e.touches).some((touch) => touch.identifier === this.lookTouch!.id)) {
      if (!this.lookTouch.moved) this.state.attack = true;
      this.lookTouch = null;
    }
  };

  update(): void {
    let strafe = 0;
    let forward = 0;

    if (this.keys.has('KeyW') || this.keys.has('ArrowUp')) forward += 1;
    if (this.keys.has('KeyS') || this.keys.has('ArrowDown')) forward -= 1;
    if (this.keys.has('KeyA') || this.keys.has('ArrowLeft')) strafe -= 1;
    if (this.keys.has('KeyD') || this.keys.has('ArrowRight')) strafe += 1;

    if (this.touchJoystick.active) {
      const dx = this.touchJoystick.currentX - this.touchJoystick.startX;
      const dy = this.touchJoystick.currentY - this.touchJoystick.startY;
      const maxDist = 50;
      strafe = Math.max(-1, Math.min(1, dx / maxDist));
      forward = Math.max(-1, Math.min(1, -dy / maxDist));
    }

    const sin = Math.sin(this.cameraYaw);
    const cos = Math.cos(this.cameraYaw);
    const forwardX = -sin;
    const forwardZ = -cos;
    const rightX = cos;
    const rightZ = -sin;
    this.state.moveX = rightX * strafe + forwardX * forward;
    this.state.moveZ = rightZ * strafe + forwardZ * forward;

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

  aimAt(dx: number, dz: number): void {
    this.cameraYaw = Math.atan2(-dx, -dz);
    this.cameraPitch = 0.4;
    this.cameraDistance = 12;
  }

  resetView(facing: number): void {
    this.overview = false;
    this.cameraYaw = facing + Math.PI;
    this.cameraPitch = 0.42;
    this.cameraDistance = 12;
  }

  toggleOverview(): boolean {
    this.overview = !this.overview;
    if (this.overview) {
      this.savedView = { pitch: this.cameraPitch, distance: this.cameraDistance };
      this.cameraPitch = 1.05;
      this.cameraDistance = 42;
    } else {
      this.cameraPitch = this.savedView.pitch;
      this.cameraDistance = this.savedView.distance;
    }
    return this.overview;
  }

  isOverview(): boolean {
    return this.overview;
  }

  dispose(): void {
    window.removeEventListener('keydown', this.onKeyDown);
    window.removeEventListener('keyup', this.onKeyUp);
    window.removeEventListener('mouseup', this.onMouseUp);
    window.removeEventListener('mousemove', this.onMouseMove);
  }
}
