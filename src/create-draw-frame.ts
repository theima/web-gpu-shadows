import { mat4, vec3 } from "gl-matrix";
import { getConfiguredContext } from "./get-configured-context";
import { pipelines } from "./pipelines/pipelines";
import { renderScene } from "./render/render-scene";
import { centerPoint } from "./scene/create-scene";
import { Lights } from "./scene/lights";
import { Scene } from "./scene/scene";

export function createDrawFrame(
  device: GPUDevice,
  pipelines: pipelines,
  canvas: HTMLCanvasElement,
  format: GPUTextureFormat,
  scene: Scene
) {
  const context: GPUCanvasContext = getConfiguredContext(
    canvas,
    device,
    format
  );
  const lightViewMatrix = mat4.create();
  const lightProjectionMatrix = mat4.create();
  const lightPosition = vec3.fromValues(25, 70, 40);
  const up = vec3.fromValues(0, 1, 0);
  const origin = vec3.fromValues(0, 0, -40);
  return () => {
    const now = Date.now() / 1000;

    //const now = performance.now()
    //lightPosition[0] = Math.sin(now) * 5;
    //lightPosition[2] = Math.cos(now) * 5;
    // update lvp matrix
    mat4.lookAt(lightViewMatrix, lightPosition, origin, up);
    mat4.ortho(lightProjectionMatrix, -40, 40, -40, 40, -50, 200);
    mat4.multiply(
      lightProjectionMatrix,
      lightProjectionMatrix,
      lightViewMatrix
    );
    device.queue.writeBuffer(
      scene.lightProjectionBuffer,
      0,
      lightProjectionMatrix as Float32Array
    );
    device.queue.writeBuffer(
      scene.lightBuffer,
      0,
      lightPosition as Float32Array
    );

    const numberOfSpheres = scene.spheres.numberOfInstances;
    const numberOfCubes = scene.cubes.numberOfInstances;
    const speeds = scene.spheres.speeds;
    const allMv = new Float32Array((numberOfSpheres + numberOfCubes) * 4 * 4);

    for (let i = 0; i < numberOfSpheres; i++) {
      const instanceTransform = scene.spheres.transforms[i];
      const transformationMatrix = mat4.create();
      mat4.fromYRotation(
        transformationMatrix,
        (speeds[i] * (now * Math.PI * 2)) / 1000
      );
      let position: vec3 = vec3.fromValues(
        instanceTransform.position[0],
        instanceTransform.position[1],
        instanceTransform.position[2]
      );
      vec3.subtract(position, position, centerPoint);
      vec3.transformMat4(position, position, transformationMatrix);
      vec3.add(position, position, centerPoint);
      const mv: mat4 = mat4.create();
      mat4.translate(mv, mv, position);

      mat4.rotateX(mv, mv, instanceTransform.rotation[0]);
      mat4.rotateY(mv, mv, instanceTransform.rotation[1]);
      mat4.rotateZ(mv, mv, instanceTransform.rotation[2]);

      mat4.scale(mv, mv, instanceTransform.scale);

      allMv.set(mv, i * 4 * 4);
    }

    for (let i = 0; i < numberOfCubes; i++) {
      const instanceTransform = scene.cubes.transforms[i];
      const mv: mat4 = mat4.create();
      mat4.translate(mv, mv, instanceTransform.position);
      mat4.scale(mv, mv, instanceTransform.scale);
      mat4.rotateX(mv, mv, instanceTransform.rotation[0]);
      mat4.rotateY(mv, mv, instanceTransform.rotation[1]);
      mat4.rotateZ(mv, mv, instanceTransform.rotation[2]);
      allMv.set(mv, (i + numberOfSpheres) * 4 * 4);
    }

    device.queue.writeBuffer(scene.mvBuffer, 0, allMv);
    renderScene(
      device,
      context.getCurrentTexture().createView(),
      pipelines,
      scene
    );
  };
}
