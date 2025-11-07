require('dotenv').config({ path: './backend/.env' });

const request = require('supertest');
const app = require('../server'); // Assuming your Express app is exported from server.js
const sequelize = require('../config/database');
const { Round, EquivalentRound, Category, Class, Division, Archer } = require('../models');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

// Mock authentication for admin user
const generateAdminToken = () => {
  const adminPayload = { id: 1, email: 'admin@archery.club', role: 'admin' };
  return jwt.sign(adminPayload, process.env.JWT_SECRET, { expiresIn: '1h' });
};

let adminToken;
let testRound1, testRound2, testCategory;

beforeAll(async () => {
  // Ensure database connection and sync models
  await sequelize.sync({ force: true }); // Use force: true for testing to clear data

  // Create test data
  const testClass = await Class.create({ Name: 'Test Class' });
  const testDivision = await Division.create({ Name: 'Test Division' });
  testCategory = await Category.create({
    Name: 'Test Category',
    ClassID: testClass.ClassID,
    DivisionID: testDivision.DivisionID,
  });

  testRound1 = await Round.create({
    Name: 'Test Round 1',
    Description: 'Description for Test Round 1',
  });
  testRound2 = await Round.create({
    Name: 'Test Round 2',
    Description: 'Description for Test Round 2',
  });

  // Create an admin user for authentication
  const hashedPassword = await bcrypt.hash('admin123', 10); // Hash a dummy password
  await Archer.create({
    ArcherID: 1,
    FirstName: 'Admin',
    LastName: 'User',
    Email: 'admin@archery.club',
    PasswordHash: hashedPassword,
    Role: 'admin',
    DateOfBirth: '2000-01-01', // Dummy date of birth
    Gender: 'Male', // Dummy gender
  });

  adminToken = generateAdminToken();
});

afterAll(async () => {
  await sequelize.close();
});

describe('Equivalent Round API', () => {
  it('should create a new equivalent round rule (admin)', async () => {
    const res = await request(app)
      .post('/api/rounds/equivalent')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        baseRoundId: testRound1.RoundID,
        equivalentRoundId: testRound2.RoundID,
        categoryId: testCategory.CategoryID,
        startDate: '2023-01-01',
        endDate: '2023-12-31',
      });

    expect(res.statusCode).toEqual(201);
    expect(res.body).toHaveProperty('message', 'Equivalent round created successfully');
    expect(res.body.equivalent).toHaveProperty('EquivalentID');
    expect(res.body.equivalent.BaseRoundID).toEqual(testRound1.RoundID);
  });

  it('should not create an equivalent round rule if base and equivalent rounds are the same (admin)', async () => {
    const res = await request(app)
      .post('/api/rounds/equivalent')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        baseRoundId: testRound1.RoundID,
        equivalentRoundId: testRound1.RoundID,
        categoryId: testCategory.CategoryID,
        startDate: '2023-01-01',
        endDate: '2023-12-31',
      });

    expect(res.statusCode).toEqual(400);
    expect(res.body).toHaveProperty('error', 'Base and equivalent rounds cannot be the same');
  });

  it('should get equivalent rounds for a given base round and category', async () => {
    const res = await request(app)
      .get(`/api/rounds/${testRound1.RoundID}/equivalent?categoryId=${testCategory.CategoryID}&date=2023-06-15`)
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.statusCode).toEqual(200);
    expect(res.body.equivalents).toBeInstanceOf(Array);
    expect(res.body.equivalents.length).toBeGreaterThan(0);
    expect(res.body.equivalents[0].BaseRoundID).toEqual(testRound1.RoundID);
    expect(res.body.equivalents[0].equivalentRound.RoundID).toEqual(testRound2.RoundID);
  });

  it('should update an existing equivalent round rule (admin)', async () => {
    // First, create an equivalent round to update
    const createRes = await request(app)
      .post('/api/rounds/equivalent')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        baseRoundId: testRound1.RoundID,
        equivalentRoundId: testRound2.RoundID,
        categoryId: testCategory.CategoryID,
        startDate: '2024-01-01',
        endDate: '2024-12-31',
      });
    const equivalentId = createRes.body.equivalent.EquivalentID;

    const res = await request(app)
      .put(`/api/rounds/equivalent/${equivalentId}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        baseRoundId: testRound1.RoundID,
        equivalentRoundId: testRound2.RoundID,
        categoryId: testCategory.CategoryID,
        startDate: '2024-01-01',
        endDate: '2025-12-31', // Update end date
      });

    expect(res.statusCode).toEqual(200);
    expect(res.body).toHaveProperty('message', 'Equivalent round updated successfully');
    expect(res.body.equivalent.EndDate).toEqual('2025-12-31');
  });

  it('should delete an equivalent round rule (admin)', async () => {
    // First, create an equivalent round to delete
    const createRes = await request(app)
      .post('/api/rounds/equivalent')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        baseRoundId: testRound1.RoundID,
        equivalentRoundId: testRound2.RoundID,
        categoryId: testCategory.CategoryID,
        startDate: '2025-01-01',
        endDate: '2025-12-31',
      });
    const equivalentId = createRes.body.equivalent.EquivalentID;

    const res = await request(app)
      .delete(`/api/rounds/equivalent/${equivalentId}`)
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.statusCode).toEqual(200);
    expect(res.body).toHaveProperty('message', 'Equivalent round rule deleted successfully');

    // Verify it's deleted
    const getRes = await request(app)
      .get(`/api/rounds/${testRound1.RoundID}/equivalent?categoryId=${testCategory.CategoryID}&date=2025-06-15`)
      .set('Authorization', `Bearer ${adminToken}`);
    expect(getRes.body.equivalents.some(eq => eq.EquivalentID === equivalentId)).toBeFalsy();
  });
});
