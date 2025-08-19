const express = require('express');
const {
    getTodos,
    getTodo,
    createTodo,
    updateTodo,
    deleteTodo
} = require('../controllers/todoController');
const { check, validationResult } = require('express-validator');
const { protect } = require('../middleware/authMiddleware');

const router = express.Router();

const validateTodo = [
    check('title', 'Title is required').not().isEmpty().trim()
];

const validateRequest = (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({
            success: false,
            message: 'Validation failed',
            errors: errors.array(),
            timestamp: new Date().toISOString()
        });
    }
    next();
};

router.route('/')
    .get(protect, getTodos)
    .post(protect, validateTodo, validateRequest, createTodo);

router.route('/:id')
    .get(protect, getTodo)
    .put(protect, validateTodo, validateRequest, updateTodo)
    .delete(protect, deleteTodo);

const { updateTodoStatus, updateTodoPriority } = require('../controllers/todoController');

router.route('/:id/status')
    .patch(protect, updateTodoStatus);

router.route('/:id/priority')
    .patch(protect, updateTodoPriority);

const { addAttachment } = require('../controllers/todoController');
const upload = require('../middleware/upload');

router.route('/:id/attachments')
    .post(protect, (req, res, next) => {
        upload(req, res, (err) => {
            if (err) {
                return res.status(400).json({ success: false, message: err });
            }
            next();
        });
    }, addAttachment);

module.exports = router;
