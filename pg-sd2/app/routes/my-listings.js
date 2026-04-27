// My Listings routes
// Shows the listings owned by the logged-in user
// So they can see what they've shared with the community

const express = require("express");
const router = express.Router();

// Get the database functions
const db = require('../services/db');

// Show all listings owned by the logged-in user
router.get("/my-listings", function(req, res) {
    // Check if user is logged in
    if (!req.session.user) {
        res.redirect("/login");
        return;
    }

    var userId = req.session.user.user_id;
    console.log("Loading listings for user: " + userId);

    // Get all listings where the owner_id matches the logged-in user
    var sql = "SELECT * FROM Listings WHERE owner_id = ? ORDER BY created_at DESC";
    db.query(sql, [userId]).then(results => {
        console.log(results);
        res.render("my-listings", { data: results });
    });
});

module.exports = router;