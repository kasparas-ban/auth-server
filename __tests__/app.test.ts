import request from 'supertest';
import app from '../src/app';
import User from '../src/models/User';

const correctFormData = {
  name: 'test',
  email: 'test@test.com',
  password: '1234567890',
  password2: '1234567890'
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
    password: 'honeybearbee39?',
    password2: 'honeybearbee39?'
  },
  {
    name: 'Cathy',
    email: 'ponytail50@hotmail.com',
    password: 'phonymony123%',
    password2: 'phonymony123%'
  },
];

jest.mock('../src/models/User', () => ({
  findOne: jest.fn(async (emailObj: { email: string }) => usersDatabase.find(user => user.email === emailObj.email))
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
      console.log('RESPONSE: \n\n', response.body.errors.length);
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

  describe("given that password is too short", () => {
    test("should respond with a 400 status code and an error message", async () => {
      const response = await request(app).post('/register').send({ ...correctFormData, password: '123', password2: '123' });
      expect(response.status).toBe(400);
      expect(response.body).not.toBe(undefined);
    });
  });

  describe("given that the email already exists in the database", () => {
    test("should respond with a 400 status code and an error message", async () => {
      const response = await request(app).post('/register').send(usersDatabase[0]);
      expect(response.status).toBe(400);
      expect(response.body).not.toBe(undefined);
    });
  });

  describe("given that the database if offline", () => {
    test("should respond with a 500 status code and an error message", async () => {
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      User.findOne = async () => { throw new Error('No database connection') };

      const response = await request(app).post('/register').send(correctFormData);
      expect(response.status).toBe(500);
      expect(response.body).not.toBe(undefined);
    });
  });
});