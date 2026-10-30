/**
 * Logo de WeMeet: dos bloques de tiempo que se cruzan; la esquina compartida es la hora en común.
 * El bloque de adelante toma el color del texto (currentColor), el de atrás es violeta claro.
 */
export function Logo({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 100 100" aria-hidden="true" className={className}>
      <rect x="8" y="8" width="58" height="58" rx="14" fill="currentColor" />
      <rect x="34" y="34" width="58" height="58" rx="14" fill="#9f93ff" />
      <rect x="34" y="34" width="32" height="32" rx="8" fill="var(--lime)" />
    </svg>
  );
}
