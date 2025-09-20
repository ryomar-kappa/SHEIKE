# SHEIKE Technology Stack

## Frontend Framework
- **Vite + React + TypeScript**: Main development stack
- **State Management**: React hooks (minimal setup)
- **Build Tool**: Vite for fast development and optimized builds

## Facial Analysis
- **MediaPipe Face Landmarker**: WASM/WebGL-based landmark detection
- **468-point landmarks**: For precise facial measurements
- **On-device inference**: No server-side ML processing required

## Storage & Deployment
- **IndexedDB**: Local history storage for PWA functionality
- **Vercel**: Frontend deployment
- **Railway**: API mock deployment (if needed)

## Development Tools
- **TypeScript**: Strong typing with 90% coverage requirement
- **ESLint**: Code linting with TypeScript support
- **Type Coverage**: Minimum 90% type coverage enforcement
- **TSD**: TypeScript definition testing

## Key Dependencies (Current)
```json
{
  "dependencies": {
    "react": "^18.2.0",
    "react-dom": "^18.2.0"
  },
  "devDependencies": {
    "@types/react": "^18.2.0",
    "@types/react-dom": "^18.2.0",
    "@typescript-eslint/eslint-plugin": "^6.14.0",
    "@typescript-eslint/parser": "^6.14.0",
    "@vitejs/plugin-react": "^4.0.0",
    "eslint": "^8.55.0",
    "eslint-plugin-react-hooks": "^4.6.0",
    "eslint-plugin-react-refresh": "^0.4.5",
    "tsd": "^0.29.0",
    "type-coverage": "^2.27.1",
    "typescript": "^5.0.0",
    "vite": "^4.4.0"
  }
}
```