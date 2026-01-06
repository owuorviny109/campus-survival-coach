# Requirements Document

## Introduction

Campus Survival Coach is a student-focused financial survival tool that answers one critical question: "Can I make it to the end of the month without going broke or skipping meals?" 

Unlike generic budgeting apps built for adults with steady salaries, Campus Survival Coach understands student realities: irregular income from loans and family support, fixed campus costs, and the need for practical survival strategies that work in your specific location and living situation.

The system combines simple runway calculations with AI-powered, culturally-aware survival tips to help students make informed trade-offs between housing, transport, and food costs.

## Glossary

- **Survival_Coach**: Main system that calculates financial runway and provides survival guidance
- **Runway_Calculator**: Component that determines how long money will last and safe daily spending
- **Student_Profile**: User's living situation, location, and spending preferences  
- **AI_Tip_Generator**: Component that creates contextual survival tips using student profile
- **Campus_Context**: Basic location data including typical costs and food options
- **Trade_Off_Analyzer**: Component that shows how housing/transport choices affect food budget
- **Survival_Runway**: Number of days student can maintain current lifestyle before running out of money
- **Safe_Daily_Spend**: Maximum amount student can spend per day to reach target date

## Requirements

### Requirement 1: Financial Runway Calculation

**User Story:** As a student with irregular income, I want to know exactly how long my money will last and how much I can safely spend each day, so that I can avoid running out of funds before my next disbursement.

#### Acceptance Criteria

1. WHEN a student enters their current balance and expected income dates, THE Runway_Calculator SHALL compute their survival runway in days
2. WHEN a student enters their fixed monthly costs (rent, fees, transport), THE Runway_Calculator SHALL subtract these from available funds before computing runway
3. WHEN a student's current spending would cause them to run out before their target date, THE Runway_Calculator SHALL display a clear warning with the projected "broke date"
4. WHEN calculating safe daily spend, THE Runway_Calculator SHALL ensure the amount allows reaching the target survival date
5. THE Runway_Calculator SHALL handle irregular income patterns (lump sums, delayed disbursements, family support)

### Requirement 2: Student Living Context Profiling

**User Story:** As a student with specific living arrangements, I want the system to understand my situation (campus type, housing, food habits), so that I get relevant advice for my actual lifestyle.

#### Acceptance Criteria

1. WHEN a student completes onboarding, THE Student_Profile SHALL capture their campus type (rural/town/city), living situation (on-campus/off-campus), and food habits (cook/buy/mixed)
2. WHEN a student specifies their cheapest typical meal, THE Student_Profile SHALL use this for baseline cost calculations
3. WHEN a student indicates their transport pattern (walking/daily transport/mixed), THE Student_Profile SHALL factor transport costs into calculations
4. THE Campus_Context SHALL provide basic cost ranges and food options for different campus types
5. WHEN generating advice, THE Student_Profile SHALL ensure suggestions match the student's living situation and preferences

### Requirement 3: Housing and Transport Trade-off Analysis

**User Story:** As a student choosing between living options, I want to see how different housing and transport choices affect my food budget, so that I can make informed decisions about my total living costs.

#### Acceptance Criteria

1. WHEN a student compares housing options, THE Trade_Off_Analyzer SHALL show how each choice affects their remaining daily food budget
2. WHEN displaying trade-offs, THE Trade_Off_Analyzer SHALL present clear scenarios (e.g., "On-campus + walking = X food budget vs Off-campus + transport = Y food budget")
3. WHEN a student changes a major expense category, THE Trade_Off_Analyzer SHALL immediately update all dependent calculations
4. THE Trade_Off_Analyzer SHALL highlight when a combination of choices makes adequate food budget impossible
5. WHEN presenting options, THE Trade_Off_Analyzer SHALL use realistic local costs for the student's campus type

### Requirement 4: AI-Powered Contextual Survival Tips

**User Story:** As a student facing tight finances, I want practical survival tips that understand my location and situation, so that I can make my money last longer with actionable advice.

#### Acceptance Criteria

1. WHEN a student's runway and profile are calculated, THE AI_Tip_Generator SHALL create 3-5 practical survival tips based on their campus context and daily spend limit
2. WHEN providing food suggestions, THE AI_Tip_Generator SHALL reference realistic local options appropriate for the student's campus type and cultural context
3. WHEN a student's situation is tight (less than 2 weeks runway), THE AI_Tip_Generator SHALL prioritize essential survival strategies
4. THE AI_Tip_Generator SHALL provide tips in student-friendly language that acknowledges local campus culture
5. WHEN generating tips, THE AI_Tip_Generator SHALL balance cost-effectiveness with practical feasibility for the student's living situation

### Requirement 5: Simple Dashboard Interface

**User Story:** As a busy student, I want a clear, simple interface that shows me the key information at a glance, so that I can quickly understand my financial situation without complexity.

#### Acceptance Criteria

1. WHEN a student opens the app, THE Survival_Coach SHALL prominently display their current runway (days left) and safe daily spend
2. WHEN presenting information, THE Survival_Coach SHALL use student-friendly language ("days until broke", "safe to spend today")
3. WHEN showing survival tips, THE Survival_Coach SHALL present them as digestible, actionable items
4. THE Survival_Coach SHALL provide clear visual indicators for financial health (good/warning/critical status)
5. WHEN a student needs to update information, THE Survival_Coach SHALL make data entry quick and mobile-friendly

**User Story:** As a student with complex financial dynamics, I want sophisticated forecasting that predicts multiple scenarios and identifies risks before they become crises, so that I can make informed decisions and maintain financial stability throughout my academic journey.

#### Acceptance Criteria

1. WHEN a student inputs their financial data, THE Predictive_Engine SHALL generate multiple scenario forecasts (optimistic, realistic, pessimistic) with confidence intervals
2. WHEN analyzing spending patterns, THE Predictive_Engine SHALL identify behavioral trends and predict future financial stress points
3. WHEN irregular income is detected, THE Predictive_Engine SHALL model cash flow volatility and recommend buffer strategies
4. THE Predictive_Engine SHALL calculate Financial_Resilience_Score incorporating income stability, expense predictability, and emergency preparedness
5. WHEN financial risk patterns emerge, THE Predictive_Engine SHALL trigger proactive interventions before crisis points are reached

### Requirement 2: Cultural and Geographic Intelligence

**User Story:** As a student in a specific cultural and geographic context, I want the system to understand my local ecosystem deeply - from food culture to economic realities - so that I receive recommendations that are not just financially sound but culturally relevant and practically achievable.

#### Acceptance Criteria

1. WHEN a student selects their location, THE Context_Intelligence SHALL load comprehensive cultural and economic profiles including food preferences, social norms, and survival strategies
2. WHEN generating recommendations, THE Cultural_Food_Intelligence SHALL reference authentic local options with accurate pricing, nutritional value, and cultural significance
3. WHEN analyzing costs, THE Context_Intelligence SHALL factor in location-specific economic realities (urban vs rural pricing, transport infrastructure, seasonal variations)
4. THE Campus_Ecosystem SHALL maintain dynamic databases updated with real-time local economic data and student-reported information
5. WHEN cultural preferences conflict with financial optimization, THE Context_Intelligence SHALL provide balanced recommendations that respect both constraints

### Requirement 3: Student Living Situation Profiling

**User Story:** As a student with specific living arrangements and habits, I want advice tailored to whether I cook, buy food, live on/off campus, so that the guidance fits my actual lifestyle.

#### Acceptance Criteria

1. WHEN a student completes onboarding, THE Student_Profile SHALL capture their living situation (on-campus hostel, off-campus shared, off-campus alone)
2. WHEN a student indicates their food habits (mostly cook, mostly buy, mixed), THE Student_Profile SHALL adjust cost calculations and suggestions accordingly
3. WHEN a student specifies their transport pattern (walking, daily matatu, occasional transport), THE Student_Profile SHALL factor transport costs into daily spend calculations
4. THE Student_Profile SHALL store the student's cheapest typical meal for baseline cost calculations
5. WHEN generating survival tips, THE Student_Profile SHALL ensure suggestions match the student's stated preferences and capabilities

### Requirement 4: Advanced AI Strategic Advisory

**User Story:** As a student facing complex financial decisions, I want an AI advisor that understands my complete context and provides sophisticated, personalized strategies that go beyond generic tips to offer intelligent, culturally-aware guidance.

#### Acceptance Criteria

1. WHEN generating strategies, THE AI_Strategist SHALL synthesize financial data, cultural context, personal preferences, and behavioral patterns to create comprehensive action plans
2. WHEN providing recommendations, THE AI_Strategist SHALL explain the reasoning behind each suggestion and quantify expected outcomes
3. WHEN financial stress is detected, THE AI_Strategist SHALL provide psychological support strategies alongside practical financial advice
4. THE AI_Strategist SHALL learn from user feedback and outcomes to continuously improve recommendation accuracy and relevance
5. WHEN generating weekly or monthly plans, THE AI_Strategist SHALL create detailed, step-by-step strategies with contingency options for different scenarios

### Requirement 5: Trade-off Visualization

**User Story:** As a student choosing between housing and transport options, I want to see how different choices affect my food budget and survival runway, so that I can make informed decisions about my living situation.

#### Acceptance Criteria

1. WHEN a student compares housing options, THE Survival_Coach SHALL show how each choice affects their remaining daily food budget
2. WHEN displaying trade-offs, THE Survival_Coach SHALL present clear scenarios (e.g., "On-campus + walking = X food budget vs Off-campus + transport = Y food budget")
3. WHEN a student changes a major expense category, THE Survival_Coach SHALL immediately update all dependent calculations and show the impact
4. THE Survival_Coach SHALL highlight when a combination of choices makes survival impossible or extremely difficult
5. WHEN presenting options, THE Survival_Coach SHALL include realistic local costs for housing, transport, and food in the student's area

### Requirement 6: Intelligent Crisis Prevention and Management

**User Story:** As a student at risk of financial crisis, I want a sophisticated early warning system that not only predicts problems but actively helps me prevent them, and if crisis occurs, provides expert-level guidance for recovery.

#### Acceptance Criteria

1. WHEN financial risk indicators reach critical thresholds, THE Crisis_Prevention_System SHALL activate multi-layered intervention protocols with escalating support levels
2. WHEN in crisis mode, THE AI_Strategist SHALL provide emergency optimization strategies including resource identification, emergency funding options, and community support networks
3. WHEN crisis is imminent, THE Crisis_Prevention_System SHALL connect students with institutional resources, emergency funds, and peer support networks
4. THE Crisis_Prevention_System SHALL maintain crisis recovery tracking and provide structured pathways back to financial stability
5. WHEN providing crisis support, THE Survival_Coach SHALL integrate mental health considerations and stress management alongside financial guidance

### Requirement 7: Irregular Income Management

**User Story:** As a student receiving money in unpredictable lump sums (loans, family support, side gigs), I want the system to handle my irregular income pattern, so that I can plan effectively despite uncertain timing.

#### Acceptance Criteria

1. WHEN a student enters expected income with uncertain dates, THE Runway_Calculator SHALL provide both optimistic and pessimistic survival scenarios
2. WHEN calculating runway with irregular income, THE Runway_Calculator SHALL not assume steady monthly salary patterns
3. WHEN a student receives unexpected income, THE Runway_Calculator SHALL allow quick updates and recalculation of survival runway
4. THE Runway_Calculator SHALL handle multiple income sources with different timing and reliability levels
5. WHEN income is delayed, THE Runway_Calculator SHALL adjust all projections and provide updated survival guidance

### Requirement 8: Premium User Experience and Interface Design

**User Story:** As a digitally-native student, I want a sophisticated, intuitive interface that makes complex financial intelligence accessible and engaging, so that managing my finances becomes empowering rather than stressful.

#### Acceptance Criteria

1. WHEN accessing the platform, THE Survival_Coach SHALL present a dashboard with intelligent data visualization, predictive insights, and actionable recommendations
2. WHEN displaying financial information, THE Survival_Coach SHALL use progressive disclosure to present complexity appropriately while maintaining accessibility
3. WHEN providing guidance, THE Survival_Coach SHALL use interactive elements, animations, and gamification to make financial planning engaging
4. THE Survival_Coach SHALL provide multiple interface modes (quick check, detailed analysis, strategic planning) to match different user needs and time constraints
5. WHEN students interact with the system, THE Survival_Coach SHALL provide immediate feedback, confirmation of actions, and clear next steps to maintain engagement and confidence

### Requirement 9: Data Intelligence and Community Insights

**User Story:** As a student wanting to make informed decisions, I want access to anonymized community data and trends that help me understand how my financial situation compares to peers and what strategies work best in my context.

#### Acceptance Criteria

1. WHEN analyzing financial patterns, THE Survival_Coach SHALL provide anonymized benchmarking data showing how the student's situation compares to similar peers
2. WHEN recommending strategies, THE Survival_Coach SHALL reference success rates and outcomes from similar student profiles in the same geographic area
3. WHEN displaying trends, THE Survival_Coach SHALL show seasonal patterns, economic changes, and emerging opportunities relevant to the student's location and profile
4. THE Survival_Coach SHALL maintain privacy-preserving analytics that contribute to community knowledge while protecting individual data
5. WHEN students achieve financial milestones, THE Survival_Coach SHALL capture and anonymize successful strategies to benefit the broader community