const request = require('supertest');
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const app = require('../src/app');
const User = require('../src/models/User');
const Todo = require('../src/models/Todo');

let mongoServer;

beforeAll(async () => {
    mongoServer = await MongoMemoryServer.create();
    const mongoUri = mongoServer.getUri();
    await mongoose.connect(mongoUri);
});

afterAll(async () => {
    await mongoose.disconnect();
    await mongoServer.stop();
});

describe('Todo API', () => {
    let token;
    let userId;

    beforeEach(async () => {
        // Clean collections before each test
        await User.deleteMany({});
        await Todo.deleteMany({});

        // Create a test user
        const user = new User({
            username: 'todo-user',
            email: 'todo@example.com',
            password: 'password123',
        });
        await user.save();
        userId = user._id;

        // Log in to get token
        const res = await request(app)
            .post('/api/auth/login')
            .send({ email: 'todo@example.com', password: 'password123' });
        token = res.body.token;
    });

    it('should create a new todo for an authenticated user', async () => {
        const res = await request(app)
            .post('/api/todos')
            .set('Authorization', `Bearer ${token}`)
            .send({ title: 'Test Todo' });

        expect(res.statusCode).toEqual(201);
        expect(res.body.success).toBe(true);
        expect(res.body.data.title).toBe('Test Todo');
    });

    it('should not create a todo for an unauthenticated user', async () => {
        const res = await request(app)
            .post('/api/todos')
            .send({ title: 'Test Todo' });

        expect(res.statusCode).toEqual(401);
    });

    it('should get all todos for the logged-in user', async () => {
        await Todo.create({ title: 'Todo 1', createdBy: userId });
        await Todo.create({ title: 'Todo 2', createdBy: userId });

        const res = await request(app)
            .get('/api/todos')
            .set('Authorization', `Bearer ${token}`);

        expect(res.statusCode).toEqual(200);
        expect(res.body.count).toBe(2);
    });
});
