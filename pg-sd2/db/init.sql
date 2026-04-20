-- OutfitShare Database
-- Simple schema for Sprint 3 coursework

CREATE DATABASE IF NOT EXISTS outfitshare;
USE outfitshare;

-- ================
-- Users table (Farhan's page)
-- ================
CREATE TABLE IF NOT EXISTS Users (
    user_id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(150) NOT NULL,
    password VARCHAR(255) NOT NULL,
    location VARCHAR(100),
    clothing_size VARCHAR(10),
    bio TEXT,
    reward_points INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ================
-- Listings table (Enric, Yash, Talha profile used this)
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
-- Tags table (Talha's categories page)
-- ================
CREATE TABLE IF NOT EXISTS Tags (
    tag_id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(50) NOT NULL,
    description VARCHAR(255)
);

-- ================
-- ListingTags table (links listings to tags - many to many)
-- ================
CREATE TABLE IF NOT EXISTS ListingTags (
    listing_id INT NOT NULL,
    tag_id INT NOT NULL,
    PRIMARY KEY (listing_id, tag_id),
    FOREIGN KEY (listing_id) REFERENCES Listings(listing_id),
    FOREIGN KEY (tag_id) REFERENCES Tags(tag_id)
);

-- ==================
-- Insert test users talha 
-- ==================
INSERT INTO Users (name, email, password, location, clothing_size, bio, reward_points) VALUES
('Jane Doe', 'jane@example.com', 'password123', 'London', 'M', 'Fashion lover who likes sharing outfits', 120),
('Alex Smith', 'alex@example.com', 'password123', 'Manchester', 'L', 'Sustainable fashion enthusiast', 85),
('Priya Patel', 'priya@example.com', 'password123', 'London', 'S', 'Student who loves dressing up for events', 200),
('Tom Wilson', 'tom@example.com', 'password123', 'Birmingham', 'XL', 'Community minded guy who believes in reducing waste', 50),
('Mia Chen', 'mia@example.com', 'password123', 'Bristol', 'M', 'Designer with a passion for circular fashion', 150),
('Sam Johnson', 'sam@example.com', 'password123', 'Leeds', NULL, NULL, 0),
('Olivia Brown', 'olivia@example.com', 'password123', 'London', 'M', 'Event planner looking for the perfect outfit', 95),
('Raj Kumar', 'raj@example.com', 'password123', 'Edinburgh', 'L', 'Believes fashion should be accessible to everyone', 70);

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
-- Insert test listings
-- ==================
INSERT INTO Listings (title, description, size, location, owner_id) VALUES
('Summer Blazer', 'Light cotton blazer perfect for summer events', 'M', 'London', 1),
('Blue Blouse', 'Elegant silk blouse great for office or dinner', 'S', 'London', 1),
('Denim Jacket', 'Classic denim jacket great for layering in spring', 'M', 'Manchester', 2),
('Evening Gown', 'Stunning black evening gown for formal events', 'S', 'London', 3),
('White Trainers', 'Clean white sneakers UK size 8', '8', 'Birmingham', 4),
('Floral Maxi Dress', 'Beautiful floral print maxi dress for weddings', 'M', 'Bristol', 5),
('Grey Suit', 'Two piece grey suit ideal for interviews', 'L', 'London', 7),
('Vintage Leather Bag', 'Genuine leather vintage handbag', 'One Size', 'Edinburgh', 8);

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
