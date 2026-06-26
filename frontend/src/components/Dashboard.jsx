import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  TrendingUp,
  Users,
  Clock,
  CheckCircle,
  AlertCircle,
  Plus,
  Calendar,
  ArrowRight,
  BarChart3,
  Target,
  Zap,
  Award,
  Sun,
  Moon
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || '/api';

const Dashboard = () => {
  const { user, isAdmin } = useAuth();
  const { isDark, toggleTheme } = useTheme();

  const [stats, setStats] = useState({
    totalTasks: 0,
    myTasks: 0,
    completedTasks: 0,
    pendingTasks: 0,
    overdueTasks: 0,
    highPriority: 0,
    totalUsers: 0
  });
  const [loading, setLoading] = useState(true);
  const [recentTasks, setRecentTasks] = useState([]);
  const [activity, setActivity] = useState([]);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const timeAgo = (date) => {
    const now = new Date();
    const diffMinutes = Math.floor((now - new Date(date)) / 1000 / 60);
    if (diffMinutes < 1) return 'только что';
    if (diffMinutes < 60) return `${diffMinutes} мин назад`;
    const hours = Math.floor(diffMinutes / 60);
    if (hours < 24) return `${hours} час${hours > 1 ? 'а' : ''} назад`;
    const days = Math.floor(hours / 24);
    return `${days} день${days > 1 ? '' : ''} назад`;
  };

  const fetchDashboardData = async () => {
    try {
      const [tasksResponse, usersResponse] = await Promise.all([
      axios.get(`${API_URL}/tasks`, { params: { limit: 100 } }),
      isAdmin ? axios.get(`${API_URL}/users`) : Promise.resolve({ data: [] })
    ]);

    const tasks = tasksResponse.data.tasks || tasksResponse.data || [];

      const myTasks = tasks.filter(task => (!isAdmin ? task.assignedTo === user.id : true));

      const statsData = {
        totalTasks: tasks.length,
        myTasks: myTasks.length,
        completedTasks: myTasks.filter(t => t.status === 'completed').length,
        pendingTasks: myTasks.filter(t => t.status !== 'completed').length,
        overdueTasks: myTasks.filter(t => {
          if (!t.deadline || t.status === 'completed') return false;
          return new Date(t.deadline) < today;
        }).length,
        highPriority: myTasks.filter(t => t.priority === 'high').length,
        totalUsers: isAdmin ? usersResponse.data.length : 0
      };

      setStats(statsData);

      const sortedTasks = [...tasks].sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));
      setRecentTasks(sortedTasks.slice(0, 4));

      const recentActivity = sortedTasks.slice(0, 4).map((task, index) => ({
        id: index + 1,
        user: task.assignee?.username || task.creator?.username || 'Неизвестный',
        action:
          new Date(task.updatedAt) - new Date(task.createdAt) < 60000
            ? 'создал задачу'
            : task.status === 'completed'
            ? 'завершил задачу'
            : 'изменил статус',
        task: task.title,
        time: timeAgo(task.updatedAt)
      }));
      setActivity(recentActivity);
    } catch (error) {
      console.error('Ошибка загрузки данных:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Загрузка данных...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
        <div className="bg-gradient-to-r from-blue-500 to-purple-500 rounded-3xl p-8 text-white shadow-xl relative">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold mb-2">
                Добро пожаловать, {user.username}! 
              </h1>
              <p className="text-blue-100">
                {isAdmin ? 'У вас есть доступ ко всем функциям системы' : 'Вот ваши задачи на сегодня'}
              </p>
            </div>
            <div className="flex items-center space-x-4">
              <div className="hidden md:block">
                <Award className="w-20 h-20 text-white/30" />
              </div>
            </div>
          </div>

          <div className="mt-6 flex flex-wrap gap-4">
            <div className="flex items-center space-x-2 bg-white/20 px-4 py-2 rounded-xl">
              <Calendar size={18} />
              <span>
                {new Date().toLocaleDateString('ru-RU', {
                  weekday: 'long',
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric'
                })}
              </span>
            </div>
            <div className="flex items-center space-x-2 bg-white/20 px-4 py-2 rounded-xl">
              <Zap size={18} />
              <span>
                Продуктивность:{' '}
                {stats.myTasks > 0
                  ? `${Math.round((stats.completedTasks / stats.myTasks) * 100)}%`
                  : '0%'}
              </span>
            </div>
          </div>
        </div>
      </motion.div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-lg border border-gray-100 dark:border-gray-700"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Всего задач</p>
              <p className="text-3xl font-bold text-gray-900 dark:text-white mt-2">
                {isAdmin ? stats.totalTasks : stats.myTasks}
              </p>
            </div>
            <div className="p-3 rounded-xl bg-blue-100 dark:bg-blue-900/20">
              <BarChart3 className="w-6 h-6 text-blue-600 dark:text-blue-400" />
            </div>
          </div>
          <div className="mt-4 flex items-center text-sm text-green-600">
            <TrendingUp className="w-4 h-4 mr-1" />
            <span>+12% с прошлой недели</span>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-lg border border-gray-100 dark:border-gray-700"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Выполнено</p>
              <p className="text-3xl font-bold text-gray-900 dark:text-white mt-2">
                {stats.completedTasks}
              </p>
            </div>
            <div className="p-3 rounded-xl bg-green-100 dark:bg-green-900/20">
              <CheckCircle className="w-6 h-6 text-green-600 dark:text-green-400" />
            </div>
          </div>
          <div className="mt-4">
            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
              <div
                className="bg-green-500 h-2 rounded-full transition-all duration-500"
                style={{
                  width: `${stats.myTasks > 0 ? (stats.completedTasks / stats.myTasks) * 100 : 0}%`
                }}
              ></div>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-lg border border-gray-100 dark:border-gray-700"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Просрочено</p>
              <p className="text-3xl font-bold text-gray-900 dark:text-white mt-2">
                {stats.overdueTasks}
              </p>
            </div>
            <div className="p-3 rounded-xl bg-red-100 dark:bg-red-900/20">
              <AlertCircle className="w-6 h-6 text-red-600 dark:text-red-400" />
            </div>
          </div>
          <div className="mt-4 text-sm text-gray-600 dark:text-gray-400">
            Требуют внимания
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-lg border border-gray-100 dark:border-gray-700"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {isAdmin ? 'Пользователей' : 'Высокий приоритет'}
              </p>
              <p className="text-3xl font-bold text-gray-900 dark:text-white mt-2">
                {isAdmin ? stats.totalUsers : stats.highPriority}
              </p>
            </div>
            <div className="p-3 rounded-xl bg-purple-100 dark:bg-purple-900/20">
              {isAdmin ? (
                <Users className="w-6 h-6 text-purple-600 dark:text-purple-400" />
              ) : (
                <Target className="w-6 h-6 text-purple-600 dark:text-purple-400" />
              )}
            </div>
          </div>
          <div className="mt-4 text-sm text-gray-600 dark:text-gray-400">
            {isAdmin ? 'Активных в системе' : 'Срочных задач'}
          </div>
        </motion.div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.5 }}
          className="lg:col-span-2"
        >
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-100 dark:border-gray-700 p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">Последние задачи</h2>
              <Link
                to="/tasks"
                className="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 text-sm font-medium flex items-center"
              >
                Все задачи <ArrowRight className="w-4 h-4 ml-1" />
              </Link>
            </div>

            {recentTasks.length > 0 ? (
              <div className="space-y-4">
                {recentTasks.map((task) => (
                  <div
                    key={task.id}
                    className="flex items-center justify-between p-4 rounded-xl bg-gray-50 dark:bg-gray-700/50 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                  >
                    <div className="flex items-center space-x-4">
                      <div
                        className={`w-3 h-3 rounded-full ${
                          task.priority === 'high'
                            ? 'bg-red-500'
                            : task.priority === 'medium'
                            ? 'bg-yellow-500'
                            : 'bg-green-500'
                        }`}
                      ></div>
                      <div>
                        <h4 className="font-medium text-gray-900 dark:text-white">{task.title}</h4>
                        <div className="flex items-center space-x-3 text-sm text-gray-500 dark:text-gray-400 mt-1">
                          <span className="capitalize">
                            {task.status === 'completed'
                              ? 'Выполнена'
                              : task.status === 'in-progress'
                              ? 'В работе'
                              : 'К выполнению'}
                          </span>
                          {task.dueDate && (
                            <span className="flex items-center">
                              <Clock className="w-3 h-3 mr-1" />
                              {new Date(task.dueDate).toLocaleDateString('ru-RU')}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-medium">
                        {task.assignee?.username || 'Не назначена'}
                      </div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">Исполнитель</div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center">
                  <Plus className="w-8 h-8 text-gray-400 dark:text-gray-300" />
                </div>
                <p className="text-gray-500 dark:text-gray-400 mb-4">Задачи еще не созданы</p>
                <Link
                  to="/tasks"
                  className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Создать первую задачу
                </Link>
              </div>
            )}
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.6 }}
        >
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-100 dark:border-gray-700 p-6">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-6">Активность</h2>
            <div className="space-y-6">
              {activity.map((item) => (
                <div key={item.id} className="flex items-start space-x-3">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-r from-blue-500 to-purple-500 flex items-center justify-center text-white text-sm font-medium flex-shrink-0">
                    {item.user.charAt(0)}
                  </div>
                  <div className="flex-1">
                    <p className="text-gray-900 dark:text-white">
                      <span className="font-medium">{item.user}</span> {item.action}{' '}
                      <span className="font-medium text-blue-600 dark:text-blue-400">{item.task}</span>
                    </p>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{item.time}</p>
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-8 pt-6 border-t border-gray-100 dark:border-gray-700">
              <div className="text-center">
                <Link
                  to="/tasks"
                  className="inline-flex items-center text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 text-sm font-medium"
                >
                  Вся активность
                  <ArrowRight className="w-4 h-4 ml-1" />
                </Link>
              </div>
            </div>
          </div>
        </motion.div>
      </div>

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.7 }} className="mt-8">
        <div className="bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-900 rounded-2xl p-6">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Быстрые действия</h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Link
              to="/tasks"
              className="bg-white dark:bg-gray-800 p-4 rounded-xl border border-gray-200 dark:border-gray-700 hover:border-blue-300 dark:hover:border-blue-500 transition-colors group"
            >
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-medium text-gray-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400">
                    Все задачи
                  </h3>
                  <p className="text-sm text-gray-500 mt-1 dark:text-gray-400">Просмотр и управление</p>
                </div>
                <ArrowRight className="w-5 h-5 text-gray-400 group-hover:text-blue-500 transition-colors dark:text-gray-400" />
              </div>
            </Link>

            <Link
              to="/tasks"
              className="bg-white dark:bg-gray-800 p-4 rounded-xl border border-gray-200 dark:border-gray-700 hover:border-blue-300 dark:hover:border-blue-500 transition-colors group"
            >
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-medium text-gray-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400">
                    Создать задачу
                  </h3>
                  <p className="text-sm text-gray-500 mt-1 dark:text-gray-400">Новая задача</p>
                </div>
                <Plus className="w-5 h-5 text-gray-400 group-hover:text-blue-500 transition-colors dark:text-gray-400" />
              </div>
            </Link>

            {/* Telegram временно отключен */}
            {/* <Link
              to="/telegram"
              className="bg-white dark:bg-gray-800 p-4 rounded-xl border border-gray-200 dark:border-gray-700 hover:border-blue-300 dark:hover:border-blue-500 transition-colors group"
            >
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-medium text-gray-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400">
                    Telegram
                  </h3>
                  <p className="text-sm text-gray-500 mt-1 dark:text-gray-400">Настройка уведомлений</p>
                </div>
                <ArrowRight className="w-5 h-5 text-gray-400 group-hover:text-blue-500 transition-colors dark:text-gray-400" />
              </div>
            </Link> */}

            {isAdmin && (
              <Link
                to="/users"
                className="bg-white dark:bg-gray-800 p-4 rounded-xl border border-gray-200 dark:border-gray-700 hover:border-blue-300 dark:hover:border-blue-500 transition-colors group"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-medium text-gray-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400">
                      Пользователи
                    </h3>
                    <p className="text-sm text-gray-500 mt-1 dark:text-gray-400">Управление доступом</p>
                  </div>
                  <ArrowRight className="w-5 h-5 text-gray-400 group-hover:text-blue-500 transition-colors dark:text-gray-400" />
                </div>
              </Link>
            )}
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default Dashboard;