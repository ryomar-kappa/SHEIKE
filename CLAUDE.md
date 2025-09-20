# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a PoC (Proof of Concept) for a facial feature analysis application that:
- Captures/uploads facial images via smartphone web interface
- Detects facial landmarks using MediaPipe Face Landmarker
- Extracts features based on golden ratio calculations
- Provides scoring (0-100) for Eyes/Nose/Jaw areas
- Suggests cosmetic procedure categories based on analysis

## Planned Technology Stack

- **Frontend**: Vite + React + TypeScript
- **Facial Analysis**: MediaPipe Face Landmarker (WASM/WebGL)
- **State Management**: React hooks (minimal setup)
- **Storage**: IndexedDB for local history
- **Deployment**: Vercel (frontend), Railway (API mock)

## Development Phases

### STEP1: Input, Detection, Normalization
- Image capture via `getUserMedia` or file upload
- EXIF correction and resizing (max 1280px)
- MediaPipe landmark detection (468 points)
- Feature extraction: eye dimensions, nose width, jaw measurements
- Quality checks: face angle (±15°), brightness thresholds

### STEP2: Scoring & Advisory Mapping
- Calculate deviation from baseline ranges
- Generate 0-100 scores for Eye/Nose/Jaw categories
- Map to procedure suggestions via lookup table
- UI with gauge displays and expandable details

### STEP3: PWA & Analytics
- IndexedDB for local history storage
- A/B testing functionality for copy variations
- Error handling and data deletion UI
- Production deployment setup

## Key Implementation Notes

- Target mobile web browsers with camera access
- Use on-device inference (no server-side ML processing)
- Implement face angle and lighting quality validation
- 468-point MediaPipe landmarks for precise measurements
- Golden ratio-based feature analysis algorithms

## File Structure (When Implemented)

Expected structure based on planning document:
```
src/
├── components/     # React components
├── hooks/         # Custom React hooks
├── utils/         # Feature extraction algorithms
├── types/         # TypeScript definitions
└── mediapipe/     # MediaPipe integration
```

## Development Commands

```bash
# Development
npm run dev              # Start development server (port 3000)
npm run build           # Build for production
npm run preview         # Preview production build

# Code Quality
npm run typecheck       # TypeScript type checking
npm run lint            # ESLint code linting (0 warnings required)
npm run lint:fix        # Auto-fix ESLint issues

# Type Safety
npm run types:api       # Run type definition tests with tsd
npm run types:coverage  # Check type coverage (90% minimum required)
```

## Important Considerations

- This application processes facial biometric data - ensure privacy compliance
- MediaPipe WASM requires proper CORS and security headers (configured in vite.config.ts)
- Target audience expects Japanese language UI
- Focus on mobile-first responsive design for camera functionality
- Strict TypeScript configuration with 90% type coverage requirement