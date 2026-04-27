// User profile routes
// Created by Talha
// This file handles the route for showing a single user profile
// Also shows the listings owned by user

const express = require("express");
const router = express.Router();

// Get the database functions
const db = require('../services/db');

// Route to display a single user profile
router.get("/users/:id", function(req, res) {
    // Get the user id from the URL
    var userId = req.params.id;
    console.log("Looking up user with id: " + userId);

    // SQL query to get the user by their id
    var sql = "SELECT * FROM Users WHERE user_id = ?";

    db.query(sql, [userId]).then(results => {
        console.log(results);

        if (results.length > 0) {
            var user = results[0];

            // Get the listings that belong to this user
            var sql2 = "SELECT * FROM Listings WHERE owner_id = ?";
            db.query(sql2, [userId]).then(listings => {
                console.log(listings);
                res.render("profile", {
                    user: user,
                    listings: listings,
                });
            });
        } else {
            res.send("User not found");
        }
    });
});

module.exports = router;
