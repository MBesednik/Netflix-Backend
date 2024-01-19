const mongoose = require('mongoose');

const userSchema = mongoose.Schema({
  _id: mongoose.Schema.Types.ObjectId,
  uid: String,
  name: {
    type: String,
    required: true,
  },
  pin: {
    type: String,
    maxLength: 4,
    required: true,
  },
  favoriteMovies: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Movie',
      default: [],
    },
  ],
});

module.exports = mongoose.model('User', userSchema);
