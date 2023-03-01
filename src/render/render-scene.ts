import { pipelines } from "../pipelines/pipelines";
import { Scene } from "../scene/scene";

export function renderScene(
  device: GPUDevice,
  view: GPUTextureView,
  pipelines: pipelines,
  scene: Scene,
) {
  const commandEncoder = device.createCommandEncoder();
  const shadowPassDescriptor: GPURenderPassDescriptor = {
    colorAttachments: [],
    depthStencilAttachment: {
      view: scene.shadowDepthView,
      depthClearValue: 1.0,
      depthLoadOp: "clear",
      depthStoreOp: "store",
    },
  };
  createPass(
    commandEncoder,
    shadowPassDescriptor,
    [scene.shadowBindGroup],
    scene,
    pipelines.shadowPass
  );

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
      view: scene.renderDepthView,
      depthClearValue: 1.0,
      depthLoadOp: "clear",
      depthStoreOp: "store",
    },
  };

  createPass(
    commandEncoder,
    renderPassDescriptor,
    scene.bindGroups,
    scene,
    pipelines.mainPass
  );

  device.queue.submit([commandEncoder.finish()]);
}

function createPass(
  commandEncoder: GPUCommandEncoder,
  descriptor: GPURenderPassDescriptor,
  bindGroups: GPUBindGroup[],
  scene: Scene,
  pipeline: GPURenderPipeline
): void {
  const spheres = scene.spheres.indexedBuffer;
  const cubes = scene.cubes.indexedBuffer;
  const passEncoder = commandEncoder.beginRenderPass(descriptor);
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
}
