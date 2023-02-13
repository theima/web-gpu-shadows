import { vec3 } from "gl-matrix";
import { Scene } from "./scene";
import { Transform } from "./transform";
import { cube } from "./cube";
import { getProjectionMatrix } from "../get-projection-matrix";
import Rand from "rand-seed";

const seed = Math.random() + "";
export function createScene(
  device: GPUDevice,
  pipeline: GPURenderPipeline,
  numberOfInstances: number,
  width: number,
  height: number
): Scene {
  const transforms: Transform[] = [];
  const rng = new Rand(seed);
  for (let i = 0; i < numberOfInstances; i++) {
    const position = vec3.fromValues(
      rng.next() * 50 - 25,
      rng.next() * 50 - 25,
      -30 - rng.next() * 60
    );
    const rotation = vec3.fromValues(0, 0, -2);
    const scale = vec3.fromValues(0.6, 0.6, 0.6);
    transforms.push({
      position,
      rotation,
      scale,
    });
  }

  const vertexBuffer = device.createBuffer({
    size: cube.vertex.byteLength,
    usage: GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST,
  });
  const indexBuffer = device.createBuffer({
    size: cube.index.byteLength,
    usage: GPUBufferUsage.INDEX | GPUBufferUsage.COPY_DST,
  });
  device.queue.writeBuffer(vertexBuffer, 0, cube.vertex);
  device.queue.writeBuffer(indexBuffer, 0, cube.index);

  const indexedBuffer = { ...cube, vertex: vertexBuffer, index: indexBuffer };
  const colourList = [
    [0.82, 0.82, 0.48],
    [0.67, 0.45, 0.49],
    [0.3, 0.4, 0.5],
    [0.45, 0.29, 0.51],
    [0.27, 0.39, 0.24],
  ];
  const colours = new Float32Array(4 * numberOfInstances);
  const colourBuffer = device.createBuffer({
    label: "colourBuffer",
    size: 4 * 4 * numberOfInstances,
    usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST,
  });
  for (let i = 0; i < numberOfInstances; i++) {
    const index = i % colourList.length;
    colours.set(colourList[index], i * 4);
  }
  device.queue.writeBuffer(colourBuffer, 0, colours);

  const mvBuffer = device.createBuffer({
    label: "mvBuffer",
    size: 4 * 4 * 4 * numberOfInstances,
    usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST,
  });
  const projectionBuffer = device.createBuffer({
    label: "projectionBuffer",
    size: 4 * 4 * 4,
    usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
  });

  const bindGroup = device.createBindGroup({
    layout: pipeline.getBindGroupLayout(0),
    entries: [
      {
        binding: 0,
        resource: {
          buffer: mvBuffer,
        },
      },
      {
        binding: 1,
        resource: {
          buffer: projectionBuffer,
        },
      },
      {
        binding: 2,
        resource: {
          buffer: colourBuffer,
        },
      },
    ],
  });
  device.queue.writeBuffer(
    projectionBuffer,
    0,
    getProjectionMatrix(width / height)
  );

  return { transforms, indexedBuffer, bindGroups: [bindGroup], mvBuffer };
}
