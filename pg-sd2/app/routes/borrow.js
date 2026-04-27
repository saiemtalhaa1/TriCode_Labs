// Borrowing dashboard routes
// Shows borrow requests made by the logged-in user
// Also handles submitting new borrow requests

const express = require("express");
const router = express.Router();

// Get the database functions
const db = require('../services/db');

// Show the borrow dashboard
router.get("/borrow", function(req, res) {
    // Check if user is logged in
    if (!req.session.user) {
        res.redirect("/login");
        return;
    }

    // Get the user id from the session
    var userId = req.session.user.user_id;
    console.log("Loading borrow dashboard for user: " + userId);

    // Get all borrow requests made by this user
    // Joins with listings and users to show the outfit and owner
    var sql = "SELECT BorrowRequests.*, Listings.title, Listings.size, Listings.image_url, Users.name AS owner_name FROM BorrowRequests JOIN Listings ON BorrowRequests.listing_id = Listings.listing_id JOIN Users ON Listings.owner_id = Users.user_id WHERE BorrowRequests.borrower_id = ? ORDER BY BorrowRequests.created_at DESC";

    db.query(sql, [userId]).then(results => {
        console.log(results);
        res.render("borrow", { data: results });
    });
});

// Handle a new borrow request (from the detail page form)
router.post("/borrow/:id", function(req, res) {
    // Get the form data
    var listingId = req.params.id;
    var startDate = req.body.start_date;
    var endDate = req.body.end_date;

    // Check if user is logged in
    if (!req.session.user) {
        res.redirect("/login");
        return;
    }

    var borrowerId = req.session.user.user_id;

    // Insert the borrow request into the database
    var sql = "INSERT INTO BorrowRequests (start_date, end_date, borrower_id, listing_id) VALUES (?, ?, ?, ?)";
    db.query(sql, [startDate, endDate, borrowerId, listingId]).then(results => {
        console.log("Borrow request created");

        // Also create a notification for the listing owner
        var sql2 = "SELECT owner_id, title FROM Listings WHERE listing_id = ?";
        db.query(sql2, [listingId]).then(ownerResult => {
            if (ownerResult.length > 0) {
                var ownerId = ownerResult[0].owner_id;
                var title = ownerResult[0].title;
                var msg = "New borrow request for " + title;
                var sql3 = "INSERT INTO Notifications (user_id, message) VALUES (?, ?)";
                db.query(sql3, [ownerId, msg]).then(() => {
                    res.redirect("/borrow");
                });
            } else {
                res.redirect("/borrow");
            }
        });
    });
});

module.exports = router;
