import { mat4 } from "gl-matrix";

/**
 * returns a transformation matrix rotating around the y axis;
 * @param rad
 */
export function getTransformationMatrix(radian: number): mat4 {
  const cos = Math.cos(radian);
  const sin = Math.sin(radian);
  return mat4.fromValues(
    cos,
    0,
    -sin,
    0,

    0,
    1,
    0,
    0,

    sin,
    0,
    cos,
    0,

    0,
    0,
    0,
    1
  );
}
