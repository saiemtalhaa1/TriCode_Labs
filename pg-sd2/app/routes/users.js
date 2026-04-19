// User list routes
// Created by Farhan
// This file handles the route for showing all users

const express = require("express");
const router = express.Router();

// Get the database functions
const db = require('../services/db');

// Route to display all users in a table
// Similar to the all-students-formatted route from the lab
router.get("/users", function(req, res) {
    // SQL query to get all users from the database
    var sql = 'SELECT * FROM Users';

    // Run the query and then send results to the template
    db.query(sql).then(results => {
        // Log results to check in the console
        console.log(results);

        // Render the users.pug template and pass the data
        res.render("users", { data: results });
    });
});

module.exports = router;
