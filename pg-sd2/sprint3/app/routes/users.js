// User routes
// Created by Farhan
// This file handles the routes for showing the list of users

const express = require("express");
const router = express.Router();

// Get the database functions
const db = require('../services/db');

// Route to display all users
// This is like the all-students route from the lab
router.get("/users", function(req, res) {
    // Write the SQL query to get all users
    var sql = 'SELECT * FROM Users';

    // Run the query and send results to the template
    db.query(sql).then(results => {
        // Log the results so we can check in the console
        console.log(results);

        // Render the users template and pass the data
        res.render("users", { data: results });
    });
});

module.exports = router;
