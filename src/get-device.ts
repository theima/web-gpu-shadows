export async function getDevice() {
  const adapter = await navigator.gpu?.requestAdapter()!;
  return await adapter?.requestDevice()!;
}
