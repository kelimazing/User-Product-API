const express = require('express');
const { findById } = require('../../utils/models/Product');
const app = express.Router();
const Product = require('../../utils/models/Product');
const auth = require('../middlewares/auth');


// Products
app.get('/', async (req,res) => {
  // Get products
  try {
    const products = await Product.find({}) // Query users in database
    if (!products) {
      return res.status(404).send() // Send 404 if there are no products
    }
    res.status(200).send(products) // Send back products array

  } catch(err) {
    res.status(500).send() // Send errors if there are errors
  }
})

app.get('/:id', async (req,res) => {
  // Get a product
  try {
    const product = await Product.findById(req.params.id) // Find product by id
    if (!product) {
      throw new Error('Product not Found') // Throw error if product not found
    }
    res.status(200).send(product) // Send back product object
  } catch(err) {
    res.status(404).send(err.message) // Send Error message
  }
})

app.post('/', auth, async (req,res) => {
  // Create a product
  let body = req.body
  try {
    // Create new User then save
    const product = new Product({
      productName: body.product_name,
      productDescription: body.product_description,
      productPrice: body.product_price,
      productTag: body.product_tag,
      sellerId: req.user._id
    })
    await product.save()

    res.status(201).send(product) // Send back created product

  } catch(err) {
    res.status(400).send(err.message) // Send back error message
  }
     
})

app.patch('/:id', auth, async (req,res) => {
  // Update a product
  let body = req.body
  
  try {
    // Get product
    const product = await Product.findById(req.params.id)
    if (!product) {
      throw new Error('Not Found')
    }

    // Check for authentication
    if (req.user._id != product.sellerId) {
      return res.status(401).send("Unauthorized")
    }

    // Update product
    product.productName = body.product_name || product.productName
    product.productDescription = body.product_description || product.productDescription
    product.productPrice = body.product_price || product.productPrice
    product.productTag = body.product_tag || product.productTag

    await product.save()
    
    res.status(200).send(product) // Send back updated product
  } catch(err) {
    res.status(404).send(err.message) // Send error message
  }
     
})

app.delete('/:id', auth, async (req,res) => {
  // Delete a product
  try {
    // Get product
    const product = await Product.findById(req.params.id)
    if (!product) {
      throw new Error("Not Found")
    }

    // Check for authentication
    if (req.user._id != product.sellerId) {
      return res.status(401).send("Unauthorized")
    }

    await Product.findByIdAndDelete(req.params.id) // Find product by Id and delete
    res.status(200).send(product) // Send back deleted product
  } catch(err) {
    res.status(404).send(err.message) // If unknown server error occurs
  }
})

module.exports = app