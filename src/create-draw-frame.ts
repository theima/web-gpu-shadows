import { mat2, mat4, vec2, vec3 } from "gl-matrix";
import { getConfiguredContext } from "./get-configured-context";
import { getTransformationMatrix } from "./helpers/get-transformation-matrix";
import { renderInstances } from "./render/render-view";
import { centerPoint } from "./scene/create-scene";
import { Lights } from "./scene/lights";
import { Scene } from "./scene/scene";

export function createDrawFrame(
  device: GPUDevice,
  pipeline: GPURenderPipeline,
  canvas: HTMLCanvasElement,
  format: GPUTextureFormat,
  scene: Scene,
  lights: Lights
) {
  const context: GPUCanvasContext = getConfiguredContext(
    canvas,
    device,
    format
  );

  const depthTexture = device.createTexture({
    size: {
      width: canvas.width,
      height: canvas.height,
    },
    format: "depth24plus",
    usage: GPUTextureUsage.RENDER_ATTACHMENT,
  });
  const numberOfInstances = scene.numberOfInstances;
  const numberOfLights = lights.numberOfLights;
  const start = Date.now() / 1000;
  return () => {
    const now = Date.now() / 1000;

    for (var i = 0; i < numberOfLights; i++) {
      const offset = 8 * i;
      const posOffset = ((2 * Math.PI) / numberOfLights) * i;
      lights.pointLights[offset + 0] = 10 * Math.sin(now / 2 + posOffset);
      lights.pointLights[offset + 1] = 10 * Math.cos(now / 2 + posOffset);
      lights.pointLights[offset + 2] = -50 + 25 * Math.cos(now / 2 + posOffset);
    }

    device.queue.writeBuffer(lights.pointBuffer, 0, lights.pointLights);

    const allMv = new Float32Array(numberOfInstances * 4 * 4);
    for (let i = 0; i < numberOfInstances; i++) {
      const instanceTransform = scene.transforms[i];
      const transformationMatrix = getTransformationMatrix(
        (now * Math.PI * 2) / 10
      );
      let position = vec3.fromValues(0, 0, 0);
      position = vec3.fromValues(
        instanceTransform.position[0],
        instanceTransform.position[1],
        instanceTransform.position[2]
      );
      vec3.subtract(position, position, centerPoint);
      vec3.transformMat4(position, position, transformationMatrix);
      vec3.add(position, position, centerPoint);
      const mv: mat4 = mat4.create();
      mat4.translate(mv, mv, position);
      // rotate
      mat4.rotateX(mv, mv, instanceTransform.rotation[0]);
      mat4.rotateY(mv, mv, instanceTransform.rotation[1]);
      mat4.rotateZ(mv, mv, instanceTransform.rotation[2]);
      // scale
      mat4.scale(mv, mv, instanceTransform.scale);

      allMv.set(mv, i * 4 * 4);
    }
    device.queue.writeBuffer(scene.mvBuffer, 0, allMv);
    renderInstances(
      device,
      context.getCurrentTexture().createView(),
      pipeline,
      scene.indexedBuffer,
      [...scene.bindGroups, lights.bindGroup],
      depthTexture,
      numberOfInstances
    );
  };
}
