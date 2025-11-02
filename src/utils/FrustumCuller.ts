import * as THREE from 'three'

export class FrustumCuller {
  private frustum: THREE.Frustum
  private projectionMatrix: THREE.Matrix4
  private boundingSphere: THREE.Sphere

  constructor() {
    this.frustum = new THREE.Frustum()
    this.projectionMatrix = new THREE.Matrix4()
    this.boundingSphere = new THREE.Sphere()
  }

  /**
   * Update frustum from camera
   */
  public updateFromCamera(camera: THREE.Camera): void {
    this.projectionMatrix.multiplyMatrices(
      camera.projectionMatrix,
      camera.matrixWorldInverse,
    )
    this.frustum.setFromProjectionMatrix(this.projectionMatrix)
  }

  /**
   * Test if a point with radius is in frustum
   */
  public isInFrustum(position: THREE.Vector3, radius: number): boolean {
    this.boundingSphere.set(position, radius)
    return this.frustum.intersectsSphere(this.boundingSphere)
  }
}
