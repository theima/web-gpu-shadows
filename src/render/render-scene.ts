import { Lights } from "../scene/lights";
import { Scene } from "../scene/scene";

export function renderScene(
  device: GPUDevice,
  view: GPUTextureView,
  pipeline: GPURenderPipeline,
  scene: Scene,
  lights: Lights,
  depthTexture: GPUTexture
) {
  const spheres = scene.spheres.indexedBuffer;
  const cubes = scene.cubes.indexedBuffer;
  const bindGroups = [...scene.bindGroups, lights.bindGroup];
  const renderPassDescriptor: GPURenderPassDescriptor = {
    colorAttachments: [
      {
        view,
        clearValue: { r: 0, g: 0, b: 0, a: 1.0 },
        loadOp: "clear",
        storeOp: "store",
      },
    ],
    depthStencilAttachment: {
      view: depthTexture.createView(),
      depthClearValue: 1.0,
      depthLoadOp: "clear",
      depthStoreOp: "store",
    },
  };
  const commandEncoder = device.createCommandEncoder();
  const passEncoder = commandEncoder.beginRenderPass(renderPassDescriptor);
  passEncoder.setPipeline(pipeline);
  bindGroups.forEach((g, i) => passEncoder.setBindGroup(i, g));
  passEncoder.setVertexBuffer(0, spheres.vertex);
  passEncoder.setIndexBuffer(spheres.index, "uint16");
  passEncoder.drawIndexed(spheres.indexCount, scene.spheres.numberOfInstances);
  passEncoder.setVertexBuffer(0, cubes.vertex);
  passEncoder.setIndexBuffer(cubes.index, "uint16");
  passEncoder.drawIndexed(
    cubes.indexCount,
    scene.cubes.numberOfInstances,
    undefined,
    undefined,
    scene.spheres.numberOfInstances
  );
  passEncoder.end();

  device.queue.submit([commandEncoder.finish()]);
}
