// Create Listing routes
// GET shows the form to create a new listing
// POST inserts the new listing into the database
// Uses POST method like the add-note example from lab 10

const express = require("express");
const router = express.Router();

// Get the database functions
const db = require('../services/db');

// Show the create listing form
router.get("/create-listing", function(req, res) {
    // Check if user is logged in
    if (!req.session.user) {
        res.redirect("/login");
        return;
    }

    res.render("create-listing", { title: "Create New Listing" });
});

// Handle the create listing form submission
router.post("/create-listing", function(req, res) {
    // Check if user is logged in
    if (!req.session.user) {
        res.redirect("/login");
        return;
    }

    // Get the form data from req.body
    var title = req.body.title;
    var description = req.body.description;
    var size = req.body.size;
    var location = req.body.location;
    var imageUrl = req.body.image_url;
    var ownerId = req.session.user.user_id;

    console.log("Creating new listing: " + title);

    // Insert the new listing into the database
    var sql = "INSERT INTO Listings (title, description, size, location, image_url, owner_id) VALUES (?, ?, ?, ?, ?, ?)";
    db.query(sql, [title, description, size, location, imageUrl, ownerId]).then(results => {
        console.log("Listing created with id: " + results.insertId);
        // Redirect to my-listings page so the user sees their new listing
        res.redirect("/my-listings");
    });
});

module.exports = router;