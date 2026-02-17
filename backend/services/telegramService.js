const axios = require('axios');

class TelegramService {
  constructor() {
    this.botToken = process.env.TELEGRAM_BOT_TOKEN;
    this.apiUrl = `https://api.telegram.org/bot${this.botToken}`;
    
    // Проверяем наличие токена при инициализации
    if (!this.botToken) {
      console.warn('⚠️ TELEGRAM_BOT_TOKEN not set in environment variables');
    }
  }

  // Базовый метод отправки сообщения
  async sendMessage(chatId, message) {
    try {
      if (!chatId) {
        console.warn('No chatId provided for Telegram message');
        return false;
      }

      const response = await axios.post(`${this.apiUrl}/sendMessage`, {
        chat_id: chatId,
        text: message,
        parse_mode: 'HTML'
      });
      
      console.log(`✅ Message sent to chat ${chatId}`);
      return response.data;
    } catch (error) {
      console.error('❌ Error sending Telegram message:', error.response?.data || error.message);
      return false;
    }
  }

  // Отправка уведомления о назначении задачи
  async sendTaskAssignedNotification(user, task) {
    try {
      const message = `
🎯 <b>Вам назначена новая задача!</b>

📝 <b>Задача:</b> ${task.title}
📄 <b>Описание:</b> ${task.description || 'Нет описания'}
🚀 <b>Приоритет:</b> ${this.getPriorityText(task.priority)}
📅 <b>Срок выполнения:</b> ${task.dueDate ? new Date(task.dueDate).toLocaleDateString('ru-RU') : 'Не установлен'}
⏱ <b>Оценка времени:</b> ${task.timeEstimate ? this.formatTime(task.timeEstimate) : 'Не указана'}

Статус можно изменить в системе управления задачами.
      `;
      
      if (user?.telegramChatId) {
        await this.sendMessage(user.telegramChatId, message);
      }
    } catch (error) {
      console.error('Error sending task assigned notification:', error);
    }
  }

  // Отправка уведомления о завершении задачи (для админов)
  async sendTaskCompletedNotification(admin, task) {
    try {
      const message = `
✅ <b>Задача завершена пользователем!</b>

👤 <b>Исполнитель:</b> ${task.assignee?.username || 'Неизвестно'}
📝 <b>Задача:</b> ${task.title}
📄 <b>Описание:</b> ${task.description || 'Нет описания'}
⏱ <b>Затрачено времени:</b> ${task.timeSpent ? this.formatTime(task.timeSpent) : 'Не указано'}
📅 <b>Завершено:</b> ${new Date().toLocaleString('ru-RU')}

Задача ожидает проверки.
      `;
      
      if (admin?.telegramChatId) {
        await this.sendMessage(admin.telegramChatId, message);
      }
    } catch (error) {
      console.error('Error sending task completed notification:', error);
    }
  }

  // Подтверждение завершения задачи для исполнителя
  async sendTaskCompletedConfirmation(user, task) {
    try {
      const message = `
✅ <b>Задача успешно завершена!</b>

📝 <b>Задача:</b> ${task.title}
⏱ <b>Затрачено времени:</b> ${task.timeSpent ? this.formatTime(task.timeSpent) : 'Не указано'}
🏆 <b>Молодец!</b> Задача выполнена качественно и в срок.

Спасибо за вашу работу!
      `;
      
      if (user?.telegramChatId) {
        await this.sendMessage(user.telegramChatId, message);
      }
    } catch (error) {
      console.error('Error sending task completion confirmation:', error);
    }
  }

  // Уведомление об изменении статуса
  async sendStatusChangeNotification(admin, task, oldStatus, newStatus) {
    try {
      const message = `
🔄 <b>Изменен статус задачи</b>

👤 <b>Исполнитель:</b> ${task.assignee?.username || 'Неизвестно'}
📝 <b>Задача:</b> ${task.title}
🔄 <b>Статус изменен:</b> ${this.getStatusText(oldStatus)} → ${this.getStatusText(newStatus)}
📅 <b>Время изменения:</b> ${new Date().toLocaleString('ru-RU')}
      `;
      
      if (admin?.telegramChatId) {
        await this.sendMessage(admin.telegramChatId, message);
      }
    } catch (error) {
      console.error('Error sending status change notification:', error);
    }
  }

  // Уведомление о приближающемся дедлайне
  async sendDeadlineReminder(user, task) {
    try {
      const daysUntilDue = Math.ceil((new Date(task.dueDate) - new Date()) / (1000 * 60 * 60 * 24));
      let urgencyEmoji = '⏰';
      if (daysUntilDue <= 1) urgencyEmoji = '⚠️';
      if (daysUntilDue < 0) urgencyEmoji = '🚨';

      const message = `
${urgencyEmoji} <b>Приближается дедлайн по задаче!</b>

📝 <b>Задача:</b> ${task.title}
📄 <b>Описание:</b> ${task.description || 'Нет описания'}
🚀 <b>Приоритет:</b> ${this.getPriorityText(task.priority)}
📅 <b>Срок выполнения:</b> ${new Date(task.dueDate).toLocaleDateString('ru-RU')}
⏳ <b>Осталось дней:</b> ${daysUntilDue < 0 ? 'ПРОСРОЧЕНО!' : daysUntilDue}

${daysUntilDue < 0 ? '❗️ Задача уже просрочена! Срочно примите меры!' : 'Не забудьте завершить задачу вовремя!'}
      `;
      
      if (user?.telegramChatId) {
        await this.sendMessage(user.telegramChatId, message);
      }
    } catch (error) {
      console.error('Error sending deadline reminder:', error);
    }
  }

  // Отправка тестового уведомления
  async sendTestNotification(user) {
    try {
      const message = `
🔔 <b>Тестовое уведомление из Task Manager</b>

✅ Ваш Telegram успешно подключен к системе управления задачами.
📊 Теперь вы будете получать уведомления о:
• Назначении новых задач
• Изменении статуса задач
• Приближающихся дедлайнах
• Завершении задач

Спасибо за использование нашего сервиса!
      `;
      
      if (user?.telegramChatId) {
        await this.sendMessage(user.telegramChatId, message);
      }
    } catch (error) {
      console.error('Error sending test notification:', error);
    }
  }

  // Отправка ежедневного дайджеста
  async sendDailyDigest(user, tasks) {
    try {
      const today = new Date();
      const tasksDueToday = tasks.filter(t => 
        t.dueDate && new Date(t.dueDate).toDateString() === today.toDateString()
      );
      const overdueTasks = tasks.filter(t => 
        t.dueDate && new Date(t.dueDate) < today && t.status !== 'completed'
      );

      let message = `📊 <b>Ежедневный дайджест задач</b>\n\n`;
      
      if (overdueTasks.length > 0) {
        message += `🚨 <b>Просроченные задачи:</b> ${overdueTasks.length}\n`;
        overdueTasks.forEach(t => {
          message += `  • ${t.title} (срок: ${new Date(t.dueDate).toLocaleDateString('ru-RU')})\n`;
        });
        message += '\n';
      }
      
      if (tasksDueToday.length > 0) {
        message += `⚠️ <b>Задачи на сегодня:</b> ${tasksDueToday.length}\n`;
        tasksDueToday.forEach(t => {
          message += `  • ${t.title} (${this.getPriorityText(t.priority)})\n`;
        });
        message += '\n';
      }
      
      message += `📌 <b>Всего активных задач:</b> ${tasks.length}\n`;
      message += `✅ <b>Завершено сегодня:</b> ${tasks.filter(t => 
        t.status === 'completed' && new Date(t.completedAt).toDateString() === today.toDateString()
      ).length}\n`;
      
      if (user?.telegramChatId) {
        await this.sendMessage(user.telegramChatId, message);
      }
    } catch (error) {
      console.error('Error sending daily digest:', error);
    }
  }

  // Вспомогательные методы
  getPriorityText(priority) {
    const priorities = {
      'low': '🟢 Низкий',
      'medium': '🟡 Средний', 
      'high': '🔴 Высокий'
    };
    return priorities[priority] || '⚪️ Неизвестно';
  }

  getStatusText(status) {
    const statuses = {
      'new': '🆕 Новая',
      'in-progress': '🔄 В работе',
      'completed': '✅ Завершена',
      'review': '👀 На проверке',
      'cancelled': '❌ Отменена'
    };
    return statuses[status] || '📌 ' + status;
  }

  formatTime(minutes) {
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
  }

  // Проверка подключения Telegram бота
  async testConnection() {
    try {
      const response = await axios.get(`${this.apiUrl}/getMe`);
      console.log(`✅ Telegram bot connected: @${response.data.result.username}`);
      return true;
    } catch (error) {
      console.error('❌ Telegram bot connection failed:', error.message);
      return false;
    }
  }
}

module.exports = new TelegramService();