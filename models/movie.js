const mongoose = require('mongoose');

const movieSchema = mongoose.Schema({
  _id: mongoose.Schema.Types.ObjectId,
  movieId: String,
  name: String,
  imgUrl: String,
  youtubeLink: String,
  views: {
    type: Number,
    default: 0,
  },
  genre: String,
  popularity: Number,
  releaseDate: Date,
  rating: Number,
});

module.exports = mongoose.model('Movie', movieSchema);

/** Models - Api
 * name == title
 * imgUrl == poster_path
 * youtubeLink = key od movies and type == Trailer   https://api.themoviedb.org/3/movie/866398/videos?api_key=b7265502060ef55cb5938693ecc1e41d&language=en-US&append_to_response=videos
 * views == number of likes by user
 *
 *
 * https://api.themoviedb.org/3/movie/866398?api_key=b7265502060ef55cb5938693ecc1e41d&language=en-US  za movie details bez youtube linka
 */
