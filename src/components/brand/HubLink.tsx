import { Link } from 'react-router-dom';

/** Quiet escape back to the battery hub. */
export default function HubLink({ className = '' }: { className?: string }) {
  return (
    <p className={`hl-hub-link ${className}`.trim()}>
      <Link to="/">All tasks</Link>
    </p>
  );
}
