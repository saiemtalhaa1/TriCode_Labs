// Import express.js
const express = require("express");

// Create express app
var app = express();

// Use the Pug templating engine
app.set('view engine', 'pug');
app.set('views', './app/views');

// Add static files location
app.use(express.static("static"));

// Set up body parsing so we can read form data (from lab 10)
app.use(express.urlencoded({ extended: true }));

// Set up sessions so users can stay logged in
const session = require("express-session");
app.use(session({
    secret: "outfitshare-secret",
    resave: false,
    saveUninitialized: false,
}));

// Make the logged in user available to all pug templates
// This runs before every route
app.use(function(req, res, next) {
    res.locals.currentUser = req.session.user || null;
    next();
});

// Get the functions in the db.js file to use
const db = require('./services/db');

// ============================================
// Import route files - one per page
// ============================================
const loginRoutes = require('./routes/login');         // Login page
const registerRoutes = require('./routes/register');   // Register page
const logoutRoutes = require('./routes/logout');       // Logout
const userRoutes = require('./routes/users');          // User list (Farhan)
const profileRoutes = require('./routes/profile');     // User profile (Talha)
const tagRoutes = require('./routes/tags');            // Categories (Talha)
const listingRoutes = require('./routes/listings');    // Browse outfits (Enric)
const detailRoutes = require('./routes/detail');       // Listing detail (Yash)
const borrowRoutes = require('./routes/borrow');       // Borrowing dashboard
const lendRoutes = require('./routes/lend');           // Lending dashboard
const notificationRoutes = require('./routes/notifications'); // Notifications
const rewardRoutes = require('./routes/rewards');      // Reward points
const reviewRoutes = require('./routes/reviews');      // Reviews
const myListingsRoutes = require('./routes/my-listings');     // My Listings
const createListingRoutes = require('./routes/create-listing'); // Create Listing

// Tell the app to use each route file
app.use(loginRoutes);
app.use(registerRoutes);
app.use(logoutRoutes);
app.use(userRoutes);
app.use(profileRoutes);
app.use(tagRoutes);
app.use(listingRoutes);
app.use(detailRoutes);
app.use(borrowRoutes);
app.use(lendRoutes);
app.use(notificationRoutes);
app.use(rewardRoutes);
app.use(reviewRoutes);
app.use(myListingsRoutes);
app.use(createListingRoutes);

// ============================================
// Homepage route
// ============================================
app.get("/", function(req, res) {
    // Get user count
    var sql = 'SELECT COUNT(*) AS count FROM Users';
    db.query(sql).then(results => {
        var userCount = results[0].count;

        // Get listing count
        var sql2 = 'SELECT COUNT(*) AS count FROM Listings';
        db.query(sql2).then(results2 => {
            var listingCount = results2[0].count;

            // Get a few featured listings for the homepage
            var sql3 = 'SELECT Listings.*, Users.name AS owner_name FROM Listings JOIN Users ON Listings.owner_id = Users.user_id LIMIT 4';
            db.query(sql3).then(listings => {
                res.render("index", {
                    title: "OutfitShare - Community Clothing Platform",
                    userCount: userCount,
                    listingCount: listingCount,
                    listings: listings,
                });
            });
        });
    });
});

// Start server on port 3000
app.listen(3000, function() {
    console.log("Server running at http://127.0.0.1:3000/");
});
