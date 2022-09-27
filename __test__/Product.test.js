require('dotenv').config();
const mongoose = require('mongoose')
const colors = require('colors');
const app = require('../api/server');
const request = require('supertest');

// Mongoose Cleanup
beforeAll(async () => {
  await mongoose.disconnect();
  await mongoose.connect(process.env.MONGO_URI);
});


afterAll(async () => {
  await mongoose.disconnect();
});

describe("GET /products", () => {
  describe("Get all products", () => {
    test("should respond with a 200 status code and an array of products", async () => {
      const response = await request(app).get("/products")

      expect(response.statusCode).toBe(200)
      expect(response.body.length).not.toBe(0)
    })
  })
})

describe("GET /products/:id", () => {
  describe("Given a correct product id", () => {
    test("should respond with a 200 status code and a product object Test Product 1", async () => {
      const response = await request(app).get("/products/63326e43b3400100648788f6")

      expect(response.statusCode).toBe(200)
      expect(response.body.productName).toMatch("Test Product 1")
    })
  })

  describe("Given an invalid product id", () => {
    test("should respond with a 404 status code", async () => {
      const response = await request(app).get("/products/63326decb3abcde1006481234")

      expect(response.statusCode).toBe(404)
    })
  })
})

describe("POST /products", () => {
  let userLogin
  beforeEach(async () => {
    userLogin = await request(app).post("/users/login").send({
      email: "Test2@test.com",
      password: "pass1234",
      password_confirmation: "pass1234"
    })
  })

  afterEach(async () => {
    await request(app).post("/users/logout").set({ Authorization: `Bearer ${userLogin.body.token}` })
  })
  
  describe("Given a valid input", () => {
    test("should respond with a 201 status code", async () => {
      const response = await request(app).post("/products").send({
        product_name: "Test Product 3",
        product_description: "Test Description 3",
        product_price: 3.99,
        product_tag: ["Test", "Tag", "3"]
      }).set({ Authorization: `Bearer ${userLogin.body.token}` })

      await request(app).delete(`/products/${response.body._id}`).set({ Authorization: `Bearer ${userLogin.body.token}` })
      
      expect(response.statusCode).toBe(201)
    })
    test("response has correct product data", async () => {
      const response = await request(app).post("/products").send({
        product_name: "Test Product 3",
        product_description: "Test Description 3",
        product_price: 3.99,
        product_tag: ["Test", "Tag", "3"]
      }).set({ Authorization: `Bearer ${userLogin.body.token}` })

      await request(app).delete(`/products/${response.body._id}`).set({ Authorization: `Bearer ${userLogin.body.token}` })
      
      expect(response.body._id).toBeDefined()
      expect(response.body.productName).toMatch("Test Product 3")
      expect(response.body.productPrice).toBe(3.99)
      expect(response.body.sellerId).toMatch(userLogin.body.user._id)      
    })
  })

  describe("Given an invalid input", () => {
    test("should respond with a 400 status code", async () => {
      const response = await request(app).post("/products").send({
        product_description: "Test Description 3"
      }).set({ Authorization: `Bearer ${userLogin.body.token}` })

      expect(response.statusCode).toBe(400)
    })
  })
})


describe("PATCH /products/:id", () => {
  let userLogin
  beforeEach(async () => {
    userLogin = await request(app).post("/users/login").send({
      email: "Test1@test.com",
      password: "pass1234",
      password_confirmation: "pass1234"
    })
  })

  afterEach(async () => {
    await request(app).post("/users/logout").set({ Authorization: `Bearer ${userLogin.body.token}` })
  })

  describe("Given a valid input", () => {
    test("should respond with a 200 status code", async () => {
      const response = await request(app).patch("/products/63326e43b3400100648788f6").send({
        product_name: "Test Product 3",
        product_description: "Test Description 3"
      }).set({ Authorization: `Bearer ${userLogin.body.token}` })
      
      await request(app).patch("/products/63326e43b3400100648788f6").send({
        product_name: "Test Product 1",
        product_description: "Test Description 1"
      }).set({ Authorization: `Bearer ${userLogin.body.token}` })

      expect(response.statusCode).toBe(200)
    })
    
    test("response has correct product data", async () => {
      const response = await request(app).patch("/products/63326e43b3400100648788f6").send({
        product_name: "Test Product 3",
        product_description: "Test Description 3"
      }).set({ Authorization: `Bearer ${userLogin.body.token}` })
      
      await request(app).patch("/products/63326e43b3400100648788f6").send({
        product_name: "Test Product 1",
        product_description: "Test Description 1"
      }).set({ Authorization: `Bearer ${userLogin.body.token}` }) 
      
      expect(response.body.productName).toMatch("Test Product 3")
      expect(response.body.productDescription).toMatch("Test Description 3")
    })
  })

  describe("User tries to update someone else's product", () => {
    test("should respond with a 400 status code and message of \"Unauthorized\"", async () => {
      const response = await request(app).patch("/products/6332c1ca2bd09b00448fc2f1").send({
        product_name: "Test Product 5",
        product_description: "Test Description 5"
      }).set({ Authorization: `Bearer ${userLogin.body.token}` })

      expect(response.statusCode).toBe(401)
      expect(response.error.text).toMatch(/Unauthorized/)
    })
  })

  describe("User tries to update a non existent product", () => {
    test("should respond with a 404 status code", async () => {
      const response = await request(app).patch("/products/6332c1caQASBsd0448fc2f1").send({
        product_name: "Test Product 5",
        product_description: "Test Description 5"
      }).set({ Authorization: `Bearer ${userLogin.body.token}` })

      expect(response.statusCode).toBe(404)
    })
  })
})

describe("DELETE /products/:id", () => {
  let userLogin
  beforeEach(async () => {
    userLogin = await request(app).post("/users/login").send({
      email: "Test1@test.com",
      password: "pass1234",
      password_confirmation: "pass1234"
    })
  })

  afterEach(async () => {
    await request(app).post("/users/logout").set({ Authorization: `Bearer ${userLogin.body.token}` })
  })

  describe("Deleting own product", () => {
    test("should respond with a 200 status and product object that has been deleted", async () => {
      const product = await request(app).post("/products").send({
        product_name: "Test Product 7",
        product_description: "Test Description 7",
        product_price: 3.99,
        product_tag: ["Test", "Tag", "7"]
      }).set({ Authorization: `Bearer ${userLogin.body.token}` })

      const response = await request(app).delete(`/products/${product.body._id}`).set({ Authorization: `Bearer ${userLogin.body.token}` })
      
      expect(response.statusCode).toBe(200)
      expect(response.body.productName).toBe("Test Product 7")
    })
  })

  describe("Deleting not owned product", () => { 
    test("should respond with a 401 status code", async () => {
      const response = await request(app).delete("/products/6332c1ca2bd09b00448fc2f1").set({ Authorization: `Bearer ${userLogin.body.token}` })
      
      expect(response.statusCode).toBe(401)
      expect(response.error.message).toMatch(/cannot DELETE/)
    })
  })

  describe("Deleting a nonexistent product", () => { 
    test("should respond with a 404 status code", async () => {
      const response = await request(app).delete("/products/6332cNOTEXIST").set({ Authorization: `Bearer ${userLogin.body.token}` })
      
      expect(response.statusCode).toBe(404)
      expect(response.error.message).toMatch(/cannot DELETE/)
    })
  })
})