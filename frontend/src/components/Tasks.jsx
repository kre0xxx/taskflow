import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Plus, 
  Search, 
  Filter, 
  X, 
  MoreVertical,
  Clock,
  User,
  Tag,
  Calendar,
  Paperclip,
  MessageSquare,
  Eye,
  CheckCircle,
  AlertCircle,
  Star,
  Users,
  Download,
  Share2,
  Archive,
  Copy,
  Trash2,
  Edit2,
  Check,
  ChevronDown,
  List,
  Grid,
  Columns,
  Zap,
  Target,
  BarChart2,
  Bell,
  PlayCircle,
  PauseCircle,
  StopCircle,
  Timer,
  TrendingUp,
  Percent,
  FileText,
  BellRing,
  Clock3,
  AlertTriangle,
  CalendarDays,
  UserCheck,
  ChevronRight,
  Upload,
  Link,
  ExternalLink,
  Maximize2,
  Minimize2,
  RotateCcw,
  Save,
  CheckSquare,
  Square
} from 'lucide-react';
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || '/api';

const statusColumns = [
  { 
    id: 'new', 
    title: 'К выполнению', 
    color: 'bg-gradient-to-r from-gray-200 to-gray-300', 
    textColor: 'text-gray-800 dark:text-gray-300',
    icon: <List className="w-4 h-4" />
  },
  { 
    id: 'in-progress', 
    title: 'В работе', 
    color: 'bg-gradient-to-r from-blue-100 to-blue-200', 
    textColor: 'text-blue-800 dark:text-blue-300',
    icon: <Zap className="w-4 h-4" />
  },
  { 
    id: 'review', 
    title: 'На проверке', 
    color: 'bg-gradient-to-r from-yellow-100 to-yellow-200', 
    textColor: 'text-yellow-800 dark:text-yellow-300',
    icon: <Eye className="w-4 h-4" />
  },
  { 
    id: 'completed', 
    title: 'Выполнено', 
    color: 'bg-gradient-to-r from-green-100 to-green-200', 
    textColor: 'text-green-800 dark:text-green-300',
    icon: <CheckCircle className="w-4 h-4" />
  },
];

const priorityColors = {
  high: { 
    bg: 'bg-gradient-to-r from-red-100 to-red-50', 
    text: 'text-red-700 dark:text-red-300', 
    border: 'border-red-200',
    icon: <AlertCircle className="w-4 h-4" />
  },
  medium: { 
    bg: 'bg-gradient-to-r from-yellow-100 to-yellow-50', 
    text: 'text-yellow-700 dark:text-yellow-300', 
    border: 'border-yellow-200',
    icon: <Target className="w-4 h-4" />
  },
  low: { 
    bg: 'bg-gradient-to-r from-green-100 to-green-50', 
    text: 'text-green-700 dark:text-green-300', 
    border: 'border-green-200',
    icon: <BarChart2 className="w-4 h-4" />
  },
};

const Tasks = () => {
  const { user, isAdmin } = useAuth();
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState('board');
  const [showFilters, setShowFilters] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showTaskDetail, setShowTaskDetail] = useState(null);
  const [editingTask, setEditingTask] = useState(null);
  const [completingTask, setCompletingTask] = useState(null);
  const [timeTrackingModal, setTimeTrackingModal] = useState(null);
  const [activeTimeTrackers, setActiveTimeTrackers] = useState({});
  const [selectedTasks, setSelectedTasks] = useState([]);
  const [bulkActions, setBulkActions] = useState(false);
  
  const [newTask, setNewTask] = useState({
    title: '',
    description: '',
    priority: 'medium',
    dueDate: '',
    assignedTo: '',
    tags: [],
    timeEstimate: '',
    status: 'new'
  });
  
  const [completionData, setCompletionData] = useState({
    timeSpent: 0,
    notes: '',
    attachments: []
  });
  
  const [timeTrackingData, setTimeTrackingData] = useState({
    minutes: 0,
    description: ''
  });
  
  const [users, setUsers] = useState([]);
  const [tags] = useState([
    { id: 'bug', label: 'Ошибка', color: 'bg-red-500' },
    { id: 'feature', label: 'Функция', color: 'bg-blue-500' },
    { id: 'design', label: 'Дизайн', color: 'bg-purple-500' },
    { id: 'backend', label: 'Бэкенд', color: 'bg-gray-500' },
    { id: 'frontend', label: 'Фронтенд', color: 'bg-green-500' },
    { id: 'urgent', label: 'Срочно', color: 'bg-orange-500' },
    { id: 'documentation', label: 'Документация', color: 'bg-teal-500' },
    { id: 'testing', label: 'Тестирование', color: 'bg-pink-500' },
  ]);
  
  const [selectedTags, setSelectedTags] = useState([]);
  const [filters, setFilters] = useState({
    priority: 'all',
    assignee: 'all',
    dueDate: 'all',
    status: 'all'
  });
  
  const [taskStats, setTaskStats] = useState({
    total: 0,
    completed: 0,
    inProgress: 0,
    new: 0,
    highPriority: 0,
    assignedToMe: 0,
    overdue: 0,
    completionRate: 0,
    totalTimeSpent: 0
  });
  
  const fileInputRef = useRef(null);
  const [attachments, setAttachments] = useState([]);

  useEffect(() => {
    fetchTasks();
    if (isAdmin) {
      fetchUsers();
    }
    fetchTaskStats();
  }, []);

  // Загрузка задач
  const fetchTasks = async () => {
  try {
    setLoading(true);
    const response = await axios.get(`${API_URL}/tasks`, {
      params: {
        status: filters.status !== 'all' ? filters.status : undefined,
        priority: filters.priority !== 'all' ? filters.priority : undefined,
        search: searchQuery || undefined
      }
    });
    
    // Проверяем формат ответа (с пагинацией или без)
    if (response.data.tasks) {
      // Если API возвращает с пагинацией { tasks: [...], pagination: {...} }
      setTasks(response.data.tasks);
    } else if (Array.isArray(response.data)) {
      // Если API возвращает просто массив
      setTasks(response.data);
    } else {
      console.warn('Unexpected response format:', response.data);
      setTasks([]);
    }
  } catch (error) {
    console.error('Ошибка загрузки задач:', error);
    setTasks([]);
  } finally {
    setLoading(false);
  }
};

  const fetchUsers = async () => {
    try {
      const response = await axios.get(`${API_URL}/users`);
      setUsers(response.data);
    } catch (error) {
      console.error('Ошибка загрузки пользователей:', error);
    }
  };

  const fetchTaskStats = async () => {
  try {
    const response = await axios.get(`${API_URL}/tasks/statistics`);
    const stats = response.data;
    
    // Добавляем вычисляемые поля
    setTaskStats({
      ...stats,
      assignedToMe: tasks.filter(t => t.assignedTo === user.id).length,
      totalTimeSpent: tasks.reduce((sum, t) => sum + (t.timeSpent || 0), 0)
    });
  } catch (error) {
    console.error('Ошибка загрузки статистики:', error);
  }
};

  const handleCreateTask = async (e) => {
  e.preventDefault();
  
  // Валидация перед отправкой
  if (!newTask.title || newTask.title.length < 3) {
    alert('Название задачи должно содержать минимум 3 символа');
    return;
  }
  
  if (!newTask.assignedTo) {
    alert('Выберите исполнителя задачи');
    return;
  }
  
  try {
    // Подготавливаем данные для отправки
    const taskData = {
      title: newTask.title.trim(),
      description: newTask.description?.trim() || null,
      priority: newTask.priority || 'medium',
      dueDate: newTask.dueDate || null,
      assignedTo: parseInt(newTask.assignedTo), // Преобразуем в число
      timeEstimate: newTask.timeEstimate ? parseInt(newTask.timeEstimate) : null,
      tags: newTask.tags || []
      // createdBy добавляется на бэкенде автоматически из req.user.id
    };
    
    console.log('Sending task data:', taskData); // Для отладки
    
    const response = await axios.post(`${API_URL}/tasks`, taskData);
    
    console.log('Task created:', response.data);
    
    setShowCreateModal(false);
    setNewTask({
      title: '',
      description: '',
      priority: 'medium',
      dueDate: '',
      assignedTo: '',
      tags: [],
      timeEstimate: '',
      status: 'new'
    });
    
    fetchTasks();
    fetchTaskStats();
  } catch (error) {
    console.error('Ошибка создания задачи:', error);
    
    // Показываем детальную ошибку от сервера
    if (error.response) {
      // Сервер вернул ошибку с деталями
      console.error('Server response:', error.response.data);
      alert(`Ошибка: ${error.response.data.message || 'Неизвестная ошибка'}`);
    } else if (error.request) {
      // Запрос был отправлен, но нет ответа
      alert('Сервер не отвечает. Проверьте подключение.');
    } else {
      // Ошибка при настройке запроса
      alert(`Ошибка: ${error.message}`);
    }
  }
};

  // Обновление задачи
  const handleUpdateTask = async (taskId, updates) => {
    try {
      await axios.patch(`${API_URL}/tasks/${taskId}`, updates);
      fetchTasks();
      fetchTaskStats();
      if (editingTask?.id === taskId) {
        setEditingTask(null);
      }
      if (showTaskDetail?.id === taskId) {
        setShowTaskDetail(prev => ({ ...prev, ...updates }));
      }
    } catch (error) {
      console.error('Ошибка обновления задачи:', error);
    }
  };

  // Удаление задачи
  const handleDeleteTask = async (taskId) => {
    try {
      await axios.delete(`${API_URL}/tasks/${taskId}`);
      fetchTasks();
      fetchTaskStats();
      if (showTaskDetail?.id === taskId) {
        setShowTaskDetail(null);
      }
    } catch (error) {
      console.error('Ошибка удаления задачи:', error);
    }
  };

  // Начать работу над задачей
  const handleStartWork = async (taskId) => {
    try {
      await axios.post(`${API_URL}/tasks/${taskId}/start-work`);
      
      // Стартуем таймер
      setActiveTimeTrackers(prev => ({
        ...prev,
        [taskId]: {
          startTime: new Date(),
          elapsed: 0,
          interval: setInterval(() => {
            setActiveTimeTrackers(current => {
              const tracker = current[taskId];
              if (tracker) {
                return {
                  ...current,
                  [taskId]: {
                    ...tracker,
                    elapsed: Math.floor((new Date() - tracker.startTime) / 1000 / 60) // минуты
                  }
                };
              }
              return current;
            });
          }, 60000) // обновляем каждую минуту
        }
      }));
      
      fetchTasks();
    } catch (error) {
      console.error('Ошибка начала работы:', error);
    }
  };

  // Остановить работу
  const handleStopWork = async (taskId) => {
    const tracker = activeTimeTrackers[taskId];
    if (tracker) {
      clearInterval(tracker.interval);
      
      // Сохраняем затраченное время
      const timeSpent = tracker.elapsed;
      if (timeSpent > 0) {
        await handleAddTime(taskId, timeSpent);
      }
      
      setActiveTimeTrackers(prev => {
        const newTrackers = { ...prev };
        delete newTrackers[taskId];
        return newTrackers;
      });
    }
  };

  // Завершить задачу
  const handleCompleteTask = async (taskId, data) => {
    try {
      await axios.post(`${API_URL}/tasks/${taskId}/complete`, {
        timeSpent: data.timeSpent,
        notes: data.notes
      });
      
      // Останавливаем таймер если был активен
      if (activeTimeTrackers[taskId]) {
        handleStopWork(taskId);
      }
      
      setCompletingTask(null);
      setCompletionData({
        timeSpent: 0,
        notes: '',
        attachments: []
      });
      fetchTasks();
      fetchTaskStats();
    } catch (error) {
      console.error('Ошибка завершения задачи:', error);
    }
  };

  // Добавить время
  const handleAddTime = async (taskId, minutes, description = '') => {
    try {
      await axios.post(`${API_URL}/tasks/${taskId}/add-time`, {
        minutes,
        description
      });
      fetchTasks();
      setTimeTrackingModal(null);
      setTimeTrackingData({
        minutes: 0,
        description: ''
      });
    } catch (error) {
      console.error('Ошибка добавления времени:', error);
    }
  };

  // Отправить на проверку
  const handleSubmitForReview = async (taskId) => {
    try {
      await handleUpdateTask(taskId, { status: 'review' });
    } catch (error) {
      console.error('Ошибка отправки на проверку:', error);
    }
  };

  // Принять задачу
  const handleAcceptTask = async (taskId) => {
    try {
      await handleUpdateTask(taskId, { status: 'completed' });
    } catch (error) {
      console.error('Ошибка принятия задачи:', error);
    }
  };

  // Вернуть на доработку
  const handleReturnTask = async (taskId) => {
    try {
      await handleUpdateTask(taskId, { status: 'in-progress' });
    } catch (error) {
      console.error('Ошибка возврата задачи:', error);
    }
  };

  // Групповые операции
  const handleBulkComplete = async () => {
    try {
      await Promise.all(
        selectedTasks.map(taskId => 
          axios.post(`${API_URL}/tasks/${taskId}/complete`, {
            timeSpent: 0,
            notes: 'Выполнено массово'
          })
        )
      );
      setSelectedTasks([]);
      setBulkActions(false);
      fetchTasks();
      fetchTaskStats();
    } catch (error) {
      console.error('Ошибка массового завершения:', error);
    }
  };

  const handleBulkDelete = async () => {
    try {
      await Promise.all(
        selectedTasks.map(taskId => 
          axios.delete(`${API_URL}/tasks/${taskId}`)
        )
      );
      setSelectedTasks([]);
      setBulkActions(false);
      fetchTasks();
      fetchTaskStats();
    } catch (error) {
      console.error('Ошибка массового удаления:', error);
    }
  };

  const handleBulkAssign = async (userId) => {
    try {
      await Promise.all(
        selectedTasks.map(taskId => 
          axios.patch(`${API_URL}/tasks/${taskId}`, { assignedTo: userId })
        )
      );
      setSelectedTasks([]);
      setBulkActions(false);
      fetchTasks();
    } catch (error) {
      console.error('Ошибка массового назначения:', error);
    }
  };

  // Вспомогательные функции
 const getTasksByStatus = (status) => {
  // Проверяем, что tasks - это массив
  if (!Array.isArray(tasks)) {
    console.warn('Tasks is not an array:', tasks);
    return [];
  }
  
  let filtered = tasks.filter(task => task && task.status === status);
  
  if (filters.priority !== 'all') {
    filtered = filtered.filter(task => task.priority === filters.priority);
  }
  
  if (filters.assignee === 'me') {
    filtered = filtered.filter(task => task.assignedTo === user.id);
  } else if (filters.assignee !== 'all' && filters.assignee !== 'me') {
    filtered = filtered.filter(task => task.assignedTo === filters.assignee);
  }
  
  if (searchQuery) {
    filtered = filtered.filter(task => 
      task.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      task.description?.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }
  
  return filtered;
};

  const toggleTag = (tagId) => {
    setSelectedTags(prev => 
      prev.includes(tagId) 
        ? prev.filter(t => t !== tagId)
        : [...prev, tagId]
    );
  };

  const clearFilters = () => {
    setSearchQuery('');
    setSelectedTags([]);
    setFilters({
      priority: 'all',
      assignee: 'all',
      dueDate: 'all',
      status: 'all'
    });
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'Без срока';
    const date = new Date(dateString);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const diffTime = date - today;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) return 'Сегодня';
    if (diffDays === 1) return 'Завтра';
    if (diffDays === -1) return 'Вчера';
    if (diffDays < 0) return `${Math.abs(diffDays)} дн. назад`;
    return `Через ${diffDays} дн.`;
  };

  const getDateColor = (dateString) => {
    if (!dateString) return 'text-gray-500';
    
    const date = new Date(dateString);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const diffTime = date - today;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays < 0) return 'text-red-500';
    if (diffDays === 0) return 'text-orange-500';
    if (diffDays <= 2) return 'text-yellow-500';
    return 'text-green-500';
  };

  const formatTime = (minutes) => {
    if (!minutes) return '0 мин';
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    
    if (hours > 0 && mins > 0) {
      return `${hours} ч ${mins} мин`;
    } else if (hours > 0) {
      return `${hours} ч`;
    } else {
      return `${mins} мин`;
    }
  };

  const calculateProgress = (task) => {
  if (!task || !task.timeEstimate || task.timeEstimate === 0) return 0;
  const spent = task.timeSpent || 0;
  return Math.min(100, Math.round((spent / task.timeEstimate) * 100));
};

  const toggleTaskSelection = (taskId) => {
    setSelectedTasks(prev => 
      prev.includes(taskId) 
        ? prev.filter(id => id !== taskId)
        : [...prev, taskId]
    );
  };

  const selectAllTasks = () => {
    if (selectedTasks.length === tasks.length) {
      setSelectedTasks([]);
    } else {
      setSelectedTasks(tasks.map(task => task.id));
    }
  };

  // Проверка принадлежности задачи пользователю
  const isTaskAssignedToMe = (task) => {
  if (!task) return false;
  return task.assignedTo === user.id || task.assignee?.id === user.id;
};

  const canEditTask = (task) => {
    return isAdmin || isTaskAssignedToMe(task);
  };

  

  const canCompleteTask = (task) => {
    return isTaskAssignedToMe(task) && task.status !== 'completed';
  };

  const canStartWork = (task) => {
    return isTaskAssignedToMe(task) && task.status === 'new' && !activeTimeTrackers[task.id];
  };

  const canReviewTask = (task) => {
    return isAdmin && task.status === 'review';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400 dark:text-gray-300">Загрузка задач...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 dark:from-gray-900 dark:to-gray-950">
      {/* Header */}
      <div className="sticky top-0 z-40 bg-white/80 dark:bg-gray-900/80 backdrop-blur-lg border-b border-gray-200 dark:border-gray-800">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Задачи</h1>
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => setShowCreateModal(true)}
                  className="flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-xl font-medium hover:opacity-90 transition-opacity shadow-lg hover:shadow-xl"
                >
                  <Plus className="w-4 h-4" />
                  <span>Создать</span>
                </button>
                
                {selectedTasks.length > 0 && (
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => setBulkActions(!bulkActions)}
                      className="flex items-center space-x-2 px-4 py-2 bg-blue-100 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 rounded-xl hover:bg-blue-200 dark:hover:bg-blue-900/30 transition-colors"
                    >
                      <CheckSquare className="w-4 h-4" />
                      <span>{selectedTasks.length} выбрано</span>
                      <ChevronDown className="w-4 h-4" />
                    </button>
                    
                    {bulkActions && (
                      <div className="absolute mt-2 bg-white dark:bg-gray-800 rounded-xl shadow-xl border border-gray-200 dark:border-gray-700 z-50">
                        <div className="p-2">
                          <button
                            onClick={handleBulkComplete}
                            className="w-full text-left px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg flex items-center space-x-2"
                          >
                            <CheckCircle className="w-4 h-4 text-green-600" />
                            <span>Завершить выбранные</span>
                          </button>
                          {isAdmin && (
                            <>
                              <button
                                onClick={() => {
                                  const userId = prompt('Введите ID пользователя для назначения:');
                                  if (userId) handleBulkAssign(userId);
                                }}
                                className="w-full text-left px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg flex items-center space-x-2"
                              >
                                <User className="w-4 h-4 text-blue-600" />
                                <span>Назначить исполнителя</span>
                              </button>
                              <button
                                onClick={handleBulkDelete}
                                className="w-full text-left px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg flex items-center space-x-2 text-red-600"
                              >
                                <Trash2 className="w-4 h-4" />
                                <span>Удалить выбранные</span>
                              </button>
                            </>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>

            <div className="flex items-center space-x-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4 dark:text-gray-300" />
                <input
                  type="text"
                  placeholder="Поиск задач..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 pr-4 py-2 bg-gray-100 dark:bg-gray-800 border-0 rounded-xl focus:ring-2 focus:ring-blue-500 focus:bg-white dark:focus:bg-gray-700 outline-none w-64 transition-all"
                />
              </div>
              
              <button
                onClick={() => setShowFilters(!showFilters)}
                className={`p-2 rounded-xl transition-colors ${showFilters 
                  ? 'bg-blue-100 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400' 
                  : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'
                }`}
              >
                <Filter className="w-5 h-5" />
              </button>
              
              <div className="flex border border-gray-200 dark:border-gray-700 rounded-xl overflow-hidden">
                <button
                  onClick={() => setViewMode('board')}
                  className={`px-3 py-2 text-sm font-medium transition-colors ${viewMode === 'board' 
                    ? 'bg-blue-500 text-white' 
                    : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700'
                  }`}
                >
                  <Columns className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setViewMode('list')}
                  className={`px-3 py-2 text-sm font-medium transition-colors ${viewMode === 'list' 
                    ? 'bg-blue-500 text-white' 
                    : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700'
                  }`}
                >
                  <List className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>

          {/* Filters Panel */}
          {showFilters && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-800"
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300">Фильтры</h3>
                <button
                  onClick={clearFilters}
                  className="text-sm text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300"
                >
                  Сбросить все
                </button>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                {/* Status */}
                <div>
                  <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-2 dark:text-gray-300">
                    Статус
                  </label>
                  <select
                    value={filters.status}
                    onChange={(e) => setFilters({...filters, status: e.target.value})}
                    className="w-full px-3 py-2 text-sm bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
                  >
                    <option value="all">Все статусы</option>
                    <option value="new">К выполнению</option>
                    <option value="in-progress">В работе</option>
                    <option value="review">На проверке</option>
                    <option value="completed">Выполнено</option>
                  </select>
                </div>

                {/* Priority */}
                <div>
                  <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-2 dark:text-gray-300">
                    Приоритет
                  </label>
                  <select
                    value={filters.priority}
                    onChange={(e) => setFilters({...filters, priority: e.target.value})}
                    className="w-full px-3 py-2 text-sm bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
                  >
                    <option value="all">Все приоритеты</option>
                    <option value="high">Высокий</option>
                    <option value="medium">Средний</option>
                    <option value="low">Низкий</option>
                  </select>
                </div>

                {/* Assignee */}
                <div>
                  <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-2 dark:text-gray-300">
                    Исполнитель
                  </label>
                  <select
                    value={filters.assignee}
                    onChange={(e) => setFilters({...filters, assignee: e.target.value})}
                    className="w-full px-3 py-2 text-sm bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
                  >
                    <option value="all">Все исполнители</option>
                    <option value="me">Назначено мне</option>
                    <option value="unassigned">Не назначено</option>
                    {users.map(user => (
                      <option key={user.id} value={user.id}>
                        {user.username}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Tags */}
                <div>
                  <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-2 dark:text-gray-300">
                    Теги
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {tags.map(tag => (
                      <button
                        key={tag.id}
                        onClick={() => toggleTag(tag.id)}
                        className={`flex items-center space-x-1 px-3 py-1.5 text-xs rounded-full transition-all ${selectedTags.includes(tag.id)
                          ? `${tag.color} text-white`
                          : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'
                        }`}
                      >
                        <div className={`w-2 h-2 rounded-full ${selectedTags.includes(tag.id) ? 'bg-white' : tag.color}`}></div>
                        <span>{tag.label}</span>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </div>
      </div>

      {/* Stats Overview */}
      <div className="container mx-auto px-6 py-6">
        <div className="grid grid-cols-2 md:grid-cols-8 gap-4 mb-8">
          <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm border border-gray-100 dark:border-gray-700">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400 dark:text-gray-300">Всего</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{taskStats.total}</p>
              </div>
              <div className="p-2 rounded-lg bg-gray-100 dark:bg-gray-700">
                <FileText className="w-5 h-5 text-gray-600 dark:text-gray-400 dark:text-gray-300" />
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm border border-gray-100 dark:border-gray-700">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400 dark:text-gray-300">В работе</p>
                <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">{taskStats.inProgress}</p>
              </div>
              <div className="p-2 rounded-lg bg-blue-100 dark:bg-blue-900/20">
                <PlayCircle className="w-5 h-5 text-blue-600 dark:text-blue-400" />
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm border border-gray-100 dark:border-gray-700">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400 dark:text-gray-300">Выполнено</p>
                <p className="text-2xl font-bold text-green-600 dark:text-green-400">{taskStats.completed}</p>
              </div>
              <div className="p-2 rounded-lg bg-green-100 dark:bg-green-900/20">
                <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400" />
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm border border-gray-100 dark:border-gray-700">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400 dark:text-gray-300">На проверке</p>
                <p className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">
                  {tasks.filter(t => t.status === 'review').length}
                </p>
              </div>
              <div className="p-2 rounded-lg bg-yellow-100 dark:bg-yellow-900/20">
                <Eye className="w-5 h-5 text-yellow-600 dark:text-yellow-400" />
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm border border-gray-100 dark:border-gray-700">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400 dark:text-gray-300">Высокий приоритет</p>
                <p className="text-2xl font-bold text-red-600 dark:text-red-400">{taskStats.highPriority}</p>
              </div>
              <div className="p-2 rounded-lg bg-red-100 dark:bg-red-900/20">
                <AlertTriangle className="w-5 h-5 text-red-600 dark:text-red-400" />
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm border border-gray-100 dark:border-gray-700">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400 dark:text-gray-300">Мои задачи</p>
                <p className="text-2xl font-bold text-purple-600 dark:text-purple-400">{taskStats.assignedToMe}</p>
              </div>
              <div className="p-2 rounded-lg bg-purple-100 dark:bg-purple-900/20">
                <User className="w-5 h-5 text-purple-600 dark:text-purple-400" />
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm border border-gray-100 dark:border-gray-700">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400 dark:text-gray-300">Просрочено</p>
                <p className="text-2xl font-bold text-red-600 dark:text-red-400">{taskStats.overdue}</p>
              </div>
              <div className="p-2 rounded-lg bg-red-100 dark:bg-red-900/20">
                <Clock3 className="w-5 h-5 text-red-600 dark:text-red-400" />
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm border border-gray-100 dark:border-gray-700">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400 dark:text-gray-300">Выполнено</p>
                <p className="text-2xl font-bold text-teal-600 dark:text-teal-400">{taskStats.completionRate}%</p>
              </div>
              <div className="p-2 rounded-lg bg-teal-100 dark:bg-teal-900/20">
                <TrendingUp className="w-5 h-5 text-teal-600 dark:text-teal-400" />
              </div>
            </div>
          </div>
        </div>

        {/* Main Content - Board View */}
        {viewMode === 'board' ? (
          <div className="flex space-x-6 overflow-x-auto pb-6">
            {statusColumns.map((column) => (
              <div key={column.id} className="flex-shrink-0 w-80">
                <div className={`p-5 rounded-t-2xl ${column.color} ${column.textColor}`}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      {column.icon}
                      <h3 className="text-lg font-bold text-gray-900 dark:text-white tracking-tight">{column.title}</h3>
                      <span className="text-sm bg-white/70 dark:bg-black/50 px-2 py-1 rounded-full font-semibold text-gray-900 dark:text-gray-200">
                        {getTasksByStatus(column.id).length}
                      </span>
                    </div>
                    <button
                      onClick={() => {
                        setNewTask({ ...newTask, status: column.id });
                        setShowCreateModal(true);
                      }}
                      className="p-2 hover:bg-white/50 dark:hover:bg-black/50 rounded-xl transition-colors"
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                  </div>
                </div>
                
                <div className="bg-gray-50 dark:bg-gray-800/50 rounded-b-2xl p-4 min-h-[600px] border border-gray-200 dark:border-gray-700">
                  <AnimatePresence>
                    {getTasksByStatus(column.id).map((task) => {
                      const isAssignedToMe = isTaskAssignedToMe(task);
                      const isActive = activeTimeTrackers[task.id];
                      
                      return (
                        <motion.div
                          key={task.id}
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, scale: 0.9 }}
                          className="mb-4"
                        >
                          <div
                            onClick={() => setShowTaskDetail(task)}
                            className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm border border-gray-200 dark:border-gray-700 hover:shadow-md hover:border-blue-300 dark:hover:border-blue-500 cursor-pointer transition-all group"
                          >
                            {/* Selection checkbox */}
                            <div className="absolute top-2 left-2">
                              <input
                                type="checkbox"
                                checked={selectedTasks.includes(task.id)}
                                onChange={(e) => {
                                  e.stopPropagation();
                                  toggleTaskSelection(task.id);
                                }}
                                className="rounded border-gray-300 bg-white dark:bg-gray-700"
                              />
                            </div>

                            {/* Active timer indicator */}
                            {isActive && (
                              <div className="absolute top-2 right-2 animate-pulse">
                                <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                              </div>
                            )}

                            {/* Task Tags */}
                            {task.tags && task.tags.length > 0 && (
                              <div className="flex flex-wrap gap-1 mb-3">
                                {task.tags.slice(0, 2).map(tagId => {
                                  const tag = tags.find(t => t.id === tagId);
                                  return tag ? (
                                    <span
                                      key={tag.id}
                                      className={`px-2 py-1 text-xs rounded-full ${tag.color} text-white`}
                                    >
                                      {tag.label}
                                    </span>
                                  ) : null;
                                })}
                                {task.tags.length > 2 && (
                                  <span className="px-2 py-1 text-xs rounded-full bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 dark:text-gray-300">
                                    +{task.tags.length - 2}
                                  </span>
                                )}
                              </div>
                            )}

                            {/* Task Title */}
                            <h4 className="font-semibold text-gray-900 dark:text-white mb-2 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                              {task.title}
                            </h4>

                            {/* Task Description */}
                            {task.description && (
                              <p className="text-sm text-gray-600 dark:text-gray-400 mb-4 line-clamp-2 dark:text-gray-300">
                                {task.description}
                              </p>
                            )}

                            {/* Time Progress Bar */}
                            {(task.timeEstimate || task.timeSpent) && (
                              <div className="mb-4">
                                <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400 mb-1 dark:text-gray-300 dark:text-gray-300">
                                  <span>Затрачено: {formatTime(task.timeSpent)}</span>
                                  {task.timeEstimate && (
                                    <span>План: {formatTime(task.timeEstimate)}</span>
                                  )}
                                </div>
                                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-1.5">
                                  <div 
                                    className="bg-gradient-to-r from-blue-500 to-purple-500 h-1.5 rounded-full transition-all duration-300"
                                    style={{ width: `${calculateProgress(task)}%` }}
                                  ></div>
                                </div>
                                <div className="text-xs text-gray-500 dark:text-gray-400 text-right mt-1 dark:text-gray-300 dark:text-gray-300">
                                  {calculateProgress(task)}%
                                </div>
                              </div>
                            )}

                            {/* Task Footer */}
                            <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-100 dark:border-gray-700">
                              <div className="flex items-center space-x-3">
                                {/* Priority */}
                                <div className={`flex items-center space-x-1 px-2 py-1 rounded-lg ${priorityColors[task.priority].bg} ${priorityColors[task.priority].text} ${priorityColors[task.priority].border} border`}>
                                  {priorityColors[task.priority].icon}
                                  <span className="text-xs font-medium capitalize">
                                    {task.priority === 'high' ? 'Высокий' : 
                                     task.priority === 'medium' ? 'Средний' : 'Низкий'}
                                  </span>
                                </div>
                                
                                {/* Due Date */}
                                {task.dueDate && (
                                  <div className={`flex items-center text-xs ${getDateColor(task.dueDate)}`}>
                                    <Calendar className="w-3 h-3 mr-1" />
                                    {formatDate(task.dueDate)}
                                  </div>
                                )}
                              </div>

                              {/* Assignee */}
                              <div className="flex -space-x-2">
                                {task.assignee && (
                                  <div 
                                    className="w-8 h-8 rounded-full bg-gradient-to-r from-blue-500 to-purple-500 flex items-center justify-center text-white text-xs font-medium border-2 border-white dark:border-gray-800 shadow"
                                    title={task.assignee.username}
                                  >
                                    {task.assignee.username.charAt(0).toUpperCase()}
                                  </div>
                                )}
                              </div>
                            </div>

                            {/* Action Buttons */}
                            <div className="flex items-center justify-between mt-3">
                              <div className="flex items-center space-x-2">
                                {/* Time Tracking */}
                                {isActive ? (
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleStopWork(task.id);
                                    }}
                                    className="flex items-center space-x-1 px-3 py-1.5 bg-red-100 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-lg hover:bg-red-200 dark:hover:bg-red-900/30 transition-colors text-xs"
                                  >
                                    <StopCircle className="w-3 h-3" />
                                    <span>{formatTime(activeTimeTrackers[task.id]?.elapsed)}</span>
                                  </button>
                                ) : isAssignedToMe && task.status !== 'completed' && (
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      if (task.status === 'new') {
                                        handleStartWork(task.id);
                                      } else {
                                        setTimeTrackingModal(task);
                                      }
                                    }}
                                    className="flex items-center space-x-1 px-3 py-1.5 bg-blue-100 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 rounded-lg hover:bg-blue-200 dark:hover:bg-blue-900/30 transition-colors text-xs"
                                  >
                                    <Timer className="w-3 h-3" />
                                    <span>Учет времени</span>
                                  </button>
                                )}

                                {/* Complete Button */}
                                {canCompleteTask(task) && (
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      if (task.status === 'review') {
                                        handleSubmitForReview(task.id);
                                      } else {
                                        setCompletingTask(task);
                                      }
                                    }}
                                    className="flex items-center space-x-1 px-3 py-1.5 bg-green-100 dark:bg-green-900/20 text-green-600 dark:text-green-400 rounded-lg hover:bg-green-200 dark:hover:bg-green-900/30 transition-colors text-xs"
                                  >
                                    <CheckCircle className="w-3 h-3" />
                                    <span>
                                      {task.status === 'review' ? 'На проверку' : 'Завершить'}
                                    </span>
                                  </button>
                                )}

                                {/* Review Actions */}
                                {canReviewTask(task) && (
                                  <div className="flex space-x-1">
                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handleAcceptTask(task.id);
                                      }}
                                      className="px-2 py-1 bg-green-100 dark:bg-green-900/20 text-green-600 dark:text-green-400 rounded hover:bg-green-200 dark:hover:bg-green-900/30 transition-colors text-xs"
                                    >
                                      Принять
                                    </button>
                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handleReturnTask(task.id);
                                      }}
                                      className="px-2 py-1 bg-yellow-100 dark:bg-yellow-900/20 text-yellow-600 dark:text-yellow-400 rounded hover:bg-yellow-200 dark:hover:bg-yellow-900/30 transition-colors text-xs"
                                    >
                                      Вернуть
                                    </button>
                                  </div>
                                )}
                              </div>

                              {/* More Options */}
                              <div className="relative">
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    // Handle dropdown
                                  }}
                                  className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 dark:text-gray-400 dark:text-gray-300"
                                >
                                  <MoreVertical className="w-4 h-4" />
                                </button>
                              </div>
                            </div>
                          </div>
                        </motion.div>
                      );
                    })}
                  </AnimatePresence>
                  
                  {getTasksByStatus(column.id).length === 0 && (
                    <div className="text-center py-12 text-gray-400 dark:text-gray-500 dark:text-gray-300 dark:text-gray-300">
                      <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center">
                        <Plus className="w-6 h-6" />
                      </div>
                      <p className="text-sm mb-2">Нет задач в этой колонке</p>
                      <button
                        onClick={() => {
                          setNewTask({ ...newTask, status: column.id });
                          setShowCreateModal(true);
                        }}
                        className="text-sm text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300"
                      >
                        Добавить задачу
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          /* List View */
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200 dark:border-gray-700">
                    <th className="text-left py-4 px-6 text-sm font-medium text-gray-600 dark:text-gray-400 dark:text-gray-300">
                      <div className="flex items-center">
                        <input 
                          type="checkbox" 
                          className="rounded border-gray-300"
                          checked={selectedTasks.length === tasks.length && tasks.length > 0}
                          onChange={selectAllTasks}
                        />
                      </div>
                    </th>
                    <th className="text-left py-4 px-6 text-sm font-medium text-gray-600 dark:text-gray-400 dark:text-gray-300">Задача</th>
                    <th className="text-left py-4 px-6 text-sm font-medium text-gray-600 dark:text-gray-400 dark:text-gray-300">Срок</th>
                    <th className="text-left py-4 px-6 text-sm font-medium text-gray-600 dark:text-gray-400 dark:text-gray-300">Приоритет</th>
                    <th className="text-left py-4 px-6 text-sm font-medium text-gray-600 dark:text-gray-400 dark:text-gray-300">Статус</th>
                    <th className="text-left py-4 px-6 text-sm font-medium text-gray-600 dark:text-gray-400 dark:text-gray-300">Время</th>
                    <th className="text-left py-4 px-6 text-sm font-medium text-gray-600 dark:text-gray-400 dark:text-gray-300">Исполнитель</th>
                    <th className="text-left py-4 px-6 text-sm font-medium text-gray-600 dark:text-gray-400 dark:text-gray-300">Действия</th>
                  </tr>
                </thead>
                <tbody>
                  {tasks.map((task) => {
                    const isAssignedToMe = isTaskAssignedToMe(task);
                    
                    return (
                      <tr key={task.id} className="border-b border-gray-100 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                        <td className="py-4 px-6">
                          <input
                            type="checkbox"
                            checked={selectedTasks.includes(task.id)}
                            onChange={() => toggleTaskSelection(task.id)}
                            className="rounded border-gray-300"
                          />
                        </td>
                        <td className="py-4 px-6">
                          <div>
                            <h4 className="font-medium text-gray-900 dark:text-white">{task.title}</h4>
                            {task.description && (
                              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1 line-clamp-1 dark:text-gray-300 dark:text-gray-300">
                                {task.description}
                              </p>
                            )}
                          </div>
                        </td>
                        <td className="py-4 px-6">
                          <div className={`flex items-center ${getDateColor(task.dueDate)}`}>
                            <Calendar className="w-4 h-4 mr-2" />
                            <span className="text-sm">{formatDate(task.dueDate)}</span>
                          </div>
                        </td>
                        <td className="py-4 px-6">
                          <div className={`flex items-center space-x-1 px-3 py-1 rounded-full text-xs font-medium inline-block ${priorityColors[task.priority].bg} ${priorityColors[task.priority].text}`}>
                            {priorityColors[task.priority].icon}
                            <span>
                              {task.priority === 'high' ? 'Высокий' : 
                               task.priority === 'medium' ? 'Средний' : 'Низкий'}
                            </span>
                          </div>
                        </td>
                        <td className="py-4 px-6">
                          <select
                            value={task.status}
                            onChange={(e) => handleUpdateTask(task.id, { status: e.target.value })}
                            className="text-sm bg-transparent border-0 focus:ring-0 outline-none"
                            disabled={!canEditTask(task)}
                          >
                            <option value="new">К выполнению</option>
                            <option value="in-progress">В работе</option>
                            <option value="review">На проверке</option>
                            <option value="completed">Выполнено</option>
                          </select>
                        </td>
                        <td className="py-4 px-6">
                          <div className="text-sm text-gray-600 dark:text-gray-400 dark:text-gray-300">
                            <div className="flex items-center space-x-2">
                              <Timer className="w-4 h-4" />
                              <span>{formatTime(task.timeSpent)}</span>
                              {task.timeEstimate && (
                                <span className="text-gray-400 dark:text-gray-300">/ {formatTime(task.timeEstimate)}</span>
                              )}
                            </div>
                            {task.timeEstimate && (
                              <div className="w-24 bg-gray-200 dark:bg-gray-700 rounded-full h-1.5 mt-1">
                                <div 
                                  className="bg-gradient-to-r from-blue-500 to-purple-500 h-1.5 rounded-full transition-all duration-300"
                                  style={{ width: `${calculateProgress(task)}%` }}
                                ></div>
                              </div>
                            )}
                          </div>
                        </td>
                        <td className="py-4 px-6">
                          {task.assignee ? (
                            <div className="flex items-center">
                              <div className="w-8 h-8 rounded-full bg-gradient-to-r from-blue-500 to-purple-500 flex items-center justify-center text-white text-xs font-medium mr-3">
                                {task.assignee.username.charAt(0).toUpperCase()}
                              </div>
                              <span className="text-sm">{task.assignee.username}</span>
                            </div>
                          ) : (
                            <span className="text-sm text-gray-400 dark:text-gray-300">Не назначен</span>
                          )}
                        </td>
                        <td className="py-4 px-6">
                          <div className="flex items-center space-x-2">
                            {isAssignedToMe && task.status !== 'completed' && (
                              <>
                                {task.status === 'new' && !activeTimeTrackers[task.id] && (
                                  <button
                                    onClick={() => handleStartWork(task.id)}
                                    className="p-1.5 text-gray-400 hover:text-green-600 dark:hover:text-green-400 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 dark:text-gray-300"
                                    title="Начать работу"
                                  >
                                    <PlayCircle className="w-4 h-4" />
                                  </button>
                                )}
                                {activeTimeTrackers[task.id] && (
                                  <button
                                    onClick={() => handleStopWork(task.id)}
                                    className="p-1.5 text-gray-400 hover:text-red-600 dark:hover:text-red-400 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 dark:text-gray-300"
                                    title="Остановить работу"
                                  >
                                    <StopCircle className="w-4 h-4" />
                                  </button>
                                )}
                                {task.status === 'review' ? (
                                  <button
                                    onClick={() => handleSubmitForReview(task.id)}
                                    className="p-1.5 text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 dark:text-gray-300"
                                    title="Отправить на проверку"
                                  >
                                    <CheckCircle className="w-4 h-4" />
                                  </button>
                                ) : (
                                  <button
                                    onClick={() => setCompletingTask(task)}
                                    className="p-1.5 text-gray-400 hover:text-green-600 dark:hover:text-green-400 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 dark:text-gray-300"
                                    title="Завершить задачу"
                                  >
                                    <CheckCircle className="w-4 h-4" />
                                  </button>
                                )}
                              </>
                            )}
                            <button
                              onClick={() => setShowTaskDetail(task)}
                              className="p-1.5 text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 dark:text-gray-300"
                            >
                              <Eye className="w-4 h-4" />
                            </button>
                            {canEditTask(task) && (
                              <button
                                onClick={() => setEditingTask(task)}
                                className="p-1.5 text-gray-400 hover:text-yellow-600 dark:hover:text-yellow-400 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 dark:text-gray-300"
                              >
                                <Edit2 className="w-4 h-4" />
                              </button>
                            )}
                            {(isAdmin || isAssignedToMe) && (
                              <button
                                onClick={() => setTimeTrackingModal(task)}
                                className="p-1.5 text-gray-400 hover:text-teal-600 dark:hover:text-teal-400 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 dark:text-gray-300"
                              >
                                <Timer className="w-4 h-4" />
                              </button>
                            )}
                            {isAdmin && (
                              <button
                                onClick={() => handleDeleteTask(task.id)}
                                className="p-1.5 text-gray-400 hover:text-red-600 dark:hover:text-red-400 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 dark:text-gray-300"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* Create Task Modal */}
      <AnimatePresence>
        {showCreateModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
            onClick={() => setShowCreateModal(false)}
          >
            <motion.div
              initial={{ scale: 0.95, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 20 }}
              className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="p-6">
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Создать задачу</h2>
                  <button
                    onClick={() => setShowCreateModal(false)}
                    className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-xl transition-colors"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <form onSubmit={handleCreateTask}>
                  <div className="space-y-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Название задачи *
                      </label>
                      <input
                        type="text"
                        required
                        className="w-full px-4 py-3 text-lg font-medium text-gray-900 dark:text-white bg-gray-50 dark:bg-gray-700 border-0 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none placeholder-gray-400 dark:placeholder-gray-500"
                        placeholder="Что нужно сделать?"
                        value={newTask.title}
                        onChange={(e) => setNewTask({...newTask, title: e.target.value})}
                        autoFocus
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Описание
                      </label>
                      <textarea
                        className="w-full px-4 py-3 text-gray-900 dark:text-white bg-gray-50 dark:bg-gray-700 border-0 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none resize-none min-h-[120px] placeholder-gray-400 dark:placeholder-gray-500"
                        placeholder="Опишите задачу подробнее..."
                        value={newTask.description}
                        onChange={(e) => setNewTask({...newTask, description: e.target.value})}
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-6">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          Исполнитель *
                        </label>
                        <select
                          required
                          className="w-full px-4 py-3 text-gray-900 dark:text-white bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition"
                          value={newTask.assignedTo}
                          onChange={(e) => setNewTask({...newTask, assignedTo: e.target.value})}
                        >
                          <option value="">Выберите исполнителя</option>
                          {users.map(user => (
                            <option key={user.id} value={user.id}>
                              {user.username}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          Срок выполнения
                        </label>
                        <input
                          type="date"
                          className="w-full px-4 py-3 text-gray-900 dark:text-white bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition"
                          value={newTask.dueDate}
                          onChange={(e) => setNewTask({...newTask, dueDate: e.target.value})}
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-6">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          Оценка времени (минуты)
                        </label>
                        <input
                          type="number"
                          min="0"
                          step="15"
                          className="w-full px-4 py-3 text-gray-900 dark:text-white bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
                          placeholder="Например: 120 (2 часа)"
                          value={newTask.timeEstimate}
                          onChange={(e) => setNewTask({...newTask, timeEstimate: e.target.value})}
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          Приоритет
                        </label>
                        <div className="grid grid-cols-3 gap-2">
                          {['low', 'medium', 'high'].map(priority => (
                            <button
                              key={priority}
                              type="button"
                              onClick={() => setNewTask({...newTask, priority})}
                              className={`py-3 rounded-xl transition-all ${newTask.priority === priority 
                                ? `${priorityColors[priority].bg} ${priorityColors[priority].text} ${priorityColors[priority].border} border-2` 
                                : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600'
                              }`}
                            >
                              <div className="flex flex-col items-center">
                                {priorityColors[priority].icon}
                                <span className="mt-1 text-xs font-medium capitalize text-gray-900 dark:text-white">
                                  {priority === 'high' ? 'Высокий' : 
                                   priority === 'medium' ? 'Средний' : 'Низкий'}
                                </span>
                              </div>
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Теги
                      </label>
                      <div className="flex flex-wrap gap-2">
                        {tags.map(tag => (
                          <button
                            key={tag.id}
                            type="button"
                            onClick={() => setNewTask({
                              ...newTask,
                              tags: newTask.tags.includes(tag.id)
                                ? newTask.tags.filter(t => t !== tag.id)
                                : [...newTask.tags, tag.id]
                            })}
                            className={`flex items-center space-x-1 px-3 py-1.5 text-xs rounded-full transition-all ${newTask.tags.includes(tag.id)
                              ? `${tag.color} text-white`
                              : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600'
                            }`}
                          >
                            <div className={`w-2 h-2 rounded-full ${newTask.tags.includes(tag.id) ? 'bg-white' : tag.color}`}></div>
                            <span className="text-gray-900 dark:text-white">{tag.label}</span>
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="flex justify-end space-x-3 mt-8 pt-6 border-t border-gray-200 dark:border-gray-700">
                    <button
                      type="button"
                      onClick={() => setShowCreateModal(false)}
                      className="px-6 py-3 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 transition-colors dark:text-gray-200 dark:text-gray-300"
                    >
                      Отмена
                    </button>
                    <button
                      type="submit"
                      className="px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl font-semibold hover:opacity-90 transition-opacity"
                    >
                      Создать задачу
                    </button>
                  </div>
                </form>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Task Completion Modal */}
      <AnimatePresence>
        {completingTask && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
            onClick={() => setCompletingTask(null)}
          >
            <motion.div
              initial={{ scale: 0.95, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 20 }}
              className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-md w-full"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="p-6">
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Завершить задачу</h2>
                  <button
                    onClick={() => setCompletingTask(null)}
                    className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-xl transition-colors"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <div className="mb-6">
                  <p className="text-gray-700 dark:text-gray-300 mb-2">
                    Вы завершаете задачу: <strong>{completingTask.title}</strong>
                  </p>
                  {completingTask.status === 'review' && (
                    <div className="mb-4 p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-xl">
                      <div className="flex items-center space-x-2 text-yellow-700 dark:text-yellow-400">
                        <AlertCircle className="w-5 h-5" />
                        <span className="text-sm font-medium">Эта задача отправлена на проверку</span>
                      </div>
                    </div>
                  )}
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Затраченное время (минуты)
                    </label>
                    <input
                      type="number"
                      min="0"
                      step="15"
                      value={completionData.timeSpent}
                      onChange={(e) => setCompletionData({
                        ...completionData,
                        timeSpent: parseInt(e.target.value) || 0
                      })}
                      className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
                      placeholder="Например: 120 (2 часа)"
                    />
                    <div className="mt-2 text-sm text-gray-500 dark:text-gray-400 dark:text-gray-300 dark:text-gray-300">
                      {completionData.timeSpent > 0 && (
                        <span>
                          Это {Math.floor(completionData.timeSpent / 60)} ч {completionData.timeSpent % 60} мин
                        </span>
                      )}
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Примечания
                    </label>
                    <textarea
                      value={completionData.notes}
                      onChange={(e) => setCompletionData({
                        ...completionData,
                        notes: e.target.value
                      })}
                      className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none resize-none min-h-[80px]"
                      placeholder="Добавьте комментарии по выполнению..."
                    />
                  </div>

                  <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-xl">
                    <div className="flex items-start space-x-3">
                      <BellRing className="w-5 h-5 text-blue-600 dark:text-blue-400 mt-0.5" />
                      <div>
                        <p className="text-sm text-blue-700 dark:text-blue-300">
                          После завершения задачи:
                        </p>
                        <ul className="text-sm text-blue-600 dark:text-blue-400 mt-1 space-y-1">
                          <li>• Задача переместится в колонку "Выполнено"</li>
                          <li>• Вы получите уведомление в Telegram</li>
                          <li>• Администратор будет уведомлен о завершении</li>
                          {completingTask.status === 'review' && (
                            <li>• Задача будет отправлена на проверку администратору</li>
                          )}
                        </ul>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex justify-end space-x-3 mt-8 pt-6 border-t border-gray-200 dark:border-gray-700">
                  <button
                    type="button"
                    onClick={() => setCompletingTask(null)}
                    className="px-6 py-3 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 transition-colors dark:text-gray-200 dark:text-gray-300"
                  >
                    Отмена
                  </button>
                  <button
                    onClick={() => handleCompleteTask(completingTask.id, completionData)}
                    className="px-6 py-3 bg-gradient-to-r from-green-600 to-teal-600 text-white rounded-xl font-semibold hover:opacity-90 transition-opacity"
                  >
                    {completingTask.status === 'review' ? 'Отправить на проверку' : 'Завершить задачу'}
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Time Tracking Modal */}
      <AnimatePresence>
        {timeTrackingModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
            onClick={() => setTimeTrackingModal(null)}
          >
            <motion.div
              initial={{ scale: 0.95, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 20 }}
              className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-md w-full"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="p-6">
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Учет времени</h2>
                  <button
                    onClick={() => setTimeTrackingModal(null)}
                    className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-xl transition-colors"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <div className="mb-6">
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                    {timeTrackingModal.title}
                  </h3>
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="p-3 bg-gray-50 dark:bg-gray-700/50 rounded-xl">
                        <p className="text-sm text-gray-600 dark:text-gray-400 dark:text-gray-300">Запланировано</p>
                        <p className="text-lg font-semibold text-gray-900 dark:text-white">
                          {timeTrackingModal.timeEstimate 
                            ? formatTime(timeTrackingModal.timeEstimate)
                            : 'Не указано'
                          }
                        </p>
                      </div>
                      <div className="p-3 bg-gray-50 dark:bg-gray-700/50 rounded-xl">
                        <p className="text-sm text-gray-600 dark:text-gray-400 dark:text-gray-300">Затрачено</p>
                        <p className="text-lg font-semibold text-gray-900 dark:text-white">
                          {formatTime(timeTrackingModal.timeSpent)}
                        </p>
                      </div>
                    </div>

                    {timeTrackingModal.timeEstimate && (
                      <div className="relative pt-1">
                        <div className="flex mb-2 items-center justify-between">
                          <div>
                            <span className="text-xs font-semibold inline-block text-blue-600 dark:text-blue-400">
                              Прогресс
                            </span>
                          </div>
                          <div className="text-right">
                            <span className="text-xs font-semibold inline-block text-blue-600 dark:text-blue-400">
                              {calculateProgress(timeTrackingModal)}%
                            </span>
                          </div>
                        </div>
                        <div className="overflow-hidden h-2 text-xs flex rounded-full bg-gray-200 dark:bg-gray-700">
                          <div
                            style={{ 
                              width: `${calculateProgress(timeTrackingModal)}%` 
                            }}
                            className="shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center bg-gradient-to-r from-blue-500 to-purple-500"
                          ></div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Добавить затраченное время (минуты)
                    </label>
                    <input
                      type="number"
                      min="0"
                      step="15"
                      value={timeTrackingData.minutes}
                      onChange={(e) => setTimeTrackingData({
                        ...timeTrackingData,
                        minutes: parseInt(e.target.value) || 0
                      })}
                      className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
                      placeholder="Например: 30"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Описание работы
                    </label>
                    <textarea
                      value={timeTrackingData.description}
                      onChange={(e) => setTimeTrackingData({
                        ...timeTrackingData,
                        description: e.target.value
                      })}
                      className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none resize-none min-h-[60px]"
                      placeholder="Что было сделано за это время?"
                    />
                  </div>

                  <div className="flex space-x-4">
                    <button
                      onClick={() => setTimeTrackingData({
                        ...timeTrackingData,
                        minutes: 15
                      })}
                      className="flex-1 py-2 text-sm bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600"
                    >
                      15 мин
                    </button>
                    <button
                      onClick={() => setTimeTrackingData({
                        ...timeTrackingData,
                        minutes: 30
                      })}
                      className="flex-1 py-2 text-sm bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600"
                    >
                      30 мин
                    </button>
                    <button
                      onClick={() => setTimeTrackingData({
                        ...timeTrackingData,
                        minutes: 60
                      })}
                      className="flex-1 py-2 text-sm bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600"
                    >
                      1 час
                    </button>
                  </div>
                </div>

                <div className="flex justify-end space-x-3 mt-8 pt-6 border-t border-gray-200 dark:border-gray-700">
                  <button
                    type="button"
                    onClick={() => setTimeTrackingModal(null)}
                    className="px-6 py-3 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 transition-colors dark:text-gray-200 dark:text-gray-300"
                  >
                    Отмена
                  </button>
                  <button
                    onClick={() => handleAddTime(
                      timeTrackingModal.id, 
                      timeTrackingData.minutes, 
                      timeTrackingData.description
                    )}
                    disabled={timeTrackingData.minutes === 0}
                    className="px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl font-semibold hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Добавить время
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Task Detail Modal */}
      <AnimatePresence>
        {showTaskDetail && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
            onClick={() => setShowTaskDetail(null)}
          >
            <motion.div
              initial={{ scale: 0.95, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 20 }}
              className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="p-6">
                <div className="flex justify-between items-start mb-8">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-3">
                      <div className={`px-3 py-1 rounded-full text-xs font-medium ${priorityColors[showTaskDetail.priority].bg} ${priorityColors[showTaskDetail.priority].text}`}>
                        {priorityColors[showTaskDetail.priority].icon}
                        <span className="ml-1">
                          {showTaskDetail.priority === 'high' ? 'Высокий приоритет' : 
                           showTaskDetail.priority === 'medium' ? 'Средний приоритет' : 'Низкий приоритет'}
                        </span>
                      </div>
                      <div className="text-sm text-gray-600 dark:text-gray-400 dark:text-gray-300">
                        Статус: <span className="font-medium capitalize">
                          {showTaskDetail.status === 'completed' ? 'Выполнено' : 
                           showTaskDetail.status === 'in-progress' ? 'В работе' : 
                           showTaskDetail.status === 'review' ? 'На проверке' : 'К выполнению'}
                        </span>
                      </div>
                      {showTaskDetail.timeSpent > 0 && (
                        <div className="text-sm text-gray-600 dark:text-gray-400 flex items-center dark:text-gray-300">
                          <Timer className="w-4 h-4 mr-1" />
                          {formatTime(showTaskDetail.timeSpent)}
                        </div>
                      )}
                    </div>
                    <h2 className="text-3xl font-bold text-gray-900 dark:text-white">
                      {showTaskDetail.title}
                    </h2>
                  </div>
                  <button
                    onClick={() => setShowTaskDetail(null)}
                    className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-xl transition-colors ml-4"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <div className="grid grid-cols-3 gap-8">
                  {/* Main Content */}
                  <div className="col-span-2 space-y-8">
                    {/* Description */}
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3 flex items-center">
                        <span className="w-1 h-6 bg-blue-500 rounded-full mr-2"></span>
                        Описание
                      </h3>
                      {showTaskDetail.description ? (
                        <p className="text-gray-700 dark:text-gray-300 whitespace-pre-wrap bg-gray-50 dark:bg-gray-700/50 p-4 rounded-xl">
                          {showTaskDetail.description}
                        </p>
                      ) : (
                        <p className="text-gray-400 dark:text-gray-500 italic p-4 bg-gray-50 dark:bg-gray-700/50 rounded-xl dark:text-gray-300 dark:text-gray-300">
                          Описание отсутствует
                        </p>
                      )}
                    </div>

                    {/* Time Tracking */}
                    {(showTaskDetail.timeEstimate || showTaskDetail.timeSpent > 0) && (
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
                          <span className="w-1 h-6 bg-teal-500 rounded-full mr-2"></span>
                          Учет времени
                        </h3>
                        <div className="bg-gradient-to-r from-teal-50 to-blue-50 dark:from-teal-900/20 dark:to-blue-900/20 rounded-xl p-6">
                          <div className="grid grid-cols-3 gap-4 mb-6">
                            <div className="text-center">
                              <p className="text-sm text-gray-600 dark:text-gray-400 dark:text-gray-300">Запланировано</p>
                              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                                {formatTime(showTaskDetail.timeEstimate)}
                              </p>
                            </div>
                            <div className="text-center">
                              <p className="text-sm text-gray-600 dark:text-gray-400 dark:text-gray-300">Затрачено</p>
                              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                                {formatTime(showTaskDetail.timeSpent)}
                              </p>
                            </div>
                            <div className="text-center">
                              <p className="text-sm text-gray-600 dark:text-gray-400 dark:text-gray-300">Прогресс</p>
                              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                                {calculateProgress(showTaskDetail)}%
                              </p>
                            </div>
                          </div>
                          
                          <div className="relative pt-1">
                            <div className="overflow-hidden h-3 text-xs flex rounded-full bg-gray-200 dark:bg-gray-700">
                              <div
                                style={{ width: `${calculateProgress(showTaskDetail)}%` }}
                                className="shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center bg-gradient-to-r from-teal-500 to-blue-500"
                              ></div>
                            </div>
                          </div>
                          
                          <div className="mt-4 flex justify-center">
                            <button
                              onClick={() => {
                                setTimeTrackingModal(showTaskDetail);
                                setShowTaskDetail(null);
                              }}
                              className="flex items-center space-x-2 px-4 py-2 bg-teal-500 text-white rounded-lg hover:bg-teal-600 transition-colors"
                            >
                              <Timer className="w-4 h-4" />
                              <span>Добавить время</span>
                            </button>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Action Buttons */}
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
                        <span className="w-1 h-6 bg-green-500 rounded-full mr-2"></span>
                        Действия
                      </h3>
                      <div className="grid grid-cols-2 gap-4">
                        {canCompleteTask(showTaskDetail) && (
                          <button
                            onClick={() => {
                              setCompletingTask(showTaskDetail);
                              setShowTaskDetail(null);
                            }}
                            className="flex items-center justify-center space-x-2 px-4 py-3 bg-gradient-to-r from-green-500 to-teal-500 text-white rounded-xl hover:opacity-90 transition-opacity"
                          >
                            <CheckCircle className="w-5 h-5" />
                            <span className="font-medium">
                              {showTaskDetail.status === 'review' ? 'Отправить на проверку' : 'Завершить задачу'}
                            </span>
                          </button>
                        )}
                        
                        {canStartWork(showTaskDetail) && !activeTimeTrackers[showTaskDetail.id] && (
                          <button
                            onClick={() => {
                              handleStartWork(showTaskDetail.id);
                              setShowTaskDetail(null);
                            }}
                            className="flex items-center justify-center space-x-2 px-4 py-3 bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-xl hover:opacity-90 transition-opacity"
                          >
                            <PlayCircle className="w-5 h-5" />
                            <span className="font-medium">Начать работу</span>
                          </button>
                        )}
                        
                        {activeTimeTrackers[showTaskDetail.id] && (
                          <button
                            onClick={() => {
                              handleStopWork(showTaskDetail.id);
                              setShowTaskDetail(null);
                            }}
                            className="flex items-center justify-center space-x-2 px-4 py-3 bg-gradient-to-r from-red-500 to-orange-500 text-white rounded-xl hover:opacity-90 transition-opacity"
                          >
                            <StopCircle className="w-5 h-5" />
                            <span className="font-medium">Остановить работу</span>
                          </button>
                        )}
                        
                        {canReviewTask(showTaskDetail) && (
                          <>
                            <button
                              onClick={() => {
                                handleAcceptTask(showTaskDetail.id);
                                setShowTaskDetail(null);
                              }}
                              className="flex items-center justify-center space-x-2 px-4 py-3 bg-gradient-to-r from-green-500 to-emerald-500 text-white rounded-xl hover:opacity-90 transition-opacity"
                            >
                              <Check className="w-5 h-5" />
                              <span className="font-medium">Принять</span>
                            </button>
                            <button
                              onClick={() => {
                                handleReturnTask(showTaskDetail.id);
                                setShowTaskDetail(null);
                              }}
                              className="flex items-center justify-center space-x-2 px-4 py-3 bg-gradient-to-r from-yellow-500 to-amber-500 text-white rounded-xl hover:opacity-90 transition-opacity"
                            >
                              <RotateCcw className="w-5 h-5" />
                              <span className="font-medium">Вернуть</span>
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Sidebar */}
                  <div className="space-y-6">
                    {/* Due Date */}
                    {showTaskDetail.dueDate && (
                      <div className="p-4 bg-gradient-to-r from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 rounded-xl">
                        <div className="flex items-center justify-between mb-3">
                          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Срок выполнения</span>
                          <CalendarDays className="w-4 h-4 text-blue-500" />
                        </div>
                        <div className={`text-lg font-bold ${getDateColor(showTaskDetail.dueDate)}`}>
                          {new Date(showTaskDetail.dueDate).toLocaleDateString('ru-RU', {
                            weekday: 'long',
                            month: 'long',
                            day: 'numeric'
                          })}
                        </div>
                        <div className="text-sm text-gray-600 dark:text-gray-400 mt-2 dark:text-gray-300">
                          {formatDate(showTaskDetail.dueDate)}
                        </div>
                      </div>
                    )}

                    {/* Assignee */}
                    <div className="p-4 bg-gray-50 dark:bg-gray-700/50 rounded-xl">
                      <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">Исполнитель</h4>
                      {showTaskDetail.assignee ? (
                        <div className="flex items-center space-x-3">
                          <div className="w-12 h-12 rounded-full bg-gradient-to-r from-blue-500 to-purple-500 flex items-center justify-center text-white text-lg font-medium">
                            {showTaskDetail.assignee.username.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <div className="font-medium text-gray-900 dark:text-white">
                              {showTaskDetail.assignee.username}
                            </div>
                            <div className="text-sm text-gray-600 dark:text-gray-400 dark:text-gray-300">
                              {showTaskDetail.assignee.email}
                            </div>
                          </div>
                        </div>
                      ) : (
                        <div className="text-center py-4">
                          <User className="w-8 h-8 text-gray-400 mx-auto mb-2 dark:text-gray-300" />
                          <p className="text-gray-500 dark:text-gray-400 dark:text-gray-300 dark:text-gray-300">Не назначен</p>
                        </div>
                      )}
                    </div>

                    {/* Tags */}
                    {showTaskDetail.tags && showTaskDetail.tags.length > 0 && (
                      <div className="p-4 bg-gray-50 dark:bg-gray-700/50 rounded-xl">
                        <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">Теги</h4>
                        <div className="flex flex-wrap gap-2">
                          {showTaskDetail.tags.map(tagId => {
                            const tag = tags.find(t => t.id === tagId);
                            return tag ? (
                              <span
                                key={tag.id}
                                className={`px-3 py-1 text-xs rounded-full ${tag.color} text-white`}
                              >
                                {tag.label}
                              </span>
                            ) : null;
                          })}
                        </div>
                      </div>
                    )}

                    {/* Quick Actions */}
                    <div className="p-4 bg-gray-50 dark:bg-gray-700/50 rounded-xl">
                      <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">Быстрые действия</h4>
                      <div className="space-y-2">
                        {canEditTask(showTaskDetail) && (
                          <button
                            onClick={() => {
                              setEditingTask(showTaskDetail);
                              setShowTaskDetail(null);
                            }}
                            className="w-full flex items-center space-x-2 px-3 py-2 text-sm bg-white dark:bg-gray-700 hover:bg-gray-100 dark:hover:bg-gray-600 rounded-lg transition-colors"
                          >
                            <Edit2 className="w-4 h-4" />
                            <span>Редактировать</span>
                          </button>
                        )}
                        
                        <button
                          onClick={() => {
                            setTimeTrackingModal(showTaskDetail);
                            setShowTaskDetail(null);
                          }}
                          className="w-full flex items-center space-x-2 px-3 py-2 text-sm bg-white dark:bg-gray-700 hover:bg-gray-100 dark:hover:bg-gray-600 rounded-lg transition-colors"
                        >
                          <Timer className="w-4 h-4" />
                          <span>Учет времени</span>
                        </button>
                        
                        {isAdmin && (
                          <button
                            onClick={() => {
                              if (window.confirm('Вы уверены, что хотите удалить эту задачу?')) {
                                handleDeleteTask(showTaskDetail.id);
                                setShowTaskDetail(null);
                              }
                            }}
                            className="w-full flex items-center space-x-2 px-3 py-2 text-sm bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/30 rounded-lg transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                            <span>Удалить</span>
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Created Date */}
                    <div className="text-xs text-gray-500 dark:text-gray-400 text-center pt-4 border-t border-gray-200 dark:border-gray-700 dark:text-gray-300 dark:text-gray-300">
                      Создано {new Date(showTaskDetail.createdAt).toLocaleDateString('ru-RU')}
                      {showTaskDetail.completedAt && (
                        <div className="mt-1">
                          Завершено {new Date(showTaskDetail.completedAt).toLocaleDateString('ru-RU')}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Tasks;