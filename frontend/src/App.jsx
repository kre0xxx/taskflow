import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import Login from './components/Login';
import Dashboard from './components/Dashboard';
import Tasks from './components/Tasks';
import TelegramSettings from './components/TelegramSettings';
import UsersPage from './components/UsersPage';
import StatsPage from './components/StatsPage';
import ProfilePage from './components/ProfilePage';
import NotificationsPage from './components/NotificationsPage';
import SettingsPage from './components/SettingsPage';
import TaskDetail from './components/TaskDetail';
import Navbar from './components/Navbar';
import { useAuth } from './context/AuthContext';

const PrivateRoute = ({ children }) => {
  const { user, loading } = useAuth();
  
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Загрузка...</p>
        </div>
      </div>
    );
  }
  
  return user ? children : <Navigate to="/login" />;
};

const App = () => {
  return (
    <Router>
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-950 transition-colors duration-300">
        <Navbar />
        <AnimatePresence mode="wait">
          <Routes>
            <Route path="/login" element={
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}>
                <Login />
              </motion.div>
            } />
            
            <Route path="/" element={
              <PrivateRoute>
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.1 }}>
                  <Dashboard />
                </motion.div>
              </PrivateRoute>
            } />
            
            <Route path="/tasks" element={
              <PrivateRoute>
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.1 }}>
                  <Tasks />
                </motion.div>
              </PrivateRoute>
            } />
            
            <Route path="/telegram" element={
              <PrivateRoute>
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.1 }}>
                  <TelegramSettings />
                </motion.div>
              </PrivateRoute>
            } />

            <Route path="/users" element={
              <PrivateRoute>
                <UsersPage />
              </PrivateRoute>
            } />

            <Route path="/stats" element={
              <PrivateRoute>
                <StatsPage />
              </PrivateRoute>
            } />

            <Route path="/profile" element={
              <PrivateRoute>
                <ProfilePage />
              </PrivateRoute>
            } />

            <Route path="/notifications" element={
              <PrivateRoute>
                <NotificationsPage />
              </PrivateRoute>
            } />

            <Route path="/settings" element={
              <PrivateRoute>
                <SettingsPage />
              </PrivateRoute>
            } />

            <Route path="/tasks/:id" element={
              <PrivateRoute>
                <TaskDetail />
              </PrivateRoute>
            } />
          </Routes>
        </AnimatePresence>

        <footer className="mt-16 py-6 border-t border-gray-200 dark:border-gray-800">
          <div className="container mx-auto px-4">
            <div className="flex flex-col md:flex-row items-center justify-between">
              <div className="mb-4 md:mb-0">
                <div className="flex items-center space-x-2">
                  <div className="w-8 h-8 rounded-lg bg-gradient-to-r from-blue-500 to-purple-500 flex items-center justify-center">
                    <span className="text-white font-bold">T</span>
                  </div>
                  <span className="text-lg font-bold text-gray-900 dark:text-white">TaskFlow</span>
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
                  Система управления задачами с Telegram-уведомлениями
                </p>
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">
                <p>© {new Date().getFullYear()} TaskFlow. Все права защищены.</p>
                <p className="mt-1">Версия 1.0.0</p>
              </div>
            </div>
          </div>
        </footer>
      </div>
    </Router>
  );
};

export default App;