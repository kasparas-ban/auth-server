import request from 'supertest';
import app from '../src/app';

const correctFormData = {
  name: 'test',
  email: 'test@test.com',
  password: '12345678',
  password2: '12345678'
};

const usersDatabase = [
  {
    name: 'John',
    email: 'john@gmail.com',
    password: 'superstrongpassword!',
    password2: 'superstrongpassword!'
  },
  {
    name: 'Madelyn',
    email: 'madelyn.brick@outlook.com',
    password: 'honeybearbee39',
    password2: 'honeybearbee39'
  },
  {
    name: 'Cathy',
    email: 'ponytail50@hotmail.com',
    password: 'phonymony123',
    password2: 'phonymony123'
  },
];

jest.mock('../src/models/User', () => ({
  findOne: async (emailObj: { email: string }) => usersDatabase.find(user => user.email === emailObj.email)
}));

describe("POST /register", () => {
  describe("given correct form data", () => {
    test("should respond with a 201 status code", async () => {
      const response = await request(app).post('/register').send(correctFormData);
      expect(response.status).toBe(201);
    });
  });

  describe("given that no name was provided", () => {
    test("should respond with a 400 status code and an error message", async () => {
      const response = await request(app).post('/register').send({ ...correctFormData, name: '' });
      expect(response.status).toBe(400);
      expect(response.body).not.toBe(undefined);
    });
  });

  describe("given that no email was provided", () => {
    test("should respond with a 400 status code and an error message", async () => {
      const response = await request(app).post('/register').send({ ...correctFormData, email: '' });
      expect(response.status).toBe(400);
      expect(response.body).not.toBe(undefined);
    });
  });

  describe("given that no password was provided", () => {
    test("should respond with a 400 status code and an error message", async () => {
      const response = await request(app).post('/register').send({ ...correctFormData, password: '' });
      expect(response.status).toBe(400);
      expect(response.body).not.toBe(undefined);
    });
  });

  describe("given that no second password was provided", () => {
    test("should respond with a 400 status code and an error message", async () => {
      const response = await request(app).post('/register').send({ ...correctFormData, password2: '' });
      expect(response.status).toBe(400);
      expect(response.body).not.toBe(undefined);
    });
  });

  describe("given that the passwords do not match", () => {
    test("should respond with a 400 status code and an error message", async () => {
      const response = await request(app).post('/register').send({ ...correctFormData, password2: '123456789' });
      expect(response.status).toBe(400);
      expect(response.body).not.toBe(undefined);
    });
  });
});