import { GMT2StateProvider, useGMT2State } from './GMT2State';
import GMT2Consent from './pages/GMT2Consent';
import GMT2Demographics from './pages/GMT2Demographics';
import GMT2Copy from './pages/GMT2Copy';
import GMT2Memory from './pages/GMT2Memory';
import GMT2Results from './pages/GMT2Results';

function GMT2ShellContent() {
  const { phase } = useGMT2State();

  switch (phase) {
    case 'consent':
      return <GMT2Consent />;
    case 'demographics':
      return <GMT2Demographics />;
    case 'copy':
      return <GMT2Copy />;
    case 'memory':
      return <GMT2Memory />;
    case 'results':
      return <GMT2Results />;
    default:
      return <GMT2Consent />;
  }
}

export default function GMT2Shell() {
  return (
    <GMT2StateProvider>
      <GMT2ShellContent />
    </GMT2StateProvider>
  );
}
