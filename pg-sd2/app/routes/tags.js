// Tags / Categories routes
// Created by Talha
// This file handles the route for showing all tags and the listings 

const express = require("express");
const router = express.Router();

// Get the database functions
const db = require('../services/db');

// Route to display all tags with their listings
router.get("/tags", function(req, res) {
    // First query - get all the tags
    var sql = "SELECT * FROM Tags ORDER BY name";
    db.query(sql).then(tags => {
        console.log(tags);

        // Second query - get all listings with their tag name
        // This joins 4 tables so we know which tag each listing belongs to
        var sql2 = "SELECT Listings.*, Users.name AS owner_name, Tags.name AS tag_name FROM Listings JOIN Users ON Listings.owner_id = Users.user_id JOIN ListingTags ON Listings.listing_id = ListingTags.listing_id JOIN Tags ON ListingTags.tag_id = Tags.tag_id ORDER BY Tags.name";
        db.query(sql2).then(listings => {
            console.log(listings);

            // Group the listings by tag name so the template can show them together
            var grouped = {};
            // Start with an empty array for every tag (even tags with no listings)
            for (var i = 0; i < tags.length; i++) {
                grouped[tags[i].name] = [];
            }
            // Put each listing into its tag's array
            for (var j = 0; j < listings.length; j++) {
                grouped[listings[j].tag_name].push(listings[j]);
            }

            // Render the tags template with the tags and the grouped listings
            res.render("tags", {
                tags: tags,
                grouped: grouped,
            });
        });
    });
});

module.exports = router;
