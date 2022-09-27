const jwt = require('jsonwebtoken')
const User = require('../../utils/models/User')
const auth = async(req,res,next) =>{
    try{
        const token = req.header('Authorization').replace('Bearer ','') // Get Token
        const verify = await jwt.verify(token , process.env.JWT_SECRET) // Verify
        const user = await User.findOne({ _id:verify._id,'tokens.token': token }) // Search user by Token
        if(!user)
        throw new Error()
        req.token = token // Add token to request
        req.user = user // Add authenticated user to request
        next();
    }catch(e){
        res.status(401).send("Error in Authentication")
    }
}

module.exports = auth