type Enrollment = {currentStepPosition: number; completedAt: Date | null; pausedAt: Date | null};
type Step = {kind: string; waitDays?: number | null};
export function nextEnrollmentState(enrollment: Enrollment, steps: readonly Step[], expectedPosition: number, now = new Date()) {
  if (enrollment.completedAt || enrollment.pausedAt || enrollment.currentStepPosition !== expectedPosition) return null;
  let position = expectedPosition + 1;
  let waitDays = 0;
  while (position < steps.length && steps[position].kind === 'wait') {
    waitDays += steps[position].waitDays ?? 0;
    position++;
  }
  const completed = position >= steps.length;
  return {
    currentStepPosition: completed ? enrollment.currentStepPosition : position,
    nextActionAt: completed ? null : new Date(now.getTime() + waitDays * 86400000),
    completedAt: completed ? now : null,
  };
}
