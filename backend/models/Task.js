module.exports = (sequelize, DataTypes) => {
  const Task = sequelize.define('Task', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    title: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: {
        notEmpty: true,
        len: [3, 255]
      }
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    status: {
      type: DataTypes.ENUM('new', 'in-progress', 'completed', 'review', 'blocked'),
      defaultValue: 'new'
    },
    priority: {
      type: DataTypes.ENUM('low', 'medium', 'high'),
      defaultValue: 'medium'
    },
    dueDate: {
      type: DataTypes.DATE,
      allowNull: true,
      validate: {
        isDate: true
      }
    },
    assignedTo: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'users',
        key: 'id'
      }
    },
    completedAt: {
      type: DataTypes.DATE,
      allowNull: true
    },
    completedBy: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'users',
        key: 'id'
      }
    },
    timeEstimate: {
      type: DataTypes.INTEGER, // в минутах
      allowNull: true
    },
    timeSpent: {
      type: DataTypes.INTEGER, // в минутах
      defaultValue: 0
    },
    tags: {
      type: DataTypes.JSON,
      allowNull: true,
      defaultValue: []
    },
    attachments: {
      type: DataTypes.JSON,
      allowNull: true,
      defaultValue: []
    }
  }, {
    tableName: 'tasks',
    timestamps: true,
    hooks: {
      beforeUpdate: (task, options) => {
        if (task.changed('status') && task.status === 'completed') {
          task.completedAt = new Date();
          task.completedBy = task.assignedTo;
        }
        
        // Если задача возвращается из completed в другой статус
        if (task.changed('status') && task.status !== 'completed' && task._previousDataValues.status === 'completed') {
          task.completedAt = null;
          task.completedBy = null;
        }
      }
    }
  });

  Task.associate = function(models) {
    Task.belongsTo(models.User, {
      foreignKey: 'assignedTo',
      as: 'assignee'
    });
    Task.belongsTo(models.User, {
      foreignKey: 'completedBy',
      as: 'completer'
    });
    Task.belongsTo(models.User, {
      foreignKey: 'createdBy',
      as: 'creator'
    });
  };

  return Task;
};