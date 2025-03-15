import { useState, useEffect } from 'react';
import { BrowserRouter } from 'react-router-dom';
import Navigation from './pages/Navigation'
import './App.css';

function App() {
  const [darkMode, setDarkMode] = useState(false);

  useEffect(() => {
    const savedTheme = localStorage.getItem('theme');

    if (savedTheme === 'dark') {
      setDarkMode(true);
    } else if (savedTheme === 'light') {
      setDarkMode(false);
    } else if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
      setDarkMode(true);
    }
  }, []);

  const toggleTheme = () => {
    const newDarkMode = !darkMode;
    setDarkMode(newDarkMode);
    localStorage.setItem('theme', newDarkMode ? 'dark' : 'light');
  };

  return (
    <BrowserRouter>
      <div className={`app ${darkMode ? 'dark-theme' : 'light-theme'}`}>
        <Navigation toggleTheme={toggleTheme} darkMode={darkMode} />
      </div>
    </BrowserRouter>
  );
}

export default App;
