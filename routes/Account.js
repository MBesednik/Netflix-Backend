const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');

const Account = require('../models/account');
const User = require('../models/user'); //

router.get('/', (req, res, next) => {
  Account.find()
    .exec()
    .then((docs) => {
      console.log(docs);
      res.status(200).json(docs);
    })
    .catch((err) => {
      console.log('accounts', err);
      res.status(500).json({
        error: err,
      });
    });
});

router.get('/:accountId', (req, res, next) => {
  const id = req.params.accountId;
  Account.findById(id)
    .exec()
    .then((docs) => {
      console.log(docs);
      res.status(200).json(docs);
    })
    .catch((err) => {
      console.log('accounts', err);
      res.status(500).json({
        error: err,
      });
    });
});

router.post('/', (req, res, next) => {
  const account = new Account({
    _id: new mongoose.Types.ObjectId(),
    username: req.body.username,
    password: req.body.password,
  });
  account
    .save()
    .then((result) => {
      console.log(result);
      res.status(201).json({
        message: 'Handling POST requests to /account',
        account: result,
      });
    })
    .catch((err) => {
      console.log(err);
      res.status(500).json({
        error: err,
      });
    });
});

router.delete('/:accountId', (req, res, next) => {
  const id = req.params.account;
  Account.findByIdAndDelete(id)
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
  const username = req.body.username;
  const password = req.body.password;
  Account.findOne({ username: username, password: password })
    .populate('users')
    .exec()
    .then((account) => {
      if (account) {
        User.find({ accountId: account })
          .exec()
          .then((users) => {
            res.status(200).json({
              account: account,
              users: users,
            });
          })
          .catch((userErr) => {
            console.log('Error fetching users', userErr);
            res.status(500).json({ error: userErr });
          });
      } else {
        res
          .status(404)
          .json({ message: 'No valid account found for provided credentials' });
      }
    })
    .catch((err) => {
      console.log('accounts', err);
      res.status(500).json({
        error: err,
      });
    });
});

module.exports = router;
