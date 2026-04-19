// Import express.js
const express = require("express");

// Create express app
var app = express();

// Use the Pug templating engine
app.set('view engine', 'pug');
app.set('views', './app/views');

// Add static files location
app.use(express.static("static"));

// Get the functions in the db.js file to use
const db = require('./services/db');

// ============================================
// Import route files - one per team member page
// ============================================
const userRoutes = require('./routes/users');       // Farhan - user list page
const profileRoutes = require('./routes/profile');  // Talha - user profile page
const tagRoutes = require('./routes/tags');         // Talha - tags / categories page
const listingRoutes = require('./routes/listings'); // Enric - listings browse page
const detailRoutes = require('./routes/detail');    // Yash - listing detail page

// Tell the app to use each route file
app.use(userRoutes);
app.use(profileRoutes);
app.use(tagRoutes);
app.use(listingRoutes);
app.use(detailRoutes);

// ============================================
// Homepage route
// ============================================
app.get("/", function(req, res) {
    // Get some counts to show on the homepage
    var sql = 'SELECT COUNT(*) AS count FROM Users';
    db.query(sql).then(results => {
        var userCount = results[0].count;

        // Also get how many listings there are
        var sql2 = 'SELECT COUNT(*) AS count FROM Listings';
        db.query(sql2).then(results2 => {
            var listingCount = results2[0].count;

            // Send both counts to the homepage template
            res.render("index", {
                title: "OutfitShare - Community Clothing Platform",
                userCount: userCount,
                listingCount: listingCount,
            });
        });
    });
});

// Start server on port 3000
app.listen(3000, function() {
    console.log("Server running at http://127.0.0.1:3000/");
});
