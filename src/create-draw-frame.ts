import { mat4, vec3 } from "gl-matrix";
import { getConfiguredContext } from "./get-configured-context";
import { renderScene } from "./render/render-scene";
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

  const numberOfLights = lights.numberOfLights;
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
      pipeline,
      scene,
      lights,
      depthTexture
    );
  };
}
