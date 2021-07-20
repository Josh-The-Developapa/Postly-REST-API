const express = require('express');
const morgan = require('morgan');
const mongoose = require('mongoose');
const app = express();
const dotenv = require('dotenv');
dotenv.config({ path: 'config.env' });
const fileUpload = require('express-fileupload');
const cookieParser = require('cookie-parser');
const cors = require('cors');
const mongoSanitize = require('express-mongo-sanitize');
const helmet = require('helmet');
const xss = require('xss-clean');

app.use(express.json());
app.use(express.static('public'));
app.use(morgan('dev'));
app.use(cookieParser());

const dbURL = process.env.dbURL;
mongoose
  .connect(dbURL, {
    useCreateIndex: true,
    useNewUrlParser: true,
    useUnifiedTopology: true,
    useFindAndModify: true,
  })
  .then((result) => console.log('\x1b[36m%s\x1b[0m', ' connected to db'))
  .catch((err) => console.log(err));

app.use(fileUpload());
const posts = require('./routes/routes.js');
const users = require('./routes/authRoutes');

app.use(posts);
app.use(users);
const errorHandler = require('./middleware/error');
app.use(errorHandler);
app.use(cors());
app.use(mongoSanitize());
app.use(helmet());
app.use(xss());

const PORT = process.env.PORT;
app.listen(PORT);
console.log('\x1b[33m', `Server active on port ${PORT}`);

const date = new Date('2021-07-20T19:42:37.392Z');
console.log(date.toLocaleTimeString());
