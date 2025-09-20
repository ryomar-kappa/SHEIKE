# SHEIKE Project Structure

## Current Implementation Status: STEP1 Complete

### Directory Structure
```
SHEIKE/
├── .serena/                 # Serena MCP configuration
├── src/
│   ├── lib/                 # Core business logic modules
│   │   ├── mediapipe.ts     # MediaPipe Face Landmarker integration
│   │   ├── metrics.ts       # Facial metrics calculation (golden ratio)
│   │   └── quality.ts       # Image/face quality validation
│   ├── types/               # TypeScript type definitions
│   │   ├── mediapipe.ts     # MediaPipe types and interfaces
│   │   ├── metrics.ts       # Facial analysis types
│   │   └── quality.ts       # Quality validation types
│   └── ui/                  # React components
│       ├── Capture.tsx      # Camera capture component
│       └── DebugOverlay.tsx # Landmark visualization component
├── tests/
│   └── types/               # Type definition tests (tsd)
│       ├── mediapipe.test-d.ts
│       ├── metrics.test-d.ts
│       └── quality.test-d.ts
├── tsconfig.json            # TypeScript strict configuration
├── .eslintrc.cjs           # ESLint with type-aware rules
├── vite.config.ts          # Vite config with MediaPipe support
├── package.json            # Dependencies and scripts
└── CLAUDE.md               # Project documentation
```

## Implemented Features (STEP1)

### Core Modules
1. **MediaPipe Integration** (`src/lib/mediapipe.ts`)
   - 468-point facial landmark detection
   - Type-safe wrapper for MediaPipe Face Landmarker
   - GPU acceleration support
   - Landmark extraction utilities

2. **Facial Metrics** (`src/lib/metrics.ts`)
   - Golden ratio-based feature analysis
   - Eye/Nose/Jaw metric calculations
   - 0-100 scoring system: `100 × (1 - Σ w_i * d_i)`
   - Configurable baseline ranges and weighting factors

3. **Quality Validation** (`src/lib/quality.ts`)
   - Face angle validation (±15° threshold)
   - Brightness/contrast analysis
   - Blur detection and quality scoring
   - Mobile-optimized recommendations in Japanese

### UI Components
1. **Capture Component** (`src/ui/Capture.tsx`)
   - getUserMedia camera integration
   - Mobile-first responsive design
   - Real-time quality feedback
   - Japanese language interface

2. **Debug Overlay** (`src/ui/DebugOverlay.tsx`)
   - Landmark visualization
   - Quality metrics display
   - Feature analysis overlay
   - Multi-mode visualization (landmarks/features/quality/metrics)

### Type Safety Infrastructure
- Strict TypeScript configuration with exactOptionalPropertyTypes
- Comprehensive type definitions for all modules
- Type coverage ≥90% requirement
- TSD-based type testing

## Development Standards Met
- ✅ TypeScript strict mode with noUncheckedIndexedAccess
- ✅ ESLint type-aware rules with 0 warnings
- ✅ Type testing infrastructure (tsd)
- ✅ Mobile-first responsive design
- ✅ Japanese language UI
- ✅ Non-diagnostic language compliance
- ✅ Privacy-focused facial data handling
- ✅ On-device inference only

## Next Steps (STEP2)
- Scoring system refinement
- Procedure advisory mapping
- Gauge UI components
- PWA functionality (STEP3)