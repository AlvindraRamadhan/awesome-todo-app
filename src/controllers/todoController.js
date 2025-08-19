const Todo = require('../models/Todo');
const User = require('../models/User');

// @desc    Get all todos
// @route   GET /api/todos
// @access  Private
exports.getTodos = async (req, res, next) => {
    try {
        const todos = await Todo.find({ createdBy: req.user.id });
        res.status(200).json({
            success: true,
            count: todos.length,
            data: todos,
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Server Error' });
    }
};

// @desc    Get single todo
// @route   GET /api/todos/:id
// @access  Private
exports.getTodo = async (req, res, next) => {
    try {
        const todo = await Todo.findById(req.params.id);

        if (!todo) {
            return res.status(404).json({ success: false, message: 'Todo not found' });
        }

        // Make sure user is the owner
        if (todo.createdBy.toString() !== req.user.id) {
            return res.status(401).json({ success: false, message: 'Not authorized to view this todo' });
        }

        res.status(200).json({ success: true, data: todo, timestamp: new Date().toISOString() });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Server Error' });
    }
};

// @desc    Create new todo
// @route   POST /api/todos
// @access  Private
exports.createTodo = async (req, res, next) => {
    try {
        req.body.createdBy = req.user.id;
        const todo = await Todo.create(req.body);
        res.status(201).json({
            success: true,
            data: todo,
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        res.status(400).json({ success: false, message: error.message });
    }
};

// @desc    Update todo
// @route   PUT /api/todos/:id
// @access  Private
exports.updateTodo = async (req, res, next) => {
    try {
        let todo = await Todo.findById(req.params.id);

        if (!todo) {
            return res.status(404).json({ success: false, message: 'Todo not found' });
        }

        // Make sure user is the owner
        if (todo.createdBy.toString() !== req.user.id) {
            return res.status(401).json({ success: false, message: 'Not authorized to update this todo' });
        }

        todo = await Todo.findByIdAndUpdate(req.params.id, req.body, {
            new: true,
            runValidators: true
        });

        res.status(200).json({ success: true, data: todo, timestamp: new Date().toISOString() });
    } catch (error) {
        res.status(400).json({ success: false, message: error.message });
    }
};

// @desc    Delete todo
// @route   DELETE /api/todos/:id
// @access  Private
exports.deleteTodo = async (req, res, next) => {
    try {
        const todo = await Todo.findById(req.params.id);

        if (!todo) {
            return res.status(404).json({ success: false, message: 'Todo not found' });
        }

        // Make sure user is the owner
        if (todo.createdBy.toString() !== req.user.id) {
            return res.status(401).json({ success: false, message: 'Not authorized to delete this todo' });
        }

        await todo.deleteOne();

        res.status(200).json({ success: true, data: {}, timestamp: new Date().toISOString() });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Server Error' });
    }
};
