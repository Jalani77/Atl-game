import * as THREE from 'three';
import type { InputManager } from '../input/InputManager';
import type { Vec3 } from '@campus-rivals/shared';

export class CameraController {
  private camera: THREE.PerspectiveCamera;
  private input: InputManager;
  private targetPosition = new THREE.Vector3();
  private currentPosition = new THREE.Vector3();
  private smoothness = 8;

  constructor(camera: THREE.PerspectiveCamera, input: InputManager) {
    this.camera = camera;
    this.input = input;
  }

  update(dt: number, playerPos: Vec3): void {
    const yaw = this.input.getCameraYaw();
    const pitch = this.input.getCameraPitch();
    const distance = this.input.getCameraDistance();

    const offsetX = Math.sin(yaw) * Math.cos(pitch) * distance;
    const offsetY = Math.sin(pitch) * distance;
    const offsetZ = Math.cos(yaw) * Math.cos(pitch) * distance;

    this.targetPosition.set(
      playerPos.x + offsetX,
      playerPos.y + offsetY + 2,
      playerPos.z + offsetZ
    );

    const t = 1 - Math.exp(-this.smoothness * dt);
    this.currentPosition.lerp(this.targetPosition, t);

    this.camera.position.copy(this.currentPosition);
    this.camera.lookAt(playerPos.x, playerPos.y + 1.5, playerPos.z);
  }
}
