const { body, param, query, validationResult } = require('express-validator');
const { isValidImageUrl } = require('../utils/bbcode');

/**
 * Middleware to handle validation errors
 */
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ 
      error: 'Validation failed', 
      details: errors.array() 
    });
  }
  next();
};

/**
 * Validate numeric ID parameter
 */
const validateId = [
  param('id').isInt({ min: 1 }).withMessage('Invalid ID'),
  handleValidationErrors
];

/**
 * Validate authentication credentials
 */
const validateLogin = [
  body('username')
    .trim()
    .isLength({ min: 3, max: 50 })
    .withMessage('Username must be 3-50 characters')
    .matches(/^[a-zA-Z0-9_-]+$/)
    .withMessage('Username can only contain letters, numbers, underscores and hyphens'),
  body('password')
    .isLength({ min: 3, max: 100 })
    .withMessage('Password must be 3-100 characters'),
  handleValidationErrors
];

/**
 * Validate password change
 */
const validatePasswordChange = [
  body('currentPassword')
    .isLength({ min: 1 })
    .withMessage('Current password is required'),
  body('newPassword')
    .isLength({ min: 6, max: 100 })
    .withMessage('New password must be 6-100 characters'),
  handleValidationErrors
];

/**
 * Validate forum topic creation
 */
const validateTopicCreation = [
  body('title')
    .trim()
    .isLength({ min: 3, max: 200 })
    .withMessage('Title must be 3-200 characters')
    .escape(),
  body('content')
    .trim()
    .isLength({ min: 1, max: 50000 })
    .withMessage('Content must be 1-50,000 characters'),
  body('poll.question')
    .optional()
    .trim()
    .isLength({ min: 3, max: 200 })
    .withMessage('Poll question must be 3-200 characters'),
  body('poll.options')
    .optional()
    .isArray({ min: 2, max: 10 })
    .withMessage('Poll must have 2-10 options'),
  body('poll.options.*')
    .optional()
    .trim()
    .isLength({ min: 1, max: 100 })
    .withMessage('Poll option must be 1-100 characters'),
  handleValidationErrors
];

/**
 * Validate forum post/reply
 */
const validatePostContent = [
  body('content')
    .trim()
    .isLength({ min: 1, max: 50000 })
    .withMessage('Content must be 1-50,000 characters'),
  handleValidationErrors
];

/**
 * Validate server creation/update
 */
const validateServer = [
  body('name')
    .trim()
    .isLength({ min: 1, max: 100 })
    .withMessage('Server name must be 1-100 characters')
    .escape(),
  body('description')
    .optional()
    .trim()
    .isLength({ max: 1000 })
    .withMessage('Description must be max 1000 characters'),
  body('ip_address')
    .trim()
    .matches(/^[a-zA-Z0-9.-]+$/)
    .withMessage('Invalid IP address or hostname'),
  body('port')
    .optional()
    .isInt({ min: 1, max: 65535 })
    .withMessage('Port must be between 1 and 65535'),
  body('bluemap_url')
    .optional()
    .trim()
    .isURL()
    .withMessage('Invalid Bluemap URL'),
  body('curseforge_url')
    .optional()
    .trim()
    .isURL()
    .withMessage('Invalid CurseForge URL'),
  handleValidationErrors
];

/**
 * Validate blog post creation/update
 */
const validateBlogPost = [
  body('title')
    .trim()
    .isLength({ min: 3, max: 200 })
    .withMessage('Title must be 3-200 characters')
    .escape(),
  body('excerpt')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Excerpt must be max 500 characters'),
  body('content')
    .trim()
    .isLength({ min: 10, max: 100000 })
    .withMessage('Content must be 10-100,000 characters'),
  body('featured_image')
    .optional()
    .trim()
    .custom((value) => {
      if (value && !isValidImageUrl(value)) {
        throw new Error('Invalid image URL. Only direct image links are allowed.');
      }
      return true;
    }),
  handleValidationErrors
];

/**
 * Validate social post creation
 */
const validateSocialPost = [
  body('content')
    .trim()
    .isLength({ min: 1, max: 5000 })
    .withMessage('Post content must be 1-5,000 characters'),
  body('image_url')
    .optional()
    .trim()
    .custom((value) => {
      if (value && !isValidImageUrl(value)) {
        throw new Error('Invalid image URL. Only direct image links from trusted hosts are allowed.');
      }
      return true;
    }),
  handleValidationErrors
];

/**
 * Validate user profile update
 */
const validateProfileUpdate = [
  body('bio')
    .optional()
    .trim()
    .isLength({ max: 1000 })
    .withMessage('Bio must be max 1000 characters'),
  body('location')
    .optional()
    .trim()
    .isLength({ max: 100 })
    .withMessage('Location must be max 100 characters')
    .escape(),
  body('website')
    .optional()
    .trim()
    .isURL()
    .withMessage('Invalid website URL'),
  handleValidationErrors
];

/**
 * Validate message sending
 */
const validateMessage = [
  body('content')
    .trim()
    .isLength({ min: 1, max: 5000 })
    .withMessage('Message must be 1-5,000 characters'),
  body('recipientId')
    .isInt({ min: 1 })
    .withMessage('Invalid recipient ID'),
  handleValidationErrors
];

/**
 * Validate search query
 */
const validateSearch = [
  query('q')
    .trim()
    .isLength({ min: 3, max: 100 })
    .withMessage('Search query must be 3-100 characters')
    .escape(),
  handleValidationErrors
];

/**
 * Validate pagination parameters
 */
const validatePagination = [
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Page must be a positive integer'),
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Limit must be between 1 and 100'),
  handleValidationErrors
];

/**
 * Validate registration
 */
const validateRegistration = [
  body('username')
    .trim()
    .isLength({ min: 3, max: 50 })
    .withMessage('Username must be 3-50 characters')
    .matches(/^[a-zA-Z0-9_-]+$/)
    .withMessage('Username can only contain letters, numbers, underscores and hyphens'),
  body('password')
    .isLength({ min: 6, max: 100 })
    .withMessage('Password must be 6-100 characters'),
  body('minecraft_username')
    .trim()
    .isLength({ min: 3, max: 16 })
    .withMessage('Minecraft username must be 3-16 characters')
    .matches(/^[a-zA-Z0-9_]+$/)
    .withMessage('Invalid Minecraft username format'),
  handleValidationErrors
];

module.exports = {
  handleValidationErrors,
  validateId,
  validateLogin,
  validatePasswordChange,
  validateTopicCreation,
  validatePostContent,
  validateServer,
  validateBlogPost,
  validateSocialPost,
  validateProfileUpdate,
  validateMessage,
  validateSearch,
  validatePagination,
  validateRegistration
};
