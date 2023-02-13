import { IndexedBuffer } from "./indexed-buffer";

export function renderInstances(
  device: GPUDevice,
  view: GPUTextureView,
  pipeline: GPURenderPipeline,
  instances: IndexedBuffer,
  bindGroups: GPUBindGroup[],
  depthTexture: GPUTexture,
  numberOfInstances: number
) {
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
  passEncoder.setVertexBuffer(0, instances.vertex);
  passEncoder.setIndexBuffer(instances.index, "uint16");

  passEncoder.drawIndexed(instances.indexCount, numberOfInstances);
  passEncoder.end();

  device.queue.submit([commandEncoder.finish()]);
}
