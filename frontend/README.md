# Archery Score Recording System - Frontend

This is the frontend Vue.js application for the Archery Score Recording System, built with Vue 3, Vue Router, Pinia, and Vite.

## 📋 Table of Contents

- [Prerequisites](#prerequisites)
- [Installation](#installation)
- [Configuration](#configuration)
- [Running the Application](#running-the-application)
- [Project Structure](#project-structure)
- [Features](#features)
- [Development](#development)

## 🔧 Prerequisites

- Node.js (v16 or higher)
- npm or yarn package manager
- Running backend API (see backend/README.md)

## 📦 Installation

1. Navigate to the frontend directory:

```bash
cd frontend
```

2. Install dependencies:

```bash
npm install
```

3. Create environment file:

```bash
cp .env.example .env
```

4. Edit `.env` file with your API URL:

```env
VITE_API_URL=http://localhost:3000/api
```

## ⚙️ Configuration

### Environment Variables

- `VITE_API_URL`: Backend API base URL (default: `http://localhost:3000/api`)

## 🚀 Running the Application

### Development Mode

```bash
npm run dev
```

The application will start on `http://localhost:5173`

### Production Build

```bash
npm run build
```

Build files will be created in the `dist/` directory.

### Preview Production Build

```bash
npm run preview
```

## 📁 Project Structure

```
frontend/
├── public/
├── src/
│   ├── assets/
│   │   └── styles/
│   │       └── main.css          # Global styles
│   ├── components/               # Reusable components
│   ├── views/
│   │   ├── auth/
│   │   │   ├── Login.vue
│   │   │   └── Signup.vue
│   │   ├── admin/
│   │   │   ├── AdminLayout.vue
│   │   │   ├── Dashboard.vue
│   │   │   ├── Archers.vue
│   │   │   ├── Scores.vue
│   │   │   ├── Rounds.vue
│   │   │   ├── Competitions.vue
│   │   │   └── Championships.vue
│   │   └── archer/
│   │       ├── ArcherLayout.vue
│   │       ├── Dashboard.vue
│   │       ├── ScoreEntry.vue
│   │       ├── Scores.vue
│   │       ├── Competitions.vue
│   │       └── Rounds.vue
│   ├── router/
│   │   └── index.js              # Vue Router configuration
│   ├── stores/
│   │   ├── auth.js               # Authentication state
│   │   ├── scores.js             # Score management state
│   │   └── metadata.js           # Classes, divisions, rounds
│   ├── services/
│   │   └── api.js                # Axios instance & interceptors
│   ├── App.vue
│   └── main.js
├── .env
├── .env.example
├── .gitignore
├── index.html
├── package.json
├── vite.config.js
└── README.md
```

## ✨ Features

### Authentication

- **Login**: Email and password authentication with JWT
- **Signup**: User registration with automatic class assignment
- **Auto-redirect**: Users redirected to appropriate dashboard based on role
- **Persistent sessions**: Token stored in localStorage

### Admin Dashboard

- **User Management**: View, create, edit, and delete archers
- **Score Approval**: Review and approve/reject staged scores
- **Round Management**: Create and manage archery rounds
- **Competition Management**: Create competitions and view results
- **Championship Management**: Manage club championships
- **Statistics**: Overview of system activity

### Archer Dashboard

- **Score Entry**: Mobile-friendly score entry interface
- **Score History**: View personal scores with filters
- **Personal Bests**: Track best scores by round
- **Competition Results**: Browse and view competition leaderboards
- **Round Lookup**: View round definitions and requirements

### Key Components

#### Layouts

- **AdminLayout**: Sidebar navigation for admin users
- **ArcherLayout**: Sidebar navigation for regular archers

#### Views

- **Login/Signup**: Authentication forms
- **Dashboards**: Role-specific overview pages
- **Score Entry**: Multi-step form for entering arrow scores
- **Management Pages**: Tables and forms for data management

## 🎨 Styling

The application uses a custom CSS design system with variables:

- **Colors**: Neutral palette with accent colors
- **Components**: Buttons, forms, tables, cards
- **Layout**: Flexbox and Grid-based layouts
- **Responsive**: Mobile-friendly design

### CSS Variables

```css
--bg: #f6f5f4       /* Background */
--panel: #ffffff    /* Card background */
--brand: #111111    /* Primary text */
--muted: #e9e7e7    /* Muted elements */
```

## 🔐 Authentication Flow

1. User enters credentials on login page
2. Frontend sends POST request to `/api/auth/login`
3. Backend returns JWT token and user data
4. Token stored in localStorage
5. Token included in all subsequent API requests via Axios interceptor
6. On 401 response, user redirected to login

## 📡 API Integration

### Axios Configuration

The app uses a custom Axios instance with:

- **Base URL**: Configured via environment variable
- **Request Interceptor**: Automatically adds JWT token to headers
- **Response Interceptor**: Handles errors and redirects on 401

### Store Pattern

State management uses Pinia stores:

- **auth**: User authentication and session
- **scores**: Score data and operations
- **metadata**: Classes, divisions, rounds, categories

## 🛣️ Routing

### Public Routes

- `/login` - Login page
- `/signup` - Signup page

### Protected Routes (Requires Authentication)

#### Admin/Recorder Routes (`/admin`)

- `/admin` - Admin dashboard
- `/admin/archers` - Archer management
- `/admin/scores` - Score approval
- `/admin/rounds` - Round management
- `/admin/competitions` - Competition management
- `/admin/championships` - Championship management

#### Archer Routes (`/archer`)

- `/archer` - Archer dashboard
- `/archer/score-entry` - Score entry form
- `/archer/scores` - Personal score history
- `/archer/competitions` - Competition results
- `/archer/rounds` - Round lookup

### Route Guards

- **Authentication Check**: Redirects to login if not authenticated
- **Role Check**: Redirects to appropriate dashboard if role doesn't match
- **Auto-redirect**: Authenticated users accessing login/signup redirected to dashboard

## 🧪 Testing

### Manual Testing Checklist

**Authentication:**

- [ ] Login with valid credentials
- [ ] Login with invalid credentials shows error
- [ ] Signup with valid data creates account
- [ ] Signup validation works (email format, password length)
- [ ] Logout clears session and redirects to login

**Admin Features:**

- [ ] View archers list
- [ ] Search and filter archers
- [ ] Create new archer
- [ ] Edit archer details
- [ ] Delete archer
- [ ] View staged scores
- [ ] Approve/reject scores

**Archer Features:**

- [ ] View personal dashboard
- [ ] Enter new score
- [ ] View score history
- [ ] View personal statistics
- [ ] Browse competitions
- [ ] View round information

## 🔧 Development Tips

### Adding New Components

1. Create component file in appropriate directory
2. Use `<script setup>` syntax (Composition API)
3. Import and use Pinia stores as needed
4. Follow existing naming conventions

### Adding New Routes

1. Add route definition in `src/router/index.js`
2. Set appropriate `meta` fields for authentication/roles
3. Create corresponding view component
4. Add navigation link in layout component

### API Calls

Always use the configured Axios instance from `src/services/api.js`:

```javascript
import api from "@/services/api";

// GET request
const response = await api.get("/endpoint");

// POST request
const response = await api.post("/endpoint", data);
```

### State Management

Use Pinia stores for shared state:

```javascript
import { useAuthStore } from "@/stores/auth";

const authStore = useAuthStore();
console.log(authStore.user);
```

## 🐛 Troubleshooting

### API Connection Issues

- Verify backend is running on correct port
- Check `VITE_API_URL` in `.env` file
- Check browser console for CORS errors
- Verify network tab in browser dev tools

### Authentication Issues

- Clear localStorage and try again
- Check token expiration (24h default)
- Verify JWT_SECRET matches between frontend and backend

### Build Issues

```bash
# Clear node_modules and reinstall
rm -rf node_modules package-lock.json
npm install

# Clear Vite cache
rm -rf node_modules/.vite
```

## 📱 Responsive Design

The application is responsive and works on:

- Desktop (1024px+)
- Tablet (768px - 1023px)
- Mobile (< 768px)

Mobile optimizations:

- Collapsible sidebar
- Touch-friendly buttons
- Simplified score entry on small screens

## 🚀 Deployment

### Build for Production

```bash
npm run build
```

### Serve with Static Server

```bash
# Using serve
npx serve dist

# Using http-server
npx http-server dist
```

### Environment Configuration

Update `.env` for production:

```env
VITE_API_URL=https://your-api-domain.com/api
```

## 📝 Notes

- Score entry supports 6 arrows per end
- Scores are staged by default and require approval
- Admin credentials: `admin@archery.club` / `admin123`
- Token expires after 24 hours
- All dates use ISO 8601 format (YYYY-MM-DD)

## 📧 Support

For issues or questions, please contact the development team.

## 📄 License

This project is licensed for educational purposes.
