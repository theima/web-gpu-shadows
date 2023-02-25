import { Lights } from "./lights";

export function createLights(
  device: GPUDevice,
  layout: GPUBindGroupLayout,
  numberOfLights: number
): Lights {
  const ambientBuffer = device.createBuffer({
    label: "Ambient light buffer",
    size: 1 * 4,
    usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
  });
  const ambient = new Float32Array([0.4]);

  device.queue.writeBuffer(ambientBuffer, 0, ambient);

  const pointBuffer = device.createBuffer({
    label: "Point light buffer",
    size: 8 * 8 * numberOfLights,
    usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST,
  });

  const pointLights = new Float32Array(8 * numberOfLights);
  const intensity = 4;
  const radius = 20;
  for (var i = 0; i < numberOfLights; i++) {
    const offset = 8 * i;
    pointLights[offset + 2] = -50; // z
    pointLights[offset + 4] = intensity;
    pointLights[offset + 5] = radius;
  }

  device.queue.writeBuffer(pointBuffer, 0, pointLights);

  const pointLightCountBuffer = device.createBuffer({
    label: "point light count buffer",
    size: 1 * 4,
    usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
  });
  device.queue.writeBuffer(
    pointLightCountBuffer,
    0,
    new Int32Array([numberOfLights])
  );

  const bindGroup = device.createBindGroup({
    label: "lightBindGroup",
    layout,
    entries: [
      {
        binding: 0,
        resource: {
          buffer: ambientBuffer,
        },
      },
      {
        binding: 1,
        resource: {
          buffer: pointBuffer,
        },
      },
      {
        binding: 2,
        resource: {
          buffer: pointLightCountBuffer,
        },
      },
    ],
  });

  return { bindGroup, pointLights, pointBuffer, numberOfLights };
}
