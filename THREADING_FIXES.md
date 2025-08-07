# Threading Issues and Race Condition Fixes

## Summary
This document outlines the threading issues, race conditions, and deadlock vulnerabilities that were identified and fixed in the TWD Helper codebase.

## Issues Fixed

### 1. Timeout Cleanup Issues
**Problem**: Multiple `setTimeout` calls without proper cleanup could cause memory leaks and unexpected behavior after component unmount.

**Files Fixed**:
- `components/DuelCard.tsx`
- `components/XpAward.tsx` 
- `components/GameSetup.tsx`
- `components/DataManagementDashboard.tsx`
- `components/common/CharacterSelector.tsx`
- `components/CombatGrid.tsx`

**Solution**: 
- Added `useRef` to track timeout references
- Implemented cleanup in `useEffect` return functions
- Created helper functions for safe timeout management

### 2. Race Conditions in Async Operations
**Problem**: Multiple simultaneous API calls could cause state inconsistencies and memory leaks.

**Files Fixed**:
- `components/SoloDashboard.tsx`
- `services/geminiService.ts`
- `context/GameStateContext.tsx`

**Solution**:
- Implemented AbortController pattern for cancelling in-flight requests
- Added proper error handling for aborted requests
- Used loading states to prevent multiple concurrent requests

### 3. Event Listener Memory Leaks
**Problem**: Event listeners not properly cleaned up could cause memory leaks and stale closure issues.

**Files Fixed**:
- `components/CombatGrid.tsx`
- `components/ChatLog.tsx` (already had proper cleanup)
- `components/common/CharacterSelector.tsx`

**Solution**:
- Ensured all event listeners have corresponding cleanup in useEffect return functions
- Added proper dependency arrays to useEffect hooks

### 4. State Update After Unmount
**Problem**: Async operations completing after component unmount could cause React warnings and memory leaks.

**Files Fixed**:
- `components/SoloDashboard.tsx`
- All components with setTimeout usage

**Solution**:
- Used AbortController signals to check if operations should continue
- Added checks before state updates in async callbacks
- Implemented proper cleanup patterns

## Code Examples

### Before (Race Condition):
```tsx
const handleAsk = async () => {
    setIsLoading(true);
    const answer = await askOracle(question);
    addChatMessage(answer); // Could run after unmount
    setIsLoading(false); // Could cause React warning
};
```

### After (Race Condition Fixed):
```tsx
const handleAsk = async () => {
    if (abortControllerRef.current) {
        abortControllerRef.current.abort();
    }
    
    abortControllerRef.current = new AbortController();
    const signal = abortControllerRef.current.signal;
    
    setIsLoading(true);
    
    try {
        const answer = await askOracle(question);
        
        if (!signal.aborted) {
            addChatMessage(answer);
            setIsLoading(false);
        }
    } catch (error) {
        if (!signal.aborted) {
            setIsLoading(false);
        }
    }
};
```

### Before (Timeout Leak):
```tsx
setTimeout(() => {
    onNextTurn();
    setSelectedAction(null);
}, 2000);
```

### After (Timeout Managed):
```tsx
const setSafeTimeout = useCallback((callback: () => void, delay: number) => {
    const timeout = setTimeout(() => {
        timeoutRefs.current.delete(timeout);
        callback();
    }, delay);
    timeoutRefs.current.add(timeout);
    return timeout;
}, []);

useEffect(() => {
    return () => {
        timeoutRefs.current.forEach(timeout => clearTimeout(timeout));
        timeoutRefs.current.clear();
    };
}, []);

// Usage:
setSafeTimeout(() => {
    onNextTurn();
    setSelectedAction(null);
}, 2000);
```

## Additional Improvements

### 1. Enhanced Gemini Service
- Added AbortSignal support to all async functions
- Proper error handling for aborted requests
- Consistent error messages

### 2. Improved State Management
- Functional state updates to avoid stale closures
- Better error boundaries around async operations
- Consistent loading state patterns

### 3. Memory Optimization
- Cleanup patterns for all async operations
- Proper disposal of resources
- Prevention of memory leaks

## Testing Recommendations

1. **Component Unmounting Tests**: Ensure components clean up properly when unmounted during async operations
2. **Rapid User Interaction Tests**: Test rapid clicking/interaction to verify race conditions are handled
3. **Network Failure Tests**: Test behavior when API calls fail or are slow
4. **Memory Leak Tests**: Monitor memory usage during extended use

## Best Practices Implemented

1. **Always cleanup async operations** in useEffect return functions
2. **Use AbortController** for cancellable async operations  
3. **Check component mount status** before state updates in async callbacks
4. **Track and cleanup timeouts** using refs and proper disposal
5. **Functional state updates** to avoid stale closure issues
6. **Consistent error handling** with proper user feedback

All fixes maintain backward compatibility while significantly improving application stability and preventing potential deadlocks, race conditions, and memory leaks.
