import { Navigate, useLocation } from 'react-router-dom';

export default function WorldStudyRedirect() {
  const location = useLocation();
  const params = new URLSearchParams(location.search);
  // B's city-street scene was Ephesus; C also has a separate Corinth street.
  if (location.pathname.endsWith('/world-of-jesus-and-apostles') && params.get('scene') === 'street') params.set('scene', 'ephesus');
  const hash = location.hash === '#journey' ? '#world-journey' : location.hash === '#sources' ? '#world-reading' : location.hash;
  const search = params.size ? `?${params}` : '';
  return <Navigate replace to={`/study/world-of-jesus-apostles${search}${hash}`} />;
}
