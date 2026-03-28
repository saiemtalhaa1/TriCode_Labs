-- OutfitShare Database Schema
-- Based on Sprint 2 ERD

CREATE DATABASE IF NOT EXISTS outfitshare;
USE outfitshare;

-- Users table
CREATE TABLE IF NOT EXISTS users (
    user_id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(150) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    height FLOAT DEFAULT NULL,
    weight FLOAT DEFAULT NULL,
    age INT DEFAULT NULL,
    clothing_size VARCHAR(10) DEFAULT NULL,
    borrow_rating FLOAT DEFAULT 0.0,
    lend_rating FLOAT DEFAULT 0.0,
    reward_points INT DEFAULT 0,
    profile_completed BOOLEAN DEFAULT FALSE,
    bio TEXT DEFAULT NULL,
    location VARCHAR(100) DEFAULT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Admin table
CREATE TABLE IF NOT EXISTS admins (
    admin_id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(150) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL
);

-- Tags / Categories table
CREATE TABLE IF NOT EXISTS tags (
    tag_id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(50) NOT NULL UNIQUE,
    description VARCHAR(255) DEFAULT NULL
);

-- Listings table
CREATE TABLE IF NOT EXISTS listings (
    listing_id INT AUTO_INCREMENT PRIMARY KEY,
    title VARCHAR(200) NOT NULL,
    description TEXT,
    size VARCHAR(20),
    listing_type ENUM('Borrow', 'Giveaway') DEFAULT 'Borrow',
    allow_guest_requests BOOLEAN DEFAULT FALSE,
    boost_active BOOLEAN DEFAULT FALSE,
    boost_expiry DATETIME DEFAULT NULL,
    image_url VARCHAR(500) DEFAULT NULL,
    location VARCHAR(100) DEFAULT NULL,
    owner_id INT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (owner_id) REFERENCES users(user_id) ON DELETE CASCADE
);

-- Listing-Tags junction table
CREATE TABLE IF NOT EXISTS listing_tags (
    listing_id INT NOT NULL,
    tag_id INT NOT NULL,
    PRIMARY KEY (listing_id, tag_id),
    FOREIGN KEY (listing_id) REFERENCES listings(listing_id) ON DELETE CASCADE,
    FOREIGN KEY (tag_id) REFERENCES tags(tag_id) ON DELETE CASCADE
);

-- Availability Slots
CREATE TABLE IF NOT EXISTS availability_slots (
    slot_id INT AUTO_INCREMENT PRIMARY KEY,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    listing_id INT NOT NULL,
    FOREIGN KEY (listing_id) REFERENCES listings(listing_id) ON DELETE CASCADE
);

-- Borrow Requests
CREATE TABLE IF NOT EXISTS borrow_requests (
    request_id INT AUTO_INCREMENT PRIMARY KEY,
    request_date DATETIME DEFAULT CURRENT_TIMESTAMP,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    status ENUM('Pending', 'Approved', 'Rejected', 'Active', 'Returned', 'Completed', 'Cancelled') DEFAULT 'Pending',
    borrow_for_self BOOLEAN DEFAULT TRUE,
    borrower_id INT NOT NULL,
    listing_id INT NOT NULL,
    FOREIGN KEY (borrower_id) REFERENCES users(user_id) ON DELETE CASCADE,
    FOREIGN KEY (listing_id) REFERENCES listings(listing_id) ON DELETE CASCADE
);

-- Reviews
CREATE TABLE IF NOT EXISTS reviews (
    review_id INT AUTO_INCREMENT PRIMARY KEY,
    rating INT NOT NULL CHECK (rating >= 1 AND rating <= 5),
    comment TEXT,
    image_url VARCHAR(500) DEFAULT NULL,
    reviewer_id INT NOT NULL,
    listing_id INT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (reviewer_id) REFERENCES users(user_id) ON DELETE CASCADE,
    FOREIGN KEY (listing_id) REFERENCES listings(listing_id) ON DELETE CASCADE
);

-- Transaction History
CREATE TABLE IF NOT EXISTS transaction_history (
    transaction_id INT AUTO_INCREMENT PRIMARY KEY,
    completed_date DATETIME DEFAULT CURRENT_TIMESTAMP,
    status VARCHAR(50),
    borrower_id INT NOT NULL,
    lender_id INT NOT NULL,
    listing_id INT NOT NULL,
    FOREIGN KEY (borrower_id) REFERENCES users(user_id) ON DELETE CASCADE,
    FOREIGN KEY (lender_id) REFERENCES users(user_id) ON DELETE CASCADE,
    FOREIGN KEY (listing_id) REFERENCES listings(listing_id) ON DELETE CASCADE
);

-- Reward Transactions
CREATE TABLE IF NOT EXISTS reward_transactions (
    reward_id INT AUTO_INCREMENT PRIMARY KEY,
    type VARCHAR(50) NOT NULL,
    points INT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    user_id INT NOT NULL,
    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE
);

-- Notifications
CREATE TABLE IF NOT EXISTS notifications (
    notification_id INT AUTO_INCREMENT PRIMARY KEY,
    type VARCHAR(50) NOT NULL,
    message TEXT NOT NULL,
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    user_id INT NOT NULL,
    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE
);

-- =====================
-- SEED DATA
-- =====================

-- Insert Users
INSERT INTO users (name, email, password, height, weight, age, clothing_size, borrow_rating, lend_rating, reward_points, profile_completed, bio, location) VALUES
('Jane Doe', 'jane@example.com', 'password123', 165.0, 58.0, 24, 'M', 4.5, 4.8, 120, TRUE, 'Fashion lover in London. I love sharing and discovering new styles!', 'London'),
('Alex Smith', 'alex@example.com', 'password123', 178.0, 75.0, 28, 'L', 4.2, 4.6, 85, TRUE, 'Sustainable fashion enthusiast. Sharing is caring!', 'Manchester'),
('Priya Patel', 'priya@example.com', 'password123', 160.0, 55.0, 22, 'S', 4.8, 4.9, 200, TRUE, 'Student who loves dressing up for events without breaking the bank.', 'London'),
('Tom Wilson', 'tom@example.com', 'password123', 182.0, 80.0, 30, 'XL', 3.9, 4.3, 50, TRUE, 'Community-minded guy who believes in reducing waste.', 'Birmingham'),
('Mia Chen', 'mia@example.com', 'password123', 168.0, 62.0, 26, 'M', 4.7, 4.5, 150, TRUE, 'Designer with a passion for circular fashion.', 'Bristol'),
('Sam Johnson', 'sam@example.com', 'password123', NULL, NULL, NULL, NULL, 0.0, 0.0, 0, FALSE, NULL, 'Leeds'),
('Olivia Brown', 'olivia@example.com', 'password123', 170.0, 65.0, 25, 'M', 4.3, 4.7, 95, TRUE, 'Event planner always looking for the perfect outfit.', 'London'),
('Raj Kumar', 'raj@example.com', 'password123', 175.0, 72.0, 27, 'L', 4.1, 4.4, 70, TRUE, 'Believes fashion should be accessible to everyone.', 'Edinburgh');

-- Insert Admin
INSERT INTO admins (name, email, password) VALUES
('Admin User', 'admin@outfitshare.com', 'admin123');

-- Insert Tags / Categories
INSERT INTO tags (name, description) VALUES
('Dresses', 'All types of dresses including casual, formal, and evening wear'),
('Jackets', 'Jackets, blazers, and outerwear'),
('Tops', 'T-shirts, blouses, shirts, and other upper body clothing'),
('Trousers', 'Jeans, chinos, formal trousers, and other bottoms'),
('Shoes', 'All types of footwear'),
('Accessories', 'Bags, belts, scarves, jewellery and other accessories'),
('Formal', 'Suits, gowns, and formal event clothing'),
('Casual', 'Everyday casual and streetwear'),
('Sportswear', 'Athletic and gym clothing'),
('Vintage', 'Retro and vintage fashion pieces');

-- Insert Listings
INSERT INTO listings (title, description, size, listing_type, allow_guest_requests, boost_active, image_url, location, owner_id) VALUES
('Summer Blazer', 'Light cotton blazer perfect for summer events. Barely worn, excellent condition.', 'M', 'Borrow', TRUE, FALSE, '/images/blazer.jpg', 'London', 1),
('Blue Blouse', 'Elegant silk blouse, great for office or dinner. Size S, dry clean only.', 'S', 'Borrow', FALSE, FALSE, '/images/blouse.jpg', 'London', 1),
('Denim Jacket', 'Classic denim jacket, fits UK10-12. Great for layering in spring.', 'M', 'Borrow', TRUE, TRUE, '/images/denim.jpg', 'Manchester', 2),
('Evening Gown', 'Stunning black evening gown, floor length. Perfect for galas and formal events.', 'S', 'Borrow', FALSE, FALSE, '/images/gown.jpg', 'London', 3),
('White Trainers', 'Clean white sneakers, UK size 8. Hardly worn, great condition.', '8', 'Borrow', TRUE, FALSE, '/images/trainers.jpg', 'Birmingham', 4),
('Floral Maxi Dress', 'Beautiful floral print maxi dress. Perfect for weddings and garden parties.', 'M', 'Borrow', TRUE, TRUE, '/images/floral.jpg', 'Bristol', 5),
('Grey Suit', 'Two-piece grey suit, slim fit. Ideal for interviews and formal occasions.', 'L', 'Borrow', FALSE, FALSE, '/images/suit.jpg', 'London', 7),
('Vintage Leather Bag', 'Genuine leather vintage handbag. Giving away as part of declutter.', 'One Size', 'Giveaway', TRUE, FALSE, '/images/bag.jpg', 'Edinburgh', 8),
('Running Shoes', 'Nike running shoes, UK size 9. Used a few times, still in great shape.', '9', 'Giveaway', TRUE, FALSE, '/images/running.jpg', 'Leeds', 6),
('Wool Scarf', 'Handmade wool scarf, warm and cosy. Perfect for winter.', 'One Size', 'Borrow', TRUE, FALSE, '/images/scarf.jpg', 'Manchester', 2),
('Cocktail Dress', 'Red cocktail dress, knee length. Great for parties and nights out.', 'S', 'Borrow', FALSE, FALSE, '/images/cocktail.jpg', 'London', 3),
('Linen Shirt', 'Relaxed fit linen shirt in white. Breathable and stylish for summer.', 'L', 'Borrow', TRUE, FALSE, '/images/linen.jpg', 'Bristol', 5);

-- Assign tags to listings
INSERT INTO listing_tags (listing_id, tag_id) VALUES
(1, 2), (1, 7),    -- Summer Blazer: Jackets, Formal
(2, 3), (2, 7),    -- Blue Blouse: Tops, Formal
(3, 2), (3, 8),    -- Denim Jacket: Jackets, Casual
(4, 1), (4, 7),    -- Evening Gown: Dresses, Formal
(5, 5), (5, 8),    -- White Trainers: Shoes, Casual
(6, 1), (6, 8),    -- Floral Maxi Dress: Dresses, Casual
(7, 7),             -- Grey Suit: Formal
(8, 6), (8, 10),   -- Vintage Leather Bag: Accessories, Vintage
(9, 5), (9, 9),    -- Running Shoes: Shoes, Sportswear
(10, 6), (10, 8),  -- Wool Scarf: Accessories, Casual
(11, 1), (11, 7),  -- Cocktail Dress: Dresses, Formal
(12, 3), (12, 8);  -- Linen Shirt: Tops, Casual

-- Insert Availability Slots
INSERT INTO availability_slots (start_date, end_date, listing_id) VALUES
('2026-04-01', '2026-04-30', 1),
('2026-04-01', '2026-05-15', 2),
('2026-03-20', '2026-06-01', 3),
('2026-04-10', '2026-04-20', 4),
('2026-04-01', '2026-05-30', 5),
('2026-04-15', '2026-06-30', 6),
('2026-04-01', '2026-04-30', 7),
('2026-03-28', '2026-12-31', 8),
('2026-03-28', '2026-12-31', 9),
('2026-04-01', '2026-05-01', 10),
('2026-04-05', '2026-04-25', 11),
('2026-05-01', '2026-07-31', 12);

-- Insert some Borrow Requests
INSERT INTO borrow_requests (start_date, end_date, status, borrow_for_self, borrower_id, listing_id) VALUES
('2026-04-05', '2026-04-08', 'Approved', TRUE, 3, 1),
('2026-04-12', '2026-04-14', 'Pending', TRUE, 5, 4),
('2026-04-20', '2026-04-25', 'Completed', TRUE, 7, 3),
('2026-04-10', '2026-04-12', 'Rejected', FALSE, 2, 11);

-- Insert Reviews
INSERT INTO reviews (rating, comment, reviewer_id, listing_id) VALUES
(5, 'The blazer was perfect for my interview. Jane was super helpful and the item was in great condition!', 3, 1),
(4, 'Nice jacket, comfortable fit. Would borrow again.', 7, 3),
(5, 'Absolutely stunning gown. Priya takes great care of her clothes.', 5, 4),
(4, 'Good quality trainers, arrived clean and on time.', 2, 5);

-- Insert Transaction History
INSERT INTO transaction_history (status, borrower_id, lender_id, listing_id) VALUES
('Completed', 3, 1, 1),
('Completed', 7, 2, 3);

-- Insert Reward Transactions
INSERT INTO reward_transactions (type, points, user_id) VALUES
('Lend Complete', 10, 1),
('Borrow Complete', 5, 3),
('Lend Complete', 10, 2),
('Borrow Complete', 5, 7),
('Giveaway', 15, 8),
('Referral', 20, 5);

-- Insert Notifications
INSERT INTO notifications (type, message, is_read, user_id) VALUES
('Approval', 'Your borrow request for Summer Blazer has been approved!', TRUE, 3),
('Reward', 'You earned 10 reward points for lending Summer Blazer.', FALSE, 1),
('Reminder', 'Complete your profile to enable personalised recommendations.', FALSE, 6),
('Reward', 'You earned 15 sustainability points for your giveaway!', TRUE, 8);
