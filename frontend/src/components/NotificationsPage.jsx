import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { Bell, Clock, AlertCircle, CheckCircle, MessageSquare, Link as LinkIcon } from 'lucide-react';

const API_URL = import.meta.env.VITE_API_URL || '/api';

const NotificationsPage = () => {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    const fetchNotifications = async () => {
      try {
        const [activityResponse, telegramResponse] = await Promise.all([
          axios.get(`${API_URL}/tasks/recent-activity`),
          axios.get(`${API_URL}/telegram/notifications`)
        ]);

        const activityNotifs = (activityResponse.data || []).map(item => ({
          id: `activity-${item.id}`,
          title: item.task,
          message: `${item.user} ${item.action}`,
          type: item.status === 'completed' ? 'completed' : 'task_updated',
          timestamp: item.updatedAt,
          taskId: item.taskId
        }));

        const telegramNotifs = (telegramResponse.data || []).map(item => ({
          id: `telegram-${item.id}`,
          title: item.taskTitle || 'Telegram уведомление',
          message: item.message,
          type: item.type || 'telegram',
          timestamp: item.createdAt,
          taskId: item.taskId
        }));

        setNotifications([...activityNotifs, ...telegramNotifs].sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp)));
      } catch (fetchError) {
        console.error('Ошибка загрузки уведомлений:', fetchError);
        setError('Не удалось загрузить уведомления');
      } finally {
        setLoading(false);
      }
    };

    fetchNotifications();
  }, []);

  const handleOpenTask = (taskId) => {
    if (taskId) {
      navigate(`/tasks/${taskId}`);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Уведомления</h1>
        <p className="mt-2 text-gray-600 dark:text-gray-400">Последние действия и предупреждения вашей учетной записи.</p>
      </motion.div>

      <div className="bg-white dark:bg-gray-900 rounded-3xl shadow-lg border border-gray-200 dark:border-gray-700 p-6">
        {loading ? (
          <div className="text-center text-gray-600 dark:text-gray-400">Загрузка уведомлений...</div>
        ) : error ? (
          <div className="text-center text-red-600 dark:text-red-400">{error}</div>
        ) : notifications.length === 0 ? (
          <div className="text-center py-16 text-gray-500 dark:text-gray-400">Уведомлений нет.</div>
        ) : (
          <div className="space-y-4">
            {notifications.map((notification) => (
              <div
                key={notification.id}
                onClick={() => handleOpenTask(notification.taskId)}
                className="cursor-pointer rounded-3xl border border-gray-100 dark:border-gray-800 p-4 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className="rounded-2xl bg-blue-50 dark:bg-blue-900/20 p-3">
                      <Bell className="w-5 h-5 text-blue-600 dark:text-blue-300" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900 dark:text-white">{notification.title}</h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">{notification.message}</p>
                    </div>
                  </div>
                  <div className="text-right text-xs text-gray-500 dark:text-gray-400">
                    <div>{new Date(notification.timestamp).toLocaleString('ru-RU')}</div>
                    {notification.taskId && <div className="mt-2 inline-flex items-center gap-1 text-blue-600 dark:text-blue-300"><LinkIcon className="w-3 h-3" /> Задача #{notification.taskId}</div>}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default NotificationsPage;
