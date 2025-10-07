const request = require('supertest');
const express = require('express');
const authRoutes = require('../routes/auth');
const { initializeDatabase } = require('../database/init');

// Create a test app
const app = express();
app.use(express.json());
app.use('/api/auth', authRoutes);

// Setup test database
beforeAll(() => {
  process.env.DATABASE_PATH = ':memory:'; // Use in-memory database for tests
  initializeDatabase();
});

describe('Authentication API', () => {
  describe('POST /api/auth/login', () => {
    test('should login with valid credentials', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({
          username: 'admin',
          password: 'admin'
        });
      
      expect(res.statusCode).toBe(200);
      expect(res.body).toHaveProperty('token');
      expect(res.body).toHaveProperty('user');
      expect(res.body.user.username).toBe('admin');
    });
    
    test('should reject invalid credentials', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({
          username: 'admin',
          password: 'wrongpassword'
        });
      
      expect(res.statusCode).toBe(401);
      expect(res.body).toHaveProperty('error');
    });
    
    test('should reject missing username', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({
          password: 'admin'
        });
      
      expect(res.statusCode).toBe(400);
    });
    
    test('should reject missing password', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({
          username: 'admin'
        });
      
      expect(res.statusCode).toBe(400);
    });
  });
  
  describe('GET /api/auth/verify', () => {
    let token;
    
    beforeAll(async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({
          username: 'admin',
          password: 'admin'
        });
      token = res.body.token;
    });
    
    test('should verify valid token', async () => {
      const res = await request(app)
        .get('/api/auth/verify')
        .set('Authorization', `Bearer ${token}`);
      
      expect(res.statusCode).toBe(200);
      expect(res.body).toHaveProperty('user');
    });
    
    test('should reject invalid token', async () => {
      const res = await request(app)
        .get('/api/auth/verify')
        .set('Authorization', 'Bearer invalid-token');
      
      expect(res.statusCode).toBe(401);
    });
    
    test('should reject missing token', async () => {
      const res = await request(app)
        .get('/api/auth/verify');
      
      expect(res.statusCode).toBe(401);
    });
  });
});
