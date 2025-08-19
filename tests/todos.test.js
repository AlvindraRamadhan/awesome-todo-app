const request = require('supertest');
const mongoose = require('mongoose');
const path = require('path');
const fs = require('fs');
const { MongoMemoryServer } = require('mongodb-memory-server');
const app = require('../src/app');
const User = require('../src/models/User');
const Todo = require('../src/models/Todo');
const Project = require('../src/models/Project');

let mongoServer;

beforeAll(async () => {
    mongoServer = await MongoMemoryServer.create();
    const mongoUri = mongoServer.getUri();
    await mongoose.connect(mongoUri);
});

afterAll(async () => {
    await mongoose.disconnect();
    await mongoServer.stop();
    // Clean up uploads folder
    const uploadsDir = path.join(__dirname, '../uploads');
    if (fs.existsSync(uploadsDir)) {
        fs.rmSync(uploadsDir, { recursive: true, force: true });
    }
});

describe('Todo API Advanced Features', () => {
    let token;
    let userId;
    let projectId;

    beforeEach(async () => {
        await User.deleteMany({});
        await Todo.deleteMany({});
        await Project.deleteMany({});

        const user = new User({ username: 'todo-user', email: 'todo@example.com', password: 'password123' });
        await user.save();
        userId = user._id;

        const project = await Project.create({ name: 'Test Project', owner: userId });
        projectId = project._id;

        const res = await request(app).post('/api/auth/login').send({ email: 'todo@example.com', password: 'password123' });
        token = res.body.token;
    });

    it('should create a todo with priority and project', async () => {
        const res = await request(app)
            .post('/api/todos')
            .set('Authorization', `Bearer ${token}`)
            .send({ title: 'Urgent Todo', priority: 'urgent', project: projectId });

        expect(res.statusCode).toEqual(201);
        expect(res.body.data.priority).toBe('urgent');
        expect(res.body.data.project).toBe(projectId.toString());
    });

    it('should update a todo status via PATCH', async () => {
        const todo = await Todo.create({ title: 'To Complete', createdBy: userId, project: projectId });

        const res = await request(app)
            .patch(`/api/todos/${todo._id}/status`)
            .set('Authorization', `Bearer ${token}`)
            .send({ status: 'completed' });

        expect(res.statusCode).toEqual(200);
        expect(res.body.data.status).toBe('completed');
        expect(res.body.data.completedAt).toBeDefined();
    });

    it('should filter todos by status', async () => {
        await Todo.create({ title: 'Pending Todo', status: 'pending', createdBy: userId, project: projectId });
        await Todo.create({ title: 'Completed Todo', status: 'completed', createdBy: userId, project: projectId });

        const res = await request(app)
            .get('/api/todos?status=completed')
            .set('Authorization', `Bearer ${token}`);

        expect(res.statusCode).toEqual(200);
        expect(res.body.count).toBe(1);
        expect(res.body.data[0].status).toBe('completed');
    });

    it('should upload an attachment to a todo', async () => {
        const todo = await Todo.create({ title: 'Todo with attachment', createdBy: userId, project: projectId });
        const filePath = path.join(__dirname, 'test-file.txt');
        fs.writeFileSync(filePath, 'This is a test file.');

        const res = await request(app)
            .post(`/api/todos/${todo._id}/attachments`)
            .set('Authorization', `Bearer ${token}`)
            .attach('attachment', filePath);

        expect(res.statusCode).toEqual(200);
        expect(res.body.success).toBe(true);
        expect(res.body.data).toHaveLength(1);
        expect(res.body.data[0].fileName).toMatch(/attachment-\d+-test-file.txt/);

        fs.unlinkSync(filePath); // Clean up the test file
    });
});
