import { IndexedBuffer } from "../render/indexed-buffer";
import { Transform } from "./transform";

export interface Scene {
  spheres: {
    transforms: Transform[];
    speeds: number[];
    numberOfInstances: number;
  };

  indexedBuffer: IndexedBuffer;
  bindGroups: GPUBindGroup[];
  mvBuffer: GPUBuffer;
}
