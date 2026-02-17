const express = require('express');
const router = express.Router();
const { Task, User, TimeTracking, sequelize } = require('../models');
const { auth, adminAuth } = require('../middleware/auth');
const telegramService = require('../services/telegramService');
const { Op } = require('sequelize');
const Joi = require('joi');

// Схемы валидации
const taskSchema = Joi.object({
  title: Joi.string().required().min(3).max(200),
  description: Joi.string().allow('', null),
  priority: Joi.string().valid('low', 'medium', 'high').default('medium'),
  dueDate: Joi.date().iso().allow(null),
  assignedTo: Joi.number().integer().positive().required(),
  timeEstimate: Joi.number().integer().min(0).allow(null),
  tags: Joi.array().items(Joi.string())
});

const taskUpdateSchema = Joi.object({
  title: Joi.string().min(3).max(200),
  description: Joi.string().allow('', null),
  status: Joi.string().valid('new', 'in-progress', 'completed', 'cancelled'),
  priority: Joi.string().valid('low', 'medium', 'high'),
  dueDate: Joi.date().iso().allow(null),
  assignedTo: Joi.number().integer().positive(),
  timeSpent: Joi.number().integer().min(0)
});

const timeTrackingSchema = Joi.object({
  minutes: Joi.number().integer().min(1).max(1440).required(),
  description: Joi.string().max(500).allow('')
});

// GET /api/tasks - Получить задачи с пагинацией
router.get('/', auth, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = Math.min(parseInt(req.query.limit) || 10, 100);
    const offset = (page - 1) * limit;
    
    let whereClause = {};
    
    if (req.user.role === 'user') {
      whereClause.assignedTo = req.user.id;
    }

    // Фильтрация по статусу
    if (req.query.status) {
      const validStatuses = ['new', 'in-progress', 'completed', 'cancelled'];
      if (validStatuses.includes(req.query.status)) {
        whereClause.status = req.query.status;
      }
    }

    // Фильтрация по приоритету
    if (req.query.priority) {
      const validPriorities = ['low', 'medium', 'high'];
      if (validPriorities.includes(req.query.priority)) {
        whereClause.priority = req.query.priority;
      }
    }

    // Поиск
    if (req.query.search && req.query.search.trim()) {
      const searchTerm = `%${req.query.search.trim()}%`;
      whereClause[Op.or] = [
        { title: { [Op.like]: searchTerm } },
        { description: { [Op.like]: searchTerm } }
      ];
    }

    const { count, rows: tasks } = await Task.findAndCountAll({
      where: whereClause,
      include: [
        {
          model: User,
          as: 'assignee',
          attributes: ['id', 'username', 'email', 'telegramChatId']
        }
      ],
      order: [
        ['priority', 'DESC'],
        ['dueDate', 'ASC'],
        ['createdAt', 'DESC']
      ],
      limit,
      offset,
      distinct: true
    });

    res.json({
      tasks,
      pagination: {
        total: count,
        page,
        limit,
        pages: Math.ceil(count / limit)
      }
    });
  } catch (error) {
    console.error('Error fetching tasks:', error);
    res.status(500).json({ message: 'Ошибка при получении задач' });
  }
});

// GET /api/tasks/my-tasks - Получить задачи текущего пользователя
router.get('/my-tasks', auth, async (req, res) => {
  try {
    const tasks = await Task.findAll({
      where: { 
        assignedTo: req.user.id,
        status: { [Op.in]: ['new', 'in-progress'] }
      },
      include: [
        {
          model: User,
          as: 'assignee',
          attributes: ['id', 'username', 'email']
        }
      ],
      order: [
        ['priority', 'DESC'],
        ['dueDate', 'ASC']
      ]
    });

    res.json(tasks);
  } catch (error) {
    console.error('Error fetching my tasks:', error);
    res.status(500).json({ message: 'Ошибка при получении задач' });
  }
});

// GET /api/tasks/recent-activity - Получить последнюю активность
router.get('/recent-activity', auth, async (req, res) => {
  try {
    let whereClause = {};
    
    // Для обычных пользователей показываем только их активность
    if (req.user.role === 'user') {
      whereClause[Op.or] = [
        { assignedTo: req.user.id }
      ];
    }

    const tasks = await Task.findAll({
      where: {
        ...whereClause,
        updatedAt: {
          [Op.gte]: new Date(Date.now() - 24 * 60 * 60 * 1000) // последние 24 часа
        }
      },
      include: [
        {
          model: User,
          as: 'assignee',
          attributes: ['id', 'username']
        }
      ],
      order: [['updatedAt', 'DESC']],
      limit: 20
    });

    const activity = tasks.map(task => {
      let action = 'обновил задачу';
      let user = task.assignee?.username || 'Система';
      
      if (task.status === 'completed') {
        action = 'завершил задачу';
      } else if (task.status === 'cancelled') {
        action = 'отменил задачу';
      }

      return {
        id: task.id,
        user,
        action,
        task: task.title,
        taskId: task.id,
        updatedAt: task.updatedAt,
        priority: task.priority,
        status: task.status
      };
    });

    res.json(activity);
  } catch (error) {
    console.error('Error fetching activity:', error);
    res.status(500).json({ message: 'Ошибка при получении активности' });
  }
});

// GET /api/tasks/upcoming-deadlines - Предстоящие дедлайны
router.get('/upcoming-deadlines', auth, async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const nextWeek = new Date(today);
    nextWeek.setDate(nextWeek.getDate() + 7);

    const tasks = await Task.findAll({
      where: {
        assignedTo: req.user.id,
        status: { [Op.in]: ['new', 'in-progress'] },
        dueDate: {
          [Op.between]: [today, nextWeek]
        }
      },
      include: [{
        model: User,
        as: 'assignee',
        attributes: ['id', 'username']
      }],
      order: [['dueDate', 'ASC']]
    });

    // Добавляем информацию о срочности
    const tasksWithUrgency = tasks.map(task => {
      const taskData = task.toJSON();
      const daysUntilDue = Math.ceil((new Date(task.dueDate) - today) / (1000 * 60 * 60 * 24));
      let urgency = 'normal';
      
      if (daysUntilDue <= 1) urgency = 'critical';
      else if (daysUntilDue <= 3) urgency = 'high';
      
      return {
        ...taskData,
        daysUntilDue,
        urgency
      };
    });

    res.json(tasksWithUrgency);
  } catch (error) {
    console.error('Error fetching deadlines:', error);
    res.status(500).json({ message: 'Ошибка при получении дедлайнов' });
  }
});

// GET /api/tasks/statistics - Статистика по задачам
router.get('/statistics', auth, async (req, res) => {
  try {
    const userId = req.user.role === 'admin' && req.query.userId ? parseInt(req.query.userId) : req.user.id;
    
    const whereClause = { assignedTo: userId };

    const now = new Date();
    
    const [total, completed, inProgress, newTasks, highPriority, overdue, cancelled] = await Promise.all([
      Task.count({ where: whereClause }),
      Task.count({ where: { ...whereClause, status: 'completed' } }),
      Task.count({ where: { ...whereClause, status: 'in-progress' } }),
      Task.count({ where: { ...whereClause, status: 'new' } }),
      Task.count({ where: { ...whereClause, priority: 'high' } }),
      Task.count({
        where: {
          ...whereClause,
          status: { [Op.in]: ['new', 'in-progress'] },
          dueDate: { [Op.lt]: now }
        }
      }),
      Task.count({ where: { ...whereClause, status: 'cancelled' } })
    ]);

    // Статистика по дням за последнюю неделю
    const lastWeekStats = await getLastWeekStats(userId);

    res.json({
      total,
      completed,
      inProgress,
      new: newTasks,
      highPriority,
      overdue,
      cancelled,
      completionRate: total > 0 ? Math.round((completed / total) * 100) : 0,
      lastWeek: lastWeekStats
    });
  } catch (error) {
    console.error('Error fetching statistics:', error);
    res.status(500).json({ message: 'Ошибка при получении статистики' });
  }
});

// POST /api/tasks - Создать задачу
router.post('/', adminAuth, async (req, res) => {
  const transaction = await sequelize.transaction();
  
  try {
    // Валидация
    const { error, value } = taskSchema.validate(req.body);
    if (error) {
      return res.status(400).json({ message: error.details[0].message });
    }

    // Проверка существования пользователя
    const assignee = await User.findByPk(value.assignedTo);
    if (!assignee) {
      return res.status(404).json({ message: 'Исполнитель не найден' });
    }

    const task = await Task.create({
      ...value,
      createdBy: req.user.id,
      status: 'new'
    }, { transaction });

    await transaction.commit();

    const taskWithUser = await Task.findByPk(task.id, {
      include: [
        {
          model: User,
          as: 'assignee',
          attributes: ['id', 'username', 'email', 'telegramChatId']
        }
      ]
    });

    // Отправляем уведомление асинхронно
    if (taskWithUser.assignee?.telegramChatId) {
      telegramService.sendTaskAssignedNotification(taskWithUser.assignee, taskWithUser)
        .catch(err => console.error('Failed to send notification:', err));
    }

    res.status(201).json(taskWithUser);
  } catch (error) {
    await transaction.rollback();
    console.error('Error creating task:', error);
    res.status(400).json({ message: 'Ошибка при создании задачи' });
  }
});

// GET /api/tasks/:id - Получить конкретную задачу
router.get('/:id', auth, async (req, res) => {
  try {
    const task = await Task.findByPk(req.params.id, {
      include: [
        {
          model: User,
          as: 'assignee',
          attributes: ['id', 'username', 'email', 'telegramChatId']
        }
      ]
    });

    if (!task) {
      return res.status(404).json({ message: 'Задача не найдена' });
    }

    // Проверка прав доступа
    if (req.user.role === 'user' && task.assignedTo !== req.user.id && task.createdBy !== req.user.id) {
      return res.status(403).json({ message: 'Доступ запрещен' });
    }

    res.json(task);
  } catch (error) {
    console.error('Error fetching task:', error);
    res.status(500).json({ message: 'Ошибка при получении задачи' });
  }
});

// PATCH /api/tasks/:id - Обновить задачу
router.patch('/:id', auth, async (req, res) => {
  const transaction = await sequelize.transaction();
  
  try {
    // Валидация
    const { error, value } = taskUpdateSchema.validate(req.body);
    if (error) {
      return res.status(400).json({ message: error.details[0].message });
    }

    const task = await Task.findByPk(req.params.id, {
      include: [
        {
          model: User,
          as: 'assignee'
        }
      ],
      transaction
    });

    if (!task) {
      await transaction.rollback();
      return res.status(404).json({ message: 'Задача не найдена' });
    }

    // Проверка прав доступа
    if (req.user.role === 'user' && task.assignedTo !== req.user.id) {
      await transaction.rollback();
      return res.status(403).json({ message: 'Доступ запрещен' });
    }

    const oldStatus = task.status;
    const oldAssignee = task.assignedTo;
    
    // Подготовка обновлений
    const updates = {};
    
    if (value.status) updates.status = value.status;
    if (value.priority) updates.priority = value.priority;
    if (value.dueDate !== undefined) updates.dueDate = value.dueDate;
    
    // Обработка времени
    if (value.timeSpent) {
      const currentTimeSpent = task.timeSpent || 0;
      updates.timeSpent = currentTimeSpent + value.timeSpent;
    }
    
    // Только админ может менять исполнителя
    if (req.user.role === 'admin' && value.assignedTo) {
      // Проверка существования нового исполнителя
      const newAssignee = await User.findByPk(value.assignedTo, { transaction });
      if (!newAssignee) {
        await transaction.rollback();
        return res.status(404).json({ message: 'Новый исполнитель не найден' });
      }
      updates.assignedTo = value.assignedTo;
    }

    await task.update(updates, { transaction });
    await transaction.commit();

    // Обновляем задачу для получения полных данных
    const updatedTask = await Task.findByPk(task.id, {
      include: [
        {
          model: User,
          as: 'assignee'
        }
      ]
    });

    // Отправляем уведомления асинхронно
    sendTaskUpdateNotifications(updatedTask, oldStatus, oldAssignee, req.user)
      .catch(err => console.error('Failed to send notifications:', err));

    res.json(updatedTask);
  } catch (error) {
    await transaction.rollback();
    console.error('Error updating task:', error);
    res.status(400).json({ message: 'Ошибка при обновлении задачи' });
  }
});

// POST /api/tasks/:id/complete - Завершить задачу
router.post('/:id/complete', auth, async (req, res) => {
  const transaction = await sequelize.transaction();
  
  try {
    const task = await Task.findByPk(req.params.id, {
      include: [{
        model: User,
        as: 'assignee'
      }],
      transaction
    });

    if (!task) {
      await transaction.rollback();
      return res.status(404).json({ message: 'Задача не найдена' });
    }

    // Проверка прав доступа
    if (req.user.role === 'user' && task.assignedTo !== req.user.id) {
      await transaction.rollback();
      return res.status(403).json({ message: 'Доступ запрещен' });
    }

    // Проверка, не завершена ли уже задача
    if (task.status === 'completed') {
      await transaction.rollback();
      return res.status(400).json({ message: 'Задача уже завершена' });
    }

    const timeSpent = req.body.timeSpent ? parseInt(req.body.timeSpent) : 0;
    const currentTimeSpent = task.timeSpent || 0;
    
    await task.update({
      status: 'completed',
      completedAt: new Date(),
      completedBy: req.user.id,
      timeSpent: currentTimeSpent + timeSpent
    }, { transaction });

    await transaction.commit();

    const completedTask = await Task.findByPk(task.id, {
      include: [
        {
          model: User,
          as: 'assignee'
        }
      ]
    });

    // Отправляем уведомления асинхронно
    sendTaskCompletionNotifications(completedTask)
      .catch(err => console.error('Failed to send completion notifications:', err));

    res.json(completedTask);
  } catch (error) {
    await transaction.rollback();
    console.error('Error completing task:', error);
    res.status(400).json({ message: 'Ошибка при завершении задачи' });
  }
});

// POST /api/tasks/:id/start-work - Начать работу над задачей
router.post('/:id/start-work', auth, async (req, res) => {
  const transaction = await sequelize.transaction();
  
  try {
    const task = await Task.findByPk(req.params.id, { transaction });

    if (!task) {
      await transaction.rollback();
      return res.status(404).json({ message: 'Задача не найдена' });
    }

    // Проверка прав доступа
    if (req.user.role === 'user' && task.assignedTo !== req.user.id) {
      await transaction.rollback();
      return res.status(403).json({ message: 'Доступ запрещен' });
    }

    // Можно начинать работу только с новыми задачами
    if (task.status !== 'new') {
      await transaction.rollback();
      return res.status(400).json({ message: 'Работу можно начать только с новыми задачами' });
    }

    await task.update({
      status: 'in-progress'
      // Убираем startedAt, так как его нет в модели
    }, { transaction });

    await transaction.commit();
    res.json(task);
  } catch (error) {
    await transaction.rollback();
    console.error('Error starting work:', error);
    res.status(400).json({ message: 'Ошибка при начале работы' });
  }
});

// POST /api/tasks/:id/add-time - Добавить затраченное время
router.post('/:id/add-time', auth, async (req, res) => {
  const transaction = await sequelize.transaction();
  
  try {
    // Валидация
    const { error, value } = timeTrackingSchema.validate(req.body);
    if (error) {
      return res.status(400).json({ message: error.details[0].message });
    }

    const task = await Task.findByPk(req.params.id, { transaction });

    if (!task) {
      await transaction.rollback();
      return res.status(404).json({ message: 'Задача не найдена' });
    }

    // Проверка прав доступа
    if (req.user.role === 'user' && task.assignedTo !== req.user.id) {
      await transaction.rollback();
      return res.status(403).json({ message: 'Доступ запрещен' });
    }

    // Обновляем общее время задачи
    const currentTimeSpent = task.timeSpent || 0;
    await task.update({
      timeSpent: currentTimeSpent + value.minutes
    }, { transaction });

    // Создаем запись в истории времени
    const timeTracking = await TimeTracking.create({
      taskId: task.id,
      userId: req.user.id,
      minutes: value.minutes,
      description: value.description || 'Добавление времени'
    }, { transaction });

    await transaction.commit();

    res.json({
      task,
      timeTracking,
      message: 'Время успешно добавлено'
    });
  } catch (error) {
    await transaction.rollback();
    console.error('Error adding time:', error);
    res.status(400).json({ message: 'Ошибка при добавлении времени' });
  }
});

// GET /api/tasks/:id/time-tracking - История затраченного времени
router.get('/:id/time-tracking', auth, async (req, res) => {
  try {
    const task = await Task.findByPk(req.params.id, {
      include: [{
        model: TimeTracking,
        as: 'timeTrackings',
        include: [{
          model: User,
          as: 'user',
          attributes: ['id', 'username']
        }],
        order: [['createdAt', 'DESC']]
      }]
    });

    if (!task) {
      return res.status(404).json({ message: 'Задача не найдена' });
    }

    // Проверка прав доступа
    if (req.user.role === 'user' && task.assignedTo !== req.user.id && task.createdBy !== req.user.id) {
      return res.status(403).json({ message: 'Доступ запрещен' });
    }

    const totalSpent = task.timeTrackings ? task.timeTrackings.reduce((sum, record) => sum + record.minutes, 0) : 0;
    
    res.json({
      taskId: task.id,
      taskTitle: task.title,
      timeEstimate: task.timeEstimate,
      timeSpent: totalSpent,
      remainingTime: task.timeEstimate ? Math.max(0, task.timeEstimate - totalSpent) : null,
      trackings: task.timeTrackings || []
    });
  } catch (error) {
    console.error('Error fetching time tracking:', error);
    res.status(400).json({ message: 'Ошибка при получении истории времени' });
  }
});

// DELETE /api/tasks/:id - Удалить задачу (только для админов)
router.delete('/:id', adminAuth, async (req, res) => {
  const transaction = await sequelize.transaction();
  
  try {
    const task = await Task.findByPk(req.params.id, { transaction });

    if (!task) {
      await transaction.rollback();
      return res.status(404).json({ message: 'Задача не найдена' });
    }

    // Удаляем связанные записи времени
    if (TimeTracking) {
      await TimeTracking.destroy({
        where: { taskId: task.id },
        transaction
      });
    }

    // Удаляем задачу
    await task.destroy({ transaction });

    await transaction.commit();
    res.json({ message: 'Задача успешно удалена' });
  } catch (error) {
    await transaction.rollback();
    console.error('Error deleting task:', error);
    res.status(500).json({ message: 'Ошибка при удалении задачи' });
  }
});

// Вспомогательные функции

async function getLastWeekStats(userId) {
  const today = new Date();
  const lastWeek = new Date(today);
  lastWeek.setDate(lastWeek.getDate() - 7);

  const stats = [];
  
  for (let i = 0; i < 7; i++) {
    const date = new Date(lastWeek);
    date.setDate(date.getDate() + i);
    const nextDate = new Date(date);
    nextDate.setDate(nextDate.getDate() + 1);

    const completed = await Task.count({
      where: {
        assignedTo: userId,
        status: 'completed',
        completedAt: {
          [Op.between]: [date, nextDate]
        }
      }
    });

    stats.push({
      date: date.toISOString().split('T')[0],
      completed
    });
  }

  return stats;
}

async function sendTaskUpdateNotifications(task, oldStatus, oldAssignee, updater) {
  try {
    if (!telegramService) return;
    
    // Уведомление о смене исполнителя
    if (oldAssignee !== task.assignedTo && task.assignee?.telegramChatId) {
      await telegramService.sendTaskAssignedNotification(task.assignee, task);
    }

    // Уведомление об изменении статуса
    if (oldStatus !== task.status) {
      // Уведомление администраторам
      const admins = await User.findAll({
        where: { role: 'admin' }
      });

      for (const admin of admins) {
        if (admin.telegramChatId) {
          if (task.status === 'completed') {
            await telegramService.sendTaskCompletedNotification(admin, task);
          } else {
            await telegramService.sendStatusChangeNotification(admin, task, oldStatus, task.status);
          }
        }
      }

      // Уведомление исполнителю
      if (task.assignee?.telegramChatId && task.assignee.id !== updater.id) {
        if (task.status === 'completed') {
          await telegramService.sendTaskCompletedConfirmation(task.assignee, task);
        }
      }
    }
  } catch (error) {
    console.error('Error sending notifications:', error);
  }
}

async function sendTaskCompletionNotifications(task) {
  try {
    if (!telegramService) return;
    
    // Уведомление администраторам
    const admins = await User.findAll({
      where: { role: 'admin' }
    });

    for (const admin of admins) {
      if (admin.telegramChatId) {
        await telegramService.sendTaskCompletedNotification(admin, task);
      }
    }

    // Уведомление исполнителю
    if (task.assignee?.telegramChatId) {
      await telegramService.sendTaskCompletedConfirmation(task.assignee, task);
    }
  } catch (error) {
    console.error('Error sending completion notifications:', error);
  }
}

module.exports = router;