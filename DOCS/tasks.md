# Implementation Plan: Campus Survival Coach

## Overview

This implementation plan creates a React + TypeScript web application that helps students calculate their financial runway and get AI-powered survival tips. The app runs entirely in the browser with local storage for data persistence and direct API calls to AI services.

## Tasks

- [ ] 1. Project Setup and Core Infrastructure
  - Create React + TypeScript project with Vite
  - Set up ESLint, Prettier, and testing framework (Vitest + fast-check)
  - Configure Tailwind CSS for styling
  - Set up project structure and basic routing
  - _Requirements: 5.5_

- [ ] 2. Core Data Models and Types
  - [ ] 2.1 Define TypeScript interfaces for all data models
    - Create StudentProfile, IncomeEvent, CampusContext, and SurvivalTip interfaces
    - Define RunwayResult and TradeOffComparison types
    - Set up validation schemas using Zod
    - _Requirements: 1.1, 2.1, 3.1, 4.1_

  - [ ] 2.2 Write property test for data model validation
    - **Property 1: Data Model Consistency**
    - **Validates: Requirements 1.1, 2.1**

- [ ] 3. Financial Runway Calculator
  - [ ] 3.1 Implement core runway calculation logic
    - Create RunwayCalculator class with calculateRunway method
    - Handle irregular income patterns and fixed expenses
    - Calculate safe daily spend and broke date projections
    - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5_

  - [ ] 3.2 Write property tests for runway calculations
    - **Property 1: Runway Calculation Accuracy**
    - **Property 2: Safe Daily Spend Calculation**
    - **Property 3: Broke Date Warning Generation**
    - **Property 4: Irregular Income Handling**
    - **Validates: Requirements 1.1, 1.2, 1.3, 1.4, 1.5**

  - [ ] 3.3 Write unit tests for edge cases
    - Test zero balance scenarios
    - Test very high expense scenarios
    - Test invalid input handling
    - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5_

- [ ] 4. Student Profile Management
  - [ ] 4.1 Create student profile components and logic
    - Build onboarding form for campus type, living situation, food habits
    - Implement local storage persistence for profile data
    - Create profile update and validation logic
    - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5_

  - [ ] 4.2 Write property tests for profile management
    - **Property 5: Baseline Cost Integration**
    - **Property 6: Campus Context Appropriateness**
    - **Property 7: Profile-Matched Advice**
    - **Validates: Requirements 2.2, 2.3, 2.4, 2.5**

- [ ] 5. Campus Context Data System
  - [ ] 5.1 Create campus context database and loader
    - Build static JSON files for different campus types (rural/town/city)
    - Include cost ranges, food options, and cultural context for each type
    - Create context loader that matches campus types to appropriate data
    - _Requirements: 2.4, 2.5_

  - [ ] 5.2 Write unit tests for campus context loading
    - Test data loading for each campus type
    - Verify cost ranges are appropriate for location types
    - _Requirements: 2.4_

- [ ] 6. Trade-off Analysis Engine
  - [ ] 6.1 Implement housing and transport trade-off calculator
    - Create TradeOffAnalyzer class with comparison logic
    - Calculate impact of housing/transport choices on food budget
    - Identify and flag impossible financial combinations
    - _Requirements: 3.1, 3.3, 3.4, 3.5_

  - [ ] 6.2 Write property tests for trade-off analysis
    - **Property 8: Housing Impact Calculation**
    - **Property 9: Expense Change Propagation**
    - **Property 10: Impossible Combination Detection**
    - **Property 11: Local Cost Appropriateness**
    - **Validates: Requirements 3.1, 3.3, 3.4, 3.5**

- [ ] 7. AI Tip Generation System
  - [ ] 7.1 Implement AI integration for survival tips
    - Set up Gemini API integration with proper error handling
    - Create structured prompts that include student context and financial situation
    - Parse and validate AI responses to ensure tip quality
    - _Requirements: 4.1, 4.2, 4.3, 4.5_

  - [ ] 7.2 Write property tests for AI tip generation
    - **Property 12: AI Tip Generation Count**
    - **Property 13: Culturally Appropriate Food Suggestions**
    - **Property 14: Crisis Mode Tip Prioritization**
    - **Property 15: Tip Feasibility Balance**
    - **Validates: Requirements 4.1, 4.2, 4.3, 4.5**

  - [ ] 7.3 Write unit tests for AI integration
    - Test API error handling and fallback responses
    - Test prompt generation for different contexts
    - Test response parsing and validation
    - _Requirements: 4.1, 4.2, 4.3, 4.5_

- [ ] 8. Checkpoint - Core Logic Complete
  - Ensure all core calculations work correctly
  - Verify AI integration functions properly
  - Test data persistence and loading
  - Ask the user if questions arise

- [ ] 9. Main Dashboard UI
  - [ ] 9.1 Build primary dashboard interface
    - Create clean, mobile-friendly dashboard showing runway and daily spend
    - Display financial health status with clear visual indicators
    - Show current survival tips in digestible format
    - _Requirements: 5.1, 5.2, 5.3, 5.4_

  - [ ] 9.2 Implement responsive design and accessibility
    - Ensure mobile-first responsive design
    - Add WCAG 2.1 AA accessibility compliance
    - Optimize for fast loading and smooth interactions
    - _Requirements: 5.5_

- [ ] 10. Onboarding and Profile Forms
  - [ ] 10.1 Create user onboarding flow
    - Build step-by-step onboarding for new users
    - Create forms for financial data input (balance, income, expenses)
    - Design profile setup for campus type, living situation, preferences
    - _Requirements: 2.1, 5.5_

  - [ ] 10.2 Build profile management interface
    - Create forms for updating financial information
    - Allow users to modify preferences and living situation
    - Implement data validation with helpful error messages
    - _Requirements: 2.1, 5.5_

- [ ] 11. Trade-off Visualization Interface
  - [ ] 11.1 Create trade-off comparison components
    - Build comparison cards showing housing vs transport vs food budget
    - Display clear scenarios with visual impact indicators
    - Highlight impossible combinations with helpful warnings
    - _Requirements: 3.1, 3.2, 3.4_

  - [ ] 11.2 Write integration tests for trade-off UI
    - Test user interactions with comparison interface
    - Verify calculations update when options change
    - _Requirements: 3.1, 3.3_

- [ ] 12. Local Storage and Data Persistence
  - [ ] 12.1 Implement robust local storage system
    - Create data persistence layer with versioning
    - Handle data migration for future updates
    - Implement data export/import functionality
    - _Requirements: 2.1, 5.5_

  - [ ] 12.2 Write unit tests for data persistence
    - Test data saving and loading
    - Test data migration scenarios
    - Test error handling for corrupted data
    - _Requirements: 2.1_

- [ ] 13. Error Handling and User Experience
  - [ ] 13.1 Implement comprehensive error handling
    - Add graceful degradation for AI service failures
    - Create user-friendly error messages for all scenarios
    - Implement loading states and offline functionality
    - _Requirements: 4.1, 5.5_

  - [ ] 13.2 Add performance optimizations
    - Implement lazy loading for components
    - Optimize AI API calls with caching
    - Add service worker for offline functionality
    - _Requirements: 5.5_

- [ ] 14. Final Integration and Polish
  - [ ] 14.1 Complete end-to-end integration
    - Wire all components together into cohesive application
    - Ensure smooth data flow between all features
    - Test complete user journeys from onboarding to tips
    - _Requirements: All_

  - [ ] 14.2 Write integration tests for complete workflows
    - Test full onboarding to dashboard flow
    - Test profile updates propagating through all calculations
    - Test AI tip generation with various user contexts
    - _Requirements: All_

- [ ] 15. Deployment and Documentation
  - [ ] 15.1 Prepare for deployment
    - Set up Vercel deployment configuration
    - Create environment variable management for AI API keys
    - Build production optimizations and bundle analysis
    - _Requirements: 5.5_

  - [ ] 15.2 Create project documentation
    - Write clear README with setup and demo instructions
    - Document API integration and configuration
    - Create user guide for hackathon judges
    - _Requirements: All_

- [ ] 16. Final Checkpoint - Complete Application
  - Ensure all features work end-to-end
  - Verify deployment is successful and accessible
  - Test application with realistic student scenarios
  - Prepare demo presentation for hackathon submission

## Notes

- All tasks are required for comprehensive hackathon submission
- Each task references specific requirements for traceability
- Property tests validate universal correctness properties across all inputs
- Unit tests validate specific examples and edge cases
- Integration tests ensure components work together correctly
- The application can be deployed without a backend using Vercel's static hosting