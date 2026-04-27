// Login routes
// Handles showing the login page and processing login form
// Uses POST method like in lab 10

const express = require("express");
const router = express.Router();

// Get the database functions
const db = require('../services/db');

// Show the login page
router.get("/login", function(req, res) {
    res.render("login", { title: "Login - OutfitShare" });
});

// Handle login form submission
router.post("/login", function(req, res) {
    // Get the form data from req.body
    var email = req.body.email;
    var password = req.body.password;

    // Check if user exists with matching email and password
    var sql = "SELECT * FROM Users WHERE email = ? AND password = ?";
    db.query(sql, [email, password]).then(results => {
        if (results.length > 0) {
            // User found - save details in session
            var user = results[0];
            req.session.user = {
                user_id: user.user_id,
                name: user.name,
                email: user.email,
            };
            console.log("User logged in: " + user.name);
            res.redirect("/");
        } else {
            // No match found - show error
            res.render("login", {
                title: "Login - OutfitShare",
                error: "Wrong email or password",
            });
        }
    });
});

module.exports = router;
