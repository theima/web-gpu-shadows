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
  let numberOfInstances = 500;
  let numberOfLights = 2;

  const change = () => {
    numberOfInstances = getValueFromRangeInput("instances");
    numberOfLights = getValueFromRangeInput("lights");
    setup();
  };
  const setup = async () => {
    unregister?.();
    const format = navigator.gpu?.getPreferredCanvasFormat();

    const pipeline = await createPipeline(device, format);

    const lights = createLights(
      device,
      pipeline.getBindGroupLayout(1),
      numberOfLights
    );

    const scene = createScene(
      device,
      pipeline,
      numberOfInstances,
      canvas.width,
      canvas.height
    );
    const drawFrame = createDrawFrame(
      device,
      pipeline,
      canvas,
      format,
      scene,
      lights,
      numberOfInstances,
      numberOfLights
    );
    unregister = registerFrame(drawFrame);
  };
  if (navigator.gpu) {
    setup();
    document.getElementById("instances")?.addEventListener("input", change);
    document.getElementById("lights")?.addEventListener("input", change);
  } else {
    document.getElementsByClassName("content")[0].innerHTML =
      "Browser doesn't support Webgpu";
  }
})();

function getValueFromRangeInput(id: string): number {
  const input: HTMLInputElement = document.getElementById(id) as any;
  return parseInt(input?.value ?? "0");
}
