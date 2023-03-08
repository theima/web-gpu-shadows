import { mat4, vec3 } from "gl-matrix";

const up = vec3.fromValues(0, 1, 0);
export function getProjectionMatrix(
  aspect: number,
  fov: number = (60 / 180) * Math.PI,
  near: number = 0.1,
  far: number = 100.0,
  eye: vec3 = vec3.fromValues(0, 0, 0),
  lookAt: vec3 = vec3.fromValues(0, 0, 0)
): Float32Array {
  const cameraView = mat4.create();
  mat4.translate(cameraView, cameraView, eye);
  mat4.lookAt(cameraView, eye, lookAt, up);

  const projectionMatrix = mat4.create();
  mat4.perspective(projectionMatrix, fov, aspect, near, far);
  mat4.multiply(projectionMatrix, projectionMatrix, cameraView);
  return projectionMatrix as Float32Array;
}
