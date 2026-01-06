# Design Document: Campus Survival Coach

## Overview

Campus Survival Coach is a focused web application that helps students answer one critical question: "Can I make it to the end of the month without going broke?" The system combines simple financial runway calculations with AI-powered survival tips that understand the student's living context.

The application differentiates itself through three key features:
1. **Student-Focused Runway Calculator**: Handles irregular income and student-specific expenses
2. **Living Situation Context**: Understands campus type, housing, and food habits for relevant advice
3. **AI Survival Tips**: Generates practical, location-aware survival strategies

## Architecture

### System Architecture

```mermaid
graph TB
    subgraph "Frontend (React)"
        UI[Dashboard UI]
        CALC[Calculator Components]
        PROFILE[Profile Forms]
    end
    
    subgraph "Core Logic"
        RC[Runway Calculator]
        SP[Student Profile]
        TOA[Trade-off Analyzer]
        ATG[AI Tip Generator]
    end
    
    subgraph "Data & External"
        LS[Local Storage]
        CC[Campus Context Data]
        AI[AI API (Gemini)]
    end
    
    UI --> RC
    UI --> SP
    UI --> TOA
    CALC --> ATG
    RC --> LS
    SP --> LS
    ATG --> AI
    TOA --> CC
```

### Component Architecture

**Frontend Layer**:
- **Dashboard**: Main interface showing runway, daily spend, and tips
- **Calculator Forms**: Input forms for financial data and preferences
- **Trade-off Visualizer**: Simple comparison cards for housing/transport options

**Core Logic**:
- **Runway Calculator**: Financial calculations and projections
- **Student Profile**: User data management and context
- **Trade-off Analyzer**: Housing/transport vs food budget calculations
- **AI Tip Generator**: Context-aware survival tip generation

**Data Layer**:
- **Local Storage**: User data persistence
- **Campus Context**: Static data for different campus types
- **AI Integration**: External API for tip generation

## Components and Interfaces

### Runway Calculator

**Purpose**: Calculates how long money will last and safe daily spending amounts

**Core Functions**:
```typescript
interface RunwayCalculator {
  calculateRunway(balance: number, income: IncomeEvent[], expenses: Expense[]): RunwayResult
  calculateSafeDailySpend(runway: number, targetDate: Date): number
  detectIrregularIncome(income: IncomeEvent[]): boolean
  projectBrokeDate(currentSpending: number, balance: number): Date
}

interface RunwayResult {
  daysRemaining: number
  safeDailySpend: number
  brokeDate: Date
  status: 'good' | 'warning' | 'critical'
}
```

**Key Algorithms**:
- Simple linear projection for regular expenses
- Buffer calculation for irregular income
- Warning thresholds based on runway length

### Student Profile

**Purpose**: Manages user context and preferences

**Core Functions**:
```typescript
interface StudentProfile {
  createProfile(onboardingData: OnboardingData): StudentProfile
  updatePreferences(preferences: UserPreferences): void
  getCampusContext(): CampusContext
  getBaselineCosts(): CostBaseline
}

interface OnboardingData {
  campusType: 'rural' | 'town' | 'city'
  livingArrangement: 'on-campus' | 'off-campus-shared' | 'off-campus-alone'
  foodHabits: 'mostly-cook' | 'mostly-buy' | 'mixed'
  transportPattern: 'walking' | 'public-transport' | 'mixed'
  cheapestMeal: string
  typicalMealCost: number
}
```

### Trade-off Analyzer

**Purpose**: Compares housing and transport options against food budget

**Core Functions**:
```typescript
interface TradeOffAnalyzer {
  compareOptions(options: LivingOption[]): Comparison[]
  calculateFoodBudget(housing: number, transport: number, totalBudget: number): number
  identifyImpossibleCombinations(options: LivingOption[]): Warning[]
}

interface LivingOption {
  name: string
  housingCost: number
  transportCost: number
  description: string
}

interface Comparison {
  option: LivingOption
  remainingFoodBudget: number
  feasible: boolean
  tradeOffs: string[]
}
```

### AI Tip Generator

**Purpose**: Creates contextual survival tips using AI

**Core Functions**:
```typescript
interface AITipGenerator {
  generateTips(context: TipContext): Promise<SurvivalTip[]>
  formatPrompt(context: TipContext): string
  validateTips(tips: SurvivalTip[]): SurvivalTip[]
}

interface TipContext {
  runway: number
  dailySpend: number
  campusType: string
  livingArrangement: string
  foodHabits: string
  culturalContext: string
}

interface SurvivalTip {
  category: 'food' | 'transport' | 'housing' | 'general'
  title: string
  description: string
  estimatedSavings: number
  difficulty: 'easy' | 'medium' | 'hard'
}
```

## Data Models

### Student Profile

```typescript
interface StudentProfile {
  // Identity
  id: string
  createdAt: Date
  lastUpdated: Date
  
  // Basic Info
  campusType: 'rural' | 'town' | 'city'
  livingArrangement: 'on-campus' | 'off-campus-shared' | 'off-campus-alone'
  
  // Financial Data
  currentBalance: number
  expectedIncome: IncomeEvent[]
  fixedExpenses: {
    rent: number
    fees: number
    transport: number
  }
  
  // Lifestyle
  foodHabits: 'mostly-cook' | 'mostly-buy' | 'mixed'
  transportPattern: 'walking' | 'public-transport' | 'mixed'
  cheapestMeal: string
  typicalMealCost: number
  
  // Calculated
  currentRunway: number
  safeDailySpend: number
  status: 'good' | 'warning' | 'critical'
}

interface IncomeEvent {
  amount: number
  expectedDate: Date
  source: string
  reliability: 'certain' | 'likely' | 'uncertain'
}
```

### Campus Context

```typescript
interface CampusContext {
  type: 'rural' | 'town' | 'city'
  
  // Cost Baselines
  costs: {
    foodRange: [number, number] // min, max daily food cost
    transportDaily: number
    housingRange: [number, number] // min, max monthly housing
  }
  
  // Cultural Context
  commonFoods: string[]
  culturalTips: string[]
  
  // Survival Strategies
  budgetFoodOptions: string[]
  transportHacks: string[]
  localResources: string[]
}
```

### AI Tip Response

```typescript
interface AITipResponse {
  tips: SurvivalTip[]
  context: {
    campusType: string
    runway: number
    urgency: 'low' | 'medium' | 'high'
  }
}

interface SurvivalTip {
  category: 'food' | 'transport' | 'housing' | 'general'
  title: string
  description: string
  estimatedSavings: number
  difficulty: 'easy' | 'medium' | 'hard'
  culturallyAppropriate: boolean
}
```

Now I need to use the prework tool to analyze the acceptance criteria before writing the correctness properties:

<function_calls>
<invoke name="prework">
<parameter name="featureName">campus-survival-coach

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system-essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

Based on the prework analysis, I've identified the following properties that can be automatically tested to ensure system correctness:

### Property 1: Runway Calculation Accuracy
*For any* valid financial input (balance, income dates, fixed costs), the runway calculator should produce a positive number of days that accurately reflects how long the money will last.
**Validates: Requirements 1.1, 1.2**

### Property 2: Safe Daily Spend Calculation
*For any* target survival date and available funds, the calculated safe daily spend should allow the student to reach the target date without running out of money.
**Validates: Requirements 1.4**

### Property 3: Broke Date Warning Generation
*For any* spending pattern that exceeds available funds, the system should generate a warning with a projected "broke date" that occurs before the target survival date.
**Validates: Requirements 1.3**

### Property 4: Irregular Income Handling
*For any* income pattern with irregular timing or amounts, the system should handle it without errors and produce reasonable runway calculations.
**Validates: Requirements 1.5**

### Property 5: Baseline Cost Integration
*For any* student profile with specified meal costs and transport patterns, these costs should be correctly integrated into all financial calculations.
**Validates: Requirements 2.2, 2.3**

### Property 6: Campus Context Appropriateness
*For any* campus type selection, the provided cost ranges and food options should be appropriate for that campus type (e.g., rural costs < city costs).
**Validates: Requirements 2.4**

### Property 7: Profile-Matched Advice
*For any* student profile, generated advice should match the student's living situation and preferences (e.g., cooking advice for students who cook).
**Validates: Requirements 2.5**

### Property 8: Housing Impact Calculation
*For any* housing option comparison, the calculated impact on daily food budget should accurately reflect the trade-off between housing costs and remaining funds.
**Validates: Requirements 3.1**

### Property 9: Expense Change Propagation
*For any* change in major expense categories, all dependent calculations (runway, daily spend, trade-offs) should update immediately and consistently.
**Validates: Requirements 3.3**

### Property 10: Impossible Combination Detection
*For any* combination of housing and transport choices that exceed the available budget, the system should flag these as impossible or inadequate.
**Validates: Requirements 3.4**

### Property 11: Local Cost Appropriateness
*For any* campus type, the costs used in trade-off analysis should be realistic and appropriate for that location type.
**Validates: Requirements 3.5**

### Property 12: AI Tip Generation Count
*For any* valid student context, the AI tip generator should produce between 3-5 practical survival tips.
**Validates: Requirements 4.1**

### Property 13: Culturally Appropriate Food Suggestions
*For any* campus type and cultural context, food suggestions should be locally available and culturally appropriate for that region.
**Validates: Requirements 4.2**

### Property 14: Crisis Mode Tip Prioritization
*For any* financial situation with less than 2 weeks runway, generated tips should prioritize essential survival strategies over comfort optimizations.
**Validates: Requirements 4.3**

### Property 15: Tip Feasibility Balance
*For any* student living situation, generated tips should balance cost-effectiveness with practical feasibility for that specific situation.
**Validates: Requirements 4.5**

## Error Handling

### Input Validation Strategy

**Financial Data Validation**:
- Balance amounts must be non-negative numbers
- Income dates must be in the future and in logical sequence
- Fixed expenses must be reasonable for student budgets
- Daily spending amounts must be positive

**Profile Data Validation**:
- Campus type must be from valid options (rural/town/city)
- Living arrangements must be from predefined categories
- Food and transport preferences must be valid selections
- Meal costs must be reasonable positive numbers

**AI Response Validation**:
- Tips must contain required fields (title, description, category)
- Estimated savings must be numeric and reasonable
- Tips must be appropriate for the student's context

### Error Recovery Mechanisms

**Graceful Degradation**:
- If AI service is unavailable, show cached tips with clear indicators
- If calculations fail, provide conservative estimates with warnings
- If data is incomplete, use reasonable defaults with user notification

**User-Friendly Error Messages**:
- Calculation errors: "Please check your income and expense amounts"
- AI service errors: "Personalized tips temporarily unavailable"
- Data validation errors: "Please enter a valid amount"

**Automatic Recovery**:
- Retry failed AI requests once with exponential backoff
- Save user data locally to prevent loss
- Validate all inputs before processing

## Testing Strategy

### Dual Testing Approach

Campus Survival Coach uses both unit testing for specific scenarios and property-based testing for universal correctness.

**Unit Testing Focus**:
- Specific financial calculation scenarios
- Edge cases (zero balance, very high expenses)
- AI response parsing and validation
- Component integration points

**Property-Based Testing Focus**:
- Financial calculation consistency across all inputs
- AI tip generation quality across diverse contexts
- Trade-off analysis accuracy for all option combinations

### Property-Based Testing Configuration

**Testing Framework**: **fast-check** for TypeScript property-based testing

**Test Configuration**:
- Minimum **100 iterations** per property test
- Custom generators for realistic student financial data
- Shrinking enabled to find minimal failing examples

**Property Test Tagging**:
```typescript
// Feature: campus-survival-coach, Property 1: Runway Calculation Accuracy
```

**Generator Strategy**:
- **Financial Generators**: Realistic student income ranges and expense patterns
- **Profile Generators**: Valid combinations of campus types and living situations
- **Context Generators**: Appropriate cultural and geographic contexts

### Integration Testing

**Component Integration**:
- Test data flow between calculator and AI tip generator
- Verify profile changes update all dependent calculations
- Ensure trade-off analyzer uses correct campus context

**External Service Integration**:
- Mock AI API responses for consistent testing
- Test graceful degradation when AI service is unavailable
- Verify local storage persistence works correctly

### Quality Assurance

**Code Quality**:
- TypeScript strict mode for type safety
- ESLint for consistent code style
- Minimum 80% test coverage
- Regular dependency security audits

**User Experience**:
- Mobile responsiveness testing
- Accessibility compliance (WCAG 2.1 AA)
- Performance testing for sub-3-second load times
- Usability testing with actual students