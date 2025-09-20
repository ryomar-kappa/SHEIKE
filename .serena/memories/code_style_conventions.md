# SHEIKE Code Style and Conventions

## TypeScript Configuration
- **Strict Mode**: All strict TypeScript settings enabled
- **noUncheckedIndexedAccess**: Prevents unsafe array/object access
- **exactOptionalPropertyTypes**: Enforces precise optional property handling
- **Type Coverage**: Minimum 90% required

## Code Quality Standards
- **Linting**: ESLint with TypeScript type-aware rules
- **Type Testing**: TSD for TypeScript definition testing
- **No Any Types**: Explicit typing required throughout
- **Error Handling**: Comprehensive error boundaries and validation

## Naming Conventions
- **Files**: kebab-case (mediapipe.ts, quality.ts)
- **Components**: PascalCase (Capture.tsx, DebugOverlay.tsx)
- **Functions**: camelCase with descriptive names
- **Types/Interfaces**: PascalCase with clear intent

## File Organization
```
src/
├── lib/           # Core logic modules
│   ├── mediapipe.ts   # MediaPipe integration
│   ├── metrics.ts     # Facial metrics calculation
│   └── quality.ts     # Quality validation
├── ui/            # React components
│   ├── Capture.tsx        # Camera capture interface
│   └── DebugOverlay.tsx   # Landmark visualization
└── types/         # TypeScript definitions
```

## Special Requirements
- **Non-diagnostic Language**: Avoid medical/diagnostic terminology
- **Privacy Compliance**: Facial biometric data handling
- **Mobile-First**: Camera functionality optimization
- **Japanese UI**: Target audience language consideration