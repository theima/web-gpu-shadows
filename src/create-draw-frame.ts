import { getConfiguredContext } from "./get-configured-context";
import { pipelines } from "./pipelines/pipelines";
import { renderScene } from "./render/render-scene";
import { Scene } from "./scene/scene";

export function createDrawFrame(
  device: GPUDevice,
  pipelines: pipelines,
  canvas: HTMLCanvasElement,
  format: GPUTextureFormat,
  scene: Scene
): (now: number) => void {
  const context: GPUCanvasContext = getConfiguredContext(
    canvas,
    device,
    format
  );

  return (now: number) => {
    scene.update(now);
    renderScene(
      device,
      context.getCurrentTexture().createView(),
      pipelines,
      scene
    );
  };
}
