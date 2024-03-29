const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');

const User = require('../models/user');

router.get('/', (req, res, next) => {
  User.find()
    .exec()
    .then((docs) => {
      console.log(docs);
      res.status(200).json(docs);
    })
    .catch((err) => {
      console.log('user', err);
      res.status(500).json({
        error: err,
      });
    });
});

router.get('/:uid', (req, res, next) => {
  const uid = req.params.uid.toString();
  User.find({ uid: uid })
    .exec()
    .then((docs) => {
      console.log(docs);
      res.status(200).json(docs);
    })
    .catch((err) => {
      console.log('user', err);
      res.status(500).json({
        error: err,
      });
    });
});

router.post('/', (req, res, next) => {
  const user = new User({
    _id: new mongoose.Types.ObjectId(),
    uid: req.body.uid,
    name: req.body.name,
    pin: req.body.pin,
  });
  user
    .save()
    .then((result) => {
      console.log(result);
      res.status(201).json({
        message: 'Handling POST requests to /user',
        user: result,
      });
    })
    .catch((err) => {
      console.log(err);
      res.status(500).json({
        error: err,
      });
    });
});

router.delete('/:userId', (req, res, next) => {
  const id = req.params.userId;
  User.findByIdAndDelete(id)
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

router.post('/login', (req, res, next) => {
  const uid = req.body.uid;
  const name = req.body.name;
  const pin = req.body.pin;

  User.findOne({ uid: uid, name: name, pin: pin })
    .populate('favoriteMovies')
    .exec()
    .then((result) => {
      res.status(200).json(result);
    })
    .catch((err) => {
      console.log('accounts', err);
      res.status(500).json({
        error: err,
      });
    });
});

module.exports = router;
