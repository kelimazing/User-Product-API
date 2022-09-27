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

describe("POST /users/login", () => {
  describe("Given a valid username and password", () => {
    test("should respond with a 200 status code", async () => {
      const response = await request(app).post("/users/login").send({
        email: "Test1@test.com",
        password: "pass1234"
      });

      await request(app).post("/users/logout").set({ Authorization: `Bearer ${response.body.token}` })
      
      expect(response.statusCode).toBe(200)
    })
    test("response has user id, same user email, hashed user password, and token", async () => {
      const response = await request(app).post("/users/login").send({
        email: "Test1@test.com",
        password: "pass1234"
      });

      await request(app).post("/users/logout").set({ Authorization: `Bearer ${response.body.token}` })

      expect(response.body.user._id).toBeDefined()
      expect(response.body.user.password).not.toMatch("pass1234")
      expect(response.body.user.email).toMatch("Test1@test.com")
      expect(response.body.token).toBeDefined()
    })
  })

  describe("Given an invalid username and/or password", () => {
    
    test("should respond with a 400 status code", async () => {
      const data = [
        {
          email: "Test1@test.com",
        },
        {
          email: "WrongEmail@test.com",
          password: "pass1234"
        },
        {}
      ]

      for (const body of data) {
        const response = await request(app).post("/users/login").send(body)
        expect(response.statusCode).toBe(400)
      }
    })
  })
})

describe("POST /users/logout", () => {
  describe("Given a valid token", () => {
    test("should respond with a 200 status code and user tokens cleared", async () => {
      const response = await request(app).post("/users/login").send({
        email: "Test1@test.com",
        password: "pass1234"
      });

      const responseTwo = await request(app).post("/users/logout").set({ Authorization: `Bearer ${response.body.token}` })
      expect(responseTwo.statusCode).toBe(200)
      expect(responseTwo.body.tokens.length).toBe(0)
    })
  })

  describe("Given no token", () => {
    
    test("should respond with a 401 status code", async () => {
      const response = await request(app).post("/users/logout")
      
      expect(response.statusCode).toBe(401)
    })
  })
})

describe("GET /users", () => {
  describe("Get all users", () => {
    test("should respond with a 200 status code and an array of users", async () => {
      const response = await request(app).get("/users")

      expect(response.statusCode).toBe(200)
      expect(response.body.length).not.toBe(0)
    })
  })
})

describe("GET /users/:id", () => {
  describe("Given a correct user id", () => {
    test("should respond with a 200 status code and a user object Test1", async () => {
      const response = await request(app).get("/users/63326decb3400100648788ed")

      expect(response.statusCode).toBe(200)
      expect(response.body.email).toMatch("Test1@test.com")
    })
  })

  describe("Given an invalid user id", () => {
    test("should respond with a 404 status code", async () => {
      const response = await request(app).get("/users/63326decb34001006481234")

      expect(response.statusCode).toBe(404)
    })
  })
})

describe("POST /users", () => {
  describe("Given a valid username, password, and password confirmation", () => {
    test("should respond with a 201 status code", async () => {
      const response = await request(app).post("/users").send({
        email: "Test4@test.com",
        password: "pass1234",
        password_confirmation: "pass1234"
      });

      await request(app).delete(`/users/${response.body.user._id}`).set({ Authorization: `Bearer ${response.body.token}` })
      
      expect(response.statusCode).toBe(201)
    })
    test("response has user id, same user email, hashed user password, and token", async () => {
      const response = await request(app).post("/users").send({
        email: "Test4@test.com",
        password: "pass1234",
        password_confirmation: "pass1234"
      });

      await request(app).delete(`/users/${response.body.user._id}`).set({ Authorization: `Bearer ${response.body.token}` })
      expect(response.body.user._id).toBeDefined()
      expect(response.body.user.password).not.toMatch("pass1234")
      expect(response.body.user.email).toMatch("Test4@test.com")
      expect(response.body.token).toBeDefined()
    })
  })

  describe("Given an invalid email", () => {
    test("should respond with a 400 status code and message of \"Invalid Email\"", async () => {
      const response = await request(app).post("/users").send({
        email: "Test4",
        password: "pass1234",
        password_confirmation: "pass1234"
      });
      expect(response.statusCode).toBe(400)
      expect(response.error.text).toMatch(/Invalid Email/)
    })
  })

  describe("Given a taken email", () => {
    test("should respond with a 400 status code and message of \"Email is already taken\"", async () => {
      const response = await request(app).post("/users").send({
        email: "Test1@test.com",
        password: "pass1234",
        password_confirmation: "pass1234"
      });

      expect(response.statusCode).toBe(400)
      expect(response.error.text).toMatch("Email is already taken")
    })
  })

  describe("Passwords do not match", () => {
    test("should respond with a 400 status code and message of \"Password do not match\"", async () => {
      const response = await request(app).post("/users").send({
        email: "Test4@test.com",
        password: "pass1234",
        password_confirmation: "pass1233"
      });
      
      expect(response.statusCode).toBe(400)
      expect(response.error.text).toMatch("Password do not match")
    })
  })
})


describe("PATCH /users/:id", () => {
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

  describe("Given a valid username, password, and password confirmation", () => {
    test("should respond with a 200 status code", async () => {
      const response = await request(app).patch(`/users/${userLogin.body.user._id}`).send({
        email: "Test5@test.com",
        password: "pass1234",
        password_confirmation: "pass1234"
      }).set({ Authorization: `Bearer ${userLogin.body.token}` })

      await request(app).patch(`/users/${userLogin.body.user._id}`).send({
        email: "Test2@test.com",
        password: "pass1234",
        password_confirmation: "pass1234"
      }).set({ Authorization: `Bearer ${userLogin.body.token}` })      
      expect(response.statusCode).toBe(200)
    })
    
    test("response has user id, same user email, hashed user password, and token", async () => {
      const response = await request(app).patch(`/users/${userLogin.body.user._id}`).send({
        email: "Test5@test.com",
        password: "pass1234",
        password_confirmation: "pass1234"
      }).set({ Authorization: `Bearer ${userLogin.body.token}` })

      await request(app).patch(`/users/${userLogin.body.user._id}`).send({
        email: "Test2@test.com",
        password: "pass1234",
        password_confirmation: "pass1234"
      }).set({ Authorization: `Bearer ${userLogin.body.token}` }) 
      
      expect(response.body._id).toBeDefined()
      expect(response.body.password).not.toMatch("pass1234")
      expect(response.body.email).toMatch("Test5@test.com")
    })
  })

  describe("Given an invalid email", () => {
    test("should respond with a 400 status code and message of \"Invalid Email\"", async () => {
      const response = await request(app).patch(`/users/${userLogin.body.user._id}`).send({
        email: "Test5",
        password: "pass1234",
        password_confirmation: "pass1234"
      }).set({ Authorization: `Bearer ${userLogin.body.token}` })

      expect(response.statusCode).toBe(400)
      expect(response.error.text).toMatch(/Invalid Email/)
    })
  })

  describe("Given a taken email", () => {
    test("should respond with a 400 status code and message of \"Email is already taken\"", async () => {
      const response = await request(app).patch(`/users/${userLogin.body.user._id}`).send({
        email: "Test1@test.com",
        password: "pass1234",
        password_confirmation: "pass1234"
      }).set({ Authorization: `Bearer ${userLogin.body.token}` })

      expect(response.statusCode).toBe(400)
      expect(response.error.text).toMatch("Email already taken")
    })
  })

  describe("Passwords do not match", () => {
    test("should respond with a 400 status code and message of \"Password do not match\"", async () => {
      const response = await request(app).patch(`/users/${userLogin.body.user._id}`).send({
        email: "Test5@test.com",
        password: "pass1234",
        password_confirmation: "pass1235"
      }).set({ Authorization: `Bearer ${userLogin.body.token}` })

      expect(response.statusCode).toBe(400)
      expect(response.error.text).toMatch("Password do not match")
    })
  })

  describe("User tries to update a different user", () => {
    test("should respond with a 400 status code and message of \"Password do not match\"", async () => {
      const response = await request(app).patch("/users/63326decb3400100648788ed").send({
        email: "Test5@test.com",
        password: "pass1234",
        password_confirmation: "pass1234"
      }).set({ Authorization: `Bearer ${userLogin.body.token}` })

      expect(response.statusCode).toBe(401)
      expect(response.error.text).toMatch(/Unauthorized/)
    })
  })

  describe("User tries to update a non existent user", () => {
    test("should respond with a 400 status code and message of \"Password do not match\"", async () => {
      const response = await request(app).patch("/users/63326decb34001006asdaw").send({
        email: "Test5@test.com",
        password: "pass1234",
        password_confirmation: "pass1234"
      }).set({ Authorization: `Bearer ${userLogin.body.token}` })

      expect(response.statusCode).toBe(401)
      expect(response.error.text).toMatch(/Unauthorized/)
    })
  })
})

describe("DELETE /users/:id", () => {
  describe("Deleting own user", () => {
    test("should respond with a 200 status and user object that has been deleted", async () => {
      const userLogin = await request(app).post("/users").send({
        email: "Test5@test.com",
        password: "pass1234",
        password_confirmation: "pass1234"
      });


      const response = await request(app).delete(`/users/${userLogin.body.user._id}`).set({ Authorization: `Bearer ${userLogin.body.token}` })

      
      expect(response.statusCode).toBe(200)
      expect(response.body.email).toBe("Test5@test.com")
    })
  })

  describe("Deleting a different User", () => { 
    test("should respond with a 401 status code", async () => {
      const userLogin = await request(app).post("/users").send({
        email: "Test2@test.com",
        password: "pass1234",
        password_confirmation: "pass1234"
      });


      const response = await request(app).delete("/users/63326decb3400100648788ed").set({ Authorization: `Bearer ${userLogin.body.token}` })

      await request(app).post("/users/logout").set({ Authorization: `Bearer ${userLogin.body.token}` })
      
      expect(response.statusCode).toBe(401)
      expect(response.error.message).toMatch(/cannot DELETE/)
    })
  })

  describe("Deleting a nonexistent User", () => { 
    test("should respond with a 401 status code", async () => {
      const userLogin = await request(app).post("/users").send({
        email: "Test2@test.com",
        password: "pass1234",
        password_confirmation: "pass1234"
      });


      const response = await request(app).delete("/users/63326decb3400100sdasdasdasda").set({ Authorization: `Bearer ${userLogin.body.token}` })

      await request(app).post("/users/logout").set({ Authorization: `Bearer ${userLogin.body.token}` })
      
      expect(response.statusCode).toBe(401)
      expect(response.error.message).toMatch(/cannot DELETE/)
    })
  })
})