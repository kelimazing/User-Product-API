const mongoose = require(`mongoose`);

const ProductSchema = new mongoose.Schema({
  productName: { 
    type: String,
    required: true
  },
  productDescription: { type: String },
  productPrice: { 
    type: Number,
    required: true
  },
  productTag: [{ type: String }],
  sellerId: {
    type: String,
    required: true
  }
});

module.exports = mongoose.model('Product', ProductSchema)