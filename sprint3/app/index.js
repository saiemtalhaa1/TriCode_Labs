// OutfitShare - Main Application
const express = require("express");
const mysql = require("mysql2/promise");
const bcrypt = require("bcryptjs");
const session = require("express-session");
const path = require("path");
const multer = require("multer");

// Multer config for image uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, path.join(__dirname, "public/uploads")),
  filename: (req, file, cb) => {
    const unique = Date.now() + "-" + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    cb(null, unique + ext);
  }
});
const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
  fileFilter: (req, file, cb) => {
    const allowed = /jpeg|jpg|png|gif|webp/;
    if (allowed.test(path.extname(file.originalname).toLowerCase())) {
      cb(null, true);
    } else {
      cb(new Error("Only image files are allowed"));
    }
  }
});

const app = express();
const PORT = 3000;

// View engine setup - PUG
app.set("view engine", "pug");
app.set("views", path.join(__dirname, "views"));

// Static files
app.use(express.static(path.join(__dirname, "public")));

// Body parser
app.use(express.urlencoded({ extended: true }));

// Session middleware
app.use(session({
  secret: "outfitshare-secret-key-2026",
  resave: false,
  saveUninitialized: false,
  cookie: { maxAge: 24 * 60 * 60 * 1000 } // 24 hours
}));

// Make session user available to all templates + notification count
app.use(async (req, res, next) => {
  res.locals.currentUser = req.session.user || null;
  res.locals.unreadCount = 0;
  if (req.session.user) {
    try {
      const [result] = await db.query(
        "SELECT COUNT(*) AS count FROM notifications WHERE user_id = ? AND is_read = FALSE",
        [req.session.user.user_id]
      );
      res.locals.unreadCount = result[0].count;
    } catch (e) { /* ignore */ }
  }
  next();
});

// Database connection pool
const db = mysql.createPool({
  host: process.env.DB_HOST || "localhost",
  user: process.env.DB_USER || "outfitshare_user",
  password: process.env.DB_PASSWORD || "outfitshare_pass",
  database: process.env.DB_NAME || "outfitshare",
  waitForConnections: true,
  connectionLimit: 10,
});

// Auth middleware - protects routes that need login
function requireLogin(req, res, next) {
  if (!req.session.user) {
    return res.redirect("/login");
  }
  next();
}

// Admin middleware
function requireAdmin(req, res, next) {
  if (!req.session.user || req.session.user.role !== 'admin') {
    return res.status(403).render("error", { message: "Access denied. Admin only." });
  }
  next();
}

// =====================
// AUTH ROUTES
// =====================

// REGISTER PAGE
app.get("/register", (req, res) => {
  if (req.session.user) return res.redirect("/");
  res.render("register", { title: "Register - OutfitShare", error: null });
});

// REGISTER SUBMIT
app.post("/register", async (req, res) => {
  try {
    const { name, email, password, confirm_password, height, age, clothing_size } = req.body;

    // Validation
    if (!name || !email || !password) {
      return res.render("register", { title: "Register - OutfitShare", error: "Name, email and password are required." });
    }
    if (password !== confirm_password) {
      return res.render("register", { title: "Register - OutfitShare", error: "Passwords do not match." });
    }
    if (password.length < 6) {
      return res.render("register", { title: "Register - OutfitShare", error: "Password must be at least 6 characters." });
    }

    // Check if email exists
    const [existing] = await db.query("SELECT user_id FROM users WHERE email = ?", [email]);
    if (existing.length > 0) {
      return res.render("register", { title: "Register - OutfitShare", error: "An account with this email already exists." });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Determine if profile is completed
    const profileCompleted = (height && age && clothing_size) ? true : false;

    // Insert user
    const [result] = await db.query(
      "INSERT INTO users (name, email, password, height, age, clothing_size, profile_completed) VALUES (?, ?, ?, ?, ?, ?, ?)",
      [name, email, hashedPassword, height || null, age || null, clothing_size || null, profileCompleted]
    );

    // Auto login
    req.session.user = { user_id: result.insertId, name, email, role: 'user' };
    res.redirect("/");
  } catch (err) {
    console.error("Register error:", err);
    res.render("register", { title: "Register - OutfitShare", error: "Registration failed. Please try again." });
  }
});

// LOGIN PAGE
app.get("/login", (req, res) => {
  if (req.session.user) return res.redirect("/");
  res.render("login", { title: "Login - OutfitShare", error: null });
});

// LOGIN SUBMIT
app.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.render("login", { title: "Login - OutfitShare", error: "Email and password are required." });
    }

    const [users] = await db.query("SELECT * FROM users WHERE email = ?", [email]);
    if (users.length === 0) {
      return res.render("login", { title: "Login - OutfitShare", error: "Invalid email or password." });
    }

    const user = users[0];
    // Support both bcrypt hashed and plain text passwords (for seed data)
    let validPassword = false;
    if (user.password.startsWith("$2")) {
      validPassword = await bcrypt.compare(password, user.password);
    } else {
      validPassword = (password === user.password);
    }

    if (!validPassword) {
      return res.render("login", { title: "Login - OutfitShare", error: "Invalid email or password." });
    }

    req.session.user = { user_id: user.user_id, name: user.name, email: user.email, role: user.role || 'user', profile_image: user.profile_image || null };
    res.redirect("/");
  } catch (err) {
    console.error("Login error:", err);
    res.render("login", { title: "Login - OutfitShare", error: "Login failed. Please try again." });
  }
});

// LOGOUT
app.get("/logout", (req, res) => {
  req.session.destroy();
  res.redirect("/");
});

// =====================
// HOME PAGE
// =====================
app.get("/", async (req, res) => {
  try {
    const [listings] = await db.query(`
      SELECT l.*, u.name AS owner_name, u.lend_rating AS owner_rating,
        (SELECT MAX(end_date) FROM availability_slots WHERE listing_id = l.listing_id) AS available_until
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

// =====================
// USERS LIST PAGE
// =====================
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

// =====================
// USER PROFILE PAGE
// =====================
app.get("/users/:id", async (req, res) => {
  try {
    const userId = req.params.id;

    const [users] = await db.query("SELECT * FROM users WHERE user_id = ?", [userId]);
    if (users.length === 0) {
      return res.status(404).render("error", { message: "User not found" });
    }
    const user = users[0];

    const [listings] = await db.query(`
      SELECT l.*, GROUP_CONCAT(t.name) AS tags
      FROM listings l
      LEFT JOIN listing_tags lt ON l.listing_id = lt.listing_id
      LEFT JOIN tags t ON lt.tag_id = t.tag_id
      WHERE l.owner_id = ?
      GROUP BY l.listing_id
      ORDER BY l.created_at DESC
    `, [userId]);

    const [reviews] = await db.query(`
      SELECT r.*, u.name AS reviewer_name, l.title AS listing_title
      FROM reviews r
      JOIN users u ON r.reviewer_id = u.user_id
      JOIN listings l ON r.listing_id = l.listing_id
      WHERE l.owner_id = ?
      ORDER BY r.created_at DESC
    `, [userId]);

    const [borrowCount] = await db.query(
      "SELECT COUNT(*) AS count FROM borrow_requests WHERE borrower_id = ? AND status = 'Completed'", [userId]
    );
    const [lendCount] = await db.query(
      "SELECT COUNT(*) AS count FROM transaction_history WHERE lender_id = ?", [userId]
    );

    res.render("profile", {
      title: `${user.name} - OutfitShare`,
      user,
      listings,
      reviews,
      stats: { borrows: borrowCount[0].count, lends: lendCount[0].count, listings: listings.length },
    });
  } catch (err) {
    console.error("Profile page error:", err);
    res.status(500).render("error", { message: "Unable to load profile" });
  }
});

// =====================
// LISTINGS PAGE (Browse)
// =====================
app.get("/listings", async (req, res) => {
  try {
    const { search, tag, size, type, location, match_size } = req.query;

    // Get user's size for Match My Size feature
    let userSize = null;
    if (req.session.user) {
      const [userData] = await db.query("SELECT clothing_size FROM users WHERE user_id = ?", [req.session.user.user_id]);
      if (userData.length > 0 && userData[0].clothing_size) userSize = userData[0].clothing_size;
    }

    let query = `
      SELECT l.*, u.name AS owner_name, u.lend_rating AS owner_rating,
        GROUP_CONCAT(DISTINCT t.name) AS tags,
        (SELECT MAX(end_date) FROM availability_slots WHERE listing_id = l.listing_id) AS available_until
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
    if (tag) { conditions.push("t.name = ?"); params.push(tag); }
    // Match My Size overrides manual size filter
    if (match_size === 'on' && userSize) {
      conditions.push("l.size = ?");
      params.push(userSize);
    } else if (size) {
      conditions.push("l.size = ?");
      params.push(size);
    }
    if (type) { conditions.push("l.listing_type = ?"); params.push(type); }
    if (location) { conditions.push("l.location LIKE ?"); params.push(`%${location}%`); }

    if (conditions.length > 0) query += " WHERE " + conditions.join(" AND ");
    query += " GROUP BY l.listing_id ORDER BY l.boost_active DESC, l.created_at DESC";

    const [listings] = await db.query(query, params);
    const [tags] = await db.query("SELECT * FROM tags ORDER BY name");
    const [locations] = await db.query("SELECT DISTINCT location FROM listings WHERE location IS NOT NULL ORDER BY location");

    res.render("listings", {
      title: "Browse Outfits - OutfitShare",
      listings, tags, locations,
      filters: { search, tag, size, type, location, match_size },
      userSize,
    });
  } catch (err) {
    console.error("Listings page error:", err);
    res.status(500).render("error", { message: "Unable to load listings" });
  }
});

// =====================
// LISTING DETAIL PAGE
// =====================
app.get("/listings/:id", async (req, res) => {
  try {
    const listingId = req.params.id;

    const [listings] = await db.query(`
      SELECT l.*, u.name AS owner_name, u.lend_rating AS owner_rating, 
             u.location AS owner_location, u.user_id AS owner_user_id,
             u.profile_image AS owner_image
      FROM listings l
      JOIN users u ON l.owner_id = u.user_id
      WHERE l.listing_id = ?
    `, [listingId]);

    if (listings.length === 0) return res.status(404).render("error", { message: "Listing not found" });
    const listing = listings[0];

    const [tags] = await db.query(`
      SELECT t.name AS tag_name FROM tags t
      JOIN listing_tags lt ON t.tag_id = lt.tag_id WHERE lt.listing_id = ?
    `, [listingId]);

    const [slots] = await db.query("SELECT * FROM availability_slots WHERE listing_id = ? ORDER BY start_date", [listingId]);

    const [reviews] = await db.query(`
      SELECT r.*, u.name AS reviewer_name FROM reviews r
      JOIN users u ON r.reviewer_id = u.user_id WHERE r.listing_id = ?
      ORDER BY r.created_at DESC
    `, [listingId]);

    const [related] = await db.query(`
      SELECT DISTINCT l.*, u.name AS owner_name FROM listings l
      JOIN users u ON l.owner_id = u.user_id
      JOIN listing_tags lt ON l.listing_id = lt.listing_id
      WHERE lt.tag_id IN (SELECT tag_id FROM listing_tags WHERE listing_id = ?)
        AND l.listing_id != ? LIMIT 4
    `, [listingId, listingId]);

    const avgRating = reviews.length > 0
      ? (reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length).toFixed(1) : null;

    res.render("detail", {
      title: `${listing.title} - OutfitShare`,
      listing, tags, slots, reviews, related, avgRating,
      borrowError: req.query.error || null,
    });
  } catch (err) {
    console.error("Detail page error:", err);
    res.status(500).render("error", { message: "Unable to load listing details" });
  }
});

// =====================
// CATEGORIES PAGE
// =====================
app.get("/categories", async (req, res) => {
  try {
    const [tags] = await db.query(`
      SELECT t.*, COUNT(lt.listing_id) AS listing_count FROM tags t
      LEFT JOIN listing_tags lt ON t.tag_id = lt.tag_id
      GROUP BY t.tag_id ORDER BY listing_count DESC
    `);

    const [allListings] = await db.query(`
      SELECT l.*, u.name AS owner_name, t.name AS tag_name, t.tag_id
      FROM listings l JOIN users u ON l.owner_id = u.user_id
      JOIN listing_tags lt ON l.listing_id = lt.listing_id
      JOIN tags t ON lt.tag_id = t.tag_id ORDER BY t.name, l.created_at DESC
    `);

    const tagListings = {};
    allListings.forEach((item) => {
      if (!tagListings[item.tag_name]) tagListings[item.tag_name] = [];
      if (!tagListings[item.tag_name].find((l) => l.listing_id === item.listing_id))
        tagListings[item.tag_name].push(item);
    });

    res.render("categories", { title: "Categories - OutfitShare", tags, tagListings });
  } catch (err) {
    console.error("Categories page error:", err);
    res.status(500).render("error", { message: "Unable to load categories" });
  }
});

// =====================
// CREATE LISTING (requires login)
// =====================
app.get("/create-listing", requireLogin, async (req, res) => {
  try {
    const [tags] = await db.query("SELECT * FROM tags ORDER BY name");
    res.render("create-listing", { title: "Create Listing - OutfitShare", tags, error: null, success: null });
  } catch (err) {
    console.error("Create listing page error:", err);
    res.status(500).render("error", { message: "Unable to load create listing page" });
  }
});

app.post("/create-listing", requireLogin, upload.single("image"), async (req, res) => {
  try {
    const { title, description, size, listing_type, location, allow_guests, tags, start_date, end_date } = req.body;
    const userId = req.session.user.user_id;
    const imageUrl = req.file ? `/uploads/${req.file.filename}` : null;

    if (!title || !description || !size) {
      const [allTags] = await db.query("SELECT * FROM tags ORDER BY name");
      return res.render("create-listing", { title: "Create Listing - OutfitShare", tags: allTags, error: "Title, description and size are required.", success: null });
    }

    if (!start_date || !end_date) {
      const [allTags] = await db.query("SELECT * FROM tags ORDER BY name");
      return res.render("create-listing", { title: "Create Listing - OutfitShare", tags: allTags, error: "Availability dates are required.", success: null });
    }

    // Insert listing
    const [result] = await db.query(
      "INSERT INTO listings (title, description, size, listing_type, allow_guest_requests, image_url, location, owner_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
      [title, description, size, listing_type || "Borrow", allow_guests ? true : false, imageUrl, location || null, userId]
    );

    const listingId = result.insertId;

    // Assign tags
    if (tags) {
      const tagArray = Array.isArray(tags) ? tags : [tags];
      for (const tagId of tagArray) {
        await db.query("INSERT INTO listing_tags (listing_id, tag_id) VALUES (?, ?)", [listingId, tagId]);
      }
    }

    // Create availability slot if dates provided
    if (start_date && end_date) {
      await db.query("INSERT INTO availability_slots (start_date, end_date, listing_id) VALUES (?, ?, ?)",
        [start_date, end_date, listingId]);
    }

    res.redirect(`/listings/${listingId}`);
  } catch (err) {
    console.error("Create listing error:", err);
    const [allTags] = await db.query("SELECT * FROM tags ORDER BY name");
    res.render("create-listing", { title: "Create Listing - OutfitShare", tags: allTags, error: "Failed to create listing.", success: null });
  }
});

// =====================
// BORROW REQUEST (from detail page)
// =====================
app.post("/borrow/:id", requireLogin, async (req, res) => {
  try {
    const listingId = req.params.id;
    const userId = req.session.user.user_id;
    const { start_date, end_date } = req.body;

    // Check user isn't borrowing their own listing
    const [listing] = await db.query("SELECT owner_id FROM listings WHERE listing_id = ?", [listingId]);
    if (listing.length > 0 && listing[0].owner_id === userId) {
      return res.redirect(`/listings/${listingId}?error=own`);
    }

    // Check dates fall within availability
    const [avail] = await db.query(
      "SELECT slot_id FROM availability_slots WHERE listing_id = ? AND start_date <= ? AND end_date >= ?",
      [listingId, start_date, end_date]
    );
    if (avail.length === 0) {
      return res.redirect(`/listings/${listingId}?error=dates`);
    }

    // Check for overlapping requests
    const [overlap] = await db.query(`
      SELECT request_id FROM borrow_requests 
      WHERE listing_id = ? AND status IN ('Approved', 'Active')
        AND start_date <= ? AND end_date >= ?
    `, [listingId, end_date, start_date]);

    if (overlap.length > 0) {
      return res.redirect(`/listings/${listingId}?error=overlap`);
    }

    await db.query(
      "INSERT INTO borrow_requests (start_date, end_date, borrower_id, listing_id) VALUES (?, ?, ?, ?)",
      [start_date, end_date, userId, listingId]
    );

    // Create notification for lender
    if (listing.length > 0) {
      await db.query(
        "INSERT INTO notifications (type, message, user_id) VALUES (?, ?, ?)",
        ["Request", `New borrow request for your listing`, listing[0].owner_id]
      );
    }

    res.redirect("/dashboard/borrow");
  } catch (err) {
    console.error("Borrow request error:", err);
    res.redirect(`/listings/${req.params.id}?error=fail`);
  }
});

// =====================
// BORROW DASHBOARD
// =====================
app.get("/dashboard/borrow", requireLogin, async (req, res) => {
  try {
    const userId = req.session.user.user_id;

    const [pending] = await db.query(`
      SELECT br.*, l.title, l.size, l.image_url, u.name AS lender_name
      FROM borrow_requests br
      JOIN listings l ON br.listing_id = l.listing_id
      JOIN users u ON l.owner_id = u.user_id
      WHERE br.borrower_id = ? AND br.status = 'Pending'
      ORDER BY br.request_date DESC
    `, [userId]);

    const [approved] = await db.query(`
      SELECT br.*, l.title, l.size, l.image_url, u.name AS lender_name
      FROM borrow_requests br
      JOIN listings l ON br.listing_id = l.listing_id
      JOIN users u ON l.owner_id = u.user_id
      WHERE br.borrower_id = ? AND br.status = 'Approved'
      ORDER BY br.start_date ASC
    `, [userId]);

    const [active] = await db.query(`
      SELECT br.*, l.title, l.size, l.image_url, u.name AS lender_name
      FROM borrow_requests br
      JOIN listings l ON br.listing_id = l.listing_id
      JOIN users u ON l.owner_id = u.user_id
      WHERE br.borrower_id = ? AND br.status = 'Active'
      ORDER BY br.end_date ASC
    `, [userId]);

    const [completed] = await db.query(`
      SELECT br.*, l.title, l.size, l.image_url, u.name AS lender_name,
        (SELECT review_id FROM reviews WHERE reviewer_id = ? AND listing_id = br.listing_id LIMIT 1) AS has_review
      FROM borrow_requests br
      JOIN listings l ON br.listing_id = l.listing_id
      JOIN users u ON l.owner_id = u.user_id
      WHERE br.borrower_id = ? AND br.status IN ('Completed', 'Returned')
      ORDER BY br.end_date DESC
    `, [userId, userId]);

    res.render("dashboard-borrow", {
      title: "Borrow Dashboard - OutfitShare",
      pending, approved, active, completed,
    });
  } catch (err) {
    console.error("Borrow dashboard error:", err);
    res.status(500).render("error", { message: "Unable to load borrow dashboard" });
  }
});

// Cancel borrow request
app.post("/borrow/:id/cancel", requireLogin, async (req, res) => {
  await db.query("UPDATE borrow_requests SET status = 'Cancelled' WHERE request_id = ? AND borrower_id = ?",
    [req.params.id, req.session.user.user_id]);
  res.redirect("/dashboard/borrow");
});

// =====================
// LENDING DASHBOARD
// =====================
app.get("/dashboard/lend", requireLogin, async (req, res) => {
  try {
    const userId = req.session.user.user_id;

    const [incoming] = await db.query(`
      SELECT br.*, l.title, l.size, u.name AS borrower_name, u.borrow_rating
      FROM borrow_requests br
      JOIN listings l ON br.listing_id = l.listing_id
      JOIN users u ON br.borrower_id = u.user_id
      WHERE l.owner_id = ? AND br.status = 'Pending'
      ORDER BY br.request_date DESC
    `, [userId]);

    const [activeLends] = await db.query(`
      SELECT br.*, l.title, l.size, u.name AS borrower_name
      FROM borrow_requests br
      JOIN listings l ON br.listing_id = l.listing_id
      JOIN users u ON br.borrower_id = u.user_id
      WHERE l.owner_id = ? AND br.status IN ('Approved', 'Active')
      ORDER BY br.end_date ASC
    `, [userId]);

    const [completedLends] = await db.query(`
      SELECT br.*, l.title, l.size, u.name AS borrower_name, u.borrow_rating
      FROM borrow_requests br
      JOIN listings l ON br.listing_id = l.listing_id
      JOIN users u ON br.borrower_id = u.user_id
      WHERE l.owner_id = ? AND br.status IN ('Completed', 'Returned')
      ORDER BY br.end_date DESC
    `, [userId]);

    res.render("dashboard-lend", {
      title: "Lending Dashboard - OutfitShare",
      incoming, activeLends, completedLends,
    });
  } catch (err) {
    console.error("Lend dashboard error:", err);
    res.status(500).render("error", { message: "Unable to load lending dashboard" });
  }
});

// Approve borrow request
app.post("/lend/:id/approve", requireLogin, async (req, res) => {
  const [request] = await db.query("SELECT br.*, l.owner_id FROM borrow_requests br JOIN listings l ON br.listing_id = l.listing_id WHERE br.request_id = ?", [req.params.id]);
  if (request.length > 0 && request[0].owner_id === req.session.user.user_id) {
    await db.query("UPDATE borrow_requests SET status = 'Approved' WHERE request_id = ?", [req.params.id]);
    await db.query("INSERT INTO notifications (type, message, user_id) VALUES (?, ?, ?)",
      ["Approval", "Your borrow request has been approved!", request[0].borrower_id]);
  }
  res.redirect("/dashboard/lend");
});

// Reject borrow request
app.post("/lend/:id/reject", requireLogin, async (req, res) => {
  const [request] = await db.query("SELECT br.*, l.owner_id FROM borrow_requests br JOIN listings l ON br.listing_id = l.listing_id WHERE br.request_id = ?", [req.params.id]);
  if (request.length > 0 && request[0].owner_id === req.session.user.user_id) {
    await db.query("UPDATE borrow_requests SET status = 'Rejected' WHERE request_id = ?", [req.params.id]);
    await db.query("INSERT INTO notifications (type, message, user_id) VALUES (?, ?, ?)",
      ["Rejection", "Your borrow request has been declined.", request[0].borrower_id]);
  }
  res.redirect("/dashboard/lend");
});

// Confirm return
app.post("/lend/:id/return", requireLogin, async (req, res) => {
  const [request] = await db.query("SELECT br.*, l.owner_id, l.listing_id FROM borrow_requests br JOIN listings l ON br.listing_id = l.listing_id WHERE br.request_id = ?", [req.params.id]);
  if (request.length > 0 && request[0].owner_id === req.session.user.user_id) {
    await db.query("UPDATE borrow_requests SET status = 'Completed' WHERE request_id = ?", [req.params.id]);
    // Record transaction
    await db.query("INSERT INTO transaction_history (status, borrower_id, lender_id, listing_id) VALUES (?, ?, ?, ?)",
      ["Completed", request[0].borrower_id, req.session.user.user_id, request[0].listing_id]);
    // Award points
    await db.query("UPDATE users SET reward_points = reward_points + 10 WHERE user_id = ?", [req.session.user.user_id]);
    await db.query("UPDATE users SET reward_points = reward_points + 5 WHERE user_id = ?", [request[0].borrower_id]);
    await db.query("INSERT INTO reward_transactions (type, points, user_id) VALUES (?, ?, ?)", ["Lend Complete", 10, req.session.user.user_id]);
    await db.query("INSERT INTO reward_transactions (type, points, user_id) VALUES (?, ?, ?)", ["Borrow Complete", 5, request[0].borrower_id]);
  }
  res.redirect("/dashboard/lend");
});

// =====================
// NOTIFICATIONS PAGE
// =====================
app.get("/notifications", requireLogin, async (req, res) => {
  try {
    const userId = req.session.user.user_id;
    const [notifications] = await db.query(
      "SELECT * FROM notifications WHERE user_id = ? ORDER BY created_at DESC",
      [userId]
    );

    // Mark all as read
    await db.query("UPDATE notifications SET is_read = TRUE WHERE user_id = ?", [userId]);

    // Get reward points
    const [user] = await db.query("SELECT reward_points FROM users WHERE user_id = ?", [userId]);

    res.render("notifications", {
      title: "Notifications - OutfitShare",
      notifications,
      rewardPoints: user[0] ? user[0].reward_points : 0,
    });
  } catch (err) {
    console.error("Notifications error:", err);
    res.status(500).render("error", { message: "Unable to load notifications" });
  }
});

// =====================
// LEAVE REVIEW
// =====================
app.post("/review/:listing_id", requireLogin, async (req, res) => {
  try {
    const { rating, comment } = req.body;
    const listingId = req.params.listing_id;
    const userId = req.session.user.user_id;

    await db.query(
      "INSERT INTO reviews (rating, comment, reviewer_id, listing_id) VALUES (?, ?, ?, ?)",
      [rating, comment, userId, listingId]
    );

    res.redirect(`/listings/${listingId}`);
  } catch (err) {
    console.error("Review error:", err);
    res.redirect("/dashboard/borrow");
  }
});

// =====================
// MY LISTINGS
// =====================
app.get("/my-listings", requireLogin, async (req, res) => {
  try {
    const userId = req.session.user.user_id;
    const [listings] = await db.query(`
      SELECT l.*, GROUP_CONCAT(t.name) AS tags,
        (SELECT COUNT(*) FROM borrow_requests WHERE listing_id = l.listing_id AND status = 'Pending') AS pending_requests,
        (SELECT COUNT(*) FROM borrow_requests WHERE listing_id = l.listing_id AND status IN ('Approved','Active')) AS active_borrows
      FROM listings l
      LEFT JOIN listing_tags lt ON l.listing_id = lt.listing_id
      LEFT JOIN tags t ON lt.tag_id = t.tag_id
      WHERE l.owner_id = ?
      GROUP BY l.listing_id
      ORDER BY l.created_at DESC
    `, [userId]);

    res.render("my-listings", { title: "My Listings - OutfitShare", listings });
  } catch (err) {
    console.error("My listings error:", err);
    res.status(500).render("error", { message: "Unable to load your listings" });
  }
});

// =====================
// EDIT LISTING
// =====================
app.get("/listings/:id/edit", requireLogin, async (req, res) => {
  try {
    const listingId = req.params.id;
    const userId = req.session.user.user_id;

    const [listings] = await db.query("SELECT * FROM listings WHERE listing_id = ? AND owner_id = ?", [listingId, userId]);
    if (listings.length === 0) return res.status(403).render("error", { message: "You can only edit your own listings." });

    const listing = listings[0];
    const [tags] = await db.query("SELECT * FROM tags ORDER BY name");
    const [selectedTags] = await db.query("SELECT tag_id FROM listing_tags WHERE listing_id = ?", [listingId]);
    const selectedTagIds = selectedTags.map(t => t.tag_id);
    const [slots] = await db.query("SELECT * FROM availability_slots WHERE listing_id = ? LIMIT 1", [listingId]);

    res.render("edit-listing", { title: "Edit Listing - OutfitShare", listing, tags, selectedTagIds, slot: slots[0] || null, error: null });
  } catch (err) {
    console.error("Edit listing page error:", err);
    res.status(500).render("error", { message: "Unable to load edit page" });
  }
});

app.post("/listings/:id/edit", requireLogin, upload.single("image"), async (req, res) => {
  try {
    const listingId = req.params.id;
    const userId = req.session.user.user_id;
    const { title, description, size, listing_type, location, allow_guests, tags, start_date, end_date } = req.body;

    // Verify ownership
    const [check] = await db.query("SELECT listing_id, image_url FROM listings WHERE listing_id = ? AND owner_id = ?", [listingId, userId]);
    if (check.length === 0) return res.status(403).render("error", { message: "Not authorised." });

    const imageUrl = req.file ? `/uploads/${req.file.filename}` : check[0].image_url;

    // Update listing
    await db.query(
      "UPDATE listings SET title = ?, description = ?, size = ?, listing_type = ?, allow_guest_requests = ?, image_url = ?, location = ? WHERE listing_id = ?",
      [title, description, size, listing_type || "Borrow", allow_guests ? true : false, imageUrl, location || null, listingId]
    );

    // Update tags
    await db.query("DELETE FROM listing_tags WHERE listing_id = ?", [listingId]);
    if (tags) {
      const tagArray = Array.isArray(tags) ? tags : [tags];
      for (const tagId of tagArray) {
        await db.query("INSERT INTO listing_tags (listing_id, tag_id) VALUES (?, ?)", [listingId, tagId]);
      }
    }

    // Update availability
    await db.query("DELETE FROM availability_slots WHERE listing_id = ?", [listingId]);
    if (start_date && end_date) {
      await db.query("INSERT INTO availability_slots (start_date, end_date, listing_id) VALUES (?, ?, ?)", [start_date, end_date, listingId]);
    }

    res.redirect(`/listings/${listingId}`);
  } catch (err) {
    console.error("Edit listing error:", err);
    res.redirect(`/listings/${listingId}/edit`);
  }
});

// =====================
// DELETE LISTING
// =====================
app.post("/listings/:id/delete", requireLogin, async (req, res) => {
  try {
    const listingId = req.params.id;
    const userId = req.session.user.user_id;

    await db.query("DELETE FROM listings WHERE listing_id = ? AND owner_id = ?", [listingId, userId]);
    res.redirect("/my-listings");
  } catch (err) {
    console.error("Delete listing error:", err);
    res.redirect("/my-listings");
  }
});

// =====================
// BOOST LISTING (costs 50 reward points, lasts 7 days)
// =====================
const BOOST_COST = 50;
const BOOST_DAYS = 7;

app.post("/listings/:id/boost", requireLogin, async (req, res) => {
  try {
    const listingId = req.params.id;
    const userId = req.session.user.user_id;

    // Verify ownership
    const [listing] = await db.query("SELECT * FROM listings WHERE listing_id = ? AND owner_id = ?", [listingId, userId]);
    if (listing.length === 0) return res.redirect("/my-listings");

    // Check if already boosted
    if (listing[0].boost_active && listing[0].boost_expiry && new Date(listing[0].boost_expiry) > new Date()) {
      return res.redirect(`/listings/${listingId}?error=already_boosted`);
    }

    // Check user has enough points
    const [user] = await db.query("SELECT reward_points FROM users WHERE user_id = ?", [userId]);
    if (user[0].reward_points < BOOST_COST) {
      return res.redirect(`/listings/${listingId}?error=insufficient_points`);
    }

    // Deduct points and activate boost
    const boostExpiry = new Date();
    boostExpiry.setDate(boostExpiry.getDate() + BOOST_DAYS);

    await db.query("UPDATE listings SET boost_active = TRUE, boost_expiry = ? WHERE listing_id = ?", [boostExpiry, listingId]);
    await db.query("UPDATE users SET reward_points = reward_points - ? WHERE user_id = ?", [BOOST_COST, userId]);
    await db.query("INSERT INTO reward_transactions (type, points, user_id) VALUES (?, ?, ?)", ["Boost", -BOOST_COST, userId]);
    await db.query("INSERT INTO notifications (type, message, user_id) VALUES (?, ?, ?)",
      ["Reward", `Your listing "${listing[0].title}" has been boosted for ${BOOST_DAYS} days!`, userId]);

    res.redirect(`/listings/${listingId}`);
  } catch (err) {
    console.error("Boost error:", err);
    res.redirect("/my-listings");
  }
});

// =====================
// EDIT PROFILE
// =====================
app.get("/edit-profile", requireLogin, async (req, res) => {
  try {
    const [users] = await db.query("SELECT * FROM users WHERE user_id = ?", [req.session.user.user_id]);
    if (users.length === 0) return res.redirect("/");

    res.render("edit-profile", { title: "Edit Profile - OutfitShare", user: users[0], error: null, success: null });
  } catch (err) {
    console.error("Edit profile error:", err);
    res.status(500).render("error", { message: "Unable to load profile editor" });
  }
});

app.post("/edit-profile", requireLogin, upload.single("profile_image"), async (req, res) => {
  try {
    const userId = req.session.user.user_id;
    const { name, bio, location, height, weight, age, clothing_size, phone, date_of_birth, address } = req.body;

    const profileCompleted = (height && age && clothing_size) ? true : false;

    const [current] = await db.query("SELECT profile_image FROM users WHERE user_id = ?", [userId]);
    const profileImage = req.file ? `/uploads/${req.file.filename}` : (current[0] ? current[0].profile_image : null);

    await db.query(
      `UPDATE users SET name=?, bio=?, location=?, height=?, weight=?, age=?, clothing_size=?, 
       profile_completed=?, profile_image=?, phone=?, date_of_birth=?, address=? WHERE user_id=?`,
      [name, bio||null, location||null, height||null, weight||null, age||null, clothing_size||null,
       profileCompleted, profileImage, phone||null, date_of_birth||null, address||null, userId]
    );

    req.session.user.name = name;
    req.session.user.profile_image = profileImage;

    const [users] = await db.query("SELECT * FROM users WHERE user_id = ?", [userId]);
    res.render("edit-profile", { title: "Edit Profile - OutfitShare", user: users[0], error: null, success: "Profile updated successfully!" });
  } catch (err) {
    console.error("Edit profile error:", err);
    res.redirect("/edit-profile");
  }
});

// =====================
// SETTINGS PAGE
// =====================
app.get("/settings", requireLogin, async (req, res) => {
  try {
    const [users] = await db.query("SELECT * FROM users WHERE user_id = ?", [req.session.user.user_id]);
    res.render("settings", { title: "Settings - OutfitShare", user: users[0], error: null, success: null });
  } catch (err) {
    console.error("Settings error:", err);
    res.status(500).render("error", { message: "Unable to load settings" });
  }
});

// Change Password
app.post("/settings/password", requireLogin, async (req, res) => {
  try {
    const userId = req.session.user.user_id;
    const { current_password, new_password, confirm_password } = req.body;

    const [users] = await db.query("SELECT * FROM users WHERE user_id = ?", [userId]);
    const user = users[0];

    // Verify current password
    let validPassword = false;
    if (user.password.startsWith("$2")) {
      validPassword = await bcrypt.compare(current_password, user.password);
    } else {
      validPassword = (current_password === user.password);
    }

    if (!validPassword) {
      return res.render("settings", { title: "Settings - OutfitShare", user, error: "Current password is incorrect.", success: null });
    }
    if (new_password.length < 6) {
      return res.render("settings", { title: "Settings - OutfitShare", user, error: "New password must be at least 6 characters.", success: null });
    }
    if (new_password !== confirm_password) {
      return res.render("settings", { title: "Settings - OutfitShare", user, error: "New passwords do not match.", success: null });
    }

    const hashedPassword = await bcrypt.hash(new_password, 10);
    await db.query("UPDATE users SET password = ? WHERE user_id = ?", [hashedPassword, userId]);

    res.render("settings", { title: "Settings - OutfitShare", user, error: null, success: "Password changed successfully!" });
  } catch (err) {
    console.error("Password change error:", err);
    res.redirect("/settings");
  }
});

// Update Privacy Settings
app.post("/settings/privacy", requireLogin, async (req, res) => {
  try {
    const userId = req.session.user.user_id;
    const { privacy_email, privacy_phone, privacy_age, privacy_location } = req.body;

    await db.query(
      "UPDATE users SET privacy_email=?, privacy_phone=?, privacy_age=?, privacy_location=? WHERE user_id=?",
      [privacy_email ? true : false, privacy_phone ? true : false, privacy_age ? true : false, privacy_location ? true : false, userId]
    );

    const [users] = await db.query("SELECT * FROM users WHERE user_id = ?", [userId]);
    res.render("settings", { title: "Settings - OutfitShare", user: users[0], error: null, success: "Privacy settings updated!" });
  } catch (err) {
    console.error("Privacy settings error:", err);
    res.redirect("/settings");
  }
});

// =====================
// ADMIN PANEL
// =====================
app.get("/admin", requireAdmin, async (req, res) => {
  try {
    const [userCount] = await db.query("SELECT COUNT(*) AS count FROM users");
    const [listingCount] = await db.query("SELECT COUNT(*) AS count FROM listings");
    const [requestCount] = await db.query("SELECT COUNT(*) AS count FROM borrow_requests WHERE status = 'Pending'");
    const [reviewCount] = await db.query("SELECT COUNT(*) AS count FROM reviews");

    const [recentUsers] = await db.query("SELECT * FROM users ORDER BY created_at DESC LIMIT 5");
    const [recentListings] = await db.query(`
      SELECT l.*, u.name AS owner_name FROM listings l
      JOIN users u ON l.owner_id = u.user_id
      ORDER BY l.created_at DESC LIMIT 5
    `);
    const [recentReviews] = await db.query(`
      SELECT r.*, u.name AS reviewer_name, l.title AS listing_title
      FROM reviews r JOIN users u ON r.reviewer_id = u.user_id
      JOIN listings l ON r.listing_id = l.listing_id
      ORDER BY r.created_at DESC LIMIT 5
    `);

    res.render("admin/dashboard", {
      title: "Admin Dashboard - OutfitShare",
      stats: { users: userCount[0].count, listings: listingCount[0].count, pendingRequests: requestCount[0].count, reviews: reviewCount[0].count },
      recentUsers, recentListings, recentReviews,
    });
  } catch (err) {
    console.error("Admin dashboard error:", err);
    res.status(500).render("error", { message: "Unable to load admin dashboard" });
  }
});

// Admin - Manage Users
app.get("/admin/users", requireAdmin, async (req, res) => {
  try {
    const [users] = await db.query(`
      SELECT u.*, 
        (SELECT COUNT(*) FROM listings WHERE owner_id = u.user_id) AS listing_count,
        (SELECT COUNT(*) FROM borrow_requests WHERE borrower_id = u.user_id) AS request_count
      FROM users u ORDER BY u.created_at DESC
    `);
    res.render("admin/users", { title: "Manage Users - Admin", users });
  } catch (err) {
    console.error("Admin users error:", err);
    res.status(500).render("error", { message: "Unable to load users" });
  }
});

// Admin - Manage Listings
app.get("/admin/listings", requireAdmin, async (req, res) => {
  try {
    const [listings] = await db.query(`
      SELECT l.*, u.name AS owner_name,
        (SELECT COUNT(*) FROM borrow_requests WHERE listing_id = l.listing_id) AS request_count,
        (SELECT COUNT(*) FROM reviews WHERE listing_id = l.listing_id) AS review_count
      FROM listings l JOIN users u ON l.owner_id = u.user_id
      ORDER BY l.created_at DESC
    `);
    res.render("admin/listings", { title: "Manage Listings - Admin", listings });
  } catch (err) {
    console.error("Admin listings error:", err);
    res.status(500).render("error", { message: "Unable to load listings" });
  }
});

// Admin - Manage Reviews
app.get("/admin/reviews", requireAdmin, async (req, res) => {
  try {
    const [reviews] = await db.query(`
      SELECT r.*, u.name AS reviewer_name, l.title AS listing_title, l.listing_id
      FROM reviews r JOIN users u ON r.reviewer_id = u.user_id
      JOIN listings l ON r.listing_id = l.listing_id
      ORDER BY r.created_at DESC
    `);
    res.render("admin/reviews", { title: "Manage Reviews - Admin", reviews });
  } catch (err) {
    console.error("Admin reviews error:", err);
    res.status(500).render("error", { message: "Unable to load reviews" });
  }
});

// Admin - Remove Listing
app.post("/admin/listings/:id/remove", requireAdmin, async (req, res) => {
  try {
    const [listing] = await db.query("SELECT owner_id, title FROM listings WHERE listing_id = ?", [req.params.id]);
    await db.query("DELETE FROM listings WHERE listing_id = ?", [req.params.id]);
    if (listing.length > 0) {
      await db.query("INSERT INTO notifications (type, message, user_id) VALUES (?, ?, ?)",
        ["Admin", `Your listing "${listing[0].title}" was removed by a moderator.`, listing[0].owner_id]);
    }
    res.redirect("/admin/listings");
  } catch (err) {
    console.error("Admin remove listing error:", err);
    res.redirect("/admin/listings");
  }
});

// Admin - Remove Review
app.post("/admin/reviews/:id/remove", requireAdmin, async (req, res) => {
  try {
    await db.query("DELETE FROM reviews WHERE review_id = ?", [req.params.id]);
    res.redirect("/admin/reviews");
  } catch (err) {
    console.error("Admin remove review error:", err);
    res.redirect("/admin/reviews");
  }
});

// Admin - Suspend User
app.post("/admin/users/:id/suspend", requireAdmin, async (req, res) => {
  try {
    await db.query("UPDATE users SET role = 'suspended' WHERE user_id = ? AND role != 'admin'", [req.params.id]);
    await db.query("INSERT INTO notifications (type, message, user_id) VALUES (?, ?, ?)",
      ["Admin", "Your account has been suspended by a moderator.", req.params.id]);
    res.redirect("/admin/users");
  } catch (err) {
    console.error("Admin suspend error:", err);
    res.redirect("/admin/users");
  }
});

// Admin - Reinstate User
app.post("/admin/users/:id/reinstate", requireAdmin, async (req, res) => {
  try {
    await db.query("UPDATE users SET role = 'user' WHERE user_id = ?", [req.params.id]);
    res.redirect("/admin/users");
  } catch (err) {
    console.error("Admin reinstate error:", err);
    res.redirect("/admin/users");
  }
});

// =====================
// STATIC PAGES
// =====================
app.get("/about", (req, res) => {
  res.render("about", { title: "About Us - OutfitShare" });
});

app.get("/contact", (req, res) => {
  res.render("contact", { title: "Contact Us - OutfitShare" });
});

app.post("/contact", (req, res) => {
  // In production this would send an email
  res.render("contact", { title: "Contact Us - OutfitShare", success: "Thank you for your message! We'll get back to you within 48 hours." });
});

app.get("/terms", (req, res) => {
  res.render("terms", { title: "Terms of Use - OutfitShare" });
});

// 404 handler
app.use((req, res) => {
  res.status(404).render("error", { message: "Page not found" });
});

// Start server
app.listen(PORT, () => {
  console.log(`OutfitShare is running at http://localhost:${PORT}`);
});
