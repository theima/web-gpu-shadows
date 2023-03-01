import { IndexedBuffer } from "../render/indexed-buffer";
import { Lights } from "./lights";
import { Transform } from "./transform";

export interface InstanceData {
  transforms: Transform[];
  numberOfInstances: number;
  indexedBuffer: IndexedBuffer;
}
export interface SphereInstanceData extends InstanceData {
  speeds: number[];
}
export interface Scene {
  spheres: SphereInstanceData;
  cubes: InstanceData;
  bindGroups: GPUBindGroup[];
  mvBuffer: GPUBuffer;
  lights: Lights;
}
