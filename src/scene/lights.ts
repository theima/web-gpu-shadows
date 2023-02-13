export interface Lights {
  bindGroup: GPUBindGroup;
  pointLights: Float32Array;
  pointBuffer: GPUBuffer;
}
