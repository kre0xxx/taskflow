import React from 'react';
import { motion } from 'framer-motion';
import { useTheme } from '../context/ThemeContext';
import { Link } from 'react-router-dom';
import { Settings, Moon, Sun } from 'lucide-react';

const SettingsPage = () => {
  const { isDark, toggleTheme } = useTheme();

  return (
    <div className="container mx-auto px-4 py-8">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Настройки</h1>
        <p className="mt-2 text-gray-600 dark:text-gray-400">Быстрый доступ к основным настройкам приложения.</p>
      </motion.div>

      <div className="grid gap-6 md:grid-cols-2">
        <div className="rounded-3xl bg-white dark:bg-gray-900 shadow-lg border border-gray-100 dark:border-gray-700 p-6">
          <div className="flex items-center gap-4 mb-4">
            <div className="rounded-2xl bg-blue-500 p-3 text-white">
              <Settings className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Тема</h2>
              <p className="text-gray-600 dark:text-gray-400">Переключение светлой и тёмной темы.</p>
            </div>
          </div>
          <button
            onClick={toggleTheme}
            className="inline-flex items-center gap-2 rounded-2xl bg-blue-600 px-5 py-3 text-white hover:bg-blue-700 transition-colors"
          >
            {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            {isDark ? 'Светлая тема' : 'Тёмная тема'}
          </button>
        </div>

        {/* Telegram блок временно отключен */}
        {/* <div className="rounded-3xl bg-white dark:bg-gray-900 shadow-lg border border-gray-100 dark:border-gray-700 p-6">
          <div className="flex items-center gap-4 mb-4">
            <div className="rounded-2xl bg-teal-500 p-3 text-white">
              <Bot className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Telegram</h2>
              <p className="text-gray-600 dark:text-gray-400">Перейдите к настройкам уведомлений Telegram.</p>
            </div>
          </div>
          <Link
            to="/telegram"
            className="inline-flex items-center gap-2 rounded-2xl border border-gray-200 dark:border-gray-700 px-5 py-3 text-gray-900 dark:text-white hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
          >
            Открыть Telegram настройки
          </Link>
        </div> */}
      </div>
    </div>
  );
};

export default SettingsPage;