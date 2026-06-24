import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { BarChart3, CheckCircle, Clock, AlertCircle, Star, Target, Shield } from 'lucide-react';

const API_URL = import.meta.env.VITE_API_URL || '/api';

const StatsPage = () => {
  const { user, isAdmin } = useAuth();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await axios.get(`${API_URL}/tasks/statistics`);
        setStats(response.data);
      } catch (fetchError) {
        console.error('Ошибка загрузки статистики:', fetchError);
        setError('Не удалось загрузить статистику');
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  return (
    <div className="container mx-auto px-4 py-8">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Статистика</h1>
        <p className="mt-2 text-gray-600 dark:text-gray-400">
          {isAdmin ? `Общая статистика задач и прогресс за ${new Date().getMonth() + 1} месяц` : 'Ваша персональная статистика задач'}
        </p>
      </motion.div>

      <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-4 mb-8">
        {[['Всего задач', 'total', BarChart3, 'bg-blue-50 text-blue-700'],
          ['Выполнено', 'completed', CheckCircle, 'bg-green-50 text-green-700'],
          ['В работе', 'inProgress', Clock, 'bg-sky-50 text-sky-700'],
          ['На проверке', 'review', AlertCircle, 'bg-yellow-50 text-amber-700'],
          ['Просрочено', 'overdue', AlertCircle, 'bg-red-50 text-red-700'],
          ['Высокий приоритет', 'highPriority', Star, 'bg-purple-50 text-purple-700'],
          ['Отменено', 'cancelled', Shield, 'bg-gray-50 text-gray-700'],
          ['Завершение', 'completionRate', Target, 'bg-teal-50 text-teal-700']].map(([label, key, Icon, style]) => (
            <motion.div
              key={key}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.05 }}
              className={`rounded-3xl p-6 shadow-lg border border-gray-100 dark:border-gray-700 bg-white dark:bg-gray-800 ${style.split(' ')[0]}`}
            >
              <div className="flex items-center justify-between mb-4">
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">{label}</p>
                  <p className="text-3xl font-semibold text-gray-900 dark:text-white">
                    {stats ? (key === 'completionRate' ? `${stats[key] || 0}%` : stats[key] ?? 0) : '—'}
                  </p>
                </div>
                <div className="p-3 rounded-2xl bg-white dark:bg-gray-900 shadow-sm">
                  <Icon className="w-6 h-6" />
                </div>
              </div>
              <p className="text-sm text-gray-500 dark:text-gray-400">{key === 'completionRate' ? 'Процент завершения задач' : 'Актуальные данные'}</p>
            </motion.div>
          ))}
      </div>

      {loading ? (
        <div className="rounded-3xl bg-white dark:bg-gray-900 p-8 shadow-lg border border-gray-100 dark:border-gray-700 text-center text-gray-600 dark:text-gray-400">
          Загрузка статистики...
        </div>
      ) : error ? (
        <div className="rounded-3xl bg-red-50 dark:bg-red-900/20 p-8 shadow-lg border border-red-100 dark:border-red-700 text-center text-red-700">
          {error}
        </div>
      ) : (
        <div className="grid gap-6 xl:grid-cols-3">
          <div className="bg-white dark:bg-gray-900 rounded-3xl p-6 shadow-lg border border-gray-100 dark:border-gray-700">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">Динамика за неделю</h2>
            <ul className="space-y-3 text-gray-600 dark:text-gray-400">
              {(stats?.lastWeek || []).map((item, index) => (
                <li key={index} className="rounded-2xl p-4 bg-gray-50 dark:bg-gray-800">
                  <div className="text-sm font-medium text-gray-900 dark:text-white">{item.date}</div>
                  <p className="text-sm">{item.count} изменений</p>
                </li>
              ))}
              {stats?.lastWeek?.length === 0 && <li>Нет данных за последнюю неделю</li>}
            </ul>
          </div>

          <div className="bg-white dark:bg-gray-900 rounded-3xl p-6 shadow-lg border border-gray-100 dark:border-gray-700">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">Подробности</h2>
            <div className="space-y-3 text-gray-600 dark:text-gray-400">
              <p>Пользователь: <span className="font-medium text-gray-900 dark:text-white">{user.username}</span></p>
              <p>Роль: <span className="capitalize font-medium text-gray-900 dark:text-white">{user.role}</span></p>
              <p>Обновлено: <span className="font-medium text-gray-900 dark:text-white">{new Date().toLocaleDateString('ru-RU')}</span></p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default StatsPage;
