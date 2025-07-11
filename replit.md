# Miller - AI-Powered Travel Planning Assistant

## Overview

Miller is a modern web application that helps users plan and organize their trips with AI assistance. The app features a glassmorphism UI design with enhanced dark contrast and provides comprehensive travel planning tools including itinerary generation, document management, and travel organization.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript
- **Build Tool**: Vite for fast development and optimized builds
- **Styling**: Tailwind CSS with custom glassmorphism design
- **UI Components**: Radix UI primitives with shadcn/ui component library
- **State Management**: React Query (TanStack Query) for server state management
- **Routing**: Simple state-based navigation (no router library)

### Backend Architecture
- **Framework**: Express.js with TypeScript
- **Database**: PostgreSQL with Drizzle ORM
- **Database Provider**: Neon Database (@neondatabase/serverless)
- **AI Integration**: Google Gemini AI for trip planning and recommendations
- **File Storage**: Planned integration with Firebase Storage for document uploads
- **Development**: In-memory storage for development/demo purposes

### Technology Stack
- **Runtime**: Node.js with ESM modules
- **TypeScript**: Strict type checking across the entire codebase
- **Package Manager**: npm with package-lock.json
- **Development Tools**: tsx for TypeScript execution, esbuild for production builds

## Key Components

### Database Schema
The application uses a PostgreSQL database with three main tables:
- **users**: User profiles and authentication data
- **trips**: Travel plans with destinations, dates, preferences, and AI-generated content
- **documents**: File attachments for travel documents (passports, visas, bookings)

### AI Integration
- **Google Gemini AI**: Generates personalized travel itineraries and packing lists
- **Trip Generation**: Creates day-by-day schedules based on user preferences
- **Smart Recommendations**: Suggests activities, restaurants, and accommodations

### File Management
- **Document Upload**: Supports PDF, JPEG, and PNG files up to 10MB
- **Storage**: Firebase Storage integration for secure file handling
- **Organization**: Documents can be linked to specific trips or stored generally

### User Interface
- **Glassmorphism Design**: Modern translucent glass-like UI elements
- **Responsive Layout**: Mobile-first design with desktop enhancements
- **Navigation**: Tab-based interface with sections for Dashboard, Create Trip, My Trips, and Documents
- **Interactive Components**: Drag-and-drop file uploads, form validation, and real-time updates

## Data Flow

1. **User Input**: Users create trips through forms with destinations, dates, and preferences
2. **AI Processing**: Trip data is sent to Gemini AI for itinerary and packing list generation
3. **Database Storage**: Generated content is stored in PostgreSQL with trip associations
4. **Real-time Updates**: React Query manages server state and provides optimistic updates
5. **Document Management**: Files are uploaded to Firebase Storage with metadata stored in database

## External Dependencies

### Core Dependencies
- **@google/genai**: Google Gemini AI integration
- **@neondatabase/serverless**: PostgreSQL database connectivity
- **drizzle-orm**: Type-safe database ORM
- **@tanstack/react-query**: Server state management
- **@radix-ui/***: Accessible UI component primitives

### Development Dependencies
- **tsx**: TypeScript execution for development
- **esbuild**: Fast JavaScript bundler for production
- **vite**: Frontend build tool and development server
- **tailwindcss**: Utility-first CSS framework

### Future Integrations
- **Firebase Storage**: For secure document file storage
- **OpenWeatherMap API**: For weather-based packing recommendations
- **Google Maps API**: For location services and route planning
- **Wise API**: For expense tracking and financial management

## Deployment Strategy

### Development Environment
- **Local Development**: Vite dev server with hot module replacement
- **Database**: Neon Database with environment variable configuration
- **Build Process**: Separate client and server builds with static asset optimization

### Production Deployment
- **Client Build**: Vite builds optimized static assets to dist/public
- **Server Build**: esbuild bundles Express server to dist/index.js
- **Database**: PostgreSQL with Drizzle schema migrations
- **Environment**: Node.js production environment with process.env configuration

### Key Features Planned
- **Phase 1**: Document management, calendar integration (.ics files)
- **Phase 2**: Advanced AI personalization, social sharing features
- **Phase 3**: Multi-city trip planning, offline functionality with Service Workers
- **Phase 4**: Third-party API integrations (Wise, Google Maps, weather services)

## Recent Changes (July 2025)

### UI/UX Improvements
- **Brand Update**: Changed application name from TravelAI to Miller
- **Logo Integration**: Added Miller logo to navigation header
- **Enhanced Contrast**: Improved visual contrast for better readability
  - GlassCard components now use `bg-black/40` instead of `bg-white/25`
  - Form inputs use `bg-black/30` for better visibility
  - Travel style buttons use darker backgrounds for consistency
  - Hover effects enhanced with darker black backgrounds

### Technical Fixes
- **Schema Validation**: Fixed trip creation validation errors
  - Changed trip dates from timestamp to text fields in database schema
  - Updated validation to handle string dates properly
  - Added comprehensive error logging for debugging
- **API Request Function**: Corrected parameter order in apiRequest function
- **Trip Generation**: Tested and verified AI-powered trip generation (30-60 second response time)

### Testing Status
- ✅ Trip creation via API: Working correctly
- ✅ Form validation: Proper error handling
- ✅ AI generation: Functional with Gemini integration
- ✅ UI contrast: Significantly improved readability

The application follows a modern full-stack architecture with strong TypeScript typing throughout, AI-powered content generation, and a focus on user experience through glassmorphism design with enhanced dark contrast for better accessibility.