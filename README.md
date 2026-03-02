# OutfitShare  
### Software Engineering Coursework – CMP-N204-0  
**Team: TriCode Labs**

---

## 📌 Project Overview

OutfitShare is a community-driven web application designed to support the theme of **“Sharing, exchange and building community”**.

The platform enables users to lend and borrow outfits for job interviews, special occasions, and everyday use. The goal is to:

- Reduce clothing waste  
- Support affordability  
- Encourage sustainable fashion  
- Strengthen local community collaboration  

The system is developed as part of the **Level 5 Software Engineering module** at the University of Roehampton.

---

## 👥 Team Members

- **S M Saiem Talha (A00019842)** – Team Leader & GitHub Administrator  
- **Farhan Ahmed Sahol (A00027052)** – Requirements & System Design Lead  
- **Yash Chauhan (A00028054)** – UI/UX & Interface Design Lead  
- **Enric Landes (A00093322)** – UML & Documentation Support  

---

## 🛠 Technologies Used

This project follows the module technology stack requirements:

### Frontend
- HTML
- CSS
- JavaScript
- PUG templating engine

### Backend
- Node.js
- Express.js
- MySQL Database

### DevOps / CI-CD
- Docker (containerised development environment)
- Git
- GitHub
- GitHub Actions (Sprint 4)

### Project Management
- GitHub Issues
- GitHub Project (Kanban Board)
- Milestones

---

## 🧠 Core Features (MVP)

### Account & Profile
- User registration
- Profile management
- Optional size personalisation
- Borrow & lend from one unified account

### Listings
- Create outfit listings
- Set availability dates
- Add tags/categories
- Browse and filter listings
- Product detail page

### Borrowing Workflow
- Send borrow request
- Lender approval/rejection
- Prevent overlapping bookings
- Track request status

### Trust & Reviews
- Leave ratings & written reviews
- Separate trust ratings for borrowing and lending
- Admin moderation support

### Reward & Boost System
- Earn sustainability points
- Referral multipliers
- Boost listing visibility using reward points

### Admin Controls
- Moderate listings
- Remove inappropriate reviews
- Suspend users if necessary

---

## 📂 Sprint Structure

This project follows a Scrum-based sprint methodology:

### Sprint 1
- Repository setup
- Code of Conduct
- Personas
- Ethical considerations
- Docker environment verification
- Kanban board setup

### Sprint 2
- User stories defined
- Use case diagram
- Wireframes
- Activity diagrams
- ER Diagram
- Class Diagram
- Sequence Diagrams
- State Diagram
- Component Diagram
- Data Flow Diagram
- Sprint 3 planning

### Sprint 3
- Implementation using:
  - MySQL
  - Express
  - PUG
  - Docker
- Users list page
- Profile page
- Listing page
- Detail page
- Tags/categories

### Sprint 4 (Planned)
- User login
- Points system
- Advanced features
- GitHub Actions CI workflow
- Deployment pipeline

---

## 📊 GitHub Project Board

All development tasks are tracked using GitHub Projects (Kanban methodology).

🔗 Repository:  
https://github.com/saiemtalhaa1/TriCode_Labs  

🔗 Project Board:  
https://github.com/users/saiemtalhaa1/projects/2  

Milestones are used to group sprint deliverables (e.g., **Sprint 3 Implementation**).

---

## 🐳 Development Environment

The application runs in Docker containers to ensure:

- Consistent environment across all team members  
- Easy setup  
- Reliable database configuration  
- Simplified deployment  

To run the development environment:

```bash
docker-compose up --build
