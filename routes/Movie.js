const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');

const User = require('../models/user');
const Movie = require('../models/movie');

// Dohvati sve filmove
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

// Dohvati detalje filma po id-u
router.get('/movieDetails/:movieId', (req, res, next) => {
  const id = req.params.movieId;
  Movie.findById(id)
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

router.get('/favoriteMovies/:userId', (req, res, next) => {
  const userId = req.params.userId;

  if (!mongoose.Types.ObjectId.isValid(userId)) {
    return res.status(400).json({ message: 'Invalid user ID' });
  }

  User.findById(userId)
    .populate('favoriteMovies')
    .exec()
    .then((user) => {
      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }
      res.status(200).json(user.favoriteMovies);
    })
    .catch((err) => {
      console.error(err);
      res.status(500).json({ error: 'Internal server error' });
    });
});

//localhost:8000/[movieId]/[userId]/addToFavorites
// Postavljanje filmova kao favorit ili odmicanje (ako se vec nalazi u listi onda se brise iz nje suprotno dodaje kao favorit)
router.post('/addToFavorites', async (req, res, next) => {
  console.log('Request received', req.body);
  const { movieId, userId } = req.body;
  try {
    const movieObjectId = new mongoose.Types.ObjectId(movieId);

    // Find the user
    const user = await User.findOne({ uid: userId });
    if (!user) {
      return res.status(400).json({ message: 'User not found' });
    }

    const movie = await Movie.findById(movieObjectId);
    if (!movie) {
      return res.status(400).json({ message: 'Movie not found' });
    }

    if (user.favoriteMovies.includes(movieObjectId)) {
      user.favoriteMovies.pull(movieObjectId);
      movie.views = Math.max(0, movie.views - 1);
    } else {
      user.favoriteMovies.push(movieObjectId);
      movie.views += 1;
    }

    await user.save();
    await movie.save();

    res.status(200).json({ message: 'Favorites updated', movie });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

// PREPORUKE
// helper func za dohvacanje Top 10 prema popularnosti i pregledima usera
const getLatestPopularMovies = async () => {
  try {
    const topTenMovies = await Movie.find()
      .sort({ views: -1, popularity: -1 })
      .limit(10);
    return topTenMovies;
  } catch (error) {
    console.error('Error fetching top ten popular movies:', error);
    throw error;
  }
};

// Top 10 nedavnih filmova
router.get('/popularMovies', async (req, res) => {
  try {
    const topTenMovies = await getLatestPopularMovies();

    res.status(200).json(topTenMovies);
  } catch (error) {
    console.error('Error in /popularMovies route:', error);
    res.status(500).json({ error: error.toString() });
  }
});

// helper func za dohvacanje Top 10 globalno all time
const getPopularMoviesAllTime = async () => {
  try {
    const topTenMovies = await Movie.find().sort({ popularity: -1 }).limit(10);
    return topTenMovies;
  } catch (error) {
    console.error('Error fetching top ten popular movies:', error);
    throw error;
  }
};

// Top 10 najpopularnijih svih vremena
router.get('/popularMoviesAllTime', async (req, res) => {
  try {
    const movies = await getPopularMoviesAllTime();
    res.json(movies);
  } catch (error) {
    res.status(500).send('Error retrieving top ten popular movies');
  }
});

//helper func za dohvacanje top 10 po ocjenama all time
const getMostRatingAllTime = async () => {
  try {
    const topTenMovies = await Movie.find().sort({ rating: -1 }).limit(10);
    return topTenMovies;
  } catch (error) {
    console.error('Error fetching top ten popular movies:', error);
    throw error;
  }
};

// filmovi po ocjenama
router.get('/mostRated', async (req, res, next) => {
  try {
    console.log('LOLOLO:');
    const movies = await getMostRatingAllTime();
    res.status(201).json({
      movies: movies,
    });
  } catch (error) {
    console.log('LOLOL:');
    console.error('Error in /popularMovies route:', error);
    res.status(500).json({ error: error.toString() });
  }
});

// Preporuka za korisnika speficno
const recommendMoviesBasedOnFavorites = async (userId) => {
  try {
    const user = await User.findOne({ uid: userId }).populate('favoriteMovies');
    if (!user) {
      throw new Error('User not found');
    }

    if (user.favoriteMovies.length === 0) {
      throw new Error('No favorite movies found for user');
    }

    // dohvati zanrove i njihov count
    const genreCounts = user.favoriteMovies.reduce((acc, movie) => {
      acc[movie.genre] = (acc[movie.genre] || 0) + 1;
      return acc;
    }, {});

    // postotak zanra u ukupnoj listi favorita
    const totalFavorites = user.favoriteMovies.length;
    const genreDistribution = Object.entries(genreCounts).map(
      ([genre, count]) => {
        return { genre, percentage: count / totalFavorites };
      }
    );

    // kreiraj omjer filmova po zanru (100% = 33% komedija, 33% akcija, 34% drama)
    let recommendedMovies = [];
    for (const { genre, percentage } of genreDistribution) {
      const numberToFetch = Math.round(10 * percentage);
      const movies = await Movie.find({
        genre,
        _id: { $nin: user.favoriteMovies.map((movie) => movie._id) },
      }).limit(numberToFetch);
      recommendedMovies = recommendedMovies.concat(movies);
    }

    // dodaj random filmove ako ih u listi nema 10
    if (recommendedMovies.length < 10) {
      const additionalMovies = await Movie.find({
        _id: { $nin: user.favoriteMovies.map((movie) => movie._id) },
      }).limit(10 - recommendedMovies.length);
      recommendedMovies = recommendedMovies.concat(additionalMovies);
    }

    return recommendedMovies.slice(0, 10);
  } catch (error) {
    console.error('Error in recommending movies:', error);
    throw error;
  }
};

// user recommendation
router.get('/recommendForUser/:userId', async (req, res) => {
  try {
    console.log(req.params.userId);
    const userId = req.params.userId;

    const movies = await recommendMoviesBasedOnFavorites(userId);
    res.json(movies);
  } catch (error) {
    res.status(500).send('Error retrieving recommended movies');
  }
});

// Top 10 po ostalim userima
const getTopTenMoviesByViews = async () => {
  try {
    // Pronalazak 10 filmova s najvećim brojem pregleda
    const topTenMovies = await Movie.find().sort({ views: -1 }).limit(10);
    return topTenMovies;
  } catch (error) {
    console.error(
      'Greška prilikom dohvaćanja top 10 filmova po pregledima:',
      error
    );
    throw error;
  }
};

// recomendadtion by other po broju pregleda
router.get('/moviesByOther', async (req, res) => {
  try {
    const movies = await getTopTenMoviesByViews();
    res.json(movies);
  } catch (error) {
    res
      .status(500)
      .send('Greška prilikom dohvaćanja top 10 filmova po pregledima');
  }
});

// helper function for getting by genre
const getMoviesByGenre = async (genre) => {
  try {
    // Pronalazak filmova koji odgovaraju zadanom žanru
    const movies = await Movie.find({ genre: genre });
    return movies;
  } catch (error) {
    console.error('Greška prilikom dohvaćanja filmova po žanru:', error);
    throw error;
  }
};

// get movies by genre
router.get('/genre/:genre', async (req, res) => {
  try {
    const genre = req.params.genre;
    const movies = await getMoviesByGenre(genre);
    res.json(movies);
  } catch (error) {
    res.status(500).send('Greška prilikom dohvaćanja filmova po žanru');
  }
});

// add new movie
router.post('/', (req, res, next) => {
  console.log(req.body);
  const movie = new Movie({
    _id: new mongoose.Types.ObjectId(),
    movieId: req.body.movieId,
    name: req.body.name,
    imgUrl: req.body.imgUrl,
    youtubeLink: req.body.youtubeLink,
    genre: req.body.genre,
    popularity: req.body.popularity,
    releaseDate: req.body.releaseDate,
    rating: req.body.rating,
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

// Delete movie from db by id
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

module.exports = router;
