# Archery Score Recording Web Application

A full-stack web application for managing archery club scores, competitions, and championships. Built with Vue.js 3, Node.js/Express, and MariaDB.

## 🎯 Project Overview

This system allows archery clubs to:

- Record and track archer scores
- Manage competitions and championships
- Define archery rounds and their requirements
- Approve/reject submitted scores
- Track personal bests and club records
- Manage archer classifications by age and equipment

## 🏗️ Architecture

### Frontend

- **Framework**: Vue 3 (Composition API)
- **Routing**: Vue Router
- **State Management**: Pinia
- **HTTP Client**: Axios
- **Build Tool**: Vite
- **Styling**: Custom CSS with design system

### Backend

- **Runtime**: Node.js
- **Framework**: Express.js
- **ORM**: Sequelize
- **Database**: MariaDB
- **Authentication**: JWT with bcrypt
- **Security**: Helmet, CORS

## 📋 Features

### User Roles

#### Admin 👑

- **Full system access** with all permissions
- User management (create, edit, delete users, assign roles)
- Approve/reject scores with detailed review
- Complete CRUD for rounds, competitions, championships
- Delete any records (archers, scores, competitions, etc.)
- View all statistics and records
- Manage recorder accounts

#### Recorder 📋

- **Limited administrative access** for day-to-day operations
- Approve/reject scores with reason tracking
- View detailed score breakdowns (ends and arrows)
- Add and edit archers (archer role only)
- Create and edit rounds, competitions, championships
- Manage base data (classes, divisions, categories)
- **Cannot delete any records** (safety restriction)
- **Cannot create admin/recorder accounts** (security restriction)
- View all statistics and pending scores

See [Recorder Guide](./RECORDER_GUIDE.md) for detailed permissions and workflows.

#### Archer 🏹

- Enter personal scores
- View score history and statistics
- View personal bests
- Browse competition results
- Look up round definitions
- Submit scores for approval

### Core Functionality

1. **Score Recording**

   - Arrow-by-arrow score entry
   - Auto-calculation of end and total scores
   - Mobile-friendly interface
   - Staged approval workflow

2. **Competition Management**

   - Create and manage competitions
   - Link to club championships
   - Leaderboards by category
   - Category-based rankings (class + division)

3. **Round Management**

   - Define rounds with multiple distances
   - Specify target faces and end counts
   - Equivalent round rules for different categories

4. **Archer Classification**

   - Automatic class assignment by age and gender
   - Equipment division tracking
   - Category combinations (class + division)

5. **Statistics & Records**
   - Personal bests by round
   - Club records
   - Championship standings
   - Activity tracking

## 🚀 Quick Start

### Prerequisites

- Node.js v16+
- MariaDB v10.6+
- npm or yarn

### Database Setup

1. Create database:

```sql
CREATE DATABASE thinh_lam;
```

2. Configure database credentials in `backend/.env`

### Backend Setup

```bash
cd backend
npm install
cp .env.example .env
# Edit .env with your database credentials
npm run seed
npm run dev
```

Backend will run on `http://localhost:3000`

### Frontend Setup

```bash
cd frontend
npm install
cp .env.example .env
# Edit .env if needed
npm run dev
```

Frontend will run on `http://localhost:5173`

### Default Accounts

After running `npm run seed`, you can login with:

#### Admin Account
- **Email**: `admin@archery.club`
- **Password**: `admin123`
- **Role**: Administrator (full access)

#### Recorder Account
- **Email**: `recorder@archery.club`
- **Password**: `recorder123`
- **Role**: Recorder (limited access)

⚠️ **Important**: Change default passwords after first login in production!

For detailed recorder permissions and workflows, see [RECORDER_GUIDE.md](./RECORDER_GUIDE.md).

## 📂 Project Structure

```
prj/
├── backend/              # Node.js/Express API
│   ├── config/          # Database configuration
│   ├── models/          # Sequelize models
│   ├── controllers/     # Request handlers
│   ├── routes/          # API routes
│   ├── middleware/      # Auth, validation, etc.
│   ├── utils/           # Helpers and seeders
│   └── server.js        # Entry point
│
├── frontend/            # Vue.js application
│   ├── src/
│   │   ├── assets/      # Styles and static files
│   │   ├── components/  # Reusable components
│   │   ├── views/       # Page components
│   │   ├── router/      # Vue Router config
│   │   ├── stores/      # Pinia stores
│   │   └── services/    # API client
│   └── vite.config.js
│
├── admin-front/         # Original HTML templates
└── user-front/          # Original HTML templates
```

## 🗄️ Database Schema

### Core Tables

1. **Archer** - User accounts and archer profiles
2. **Class** - Age/gender classifications (Male Open, Under 18, etc.)
3. **Division** - Equipment types (Recurve, Compound, etc.)
4. **Category** - Class + Division combinations
5. **Round** - Round definitions
6. **RoundRange** - Distance/end specifications per round
7. **EquivalentRound** - Round equivalency rules
8. **Competition** - Competition events
9. **ClubChampionship** - Annual championships
10. **ChampionshipCompetition** - Links competitions to championships
11. **ScoreRecord** - Individual score records
12. **End** - Groups of 6 arrows
13. **Arrow** - Individual arrow scores

### Relationships

- Archer has many ScoreRecords
- ScoreRecord has many Ends
- End has many Arrows (always 6)
- Round has many RoundRanges
- Competition has many ScoreRecords
- Championship has many Competitions (many-to-many)

## 🔐 Security Features

- Password hashing with bcrypt (10 salt rounds)
- JWT token authentication (24h expiry)
- Role-based access control
- Input validation
- SQL injection prevention via ORM
- XSS protection
- CORS configuration
- Security headers (Helmet.js)

## 📡 API Endpoints

### Authentication

- `POST /api/auth/signup` - Register
- `POST /api/auth/login` - Login
- `GET /api/auth/me` - Get current user
- `POST /api/auth/logout` - Logout

### Archers

- `GET /api/archers` - List archers
- `GET /api/archers/:id` - Get archer
- `POST /api/archers` - Create archer
- `PUT /api/archers/:id` - Update archer
- `DELETE /api/archers/:id` - Delete archer
- `GET /api/archers/:id/scores` - Get archer scores
- `GET /api/archers/:id/personal-bests` - Get personal bests

### Scores

- `GET /api/scores` - List scores
- `GET /api/scores/:id` - Get score details
- `POST /api/scores` - Create score
- `PUT /api/scores/:id` - Update score
- `POST /api/scores/:id/approve` - Approve score
- `POST /api/scores/:id/reject` - Reject score
- `DELETE /api/scores/:id` - Delete score
- `GET /api/scores/staged/list` - Get staged scores
- `GET /api/scores/club-records` - Get club records

### Rounds

- `GET /api/rounds` - List rounds
- `GET /api/rounds/:id` - Get round
- `POST /api/rounds` - Create round
- `PUT /api/rounds/:id` - Update round
- `DELETE /api/rounds/:id` - Delete round
- `GET /api/rounds/:id/equivalent` - Get equivalent rounds

### Competitions

- `GET /api/competitions` - List competitions
- `GET /api/competitions/:id` - Get competition
- `POST /api/competitions` - Create competition
- `PUT /api/competitions/:id` - Update competition
- `DELETE /api/competitions/:id` - Delete competition
- `GET /api/competitions/:id/leaderboard` - Get leaderboard

### Championships

- `GET /api/championships` - List championships
- `GET /api/championships/:id` - Get championship
- `POST /api/championships` - Create championship
- `PUT /api/championships/:id` - Update championship
- `DELETE /api/championships/:id` - Delete championship
- `GET /api/championships/:id/standings` - Get standings

### Metadata

- `GET /api/classes` - List classes
- `GET /api/divisions` - List divisions
- `GET /api/categories` - List categories
- `POST /api/categories` - Create category

## 🧪 Testing

### Manual Testing Scenarios

1. **Admin logs in** → Can access all features, see red "Admin" badge
2. **Recorder logs in** → Can access recorder panel, see yellow "Recorder" badge
3. **Archer signs up** → Can login and see archer dashboard
4. **Archer stages a score** → Appears in recorder's pending list
5. **Recorder reviews score** → Can approve or reject with reason
6. **Admin manages users** → Can create/edit/delete archers and assign roles
7. **Recorder creates archer** → Can only assign "Archer" role (security restriction)
8. **Recorder tries to delete** → Delete buttons hidden (permission restriction)
9. **Create competition** → Add scores → View leaderboard
10. **View personal bests** → Check club records

#### Testing Recorder Permissions

Login as recorder (`recorder@archery.club` / `recorder123`) and verify:

- ✅ Can view all archers, scores, rounds, competitions
- ✅ Can add new archers (archer role only)
- ✅ Can edit existing archers
- ✅ Can approve/reject pending scores
- ✅ Can create/edit rounds, competitions, championships
- ❌ Cannot delete any records (buttons hidden)
- ❌ Cannot assign admin/recorder roles (dropdown restricted)
- ✅ UI shows "Recorder Panel" with yellow badge

## 🚀 Deployment

### Environment Variables

**Backend (`backend/.env`):**

```env
DB_HOST=your_ip
DB_PORT=3306
DB_NAME=thinh_lam
DB_USER=your_user
DB_PASSWORD=your_password
JWT_SECRET=your_secret_key
JWT_EXPIRE=24h
PORT=3000
NODE_ENV=production
```

**Frontend (`frontend/.env`):**

```env
VITE_API_URL=http://your_api_url/api
```

### Production Build

```bash
# Backend
cd backend
npm install --production
npm start

# Frontend
cd frontend
npm run build
# Serve dist/ folder with nginx or similar
```

## 📚 Documentation

- [Backend README](./backend/README.md) - Detailed backend documentation
- [Frontend README](./frontend/README.md) - Detailed frontend documentation
- [Recorder Guide](./RECORDER_GUIDE.md) - Complete guide for recorder role users

## 🐛 Known Issues & TODO

### Implemented ✅

- User authentication and authorization
- Score entry and approval workflow
- Admin and archer dashboards
- Archer management
- Database models and relationships
- API endpoints
- Route guards and role checking

### To Be Completed 🚧

- Complete score management UI (full CRUD)
- Complete round management UI
- Complete competition management UI
- Championship management UI
- Score editing and deletion UI
- Personal bests visualization
- Club records dashboard
- Competition leaderboards
- Round lookup details
- Equivalent round checking in UI
- Score validation against round structure
- Mobile-optimized score entry
- Progress charts and statistics
- Email notifications
- Export functionality (PDF/CSV)
- Advanced search and filters
- Pagination for large datasets

## 🤝 Contributing

This project is for educational purposes. For questions or issues, please contact the development team.

## 📄 License

Educational project - Swinburne University of Technology

## 🙏 Acknowledgments

- Vue.js community
- Express.js team
- Sequelize ORM
- All open-source contributors

---

**Built with ❤️ for archery clubs everywhere** 🎯

# cos20031