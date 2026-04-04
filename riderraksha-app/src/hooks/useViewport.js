import { useState, useEffect } from 'react';

export function useViewport() {
  const [w, setW] = useState(typeof window !== 'undefined' ? window.innerWidth : 1200);
  useEffect(() => {
    const fn = () => setW(window.innerWidth);
    window.addEventListener('resize', fn);
    return () => window.removeEventListener('resize', fn);
  }, []);
  return { sm: w < 768, md: w >= 768 && w < 1100, lg: w >= 1100, w };
}
