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

module.exports = router;
