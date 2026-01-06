# Dependency Audit Report
**Generated:** 2026-01-06
**Project:** SASPAK ERP 2025-2026

---

## Executive Summary

This audit identified **15 security vulnerabilities** (3 critical, 8 high, 4 moderate), **13 packages with major version updates available**, and **significant dependency bloat** that should be addressed.

**Immediate Actions Required:**
- 🚨 Update jspdf to fix critical security vulnerability
- 🚨 Update Next.js to patch RCE vulnerability
- 🧹 Remove react-scripts (unnecessary for Next.js project)
- 🧹 Remove moment.js (replace with date-fns)
- 🧹 Consolidate duplicate UI libraries

---

## 🚨 Critical Security Vulnerabilities

### 1. jspdf - Local File Inclusion/Path Traversal (CRITICAL)
- **Current Version:** 3.0.2
- **Fixed Version:** 4.0.0
- **CVE:** GHSA-f8cm-6447-x5h2
- **Impact:** Path traversal vulnerability allowing unauthorized file access
- **Action:** Update immediately
  ```bash
  npm install jspdf@latest
  ```

### 2. Next.js - Remote Code Execution (CRITICAL)
- **Current Version:** 15.5.2
- **Fixed Version:** 15.5.7+ (Latest: 16.1.1)
- **CVE:** GHSA-9qr9-h5gf-34mp
- **CVSS Score:** 10.0 (Maximum)
- **Impact:** RCE vulnerability in React flight protocol
- **Action:** Update immediately
  ```bash
  npm install next@^15.5.9
  ```

### 3. react-scripts - Multiple High-Severity Issues
- **Current Version:** 5.0.1
- **Issues:**
  - webpack-dev-server source code exposure
  - svgo/css-select vulnerabilities
  - postcss parsing errors
- **Action:** **REMOVE - Not needed for Next.js projects**

---

## 📦 Outdated Packages

### Major Version Updates Available

| Package | Current | Latest | Breaking Changes Risk |
|---------|---------|--------|---------------------|
| @hookform/resolvers | 3.9.1 | 5.2.2 | ⚠️ High - 2 major versions |
| zod | 3.24.1 | 4.3.5 | ⚠️ High - Schema validation changes |
| firebase | 11.3.1 | 12.7.0 | ⚠️ Medium - API changes likely |
| next | 15.5.2 | 16.1.1 | ⚠️ Medium - Framework update |
| react-i18next | 15.7.1 | 16.5.1 | ⚠️ Medium |
| date-fns | 3.6.0 | 4.1.0 | ⚠️ Medium |
| recharts | 2.13.3 | 3.6.0 | ⚠️ Medium |
| tailwind-merge | 2.6.0 | 3.4.0 | ⚠️ Medium |
| react-day-picker | 8.10.1 | 9.13.0 | ⚠️ Medium |
| react-datepicker | 8.0.0 | 9.1.0 | ⚠️ Low |
| react-leaflet-cluster | 2.1.0 | 4.0.0 | ⚠️ High - 2 major versions |
| read-excel-file | 5.8.6 | 6.0.1 | ⚠️ Low |

### Minor/Patch Updates (Safe to update)

| Package | Current | Latest |
|---------|---------|--------|
| lucide-react | 0.460.0 | 0.562.0 |
| All @radix-ui packages | Various | Latest available |

---

## 🧹 Unnecessary Dependencies (Bloat)

### 1. **react-scripts** (REMOVE)
- **Size Impact:** ~300MB with dependencies
- **Reason:** This is Create React App tooling. Your project uses Next.js, making this completely unnecessary
- **Action:**
  ```bash
  npm uninstall react-scripts
  ```

### 2. **moment** (REMOVE)
- **Size Impact:** ~232KB minified
- **Reason:** Legacy library, already using date-fns (modern, smaller, tree-shakeable)
- **Migration Required:** Replace moment imports with date-fns
- **Action:**
  ```bash
  npm uninstall moment
  ```
  - Search codebase for `import moment` or `require('moment')`
  - Replace with date-fns equivalent functions

### 3. **Duplicate Toast Libraries** (CONSOLIDATE)
Current setup has 3 toast libraries:
- @radix-ui/react-toast
- react-hot-toast
- sonner

**Recommendation:** Keep only **sonner** (modern, best DX) or **react-hot-toast** (most popular)
- Remove the other two
- **Estimated savings:** ~50KB

### 4. **Duplicate Switch Components** (CONSOLIDATE)
- @radix-ui/react-switch
- react-switch

**Recommendation:** Keep @radix-ui/react-switch (better accessibility, consistent with other Radix components)
- Remove react-switch
- **Estimated savings:** ~15KB

### 5. **Duplicate Date Pickers** (EVALUATE)
- react-datepicker
- react-day-picker

**Recommendation:** Evaluate if both are needed
- If only one is being used, remove the other
- If both are needed for different use cases, keep both but document why
- **Potential savings:** ~100KB

### 6. **i18next-fs-backend** (LIKELY UNNECESSARY)
- **Reason:** This is for Node.js filesystem access. In Next.js with i18next-http-backend, likely redundant
- **Action:** Verify if used, if not:
  ```bash
  npm uninstall i18next-fs-backend
  ```

---

## 📊 Dependency Statistics

**Current State:**
- Total dependencies: 1,869 (1,796 production + 27 dev + 46 optional)
- Vulnerabilities: 15 (3 critical, 8 high, 4 moderate)
- Outdated packages: 20+

**After Cleanup (Estimated):**
- Total dependencies: ~1,400 (-25%)
- Bundle size reduction: ~400-500KB minified
- Vulnerabilities: 0

---

## 🎯 Recommended Action Plan

### Phase 1: Critical Security (DO IMMEDIATELY)
```bash
# Fix critical vulnerabilities
npm install jspdf@4.0.0
npm install next@15.5.9
npm install jspdf-autotable@latest  # Ensure compatibility with jspdf 4.0

# Run tests to verify nothing breaks
npm run build
npm run dev
```

### Phase 2: Remove Bloat (HIGH PRIORITY)
```bash
# Remove unnecessary packages
npm uninstall react-scripts moment

# Audit codebase for moment usage
grep -r "import.*moment" src/
grep -r "require.*moment" src/

# Replace moment with date-fns equivalents
# (Manual code changes required)
```

### Phase 3: Consolidate Duplicates (MEDIUM PRIORITY)
```bash
# Decide which toast library to keep, then:
npm uninstall react-hot-toast @radix-ui/react-toast  # if keeping sonner
# OR
npm uninstall sonner @radix-ui/react-toast  # if keeping react-hot-toast

# Remove duplicate switch
npm uninstall react-switch

# Evaluate and potentially remove unused date picker
npm uninstall react-datepicker  # OR react-day-picker

# Remove fs-backend if unused
npm uninstall i18next-fs-backend
```

### Phase 4: Update Dependencies (PLAN CAREFULLY)
```bash
# Update packages with breaking changes one at a time
# Test thoroughly after each update

# Low-risk updates (do first)
npm update lucide-react
npm update react-datepicker  # if keeping
npm update read-excel-file

# Medium-risk updates (test carefully)
npm update date-fns
npm update firebase
npm update tailwind-merge

# High-risk updates (requires migration planning)
npm install @hookform/resolvers@latest
npm install zod@latest  # May require schema updates
npm install recharts@latest
npm install next@latest  # Major version jump - review migration guide
```

---

## 🔍 Additional Recommendations

### 1. Add Package Analysis Tools
```bash
# Install bundle analyzer
npm install --save-dev @next/bundle-analyzer

# Analyze bundle size
npm run build
```

### 2. Set Up Automated Dependency Checks
Add to package.json scripts:
```json
{
  "scripts": {
    "audit": "npm audit",
    "outdated": "npm outdated",
    "audit:fix": "npm audit fix"
  }
}
```

### 3. Consider Dependency Update Policy
- Security updates: Immediate
- Minor/patch updates: Monthly
- Major updates: Quarterly with testing sprint
- Use `npm audit` in CI/CD pipeline

### 4. Type Definitions Cleanup
Some @types packages may be unnecessary with newer package versions:
- @types/react-i18next (check if needed)
- @types/i18next-browser-languagedetector (check if needed)

Many modern packages include their own TypeScript definitions.

---

## 📋 Testing Checklist

After making changes, verify:
- [ ] Build succeeds: `npm run build`
- [ ] Dev server runs: `npm run dev`
- [ ] All forms with date pickers work
- [ ] Toast notifications display correctly
- [ ] PDF generation works (jspdf update)
- [ ] i18n/translations load correctly
- [ ] Excel import/export functions work
- [ ] Maps render correctly (leaflet)
- [ ] Firebase authentication works
- [ ] All chart visualizations render

---

## 💰 Impact Summary

| Metric | Before | After | Improvement |
|--------|--------|-------|-------------|
| Security Vulnerabilities | 15 | 0 | ✅ 100% |
| Total Dependencies | 1,869 | ~1,400 | ✅ 25% reduction |
| Estimated Bundle Size | Baseline | -400-500KB | ✅ Faster load times |
| Outdated Packages | 20+ | 0 | ✅ Up to date |
| Maintenance Risk | High | Low | ✅ Easier updates |

---

## 📚 Resources

- [Next.js 16 Migration Guide](https://nextjs.org/docs/app/building-your-application/upgrading)
- [jsPDF 4.0 Breaking Changes](https://github.com/parallax/jsPDF/releases/tag/v4.0.0)
- [date-fns Migration from Moment](https://date-fns.org/)
- [Zod v4 Migration Guide](https://zod.dev/)

---

**Note:** Always create a git branch before making these changes and test thoroughly in a staging environment before deploying to production.
