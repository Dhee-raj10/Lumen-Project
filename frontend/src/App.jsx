import { lazy, Suspense, useMemo } from 'react';
import Sections from './sections/Sections';
import { useScrollProgress, hasWebGL } from './hooks/useScrollProgress';

const Scene = lazy(() => import('./three/Scene'));

export default function App() {
  const progress = useScrollProgress();
  const webgl = useMemo(hasWebGL, []);
  return (
    <>
      <div className="stage" aria-hidden="true">
        {webgl ? (
          <Suspense fallback={<div className="loader">Loading…</div>}>
            <Scene progress={progress} />
          </Suspense>
        ) : <div className="fallback-bg" />}
      </div>
      <Sections />
    </>
  );
}
