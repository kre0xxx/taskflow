import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { Users, Mail, Shield, Link as LinkIcon } from 'lucide-react';

const API_URL = import.meta.env.VITE_API_URL || '/api';

const UsersPage = () => {
  const { isAdmin } = useAuth();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!isAdmin) return;
    const fetchUsers = async () => {
      try {
        const response = await axios.get(`${API_URL}/users`);
        setUsers(response.data || []);
      } catch (fetchError) {
        console.error('Ошибка загрузки пользователей:', fetchError);
        setError('Не удалось загрузить список пользователей');
      } finally {
        setLoading(false);
      }
    };

    fetchUsers();
  }, [isAdmin]);

  if (!isAdmin) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="bg-white dark:bg-gray-800 rounded-3xl p-8 shadow-lg border border-gray-200 dark:border-gray-700">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Доступ запрещен</h1>
          <p className="mt-3 text-gray-600 dark:text-gray-400 dark:text-gray-300">Только администратор может просматривать этот раздел.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Пользователи</h1>
        <p className="mt-2 text-gray-600 dark:text-gray-400 dark:text-gray-300">Список всех пользователей системы.</p>
      </motion.div>

      <div className="bg-white dark:bg-gray-900 rounded-3xl shadow-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-gray-600 dark:text-gray-400 dark:text-gray-300">
            Загрузка...
          </div>
        ) : error ? (
          <div className="p-8 text-center text-red-600 dark:text-red-400">{error}</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-left">
              <thead className="bg-gray-50 dark:bg-gray-800 text-gray-700 dark:text-gray-300">
                <tr>
                  <th className="px-6 py-4">Пользователь</th>
                  <th className="px-6 py-4">Email</th>
                  <th className="px-6 py-4">Роль</th>
                  <th className="px-6 py-4">Telegram</th>
                </tr>
              </thead>
              <tbody>
                {users.map(user => (
                  <tr key={user.id} className="border-t border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800/80">
                    <td className="px-6 py-4">
                      <div className="text-gray-900 dark:text-white font-medium">{user.username}</div>
                    </td>
                    <td className="px-6 py-4 text-gray-600 dark:text-gray-400 dark:text-gray-300">{user.email}</td>
                    <td className="px-6 py-4 capitalize text-gray-900 dark:text-white">{user.role}</td>
                    <td className="px-6 py-4 flex items-center gap-2">
                      <LinkIcon className="w-4 h-4 text-teal-500" />
                      <span className="text-gray-900 dark:text-white">{user.telegramChatId ? user.telegramChatId : 'Не подключен'}</span>
                    </td>
                  </tr>
                ))}
                {users.length === 0 && (
                  <tr>
                    <td colSpan="4" className="px-6 py-8 text-center text-gray-500 dark:text-gray-400 dark:text-gray-300 dark:text-gray-300">
                      Пользователи не найдены.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default UsersPage;
