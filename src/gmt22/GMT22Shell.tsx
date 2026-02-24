import { GMT22StateProvider, useGMT22State } from './GMT22State';
import GMT22Consent from './pages/GMT22Consent';
import GMT22Demographics from './pages/GMT22Demographics';
import GMT22Copy from './pages/GMT22Copy';
import GMT22Memory from './pages/GMT22Memory';
import GMT22Results from './pages/GMT22Results';

function GMT22ShellContent() {
  const { phase } = useGMT22State();

  switch (phase) {
    case 'consent':
      return <GMT22Consent />;
    case 'demographics':
      return <GMT22Demographics />;
    case 'copy':
      return <GMT22Copy />;
    case 'memory':
      return <GMT22Memory />;
    case 'results':
      return <GMT22Results />;
    default:
      return <GMT22Consent />;
  }
}

export default function GMT22Shell() {
  return (
    <GMT22StateProvider>
      <GMT22ShellContent />
    </GMT22StateProvider>
  );
}
