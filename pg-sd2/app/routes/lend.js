// Lending dashboard routes
// Shows borrow requests made FOR the logged-in user's listings
// Also handles approving and rejecting requests

const express = require("express");
const router = express.Router();

// Get the database functions
const db = require('../services/db');

// Show the lending dashboard
router.get("/lend", function(req, res) {
    // Check if user is logged in
    if (!req.session.user) {
        res.redirect("/login");
        return;
    }

    // Get the user id from the session
    var userId = req.session.user.user_id;
    console.log("Loading lend dashboard for user: " + userId);

    // Get all borrow requests for this user's listings
    // Joins with listings (to check owner) and users (to get borrower name)
    var sql = "SELECT BorrowRequests.*, Listings.title, Listings.size, Listings.image_url, Users.name AS borrower_name FROM BorrowRequests JOIN Listings ON BorrowRequests.listing_id = Listings.listing_id JOIN Users ON BorrowRequests.borrower_id = Users.user_id WHERE Listings.owner_id = ? ORDER BY BorrowRequests.created_at DESC";

    db.query(sql, [userId]).then(results => {
        console.log(results);
        res.render("lend", { data: results });
    });
});

// Approve a borrow request
router.post("/lend/approve/:id", function(req, res) {
    if (!req.session.user) {
        res.redirect("/login");
        return;
    }

    var requestId = req.params.id;

    // Update the status to Approved
    var sql = "UPDATE BorrowRequests SET status = 'Approved' WHERE request_id = ?";
    db.query(sql, [requestId]).then(() => {
        // Get the borrower to send them a notification
        var sql2 = "SELECT borrower_id FROM BorrowRequests WHERE request_id = ?";
        db.query(sql2, [requestId]).then(result => {
            if (result.length > 0) {
                var borrowerId = result[0].borrower_id;
                var msg = "Your borrow request was approved!";
                var sql3 = "INSERT INTO Notifications (user_id, message) VALUES (?, ?)";
                db.query(sql3, [borrowerId, msg]).then(() => {
                    res.redirect("/lend");
                });
            } else {
                res.redirect("/lend");
            }
        });
    });
});

// Reject a borrow request
router.post("/lend/reject/:id", function(req, res) {
    if (!req.session.user) {
        res.redirect("/login");
        return;
    }

    var requestId = req.params.id;

    // Update the status to Rejected
    var sql = "UPDATE BorrowRequests SET status = 'Rejected' WHERE request_id = ?";
    db.query(sql, [requestId]).then(() => {
        // Notify the borrower
        var sql2 = "SELECT borrower_id FROM BorrowRequests WHERE request_id = ?";
        db.query(sql2, [requestId]).then(result => {
            if (result.length > 0) {
                var borrowerId = result[0].borrower_id;
                var msg = "Your borrow request was rejected";
                var sql3 = "INSERT INTO Notifications (user_id, message) VALUES (?, ?)";
                db.query(sql3, [borrowerId, msg]).then(() => {
                    res.redirect("/lend");
                });
            } else {
                res.redirect("/lend");
            }
        });
    });
});

// Mark a borrow request as completed (returned)
// This is where reward points get awarded
router.post("/lend/complete/:id", function(req, res) {
    if (!req.session.user) {
        res.redirect("/login");
        return;
    }

    var requestId = req.params.id;
    var lenderId = req.session.user.user_id;

    // Mark as completed
    var sql = "UPDATE BorrowRequests SET status = 'Completed' WHERE request_id = ?";
    db.query(sql, [requestId]).then(() => {
        // Get the borrower id
        var sql2 = "SELECT borrower_id FROM BorrowRequests WHERE request_id = ?";
        db.query(sql2, [requestId]).then(result => {
            if (result.length > 0) {
                var borrowerId = result[0].borrower_id;

                // Give the lender 10 points
                var sql3 = "UPDATE Users SET reward_points = reward_points + 10 WHERE user_id = ?";
                db.query(sql3, [lenderId]).then(() => {
                    // Give the borrower 5 points
                    var sql4 = "UPDATE Users SET reward_points = reward_points + 5 WHERE user_id = ?";
                    db.query(sql4, [borrowerId]).then(() => {
                        // Add reward transactions for both
                        var sql5 = "INSERT INTO Rewards (user_id, points, reason) VALUES (?, ?, ?), (?, ?, ?)";
                        db.query(sql5, [lenderId, 10, 'Lend completed', borrowerId, 5, 'Borrow completed']).then(() => {
                            // Send notifications to both
                            var sql6 = "INSERT INTO Notifications (user_id, message) VALUES (?, ?), (?, ?)";
                            db.query(sql6, [lenderId, "You earned 10 points for completing a lend!", borrowerId, "You earned 5 points for completing a borrow!"]).then(() => {
                                res.redirect("/lend");
                            });
                        });
                    });
                });
            } else {
                res.redirect("/lend");
            }
        });
    });
});

module.exports = router;
