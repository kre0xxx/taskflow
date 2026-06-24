import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Home, 
  CheckSquare, 
  Bot, 
  LogOut, 
  User, 
  Moon, 
  Sun,
  Menu,
  X,
  Bell,
  Settings,
  Users,
  BarChart3,
  CheckCircle,
  Clock,
  AlertCircle,
  Info,
  MessageSquare,
  Mail,
  Users as UsersIcon,
  FileText,
  Calendar
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || '/api';

// Создаем экземпляр axios с интерцептором для токена
const axiosInstance = axios.create({
  baseURL: API_URL
});

// Добавляем токен к каждому запросу
axiosInstance.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// 1. Типы уведомлений и их иконки
const NOTIFICATION_TYPES = {
  task_assigned: {
    icon: <CheckSquare size={16} />,
    color: 'bg-blue-100 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400',
    label: 'Новая задача'
  },
  task_completed: {
    icon: <CheckCircle size={16} />,
    color: 'bg-green-100 dark:bg-green-900/20 text-green-600 dark:text-green-400',
    label: 'Задача завершена'
  },
  task_updated: {
    icon: <AlertCircle size={16} />,
    color: 'bg-yellow-100 dark:bg-yellow-900/20 text-yellow-600 dark:text-yellow-400',
    label: 'Статус изменен'
  },
  deadline: {
    icon: <Clock size={16} />,
    color: 'bg-red-100 dark:bg-red-900/20 text-red-600 dark:text-red-400',
    label: 'Срок истекает'
  },
  mention: {
    icon: <UsersIcon size={16} />,
    color: 'bg-purple-100 dark:bg-purple-900/20 text-purple-600 dark:text-purple-400',
    label: 'Упоминание'
  },
  system: {
    icon: <Info size={16} />,
    color: 'bg-gray-100 dark:bg-gray-700/50 text-gray-600 dark:text-gray-400',
    label: 'Системное'
  },
  telegram: {
    icon: <Bot size={16} />,
    color: 'bg-teal-100 dark:bg-teal-900/20 text-teal-600 dark:text-teal-400',
    label: 'Telegram'
  }
};

// 2. Компонент для отображения уведомлений
const NotificationsDropdown = ({ 
  isOpen, 
  onClose, 
  notifications, 
  onMarkAsRead,
  onMarkAllAsRead,
  onNotificationClick 
}) => {
  if (!isOpen) return null;

  const unreadCount = notifications.filter(n => !n.read).length;

  const formatTime = (timestamp) => {
    if (!timestamp) return 'Только что';
    
    const now = new Date();
    const time = new Date(timestamp);
    const diffMs = now - time;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Только что';
    if (diffMins < 60) return `${diffMins} мин назад`;
    if (diffHours < 24) return `${diffHours} ч назад`;
    if (diffDays < 7) return `${diffDays} дн назад`;
    
    return time.toLocaleDateString('ru-RU');
  };

  const handleNotificationClick = (notification) => {
    onNotificationClick(notification);
    if (!notification.read) {
      onMarkAsRead(notification.id);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0, y: -10, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -10, scale: 0.95 }}
          className="absolute right-0 mt-2 w-96 bg-white dark:bg-gray-800 rounded-2xl shadow-2xl z-50 border border-gray-200 dark:border-gray-700 overflow-hidden"
        >
          <div className="p-4 border-b border-gray-100 dark:border-gray-700">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="p-2 rounded-lg bg-gray-100 dark:bg-gray-700">
                  <Bell size={20} />
                </div>
                <div>
                  <h3 className="font-bold text-lg text-gray-900 dark:text-white">Уведомления</h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400 dark:text-gray-300 dark:text-gray-300">
                    {notifications.length} всего, {unreadCount} непрочитанных
                  </p>
                </div>
              </div>
              {unreadCount > 0 && (
                <button
                  onClick={onMarkAllAsRead}
                  className="text-sm text-blue-500 hover:text-blue-600 dark:text-blue-400 dark:hover:text-blue-300 px-3 py-1 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-900/10"
                >
                  Прочитать все
                </button>
              )}
            </div>
          </div>

          <div className="max-h-[500px] overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="p-8 text-center text-gray-500 dark:text-gray-400 dark:text-gray-300 dark:text-gray-300">
                <Bell className="mx-auto mb-2 opacity-50" size={32} />
                <p className="font-medium mb-1">Нет уведомлений</p>
                <p className="text-sm">Здесь появятся ваши уведомления</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-100 dark:divide-gray-700">
                {notifications.map((notification) => (
                  <div
                    key={notification.id}
                    onClick={() => handleNotificationClick(notification)}
                    className={`p-4 cursor-pointer transition-all hover:bg-gray-50 dark:hover:bg-gray-750 ${
                      !notification.read ? 'bg-blue-50/50 dark:bg-blue-900/5' : ''
                    }`}
                  >
                    <div className="flex items-start space-x-3">
                      <div className={`p-2 rounded-lg ${NOTIFICATION_TYPES[notification.type]?.color || NOTIFICATION_TYPES.system.color}`}>
                        {NOTIFICATION_TYPES[notification.type]?.icon || NOTIFICATION_TYPES.system.icon}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between">
                          <div>
                            <h4 className="font-medium text-gray-900 dark:text-white">
                              {notification.title}
                            </h4>
                            <p className="text-sm text-gray-600 dark:text-gray-300 mt-1 dark:text-gray-400">
                              {notification.message || notification.description}
                            </p>
                          </div>
                          {!notification.read && (
                            <span className="w-2 h-2 bg-blue-500 rounded-full flex-shrink-0 mt-1.5"></span>
                          )}
                        </div>
                        
                        <div className="flex items-center justify-between mt-2">
                          <div className="flex items-center space-x-3">
                            <span className="text-xs text-gray-500 dark:text-gray-400 dark:text-gray-300 dark:text-gray-300">
                              {formatTime(notification.timestamp || notification.time)}
                            </span>
                            {notification.user && (
                              <span className="text-xs text-gray-500 dark:text-gray-400 dark:text-gray-300 dark:text-gray-300">
                                • {notification.user}
                              </span>
                            )}
                          </div>
                          
                          <div className="flex items-center space-x-2">
                            {notification.taskId && (
                              <span className="text-xs px-2 py-1 bg-gray-100 dark:bg-gray-700 rounded">
                                Задача
                              </span>
                            )}
                            {notification.telegram && (
                              <span className="text-xs px-2 py-1 bg-teal-100 dark:bg-teal-900/30 text-teal-600 dark:text-teal-400 rounded">
                                Telegram
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="p-4 border-t border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-700/30">
            <div className="flex items-center justify-between">
              <Link
                to="/notifications"
                onClick={onClose}
                className="text-sm text-blue-500 hover:text-blue-600 dark:text-blue-400 dark:hover:text-blue-300"
              >
                Показать все уведомления
              </Link>
              <button
                onClick={onClose}
                className="text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300 dark:text-gray-300 dark:text-gray-300 dark:text-gray-300"
              >
                Закрыть
              </button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

const Navbar = () => {
  const { user, logout, isAdmin } = useAuth();
  const { isDark, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const location = useLocation();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);

  const navItems = [
    { path: '/', label: 'Главная', icon: <Home size={20} /> },
    { path: '/tasks', label: 'Задачи', icon: <CheckSquare size={20} /> },
    ...(isAdmin ? [{ path: '/users', label: 'Пользователи', icon: <Users size={20} /> }] : []),
    { path: '/telegram', label: 'Telegram', icon: <Bot size={20} /> },
    { path: '/stats', label: 'Статистика', icon: <BarChart3 size={20} /> },
  ];

  // 3. Функция для загрузки уведомлений из разных источников
  const fetchNotifications = async () => {
    if (!user) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      
      // Загружаем уведомления из Dashboard (активность)
      const activityResponse = await axiosInstance.get('/tasks/recent-activity');
      const activityNotifications = activityResponse.data.map((activity, index) => ({
        id: `activity_${activity.id || index}`,
        type: getActivityType(activity),
        title: getActivityTitle(activity),
        message: `${activity.user} ${activity.action} "${activity.task}"`,
        user: activity.user,
        timestamp: activity.updatedAt || new Date().toISOString(),
        read: false,
        taskId: activity.taskId || null
      }));

      // Загружаем уведомления из Telegram
      const telegramResponse = await axiosInstance.get('/telegram/notifications');
      const telegramNotifications = telegramResponse.data.map((notif, index) => ({
        id: `telegram_${notif.id || index}`,
        type: notif.type || 'telegram',
        title: notif.taskTitle || 'Уведомление Telegram',
        message: notif.message || notif.description,
        timestamp: notif.createdAt || notif.dueDate || new Date().toISOString(),
        read: notif.read || false,
        telegram: true,
        taskId: notif.taskId
      }));

      // Загружаем системные уведомления (например, дедлайны)
      const tasksResponse = await axiosInstance.get('/tasks/upcoming-deadlines');
      const deadlineNotifications = (tasksResponse.data.tasks || tasksResponse.data || []).map((task, index) => ({
        id: `deadline_${task.id || index}`,
        type: 'deadline',
        title: 'Срок истекает',
        message: `Задача "${task.title}" должна быть выполнена ${new Date(task.dueDate).toLocaleDateString('ru-RU')}`,
        timestamp: task.updatedAt || new Date().toISOString(),
        read: false,
        taskId: task.id
      }));

      // Объединяем все уведомления и сортируем по времени
      const allNotifications = [
        ...activityNotifications,
        ...telegramNotifications,
        ...deadlineNotifications
      ].sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

      setNotifications(allNotifications);
    } catch (error) {
      console.error('Ошибка загрузки уведомлений:', error);
      
      // Если API недоступны, используем моковые данные
      setNotifications(getMockNotifications());
    } finally {
      setLoading(false);
    }
  };

  // 4. Вспомогательные функции
  const getActivityType = (activity) => {
    if (activity.action.includes('создал')) return 'task_assigned';
    if (activity.action.includes('завершил')) return 'task_completed';
    if (activity.action.includes('изменил')) return 'task_updated';
    return 'system';
  };

  const getActivityTitle = (activity) => {
    if (activity.action.includes('создал')) return 'Новая задача';
    if (activity.action.includes('завершил')) return 'Задача завершена';
    if (activity.action.includes('изменил')) return 'Статус изменен';
    return 'Действие с задачей';
  };

  // 5. Моковые данные для демонстрации
  const getMockNotifications = () => [
    {
      id: 1,
      type: 'task_assigned',
      title: 'Новая задача',
      message: 'Вам назначена задача "Доработать API авторизации"',
      user: 'Алексей Петров',
      timestamp: new Date(Date.now() - 10 * 60000).toISOString(),
      read: false,
      taskId: 123
    },
    {
      id: 2,
      type: 'task_completed',
      title: 'Задача завершена',
      message: 'Задача "Обновить документацию" выполнена',
      user: 'Мария Иванова',
      timestamp: new Date(Date.now() - 2 * 3600000).toISOString(),
      read: false,
      taskId: 456
    },
    {
      id: 3,
      type: 'deadline',
      title: 'Срок истекает',
      message: 'Задача "Дизайн мобильного приложения" истекает завтра',
      timestamp: new Date(Date.now() - 5 * 3600000).toISOString(),
      read: false,
      taskId: 789
    },
    {
      id: 4,
      type: 'telegram',
      title: 'Telegram подключен',
      message: 'Ваш Telegram аккаунт успешно привязан',
      timestamp: new Date(Date.now() - 24 * 3600000).toISOString(),
      read: true,
      telegram: true
    },
    {
      id: 5,
      type: 'task_updated',
      title: 'Статус изменен',
      message: 'Задача "Тестирование API" переведена в статус "В работе"',
      user: 'Дмитрий Смирнов',
      timestamp: new Date(Date.now() - 2 * 24 * 3600000).toISOString(),
      read: true,
      taskId: 101
    }
  ];

  // 6. Обработчики
  const handleLogout = () => {
    logout();
    navigate('/login');
    setIsMenuOpen(false);
  };

  const handleMarkAsRead = (id) => {
    setNotifications(prev =>
      prev.map(notification =>
        notification.id === id ? { ...notification, read: true } : notification
      )
    );
  };

  const handleMarkAllAsRead = () => {
    setNotifications(prev =>
      prev.map(notification => ({ ...notification, read: true }))
    );
  };

  const handleNotificationClick = (notification) => {
    // Навигация в зависимости от типа уведомления
    if (notification.taskId) {
      navigate(`/tasks/${notification.taskId}`);
    } else if (notification.telegram) {
      navigate('/telegram');
    } else if (notification.type === 'task_assigned') {
      navigate('/tasks');
    }
    
    setIsNotificationsOpen(false);
  };

  // 7. Загружаем уведомления после входа пользователя
  useEffect(() => {
    if (!user) return;

    fetchNotifications();

    const interval = setInterval(fetchNotifications, 30000); // Каждые 30 секунд

    return () => clearInterval(interval);
  }, [user]);

  // 8. Закрытие меню при клике вне области
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (isNotificationsOpen && !event.target.closest('.notifications-container')) {
        setIsNotificationsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isNotificationsOpen]);

  const unreadNotificationsCount = notifications.filter(n => !n.read).length;

  if (!user) return null;

  return (
    <motion.nav 
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      className="sticky top-0 z-50 bg-white/80 dark:bg-gray-900/80 backdrop-blur-lg border-b border-gray-200 dark:border-gray-800 shadow-sm"
    >
      <div className="container mx-auto px-4 py-3">
        <div className="flex items-center justify-between">
          {/* Logo */}
          <Link to="/" className="flex items-center space-x-2 group">
            <motion.div
              whileHover={{ rotate: 10 }}
              className="w-10 h-10 rounded-xl bg-gradient-to-r from-blue-500 to-purple-500 flex items-center justify-center shadow-lg group-hover:shadow-xl transition-shadow"
            >
              <CheckSquare className="text-white" size={22} />
            </motion.div>
            <div>
              <span className="text-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                TaskFlow
              </span>
              <div className="text-xs text-gray-500 dark:text-gray-400 dark:text-gray-300 dark:text-gray-300">Управление задачами</div>
            </div>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-1">
            {navItems.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center space-x-2 px-4 py-2 rounded-xl transition-all duration-200 ${
                  location.pathname === item.path
                    ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400'
                    : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'
                }`}
              >
                {item.icon}
                <span className="font-medium">{item.label}</span>
              </Link>
            ))}
          </div>

          {/* Right Section */}
          <div className="flex items-center space-x-3">
            {/* Notifications Button with Dropdown */}
            <div className="relative notifications-container">
              <button 
                onClick={() => setIsNotificationsOpen(!isNotificationsOpen)}
                disabled={loading}
                className="relative p-2 rounded-xl bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors disabled:opacity-50"
              >
                {loading ? (
                  <div className="w-5 h-5 border-2 border-gray-400 border-t-transparent rounded-full animate-spin"></div>
                ) : (
                  <>
                    <Bell size={20} className="text-gray-700 dark:text-gray-300" />
                    {unreadNotificationsCount > 0 && (
                      <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center animate-pulse">
                        {unreadNotificationsCount > 9 ? '9+' : unreadNotificationsCount}
                      </span>
                    )}
                  </>
                )}
              </button>

              <NotificationsDropdown 
                isOpen={isNotificationsOpen}
                onClose={() => setIsNotificationsOpen(false)}
                notifications={notifications}
                onMarkAsRead={handleMarkAsRead}
                onMarkAllAsRead={handleMarkAllAsRead}
                onNotificationClick={handleNotificationClick}
              />
            </div>

            {/* Theme Toggle */}
            <button
              onClick={toggleTheme}
              className="p-2 rounded-xl bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
            >
              {isDark ? (
                <Sun size={20} className="text-yellow-500" />
              ) : (
                <Moon size={20} className="text-gray-700 dark:text-gray-300" />
              )}
            </button>
            <div className="hidden sm:block text-sm text-gray-600 dark:text-gray-300 ml-2 dark:text-gray-400">
              {isDark ? 'Тёмная' : 'Светлая'}
            </div>

            {/* User Menu */}
            <div className="relative">
              <button
                onClick={() => setIsMenuOpen(!isMenuOpen)}
                className="flex items-center space-x-3 p-2 rounded-xl bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
              >
                <div className="w-9 h-9 rounded-full bg-gradient-to-r from-blue-500 to-purple-500 flex items-center justify-center shadow">
                  <User className="text-white" size={18} />
                </div>
                <div className="hidden md:block text-left">
                  <div className="font-medium text-sm text-gray-900 dark:text-white">{user.username}</div>
                  <div className="text-xs text-gray-500 dark:text-gray-400 capitalize dark:text-gray-300 dark:text-gray-300">
                    {user.role === 'admin' ? 'Администратор' : 'Пользователь'}
                  </div>
                </div>
              </button>

              {/* Dropdown Menu */}
              {isMenuOpen && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="absolute right-0 mt-2 w-56 bg-white dark:bg-gray-800 rounded-2xl shadow-xl py-2 z-50 border border-gray-200 dark:border-gray-700"
                >
                  <div className="px-4 py-3 border-b border-gray-100 dark:border-gray-700">
                    <div className="font-medium text-gray-900 dark:text-white">{user.username}</div>
                    <div className="text-sm text-gray-500 dark:text-gray-400 dark:text-gray-300 dark:text-gray-300">{user.email}</div>
                  </div>
                  
                  <Link
                    to="/profile"
                    onClick={() => setIsMenuOpen(false)}
                    className="flex items-center space-x-2 px-4 py-3 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                  >
                    <User size={16} />
                    <span className="text-gray-900 dark:text-white">Мой профиль</span>
                  </Link>
                  
                  <Link
                    to="/notifications"
                    onClick={() => setIsMenuOpen(false)}
                    className="flex items-center space-x-2 px-4 py-3 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                  >
                    <Bell size={16} />
                    <span className="text-gray-900 dark:text-white">Уведомления</span>
                    {unreadNotificationsCount > 0 && (
                      <span className="ml-auto px-2 py-0.5 bg-red-500 text-white text-xs rounded-full">
                        {unreadNotificationsCount}
                      </span>
                    )}
                  </Link>
                  
                  <Link
                    to="/settings"
                    onClick={() => setIsMenuOpen(false)}
                    className="flex items-center space-x-2 px-4 py-3 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                  >
                    <Settings size={16} />
                    <span className="text-gray-900 dark:text-white">Настройки</span>
                  </Link>
                  
                  <div className="border-t border-gray-100 dark:border-gray-700 my-2"></div>
                  
                  <button
                    onClick={handleLogout}
                    className="flex items-center space-x-2 w-full px-4 py-3 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors rounded-b-2xl"
                  >
                    <LogOut size={16} />
                    <span>Выйти</span>
                  </button>
                </motion.div>
              )}
            </div>

            {/* Mobile Menu Button */}
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="md:hidden p-2 rounded-xl bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
            >
              {isMenuOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {isMenuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            className="md:hidden mt-4 pt-4 border-t border-gray-200 dark:border-gray-800"
          >
            <div className="space-y-1">
              {navItems.map((item) => (
                <Link
                  key={item.path}
                  to={item.path}
                  onClick={() => setIsMenuOpen(false)}
                  className={`flex items-center space-x-3 px-4 py-3 rounded-xl transition-all ${
                    location.pathname === item.path
                      ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400'
                      : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'
                  }`}
                >
                  {item.icon}
                  <span className="font-medium">{item.label}</span>
                </Link>
              ))}
              
              <Link
                to="/notifications"
                onClick={() => setIsMenuOpen(false)}
                className="flex items-center justify-between px-4 py-3 rounded-xl text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 dark:text-gray-400"
              >
                <div className="flex items-center space-x-3">
                  <Bell size={20} />
                  <span className="font-medium">Уведомления</span>
                </div>
                {unreadNotificationsCount > 0 && (
                  <span className="px-2 py-0.5 bg-red-500 text-white text-xs rounded-full">
                    {unreadNotificationsCount}
                  </span>
                )}
              </Link>
            </div>
          </motion.div>
        )}
      </div>
    </motion.nav>
  );
};

export default Navbar;