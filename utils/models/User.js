const mongoose = require(`mongoose`);
const validator = require('validator');
const jwt = require('jsonwebtoken');

const UserSchema = new mongoose.Schema({
  email: { 
    type: String,
    required: true,
    validate(value) {
      if (!validator.isEmail(value)) {
        throw new Error('Invalid Email')
      }
    }
  },
  password: { type: String },
  tokens: [{
    token: {
      type: String,
      required: true
    }
  }]
});

UserSchema.methods.generateAuthToken = async function(){
  const user = this
  const token = await jwt.sign(
    { _id: user._id.toString() },
    process.env.JWT_SECRET
  )

  user.tokens = user.tokens.concat({token})
  await user.save()
  return token
}

module.exports = mongoose.model('User', UserSchema)