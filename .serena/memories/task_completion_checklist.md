# SHEIKE Task Completion Checklist

## Quality Gates - Run After Every Development Task

### 1. Type Safety Validation
```bash
npm run typecheck          # Must pass with 0 errors
npm run types:coverage     # Must maintain ≥90% coverage
npm run types:api          # Type definition tests must pass
```

### 2. Code Quality Checks
```bash
npm run lint               # Must pass with 0 warnings (--max-warnings=0)
npm run lint:fix           # Auto-fix issues if possible
```

### 3. Build Verification
```bash
npm run build             # Production build must succeed
npm run preview           # Preview build should work
```

## Development Workflow Standards

### Before Starting Development
- [ ] Activate SHEIKE project in Serena
- [ ] Check project memories for context
- [ ] Understand requirements and constraints

### During Development
- [ ] Follow TypeScript strict settings
- [ ] Maintain type-safe code (no `any` types)
- [ ] Use proper error handling with typed errors
- [ ] Follow non-diagnostic language guidelines
- [ ] Implement mobile-first responsive design

### After Code Changes
- [ ] Run all quality gates (above)
- [ ] Test camera functionality on mobile if UI changes
- [ ] Verify MediaPipe WASM loading works
- [ ] Check Japanese text display properly
- [ ] Validate privacy compliance for facial data

## File Organization Rules
- [ ] Core logic in `src/lib/`
- [ ] Type definitions in `src/types/`
- [ ] UI components in `src/ui/`
- [ ] Type tests in `tests/types/`

## Special Considerations
- [ ] MediaPipe requires proper CORS headers (configured in vite.config.ts)
- [ ] Camera access requires HTTPS in production
- [ ] Facial biometric data must be handled with privacy compliance
- [ ] Target Japanese language UI
- [ ] Mobile-first camera interface design
- [ ] On-device inference only (no server-side ML)

## CI/CD Requirements (when implemented)
- [ ] All quality gates must pass
- [ ] Type coverage ≥90%
- [ ] ESLint with 0 warnings
- [ ] Successful production build
- [ ] MediaPipe WASM loading test