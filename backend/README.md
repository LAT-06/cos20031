# Archery Score Recording System - Backend API

This is the backend REST API for the Archery Score Recording Web Application, built with Node.js, Express, and Sequelize ORM for MariaDB.

## 📋 Table of Contents

- [Prerequisites](#prerequisites)
- [Installation](#installation)
- [Database Setup](#database-setup)
- [Running the Application](#running-the-application)
- [API Documentation](#api-documentation)
- [Project Structure](#project-structure)
- [Environment Variables](#environment-variables)

## 🔧 Prerequisites

- Node.js (v16 or higher)
- MariaDB (v10.6 or higher)
- npm or yarn package manager

## 📦 Installation

1. Navigate to the backend directory:

```bash
cd backend
```

2. Install dependencies:

```bash
npm install
```

3. Create environment file:

```bash
cp .env.example .env
```

4. Edit `.env` file with your database credentials:

```env
DB_HOST=your_ip_address
DB_PORT=3306
DB_NAME=thinh_lam
DB_USER=your_username
DB_PASSWORD=your_password
JWT_SECRET=your_super_secret_jwt_key_change_this_in_production
JWT_EXPIRE=24h
PORT=3000
NODE_ENV=development
```

## 🗄️ Database Setup

### Initialize Database

Run the seeder script to create tables and populate initial data:

```bash
npm run seed
```

This will:

- Create all database tables
- Seed classes (age/gender categories)
- Seed divisions (equipment types)
- Create categories (class + division combinations)
- Add sample rounds (WA 1440, WA 70m, Indoor rounds, etc.)
- Create default admin user

### Default Admin Credentials

- **Email**: `admin@archery.club`
- **Password**: `admin123`

⚠️ **Important**: Change the default admin password after first login!

## 🚀 Running the Application

### Development Mode (with auto-reload)

```bash
npm run dev
```

### Production Mode

```bash
npm start
```

The server will start on `http://localhost:3000` (or the PORT specified in .env)

## 📚 API Documentation

### Base URL

```
http://localhost:3000/api
```

### Authentication

All protected routes require a JWT token in the Authorization header:

```
Authorization: Bearer <your_jwt_token>
```

### Endpoints

#### Authentication (`/api/auth`)

| Method | Endpoint  | Description           | Access        |
| ------ | --------- | --------------------- | ------------- |
| POST   | `/signup` | Register new archer   | Public        |
| POST   | `/login`  | Login user            | Public        |
| GET    | `/me`     | Get current user info | Authenticated |
| POST   | `/logout` | Logout user           | Authenticated |

**Signup Request:**

```json
{
  "firstName": "John",
  "lastName": "Doe",
  "dateOfBirth": "1995-05-15",
  "gender": "Male",
  "email": "john@example.com",
  "password": "password123",
  "defaultDivisionId": 1
}
```

**Login Request:**

```json
{
  "email": "john@example.com",
  "password": "password123"
}
```

#### Archers (`/api/archers`)

| Method | Endpoint              | Description         | Access                |
| ------ | --------------------- | ------------------- | --------------------- |
| GET    | `/`                   | List all archers    | Admin, Recorder       |
| GET    | `/:id`                | Get archer details  | Authenticated         |
| POST   | `/`                   | Create archer       | Admin                 |
| PUT    | `/:id`                | Update archer       | Self or Admin         |
| DELETE | `/:id`                | Delete archer       | Admin                 |
| GET    | `/:id/scores`         | Get archer's scores | Self, Admin, Recorder |
| GET    | `/:id/personal-bests` | Get personal bests  | Self, Admin, Recorder |

#### Rounds (`/api/rounds`)

| Method | Endpoint          | Description            | Access          |
| ------ | ----------------- | ---------------------- | --------------- |
| GET    | `/`               | List all rounds        | Authenticated   |
| GET    | `/:id`            | Get round details      | Authenticated   |
| POST   | `/`               | Create round           | Admin, Recorder |
| PUT    | `/:id`            | Update round           | Admin, Recorder |
| DELETE | `/:id`            | Delete round           | Admin           |
| GET    | `/:id/equivalent` | Get equivalent rounds  | Authenticated   |
| POST   | `/equivalent`     | Create equivalent rule | Admin           |

**Create Round Request:**

```json
{
  "name": "Custom Round",
  "description": "Custom practice round",
  "ranges": [
    {
      "rangeNo": 1,
      "distance": 50,
      "ends": 6,
      "targetFace": "80cm"
    },
    {
      "rangeNo": 2,
      "distance": 30,
      "ends": 6,
      "targetFace": "80cm"
    }
  ]
}
```

#### Scores (`/api/scores`)

| Method | Endpoint        | Description         | Access          |
| ------ | --------------- | ------------------- | --------------- |
| GET    | `/`             | List scores         | Authenticated   |
| GET    | `/:id`          | Get score details   | Authenticated   |
| POST   | `/`             | Stage new score     | Archer          |
| PUT    | `/:id`          | Update staged score | Owner           |
| POST   | `/:id/approve`  | Approve score       | Recorder, Admin |
| POST   | `/:id/reject`   | Reject score        | Recorder, Admin |
| DELETE | `/:id`          | Delete score        | Admin           |
| GET    | `/staged/list`  | Get staged scores   | Recorder, Admin |
| GET    | `/club-records` | Get club records    | Authenticated   |

**Create Score Request:**

```json
{
  "roundId": 1,
  "divisionId": 1,
  "competitionId": null,
  "dateShot": "2025-10-20",
  "ends": [
    {
      "endNumber": 1,
      "arrows": [
        { "score": 10, "arrowOrder": 1 },
        { "score": 9, "arrowOrder": 2 },
        { "score": 9, "arrowOrder": 3 },
        { "score": 8, "arrowOrder": 4 },
        { "score": 7, "arrowOrder": 5 },
        { "score": 10, "arrowOrder": 6 }
      ]
    }
  ],
  "notes": "Practice session"
}
```

#### Competitions (`/api/competitions`)

| Method | Endpoint           | Description             | Access          |
| ------ | ------------------ | ----------------------- | --------------- |
| GET    | `/`                | List competitions       | Authenticated   |
| GET    | `/:id`             | Get competition details | Authenticated   |
| POST   | `/`                | Create competition      | Admin, Recorder |
| PUT    | `/:id`             | Update competition      | Admin, Recorder |
| DELETE | `/:id`             | Delete competition      | Admin           |
| GET    | `/:id/leaderboard` | Get leaderboard         | Authenticated   |

#### Championships (`/api/championships`)

| Method | Endpoint                           | Description              | Access        |
| ------ | ---------------------------------- | ------------------------ | ------------- |
| GET    | `/`                                | List championships       | Authenticated |
| GET    | `/:id`                             | Get championship details | Authenticated |
| POST   | `/`                                | Create championship      | Admin         |
| PUT    | `/:id`                             | Update championship      | Admin         |
| DELETE | `/:id`                             | Delete championship      | Admin         |
| POST   | `/:id/competitions`                | Add competition          | Admin         |
| DELETE | `/:id/competitions/:competitionId` | Remove competition       | Admin         |
| GET    | `/:id/standings`                   | Get standings            | Authenticated |

#### Metadata (`/api`)

| Method | Endpoint      | Description         | Access        |
| ------ | ------------- | ------------------- | ------------- |
| GET    | `/classes`    | List all classes    | Authenticated |
| GET    | `/divisions`  | List all divisions  | Authenticated |
| GET    | `/categories` | List all categories | Authenticated |
| POST   | `/categories` | Create category     | Admin         |

## 📁 Project Structure

```
backend/
├── config/
│   └── database.js          # Sequelize configuration
├── models/
│   ├── index.js            # Model associations
│   ├── Archer.js           # User/Archer model
│   ├── Class.js            # Age/gender class
│   ├── Division.js         # Equipment division
│   ├── Category.js         # Class + Division
│   ├── Round.js            # Round definition
│   ├── RoundRange.js       # Round distances
│   ├── EquivalentRound.js  # Equivalent round rules
│   ├── Competition.js      # Competition model
│   ├── ClubChampionship.js # Championship model
│   ├── ChampionshipCompetition.js # Junction table
│   ├── ScoreRecord.js      # Score record
│   ├── End.js              # End (group of 6 arrows)
│   └── Arrow.js            # Individual arrow score
├── controllers/
│   ├── authController.js
│   ├── archerController.js
│   ├── roundController.js
│   ├── scoreController.js
│   ├── competitionController.js
│   └── championshipController.js
├── routes/
│   ├── auth.js
│   ├── archers.js
│   ├── rounds.js
│   ├── scores.js
│   ├── competitions.js
│   ├── championships.js
│   └── metadata.js
├── middleware/
│   ├── auth.js             # JWT authentication
│   ├── roleCheck.js        # Role-based access
│   └── validation.js       # Input validation
├── utils/
│   ├── helpers.js          # Utility functions
│   └── seeders.js          # Database seeder
├── .env.example
├── .gitignore
├── package.json
├── server.js               # Entry point
└── README.md
```

## 🔐 User Roles

### Admin

- Full access to all features
- User management
- Create/edit/delete all resources
- Approve/reject scores

### Recorder

- Approve/reject staged scores
- Create competitions
- Enter competition scores
- Manage rounds

### Archer

- View own scores and statistics
- Stage new scores
- View competition results
- View round definitions
- View personal bests and club records

## 🛡️ Security Features

- Password hashing with bcrypt (10 salt rounds)
- JWT token authentication (24h expiry)
- Role-based access control
- Input validation with express-validator
- SQL injection prevention via Sequelize ORM
- Security headers with Helmet.js
- CORS enabled

## 🧪 Testing the API

You can test the API using tools like:

- Postman
- cURL
- Insomnia
- Thunder Client (VS Code extension)

Example cURL request:

```bash
# Login
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@archery.club","password":"admin123"}'

# Get rounds (with token)
curl -X GET http://localhost:3000/api/rounds \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

## 📝 Notes

- The seeder script uses `force: true` which **DROPS ALL TABLES**. Only use it for initial setup or testing!
- For production, remove `force: true` and use proper migrations
- Change default admin password immediately after first deployment
- Use strong JWT_SECRET in production
- Consider implementing rate limiting for production
- Enable HTTPS in production

## 🐛 Troubleshooting

### Database Connection Issues

- Verify MariaDB is running
- Check database credentials in `.env`
- Ensure database exists: `CREATE DATABASE thinh_lam;`
- Check firewall rules if connecting remotely

### Port Already in Use

```bash
# Find process using port 3000
lsof -i :3000
# Kill the process
kill -9 <PID>
```

### Module Not Found Errors

```bash
# Reinstall dependencies
rm -rf node_modules package-lock.json
npm install
```

## 📧 Support

For issues or questions, please contact the development team.

## 📄 License

This project is licensed for educational purposes.
