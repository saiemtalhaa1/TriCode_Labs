// Outfit listings routes
// Created by Enric..
// This file handles the route for browsing all outfit listings

const express = require("express");
const router = express.Router();

// Get the database functions
const db = require('../services/db');

// Route to display all outfit listings
// Similar to the all-students-formatted route but for listings
router.get("/listings", function(req, res) {
    // SQL query to get all listings and join with users table
    // to show the owner name for each listing
    var sql = 'SELECT Listings.*, Users.name AS owner_name FROM Listings JOIN Users ON Listings.owner_id = Users.user_id';

    // Run the query and send results to the template
    db.query(sql).then(results => {
        // Log results to check in the console
        console.log(results);

        // Render the listings.pug template and pass the data
        res.render("listings", { data: results });
    });
});

module.exports = router;

