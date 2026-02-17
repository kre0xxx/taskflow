const express = require('express');
const router = express.Router();
const { User, Task } = require('../models');
const { auth, adminAuth } = require('../middleware/auth');
const { Op } = require('sequelize');
const bcrypt = require('bcryptjs');
const Joi = require('joi');

// Схемы валидации
const userUpdateSchema = Joi.object({
  username: Joi.string().min(3).max(30),
  email: Joi.string().email(),
  password: Joi.string().min(6),
  role: Joi.string().valid('user', 'admin'),
  telegramChatId: Joi.string().allow(null, '')
});

// GET /api/users - Получить всех пользователей (только для админа)
router.get('/', adminAuth, async (req, res) => {
  try {
    const users = await User.findAll({
      attributes: { 
        exclude: ['password'] 
      },
      order: [['username', 'ASC']]
    });
    
    res.json(users);
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({ message: 'Ошибка при получении списка пользователей' });
  }
});

// GET /api/users/me - Получить информацию о текущем пользователе
router.get('/me', auth, async (req, res) => {
  try {
    const user = await User.findByPk(req.user.id, {
      attributes: { exclude: ['password'] },
      include: [
        {
          model: Task,
          as: 'assignedTasks',
          where: {
            status: { [Op.notIn]: ['completed', 'cancelled'] }
          },
          required: false,
          limit: 5
        },
        {
          model: Task,
          as: 'completedTasks',
          required: false,
          limit: 5
        }
      ]
    });
    
    res.json(user);
  } catch (error) {
    console.error('Error fetching current user:', error);
    res.status(500).json({ message: 'Ошибка при получении информации о пользователе' });
  }
});

// GET /api/users/:id - Получить конкретного пользователя
router.get('/:id', auth, async (req, res) => {
  try {
    const userId = parseInt(req.params.id);
    
    // Проверяем права доступа
    if (req.user.role !== 'admin' && req.user.id !== userId) {
      return res.status(403).json({ 
        message: 'Доступ запрещен. Вы можете просматривать только свой профиль.' 
      });
    }
    
    const user = await User.findByPk(userId, {
      attributes: { exclude: ['password'] },
      include: [
        {
          model: Task,
          as: 'assignedTasks',
          where: {
            status: { [Op.notIn]: ['completed', 'cancelled'] }
          },
          required: false
        },
        {
          model: Task,
          as: 'completedTasks',
          required: false
        },
        {
          model: Task,
          as: 'createdTasks',
          required: false
        }
      ]
    });
    
    if (!user) {
      return res.status(404).json({ message: 'Пользователь не найден' });
    }
    
    res.json(user);
  } catch (error) {
    console.error('Error fetching user:', error);
    res.status(500).json({ message: 'Ошибка при получении информации о пользователе' });
  }
});

// PATCH /api/users/:id - Обновить пользователя
router.patch('/:id', auth, async (req, res) => {
  try {
    const userId = parseInt(req.params.id);
    
    // Проверяем права доступа
    if (req.user.role !== 'admin' && req.user.id !== userId) {
      return res.status(403).json({ 
        message: 'Доступ запрещен. Вы можете редактировать только свой профиль.' 
      });
    }
    
    // Валидация
    const { error, value } = userUpdateSchema.validate(req.body);
    if (error) {
      return res.status(400).json({ message: error.details[0].message });
    }
    
    const user = await User.findByPk(userId);
    
    if (!user) {
      return res.status(404).json({ message: 'Пользователь не найден' });
    }
    
    // Подготовка обновлений
    const updates = {};
    
    if (value.username) updates.username = value.username;
    if (value.email) updates.email = value.email;
    if (value.telegramChatId !== undefined) updates.telegramChatId = value.telegramChatId;
    
    // Только админ может менять роль
    if (req.user.role === 'admin' && value.role) {
      updates.role = value.role;
    }
    
    // Если меняется пароль
    if (value.password) {
      const salt = await bcrypt.genSalt(10);
      updates.password = await bcrypt.hash(value.password, salt);
    }
    
    await user.update(updates);
    
    // Возвращаем обновленного пользователя без пароля
    const updatedUser = await User.findByPk(userId, {
      attributes: { exclude: ['password'] }
    });
    
    res.json(updatedUser);
  } catch (error) {
    console.error('Error updating user:', error);
    res.status(500).json({ message: 'Ошибка при обновлении пользователя' });
  }
});

// DELETE /api/users/:id - Удалить пользователя (только для админа)
router.delete('/:id', adminAuth, async (req, res) => {
  const transaction = await require('../models').sequelize.transaction();
  
  try {
    const userId = parseInt(req.params.id);
    
    // Нельзя удалить самого себя
    if (req.user.id === userId) {
      await transaction.rollback();
      return res.status(400).json({ message: 'Вы не можете удалить свой собственный аккаунт' });
    }
    
    const user = await User.findByPk(userId, { transaction });
    
    if (!user) {
      await transaction.rollback();
      return res.status(404).json({ message: 'Пользователь не найден' });
    }
    
    // Проверяем, есть ли у пользователя активные задачи
    const activeTasks = await Task.count({
      where: {
        assignedTo: userId,
        status: { [Op.notIn]: ['completed', 'cancelled'] }
      },
      transaction
    });
    
    if (activeTasks > 0) {
      await transaction.rollback();
      return res.status(400).json({ 
        message: `Невозможно удалить пользователя. У него есть ${activeTasks} активных задач.` 
      });
    }
    
    // Удаляем пользователя
    await user.destroy({ transaction });
    
    await transaction.commit();
    
    res.json({ 
      message: 'Пользователь успешно удален',
      userId 
    });
  } catch (error) {
    await transaction.rollback();
    console.error('Error deleting user:', error);
    res.status(500).json({ message: 'Ошибка при удалении пользователя' });
  }
});

// GET /api/users/:id/tasks - Получить задачи пользователя
router.get('/:id/tasks', auth, async (req, res) => {
  try {
    const userId = parseInt(req.params.id);
    
    // Проверяем права доступа
    if (req.user.role !== 'admin' && req.user.id !== userId) {
      return res.status(403).json({ 
        message: 'Доступ запрещен. Вы можете просматривать только свои задачи.' 
      });
    }
    
    const tasks = await Task.findAll({
      where: {
        assignedTo: userId
      },
      include: [
        {
          model: User,
          as: 'assignee',
          attributes: ['id', 'username']
        },
        {
          model: User,
          as: 'completer',
          attributes: ['id', 'username']
        }
      ],
      order: [['createdAt', 'DESC']]
    });
    
    res.json(tasks);
  } catch (error) {
    console.error('Error fetching user tasks:', error);
    res.status(500).json({ message: 'Ошибка при получении задач пользователя' });
  }
});

// GET /api/users/:id/statistics - Получить статистику пользователя
router.get('/:id/statistics', auth, async (req, res) => {
  try {
    const userId = parseInt(req.params.id);
    
    // Проверяем права доступа
    if (req.user.role !== 'admin' && req.user.id !== userId) {
      return res.status(403).json({ 
        message: 'Доступ запрещен. Вы можете просматривать только свою статистику.' 
      });
    }
    
    const now = new Date();
    const thirtyDaysAgo = new Date(now);
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    const [
      totalTasks,
      completedTasks,
      activeTasks,
      overdueTasks,
      tasksByPriority,
      tasksByStatus,
      recentActivity
    ] = await Promise.all([
      Task.count({ where: { assignedTo: userId } }),
      Task.count({ where: { assignedTo: userId, status: 'completed' } }),
      Task.count({ 
        where: { 
          assignedTo: userId, 
          status: { [Op.in]: ['new', 'in-progress'] } 
        } 
      }),
      Task.count({ 
        where: { 
          assignedTo: userId, 
          status: { [Op.notIn]: ['completed', 'cancelled'] },
          dueDate: { [Op.lt]: now }
        } 
      }),
      Task.findAll({
        where: { assignedTo: userId },
        attributes: [
          'priority',
          [require('../models').sequelize.fn('COUNT', 'priority'), 'count']
        ],
        group: ['priority']
      }),
      Task.findAll({
        where: { assignedTo: userId },
        attributes: [
          'status',
          [require('../models').sequelize.fn('COUNT', 'status'), 'count']
        ],
        group: ['status']
      }),
      Task.findAll({
        where: {
          assignedTo: userId,
          updatedAt: { [Op.gte]: thirtyDaysAgo }
        },
        order: [['updatedAt', 'DESC']],
        limit: 10
      })
    ]);
    
    res.json({
      total: totalTasks,
      completed: completedTasks,
      active: activeTasks,
      overdue: overdueTasks,
      completionRate: totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0,
      byPriority: tasksByPriority.reduce((acc, item) => {
        acc[item.priority] = parseInt(item.dataValues.count);
        return acc;
      }, {}),
      byStatus: tasksByStatus.reduce((acc, item) => {
        acc[item.status] = parseInt(item.dataValues.count);
        return acc;
      }, {}),
      recentActivity
    });
  } catch (error) {
    console.error('Error fetching user statistics:', error);
    res.status(500).json({ message: 'Ошибка при получении статистики пользователя' });
  }
});

// POST /api/users/:id/telegram - Обновить Telegram ID
router.post('/:id/telegram', auth, async (req, res) => {
  try {
    const userId = parseInt(req.params.id);
    const { chatId } = req.body;
    
    // Проверяем права доступа
    if (req.user.id !== userId) {
      return res.status(403).json({ 
        message: 'Доступ запрещен. Вы можете изменять только свой Telegram ID.' 
      });
    }
    
    if (!chatId) {
      return res.status(400).json({ message: 'Chat ID обязателен' });
    }
    
    const user = await User.findByPk(userId);
    
    if (!user) {
      return res.status(404).json({ message: 'Пользователь не найден' });
    }
    
    // Проверяем, не занят ли chatId другим пользователем
    const existingUser = await User.findOne({
      where: {
        telegramChatId: chatId,
        id: { [Op.ne]: userId }
      }
    });
    
    if (existingUser) {
      return res.status(400).json({ 
        message: 'Этот Telegram аккаунт уже привязан к другому пользователю' 
      });
    }
    
    await user.update({ telegramChatId: chatId });
    
    res.json({ 
      message: 'Telegram ID успешно обновлен',
      telegramChatId: chatId 
    });
  } catch (error) {
    console.error('Error updating telegram ID:', error);
    res.status(500).json({ message: 'Ошибка при обновлении Telegram ID' });
  }
});

// GET /api/users/search - Поиск пользователей
router.get('/search/:query', adminAuth, async (req, res) => {
  try {
    const searchQuery = req.params.query;
    
    const users = await User.findAll({
      where: {
        [Op.or]: [
          { username: { [Op.like]: `%${searchQuery}%` } },
          { email: { [Op.like]: `%${searchQuery}%` } }
        ]
      },
      attributes: { exclude: ['password'] },
      limit: 20
    });
    
    res.json(users);
  } catch (error) {
    console.error('Error searching users:', error);
    res.status(500).json({ message: 'Ошибка при поиске пользователей' });
  }
});

module.exports = router;