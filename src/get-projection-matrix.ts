import { mat4, vec3 } from "gl-matrix";

const center = vec3.fromValues(0, 0, 0);
const up = vec3.fromValues(0, 1, 0);
export function getProjectionMatrix(
  aspect: number,
  fov: number = (60 / 180) * Math.PI,
  near: number = 0.1,
  far: number = 100.0,
  position = { x: 0, y: 0, z: 0 }
): Float32Array {
  const cameraView = mat4.create();
  const eye = vec3.fromValues(position.x, position.y, position.z);
  mat4.translate(cameraView, cameraView, eye);
  mat4.lookAt(cameraView, eye, center, up);

  const projectionMatrix = mat4.create();
  mat4.perspective(projectionMatrix, fov, aspect, near, far);
  mat4.multiply(projectionMatrix, projectionMatrix, cameraView);
  return projectionMatrix as Float32Array;
}
