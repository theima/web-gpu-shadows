import { vec3 } from "gl-matrix";
import { Scene } from "./scene";
import { Transform } from "./transform";
import { cube } from "./cube";
import { sphere } from "./sphere";
import { getProjectionMatrix } from "../get-projection-matrix";
import Rand from "rand-seed";
export const centerPoint = vec3.fromValues(0, 10, -60);
const seed = Math.random() + "";
export function createScene(
  device: GPUDevice,
  pipeline: GPURenderPipeline,
  numberOfInstances: number,
  width: number,
  height: number
): Scene {
  const instance = sphere;
  const transforms: Transform[] = [];
  //const centerPoint = vec3.fromValues(-16, 3, -60);

  const rng = new Rand(seed);
  const getCentred = () => rng.next() - 0.5;
  for (let i = 0; i < numberOfInstances; i++) {
    const position = vec3.fromValues(
      centerPoint[0] + getCentred() * 30,
      centerPoint[1] + getCentred() * 5,
      centerPoint[2] + getCentred() * 30
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
    size: instance.vertex.byteLength,
    usage: GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST,
  });
  const indexBuffer = device.createBuffer({
    size: instance.index.byteLength,
    usage: GPUBufferUsage.INDEX | GPUBufferUsage.COPY_DST,
  });
  device.queue.writeBuffer(vertexBuffer, 0, instance.vertex);
  device.queue.writeBuffer(indexBuffer, 0, instance.index);

  const indexedBuffer = {
    ...instance,
    vertex: vertexBuffer,
    index: indexBuffer,
  };
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

  return {
    transforms,
    indexedBuffer,
    bindGroups: [bindGroup],
    mvBuffer,
    numberOfInstances,
  };
}
