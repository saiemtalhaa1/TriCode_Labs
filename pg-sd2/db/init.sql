-- OutfitShare Database
-- Sprint 3 schema with all features

CREATE DATABASE IF NOT EXISTS outfitshare;
USE outfitshare;

-- ================
-- Users table
-- ================
CREATE TABLE IF NOT EXISTS Users (
    user_id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(150) NOT NULL,
    password VARCHAR(255) NOT NULL,
    location VARCHAR(100),
    clothing_size VARCHAR(10),
    bio TEXT,
    profile_image VARCHAR(500),
    reward_points INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ================
-- Listings table (outfits people share)
-- ================
CREATE TABLE IF NOT EXISTS Listings (
    listing_id INT AUTO_INCREMENT PRIMARY KEY,
    title VARCHAR(200) NOT NULL,
    description TEXT,
    size VARCHAR(20),
    location VARCHAR(100),
    image_url VARCHAR(500),
    owner_id INT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (owner_id) REFERENCES Users(user_id)
);

-- ================
-- Tags table (categories)
-- ================
CREATE TABLE IF NOT EXISTS Tags (
    tag_id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(50) NOT NULL,
    description VARCHAR(255)
);

-- ================
-- ListingTags table (many to many between listings and tags)
-- ================
CREATE TABLE IF NOT EXISTS ListingTags (
    listing_id INT NOT NULL,
    tag_id INT NOT NULL,
    PRIMARY KEY (listing_id, tag_id),
    FOREIGN KEY (listing_id) REFERENCES Listings(listing_id),
    FOREIGN KEY (tag_id) REFERENCES Tags(tag_id)
);

-- ================
-- BorrowRequests table (when users ask to borrow an outfit)
-- ================
CREATE TABLE IF NOT EXISTS BorrowRequests (
    request_id INT AUTO_INCREMENT PRIMARY KEY,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    status VARCHAR(20) DEFAULT 'Pending',
    borrower_id INT NOT NULL,
    listing_id INT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (borrower_id) REFERENCES Users(user_id),
    FOREIGN KEY (listing_id) REFERENCES Listings(listing_id)
);

-- ================
-- Notifications table (in-app messages)
-- ================
CREATE TABLE IF NOT EXISTS Notifications (
    notification_id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    message VARCHAR(500),
    is_read INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES Users(user_id)
);

-- ================
-- Rewards table (history of points earned)
-- ================
CREATE TABLE IF NOT EXISTS Rewards (
    reward_id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    points INT NOT NULL,
    reason VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES Users(user_id)
);

-- ================
-- Reviews table (ratings and comments on listings)
-- ================
CREATE TABLE IF NOT EXISTS Reviews (
    review_id INT AUTO_INCREMENT PRIMARY KEY,
    listing_id INT NOT NULL,
    reviewer_id INT NOT NULL,
    rating INT NOT NULL,
    comment TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (listing_id) REFERENCES Listings(listing_id),
    FOREIGN KEY (reviewer_id) REFERENCES Users(user_id)
);

-- ==================
-- Insert test users (with profile pictures)
-- ==================
INSERT INTO Users (name, email, password, location, clothing_size, bio, profile_image, reward_points) VALUES
('Jane Doe', 'jane@example.com', 'password123', 'London', 'M', 'Fashion lover who likes sharing outfits', 'https://randomuser.me/api/portraits/women/44.jpg', 120),
('Alex Smith', 'alex@example.com', 'password123', 'Manchester', 'L', 'Sustainable fashion enthusiast', 'https://randomuser.me/api/portraits/men/32.jpg', 85),
('Priya Patel', 'priya@example.com', 'password123', 'London', 'S', 'Student who loves dressing up for events', 'https://randomuser.me/api/portraits/women/68.jpg', 200),
('Tom Wilson', 'tom@example.com', 'password123', 'Birmingham', 'XL', 'Community minded guy who believes in reducing waste', 'https://randomuser.me/api/portraits/men/75.jpg', 50),
('Mia Chen', 'mia@example.com', 'password123', 'Bristol', 'M', 'Designer with a passion for circular fashion', 'https://randomuser.me/api/portraits/women/26.jpg', 150),
('Sam Johnson', 'sam@example.com', 'password123', 'Leeds', 'M', 'New to OutfitShare', 'https://randomuser.me/api/portraits/men/46.jpg', 0),
('Olivia Brown', 'olivia@example.com', 'password123', 'London', 'M', 'Event planner looking for the perfect outfit', 'https://randomuser.me/api/portraits/women/90.jpg', 95),
('Raj Kumar', 'raj@example.com', 'password123', 'Edinburgh', 'L', 'Believes fashion should be accessible to everyone', 'https://randomuser.me/api/portraits/men/46.jpg', 70);

-- ==================
-- Insert test tags (categories)
-- ==================
INSERT INTO Tags (name, description) VALUES
('Dresses', 'All types of dresses including casual and formal'),
('Jackets', 'Jackets, blazers and outerwear'),
('Tops', 'T-shirts, blouses and other upper body clothing'),
('Trousers', 'Jeans, chinos and other bottoms'),
('Shoes', 'All types of footwear'),
('Accessories', 'Bags, belts, scarves and jewellery'),
('Formal', 'Suits, gowns and formal event clothing'),
('Casual', 'Everyday and streetwear');

-- ==================
-- Insert test listings (with outfit images from Unsplash)
-- ==================
INSERT INTO Listings (title, description, size, location, image_url, owner_id) VALUES
('Summer Blazer', 'Light cotton blazer perfect for summer events', 'M', 'London', 'https://images.unsplash.com/photo-1591047139829-d91aecb6caea?w=400&h=300&fit=crop', 1),
('Blue Blouse', 'Elegant silk blouse great for office or dinner', 'S', 'London', 'https://images.unsplash.com/photo-1564257631407-4deb1f99d992?w=400&h=300&fit=crop', 1),
('Denim Jacket', 'Classic denim jacket great for layering in spring', 'M', 'Manchester', 'https://images.unsplash.com/photo-1551537482-f2075a1d41f2?w=400&h=300&fit=crop', 2),
('Evening Gown', 'Stunning black evening gown for formal events', 'S', 'London', 'https://images.unsplash.com/photo-1566174053879-31528523f8ae?w=400&h=300&fit=crop', 3),
('White Trainers', 'Clean white sneakers UK size 8', '8', 'Birmingham', 'https://images.unsplash.com/photo-1549298916-b41d501d3772?w=400&h=300&fit=crop', 4),
('Floral Maxi Dress', 'Beautiful floral print maxi dress for weddings', 'M', 'Bristol', 'https://images.unsplash.com/photo-1572804013309-59a88b7e92f1?w=400&h=300&fit=crop', 5),
('Grey Suit', 'Two piece grey suit ideal for interviews', 'L', 'London', 'https://images.unsplash.com/photo-1594938298603-c8148c4dae35?w=400&h=300&fit=crop', 7),
('Vintage Leather Bag', 'Genuine leather vintage handbag', 'One Size', 'Edinburgh', 'https://images.unsplash.com/photo-1548036328-c9fa89d128fa?w=400&h=300&fit=crop', 8);

-- ==================
-- Link listings to tags
-- ==================
INSERT INTO ListingTags (listing_id, tag_id) VALUES
(1, 2), (1, 7),
(2, 3), (2, 7),
(3, 2), (3, 8),
(4, 1), (4, 7),
(5, 5), (5, 8),
(6, 1), (6, 8),
(7, 7),
(8, 6);

-- ==================
-- Sample borrow requests
-- ==================
INSERT INTO BorrowRequests (start_date, end_date, status, borrower_id, listing_id) VALUES
('2026-04-05', '2026-04-08', 'Approved', 3, 1),
('2026-04-12', '2026-04-14', 'Pending', 5, 4),
('2026-04-20', '2026-04-25', 'Completed', 7, 3),
('2026-04-22', '2026-04-26', 'Pending', 7, 6);

-- ==================
-- Sample reviews
-- ==================
INSERT INTO Reviews (listing_id, reviewer_id, rating, comment) VALUES
(1, 3, 5, 'Loved the blazer! Fit perfectly and Jane was so easy to deal with.'),
(3, 7, 4, 'Great jacket, looked amazing at the festival. Slight wear but nothing major.'),
(4, 5, 5, 'Stunning gown, made me feel like a princess at the gala.'),
(5, 7, 4, 'Comfortable trainers and clean condition.'),
(7, 3, 5, 'Saved me for my interview. Tom was super helpful.');

-- ==================
-- Sample reward history
-- ==================
INSERT INTO Rewards (user_id, points, reason) VALUES
(1, 10, 'Lend completed'),
(1, 10, 'Lend completed'),
(3, 5, 'Borrow completed'),
(2, 10, 'Lend completed'),
(7, 5, 'Borrow completed');

-- ==================
-- Sample notifications
-- ==================
INSERT INTO Notifications (user_id, message, is_read) VALUES
(1, 'New borrow request for Summer Blazer', 0),
(1, 'You earned 10 points for completing a lend!', 1),
(3, 'Your borrow request was approved!', 0),
(5, 'New borrow request for Floral Maxi Dress', 0);
