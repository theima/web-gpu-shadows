import { mat4 } from "gl-matrix";
import { getConfiguredContext } from "./get-configured-context";
import { renderInstances } from "./render/render-view";
import { Lights } from "./scene/lights";
import { Scene } from "./scene/scene";

export function createDrawFrame(
  device: GPUDevice,
  pipeline: GPURenderPipeline,
  canvas: HTMLCanvasElement,
  format: GPUTextureFormat,
  scene: Scene,
  lights: Lights,
  numberOfInstances: number,
  numberOfLights: number
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
      const instanceTransfrom = scene.transforms[i];
      instanceTransfrom.rotation[0] = Math.sin(now + i);
      instanceTransfrom.rotation[1] = Math.cos(now + i);
      const mv: mat4 = mat4.create();
      mat4.translate(mv, mv, instanceTransfrom.position);
      // rotatek
      mat4.rotateX(mv, mv, instanceTransfrom.rotation[0]);
      mat4.rotateY(mv, mv, instanceTransfrom.rotation[1]);
      mat4.rotateZ(mv, mv, instanceTransfrom.rotation[2]);
      // scale
      mat4.scale(mv, mv, instanceTransfrom.scale);

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
