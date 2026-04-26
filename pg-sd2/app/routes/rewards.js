// Rewards routes
// Shows the logged-in user's reward points balance and history

const express = require("express");
const router = express.Router();

// Get the database functions
const db = require('../services/db');

// Show the rewards page
router.get("/rewards", function(req, res) {
    // Check if user is logged in
    if (!req.session.user) {
        res.redirect("/login");
        return;
    }

    var userId = req.session.user.user_id;
    console.log("Loading rewards for user: " + userId);

    // Get the user's current points balance
    var sql = "SELECT name, reward_points FROM Users WHERE user_id = ?";
    db.query(sql, [userId]).then(userResult => {
        var user = userResult[0];

        // Get the reward history (every time they earned points)
        var sql2 = "SELECT * FROM Rewards WHERE user_id = ? ORDER BY created_at DESC";
        db.query(sql2, [userId]).then(rewardHistory => {
            console.log(rewardHistory);
            res.render("rewards", {
                user: user,
                history: rewardHistory,
            });
        });
    });
});

module.exports = router;
