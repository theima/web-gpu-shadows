import { vec3 } from "gl-matrix";

export interface Transform {
  position: vec3;
  rotation: vec3;
  scale: vec3;
}
