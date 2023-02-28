import instanceShader from "./instance.wgsl?raw";
import depthShader from "./depth.wgsl?raw";

const buffers: GPUVertexBufferLayout[] = [
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
];
const primitive: GPUPrimitiveState = {
  topology: "triangle-list",
  cullMode: "back",
};
const depthStencil: GPUDepthStencilState = {
  depthWriteEnabled: true,
  depthCompare: "less",
  format: "depth24plus",
};
export async function createShadowPipeline(
  device: GPUDevice,
  format: GPUTextureFormat
): Promise<GPURenderPipeline> {
  const descriptor: GPURenderPipelineDescriptor = {
    label: "Shadow Pipline",
    layout: "auto",
    vertex: {
      module: device.createShaderModule({
        code: depthShader,
      }),
      entryPoint: "main",
      buffers,
    },
    primitive,
    depthStencil,
  };
  return await device.createRenderPipelineAsync(descriptor);
}

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
      buffers,
    },
    primitive,
    depthStencil,
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
