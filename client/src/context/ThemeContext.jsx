import { createContext, useContext, useState, useEffect } from 'react';

const ThemeContext = createContext();

export function ThemeProvider({ children }) {
  const [jobDetailsTheme, setJobDetailsTheme] = useState(
    localStorage.getItem('jobDetailsTheme') || 'modern'
  );

  useEffect(() => {
    localStorage.setItem('jobDetailsTheme', jobDetailsTheme);
  }, [jobDetailsTheme]);

  return (
    <ThemeContext.Provider value={{ jobDetailsTheme, setJobDetailsTheme }}>
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

