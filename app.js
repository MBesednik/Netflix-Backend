const express = require('express');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const cors = require('cors');

const userRoutes = require('./routes/User');
const movieRoutes = require('./routes/Movie');

async function startServer() {
  const app = express();

  app.use(express.json());
  app.use(cors());

  app.use('/user', userRoutes);
  app.use('/movie', movieRoutes);
  app.use((req, res, next) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader(
      'Access-Control-Allow-Methods',
      'POST, GET,OPTIONS',
      'Access - Control - Allow - Origin'
    );
    res.setHeader(
      'Access-Control-Allow-Headers',
      'Content-Type, Authorization',
      'Access - Control - Allow - Origin'
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
