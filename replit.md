# CodeMentor AI - AI-Powered Debugging and Learning Platform

## Overview

CodeMentor AI is a full-stack web application designed to help programmers write, debug, analyze, and learn code with AI assistance. The platform features an integrated code editor with Monaco Editor, AI-powered debugging capabilities, code complexity analysis, and personalized learning recommendations. Users can track their progress through a comprehensive dashboard that visualizes performance metrics, achievements, and coding statistics.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
The client-side application is built with React 18 and TypeScript, using Vite as the build tool for fast development and optimized production builds. The UI leverages shadcn/ui components built on top of Radix UI primitives for accessibility and consistency, styled with Tailwind CSS using a dark theme with professional color palette. The application uses Wouter for client-side routing and React Query (TanStack Query) for server state management with optimistic updates and caching.

The Monaco Editor is integrated for code editing with multi-language support (JavaScript, Python, Java, C++, TypeScript). The application features a responsive design with fluid animations and transitions for enhanced user experience, using modern fonts like Inter and JetBrains Mono for improved readability.

### Backend Architecture
The server is built with Express.js and TypeScript, providing a RESTful API architecture. Authentication is handled using Passport.js with local strategy, implementing secure password hashing using Node.js crypto module with scrypt. Session management uses express-session with configurable storage backends (memory store for development, with session store abstraction for production databases).

The backend features a storage abstraction layer that currently implements in-memory storage for development, with interfaces designed to easily swap to database implementations. The API includes comprehensive error handling middleware and request logging for debugging and monitoring.

### Database Design
The application uses Drizzle ORM with PostgreSQL as the primary database. The schema includes three main entities:
- **Users**: Stores user credentials, level progression (XP, level, streak), and account metadata
- **Code Submissions**: Tracks all user code submissions with debugging results, complexity analysis, detected concepts, and AI suggestions
- **User Progress**: Maintains detailed progress tracking including problems solved, bugs fixed, language usage statistics, achievements, and activity timestamps

The database uses UUID primary keys and proper foreign key relationships to ensure data integrity. JSON columns store complex data structures like language usage statistics and achievement arrays.

### AI Integration
The platform integrates with OpenAI's GPT-5 model for three core AI features:
- **Code Debugging**: Analyzes submitted code to identify bugs, provide corrections, and offer improvement suggestions
- **Complexity Analysis**: Evaluates time and space complexity of algorithms with detailed explanations
- **Concept Detection**: Identifies programming concepts in code and suggests related practice problems

All AI responses are structured as JSON for consistent parsing and display. The system includes proper error handling for AI service failures and implements rate limiting considerations for production use.

### Authentication & Authorization
The application implements session-based authentication with secure password storage using salted hashing. Protected routes require authentication middleware, and the frontend includes route guards that redirect unauthenticated users to the login page. The auth system supports user registration with validation and proper error handling for authentication failures.

### State Management
Client-side state is managed through React Query for server state and React Context for authentication state. The application implements optimistic updates for better user experience and includes proper loading and error states throughout the interface. Form state is handled with React Hook Form and Zod for validation.

## External Dependencies

### Core Technologies
- **React 18** with TypeScript for frontend development
- **Express.js** with TypeScript for backend API
- **Vite** for frontend build tooling and development server
- **Drizzle ORM** for database operations and migrations
- **PostgreSQL** as the production database (via @neondatabase/serverless)

### UI Framework
- **Tailwind CSS** for styling and responsive design
- **shadcn/ui** component library built on Radix UI primitives
- **Radix UI** for accessible, unstyled UI components
- **Monaco Editor** (@monaco-editor/react) for code editing capabilities

### State Management & API
- **TanStack React Query** for server state management and caching
- **Wouter** for lightweight client-side routing
- **React Hook Form** with @hookform/resolvers for form management
- **Zod** for runtime type validation and schema definition

### Authentication & Security
- **Passport.js** with passport-local strategy for authentication
- **express-session** for session management
- **connect-pg-simple** for PostgreSQL session storage

### AI & External Services
- **OpenAI API** for AI-powered code analysis, debugging, and learning features
- **Neon Database** for managed PostgreSQL hosting

### Development & Build Tools
- **TypeScript** for type safety across the entire stack
- **ESBuild** for fast backend compilation
- **PostCSS** with Autoprefixer for CSS processing
- **Replit** development environment integration with custom plugins