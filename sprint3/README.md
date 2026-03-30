# OutfitShare - Sprint 3 Implementation

A community-driven clothing sharing platform built with Node.js, Express, PUG, MySQL, and Docker.

## Team: TriCode Labs
- S M Saiem Talha (Team Leader & GitHub Admin)
- Farhan Ahmed Sahol (Requirements & System Design Lead)
- Yash Chauhan (UI/UX & Interface Design Lead)
- Enric Landes (UML & Documentation Support)

## Quick Start

### Prerequisites
- [Docker Desktop](https://www.docker.com/products/docker-desktop)
- [Git](https://git-scm.com/)

### Run the Application
```bash
git clone https://github.com/saiemtalhaa1/TriCode_Labs.git
cd TriCode_Labs/sprint3
docker-compose up --build
```

Open **http://localhost:3000** in your browser.

### Demo Accounts
| Email | Password | Role |
|-------|----------|------|
| jane@example.com | password123 | Admin |
| alex@example.com | password123 | User |
| priya@example.com | password123 | User |

## Features Implemented

### Core Pages (Sprint 3)
- **Users List** — Browse community members with ratings and stats
- **User Profile** — Detailed profile with listings, reviews, and trust ratings
- **Listings Browse** — Search, filter by category/size/location, Match My Size toggle
- **Listing Detail** — Full details, availability dates, reviews, borrow request form
- **Categories** — Browse outfits organised by tags

### Authentication & User Management
- User registration with optional personalisation (size, height, age)
- Secure login with password hashing (bcrypt)
- Session-based authentication
- Profile editing with image upload

### Borrowing & Lending
- Borrow request system with date validation
- Availability window enforcement (cannot borrow outside dates)
- Double-booking prevention
- Borrow Dashboard (Pending/Approved/Active/Completed)
- Lending Dashboard (Approve/Reject/Confirm Return)
- Automatic reward points on completed transactions

### Reward & Boost System
- Earn points for lending (10pts) and borrowing (5pts)
- Boost listings for 50 points (7-day visibility boost)
- Boosted listings appear first in search results

### Admin Panel
- Platform statistics dashboard
- Manage users (view, suspend, reinstate)
- Moderate listings (view, remove with notification)
- Moderate reviews (view, remove)

### Notifications
- Inbox with unread count badge
- Notifications for approvals, rejections, rewards, admin actions

## Tech Stack
- **Frontend:** PUG, CSS
- **Backend:** Node.js, Express.js
- **Database:** MySQL 8.0
- **DevOps:** Docker, Docker Compose, GitHub Actions
- **Auth:** bcrypt, express-session
- **Uploads:** multer
