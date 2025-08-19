const mongoose = require('mongoose');

const SubtaskSchema = new mongoose.Schema({
    title: {
        type: String,
        required: true,
        trim: true
    },
    isCompleted: {
        type: Boolean,
        default: false
    }
});

const AttachmentSchema = new mongoose.Schema({
    fileName: { type: String, required: true },
    filePath: { type: String, required: true },
    fileType: { type: String },
    uploadedAt: { type: Date, default: Date.now }
});

const CommentSchema = new mongoose.Schema({
    user: { type: mongoose.Schema.ObjectId, ref: 'User', required: true },
    message: { type: String, required: true },
    createdAt: { type: Date, default: Date.now }
});

const TodoSchema = new mongoose.Schema({
    title: {
        type: String,
        required: [true, 'Please add a title'],
        trim: true,
        maxlength: [100, 'Title cannot be more than 100 characters']
    },
    description: {
        type: String,
        maxlength: [1000, 'Description cannot be more than 1000 characters']
    },
    status: {
        type: String,
        enum: ['pending', 'in-progress', 'completed', 'cancelled'],
        default: 'pending'
    },
    priority: {
        type: String,
        enum: ['low', 'medium', 'high', 'urgent'],
        default: 'medium'
    },
    dueDate: {
        type: Date
    },
    completedAt: {
        type: Date
    },
    estimatedTime: { // in minutes
        type: Number
    },
    actualTime: { // in minutes
        type: Number
    },
    tags: [String],
    project: {
        type: mongoose.Schema.ObjectId,
        ref: 'Project',
        required: true
    },
    createdBy: {
        type: mongoose.Schema.ObjectId,
        ref: 'User',
        required: true
    },
    assignedTo: {
        type: mongoose.Schema.ObjectId,
        ref: 'User'
    },
    subtasks: [SubtaskSchema],
    attachments: [AttachmentSchema],
    comments: [CommentSchema],
}, {
    timestamps: true
});

// When status is changed to 'completed', set the completedAt date
TodoSchema.pre('save', function(next) {
    if (this.isModified('status') && this.status === 'completed') {
        this.completedAt = new Date();
    }
    next();
});


module.exports = mongoose.model('Todo', TodoSchema);
