import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Bot, 
  CheckCircle, 
  XCircle, 
  Link as LinkIcon,
  Unlink,
  Bell,
  MessageSquare,
  Clock,
  AlertCircle,
  Settings,
  QrCode,
  Copy,
  ExternalLink,
  Shield,
  Zap,
  Star,
  Download,
  Smartphone,
  Mail,
  BellRing,
  CheckSquare,
  UserCheck,
  CalendarClock,
  Target,
  BarChart,
  BellOff,
  RefreshCw,
  Send,
  Rocket,
  TrendingUp,
  Users,
  FileText,
  Timer,
  PlayCircle,
  PauseCircle,
  StopCircle
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';

const API_URL = 'http://localhost:5000/api';

const TelegramSettings = () => {
  const { user } = useAuth();
  const [telegramStatus, setTelegramStatus] = useState({
    isLinked: false,
    chatId: null,
    lastNotification: null,
    notificationsCount: 0,
    tasksAssigned: 0,
    tasksCompleted: 0,
    upcomingDeadlines: 0
  });
  const [loading, setLoading] = useState(true);
  const [chatIdInput, setChatIdInput] = useState('');
  const [botUrl] = useState('https://t.me/your_task_manager_bot');
  const [notifications, setNotifications] = useState([]);
  const [notificationSettings, setNotificationSettings] = useState({
    taskAssigned: true,
    taskCompleted: true,
    deadlineReminder: true,
    statusChange: true,
    dailyDigest: false,
    mentions: true,
    timeTracking: true,
    workStarted: true
  });
  const [taskStats, setTaskStats] = useState({
    total: 0,
    completed: 0,
    inProgress: 0,
    highPriority: 0,
    overdue: 0
  });
  const [testMessage, setTestMessage] = useState('');
  const [sendingTest, setSendingTest] = useState(false);
  const [activeTab, setActiveTab] = useState('notifications');
  const [webhookUrl, setWebhookUrl] = useState('');

  useEffect(() => {
    fetchTelegramStatus();
    fetchTaskStats();
    fetchRecentNotifications();
  }, []);

  const fetchTelegramStatus = async () => {
    try {
      const response = await axios.get(`${API_URL}/telegram/status`);
      setTelegramStatus(response.data);
    } catch (error) {
      console.error('Ошибка загрузки статуса Telegram:', error);
      
      // Моковые данные для демонстрации
      setTelegramStatus({
        isLinked: false,
        chatId: '123456789',
        lastNotification: new Date(Date.now() - 2 * 3600000).toISOString(),
        notificationsCount: 12,
        tasksAssigned: 8,
        tasksCompleted: 5,
        upcomingDeadlines: 3
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchTaskStats = async () => {
    try {
      const response = await axios.get(`${API_URL}/tasks/statistics`);
      setTaskStats(response.data);
    } catch (error) {
      console.error('Ошибка загрузки статистики задач:', error);
    }
  };

  const fetchRecentNotifications = async () => {
    try {
      const response = await axios.get(`${API_URL}/telegram/notifications/recent`);
      setNotifications(response.data);
    } catch (error) {
      console.error('Ошибка загрузки уведомлений:', error);
      
      // Моковые данные для демонстрации
      const mockNotifications = [
        { 
          id: 1, 
          type: 'task_completed', 
          title: 'Задача завершена', 
          description: 'Задача "Дизайн интерфейса" успешно выполнена', 
          time: '10 минут назад', 
          read: false,
          taskId: 123,
          user: 'Иван Петров',
          timeSpent: 120
        },
        { 
          id: 2, 
          type: 'task_assigned', 
          title: 'Новая задача', 
          description: 'Вам назначена задача "Разработка API"', 
          time: '2 часа назад', 
          read: true,
          taskId: 456,
          priority: 'high'
        },
        { 
          id: 3, 
          type: 'deadline', 
          title: 'Срок истекает', 
          description: 'Задача "Тестирование модуля" истекает завтра', 
          time: 'Вчера', 
          read: true,
          taskId: 789
        },
        { 
          id: 4, 
          type: 'status_change', 
          title: 'Статус изменен', 
          description: 'Задача "Обновление документации" начата', 
          time: '2 дня назад', 
          read: true,
          taskId: 101,
          oldStatus: 'new',
          newStatus: 'in-progress'
        },
        { 
          id: 5, 
          type: 'time_tracking', 
          title: 'Учет времени', 
          description: 'Добавлено 45 минут к задаче "Рефакторинг кода"', 
          time: '3 дня назад', 
          read: true,
          taskId: 202,
          timeAdded: 45
        }
      ];
      setNotifications(mockNotifications);
    }
  };

  const handleLinkTelegram = async (e) => {
    e.preventDefault();
    if (!chatIdInput.trim()) return;

    try {
      await axios.post(`${API_URL}/telegram/bind`, { 
        chatId: chatIdInput,
        userId: user.id 
      });
      
      setTelegramStatus(prev => ({
        ...prev,
        isLinked: true,
        chatId: chatIdInput
      }));
      setChatIdInput('');
      
      addNotification({
        type: 'success',
        title: 'Telegram подключен!',
        description: 'Ваш Telegram аккаунт успешно привязан',
        taskId: null,
        read: false
      });
    } catch (error) {
      console.error('Ошибка привязки Telegram:', error);
      addNotification({
        type: 'error',
        title: 'Ошибка подключения',
        description: 'Не удалось привязать Telegram аккаунт',
        read: false
      });
    }
  };

  const handleUnlinkTelegram = async () => {
    try {
      await axios.post(`${API_URL}/telegram/unbind`);
      setTelegramStatus(prev => ({
        ...prev,
        isLinked: false,
        chatId: null
      }));
      
      addNotification({
        type: 'info',
        title: 'Telegram отключен',
        description: 'Ваш Telegram аккаунт отвязан',
        read: false
      });
    } catch (error) {
      console.error('Ошибка отвязки Telegram:', error);
      addNotification({
        type: 'error',
        title: 'Ошибка отключения',
        description: 'Не удалось отвязать Telegram аккаунт',
        read: false
      });
    }
  };

  const toggleNotificationSetting = (setting) => {
    setNotificationSettings({
      ...notificationSettings,
      [setting]: !notificationSettings[setting]
    });
  };

  const copyBotUrl = () => {
    navigator.clipboard.writeText(botUrl);
    addNotification({
      type: 'success',
      title: 'Ссылка скопирована',
      description: 'Ссылка на бота скопирована в буфер обмена',
      read: false
    });
  };

  const markAllAsRead = () => {
    setNotifications(notifications.map(n => ({ ...n, read: true })));
  };

  const markAsRead = (id) => {
    setNotifications(notifications.map(n => 
      n.id === id ? { ...n, read: true } : n
    ));
  };

  const sendTestNotification = async () => {
    if (!telegramStatus.isLinked) {
      addNotification({
        type: 'warning',
        title: 'Telegram не подключен',
        description: 'Подключите Telegram для отправки тестовых уведомлений',
        read: false
      });
      return;
    }

    setSendingTest(true);
    try {
      await axios.post(`${API_URL}/telegram/test-notification`, {
        userId: user.id,
        message: testMessage || 'Это тестовое уведомление от системы управления задачами'
      });
      
      addNotification({
        type: 'success',
        title: 'Тест отправлен',
        description: 'Тестовое уведомление отправлено в Telegram',
        read: false
      });
      setTestMessage('');
    } catch (error) {
      console.error('Ошибка отправки теста:', error);
      addNotification({
        type: 'error',
        title: 'Ошибка отправки',
        description: 'Не удалось отправить тестовое уведомление',
        read: false
      });
    } finally {
      setSendingTest(false);
    }
  };

  const simulateTaskCompletion = async () => {
    try {
      await axios.post(`${API_URL}/telegram/simulate-task-completion`, {
        userId: user.id,
        taskTitle: 'Тестовая задача',
        timeSpent: 90
      });
      
      addNotification({
        type: 'success',
        title: 'Симуляция отправлена',
        description: 'Уведомление о завершении задачи отправлено',
        read: false
      });
    } catch (error) {
      console.error('Ошибка симуляции:', error);
    }
  };

  const addNotification = (notification) => {
    const newNotification = {
      ...notification,
      id: Date.now(),
      time: 'Только что',
      read: false
    };
    setNotifications([newNotification, ...notifications.slice(0, 9)]);
  };

  const getNotificationIcon = (type) => {
    switch(type) {
      case 'task_completed': return <CheckSquare className="w-4 h-4" />;
      case 'task_assigned': return <Bell className="w-4 h-4" />;
      case 'deadline': return <Clock className="w-4 h-4" />;
      case 'status_change': return <AlertCircle className="w-4 h-4" />;
      case 'time_tracking': return <Timer className="w-4 h-4" />;
      case 'success': return <CheckCircle className="w-4 h-4" />;
      case 'error': return <XCircle className="w-4 h-4" />;
      case 'info': return <Info className="w-4 h-4" />;
      case 'warning': return <AlertCircle className="w-4 h-4" />;
      default: return <MessageSquare className="w-4 h-4" />;
    }
  };

  const getNotificationColor = (type) => {
    switch(type) {
      case 'task_completed': return 'text-green-600 bg-green-100 dark:text-green-400 dark:bg-green-900/30';
      case 'task_assigned': return 'text-blue-600 bg-blue-100 dark:text-blue-400 dark:bg-blue-900/30';
      case 'deadline': return 'text-orange-600 bg-orange-100 dark:text-orange-400 dark:bg-orange-900/30';
      case 'status_change': return 'text-purple-600 bg-purple-100 dark:text-purple-400 dark:bg-purple-900/30';
      case 'time_tracking': return 'text-teal-600 bg-teal-100 dark:text-teal-400 dark:bg-teal-900/30';
      case 'success': return 'text-green-600 bg-green-100 dark:text-green-400 dark:bg-green-900/30';
      case 'error': return 'text-red-600 bg-red-100 dark:text-red-400 dark:bg-red-900/30';
      case 'info': return 'text-blue-600 bg-blue-100 dark:text-blue-400 dark:bg-blue-900/30';
      case 'warning': return 'text-yellow-600 bg-yellow-100 dark:text-yellow-400 dark:bg-yellow-900/30';
      default: return 'text-gray-600 bg-gray-100 dark:text-gray-400 dark:bg-gray-700/50';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Загрузка настроек...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 dark:from-gray-900 dark:to-gray-950">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Telegram Уведомления</h1>
              <p className="text-gray-600 dark:text-gray-400 mt-2">
                Настройте получение уведомлений о выполнении задач в Telegram
              </p>
            </div>
            <div className="flex items-center space-x-3">
              <div className={`px-4 py-2 rounded-xl ${telegramStatus.isLinked 
                ? 'bg-gradient-to-r from-green-100 to-green-50 text-green-700 border border-green-200' 
                : 'bg-gradient-to-r from-red-100 to-red-50 text-red-700 border border-red-200'
              }`}>
                <div className="flex items-center space-x-2">
                  {telegramStatus.isLinked ? (
                    <>
                      <CheckCircle className="w-5 h-5" />
                      <span className="font-medium">Привязан</span>
                    </>
                  ) : (
                    <>
                      <XCircle className="w-5 h-5" />
                      <span className="font-medium">Не привязан</span>
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Tabs */}
          <div className="mt-6">
            <div className="flex space-x-2 border-b border-gray-200 dark:border-gray-700">
              {[
                { id: 'notifications', label: 'Уведомления', icon: <Bell className="w-4 h-4" /> },
                { id: 'tasks', label: 'Задачи', icon: <CheckSquare className="w-4 h-4" /> },
                { id: 'test', label: 'Тестирование', icon: <Send className="w-4 h-4" /> },
                { id: 'advanced', label: 'Расширенные', icon: <Settings className="w-4 h-4" /> }
              ].map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center space-x-2 px-4 py-3 text-sm font-medium transition-colors border-b-2 -mb-px ${
                    activeTab === tab.id
                      ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                      : 'border-transparent text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-300'
                  }`}
                >
                  {tab.icon}
                  <span>{tab.label}</span>
                </button>
              ))}
            </div>
          </div>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Main Content */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 }}
            className="lg:col-span-2 space-y-8"
          >
            {activeTab === 'notifications' && (
              <>
                {/* Connection Card */}
                <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
                  <div className="p-6">
                    <div className="flex items-center justify-between mb-6">
                      <h2 className="text-xl font-bold text-gray-900 dark:text-white">Подключение Telegram</h2>
                      <div className="p-2 rounded-lg bg-blue-100 dark:bg-blue-900/20">
                        <Bot className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                      </div>
                    </div>

                    {telegramStatus.isLinked ? (
                      <div className="space-y-6">
                        <div className="p-4 bg-gradient-to-r from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20 rounded-xl">
                          <div className="flex items-center justify-between">
                            <div>
                              <div className="flex items-center space-x-2 mb-2">
                                <CheckCircle className="w-5 h-5 text-green-600" />
                                <span className="font-medium text-green-700 dark:text-green-400">
                                  Telegram успешно подключен
                                </span>
                              </div>
                              <p className="text-sm text-green-600 dark:text-green-300">
                                Вы получаете уведомления о выполнении задач
                              </p>
                            </div>
                            <div className="text-right">
                              <div className="text-2xl font-bold text-green-700 dark:text-green-400">
                                {telegramStatus.notificationsCount}
                              </div>
                              <div className="text-xs text-green-600 dark:text-green-300">Отправлено уведомлений</div>
                            </div>
                          </div>
                        </div>

                        <div className="grid grid-cols-3 gap-4">
                          <div className="p-4 bg-gray-50 dark:bg-gray-700/50 rounded-xl">
                            <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">Chat ID</div>
                            <div className="font-mono text-gray-900 dark:text-white break-all">{telegramStatus.chatId}</div>
                          </div>
                          <div className="p-4 bg-gray-50 dark:bg-gray-700/50 rounded-xl">
                            <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">Последнее уведомление</div>
                            <div className="text-gray-900 dark:text-white">
                              {telegramStatus.lastNotification 
                                ? new Date(telegramStatus.lastNotification).toLocaleDateString('ru-RU')
                                : 'Еще не было'
                              }
                            </div>
                          </div>
                          <div className="p-4 bg-gray-50 dark:bg-gray-700/50 rounded-xl">
                            <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">Статус</div>
                            <div className="flex items-center">
                              <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
                              <span className="text-green-700 dark:text-green-400 font-medium">Активен</span>
                            </div>
                          </div>
                        </div>

                        <button
                          onClick={handleUnlinkTelegram}
                          className="w-full flex items-center justify-center space-x-2 px-4 py-3 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/30 rounded-xl transition-colors"
                        >
                          <Unlink className="w-5 h-5" />
                          <span className="font-medium">Отвязать Telegram</span>
                        </button>
                      </div>
                    ) : (
                      <div className="space-y-6">
                        <div className="p-4 bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 rounded-xl">
                          <div className="flex items-center space-x-3">
                            <div className="p-2 rounded-lg bg-blue-100 dark:bg-blue-900/30">
                              <BellRing className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                            </div>
                            <div>
                              <h3 className="font-medium text-gray-900 dark:text-white">Получайте уведомления о задачах</h3>
                              <p className="text-sm text-gray-600 dark:text-gray-400">
                                Привяжите Telegram для мгновенных уведомлений о завершении задач, дедлайнах и статусах
                              </p>
                            </div>
                          </div>
                        </div>

                        <div className="space-y-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                              Chat ID из Telegram
                            </label>
                            <div className="relative">
                              <LinkIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                              <input
                                type="text"
                                value={chatIdInput}
                                onChange={(e) => setChatIdInput(e.target.value)}
                                placeholder="Введите ваш Chat ID"
                                className="w-full pl-10 pr-4 py-3 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition placeholder-gray-400 dark:placeholder-gray-500"
                              />
                            </div>
                            <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                              Получите Chat ID, начав диалог с ботом @TaskManagerBot
                            </p>
                          </div>

                          <div className="flex items-center justify-between">
                            <button
                              onClick={handleLinkTelegram}
                              className="flex-1 flex items-center justify-center space-x-2 px-4 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl font-medium hover:opacity-90 transition-opacity"
                            >
                              <LinkIcon className="w-5 h-5" />
                              <span>Привязать Telegram</span>
                            </button>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Instructions */}
                <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700 p-6">
                  <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-6">Как подключить</h2>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="text-center p-4">
                      <div className="w-12 h-12 mx-auto mb-4 rounded-xl bg-blue-100 dark:bg-blue-900/20 flex items-center justify-center">
                        <div className="text-blue-600 dark:text-blue-400 text-lg font-bold">1</div>
                      </div>
                      <h3 className="font-medium text-gray-900 dark:text-white mb-2">Найдите бота</h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        Найдите @TaskManagerBot в Telegram
                      </p>
                    </div>

                    <div className="text-center p-4">
                      <div className="w-12 h-12 mx-auto mb-4 rounded-xl bg-purple-100 dark:bg-purple-900/20 flex items-center justify-center">
                        <div className="text-purple-600 dark:text-purple-400 text-lg font-bold">2</div>
                      </div>
                      <h3 className="font-medium text-gray-900 dark:text-white mb-2">Начните диалог</h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        Отправьте команду /start боту
                      </p>
                    </div>

                    <div className="text-center p-4">
                      <div className="w-12 h-12 mx-auto mb-4 rounded-xl bg-green-100 dark:bg-green-900/20 flex items-center justify-center">
                        <div className="text-green-600 dark:text-green-400 text-lg font-bold">3</div>
                      </div>
                      <h3 className="font-medium text-gray-900 dark:text-white mb-2">Получите Chat ID</h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        Бот отправит вам ваш Chat ID
                      </p>
                    </div>
                  </div>

                  <div className="mt-6 p-4 bg-gray-50 dark:bg-gray-700/50 rounded-xl">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <Smartphone className="w-5 h-5 text-gray-400" />
                        <div>
                          <div className="font-medium text-gray-900 dark:text-white">Ссылка на бота</div>
                          <div className="text-sm text-gray-600 dark:text-gray-400 truncate max-w-md">{botUrl}</div>
                        </div>
                      </div>
                      <button
                        onClick={copyBotUrl}
                        className="flex items-center space-x-2 px-3 py-2 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 rounded-lg transition-colors"
                      >
                        <Copy className="w-4 h-4" />
                        <span className="text-sm">Копировать</span>
                      </button>
                    </div>
                  </div>
                </div>
              </>
            )}

            {activeTab === 'tasks' && (
              <div className="space-y-8">
                {/* Task Statistics */}
                <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700 p-6">
                  <div className="flex items-center justify-between mb-6">
                    <h2 className="text-xl font-bold text-gray-900 dark:text-white">Статистика задач</h2>
                    <BarChart className="w-6 h-6 text-gray-400" />
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    <div className="bg-gradient-to-r from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 p-4 rounded-xl">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm text-gray-600 dark:text-gray-400">Всего задач</p>
                          <p className="text-2xl font-bold text-gray-900 dark:text-white">{taskStats.total}</p>
                        </div>
                        <FileText className="w-8 h-8 text-blue-500" />
                      </div>
                    </div>

                    <div className="bg-gradient-to-r from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20 p-4 rounded-xl">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm text-gray-600 dark:text-gray-400">Выполнено</p>
                          <p className="text-2xl font-bold text-gray-900 dark:text-white">{taskStats.completed}</p>
                        </div>
                        <CheckSquare className="w-8 h-8 text-green-500" />
                      </div>
                    </div>

                    <div className="bg-gradient-to-r from-purple-50 to-purple-100 dark:from-purple-900/20 dark:to-purple-800/20 p-4 rounded-xl">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm text-gray-600 dark:text-gray-400">В работе</p>
                          <p className="text-2xl font-bold text-gray-900 dark:text-white">{taskStats.inProgress}</p>
                        </div>
                        <PlayCircle className="w-8 h-8 text-purple-500" />
                      </div>
                    </div>

                    <div className="bg-gradient-to-r from-yellow-50 to-yellow-100 dark:from-yellow-900/20 dark:to-yellow-800/20 p-4 rounded-xl">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm text-gray-600 dark:text-gray-400">Высокий приоритет</p>
                          <p className="text-2xl font-bold text-gray-900 dark:text-white">{taskStats.highPriority}</p>
                        </div>
                        <Target className="w-8 h-8 text-yellow-500" />
                      </div>
                    </div>

                    <div className="bg-gradient-to-r from-red-50 to-red-100 dark:from-red-900/20 dark:to-red-800/20 p-4 rounded-xl">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm text-gray-600 dark:text-gray-400">Просрочено</p>
                          <p className="text-2xl font-bold text-gray-900 dark:text-white">{taskStats.overdue}</p>
                        </div>
                        <Clock className="w-8 h-8 text-red-500" />
                      </div>
                    </div>

                    <div className="bg-gradient-to-r from-teal-50 to-teal-100 dark:from-teal-900/20 dark:to-teal-800/20 p-4 rounded-xl">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm text-gray-600 dark:text-gray-400">Процент выполнения</p>
                          <p className="text-2xl font-bold text-gray-900 dark:text-white">{taskStats.completionRate}%</p>
                        </div>
                        <TrendingUp className="w-8 h-8 text-teal-500" />
                      </div>
                    </div>
                  </div>

                  <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="font-medium text-gray-900 dark:text-white">Отчет по задачам</h3>
                        <p className="text-sm text-gray-600 dark:text-gray-400">Обновите статистику</p>
                      </div>
                      <button
                        onClick={fetchTaskStats}
                        className="flex items-center space-x-2 px-4 py-2 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-lg transition-colors"
                      >
                        <RefreshCw className="w-4 h-4" />
                        <span>Обновить</span>
                      </button>
                    </div>
                  </div>
                </div>

                {/* Task Automation */}
                <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700 p-6">
                  <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-6">Автоматизация задач</h2>
                  
                  <div className="space-y-4">
                    <div className="p-4 bg-gradient-to-r from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 rounded-xl">
                      <div className="flex items-center space-x-3">
                        <div className="p-2 rounded-lg bg-blue-100 dark:bg-blue-900/30">
                          <Zap className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                        </div>
                        <div className="flex-1">
                          <h3 className="font-medium text-gray-900 dark:text-white">Автоматические уведомления</h3>
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            Система автоматически отправляет уведомления при завершении задач, изменении статусов и приближении дедлайнов
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="p-4 bg-gradient-to-r from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20 rounded-xl">
                      <div className="flex items-center space-x-3">
                        <div className="p-2 rounded-lg bg-green-100 dark:bg-green-900/30">
                          <Timer className="w-6 h-6 text-green-600 dark:text-green-400" />
                        </div>
                        <div className="flex-1">
                          <h3 className="font-medium text-gray-900 dark:text-white">Учет времени</h3>
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            Отслеживайте время, затраченное на задачи, и получайте уведомления о прогрессе
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="p-4 bg-gradient-to-r from-purple-50 to-purple-100 dark:from-purple-900/20 dark:to-purple-800/20 rounded-xl">
                      <div className="flex items-center space-x-3">
                        <div className="p-2 rounded-lg bg-purple-100 dark:bg-purple-900/30">
                          <Users className="w-6 h-6 text-purple-600 dark:text-purple-400" />
                        </div>
                        <div className="flex-1">
                          <h3 className="font-medium text-gray-900 dark:text-white">Командные уведомления</h3>
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            Администраторы получают уведомления о завершении задач всех членов команды
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'test' && (
              <div className="space-y-8">
                {/* Test Notifications */}
                <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700 p-6">
                  <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-6">Тестирование уведомлений</h2>
                  
                  <div className="space-y-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Тестовое сообщение
                      </label>
                      <textarea
                        value={testMessage}
                        onChange={(e) => setTestMessage(e.target.value)}
                        placeholder="Введите тестовое сообщение..."
                        className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none resize-none min-h-[100px] placeholder-gray-400 dark:placeholder-gray-500"
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          Отправьте тестовое уведомление для проверки подключения
                        </p>
                      </div>
                      <button
                        onClick={sendTestNotification}
                        disabled={sendingTest || !telegramStatus.isLinked}
                        className="flex items-center space-x-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl font-medium hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {sendingTest ? (
                          <>
                            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                            <span>Отправка...</span>
                          </>
                        ) : (
                          <>
                            <Send className="w-4 h-4" />
                            <span>Отправить тест</span>
                          </>
                        )}
                      </button>
                    </div>

                    <div className="border-t border-gray-200 dark:border-gray-700 pt-6">
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Примеры уведомлений</h3>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <button
                          onClick={simulateTaskCompletion}
                          className="p-4 bg-gradient-to-r from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20 rounded-xl text-left hover:opacity-90 transition-opacity"
                        >
                          <div className="flex items-center space-x-3 mb-2">
                            <CheckSquare className="w-5 h-5 text-green-600" />
                            <span className="font-medium text-green-700 dark:text-green-400">Завершение задачи</span>
                          </div>
                          <p className="text-sm text-green-600 dark:text-green-300">
                            Отправить уведомление о завершении задачи
                          </p>
                        </button>

                        <button
                          onClick={() => setTestMessage('Тестовое уведомление о дедлайне')}
                          className="p-4 bg-gradient-to-r from-orange-50 to-orange-100 dark:from-orange-900/20 dark:to-orange-800/20 rounded-xl text-left hover:opacity-90 transition-opacity"
                        >
                          <div className="flex items-center space-x-3 mb-2">
                            <Clock className="w-5 h-5 text-orange-600" />
                            <span className="font-medium text-orange-700 dark:text-orange-400">Напоминание о дедлайне</span>
                          </div>
                          <p className="text-sm text-orange-600 dark:text-orange-300">
                            Пример уведомления о приближающемся сроке
                          </p>
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'advanced' && (
              <div className="space-y-8">
                {/* Webhook Settings */}
                <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700 p-6">
                  <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-6">Настройки Webhook</h2>
                  
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Webhook URL
                      </label>
                      <input
                        type="text"
                        value={webhookUrl}
                        onChange={(e) => setWebhookUrl(e.target.value)}
                        placeholder="https://ваш-домен/api/webhook"
                        className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition placeholder-gray-400 dark:placeholder-gray-500"
                      />
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                        URL для получения обратных вызовов от Telegram
                      </p>
                    </div>

                    <div className="p-4 bg-gradient-to-r from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 rounded-xl">
                      <div className="flex items-center space-x-3">
                        <Shield className="w-5 h-5 text-blue-600" />
                        <div>
                          <h3 className="font-medium text-blue-700 dark:text-blue-400">Безопасность</h3>
                          <p className="text-sm text-blue-600 dark:text-blue-300">
                            Webhook настроен с использованием защищенного протокола HTTPS
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Notification Templates */}
                <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700 p-6">
                  <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-6">Шаблоны уведомлений</h2>
                  
                  <div className="space-y-4">
                    <div className="p-4 bg-gray-50 dark:bg-gray-700/50 rounded-xl">
                      <h4 className="font-medium text-gray-900 dark:text-white mb-2">Завершение задачи</h4>
                      <pre className="text-sm text-gray-600 dark:text-gray-400 whitespace-pre-wrap font-mono">
{`🎉 <b>Поздравляем!</b>

Вы успешно завершили задачу "{task.title}"!

<b>Затрачено времени:</b> {timeSpent}
<b>Статус:</b> Завершено ✅

Хорошая работа! 🚀`}
                      </pre>
                    </div>

                    <div className="p-4 bg-gray-50 dark:bg-gray-700/50 rounded-xl">
                      <h4 className="font-medium text-gray-900 dark:text-white mb-2">Назначение задачи</h4>
                      <pre className="text-sm text-gray-600 dark:text-gray-400 whitespace-pre-wrap font-mono">
{`📋 <b>Новая задача назначена</b>

<b>Задача:</b> {task.title}
<b>Приоритет:</b> {priority}
<b>Срок:</b> {dueDate}

Для просмотра деталей перейдите в раздел "Задачи".`}
                      </pre>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </motion.div>

          {/* Right Column - Settings & Notifications */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
            className="space-y-8"
          >
            {/* Notification Settings */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700 p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-gray-900 dark:text-white">Настройки уведомлений</h2>
                <Bell className="w-6 h-6 text-gray-400" />
              </div>

              <div className="space-y-4">
                {Object.entries({
                  taskAssigned: { label: 'Новые задачи', description: 'Когда вам назначают задачу', icon: <Bell className="w-4 h-4" /> },
                  taskCompleted: { label: 'Завершение задач', description: 'Когда вы завершаете задачу', icon: <CheckSquare className="w-4 h-4" /> },
                  deadlineReminder: { label: 'Напоминания о сроках', description: 'За 1 день до дедлайна', icon: <Clock className="w-4 h-4" /> },
                  statusChange: { label: 'Изменение статуса', description: 'Когда меняется статус задачи', icon: <AlertCircle className="w-4 h-4" /> },
                  timeTracking: { label: 'Учет времени', description: 'Уведомления о добавлении времени', icon: <Timer className="w-4 h-4" /> },
                  workStarted: { label: 'Начало работы', description: 'Когда вы начинаете работу над задачей', icon: <PlayCircle className="w-4 h-4" /> },
                  dailyDigest: { label: 'Ежедневный дайджест', description: 'Сводка задач на день', icon: <Mail className="w-4 h-4" /> },
                  mentions: { label: 'Упоминания', description: 'Когда вас упоминают в задачах', icon: <UserCheck className="w-4 h-4" /> },
                }).map(([key, setting]) => (
                  <div key={key} className="flex items-center justify-between p-3 hover:bg-gray-50 dark:hover:bg-gray-700/50 rounded-xl transition-colors">
                    <div className="flex items-center space-x-3">
                      <div className="p-2 rounded-lg bg-gray-100 dark:bg-gray-700">
                        {setting.icon}
                      </div>
                      <div>
                        <div className="font-medium text-gray-900 dark:text-white">{setting.label}</div>
                        <div className="text-sm text-gray-600 dark:text-gray-400">{setting.description}</div>
                      </div>
                    </div>
                    <button
                      onClick={() => toggleNotificationSetting(key)}
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${notificationSettings[key] ? 'bg-blue-600' : 'bg-gray-300 dark:bg-gray-600'}`}
                    >
                      <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${notificationSettings[key] ? 'translate-x-6' : 'translate-x-1'}`} />
                    </button>
                  </div>
                ))}
              </div>

              <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-medium text-gray-900 dark:text-white">Тестовое уведомление</div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">Отправить пример уведомления</div>
                  </div>
                  <button 
                    onClick={sendTestNotification}
                    disabled={!telegramStatus.isLinked}
                    className="px-4 py-2 bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Отправить
                  </button>
                </div>
              </div>
            </div>

            {/* Recent Notifications */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700 p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-gray-900 dark:text-white">Последние уведомления</h2>
                <button
                  onClick={markAllAsRead}
                  className="text-sm text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300"
                >
                  Прочитать все
                </button>
              </div>

              <div className="space-y-4 max-h-[400px] overflow-y-auto">
                {notifications.map((notification) => (
                  <div
                    key={notification.id}
                    onClick={() => markAsRead(notification.id)}
                    className={`p-3 rounded-xl transition-colors cursor-pointer ${notification.read 
                      ? 'bg-gray-50 dark:bg-gray-700/30' 
                      : 'bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-800'
                    }`}
                  >
                    <div className="flex items-start space-x-3">
                      <div className={`p-2 rounded-lg ${getNotificationColor(notification.type)}`}>
                        {getNotificationIcon(notification.type)}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <h4 className="font-medium text-gray-900 dark:text-white">{notification.title}</h4>
                          {!notification.read && (
                            <span className="w-2 h-2 rounded-full bg-blue-500"></span>
                          )}
                        </div>
                        <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                          {notification.description}
                        </p>
                        <div className="flex items-center justify-between mt-2">
                          <div className="text-xs text-gray-500 dark:text-gray-400">
                            {notification.time}
                          </div>
                          {notification.taskId && (
                            <span className="text-xs px-2 py-1 bg-gray-100 dark:bg-gray-700 rounded">
                              Задача #{notification.taskId}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {notifications.length === 0 && (
                <div className="text-center py-8">
                  <MessageSquare className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                  <p className="text-gray-500 dark:text-gray-400">Уведомлений пока нет</p>
                </div>
              )}
            </div>

            {/* Benefits Card */}
            <div className="bg-gradient-to-r from-blue-500 to-purple-500 rounded-2xl p-6 text-white">
              <div className="flex items-center space-x-3 mb-4">
                <Rocket className="w-6 h-6" />
                <h3 className="text-lg font-bold">Преимущества</h3>
              </div>
              
              <ul className="space-y-3">
                <li className="flex items-center space-x-2">
                  <CheckCircle className="w-4 h-4" />
                  <span>Мгновенные уведомления о задачах</span>
                </li>
                <li className="flex items-center space-x-2">
                  <CheckCircle className="w-4 h-4" />
                  <span>Автоматическое отслеживание прогресса</span>
                </li>
                <li className="flex items-center space-x-2">
                  <CheckCircle className="w-4 h-4" />
                  <span>Настройка типов уведомлений</span>
                </li>
                <li className="flex items-center space-x-2">
                  <CheckCircle className="w-4 h-4" />
                  <span>Учет времени и дедлайнов</span>
                </li>
                <li className="flex items-center space-x-2">
                  <CheckCircle className="w-4 h-4" />
                  <span>Работает на всех устройствах</span>
                </li>
              </ul>
            </div>
          </motion.div>
        </div>

        {/* User Info */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="mt-8"
        >
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700 p-6">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-6">Информация о пользователе</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <div className="p-4 bg-gray-50 dark:bg-gray-700/50 rounded-xl">
                <div className="text-sm text-gray-600 dark:text-gray-400 mb-2">Имя пользователя</div>
                <div className="text-lg font-medium text-gray-900 dark:text-white">{user.username}</div>
              </div>
              
              <div className="p-4 bg-gray-50 dark:bg-gray-700/50 rounded-xl">
                <div className="text-sm text-gray-600 dark:text-gray-400 mb-2">Email</div>
                <div className="text-lg font-medium text-gray-900 dark:text-white">{user.email}</div>
              </div>
              
              <div className="p-4 bg-gray-50 dark:bg-gray-700/50 rounded-xl">
                <div className="text-sm text-gray-600 dark:text-gray-400 mb-2">Роль</div>
                <div className="text-lg font-medium text-gray-900 dark:text-white capitalize">
                  {user.role === 'admin' ? 'Администратор' : 'Пользователь'}
                </div>
              </div>
              
              <div className="p-4 bg-gray-50 dark:bg-gray-700/50 rounded-xl">
                <div className="text-sm text-gray-600 dark:text-gray-400 mb-2">Статус уведомлений</div>
                <div className="flex items-center">
                  <div className={`w-2 h-2 rounded-full mr-2 ${telegramStatus.isLinked ? 'bg-green-500' : 'bg-red-500'}`}></div>
                  <span className="text-lg font-medium text-gray-900 dark:text-white">
                    {telegramStatus.isLinked ? 'Активны' : 'Неактивны'}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default TelegramSettings;