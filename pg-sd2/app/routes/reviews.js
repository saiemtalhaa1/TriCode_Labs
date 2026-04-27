// Review routes
// Handles submitting reviews for a listing
// Reviews appear on the listing detail page

const express = require("express");
const router = express.Router();

// Get the database functions
const db = require('../services/db');

// Handle submitting a new review for a listing
router.post("/review/:listing_id", function(req, res) {
    // Check if user is logged in
    if (!req.session.user) {
        res.redirect("/login");
        return;
    }

    // Get the form data
    var listingId = req.params.listing_id;
    var reviewerId = req.session.user.user_id;
    var rating = req.body.rating;
    var comment = req.body.comment;

    console.log("New review for listing " + listingId);

    // Insert the review into the database
    var sql = "INSERT INTO Reviews (listing_id, reviewer_id, rating, comment) VALUES (?, ?, ?, ?)";
    db.query(sql, [listingId, reviewerId, rating, comment]).then(results => {
        console.log("Review added");
        // Go back to the listing detail page
        res.redirect("/listings/" + listingId);
    });
});

module.exports = router;
