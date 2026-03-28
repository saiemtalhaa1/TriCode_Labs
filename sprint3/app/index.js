// OutfitShare - Main Application
const express = require("express");
const mysql = require("mysql2/promise");
const path = require("path");

const app = express();
const PORT = 3000;

// View engine setup - PUG
app.set("view engine", "pug");
app.set("views", path.join(__dirname, "views"));

// Static files
app.use(express.static(path.join(__dirname, "public")));

// Body parser
app.use(express.urlencoded({ extended: true }));

// Database connection pool
const db = mysql.createPool({
  host: process.env.DB_HOST || "localhost",
  user: process.env.DB_USER || "outfitshare_user",
  password: process.env.DB_PASSWORD || "outfitshare_pass",
  database: process.env.DB_NAME || "outfitshare",
  waitForConnections: true,
  connectionLimit: 10,
});

// =====================
// ROUTES
// =====================

// HOME PAGE
app.get("/", async (req, res) => {
  try {
    const [listings] = await db.query(`
      SELECT l.*, u.name AS owner_name, u.lend_rating AS owner_rating
      FROM listings l
      JOIN users u ON l.owner_id = u.user_id
      ORDER BY l.boost_active DESC, l.created_at DESC
      LIMIT 6
    `);

    const [tags] = await db.query("SELECT * FROM tags ORDER BY name");

    const [userCount] = await db.query("SELECT COUNT(*) AS count FROM users");
    const [listingCount] = await db.query("SELECT COUNT(*) AS count FROM listings");

    res.render("index", {
      title: "OutfitShare - Discover Shared Outfits",
      listings,
      tags,
      stats: {
        users: userCount[0].count,
        listings: listingCount[0].count,
      },
    });
  } catch (err) {
    console.error("Home page error:", err);
    res.status(500).render("error", { message: "Unable to load homepage" });
  }
});

// USERS LIST PAGE (Required Page 1)
app.get("/users", async (req, res) => {
  try {
    const [users] = await db.query(`
      SELECT u.*, 
        (SELECT COUNT(*) FROM listings WHERE owner_id = u.user_id) AS listing_count,
        (SELECT COUNT(*) FROM borrow_requests WHERE borrower_id = u.user_id AND status = 'Completed') AS borrow_count
      FROM users u
      ORDER BY u.reward_points DESC
    `);

    res.render("users", {
      title: "Community Members - OutfitShare",
      users,
    });
  } catch (err) {
    console.error("Users page error:", err);
    res.status(500).render("error", { message: "Unable to load users" });
  }
});

// USER PROFILE PAGE (Required Page 2)
app.get("/users/:id", async (req, res) => {
  try {
    const userId = req.params.id;

    const [users] = await db.query("SELECT * FROM users WHERE user_id = ?", [userId]);
    if (users.length === 0) {
      return res.status(404).render("error", { message: "User not found" });
    }
    const user = users[0];

    // Get user's listings with tags
    const [listings] = await db.query(`
      SELECT l.*, 
        GROUP_CONCAT(t.name) AS tags
      FROM listings l
      LEFT JOIN listing_tags lt ON l.listing_id = lt.listing_id
      LEFT JOIN tags t ON lt.tag_id = t.tag_id
      WHERE l.owner_id = ?
      GROUP BY l.listing_id
      ORDER BY l.created_at DESC
    `, [userId]);

    // Get reviews received on user's listings
    const [reviews] = await db.query(`
      SELECT r.*, u.name AS reviewer_name, l.title AS listing_title
      FROM reviews r
      JOIN users u ON r.reviewer_id = u.user_id
      JOIN listings l ON r.listing_id = l.listing_id
      WHERE l.owner_id = ?
      ORDER BY r.created_at DESC
    `, [userId]);

    // Get stats
    const [borrowCount] = await db.query(
      "SELECT COUNT(*) AS count FROM borrow_requests WHERE borrower_id = ? AND status = 'Completed'",
      [userId]
    );
    const [lendCount] = await db.query(
      "SELECT COUNT(*) AS count FROM transaction_history WHERE lender_id = ?",
      [userId]
    );

    res.render("profile", {
      title: `${user.name} - OutfitShare`,
      user,
      listings,
      reviews,
      stats: {
        borrows: borrowCount[0].count,
        lends: lendCount[0].count,
        listings: listings.length,
      },
    });
  } catch (err) {
    console.error("Profile page error:", err);
    res.status(500).render("error", { message: "Unable to load profile" });
  }
});

// LISTINGS PAGE (Required Page 3) - with search & filter
app.get("/listings", async (req, res) => {
  try {
    const { search, tag, size, type, location } = req.query;

    let query = `
      SELECT l.*, u.name AS owner_name, u.lend_rating AS owner_rating,
        GROUP_CONCAT(DISTINCT t.name) AS tags
      FROM listings l
      JOIN users u ON l.owner_id = u.user_id
      LEFT JOIN listing_tags lt ON l.listing_id = lt.listing_id
      LEFT JOIN tags t ON lt.tag_id = t.tag_id
    `;

    const conditions = [];
    const params = [];

    if (search) {
      conditions.push("(l.title LIKE ? OR l.description LIKE ?)");
      params.push(`%${search}%`, `%${search}%`);
    }
    if (tag) {
      conditions.push("t.name = ?");
      params.push(tag);
    }
    if (size) {
      conditions.push("l.size = ?");
      params.push(size);
    }
    if (type) {
      conditions.push("l.listing_type = ?");
      params.push(type);
    }
    if (location) {
      conditions.push("l.location LIKE ?");
      params.push(`%${location}%`);
    }

    if (conditions.length > 0) {
      query += " WHERE " + conditions.join(" AND ");
    }

    query += " GROUP BY l.listing_id ORDER BY l.boost_active DESC, l.created_at DESC";

    const [listings] = await db.query(query, params);

    const [tags] = await db.query("SELECT * FROM tags ORDER BY name");
    const [locations] = await db.query("SELECT DISTINCT location FROM listings WHERE location IS NOT NULL ORDER BY location");

    res.render("listings", {
      title: "Browse Outfits - OutfitShare",
      listings,
      tags,
      locations,
      filters: { search, tag, size, type, location },
    });
  } catch (err) {
    console.error("Listings page error:", err);
    res.status(500).render("error", { message: "Unable to load listings" });
  }
});

// LISTING DETAIL PAGE (Required Page 4)
app.get("/listings/:id", async (req, res) => {
  try {
    const listingId = req.params.id;

    const [listings] = await db.query(`
      SELECT l.*, u.name AS owner_name, u.lend_rating AS owner_rating, 
             u.location AS owner_location, u.user_id AS owner_user_id
      FROM listings l
      JOIN users u ON l.owner_id = u.user_id
      WHERE l.listing_id = ?
    `, [listingId]);

    if (listings.length === 0) {
      return res.status(404).render("error", { message: "Listing not found" });
    }
    const listing = listings[0];

    // Get tags
    const [tags] = await db.query(`
      SELECT t.name AS tag_name
      FROM tags t
      JOIN listing_tags lt ON t.tag_id = lt.tag_id
      WHERE lt.listing_id = ?
    `, [listingId]);

    // Get availability slots
    const [slots] = await db.query(
      "SELECT * FROM availability_slots WHERE listing_id = ? ORDER BY start_date",
      [listingId]
    );

    // Get reviews
    const [reviews] = await db.query(`
      SELECT r.*, u.name AS reviewer_name
      FROM reviews r
      JOIN users u ON r.reviewer_id = u.user_id
      WHERE r.listing_id = ?
      ORDER BY r.created_at DESC
    `, [listingId]);

    // Get related listings (same tags)
    const [related] = await db.query(`
      SELECT DISTINCT l.*, u.name AS owner_name
      FROM listings l
      JOIN users u ON l.owner_id = u.user_id
      JOIN listing_tags lt ON l.listing_id = lt.listing_id
      WHERE lt.tag_id IN (SELECT tag_id FROM listing_tags WHERE listing_id = ?)
        AND l.listing_id != ?
      LIMIT 4
    `, [listingId, listingId]);

    // Average rating
    const avgRating = reviews.length > 0
      ? (reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length).toFixed(1)
      : null;

    res.render("detail", {
      title: `${listing.title} - OutfitShare`,
      listing,
      tags,
      slots,
      reviews,
      related,
      avgRating,
    });
  } catch (err) {
    console.error("Detail page error:", err);
    res.status(500).render("error", { message: "Unable to load listing details" });
  }
});

// TAGS/CATEGORIES PAGE (Required Page 5)
app.get("/categories", async (req, res) => {
  try {
    const [tags] = await db.query(`
      SELECT t.*, COUNT(lt.listing_id) AS listing_count
      FROM tags t
      LEFT JOIN listing_tags lt ON t.tag_id = lt.tag_id
      GROUP BY t.tag_id
      ORDER BY listing_count DESC
    `);

    const [allListings] = await db.query(`
      SELECT l.*, u.name AS owner_name, t.name AS tag_name, t.tag_id
      FROM listings l
      JOIN users u ON l.owner_id = u.user_id
      JOIN listing_tags lt ON l.listing_id = lt.listing_id
      JOIN tags t ON lt.tag_id = t.tag_id
      ORDER BY t.name, l.created_at DESC
    `);

    // Group listings by tag
    const tagListings = {};
    allListings.forEach((item) => {
      if (!tagListings[item.tag_name]) {
        tagListings[item.tag_name] = [];
      }
      if (!tagListings[item.tag_name].find((l) => l.listing_id === item.listing_id)) {
        tagListings[item.tag_name].push(item);
      }
    });

    res.render("categories", {
      title: "Categories - OutfitShare",
      tags,
      tagListings,
    });
  } catch (err) {
    console.error("Categories page error:", err);
    res.status(500).render("error", { message: "Unable to load categories" });
  }
});

// 404 handler
app.use((req, res) => {
  res.status(404).render("error", { message: "Page not found" });
});

// Start server
app.listen(PORT, () => {
  console.log(`OutfitShare is running at http://localhost:${PORT}`);
});
