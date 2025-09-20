# SHEIKE Project Overview

## Purpose
PoC (Proof of Concept) for a facial feature analysis application that:
- Captures/uploads facial images via smartphone web interface
- Detects facial landmarks using MediaPipe Face Landmarker
- Extracts features based on golden ratio calculations
- Provides scoring (0-100) for Eyes/Nose/Jaw areas
- Suggests cosmetic procedure categories based on analysis

## Target Users
- Mobile web browsers with camera access
- Japanese language UI expected
- Focus on mobile-first responsive design

## Key Features
1. **Image Input**: Camera capture or file upload with EXIF correction
2. **Landmark Detection**: MediaPipe Face Landmarker (468 points)
3. **Feature Extraction**: Eye dimensions, nose width, jaw measurements
4. **Quality Validation**: Face angle (±15°), brightness thresholds
5. **Scoring System**: 0-100 scores for Eye/Nose/Jaw categories
6. **Advisory Mapping**: Procedure suggestions via lookup table

## Important Considerations
- Processes facial biometric data - privacy compliance required
- On-device inference (no server-side ML processing)
- MediaPipe WASM requires proper CORS and security headers
- Golden ratio-based feature analysis algorithms