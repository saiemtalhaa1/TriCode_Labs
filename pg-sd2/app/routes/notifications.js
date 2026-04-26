// Notification routes
// Shows all notifications for the logged-in user
// Handles marking notifications as read

const express = require("express");
const router = express.Router();

// Get the database functions
const db = require('../services/db');

// Show all notifications for the logged-in user
router.get("/notifications", function(req, res) {
    // Check if user is logged in
    if (!req.session.user) {
        res.redirect("/login");
        return;
    }

    var userId = req.session.user.user_id;
    console.log("Loading notifications for user: " + userId);

    // Get all notifications for this user, newest first
    var sql = "SELECT * FROM Notifications WHERE user_id = ? ORDER BY created_at DESC";
    db.query(sql, [userId]).then(results => {
        console.log(results);

        // Mark all as read (simple approach)
        var sql2 = "UPDATE Notifications SET is_read = 1 WHERE user_id = ?";
        db.query(sql2, [userId]).then(() => {
            res.render("notifications", { data: results });
        });
    });
});

module.exports = router;
