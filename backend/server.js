const express = require('express');
const cors = require('cors');
require('dotenv').config();

const db = require('./models');
// const notificationScheduler = require('./services/notificationScheduler'); // Временно отключено

const app = express();
const PORT = process.env.PORT || 5002;

// CORS configuration for tunnel support
const getCorsOptions = () => {
  const allowedOrigins = [
    'http://localhost:3000',
    'http://localhost:5175',
    'http://127.0.0.1:5175',
    'http://127.0.0.1:3000',
    process.env.VITE_FRONTEND_URL || 'http://localhost:5175'
  ];
  
  // Allow tunnel URLs: *.tunnel.vscode.dev and similar patterns
  const tunnelPattern = /^https?:\/\/[a-zA-Z0-9-]+\.([a-zA-Z0-9-]+\.)*vscode\.dev(:[0-9]+)?$/;
  
  return {
    origin: (origin, callback) => {
      // Allow requests without origin (mobile apps, curl requests, etc.)
      if (!origin) return callback(null, true);
      
      if (allowedOrigins.includes(origin) || tunnelPattern.test(origin)) {
        callback(null, true);
      } else {
        console.warn(`CORS blocked request from: ${origin}`);
        callback(new Error('Not allowed by CORS'));
      }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
  };
};

// Middleware
app.use(cors(getCorsOptions()));
app.use(express.json());

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/tasks', require('./routes/tasks'));
app.use('/api/users', require('./routes/users'));
// app.use('/api/telegram', require('./routes/telegram')); // Временно отключено

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
    
    // Запускаем планировщик уведомлений (временно отключено)
    // notificationScheduler.start();
    // console.log('Notification scheduler started');
    console.log('ℹ️ Telegram notification scheduler is temporarily disabled');
    
    const server = app.listen(PORT, '0.0.0.0', () => {
      console.log(`Server is running on port ${PORT}`);
      console.log(`Health check: http://localhost:${PORT}/api/health`);
      console.log(`Local network access: http://127.0.0.1:${PORT}/api/health`);
      console.log(`VSCode Tunnel support enabled`);
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