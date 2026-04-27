// Listing detail routes
// Created by Yash
// This file handles the route for showing a single listing
// Also loads the reviews for that listing

const express = require("express");
const router = express.Router();

// Get the database functions
const db = require('../services/db');

// Route to display a single listing detail page
router.get("/listings/:id", function(req, res) {
    // Get the listing id from the URL
    var listingId = req.params.id;
    console.log("Looking up listing with id: " + listingId);

    // SQL query to get the listing and owner info (from lab 9 join pattern)
    var sql = "SELECT Listings.*, Users.name AS owner_name, Users.location AS owner_location, Users.profile_image AS owner_image FROM Listings JOIN Users ON Listings.owner_id = Users.user_id WHERE Listings.listing_id = ?";

    db.query(sql, [listingId]).then(results => {
        console.log(results);

        if (results.length > 0) {
            var listing = results[0];

            // Also get all reviews for this listing
            var sql2 = "SELECT Reviews.*, Users.name AS reviewer_name FROM Reviews JOIN Users ON Reviews.reviewer_id = Users.user_id WHERE Reviews.listing_id = ? ORDER BY Reviews.created_at DESC";
            db.query(sql2, [listingId]).then(reviews => {
                console.log(reviews);
                res.render("detail", {
                    listing: listing,
                    reviews: reviews,
                });
            });
        } else {
            res.send("Listing not found");
        }
    });
});

module.exports = router;
