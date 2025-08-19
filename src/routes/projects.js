const express = require('express');
const {
    getProjects,
    getProject,
    createProject,
    updateProject,
    deleteProject
} = require('../controllers/projectController');

const router = express.Router();

const { protect } = require('../middleware/authMiddleware');

// All routes are protected
router.use(protect);

router.route('/')
    .get(getProjects)
    .post(createProject);

router.route('/:id')
    .get(getProject)
    .put(updateProject)
    .delete(deleteProject);

const { addMember, removeMember } = require('../controllers/projectController');

router.route('/:id/members')
    .post(addMember);

router.route('/:id/members/:userId')
    .delete(removeMember);

module.exports = router;
