import { useEffect, useState } from 'react';

const KEY = 'et_theme';
const ORDER = ['system', 'light', 'dark'];

function readStored() {
  try {
    const value = localStorage.getItem(KEY);
    return ORDER.includes(value) ? value : 'system';
  } catch {
    return 'system';
  }
}

export function useTheme() {
  const [theme, setTheme] = useState(readStored);

  useEffect(() => {
    const root = document.documentElement;
    if (theme === 'system') delete root.dataset.theme;
    else root.dataset.theme = theme;
    try {
      localStorage.setItem(KEY, theme);
    } catch {
      /* storage unavailable */
    }
  }, [theme]);

  const cycleTheme = () => setTheme((t) => ORDER[(ORDER.indexOf(t) + 1) % ORDER.length]);

  return { theme, cycleTheme };
}
