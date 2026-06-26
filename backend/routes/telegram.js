const express = require('express');
const router = express.Router();
const { auth } = require('../middleware/auth');
const { User, Task } = require('../models');
const { Op } = require('sequelize');
// const telegramService = require('../services/telegramService'); // Временно отключено

// ============================================
// ВСЕ МАРШРУТЫ TELAGRAM ВРЕМЕННО ОТКЛЮЧЕНЫ
// ============================================

// GET /api/telegram/notifications - Получить уведомления
// router.get('/notifications', auth, async (req, res) => {
//   try {
//     const today = new Date();
//     today.setHours(0, 0, 0, 0);
//     
//     const nextWeek = new Date(today);
//     nextWeek.setDate(nextWeek.getDate() + 7);
//     nextWeek.setHours(23, 59, 59, 999);
//     
//     const tasks = await Task.findAll({
//       where: {
//         assignedTo: req.user.id,
//         status: { [Op.in]: ['new', 'in-progress'] },
//         dueDate: {
//           [Op.between]: [today, nextWeek]
//         }
//       },
//       include: [{
//         model: User,
//         as: 'assignee',
//         attributes: ['id', 'username']
//       }],
//       order: [['dueDate', 'ASC']],
//       limit: 20
//     });
//     
//     const notifications = tasks.map(task => {
//       const dueDate = new Date(task.dueDate);
//       const isOverdue = dueDate < today;
//       const daysUntilDue = Math.ceil((dueDate - today) / (1000 * 60 * 60 * 24));
//       
//       let type = 'info';
//       let message = '';
//       let priority = 'normal';
//       
//       if (isOverdue) {
//         type = 'urgent';
//         priority = 'high';
//         message = `⚠️ Задача "${task.title}" просрочена на ${Math.abs(daysUntilDue)} ${getDaysWord(Math.abs(daysUntilDue))}`;
//       } else if (daysUntilDue === 0) {
//         type = 'urgent';
//         priority = 'high';
//         message = `⚠️ Задача "${task.title}" должна быть выполнена сегодня!`;
//       } else if (daysUntilDue <= 2) {
//         type = 'warning';
//         priority = 'medium';
//         message = `⏰ Задача "${task.title}" должна быть выполнена через ${daysUntilDue} ${getDaysWord(daysUntilDue)}`;
//       } else {
//         message = `📋 Задача "${task.title}" должна быть выполнена через ${daysUntilDue} ${getDaysWord(daysUntilDue)}`;
//       }
//       
//       return {
//         id: `task-${task.id}-${Date.now()}`,
//         type,
//         priority,
//         message,
//         taskId: task.id,
//         taskTitle: task.title,
//         taskPriority: task.priority,
//         dueDate: task.dueDate,
//         read: false,
//         createdAt: new Date().toISOString()
//       };
//     });
//     
//     const systemNotifications = [];
//     
//     const overdueCount = tasks.filter(t => new Date(t.dueDate) < today).length;
//     if (overdueCount > 0) {
//       systemNotifications.push({
//         id: `system-overdue-${Date.now()}`,
//         type: 'urgent',
//         priority: 'high',
//         message: `У вас ${overdueCount} ${getTasksWord(overdueCount)} с истекшим сроком`,
//         read: false,
//         createdAt: new Date().toISOString()
//       });
//     }
//     
//     res.json([...systemNotifications, ...notifications]);
//   } catch (error) {
//     console.error('Error fetching notifications:', error);
//     res.status(500).json({ message: 'Ошибка загрузки уведомлений' });
//   }
// });

// Привязка Telegram аккаунта
// router.post('/bind', auth, async (req, res) => {
//   try {
//     const { chatId } = req.body;
//     
//     if (!chatId) {
//       return res.status(400).json({ message: 'Chat ID is required' });
//     }
//     
//     const existingUser = await User.findOne({
//       where: { telegramChatId: chatId }
//     });
//     
//     if (existingUser && existingUser.id !== req.user.id) {
//       return res.status(400).json({ message: 'Этот Telegram аккаунт уже привязан к другому пользователю' });
//     }
//     
//     await req.user.update({ 
//       telegramChatId: chatId,
//       telegramConnected: true 
//     });
//     
//     try {
//       await telegramService.sendNotification(req.user, '✅ Telegram успешно подключен к Task Manager!');
//     } catch (notifyError) {
//       console.error('Failed to send test notification:', notifyError);
//     }
//     
//     res.json({ 
//       message: 'Telegram аккаунт успешно привязан',
//       chatId: chatId 
//     });
//   } catch (error) {
//     console.error('Error binding telegram:', error);
//     res.status(400).json({ message: error.message });
//   }
// });

// Отвязка Telegram аккаунта
// router.post('/unbind', auth, async (req, res) => {
//   try {
//     await req.user.update({ 
//       telegramChatId: null,
//       telegramConnected: false 
//     });
//     
//     res.json({ message: 'Telegram аккаунт успешно отвязан' });
//   } catch (error) {
//     console.error('Error unbinding telegram:', error);
//     res.status(400).json({ message: error.message });
//   }
// });

// Получение статуса привязки Telegram
// router.get('/status', auth, async (req, res) => {
//   try {
//     res.json({ 
//       isLinked: !!req.user.telegramChatId,
//       chatId: req.user.telegramChatId,
//       username: req.user.username
//     });
//   } catch (error) {
//     console.error('Error getting telegram status:', error);
//     res.status(400).json({ message: error.message });
//   }
// });

// POST /api/telegram/test - Отправить тестовое уведомление
// router.post('/test', auth, async (req, res) => {
//   try {
//     if (!req.user.telegramChatId) {
//       return res.status(400).json({ message: 'Telegram не подключен' });
//     }
//     
//     await telegramService.sendNotification(
//       req.user, 
//       '🔔 Это тестовое уведомление из Task Manager!\n\nЕсли вы это видите, значит всё работает правильно.'
//     );
//     
//     res.json({ message: 'Тестовое уведомление отправлено' });
//   } catch (error) {
//     console.error('Error sending test notification:', error);
//     res.status(500).json({ message: 'Ошибка при отправке тестового уведомления' });
//   }
// });

// GET /api/telegram/settings - Получить настройки уведомлений
// router.get('/settings', auth, async (req, res) => {
//   try {
//     res.json({
//       notifyOnTaskAssigned: true,
//       notifyOnTaskCompleted: true,
//       notifyOnDeadline: true,
//       notifyOnStatusChange: true,
//       dailyDigest: false,
//       reminderTime: '09:00'
//     });
//   } catch (error) {
//     console.error('Error getting telegram settings:', error);
//     res.status(500).json({ message: 'Ошибка при получении настроек' });
//   }
// });

// POST /api/telegram/settings - Обновить настройки уведомлений
// router.post('/settings', auth, async (req, res) => {
//   try {
//     const settings = req.body;
//     
//     res.json({ 
//       message: 'Настройки сохранены',
//       settings 
//     });
//   } catch (error) {
//     console.error('Error saving telegram settings:', error);
//     res.status(500).json({ message: 'Ошибка при сохранении настроек' });
//   }
// });

// Вспомогательные функции (оставляем, если понадобятся)
// function getDaysWord(days) {
//   if (days >= 11 && days <= 14) return 'дней';
//   const lastDigit = days % 10;
//   if (lastDigit === 1) return 'день';
//   if (lastDigit >= 2 && lastDigit <= 4) return 'дня';
//   return 'дней';
// }
// 
// function getTasksWord(count) {
//   if (count >= 11 && count <= 14) return 'задач';
//   const lastDigit = count % 10;
//   if (lastDigit === 1) return 'задача';
//   if (lastDigit >= 2 && lastDigit <= 4) return 'задачи';
//   return 'задач';
// }

// Временный ответ, если кто-то обратится к /api/telegram
router.get('/', (req, res) => {
  res.json({ 
    message: 'Telegram API временно отключен',
    status: 'disabled'
  });
});

router.post('/', (req, res) => {
  res.json({ 
    message: 'Telegram API временно отключен',
    status: 'disabled'
  });
});

module.exports = router;