import { vec3, mat4 } from "gl-matrix";
import { Scene, SphereInstanceData, InstanceData } from "./scene";
import { Transform } from "./transform";
import { cube } from "./cube";
import { sphere } from "./sphere";
import { getProjectionMatrix } from "./get-projection-matrix";
import Rand from "rand-seed";
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
  shadowPipeline: GPURenderPipeline,
  width: number,
  height: number
): Scene {
  const numberOfSpheres: number = 52;
  const numberOfCubes = 15;
  const spheres = createSpheres(device, numberOfSpheres);
  const cubes = createCubes(device, numberOfCubes);
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
  const lightProjectionBuffer = device.createBuffer({
    label: "GPUBuffer for light projection",
    size: 4 * 4 * 4, // 4 x 4 x float32
    usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
  });

  const vertexBindGroup = device.createBindGroup({
    label: "vertex bindgroup",
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
          buffer: lightProjectionBuffer,
        },
      },
      {
        binding: 3,
        resource: {
          buffer: colourBuffer,
        },
      },
    ],
  });
  const shadowDepthTexture = device.createTexture({
    size: [2048, 2048],
    usage: GPUTextureUsage.RENDER_ATTACHMENT | GPUTextureUsage.TEXTURE_BINDING,
    format: "depth32float",
  });
  const renderDepthTexture = device.createTexture({
    size: { width, height },
    format: "depth32float",
    usage: GPUTextureUsage.RENDER_ATTACHMENT,
  });
  const shadowDepthView = shadowDepthTexture.createView();
  const renderDepthView = renderDepthTexture.createView();
  const lightBuffer = device.createBuffer({
    label: "GPUBuffer store 4x4 matrix",
    size: 4 * 4, // 4 x float32: position vec4
    usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
  });
  const fragmentBindGroup = device.createBindGroup({
    label: "Group for fragment",
    layout: pipeline.getBindGroupLayout(1),
    entries: [
      {
        binding: 0,
        resource: {
          buffer: lightBuffer,
        },
      },
      {
        binding: 1,
        resource: shadowDepthView,
      },
      {
        binding: 2,
        resource: device.createSampler({
          compare: "less",
        }),
      },
    ],
  });
  const shadowBindGroup = device.createBindGroup({
    label: "Group for shadowPass",
    layout: shadowPipeline.getBindGroupLayout(0),
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
          buffer: lightProjectionBuffer,
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
    vec3.fromValues(0, 30, -5),
    vec3.fromValues(0, 0, -40)
  );
  device.queue.writeBuffer(projectionBuffer, 0, projectionMatrix);
  const updateLights = createUpdateLights(
    device,
    lightBuffer,
    lightProjectionBuffer
  );
  const updateScene = createUpdateScene(device, cubes, spheres, mvBuffer);
  const update = (now: number) => {
    updateLights(now);
    updateScene(now);
  };
  return {
    spheres,
    cubes,
    bindGroups: [vertexBindGroup, fragmentBindGroup],
    shadowBindGroup,
    shadowDepthView,
    renderDepthView,
    update,
  };
}

function createUpdateLights(
  device: GPUDevice,
  lightBuffer: GPUBuffer,
  lightProjectionBuffer: GPUBuffer
) {
  const lightViewMatrix = mat4.create();
  const lightProjectionMatrix = mat4.create();
  const xPos = 0;
  const lightPosition = vec3.fromValues(xPos, 70, 40);
  const up = vec3.fromValues(0, 1, 0);
  const origin = vec3.fromValues(0, 0, -100);
  return (now: number) => {
    const step = now / 2000;
    lightPosition[0] = xPos + Math.sin(step) * 30;
    lightPosition[2] = 40 + Math.cos(step) * 25;
    // update lvp matrix
    mat4.lookAt(lightViewMatrix, lightPosition, origin, up);
    mat4.ortho(lightProjectionMatrix, -40, 40, -40, 40, -50, 200);
    mat4.multiply(
      lightProjectionMatrix,
      lightProjectionMatrix,
      lightViewMatrix
    );
    device.queue.writeBuffer(
      lightProjectionBuffer,
      0,
      lightProjectionMatrix as Float32Array
    );
    device.queue.writeBuffer(lightBuffer, 0, lightPosition as Float32Array);
  };
}

function createUpdateScene(
  device: GPUDevice,
  cubes: InstanceData,
  spheres: SphereInstanceData,
  mvBuffer: GPUBuffer
) {
  return (now: number) => {
    const step = now / 1000;
    const numberOfSpheres = spheres.numberOfInstances;
    const numberOfCubes = cubes.numberOfInstances;
    const speeds = spheres.speeds;
    const allMv = new Float32Array((numberOfSpheres + numberOfCubes) * 4 * 4);

    for (let i = 0; i < numberOfSpheres; i++) {
      const instanceTransform = spheres.transforms[i];
      const transformationMatrix = mat4.create();
      mat4.fromYRotation(
        transformationMatrix,
        (speeds[i] * (step * Math.PI * 2)) / 1000
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
      const instanceTransform = cubes.transforms[i];
      const mv: mat4 = mat4.create();
      mat4.translate(mv, mv, instanceTransform.position);
      mat4.scale(mv, mv, instanceTransform.scale);
      mat4.rotateX(mv, mv, instanceTransform.rotation[0]);
      mat4.rotateY(mv, mv, instanceTransform.rotation[1]);
      mat4.rotateZ(mv, mv, instanceTransform.rotation[2]);
      allMv.set(mv, (i + numberOfSpheres) * 4 * 4);
    }

    device.queue.writeBuffer(mvBuffer, 0, allMv);
  };
}
