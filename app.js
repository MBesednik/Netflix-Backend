const express = require('express');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');

const userRoutes = require('./routes/User');
const accountRoutes = require('./routes/Account');

async function startServer() {
  const app = express();

  app.use(bodyParser.json());

  app.use('/user', userRoutes);
  app.use('/account', accountRoutes);
  app.use((req, res, next) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, GET,OPTIONS');
    res.setHeader(
      'Access-Control-Allow-Headers',
      'Content-Type, Authorization'
    );
    if (req.method === 'OPTIONS') {
      return res.sendStatus(200);
    }
    next();
  });

  mongoose.set('strictQuery', false);
  mongoose
    .connect(
      'mongodb+srv://mateobesednik:modecova8@cluster0.ljhj4tw.mongodb.net/',
      {
        autoIndex: true,
      }
    )
    .then(() => {
      app.listen(8000);
      console.log('mongoose connected');
      console.log('Connected to port 8000 http://localhost:8000/');
    })
    .catch((err) => {
      console.log(err);
    });
}

startServer();
