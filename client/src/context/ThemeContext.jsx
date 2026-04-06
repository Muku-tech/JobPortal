import { createContext, useContext, useState, useEffect } from 'react';

const ThemeContext = createContext();

export function ThemeProvider({ children }) {
const [theme, setTheme] = useState(localStorage.getItem('theme') || 'light');
  const [jobDetailsTheme, setJobDetailsTheme] = useState(localStorage.getItem('jobDetailsTheme') || 'modern');

useEffect(() => {
    // Update html class
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    
    // Persist to localStorage
    localStorage.setItem('theme', theme);
  }, [theme]);

  useEffect(() => {
    localStorage.setItem('jobDetailsTheme', jobDetailsTheme);
  }, [jobDetailsTheme]);

  const toggleTheme = () => {
    setTheme(prev => prev === 'light' ? 'dark' : 'light');
  };

  // Optional: System preference (commented, enable if wanted)
  /*
  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    if (!localStorage.getItem('theme')) {
      setTheme(mediaQuery.matches ? 'dark' : 'light');
    }
    const handler = (e) => {
      if (!localStorage.getItem('theme')) {
        setTheme(e.matches ? 'dark' : 'light');
      }
    };
    mediaQuery.addListener(handler);
    return () => mediaQuery.removeListener(handler);
  }, []);
  */

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme, jobDetailsTheme, setJobDetailsTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}

