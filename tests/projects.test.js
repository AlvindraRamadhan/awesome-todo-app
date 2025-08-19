const request = require('supertest');
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const app = require('../src/app');
const User = require('../src/models/User');
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
});

describe('Project API', () => {
    let token;
    let user;
    let otherUser;

    beforeEach(async () => {
        await User.deleteMany({});
        await Project.deleteMany({});

        user = new User({ username: 'project-owner', email: 'owner@example.com', password: 'password123' });
        await user.save();

        otherUser = new User({ username: 'member', email: 'member@example.com', password: 'password123' });
        await otherUser.save();

        const res = await request(app).post('/api/auth/login').send({ email: 'owner@example.com', password: 'password123' });
        token = res.body.token;
    });

    it('should create a new project', async () => {
        const res = await request(app)
            .post('/api/projects')
            .set('Authorization', `Bearer ${token}`)
            .send({ name: 'New Test Project' });

        expect(res.statusCode).toEqual(201);
        expect(res.body.data.name).toBe('New Test Project');
        expect(res.body.data.owner).toBe(user._id.toString());
    });

    it('should get all projects for a user', async () => {
        await Project.create({ name: 'Project 1', owner: user._id });

        const res = await request(app)
            .get('/api/projects')
            .set('Authorization', `Bearer ${token}`);

        expect(res.statusCode).toEqual(200);
        expect(res.body.count).toBe(1);
    });

    it('should add a member to a project', async () => {
        const project = await Project.create({ name: 'Project To Add Member', owner: user._id });

        const res = await request(app)
            .post(`/api/projects/${project._id}/members`)
            .set('Authorization', `Bearer ${token}`)
            .send({ userId: otherUser._id });

        expect(res.statusCode).toEqual(200);
        expect(res.body.data).toContain(otherUser._id.toString());
    });

    it('should remove a member from a project', async () => {
        const project = await Project.create({ name: 'Project To Remove Member', owner: user._id, members: [user._id, otherUser._id] });

        const res = await request(app)
            .delete(`/api/projects/${project._id}/members/${otherUser._id}`)
            .set('Authorization', `Bearer ${token}`);

        expect(res.statusCode).toEqual(200);
        expect(res.body.data).not.toContain(otherUser._id.toString());
    });

    it('should not allow non-owners to add members', async () => {
        const project = await Project.create({ name: 'Another Project', owner: otherUser._id });

        const res = await request(app)
            .post(`/api/projects/${project._id}/members`)
            .set('Authorization', `Bearer ${token}`) // Authenticated as 'user', not 'otherUser'
            .send({ userId: user._id });

        expect(res.statusCode).toEqual(401);
    });
});
