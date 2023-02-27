import "./style.css";
import { createLights } from "./scene/create-lights";
import { createScene } from "./scene/create-scene";
import { createPipeline } from "./create-pipeline";
import { getDevice } from "./get-device";
import { createDrawFrame } from "./create-draw-frame";
import { createRegisterAnimationFrame } from "./create-register-animation-frame";

(async () => {
  const canvas: HTMLCanvasElement = document.querySelector("canvas")!;
  canvas.width = 500;
  canvas.height = 500;
  const device = await getDevice();

  const registerFrame = createRegisterAnimationFrame();
  let unregister: () => void;
  let numberOfLights = 2;
  const setup = async () => {
    unregister?.();
    const format = navigator.gpu?.getPreferredCanvasFormat();

    const pipeline = await createPipeline(device, format);

    const lights = createLights(
      device,
      pipeline.getBindGroupLayout(1),
      numberOfLights
    );

    const scene = createScene(device, pipeline, canvas.width, canvas.height);
    const drawFrame = createDrawFrame(
      device,
      pipeline,
      canvas,
      format,
      scene,
      lights
    );
    unregister = registerFrame(drawFrame);
  };
  if (navigator.gpu) {
    setup();
  } else {
    document.getElementsByClassName("content")[0].innerHTML =
      "Browser doesn't support Webgpu";
  }
})();
