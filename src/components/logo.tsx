/** Logo de WeMeet: un trazo en zigzag que dibuja una "M" (y una "W" al revés). */
export function Logo({ className }: { className?: string }) {
  return (
    <svg
      viewBox="2 12 116 76"
      fill="none"
      stroke="currentColor"
      strokeWidth={10}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      className={className}
    >
      <path d="M 10 19 L 30 80 L 40 50 L 50 80 L 70 21 L 80 50 L 90 20 L 110 80" />
    </svg>
  );
}
