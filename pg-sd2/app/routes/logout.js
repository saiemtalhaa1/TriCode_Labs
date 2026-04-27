// Logout route
// Destroys the session to log the user out

const express = require("express");
const router = express.Router();

// Logout - destroy the session and go back to homepage
router.get("/logout", function(req, res) {
    req.session.destroy();
    res.redirect("/");
});

module.exports = router;
