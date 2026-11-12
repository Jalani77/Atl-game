import * as THREE from 'three';
import type { InputManager } from '../input/InputManager';
import type { Vec3 } from '@campus-rivals/shared';

export class CameraController {
  private camera: THREE.PerspectiveCamera;
  private input: InputManager;
  private scene: THREE.Scene;
  private targetPosition = new THREE.Vector3();
  private currentPosition = new THREE.Vector3();
  private lookAt = new THREE.Vector3();
  private raycaster = new THREE.Raycaster();
  private smoothness = 7;

  constructor(camera: THREE.PerspectiveCamera, input: InputManager, scene: THREE.Scene) {
    this.camera = camera;
    this.input = input;
    this.scene = scene;
  }

  update(dt: number, playerPos: Vec3): void {
    const yaw = this.input.getCameraYaw();
    const pitch = this.input.getCameraPitch();
    const distance = this.input.getCameraDistance();

    const offsetX = Math.sin(yaw) * Math.cos(pitch) * distance;
    const offsetY = Math.sin(pitch) * distance + 1.6;
    const offsetZ = Math.cos(yaw) * Math.cos(pitch) * distance;

    const focus = new THREE.Vector3(playerPos.x, playerPos.y + 1.35, playerPos.z);
    this.targetPosition.set(playerPos.x + offsetX, playerPos.y + offsetY, playerPos.z + offsetZ);

    const direction = this.targetPosition.clone().sub(focus);
    const length = direction.length();
    if (length > 0.1) {
      this.raycaster.camera = this.camera;
      this.raycaster.set(focus, direction.normalize());
      this.raycaster.far = length;
      const hits = this.raycaster.intersectObjects(this.scene.children, true);
      const blocked = hits.find((hit) => hit.object.userData.occlude && hit.distance > 0.6);
      if (blocked) {
        const pull = Math.max(2.2, blocked.distance - 0.45);
        this.targetPosition.copy(focus).add(direction.multiplyScalar(pull));
      }
    }

    const t = 1 - Math.exp(-this.smoothness * dt);
    this.currentPosition.lerp(this.targetPosition, t);
    this.lookAt.lerp(focus, t);
    this.camera.position.copy(this.currentPosition);
    this.camera.lookAt(this.lookAt);
  }
}
