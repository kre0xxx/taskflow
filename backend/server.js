const express = require('express');
const cors = require('cors');
require('dotenv').config();

const db = require('./models');
const notificationScheduler = require('./services/notificationScheduler');

const app = express();
const PORT = process.env.PORT || 5002;

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/tasks', require('./routes/tasks'));
app.use('/api/users', require('./routes/users'));
app.use('/api/telegram', require('./routes/telegram'));

// Health check
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    database: 'Connected', 
    timestamp: new Date().toISOString() 
  });
});

// Инициализация базы данных с синхронизацией
db.sequelize.authenticate()
  .then(() => {
    console.log('Database connection established successfully.');
    
    // Синхронизация с изменением структуры таблиц
    // alter: true - добавит недостающие колонки, но не удалит существующие данные
    return db.sequelize.sync({ 
      alter: true,
      logging: console.log // Показывает SQL запросы в консоли
    });
  })
  .then(() => {
    console.log('Database synchronized successfully');
    console.log('All missing columns have been added to the tables');
    
    // Запускаем планировщик уведомлений
    notificationScheduler.start();
    console.log('Notification scheduler started');
    
    const server = app.listen(PORT, () => {
      console.log(`Server is running on port ${PORT}`);
      console.log(`Health check: http://localhost:${PORT}/api/health`);
    });

    server.on('error', (err) => {
      if (err.code === 'EADDRINUSE') {
        console.error(`Port ${PORT} is already in use. Set a different PORT in backend/.env or stop the process using this port.`);
      } else {
        console.error('Server error:', err);
      }
      process.exit(1);
    });
  })
  .catch(err => {
    console.error('Unable to connect to the database:', err);
  });