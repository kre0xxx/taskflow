import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { motion } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { Link } from 'react-router-dom';
import { Bot, User, Mail, Shield, CheckCircle } from 'lucide-react';

const API_URL = import.meta.env.VITE_API_URL || '/api';

const ProfilePage = () => {
  const { updateUser } = useAuth();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [formState, setFormState] = useState({ username: '', email: '', password: '' });

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const response = await axios.get(`${API_URL}/users/me`);
        setProfile(response.data);
        setFormState({ username: response.data.username, email: response.data.email, password: '' });
      } catch (error) {
        console.error('Ошибка загрузки профиля:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, []);

  const handleChange = (event) => {
    setFormState({ ...formState, [event.target.name]: event.target.value });
    setMessage('');
  };

  const handleSave = async (event) => {
    event.preventDefault();
    setSaving(true);
    setMessage('');

    try {
      const response = await axios.patch(`${API_URL}/users/${profile.id}`, {
        username: formState.username,
        email: formState.email,
        password: formState.password || undefined
      });
      setProfile(response.data);
      setMessage('Профиль успешно обновлён');
      setFormState({ ...formState, password: '' });
      if (updateUser) {
        updateUser(response.data);
      }
    } catch (error) {
      console.error('Ошибка сохранения профиля:', error);
      setMessage(error.response?.data?.message || 'Не удалось сохранить изменения');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="rounded-3xl bg-white dark:bg-gray-900 p-8 shadow-lg border border-gray-100 dark:border-gray-700 text-center">
          Загрузка профиля...
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="container mx-auto px-4 py-8 text-center text-red-600 dark:text-red-400">Не удалось загрузить профиль.</div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Мой профиль</h1>
        <p className="mt-2 text-gray-600 dark:text-gray-400">Управляйте своими данными, просматривайте задачи и Telegram-настройки.</p>
      </motion.div>

      <div className="grid gap-8 lg:grid-cols-3">
        <div className="lg:col-span-2 bg-white dark:bg-gray-900 rounded-3xl p-8 shadow-lg border border-gray-100 dark:border-gray-700">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">Информация</h2>
          <form onSubmit={handleSave} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Имя пользователя</label>
              <input
                name="username"
                value={formState.username}
                onChange={handleChange}
                className="mt-2 w-full rounded-2xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 px-4 py-3 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Email</label>
              <input
                name="email"
                value={formState.email}
                onChange={handleChange}
                className="mt-2 w-full rounded-2xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 px-4 py-3 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Новый пароль</label>
              <input
                name="password"
                type="password"
                value={formState.password}
                onChange={handleChange}
                placeholder="Оставьте пустым, если не хотите менять"
                className="mt-2 w-full rounded-2xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 px-4 py-3 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            {message && <p className="text-sm text-green-600 dark:text-green-400">{message}</p>}
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
              <button
                type="submit"
                disabled={saving}
                className="inline-flex items-center justify-center rounded-2xl bg-blue-600 px-6 py-3 text-white hover:bg-blue-700 transition-colors disabled:opacity-60"
              >
                {saving ? 'Сохранение...' : 'Сохранить'}
              </button>
              <Link
                to="/telegram"
                className="inline-flex items-center justify-center rounded-2xl border border-gray-200 dark:border-gray-700 px-6 py-3 text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
              >
                <Bot className="w-4 h-4 mr-2" /> Telegram настройки
              </Link>
            </div>
          </form>
        </div>

        <div className="bg-white dark:bg-gray-900 rounded-3xl p-8 shadow-lg border border-gray-100 dark:border-gray-700">
          <div className="flex items-center gap-4 mb-6">
            <div className="rounded-2xl bg-blue-500 p-3 text-white">
              <User className="w-5 h-5" />
            </div>
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">Текущий пользователь</p>
              <p className="text-lg font-semibold text-gray-900 dark:text-white">{profile.username}</p>
            </div>
          </div>
          <div className="space-y-4 text-gray-600 dark:text-gray-400">
            <div className="flex items-center justify-between">
              <span>Email</span>
              <span>{profile.email}</span>
            </div>
            <div className="flex items-center justify-between">
              <span>Роль</span>
              <span className="capitalize">{profile.role}</span>
            </div>
            <div className="flex items-center justify-between">
              <span>Текущие задачи</span>
              <span>{profile.assignedTasks?.length ?? 0}</span>
            </div>
            <div className="flex items-center justify-between">
              <span>Выполнено задач</span>
              <span>{profile.completedTasks?.length ?? 0}</span>
            </div>
            <div className="flex items-center justify-between">
              <span>Telegram</span>
              <span className="inline-flex items-center gap-2">
                {profile.telegramChatId ? <CheckCircle className="w-4 h-4 text-emerald-500" /> : <Shield className="w-4 h-4 text-gray-500" />}
                {profile.telegramChatId ? 'Подключен' : 'Не подключен'}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;
