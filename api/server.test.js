const db = require('../data/dbConfig');
const server = require('./server');
const request = require('supertest');
const jokes = require('./jokes/jokes-data');

beforeAll(async () => {
  await db.migrate.rollback();
  await db.migrate.latest();
})

beforeEach(async () => {
  await db('users').truncate();
})

test('sanity', () => {
  expect(true).toBe(true);
})

describe('makes sure all the endpoints work', () => {

  describe('auth router', () => {
    test('[POST] /register responds with "username and password required" if not in the request body', async () => {
      let uResult = await request(server).post('/api/auth/register').send({password: 'password'});
      expect(uResult.status).toBe(400);
      expect(uResult.body.customMessage).toBe('username and password required');

      let pResult = await request(server).post('/api/auth/register').send({username: 'username'});
      expect(pResult.status).toBe(400);
      expect(pResult.body.customMessage).toBe('username and password required');
    })

    test('[POST] /register responds with "username taken" if the username is already taken', async () => {
      await request(server).post('/api/auth/register').send({username: 'username', password: 'password'});
      let result = await request(server).post('/api/auth/register').send({username: 'username', password: 'foobar'});
      expect(result.status).toBe(400);
      expect(result.body.customMessage).toBe('username taken');
    })

    test('[POST] /register responds with the new user if the request is successful', async () => {
      let result = await request(server).post('/api/auth/register').send({username: 'Captain Marvel', password: 'foobar'});
      result.body.password = 'foobar';
      expect(result.status).toBe(201);
      expect(result.body).toEqual({id: 1, username: 'Captain Marvel', password: 'foobar'});
    })

    test('[POST] /login responds with "username and password required" if not in the request body', async () => {
      let uResult = await request(server).post('/api/auth/login').send({password: 'password'});
      expect(uResult.status).toBe(400);
      expect(uResult.body.customMessage).toBe('username and password required');

      let pResult = await request(server).post('/api/auth/login').send({username: 'username'});
      expect(pResult.status).toBe(400);
      expect(pResult.body.customMessage).toBe('username and password required');
    })

    test('[POST] /login responds with "invalid credentials" if the username or password is incorrect', async () => {
      await request(server).post('/api/auth/register').send({username: 'Captain Marvel', password: 'foobar'});

      let uResult = await request(server).post('/api/auth/login').send({username: 'Marvel', password: 'foobar'});
      expect(uResult.status).toBe(401);
      expect(uResult.body.customMessage).toBe('invalid credentials');

      let pResult = await request(server).post('/api/auth/login').send({username: 'Captain Marvel', password: 'foo'});
      expect(pResult.status).toBe(401);
      expect(pResult.body.customMessage).toBe('invalid credentials');
    })

    test('[POST] /login responds with the welcome message and token on successful login', async () => {
      await request(server).post('/api/auth/register').send({username: 'Captain Marvel', password: 'foobar'});
      let result = await request(server).post('/api/auth/login').send({username: 'Captain Marvel', password: 'foobar'});
      expect(result.status).toBe(200);
      expect(result.body.message).toBe('welcome, Captain Marvel');
      expect(result.body.token).toBeTruthy();
    })
  })

  describe('jokes router', () => {
    test('[GET] /jokes responds with token required when there is no token in header', async () => {
      let result = await request(server).get('/api/jokes');
      expect(result.status).toBe(401);
      expect(result.body.message).toBe('token required');
    })

    test('[GET] /jokes responds with token invalid when the token is not able to be verified', async () => {
      let result = await request(server).get('/api/jokes').set({authorization: 'real token'});
      expect(result.status).toBe(401);
      expect(result.body.message).toBe('token invalid');
    })

    test('[GET] /jokes responds with those awful dad jokes', async () => {
      await request(server).post('/api/auth/register').send({username: 'Captain Marvel', password: 'foobar'});
      let tokenResult = await request(server).post('/api/auth/login').send({username: 'Captain Marvel', password: 'foobar'});
      let result = await request(server).get('/api/jokes').set({authorization: tokenResult.body.token});
      expect(result.status).toBe(200);
      expect(result.body).toEqual(jokes);
    })
  })

})
