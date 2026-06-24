// src/context/ThemeContext.jsx
import React, { createContext, useContext, useState, useEffect } from 'react';

const ThemeContext = createContext();

export const useTheme = () => {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme must be used within ThemeProvider');
  return ctx;
};

export const ThemeProvider = ({ children }) => {
  // Определяем начальное состояние и применяем класс синхронно,
  // чтобы избежать расхождений до первого эффекта React.
  const [isDark, setIsDark] = useState(() => {
    try {
      const saved = localStorage.getItem('theme');
      const prefersDark = typeof window !== 'undefined' && window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;

      const initial = (saved === 'dark' || saved === 'light') ? (saved === 'dark') : prefersDark;

      // Применяем класс сразу при инициализации в клиенте
      if (typeof document !== 'undefined') {
        const root = document.documentElement;
        if (initial) {
          root.classList.add('dark');
          document.body?.classList.add('dark');
        } else {
          root.classList.remove('dark');
          document.body?.classList.remove('dark');
        }
      }

      return initial;
    } catch (e) {
      return false;
    }
  });

  // Синхронизируем изменения состояния с DOM и localStorage
  useEffect(() => {
    const root = document.documentElement;
    if (isDark) {
      root.classList.add('dark');
      document.body?.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      root.classList.remove('dark');
      document.body?.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }

    // debug
    try {
      // eslint-disable-next-line no-console
      console.debug('[Theme] applied theme:', isDark ? 'dark' : 'light');
    } catch (e) {}

    // Слушаем системную смену темы и обновляем, только если пользователь не зафиксировал выбор
    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    const onChange = (e) => {
      const saved = localStorage.getItem('theme');
      if (saved !== 'dark' && saved !== 'light') {
        setIsDark(e.matches);
      }
    };

    if (mq && mq.addEventListener) mq.addEventListener('change', onChange);
    else if (mq && mq.addListener) mq.addListener(onChange);

    return () => {
      if (mq && mq.removeEventListener) mq.removeEventListener('change', onChange);
      else if (mq && mq.removeListener) mq.removeListener(onChange);
    };
  }, [isDark]);

  const toggleTheme = () => {
    // Явно сохраняем выбор пользователя
    setIsDark(prev => {
      const next = !prev;
      try {
        localStorage.setItem('theme', next ? 'dark' : 'light');
      } catch (e) {}
      return next;
    });
  };

  return (
    <ThemeContext.Provider value={{ isDark, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};