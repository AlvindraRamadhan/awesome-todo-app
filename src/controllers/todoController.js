const Todo = require('../models/Todo');
const User = require('../models/User');

const APIFeatures = require('../utils/apiFeatures');

// @desc    Get all todos
// @route   GET /api/todos
// @access  Private
exports.getTodos = async (req, res, next) => {
    try {
        // Base query to only get todos created by the user
        const baseQuery = Todo.find({ createdBy: req.user.id });

        const features = new APIFeatures(baseQuery, req.query)
            .filter()
            .search()
            .sort()
            .paginate();

        const todos = await features.query;

        // For pagination info
        const totalTodos = await Todo.countDocuments({ createdBy: req.user.id });
        const page = req.query.page * 1 || 1;
        const limit = req.query.limit * 1 || 100;

        res.status(200).json({
            success: true,
            count: todos.length,
            pagination: {
                currentPage: page,
                totalPages: Math.ceil(totalTodos / limit),
                totalTodos: totalTodos
            },
            data: todos,
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Server Error' });
    }
};

// @desc    Update todo status
// @route   PATCH /api/todos/:id/status
// @access  Private
exports.updateTodoStatus = async (req, res, next) => {
    try {
        let todo = await Todo.findById(req.params.id);

        if (!todo) {
            return res.status(404).json({ success: false, message: 'Todo not found' });
        }

        if (todo.createdBy.toString() !== req.user.id) {
            return res.status(401).json({ success: false, message: 'Not authorized to update this todo' });
        }

        // Validate status
        const { status } = req.body;
        if (!status || !['pending', 'in-progress', 'completed', 'cancelled'].includes(status)) {
            return res.status(400).json({ success: false, message: 'Invalid status value' });
        }

        todo.status = status;
        await todo.save();

        // Emit event
        if (todo.project) {
            req.io.to(todo.project.toString()).emit('todo:updated', todo);
        }

        res.status(200).json({ success: true, data: todo, timestamp: new Date().toISOString() });
    } catch (error) {
        res.status(400).json({ success: false, message: error.message });
    }
};

// @desc    Add an attachment to a todo
// @route   POST /api/todos/:id/attachments
// @access  Private
exports.addAttachment = async (req, res, next) => {
    try {
        const todo = await Todo.findById(req.params.id);

        if (!todo) {
            return res.status(404).json({ success: false, message: 'Todo not found' });
        }

        if (todo.createdBy.toString() !== req.user.id) {
            return res.status(401).json({ success: false, message: 'Not authorized to add attachments to this todo' });
        }

        if (!req.file) {
            return res.status(400).json({ success: false, message: 'Please upload a file' });
        }

        const attachment = {
            fileName: req.file.filename,
            filePath: req.file.path,
            fileType: req.file.mimetype
        };

        todo.attachments.push(attachment);
        await todo.save();

        res.status(200).json({
            success: true,
            data: todo.attachments,
            timestamp: new Date().toISOString()
        });

    } catch (error) {
        res.status(500).json({ success: false, message: 'Server Error' });
    }
};

// @desc    Update todo priority
// @route   PATCH /api/todos/:id/priority
// @access  Private
exports.updateTodoPriority = async (req, res, next) => {
    try {
        let todo = await Todo.findById(req.params.id);

        if (!todo) {
            return res.status(404).json({ success: false, message: 'Todo not found' });
        }

        if (todo.createdBy.toString() !== req.user.id) {
            return res.status(401).json({ success: false, message: 'Not authorized to update this todo' });
        }

        // Validate priority
        const { priority } = req.body;
        if (!priority || !['low', 'medium', 'high', 'urgent'].includes(priority)) {
            return res.status(400).json({ success: false, message: 'Invalid priority value' });
        }

        todo.priority = priority;
        await todo.save();

        // Emit event
        if (todo.project) {
            req.io.to(todo.project.toString()).emit('todo:updated', todo);
        }

        res.status(200).json({ success: true, data: todo, timestamp: new Date().toISOString() });
    } catch (error) {
        res.status(400).json({ success: false, message: error.message });
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

        // Emit event
        if (todo.project) {
            req.io.to(todo.project.toString()).emit('todo:created', todo);
        }

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

        // Emit event
        if (todo.project) {
            req.io.to(todo.project.toString()).emit('todo:updated', todo);
        }

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

        const projectId = todo.project.toString();
        const todoId = todo._id;

        await todo.deleteOne();

        // Emit event
        req.io.to(projectId).emit('todo:deleted', { id: todoId, project: projectId });

        res.status(200).json({ success: true, data: {}, timestamp: new Date().toISOString() });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Server Error' });
    }
};
