const cron = require('node-cron');
const { Op } = require('sequelize'); // Добавляем импорт Op
const { Task, User, sequelize } = require('../models');
const telegramService = require('./telegramService');

class NotificationScheduler {
  constructor() {
    this.jobs = [];
    this.isRunning = false;
  }

  start() {
    if (this.isRunning) {
      console.log('⚠️ Notification scheduler is already running');
      return;
    }

    console.log('🚀 Starting notification scheduler...');
    this.isRunning = true;

    // Проверка дедлайнов каждое утро в 9:00
    this.scheduleJob('0 9 * * *', async () => {
      console.log('⏰ Checking for upcoming deadlines...');
      await this.checkUpcomingDeadlines();
    });

    // Проверка просроченных задач каждый час
    this.scheduleJob('0 * * * *', async () => {
      console.log('⏰ Checking for overdue tasks...');
      await this.checkOverdueTasks();
    });

    // Ежедневный дайджест в 18:00
    this.scheduleJob('0 18 * * *', async () => {
      console.log('📊 Sending daily digest...');
      await this.sendDailyDigest();
    });

    // Проверка новых задач (каждые 30 минут)
    this.scheduleJob('*/30 * * * *', async () => {
      console.log('📋 Checking for new tasks...');
      await this.checkNewTasks();
    });

    console.log('✅ Notification scheduler started successfully');
  }

  stop() {
    console.log('🛑 Stopping notification scheduler...');
    
    this.jobs.forEach(job => {
      job.stop();
    });
    
    this.jobs = [];
    this.isRunning = false;
    console.log('✅ Notification scheduler stopped');
  }

  scheduleJob(cronExpression, callback) {
    try {
      const job = cron.schedule(cronExpression, callback, {
        scheduled: true,
        timezone: "Europe/Moscow"
      });
      
      this.jobs.push(job);
      console.log(`📅 Scheduled job: ${cronExpression}`);
    } catch (error) {
      console.error(`❌ Failed to schedule job ${cronExpression}:`, error);
    }
  }

  async checkUpcomingDeadlines() {
    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      const twoDaysFromNow = new Date(today);
      twoDaysFromNow.setDate(twoDaysFromNow.getDate() + 2);
      twoDaysFromNow.setHours(23, 59, 59, 999);

      const threeDaysFromNow = new Date(today);
      threeDaysFromNow.setDate(threeDaysFromNow.getDate() + 3);
      threeDaysFromNow.setHours(23, 59, 59, 999);

      const tasks = await Task.findAll({
        where: {
          dueDate: {
            [Op.between]: [today, threeDaysFromNow]
          },
          status: {
            [Op.notIn]: ['completed', 'cancelled']
          }
        },
        include: [{
          model: User,
          as: 'assignee',
          required: true,
          where: {
            telegramChatId: {
              [Op.ne]: null
            }
          }
        }]
      });

      console.log(`Found ${tasks.length} tasks with upcoming deadlines`);

      let sentCount = 0;
      for (const task of tasks) {
        const daysUntilDue = Math.ceil((new Date(task.dueDate) - today) / (1000 * 60 * 60 * 24));
        
        // Отправляем уведомление только если:
        // 1. Осталось 2 дня или меньше
        // 2. Задача еще не выполнена
        if (daysUntilDue <= 2 && daysUntilDue >= 0) {
          await telegramService.sendDeadlineReminder(task.assignee, task);
          sentCount++;
          
          // Логируем отправку
          console.log(`📤 Sent deadline reminder for task ${task.id} to user ${task.assignee.id}`);
        }
      }

      console.log(`✅ Sent ${sentCount} deadline reminders`);
      
      // Логируем задачи, которые не были отправлены
      const skippedTasks = tasks.filter(t => {
        const days = Math.ceil((new Date(t.dueDate) - today) / (1000 * 60 * 60 * 24));
        return days > 2;
      });
      
      if (skippedTasks.length > 0) {
        console.log(`⏸ Skipped ${skippedTasks.length} tasks (more than 2 days until deadline)`);
      }

    } catch (error) {
      console.error('❌ Error checking deadlines:', error);
    }
  }

  async checkOverdueTasks() {
    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const tasks = await Task.findAll({
        where: {
          dueDate: {
            [Op.lt]: today
          },
          status: {
            [Op.notIn]: ['completed', 'cancelled']
          }
        },
        include: [
          {
            model: User,
            as: 'assignee',
            required: true,
            where: {
              telegramChatId: {
                [Op.ne]: null
              }
            }
          },
          {
            model: User,
            as: 'creator',
            attributes: ['id', 'username', 'telegramChatId']
          }
        ]
      });

      console.log(`Found ${tasks.length} overdue tasks`);

      // Группируем по пользователям для отправки одного уведомления
      const userTasks = {};
      
      tasks.forEach(task => {
        if (!userTasks[task.assignee.id]) {
          userTasks[task.assignee.id] = {
            user: task.assignee,
            tasks: []
          };
        }
        userTasks[task.assignee.id].tasks.push(task);
      });

      // Отправляем уведомления
      for (const userId in userTasks) {
        const { user, tasks } = userTasks[userId];
        
        const message = this.formatOverdueMessage(tasks);
        await telegramService.sendMessage(user.telegramChatId, message);
        
        console.log(`📤 Sent overdue notification to user ${user.id} (${tasks.length} tasks)`);
      }

      // Уведомляем создателей просроченных задач
      await this.notifyCreatorsAboutOverdue(tasks);

    } catch (error) {
      console.error('❌ Error checking overdue tasks:', error);
    }
  }

  async sendDailyDigest() {
    try {
      const users = await User.findAll({
        where: {
          telegramChatId: {
            [Op.ne]: null
          }
        },
        include: [
          {
            model: Task,
            as: 'assignedTasks',
            where: {
              status: {
                [Op.notIn]: ['completed', 'cancelled']
              }
            },
            required: false
          }
        ]
      });

      console.log(`📊 Sending daily digest to ${users.length} users`);

      for (const user of users) {
        const activeTasks = user.assignedTasks || [];
        
        if (activeTasks.length > 0) {
          await telegramService.sendDailyDigest(user, activeTasks);
          console.log(`📤 Sent daily digest to user ${user.id}`);
        }
      }

    } catch (error) {
      console.error('❌ Error sending daily digest:', error);
    }
  }

  async checkNewTasks() {
    try {
      const oneHourAgo = new Date();
      oneHourAgo.setHours(oneHourAgo.getHours() - 1);

      const newTasks = await Task.findAll({
        where: {
          createdAt: {
            [Op.gte]: oneHourAgo
          },
          status: 'new'
        },
        include: [{
          model: User,
          as: 'assignee',
          required: true,
          where: {
            telegramChatId: {
              [Op.ne]: null
            }
          }
        }]
      });

      console.log(`Found ${newTasks.length} new tasks in the last hour`);

      // Отправляем уведомления о новых задачах
      for (const task of newTasks) {
        await telegramService.sendTaskAssignedNotification(task.assignee, task);
        console.log(`📤 Sent new task notification for task ${task.id}`);
      }

    } catch (error) {
      console.error('❌ Error checking new tasks:', error);
    }
  }

  async notifyCreatorsAboutOverdue(overdueTasks) {
    try {
      const creatorTasks = {};
      
      overdueTasks.forEach(task => {
        if (task.creator && task.creator.telegramChatId) {
          if (!creatorTasks[task.creator.id]) {
            creatorTasks[task.creator.id] = {
              user: task.creator,
              tasks: []
            };
          }
          creatorTasks[task.creator.id].tasks.push(task);
        }
      });

      for (const creatorId in creatorTasks) {
        const { user, tasks } = creatorTasks[creatorId];
        
        const message = this.formatCreatorOverdueMessage(tasks);
        await telegramService.sendMessage(user.telegramChatId, message);
        
        console.log(`📤 Sent overdue notification to creator ${user.id} (${tasks.length} tasks)`);
      }

    } catch (error) {
      console.error('❌ Error notifying creators about overdue tasks:', error);
    }
  }

  formatOverdueMessage(tasks) {
    const count = tasks.length;
    let message = `🚨 <b>У вас ${count} ${this.getTasksWord(count)}!</b>\n\n`;
    
    tasks.forEach((task, index) => {
      message += `${index + 1}. <b>${task.title}</b>\n`;
      message += `   📅 Срок: ${new Date(task.dueDate).toLocaleDateString('ru-RU')}\n`;
      message += `   🔥 Просрочено на ${Math.ceil((new Date() - new Date(task.dueDate)) / (1000 * 60 * 60 * 24))} дн.\n\n`;
    });

    message += `Пожалуйста, завершите эти задачи как можно скорее! ⚡️`;
    
    return message;
  }

  formatCreatorOverdueMessage(tasks) {
    const count = tasks.length;
    let message = `⚠️ <b>У ваших исполнителей ${count} ${this.getTasksWord(count)}!</b>\n\n`;
    
    tasks.forEach((task, index) => {
      message += `${index + 1}. <b>${task.title}</b>\n`;
      message += `   👤 Исполнитель: ${task.assignee?.username || 'Неизвестно'}\n`;
      message += `   📅 Срок: ${new Date(task.dueDate).toLocaleDateString('ru-RU')}\n`;
      message += `   🔥 Просрочено на ${Math.ceil((new Date() - new Date(task.dueDate)) / (1000 * 60 * 60 * 24))} дн.\n\n`;
    });

    message += `Свяжитесь с исполнителями для ускорения работы. 💪`;
    
    return message;
  }

  getTasksWord(count) {
    if (count >= 11 && count <= 14) return 'задач';
    const lastDigit = count % 10;
    if (lastDigit === 1) return 'задача';
    if (lastDigit >= 2 && lastDigit <= 4) return 'задачи';
    return 'задач';
  }

  // Метод для ручного запуска проверки (для тестирования)
  async runNow(type) {
    console.log(`🔄 Manually running ${type} check...`);
    
    switch(type) {
      case 'deadlines':
        await this.checkUpcomingDeadlines();
        break;
      case 'overdue':
        await this.checkOverdueTasks();
        break;
      case 'digest':
        await this.sendDailyDigest();
        break;
      case 'new':
        await this.checkNewTasks();
        break;
      default:
        console.log('Unknown check type');
    }
  }
}

module.exports = new NotificationScheduler();