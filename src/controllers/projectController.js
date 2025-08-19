const Project = require('../models/Project');
const User = require('../models/User');

// @desc    Get all projects for a user
// @route   GET /api/projects
// @access  Private
exports.getProjects = async (req, res, next) => {
    try {
        const projects = await Project.find({
            $or: [{ owner: req.user.id }, { members: req.user.id }]
        }).populate('owner', 'username email').populate('members', 'username email');

        res.status(200).json({
            success: true,
            count: projects.length,
            data: projects,
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Server Error' });
    }
};

// @desc    Add a member to a project
// @route   POST /api/projects/:id/members
// @access  Private
exports.addMember = async (req, res, next) => {
    try {
        const project = await Project.findById(req.params.id);
        if (!project) {
            return res.status(404).json({ success: false, message: 'Project not found' });
        }

        // Make sure user is the owner
        if (project.owner.toString() !== req.user.id) {
            return res.status(401).json({ success: false, message: 'Not authorized to add members to this project' });
        }

        const { userId } = req.body;
        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ success: false, message: 'User to be added not found' });
        }

        if (project.members.includes(userId)) {
            return res.status(400).json({ success: false, message: 'User is already a member of this project' });
        }

        project.members.push(userId);
        await project.save();

        // Emit event to the project room
        req.io.to(req.params.id).emit('project:updated', project);

        res.status(200).json({ success: true, data: project.members });

    } catch (error) {
        res.status(500).json({ success: false, message: 'Server Error' });
    }
};

// @desc    Remove a member from a project
// @route   DELETE /api/projects/:id/members/:userId
// @access  Private
exports.removeMember = async (req, res, next) => {
    try {
        const project = await Project.findById(req.params.id);
        if (!project) {
            return res.status(404).json({ success: false, message: 'Project not found' });
        }

        // Make sure user is the owner
        if (project.owner.toString() !== req.user.id) {
            return res.status(401).json({ success: false, message: 'Not authorized to remove members from this project' });
        }

        const memberId = req.params.userId;

        // Prevent owner from being removed
        if (project.owner.toString() === memberId) {
            return res.status(400).json({ success: false, message: 'Cannot remove the project owner' });
        }

        project.members = project.members.filter(
            (member) => member.toString() !== memberId
        );

        await project.save();

        // Emit event to the project room
        req.io.to(req.params.id).emit('project:updated', project);

        res.status(200).json({ success: true, data: project.members });

    } catch (error) {
        res.status(500).json({ success: false, message: 'Server Error' });
    }
};

// @desc    Get single project
// @route   GET /api/projects/:id
// @access  Private
exports.getProject = async (req, res, next) => {
    try {
        const project = await Project.findById(req.params.id).populate('owner', 'username email').populate('members', 'username email');

        if (!project) {
            return res.status(404).json({ success: false, message: 'Project not found' });
        }

        // Check if user is owner or member
        const isOwner = project.owner._id.toString() === req.user.id;
        const isMember = project.members.some(member => member._id.toString() === req.user.id);

        if (!isOwner && !isMember) {
            return res.status(401).json({ success: false, message: 'Not authorized to access this project' });
        }

        res.status(200).json({ success: true, data: project, timestamp: new Date().toISOString() });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Server Error' });
    }
};

// @desc    Create new project
// @route   POST /api/projects
// @access  Private
exports.createProject = async (req, res, next) => {
    try {
        req.body.owner = req.user.id;
        // The owner is also a member by default
        req.body.members = [req.user.id];
        const project = await Project.create(req.body);
        res.status(201).json({
            success: true,
            data: project,
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        res.status(400).json({ success: false, message: error.message });
    }
};

// @desc    Update project
// @route   PUT /api/projects/:id
// @access  Private
exports.updateProject = async (req, res, next) => {
    try {
        let project = await Project.findById(req.params.id);

        if (!project) {
            return res.status(404).json({ success: false, message: 'Project not found' });
        }

        // Make sure user is the owner
        if (project.owner.toString() !== req.user.id) {
            return res.status(401).json({ success: false, message: 'Not authorized to update this project' });
        }

        project = await Project.findByIdAndUpdate(req.params.id, req.body, {
            new: true,
            runValidators: true
        });

        res.status(200).json({ success: true, data: project, timestamp: new Date().toISOString() });
    } catch (error) {
        res.status(400).json({ success: false, message: error.message });
    }
};

// @desc    Delete project
// @route   DELETE /api/projects/:id
// @access  Private
exports.deleteProject = async (req, res, next) => {
    try {
        const project = await Project.findById(req.params.id);

        if (!project) {
            return res.status(404).json({ success: false, message: 'Project not found' });
        }

        // Make sure user is the owner
        if (project.owner.toString() !== req.user.id) {
            return res.status(401).json({ success: false, message: 'Not authorized to delete this project' });
        }

        await project.deleteOne();
        // Bonus: Also delete all todos associated with this project
        // await Todo.deleteMany({ project: req.params.id });

        res.status(200).json({ success: true, data: {}, timestamp: new Date().toISOString() });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Server Error' });
    }
};
