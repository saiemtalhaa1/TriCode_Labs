// Register routes
// Handles showing the register page and processing signup form
// Uses POST method like in lab 10

const express = require("express");
const router = express.Router();

// Get the database functions
const db = require('../services/db');

// Show the register page
router.get("/register", function(req, res) {
    res.render("register", { title: "Register - OutfitShare" });
});

// Handle register form submission
router.post("/register", function(req, res) {
    // Get the form data from req.body
    var name = req.body.name;
    var email = req.body.email;
    var password = req.body.password;
    var location = req.body.location;
    var clothing_size = req.body.clothing_size;

    // Insert new user into the database
    var sql = "INSERT INTO Users (name, email, password, location, clothing_size) VALUES (?, ?, ?, ?, ?)";
    db.query(sql, [name, email, password, location, clothing_size]).then(results => {
        console.log("New user registered");
        console.log(results);

        // Log the user in automatically after registering
        req.session.user = {
            user_id: results.insertId,
            name: name,
            email: email,
        };
        res.redirect("/");
    });
});

module.exports = router;
