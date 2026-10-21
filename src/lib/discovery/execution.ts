// Drive one durable batch per request. Leaving the page stops future batches;
// it does not cancel a server batch that may already be saving its results.
export async function driveSearchJob(
  processStep: () => Promise<string>,
  onUpdate: () => void,
  signal: AbortSignal,
  delayMs = 3000,
): Promise<void> {
  while (!signal.aborted) {
    const state = await processStep();
    if (signal.aborted) return;
    onUpdate();
    if (!['queued', 'running'].includes(state)) return;
    await new Promise<void>(resolve => {
      const finish = () => {
        clearTimeout(timer);
        signal.removeEventListener('abort', finish);
        resolve();
      };
      const timer = setTimeout(finish, delayMs);
      signal.addEventListener('abort', finish, {once: true});
      if (signal.aborted) finish();
    });
  }
}
