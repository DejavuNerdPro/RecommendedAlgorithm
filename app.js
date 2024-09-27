const express = require('express');
const app = express();
const PORT = 3000;

// Serve static files from the "public" directory
app.use(express.static('public'));

// Middleware to parse JSON requests
app.use(express.json());

// Your sample data (as before)
const users = {
  "Alice": { "Titanic": 4, "Avatar": 5, "Avengers": 2, "Inception": 4 },
  "Bob":   { "Titanic": 5, "Avatar": 1, "Avengers": 4, "Inception": 3 },
  "Carol": { "Titanic": 2, "Avatar": 5, "Avengers": 1, "Inception": 4 },
  "Dave":  { "Titanic": 3, "Avatar": 4, "Avengers": 2, "Inception": 5 },
  "Eve":   { "Titanic": 5, "Avatar": 4, "Avengers": 3, "Inception": 4 }
};

// Collaborative filtering functions
function pearsonCorrelation(user1, user2, users) {
  let ratings1 = users[user1];
  let ratings2 = users[user2];

  let commonMovies = Object.keys(ratings1).filter(movie => ratings2[movie] !== undefined);
  let n = commonMovies.length;
  if (n === 0) return 0;

  let sum1 = commonMovies.reduce((acc, movie) => acc + ratings1[movie], 0);
  let sum2 = commonMovies.reduce((acc, movie) => acc + ratings2[movie], 0);

  let sum1Sq = commonMovies.reduce((acc, movie) => acc + Math.pow(ratings1[movie], 2), 0);
  let sum2Sq = commonMovies.reduce((acc, movie) => acc + Math.pow(ratings2[movie], 2), 0);

  let sumProducts = commonMovies.reduce((acc, movie) => acc + (ratings1[movie] * ratings2[movie]), 0);

  let num = sumProducts - ((sum1 * sum2) / n);
  let den = Math.sqrt((sum1Sq - Math.pow(sum1, 2) / n) * (sum2Sq - Math.pow(sum2, 2) / n));

  if (den === 0) return 0;
  return num / den;
}

function findSimilarUsers(targetUser, users) {
  let scores = Object.keys(users)
    .filter(user => user !== targetUser)
    .map(user => {
      return {
        user: user,
        score: pearsonCorrelation(targetUser, user, users)
      };
    });

  scores.sort((a, b) => b.score - a.score);  // Sort by similarity score in descending order

  return scores;
}

function recommendItems(user, users) {
  let similarUsers = findSimilarUsers(user, users);

  let totalScores = {};
  let similaritySums = {};

  similarUsers.forEach(({ user: otherUser, score: similarity }) => {
    if (similarity <= 0) return;  // Ignore negative or zero similarities

    let otherUserRatings = users[otherUser];

    Object.keys(otherUserRatings).forEach(movie => {
      if (users[user][movie] === undefined) {  // If the target user hasn't rated this movie
        if (!totalScores[movie]) totalScores[movie] = 0;
        totalScores[movie] += otherUserRatings[movie] * similarity;

        if (!similaritySums[movie]) similaritySums[movie] = 0;
        similaritySums[movie] += similarity;
      }
    });
  });

  let rankings = Object.keys(totalScores).map(movie => {
    return {
      movie: movie,
      score: totalScores[movie] / similaritySums[movie]
    };
  });

  rankings.sort((a, b) => b.score - a.score);  // Sort by score in descending order

  return rankings;
}

// Route to get recommendations
app.post('/recommend', (req, res) => {
  const user = req.body.user;
  console.log("Visited to /recommend.");
  console.log("Requested User : ",user);
  if (!users[user]) {
    return res.status(400).send({ error: 'User not found' });
  }

  const recommendations = recommendItems(user, users);
  console.log('Recommendation : ',recommendations);
  res.send(recommendations);
});

// Start the server
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
