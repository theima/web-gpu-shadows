export function getConfiguredContext(
  canvas: HTMLCanvasElement,
  device: GPUDevice,
  format: GPUTextureFormat
) {
  const context: GPUCanvasContext = canvas.getContext("webgpu")!;
  context.configure({
    device,
    format,
    alphaMode: "opaque",
  });
  return context;
}
