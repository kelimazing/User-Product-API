const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const connectDB = require('../utils/dbConfig');
const colors = require('colors');

const app = express();
connectDB();
const usersRouter = require('./routes/users.route')
const productsRouter = require('./routes/products.route')

app.use(cors());
app.use(helmet());
app.use(express.json());

app.get('/', (req,res) => {
  res.send("Hello World")
})

app.use('/users', usersRouter)

app.use('/products', productsRouter)

module.exports = app;