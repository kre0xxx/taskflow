const { Sequelize } = require('sequelize');
const config = require('../config/config.json').development;

const sequelize = new Sequelize(config.database, config.username, config.password, {
  host: config.host,
  dialect: config.dialect,
  logging: false // Можно включить console.log для отладки SQL
});

const db = {};

db.Sequelize = Sequelize;
db.sequelize = sequelize;

// Импорт моделей
db.User = require('./User')(sequelize, Sequelize);
db.Task = require('./Task')(sequelize, Sequelize);
// Добавляем TimeTracking, если он есть
try {
  db.TimeTracking = require('./TimeTracking')(sequelize, Sequelize);
} catch (error) {
  console.log('TimeTracking model not found, skipping...');
}

// Ассоциации User
db.User.hasMany(db.Task, { 
  foreignKey: 'assignedTo', 
  as: 'assignedTasks' 
});

db.User.hasMany(db.Task, { 
  foreignKey: 'completedBy', 
  as: 'completedTasks' 
});

db.User.hasMany(db.Task, { 
  foreignKey: 'createdBy', 
  as: 'createdTasks' 
});

// Ассоциации Task
db.Task.belongsTo(db.User, { 
  foreignKey: 'assignedTo', 
  as: 'assignee' 
});

db.Task.belongsTo(db.User, { 
  foreignKey: 'completedBy', 
  as: 'completer' 
});

db.Task.belongsTo(db.User, { 
  foreignKey: 'createdBy', 
  as: 'creator' 
});

// Ассоциации TimeTracking (если модель существует)
if (db.TimeTracking) {
  db.TimeTracking.belongsTo(db.Task, {
    foreignKey: 'taskId',
    as: 'task'
  });
  
  db.TimeTracking.belongsTo(db.User, {
    foreignKey: 'userId',
    as: 'user'
  });
  
  db.Task.hasMany(db.TimeTracking, {
    foreignKey: 'taskId',
    as: 'timeTrackings'
  });
  
  db.User.hasMany(db.TimeTracking, {
    foreignKey: 'userId',
    as: 'timeEntries'
  });
}

// Функция для синхронизации с опциями
db.sync = async (options = {}) => {
  try {
    await sequelize.authenticate();
    console.log('✅ Database connection established successfully.');
    
    await sequelize.sync(options);
    console.log('✅ Database synchronized successfully.');
    
    return true;
  } catch (error) {
    console.error('❌ Database error:', error);
    throw error;
  }
};

// Функция для очистки базы (только для разработки!)
db.clearDatabase = async () => {
  if (process.env.NODE_ENV === 'production') {
    throw new Error('Cannot clear database in production mode');
  }
  
  await sequelize.sync({ force: true });
  console.log('✅ Database cleared and recreated.');
};

// Проверка подключения при инициализации
(async () => {
  try {
    await sequelize.authenticate();
    console.log('📊 Database connection established.');
  } catch (error) {
    console.error('❌ Unable to connect to database:', error);
  }
})();

module.exports = db;