import instanceShader from "./instance.wgsl?raw";

export async function createPipeline(
  device: GPUDevice,
  format: GPUTextureFormat
): Promise<GPURenderPipeline> {
  const descriptor: GPURenderPipelineDescriptor = {
    layout: "auto",
    vertex: {
      module: device.createShaderModule({
        code: instanceShader,
      }),
      entryPoint: "main",
      buffers: [
        {
          arrayStride: 8 * 4,
          attributes: [
            {
              shaderLocation: 0,
              offset: 0,
              format: "float32x3",
            },
            {
              shaderLocation: 1,
              offset: 3 * 4,
              format: "float32x3",
            },
            {
              shaderLocation: 2,
              offset: 5 * 4,
              format: "float32x2",
            },
          ],
        },
      ],
    },
    primitive: {
      topology: "triangle-list",
      cullMode: "back",
    },
    depthStencil: {
      depthWriteEnabled: true,
      depthCompare: "less",
      format: "depth24plus",
    },
    fragment: {
      module: device.createShaderModule({
        code: instanceShader,
      }),
      entryPoint: "fs_main",
      targets: [
        {
          format: format,
        },
      ],
    },
  };
  return await device.createRenderPipelineAsync(descriptor);
}
