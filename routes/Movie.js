const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');

const Account = require('../models/account');
const User = require('../models/user'); //
const Movie = require('../models/movie');

router.get('/', (req, res, next) => {
  Movie.find()
    .exec()
    .then((docs) => {
      console.log(docs);
      res.status(200).json(docs);
    })
    .catch((err) => {
      console.log('movies', err);
      res.status(500).json({
        error: err,
      });
    });
});

router.get('/:movieId', (req, res, next) => {
  const id = req.params.movieId;
  Account.findById(id)
    .exec()
    .then((docs) => {
      console.log(docs);
      res.status(200).json(docs);
    })
    .catch((err) => {
      console.log('movie', err);
      res.status(500).json({
        error: err,
      });
    });
});

// preporuke

//Top 10 globalni nedavno
// Top 10 globalno all time
// Top 10 po ocjenama

//Top 10 po user favoritima
//Top 10 po ostalim userima

//filmovi po Zanru

router.post('/', (req, res, next) => {
  const movie = new Movie({
    _id: new mongoose.Types.ObjectId(),
  });
  movie
    .save()
    .then((result) => {
      console.log(result);
      res.status(201).json({
        message: 'Handling POST requests to /account',
        movie: result,
      });
    })
    .catch((err) => {
      console.log(err);
      res.status(500).json({
        error: err,
      });
    });
});

router.delete('/:movieId', (req, res, next) => {
  const id = req.params.movieId;
  Movie.findByIdAndDelete(id)
    .exec()
    .then((result) => {
      res.status(200).json(result);
    })
    .catch((err) => {
      console.log(err);
      res.status(500).json({
        error: err,
      });
    });
});
