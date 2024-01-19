const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');

const User = require('../models/user');
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

//localhost:8000/[movieId]/[userId]/addToFavorites
router.post('/addToFavorites', async (req, res, next) => {
  console.log('Request received', req.body);
  const { movieId, userId } = req.body; // Extract from req.body
  try {
    // Convert movieId to ObjectId
    const movieObjectId = new mongoose.Types.ObjectId(movieId);

    // Find the user
    const user = await User.findOne({ uid: userId }); // Add await
    if (!user) {
      return res.status(400).json({ message: 'User not found' });
    }

    const movie = await Movie.findById(movieObjectId); // Add await
    if (!movie) {
      return res.status(400).json({ message: 'Movie not found' });
    }

    // Check if the movie is already in the user's favorites
    if (user.favoriteMovies.includes(movieObjectId)) {
      // Remove from favorites and decrease views
      user.favoriteMovies.pull(movieObjectId);
      movie.views = Math.max(0, movie.views - 1);
    } else {
      // Add to favorites and increase views
      user.favoriteMovies.push(movieObjectId);
      movie.views += 1;
    }

    // Save the updated user and movie
    await user.save(); // Add await
    await movie.save(); // Add await

    res.status(200).json({ message: 'Favorites updated', movie });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

// preporuke

//Top 10 globalni prema popularnosti i pregledima usera
const getLatestPopularMovies = async () => {
  try {
    const topTenMovies = await Movie.find()
      .sort({ views: -1, popularity: -1 })
      .limit(10);
    return topTenMovies;
  } catch (error) {
    console.error('Error fetching top ten popular movies:', error);
    throw error; // or return an empty array, or handle the error as per your application's requirements
  }
};

router.get('/popularMovies', async (req, res) => {
  try {
    const topTenMovies = await getLatestPopularMovies();

    res.status(200).json(topTenMovies);
  } catch (error) {
    console.error('Error in /popularMovies route:', error);
    res.status(500).json({ error: error.toString() });
  }
});

// Top 10 globalno all time
const getPopularMoviesAllTime = async () => {
  try {
    const topTenMovies = await Movie.find().sort({ popularity: -1 }).limit(10);
    return topTenMovies;
  } catch (error) {
    console.error('Error fetching top ten popular movies:', error);
    throw error; // or return an empty array, or handle the error as per your application's requirements
  }
};

router.get('/popularMoviesAllTime', async (req, res) => {
  try {
    const movies = await getPopularMoviesAllTime();
    res.json(movies);
  } catch (error) {
    res.status(500).send('Error retrieving top ten popular movies');
  }
});

// Top 10 po ocjenama all time
const getMostRatingAllTime = async () => {
  try {
    const topTenMovies = await Movie.find().sort({ rating: -1 }).limit(10);
    return topTenMovies;
  } catch (error) {
    console.error('Error fetching top ten popular movies:', error);
    throw error;
  }
};

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

// Top 10 po user favoritima
const recommendMoviesBasedOnFavorites = async (userId) => {
  try {
    // Find the user and populate favoriteMovies
    const user = await User.findOne({ uid: userId }).populate('favoriteMovies');
    if (!user) {
      throw new Error('User not found');
    }

    // Check if the user has favorite movies
    if (user.favoriteMovies.length === 0) {
      throw new Error('No favorite movies found for user');
    }

    // Count genres in favorite movies
    const genreCounts = user.favoriteMovies.reduce((acc, movie) => {
      acc[movie.genre] = (acc[movie.genre] || 0) + 1;
      return acc;
    }, {});

    // Calculate the distribution
    const totalFavorites = user.favoriteMovies.length;
    const genreDistribution = Object.entries(genreCounts).map(
      ([genre, count]) => {
        return { genre, percentage: count / totalFavorites };
      }
    );

    // Fetch movies based on distribution
    let recommendedMovies = [];
    for (const { genre, percentage } of genreDistribution) {
      const numberToFetch = Math.round(10 * percentage);
      const movies = await Movie.find({
        genre,
        _id: { $nin: user.favoriteMovies.map((movie) => movie._id) },
      }).limit(numberToFetch);
      recommendedMovies = recommendedMovies.concat(movies);
    }

    // Fill the rest with random movies if necessary
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

// Example usage in an Express route
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

//Top 10 po ostalim userima
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

// Primjer korištenja u Express ruti
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

//filmovi po Zanru
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

// Primjer korištenja u Express ruti
router.get('/genre/:genre', async (req, res) => {
  try {
    const genre = req.params.genre;
    const movies = await getMoviesByGenre(genre);
    res.json(movies);
  } catch (error) {
    res.status(500).send('Greška prilikom dohvaćanja filmova po žanru');
  }
});

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
