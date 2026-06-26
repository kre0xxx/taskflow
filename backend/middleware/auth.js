const jwt = require('jsonwebtoken');
const { User } = require('../models');
const { getAuthToken } = require('../utils/authCookie');

// Константы для сообщений об ошибках
const ERROR_MESSAGES = {
  NO_TOKEN: 'Требуется авторизация. Пожалуйста, войдите в систему.',
  INVALID_TOKEN: 'Недействительный токен. Пожалуйста, войдите снова.',
  USER_NOT_FOUND: 'Пользователь не найден. Пожалуйста, войдите снова.',
  TOKEN_EXPIRED: 'Срок действия токена истек. Пожалуйста, войдите снова.',
  ADMIN_REQUIRED: 'Доступ запрещен. Требуются права администратора.',
  AUTH_FAILED: 'Ошибка авторизации. Пожалуйста, попробуйте снова.'
};

// Основная функция авторизации
const auth = async (req, res, next) => {
  try {
    // Получаем токен из заголовка или cookie
    const authHeader = req.header('Authorization');
    let token = null;

    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.replace('Bearer ', '');
    } else {
      token = getAuthToken(req);
    }
    
    if (!token || token.trim() === '') {
      console.warn('⚠️ No auth token provided in header or cookie');
      return res.status(401).json({ 
        message: ERROR_MESSAGES.NO_TOKEN,
        code: 'NO_TOKEN'
      });
    }
    
    if (!token || token.trim() === '') {
      console.warn('⚠️ Empty token provided');
      return res.status(401).json({ 
        message: ERROR_MESSAGES.NO_TOKEN,
        code: 'EMPTY_TOKEN'
      });
    }

    // Проверяем наличие секрета
    const jwtSecret = process.env.JWT_SECRET;
    if (!jwtSecret) {
      console.error('❌ JWT_SECRET is not defined in environment variables');
      return res.status(500).json({ 
        message: 'Ошибка конфигурации сервера',
        code: 'SERVER_CONFIG_ERROR'
      });
    }

    // Верифицируем токен
    let decoded;
    try {
      decoded = jwt.verify(token, jwtSecret);
    } catch (jwtError) {
      if (jwtError.name === 'TokenExpiredError') {
        console.warn('⚠️ Token expired:', jwtError.message);
        return res.status(401).json({ 
          message: ERROR_MESSAGES.TOKEN_EXPIRED,
          code: 'TOKEN_EXPIRED',
          expiredAt: jwtError.expiredAt
        });
      }
      
      if (jwtError.name === 'JsonWebTokenError') {
        console.warn('⚠️ Invalid token:', jwtError.message);
        return res.status(401).json({ 
          message: ERROR_MESSAGES.INVALID_TOKEN,
          code: 'INVALID_TOKEN'
        });
      }
      
      throw jwtError; // Пробрасываем другие ошибки
    }

    // Проверяем наличие userId в токене
    if (!decoded || !decoded.userId) {
      console.warn('⚠️ Token missing userId:', decoded);
      return res.status(401).json({ 
        message: ERROR_MESSAGES.INVALID_TOKEN,
        code: 'MISSING_USER_ID'
      });
    }

    // Получаем пользователя из базы данных
    const user = await User.findByPk(decoded.userId, {
      attributes: ['id', 'username', 'email', 'role', 'telegramChatId']
    });
    
    if (!user) {
      console.warn(`⚠️ User not found for ID: ${decoded.userId}`);
      return res.status(401).json({ 
        message: ERROR_MESSAGES.USER_NOT_FOUND,
        code: 'USER_NOT_FOUND'
      });
    }

    // Добавляем пользователя в запрос
    req.user = user;
    req.userId = user.id;
    req.token = token;
    
    // Логируем успешную авторизацию (опционально)
    console.log(`✅ User ${user.username} (${user.id}) authenticated successfully`);
    
    next();
  } catch (error) {
    console.error('❌ Auth middleware error:', error);
    res.status(500).json({ 
      message: ERROR_MESSAGES.AUTH_FAILED,
      code: 'SERVER_ERROR'
    });
  }
};

// Middleware для проверки прав администратора
const adminAuth = async (req, res, next) => {
  try {
    // Сначала выполняем обычную авторизацию
    await new Promise((resolve, reject) => {
      auth(req, res, (err) => {
        if (err) reject(err);
        else resolve();
      });
    });

    // Проверяем наличие пользователя
    if (!req.user) {
      console.warn('⚠️ No user found after auth middleware');
      return res.status(401).json({ 
        message: ERROR_MESSAGES.AUTH_FAILED,
        code: 'NO_USER'
      });
    }

    // Проверяем роль администратора
    if (req.user.role !== 'admin') {
      console.warn(`⚠️ Access denied for user ${req.user.id} (role: ${req.user.role})`);
      return res.status(403).json({ 
        message: ERROR_MESSAGES.ADMIN_REQUIRED,
        code: 'ADMIN_REQUIRED'
      });
    }

    console.log(`✅ Admin user ${req.user.username} authorized`);
    next();
  } catch (error) {
    console.error('❌ Admin auth middleware error:', error);
    
    // Если ошибка уже обработана в auth middleware, не отправляем повторно
    if (!res.headersSent) {
      res.status(500).json({ 
        message: ERROR_MESSAGES.AUTH_FAILED,
        code: 'SERVER_ERROR'
      });
    }
  }
};

// Middleware для опциональной авторизации (не требует токена, но добавляет пользователя если есть)
const optionalAuth = async (req, res, next) => {
  try {
    const authHeader = req.header('Authorization');
    let token = null;

    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.replace('Bearer ', '');
    } else {
      token = getAuthToken(req);
    }
    
    if (token) {
      try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const user = await User.findByPk(decoded.userId, {
          attributes: ['id', 'username', 'email', 'role', 'telegramChatId']
        });
        
        if (user) {
          req.user = user;
          req.userId = user.id;
        }
      } catch (jwtError) {
        // Игнорируем ошибки токена при опциональной авторизации
        console.log('Optional auth: invalid token provided');
      }
    }
    
    next();
  } catch (error) {
    console.error('Optional auth error:', error);
    next(); // Продолжаем даже при ошибке
  }
};

// Middleware для проверки прав доступа к конкретному ресурсу
const resourceAccess = (resourceType) => {
  return async (req, res, next) => {
    try {
      const userId = req.user.id;
      const resourceId = req.params.id;

      // Определяем модель в зависимости от типа ресурса
      let model;
      switch (resourceType) {
        case 'task':
          model = require('../models').Task;
          break;
        default:
          return next();
      }

      const resource = await model.findByPk(resourceId);

      if (!resource) {
        return res.status(404).json({ 
          message: 'Ресурс не найден',
          code: 'RESOURCE_NOT_FOUND'
        });
      }

      // Проверяем права доступа
      if (req.user.role === 'admin' || resource.assignedTo === userId || resource.createdBy === userId) {
        next();
      } else {
        console.warn(`⚠️ Access denied to resource ${resourceId} for user ${userId}`);
        res.status(403).json({ 
          message: 'У вас нет прав доступа к этому ресурсу',
          code: 'ACCESS_DENIED'
        });
      }
    } catch (error) {
      console.error('Resource access error:', error);
      res.status(500).json({ 
        message: 'Ошибка проверки прав доступа',
        code: 'SERVER_ERROR'
      });
    }
  };
};

module.exports = { 
  auth, 
  adminAuth,
  optionalAuth,
  resourceAccess 
};