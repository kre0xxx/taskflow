import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import axios from 'axios';
import { ArrowLeft, Clock, User, CheckCircle, AlertCircle, Calendar } from 'lucide-react';

const API_URL = import.meta.env.VITE_API_URL || '/api';

const TaskDetail = () => {
  const { id } = useParams();
  const [task, setTask] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchTask = async () => {
      try {
        const response = await axios.get(`${API_URL}/tasks/${id}`);
        setTask(response.data);
      } catch (fetchError) {
        console.error('Ошибка загрузки задачи:', fetchError);
        setError('Не удалось загрузить задачу');
      } finally {
        setLoading(false);
      }
    };

    fetchTask();
  }, [id]);

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8 text-center text-gray-600 dark:text-gray-400 dark:text-gray-300">Загрузка задачи...</div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8 text-red-600 dark:text-red-400">{error}</div>
    );
  }

  if (!task) {
    return (
      <div className="container mx-auto px-4 py-8 text-center text-gray-600 dark:text-gray-400 dark:text-gray-300">Задача не найдена.</div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
        <Link to="/tasks" className="inline-flex items-center gap-2 text-blue-600 dark:text-blue-400 hover:text-blue-800">
          <ArrowLeft className="w-4 h-4" /> Вернуться к задачам
        </Link>
        <h1 className="mt-4 text-3xl font-bold text-gray-900 dark:text-white">{task.title}</h1>
        <p className="mt-2 text-gray-600 dark:text-gray-400 dark:text-gray-300">{task.description || 'Описание отсутствует'}</p>
      </motion.div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-3xl bg-white dark:bg-gray-900 shadow-lg border border-gray-100 dark:border-gray-700 p-8">
          <div className="space-y-5">
            <div className="flex items-center gap-3 text-gray-600 dark:text-gray-400 dark:text-gray-300">
              <Clock className="w-5 h-5" />
              <span>Статус: <strong className="capitalize text-gray-900 dark:text-white">{task.status}</strong></span>
            </div>
            <div className="flex items-center gap-3 text-gray-600 dark:text-gray-400 dark:text-gray-300">
              <Calendar className="w-5 h-5" />
              <span>Дедлайн: {task.dueDate ? new Date(task.dueDate).toLocaleDateString('ru-RU') : 'Не задан'}</span>
            </div>
            <div className="flex items-center gap-3 text-gray-600 dark:text-gray-400 dark:text-gray-300">
              <User className="w-5 h-5" />
              <span>Исполнитель: {task.assignee?.username || 'Не назначен'}</span>
            </div>
            <div className="flex items-center gap-3 text-gray-600 dark:text-gray-400 dark:text-gray-300">
              <CheckCircle className="w-5 h-5" />
              <span>Приоритет: <strong className="capitalize">{task.priority}</strong></span>
            </div>
            <div className="flex items-center gap-3 text-gray-600 dark:text-gray-400 dark:text-gray-300">
              <AlertCircle className="w-5 h-5" />
              <span>Время затрачено: {task.timeSpent ?? 0} мин</span>
            </div>
          </div>
        </div>

        <div className="rounded-3xl bg-white dark:bg-gray-900 shadow-lg border border-gray-100 dark:border-gray-700 p-8">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">Дополнительные детали</h2>
          <div className="space-y-4 text-gray-600 dark:text-gray-400 dark:text-gray-300">
            <div>
              <p className="text-sm uppercase tracking-wide text-gray-500 dark:text-gray-400 dark:text-gray-300 dark:text-gray-300">Дата создания</p>
              <p className="mt-2">{task.createdAt ? new Date(task.createdAt).toLocaleString('ru-RU') : '—'}</p>
            </div>
            <div>
              <p className="text-sm uppercase tracking-wide text-gray-500 dark:text-gray-400 dark:text-gray-300 dark:text-gray-300">Изменено</p>
              <p className="mt-2">{task.updatedAt ? new Date(task.updatedAt).toLocaleString('ru-RU') : '—'}</p>
            </div>
            <div>
              <p className="text-sm uppercase tracking-wide text-gray-500 dark:text-gray-400 dark:text-gray-300 dark:text-gray-300">Теги</p>
              <div className="mt-2 flex flex-wrap gap-2">
                {(task.tags || []).length > 0 ? (
                  task.tags.map((tag) => (
                    <span key={tag} className="rounded-full bg-gray-100 dark:bg-gray-800 px-3 py-1 text-sm text-gray-700 dark:text-gray-300">{tag}</span>
                  ))
                ) : (
                  <span className="text-gray-500 dark:text-gray-400 dark:text-gray-300 dark:text-gray-300">Теги не заданы</span>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TaskDetail;
