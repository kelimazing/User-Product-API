const express = require('express');
const bcrypt = require('bcryptjs');
const app = express.Router();
const User = require('../../utils/models/User');
const auth = require('../middlewares/auth');

// Middlewares and Helpers
// Validate email
const emailExists = async (email) => {
  // Check if email is already in the database
  const existingUser = await User.findOne({ email })
      if (existingUser) {
        return true
      }
      return false
}

// Hash Password
const hashPassword = async(password) => {
  // Salt and Hash the password
  let pass = await bcrypt.hash(password, 10)
  return pass
}

// USERS
app.post('/login', async (req,res) => {
  // Log in User
  const { email, password } = req.body
  try {
    const user = await User.findOne({ email }) // find user by email
    if (!user) {
      throw new Error()
    }

    const matchPass = await bcrypt.compare(password, user.password) // check if password is correct
    if (!matchPass) {
      throw new Error()
    }

    const token = await user.generateAuthToken()
    res.status(200).send({ user, token }) // send back user

  } catch(err) {
    res.status(400).send("Invalid Username/Password") // Send error
  }
})

app.post('/logout', auth, async (req,res) => {
  // Log Out User for all devices
  try{
    req.user.tokens = [] // Rmove all user tokens
    await req.user.save(); // Save
    res.status(200).send(req.user)
}catch(e){
    res.status(500).send()
}
})


app.get('/', async (req,res) => {
  // Get users
  try {
    const users = await User.find({}, {_id: 1, email: 1}) // Query users in database
    if (!users) {
      return res.status(404).send() // Send 404 if there are no users
    }
    res.status(200).send(users) // Send back user array

  } catch(err) {
    res.status(500).send() // Send errors if there are errors
  }
})

app.get('/:id', async (req,res) => {
  // Get a user
  try {
    const user = await User.findById(req.params.id, {_id: 1, email: 1}) // Find user by id. Dont send back tokens
    if (!user) {
      throw new Error('User not Found') // Throw error if user not found
    }
    res.status(200).send(user) // Send back user object
  } catch(err) {
    res.status(404).send(err.message) // Send Error message
  }
})

app.post('/', async (req,res) => {
  // Create user
  
  let { email, password, password_confirmation: passwordConfirmation } = req.body

  try {
    // Validate email, validate and hash password
    if(await emailExists(email)){
      throw new Error('Email is already taken')
    }
    
    if (password != passwordConfirmation) {
      throw new Error('Password do not match')
    }

    password = await hashPassword(password)
  
    // Create new User then save
    const user = new User({
      email,
      password
    })

    const token = await user.generateAuthToken()

    res.status(201).send({ user, token }) // Send back created user

  } catch(err) {
    res.status(400).send(err.message) // Send back error message
  }
     
})

app.patch('/:id', auth, async (req,res) => {
  // Update user
  
  try {
    // Check for authentication
    if (req.user._id != req.params.id) {
      return res.status(401).send("Unauthorized")
    }

    // Create update object
    const updateSet = {}
    
    // Validate email, validate and hash password if they exist in the body
    if (req.body.email) {
      if (await emailExists(req.body.email)) {
        return res.status(400).send("Email already taken")
      }
      updateSet['email'] = req.body.email
    }

    if (req.body.password && req.body.password_confirmation) {
      if (req.body.password != req.body.password_confirmation) {
        return res.status(400).send('Password do not match')
      }
      updateSet['password'] = await hashPassword(req.body.password)
    }

    // Update user with update object
    const user = await User.findByIdAndUpdate(req.params.id, {$set: updateSet}, {new: true, runValidators: true})
    if (!user) {
      return res.status(404).send() // If user not found
    }
    res.status(200).send(user) // Send back updated user
  } catch(err) {
    res.status(400).send(err.message) // Send error message
  }
     
})

app.delete('/:id', auth, async (req,res) => {
  // Delete user
  try {
    // Check for authentication
    if (req.user._id != req.params.id) {
      return res.status(401).send("Unauthorized")
    }

    const user = await User.findByIdAndDelete(req.params.id) // Find user by Id and delete
    if (!user){
      return res.status(404).send("User not found") // Send error if user not found
    }
    res.status(200).send(user) // Send back deleted user
  } catch(err) {
    res.status(500).send(err.message) // If unknown server error occurs
  }
})

module.exports = app