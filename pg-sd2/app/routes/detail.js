// Listing detail routes
// Created by Yash
// This file handles the route for showing a single listing

const express = require("express");
const router = express.Router();

// Get the database functions
const db = require('../services/db');

// Route to display a single listing detail page
// The :id part is a dynamic parameter (like /student-single/:id from the lab)
router.get("/listings/:id", function(req, res) {
    // Get the listing id from the URL
    var listingId = req.params.id;
    console.log("Looking up listing with id: " + listingId);

    // SQL query to get the listing and join with users table for owner info
    var sql = "SELECT Listings.*, Users.name AS owner_name, Users.location AS owner_location FROM Listings JOIN Users ON Listings.owner_id = Users.user_id WHERE Listings.listing_id = ?";

    // Run the query with the id as a parameter
    db.query(sql, [listingId]).then(results => {
        console.log(results);

        // Check if we found a listing
        if (results.length > 0) {
            var listing = results[0];

            // Render the detail template with the listing data
            res.render("detail", {
                listing: listing,
            });
        } else {
            // No listing found with that id
            res.send("Listing not found");
        }
    });
});

module.exports = router;
