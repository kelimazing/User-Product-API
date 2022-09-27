require('dotenv').config();
const port = process.env.PORT || 3000
const colors = require('colors');
const app = require('./api/server')

app.listen(port, console.log(`Server running on port ${port}`.cyan.underline.bold));