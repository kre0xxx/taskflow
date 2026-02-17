const { sequelize } = require('../models');
const bcrypt = require('bcryptjs');

async function initializeDatabase() {
  try {
    // Синхронизируем модели с базой данных (создаем таблицы)
    await sequelize.sync({ force: true }); // force: true удаляет существующие таблицы!
    console.log('Database synchronized');

    // Создаем тестовых пользователей
    const { User } = require('../models');
    
    const hashedAdminPassword = await bcrypt.hash('admin123', 10);
    const hashedUserPassword = await bcrypt.hash('user123', 10);

    // Создаем администратора
    const admin = await User.create({
      username: 'admin',
      email: 'admin@taskmanager.com',
      password: hashedAdminPassword,
      role: 'admin'
    });

    // Создаем обычного пользователя
    const user = await User.create({
      username: 'user1',
      email: 'user1@taskmanager.com', 
      password: hashedUserPassword,
      role: 'user'
    });

    console.log('Test users created:');
    console.log('Admin - login: admin@taskmanager.com, password: admin123');
    console.log('User - login: user1@taskmanager.com, password: user123');

  } catch (error) {
    console.error('Database initialization failed:', error);
  } finally {
    await sequelize.close();
  }
}

initializeDatabase();