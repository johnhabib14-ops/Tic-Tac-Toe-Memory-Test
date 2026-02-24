import { GMT22StateProvider, useGMT22State } from './GMT22State';
import GMT22Intro from './pages/GMT22Intro';
import GMT22Consent from './pages/GMT22Consent';
import GMT22Demographics from './pages/GMT22Demographics';
import GMT22Practice from './pages/GMT22Practice';
import GMT22CopyInstructions from './pages/GMT22CopyInstructions';
import GMT22Copy from './pages/GMT22Copy';
import GMT22MemoryInstructions from './pages/GMT22MemoryInstructions';
import GMT22Memory from './pages/GMT22Memory';
import GMT22Results from './pages/GMT22Results';

function GMT22ShellContent() {
  const { phase } = useGMT22State();

  switch (phase) {
    case 'intro':
      return <GMT22Intro />;
    case 'consent':
      return <GMT22Consent />;
    case 'demographics':
      return <GMT22Demographics />;
    case 'practice':
      return <GMT22Practice />;
    case 'copy_instructions':
      return <GMT22CopyInstructions />;
    case 'copy':
      return <GMT22Copy />;
    case 'memory_instructions':
      return <GMT22MemoryInstructions />;
    case 'memory':
      return <GMT22Memory />;
    case 'results':
      return <GMT22Results />;
    default:
      return <GMT22Intro />;
  }
}

export default function GMT22Shell() {
  return (
    <GMT22StateProvider>
      <GMT22ShellContent />
    </GMT22StateProvider>
  );
}
