const FPS_SAMPLE_COUNT = 10;
const frameTimestamps: number[] = [];

export function recordFrame() {
  const now = performance.now();
  frameTimestamps.push(now);
  if (frameTimestamps.length > FPS_SAMPLE_COUNT) frameTimestamps.shift();

  if (frameTimestamps.length < FPS_SAMPLE_COUNT) return;
  const elapsed = frameTimestamps[frameTimestamps.length - 1] - frameTimestamps[0];
  const fps = ((frameTimestamps.length - 1) / elapsed) * 1000;

  const el = document.getElementById('fps-value');
  if (el) el.textContent = fps.toFixed(1);
}

export function FpsCounter() {
  return (
    <div id="fps-counter">FPS: <span id="fps-value"></span></div>
  );
}