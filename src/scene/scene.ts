import { IndexedBuffer } from "../render/indexed-buffer";
import { Transform } from "./transform";

export interface Scene {
  transforms: Transform[];
  indexedBuffer: IndexedBuffer;
  bindGroups: GPUBindGroup[];
  mvBuffer: GPUBuffer;
}
