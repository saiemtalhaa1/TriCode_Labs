-- OutfitShare Database
-- Simple schema for our coursework
-- Based on the lab SQL pattern from class

CREATE DATABASE IF NOT EXISTS outfitshare;
USE outfitshare;

-- Users table
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

-- Listings table
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

-- Borrow requests table
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

-- Insert some test users
INSERT INTO Users (name, email, password, location, clothing_size, bio, reward_points) VALUES
('Jane Doe', 'jane@example.com', 'password123', 'London', 'M', 'Fashion lover who likes sharing outfits', 120),
('Alex Smith', 'alex@example.com', 'password123', 'Manchester', 'L', 'Sustainable fashion enthusiast', 85),
('Priya Patel', 'priya@example.com', 'password123', 'London', 'S', 'Student who loves dressing up for events', 200),
('Tom Wilson', 'tom@example.com', 'password123', 'Birmingham', 'XL', 'Community minded guy who believes in reducing waste', 50),
('Mia Chen', 'mia@example.com', 'password123', 'Bristol', 'M', 'Designer with a passion for circular fashion', 150),
('Sam Johnson', 'sam@example.com', 'password123', 'Leeds', NULL, NULL, 0),
('Olivia Brown', 'olivia@example.com', 'password123', 'London', 'M', 'Event planner looking for the perfect outfit', 95),
('Raj Kumar', 'raj@example.com', 'password123', 'Edinburgh', 'L', 'Believes fashion should be accessible to everyone', 70);

-- Insert some test listings
INSERT INTO Listings (title, description, size, location, owner_id) VALUES
('Summer Blazer', 'Light cotton blazer perfect for summer events', 'M', 'London', 1),
('Denim Jacket', 'Classic denim jacket great for layering', 'M', 'Manchester', 2),
('Evening Gown', 'Stunning black evening gown for formal events', 'S', 'London', 3),
('White Trainers', 'Clean white sneakers UK size 8', '8', 'Birmingham', 4),
('Floral Maxi Dress', 'Beautiful floral print maxi dress for weddings', 'M', 'Bristol', 5),
('Grey Suit', 'Two piece grey suit for interviews', 'L', 'London', 7);

-- Insert some test borrow requests
INSERT INTO BorrowRequests (start_date, end_date, status, borrower_id, listing_id) VALUES
('2026-04-05', '2026-04-08', 'Approved', 3, 1),
('2026-04-12', '2026-04-14', 'Pending', 5, 3),
('2026-04-20', '2026-04-25', 'Completed', 7, 2);
