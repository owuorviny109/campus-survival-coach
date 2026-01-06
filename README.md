# Campus Survival Coach

> AI-powered financial survival tool that helps students make it to the end of the month without going broke

[![Build4Students](https://img.shields.io/badge/Built%20for-Build4Students-blue?style=for-the-badge)](https://build4students.com)
[![React](https://img.shields.io/badge/React-18+-61DAFB?style=for-the-badge&logo=react)](https://reactjs.org)
[![TypeScript](https://img.shields.io/badge/TypeScript-5+-3178C6?style=for-the-badge&logo=typescript)](https://typescriptlang.org)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow?style=for-the-badge)](https://opensource.org/licenses/MIT)

<!-- TODO: Add demo GIF or screenshot here -->
![Campus Survival Coach Demo](https://via.placeholder.com/800x400/4F46E5/FFFFFF?text=Campus+Survival+Coach+Demo+%28Coming+Soon%29)

## The Problem We're Solving

Students face a unique financial challenge that generic budgeting apps don't understand:

- **Irregular Income**: Loans, family support, and side gigs don't follow salary patterns
- **Fixed Campus Costs**: Rent, fees, and transport eat up most of the budget
- **Cultural Context Matters**: Sukuma wiki costs 10 KSh in Kakamega but 50 KSh in Nairobi
- **Survival vs. Budgeting**: Students need to know "Will I make it to month-end?" not just track expenses

**The Reality**: Students are skipping meals and dropping out because they can't navigate financial uncertainty.

## Our Solution

Campus Survival Coach answers one critical question: **"Can I survive until my next disbursement?"**

Unlike traditional budgeting apps, we focus on **student financial survival** with:

### Core Features

- **Financial Runway Calculator**
  - Handles irregular income patterns (lump sums, delayed disbursements)
  - Calculates exact days until "broke" and safe daily spending
  - Warns before financial crisis points

- **Smart Trade-off Analysis**
  - Visualize housing vs transport vs food budget decisions
  - Compare "On-campus + walking" vs "Off-campus + matatu" scenarios
  - Identify impossible financial combinations before you commit

- **AI-Powered Survival Tips**
  - Contextual advice based on your campus type and living situation
  - Cultural awareness (local food options, transport hacks)
  - Crisis mode prioritization for tight financial situations

- **Cultural Context Intelligence**
  - Campus-specific cost data (rural vs town vs city)
  - Local food options and survival strategies
  - Understanding of student life realities

### User Experience

- **Mobile-First Design**: Built for students on the go
- **Instant Calculations**: No complex setup or bank connections
- **Student-Friendly Language**: "Days until broke" not "cash flow projections"
- **Offline Capable**: Works without internet after initial setup

## Tech Stack

**Frontend**
- React 18 + TypeScript for type-safe development
- Vite for lightning-fast development and builds
- Tailwind CSS for rapid, responsive styling

**Intelligence & Data**
- Google Gemini API for AI-powered survival tips
- Local Storage for data persistence (no backend needed)
- Static JSON for campus context data

**Quality & Testing**
- Vitest for unit testing
- fast-check for property-based testing
- ESLint + Prettier for code quality
- Professional commit conventions

**Deployment**
- Vercel for instant, free deployment
- Progressive Web App capabilities
- Mobile-optimized performance

## Development Status

**Current Phase**: Implementation (Week 2 of 3)

This project is being built for the [Build4Students Hackathon](https://build4students.com) - creating tools that improve student life.

### Implementation Progress

- [x] Requirements & Design Documentation
- [x] Project Setup & Architecture
- [ ] Core Financial Calculator (In Progress)
- [ ] AI Integration System
- [ ] User Interface Components
- [ ] Testing & Quality Assurance
- [ ] Deployment & Documentation

See our detailed [implementation plan](tasks.md) for complete roadmap.

## Hackathon Alignment

**Build4Students Judging Criteria:**

- **Creativity & Impact (40%)**
  - Solves real student survival problems with cultural awareness
  - Novel approach combining financial calculations with AI and local context
  - Addresses genuine pain point: students going broke and dropping out

- **Code Quality & Functionality (30%)**
  - TypeScript for type safety and maintainability
  - Comprehensive testing with property-based validation
  - Professional commit conventions and documentation
  - Clean, modular architecture

- **Aesthetics & UX (30%)**
  - Mobile-first responsive design
  - Accessibility compliance (WCAG 2.1 AA)
  - Student-friendly interface and language
  - Fast, intuitive user experience

## Quick Start

<!-- TODO: Update when implementation is complete -->

```bash
# Clone the repository
git clone https://github.com/owuorviny109/campus-survival-coach.git
cd campus-survival-coach

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env
# Add your Gemini API key to .env

# Start development server
npm run dev

# Run tests
npm test

# Build for production
npm run build
```

## Usage Examples

<!-- TODO: Add actual screenshots when UI is complete -->

### 1. Calculate Your Financial Runway
```
Current Balance: 15,000 KSh
Expected Income: 25,000 KSh (Jan 15)
Fixed Costs: 8,000 KSh/month

Result: 23 days remaining, 450 KSh safe daily spend
```

### 2. Compare Living Options
```
Option A: On-campus (12,000 KSh) + Walking
→ Food Budget: 650 KSh/day

Option B: Off-campus (8,000 KSh) + Daily Matatu (200 KSh)
→ Food Budget: 450 KSh/day
```

### 3. Get AI Survival Tips
```
"Given your 450 KSh daily budget in Nairobi, consider:
- Campus canteen lunch (150 KSh) + home cooking dinner
- Avoid CBD fast food, stick to campus kiosks
- Walk when possible, save matatu for essentials"
```

 

## Roadmap

### Phase 1: Core MVP (Current)
- [x] Financial runway calculator
- [x] Student profile management
- [ ] Basic AI tip generation
- [ ] Simple dashboard UI

### Phase 2: Enhanced Features
- [ ] Advanced trade-off visualization
- [ ] Campus context database expansion
- [ ] Offline functionality
- [ ] Performance optimizations

### Phase 3: Community Features (Post-Hackathon)
- [ ] User accounts and cloud sync
- [ ] Community cost data sharing
- [ ] Advanced AI personalization
- [ ] Multi-language support

## Recognition & Impact

**Target Impact:**
- Help students avoid financial crisis during hackathon period
- Demonstrate innovative approach to student-specific financial tools
- Showcase cultural context awareness in fintech solutions

**Built for Build4Students Hackathon 2024**
- Theme: Creating tools that improve student life
- Focus: Real problems, practical solutions, student-first design

 

**Built with care for students, by students**

*"Because every student deserves to make it to graduation without going broke"*

<!-- TODO: Add contributor images when team is finalized -->
<!-- TODO: Add demo video embed when available -->
<!-- TODO: Update badges with actual build status when CI/CD is set up -->