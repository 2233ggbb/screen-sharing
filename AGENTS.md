# Frontend Development Agent Rules

## Core Principles

### 1. React Hooks Usage
- **Use hooks only when necessary** - understand their purpose before using them
- **Avoid unnecessary useEffect** - use derived state or event handlers instead
- **useMemo/useCallback are for caching** - not blind "performance optimization"

**Bad Example:**
```tsx
// Unnecessary useEffect
useEffect(() => {
  setDoubleCount(count * 2);
}, [count]);
```

**Good Example:**
```tsx
// Direct computation
const doubleCount = count * 2;
```

### 2. TypeScript Type Safety
- **Never use `as any`** - investigate root cause and define proper types
- **Inline non-reusable types** - only extract types when they're reused or exported

**Bad Example:**
```tsx
const handleChange = (e: any) => setValue(e.target.value);
```

**Good Example:**
```tsx
const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => setValue(e.target.value);
```

### 3. Extract Complex Logic
- **Move complex logic outside components** and add unit tests
- Extract if: >15 lines, complex transformations, needs testing, or reusable

**Good Example:**
```tsx
// utils/processor.ts
export function processData(data: Item[]): Result[] {
  // Complex logic here
}

// Component.tsx
const result = processData(data);
```

### 4. Third-Party Dependencies
- **Use established npm packages** for common tasks (time, IDs, cookies, charts)
- Check project dependencies first: dayjs, uuid, echarts, lodash-es, axios

### 5. Component Library First
- **Check component library before implementing** (Ant Design in this project)
- Common patterns: Collapse, Dropdown, Modal, Form, Table

### 6. Code Style Consistency
- **Follow existing project code style**
- Reference similar files for patterns and naming conventions

### 7. Styling Best Practices
- **Use nested structure** in Less/Sass
- **Remove unused styles** when modifying code
- **Avoid inline styles** unless dynamic/theme values

**Good Example:**
```less
.card {
  .header {
    .title { }
    .actions { }
  }
  .body { }
}
```

### 8. Code Quality
- **Run lint checks** and fix issues before committing
- Remove console.log, unused imports, and commented code

### 9. Code Comments
- **Write comments for complex logic** - explain WHY, not WHAT
- **Use JSDoc for public APIs** - document parameters, return types, and examples
- **Keep comments up-to-date** - remove outdated comments when code changes
- **Avoid obvious comments** - code should be self-documenting

**Bad Example:**
```tsx
// Set user name
setUserName(name); // ❌ Obvious, not helpful

// Loop through items
items.forEach(item => { }); // ❌ Redundant
```

**Good Example:**
```tsx
// Debounce search to avoid excessive API calls during typing
const debouncedSearch = debounce(handleSearch, 300);

/**
 * Calculates the optimal route considering traffic and distance
 * @param start - Starting coordinates
 * @param end - Destination coordinates
 * @param options - Route calculation options
 * @returns Optimized route with estimated time
 */
export function calculateRoute(
  start: Coordinates,
  end: Coordinates,
  options: RouteOptions
): Route {
  // Use A* algorithm for better performance on large graphs
  return findPath(start, end, options);
}
```

---

## Quick Reference

**Hooks:** Only for side effects (subscriptions, DOM, API calls)
**Types:** No `any`, inline non-reused types
**Logic:** Extract complex functions (>15 lines) with tests
**Packages:** dayjs, uuid, axios, lodash-es, echarts
**UI:** Use Ant Design components first
**Styles:** Nested Less, no inline styles
**Quality:** Lint before commit
**Comments:** Explain WHY, use JSDoc for APIs, keep updated
