import { vec3 } from "gl-matrix";
import { Scene, SphereInstanceData, InstanceData } from "./scene";
import { Transform } from "./transform";
import { cube } from "./cube";
import { sphere } from "./sphere";
import { getProjectionMatrix } from "../get-projection-matrix";
import Rand from "rand-seed";
import { createLights } from "./create-lights";
export const centerPoint = vec3.fromValues(0, 10, -60);
const planeY = -5;

const seed = Math.random() + "";
const rng = new Rand(seed);
const getCentredOffset = (offset: number) => (rng.next() - 0.5) * offset;

function createSpheres(device: GPUDevice, count: number): SphereInstanceData {
  const instance = sphere;
  const sphereTransforms: Transform[] = [];
  const sphereSpeeds: number[] = [];

  for (let i = 0; i < count; i++) {
    const position = vec3.fromValues(
      centerPoint[0] + getCentredOffset(30),
      centerPoint[1] + getCentredOffset(5),
      centerPoint[2] + getCentredOffset(30)
    );
    const distSquare = Math.abs(position[0]) + Math.abs(position[2]);
    const rotation = vec3.fromValues(0, 0, -2);
    const scale = 0.5 + (rng.next() - 0.5) * 0.2;
    sphereTransforms.push({
      position,
      rotation,
      scale: vec3.fromValues(scale, scale, scale),
    });
    sphereSpeeds.push(distSquare * (rng.next() + 0.5));
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
  return {
    transforms: sphereTransforms,
    numberOfInstances: count,
    speeds: sphereSpeeds,
    indexedBuffer,
  };
}
function createPlaneTransform(): Transform {
  const size = 100;
  const offset = -size / 2;
  return {
    position: vec3.fromValues(0, planeY, offset),
    rotation: vec3.fromValues(0, 0, 0),
    scale: vec3.fromValues(size, 0.1, size),
  };
}
function createCubes(device: GPUDevice, count: number): InstanceData {
  const instance = cube;
  const transforms: Transform[] = [createPlaneTransform()];

  for (let i = 1; i < count; i++) {
    const position = vec3.fromValues(
      centerPoint[0] + getCentredOffset(60),
      planeY,
      centerPoint[2] + getCentredOffset(60)
    );

    const rotation = vec3.fromValues(0, 0, 0);
    const scale = 1.5 + (rng.next() - 0.5) * 0.2;
    const height = 3 + rng.next() * 3;
    transforms.push({
      position,
      rotation,
      scale: vec3.fromValues(scale, height, scale),
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
  return {
    transforms: transforms,
    numberOfInstances: count,
    indexedBuffer,
  };
}

export function createScene(
  device: GPUDevice,
  pipeline: GPURenderPipeline,
  width: number,
  height: number
): Scene {
  const numberOfSpheres: number = 52;
  const numberOfCubes = 15;
  let numberOfLights = 2;
  const spheres = createSpheres(device, numberOfSpheres);
  const cubes = createCubes(device, numberOfCubes);
  const lights = createLights(
    device,
    pipeline.getBindGroupLayout(1),
    numberOfLights
  );
  const colourList = [
    [0.82, 0.82, 0.48],
    [0.67, 0.45, 0.49],
    [0.3, 0.4, 0.5],
    [0.45, 0.29, 0.51],
    [0.27, 0.39, 0.24],
  ];

  const numberOfInstances = numberOfSpheres + numberOfCubes;
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
    size: 4 * 4 * 4 * (numberOfSpheres + numberOfCubes),
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
  const aspect = width / height;
  const projectionMatrix = getProjectionMatrix(
    aspect,
    (60 / 180) * Math.PI,
    0.1,
    1000,
    { x: 0, y: 30, z: -5 },
    { x: 0, y: 0, z: -40 }
  );
  device.queue.writeBuffer(projectionBuffer, 0, projectionMatrix);

  return {
    spheres,
    cubes,
    bindGroups: [bindGroup, lights.bindGroup],
    mvBuffer,
    lights,
  };
}
