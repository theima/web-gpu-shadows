import { createDrawFrame } from "./create-draw-frame";
import { createRegisterAnimationFrame } from "./create-register-animation-frame";
import { getDevice } from "./get-device";
import {
  createPipeline,
  createShadowPipeline,
} from "./pipelines/create-pipeline";
import { createScene } from "./scene/create-scene";
import "./style.css";

(async () => {
  const canvas: HTMLCanvasElement = document.querySelector("canvas")!;
  canvas.width = 500;
  canvas.height = 500;
  const device = await getDevice();

  const registerFrame = createRegisterAnimationFrame();
  let unregister: () => void;

  const setup = async () => {
    unregister?.();
    const format = navigator.gpu?.getPreferredCanvasFormat();

    const pipeline = await createPipeline(device, format);
    const shadowPipeline = await createShadowPipeline(device, format);

    const scene = createScene(
      device,
      pipeline,
      shadowPipeline,
      canvas.width,
      canvas.height
    );
    const drawFrame = createDrawFrame(
      device,
      {
        mainPass: pipeline,
        shadowPass: shadowPipeline,
      },
      canvas,
      format,
      scene
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
