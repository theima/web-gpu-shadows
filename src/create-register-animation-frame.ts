export function createRegisterAnimationFrame() {
  let index = 0;
  const deregistered: number[] = [];
  const run: Map<number, () => void> = new Map();
  const frame = () => {
    while (deregistered.length) {
      run.delete(deregistered.pop() as number);
    }
    run.forEach((r) => {
      r();
    });
    requestAnimationFrame(frame);
  };
  requestAnimationFrame(frame);

  const register = (func: () => void) => {
    const registeredIndex = index++;
    run.set(registeredIndex, func);
    return () => {
      deregistered.push(registeredIndex);
    };
  };
  return register;
}
