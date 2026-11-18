# CodeMentor AI - VS Code Setup Guide

## Prerequisites

1. **Install Node.js** (version 18 or higher)
   - Download from [nodejs.org](https://nodejs.org/)
   - Verify installation: `node --version` and `npm --version`

2. **Install MongoDB** (Local Setup)
   - **Windows**: Download MongoDB Community Server from [mongodb.com](https://www.mongodb.com/try/download/community)
   - **macOS**: `brew install mongodb-community`
   - **Linux**: Follow [MongoDB installation guide](https://docs.mongodb.com/manual/installation/)

3. **Install VS Code**
   - Download from [code.visualstudio.com](https://code.visualstudio.com/)

## VS Code Extensions (Recommended)

Install these extensions for the best development experience:

```
- ES7+ React/Redux/React-Native snippets
- TypeScript Importer
- Prettier - Code formatter
- ESLint
- MongoDB for VS Code
- Thunder Client (for API testing)
- Auto Rename Tag
- Bracket Pair Colorizer
- GitLens
```

## Project Setup

### 1. Clone or Download the Project
```bash
# If using git
git clone <your-repo-url>
cd codementor-ai

# Or extract the project files to a folder
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Start MongoDB Service

**Windows:**
```bash
# Start MongoDB service
net start MongoDB

# Or run MongoDB manually
"C:\Program Files\MongoDB\Server\7.0\bin\mongod.exe" --dbpath="C:\data\db"
```

**macOS/Linux:**
```bash
# Start MongoDB service
brew services start mongodb-community
# OR
sudo systemctl start mongod

# Or run MongoDB manually
mongod --dbpath=/usr/local/var/mongodb
```

### 4. Environment Setup

Create a `.env` file in the project root:
```env
# MongoDB Configuration
MONGODB_URI=mongodb://localhost:27017/

# Gemini Configuration (Required for AI features)
GEMINI_API_KEY=your_gemini_api_key_here

# Session Secret (for authentication)
SESSION_SECRET=your_super_secret_session_key_here

# Development Settings
NODE_ENV=development
```

**Important:** Replace `your_gemini_api_key_here` with your actual Gemini API key from the [Google AI Studio](https://aistudio.google.com/app/apikey)

### 5. Database Setup

The application will automatically:
- Connect to MongoDB at `mongodb://localhost:27017/`
- Create database `codementor_ai`
- Set up collections: `users`, `code_submissions`, `user_progress`
- Create necessary indexes

## Running the Application

### Development Mode
```bash
npm run dev
```

This starts both:
- **Backend Server**: `http://localhost:5000` (Express.js API)
- **Frontend**: `http://localhost:5000` (React with Vite)

### VS Code Development

1. **Open the project in VS Code:**
   ```bash
   code .
   ```

2. **Recommended VS Code settings** (create `.vscode/settings.json`):
   ```json
   {
     "typescript.preferences.importModuleSpecifier": "relative",
     "editor.defaultFormatter": "esbenp.prettier-vscode",
     "editor.formatOnSave": true,
     "editor.codeActionsOnSave": {
       "source.fixAll.eslint": true
     },
     "files.exclude": {
       "**/node_modules": true,
       "**/dist": true
     }
   }
   ```

3. **Debug Configuration** (create `.vscode/launch.json`):
   ```json
   {
     "version": "0.2.0",
     "configurations": [
       {
         "name": "Debug Server",
         "type": "node",
         "request": "launch",
         "program": "${workspaceFolder}/server/index.ts",
         "env": {
           "NODE_ENV": "development"
         },
         "runtimeArgs": ["-r", "tsx/cjs"],
         "skipFiles": ["<node_internals>/**"]
       }
     ]
   }
   ```

## Project Structure

```
codementor-ai/
├── client/                 # React frontend
│   ├── src/
│   │   ├── components/     # UI components
│   │   ├── pages/         # Application pages
│   │   ├── hooks/         # React hooks
│   │   └── lib/           # Utilities
├── server/                # Express backend
│   ├── routes.ts          # API routes
│   ├── auth.ts           # Authentication
│   ├── mongodb-storage.ts # Database layer
│   └── gemini.ts         # AI integration
├── shared/               # Shared types/schemas
│   └── schema.ts        # Database schemas
└── package.json         # Dependencies
```

## Troubleshooting

### MongoDB Connection Issues

**Error: `connect ECONNREFUSED 127.0.0.1:27017`**

1. **Check if MongoDB is running:**
   ```bash
   # Windows
   tasklist /FI "IMAGENAME eq mongod.exe"
   
   # macOS/Linux  
   ps aux | grep mongod
   ```

2. **Start MongoDB:**
   ```bash
   # Windows
   net start MongoDB
   
   # macOS
   brew services start mongodb-community
   
   # Linux
   sudo systemctl start mongod
   ```

3. **Check MongoDB logs:**
   ```bash
   # Default log locations:
   # Windows: C:\Program Files\MongoDB\Server\7.0\log\mongod.log
   # macOS: /usr/local/var/log/mongodb/mongo.log
   # Linux: /var/log/mongodb/mongod.log
   ```

### OpenAI API Issues

**Error: `401 Incorrect API key provided`**

1. Get your API key from [platform.openai.com/account/api-keys](https://platform.openai.com/account/api-keys)
2. Update the `.env` file with your key
3. Restart the application

### Port Issues

**Error: `Port 5000 already in use`**

1. **Find and kill the process:**
   ```bash
   # Windows
   netstat -ano | findstr :5000
   taskkill /PID <process_id> /F
   
   # macOS/Linux
   lsof -ti:5000 | xargs kill -9
   ```

2. **Or change the port** in `server/index.ts`

## Database Management

### MongoDB Compass (GUI)
1. Download [MongoDB Compass](https://www.mongodb.com/products/compass)
2. Connect to: `mongodb://localhost:27017`
3. Browse the `codementor_ai` database

### VS Code MongoDB Extension
1. Install "MongoDB for VS Code" extension
2. Connect to `mongodb://localhost:27017`
3. Browse collections directly in VS Code

## API Testing

Use Thunder Client extension or any API client:

**Authentication:**
- POST `/api/register` - Create account
- POST `/api/login` - Login
- POST `/api/logout` - Logout
- GET `/api/user` - Get current user

**Code Analysis:**
- POST `/api/debug` - Debug code
- POST `/api/analyze` - Full AI analysis
- POST `/api/execute` - Execute code

**Progress:**
- GET `/api/progress` - Get user progress
- GET `/api/user/submissions` - Get submissions

## Common Development Tasks

### Reset Database
```bash
# Connect to MongoDB shell
mongosh
use codementor_ai
db.dropDatabase()
```

### View Logs
```bash
# Server logs
npm run dev

# MongoDB logs
tail -f /path/to/mongodb/logs/mongod.log
```

### Format Code
```bash
# Format all files
npx prettier --write .

# Fix ESLint issues
npx eslint . --fix
```

## Need Help?

1. **Check the console** for error messages
2. **Verify MongoDB is running** and accessible
3. **Ensure all environment variables are set**
4. **Check that dependencies are installed correctly**

Happy coding! 🚀