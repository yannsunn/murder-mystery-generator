# 🚀 Claude Code Development Rules - Ultra Advanced Next.js/React Edition

## 🎯 **CORE DEVELOPMENT PHILOSOPHY**

**ULTRA SYNC + LIMIT BREAKTHROUGH METHODOLOGY:**
- 必ず全体構造をウルトラシンクで完全把握
- 限界突破思考で最適解を追求
- 実装前に必ず詳細計画を立案
- 定期的なリファクタリングで品質維持
- **🚀 PUSH必須ルール: 全ての変更作業完了後は必ずgit pushを実行**

---

## 📋 **PRE-IMPLEMENTATION PLANNING PROTOCOL**

### **🔍 Phase 1: Ultra Sync Analysis**
```
1. 全ファイル・フォルダ構造の完全スキャン
2. 依存関係とアーキテクチャの把握
3. 既存コードパターンとベストプラクティス確認
4. 潜在的な技術的負債の識別
```

### **📝 Phase 2: Implementation Planning**
```
ALWAYS create a detailed plan before coding:
- 要件定義と目標設定
- 技術スタック確認
- ファイル変更箇所の特定
- テスト戦略の策定
- デプロイメント計画
```

### **⚡ Phase 3: Limit Breakthrough Execution**
```
- 最適なアーキテクチャパターンの選択
- パフォーマンス最適化の実装
- ベストプラクティスの厳格な適用
- 将来の拡張性を考慮した設計
```

---

## 🏗️ **NEXT.JS/REACT ARCHITECTURE STANDARDS**

### **📁 Project Structure Rules**
```
src/
├── app/                    # Next.js 13+ App Router
│   ├── (auth)/            # Route groups
│   ├── api/               # API routes
│   ├── globals.css        # Global styles
│   └── layout.tsx         # Root layout
├── components/            # Reusable components
│   ├── ui/               # Base UI components
│   ├── forms/            # Form components
│   └── layouts/          # Layout components
├── hooks/                # Custom React hooks
├── lib/                  # Utility libraries
├── store/                # State management
├── types/                # TypeScript definitions
└── utils/                # Helper functions
```

### **🎨 Component Development Rules**
```typescript
// ALWAYS follow this component pattern:
interface ComponentProps {
  // TypeScript props definition
}

export const ComponentName: React.FC<ComponentProps> = ({
  // Destructured props
}) => {
  // 1. State declarations
  // 2. Effect hooks
  // 3. Custom hooks
  // 4. Handler functions
  // 5. Render logic

  return (
    // JSX with proper accessibility
  );
};

export default ComponentName;
```

---

## 🔧 **CODE QUALITY STANDARDS**

### **📝 TypeScript Requirements**
- STRICT mode enabled
- No `any` types (use proper typing)
- Interface definitions for all props
- Proper error handling with Result types

### **🎯 React Best Practices**
- Functional components only
- Custom hooks for logic reuse
- Proper dependency arrays in useEffect
- Memoization with useMemo/useCallback where needed
- Error boundaries for component isolation

### **🚀 Performance Optimization**
- Dynamic imports for code splitting
- Image optimization with next/image
- Bundle analysis and optimization
- Proper caching strategies
- Server-side rendering optimization

---

## 🧪 **TESTING & QUALITY ASSURANCE**

### **Testing Strategy**
```bash
# ALWAYS run these before commits:
npm run lint          # ESLint checks
npm run type-check    # TypeScript validation
npm run test          # Unit tests
npm run test:e2e      # End-to-end tests
npm run build         # Production build test
```

### **Code Review Checklist**
- [ ] TypeScript strict compliance
- [ ] Accessibility (WCAG 2.1)
- [ ] Performance optimization
- [ ] Security best practices
- [ ] SEO optimization
- [ ] Mobile responsiveness
- [ ] Error handling

---

## 📦 **DEPENDENCY MANAGEMENT**

### **Preferred Stack**
```json
{
  "framework": "Next.js 14+",
  "ui": "Tailwind CSS + shadcn/ui",
  "state": "Zustand / TanStack Query",
  "forms": "React Hook Form + Zod",
  "testing": "Vitest + Testing Library",
  "linting": "ESLint + Prettier",
  "database": "Prisma + PostgreSQL",
  "auth": "NextAuth.js",
  "deployment": "Vercel"
}
```

### **Package Installation Rules**
```bash
# ALWAYS check bundle size impact
npm install <package>
npm run bundle-analyzer  # Check impact

# Prefer specific imports
import { Button } from "@/components/ui/button"
# NOT: import * as UI from "@/components/ui"
```

---

## 🔒 **SECURITY & BEST PRACTICES**

### **Security Checklist**
- [ ] Environment variables properly configured
- [ ] API routes with proper validation
- [ ] Input sanitization and validation
- [ ] CSRF protection
- [ ] Rate limiting implementation
- [ ] Secure headers configuration

### **Performance Monitoring**
```bash
# Regular performance audits
npm run lighthouse     # Lighthouse audit
npm run analyze       # Bundle analysis
npm run perf-test     # Performance testing
```

---

## 🚀 **DEPLOYMENT & CI/CD**

### **Pre-deployment Checklist**
```bash
# MANDATORY before every deployment:
1. npm run lint:fix
2. npm run type-check
3. npm run test
4. npm run build
5. npm run preview
6. Performance audit
7. Security scan
```

### **Git Workflow**
```bash
# Branch naming convention
feature/component-name
fix/bug-description
refactor/code-improvement

# Commit message format
type(scope): description

# Examples:
feat(auth): implement OAuth integration
fix(ui): resolve mobile responsive issues
refactor(api): optimize database queries
```

---

## 📊 **REFACTORING SCHEDULE**

### **Weekly Reviews**
- Code quality metrics review
- Performance benchmarks
- Dependency updates
- Technical debt assessment

### **Monthly Deep Refactoring**
- Architecture review
- Database optimization
- Bundle size optimization
- Security audit
- Accessibility compliance check

---

## 🎯 **CLAUDE CODE SPECIFIC INSTRUCTIONS**

### **Analysis Commands**
```
ALWAYS start with:
1. "Analyze entire project structure"
2. "Identify optimization opportunities"
3. "Create implementation plan"
4. "Execute with limit breakthrough mentality"
```

### **Response Format**
```
1. 🔍 Ultra Sync Analysis
   - Current state assessment
   - Architecture evaluation
   - Optimization opportunities

2. 📋 Implementation Plan
   - Step-by-step approach
   - File changes required
   - Testing strategy

3. 🚀 Limit Breakthrough Execution
   - Optimized implementation
   - Best practices applied
   - Future-proof architecture

4. 📤 **MANDATORY PUSH PROTOCOL**
   - git add . (全変更をステージング)
   - git commit -m "詳細なコミットメッセージ"
   - git push origin main (必須実行)
   - プッシュ完了の確認・報告
```

---

## ⚡ **EMERGENCY PROTOCOLS**

### **Critical Bug Response**
1. Immediate impact assessment
2. Rollback strategy preparation
3. Fix implementation with tests
4. Staged deployment verification

### **Performance Crisis**
1. Performance profiling
2. Bottleneck identification
3. Optimization implementation
4. Load testing verification

---

## 🎨 **UI/UX STANDARDS**

### **Design System Rules**
- Consistent component library usage
- Proper spacing and typography scale
- Accessible color contrast ratios
- Mobile-first responsive design
- Loading states and error handling

### **Animation & Interactions**
- Smooth transitions (60fps)
- Meaningful micro-interactions
- Progressive enhancement
- Reduced motion respect

---

## 📈 **CONTINUOUS IMPROVEMENT**

### **Metrics to Track**
- Bundle size trends
- Performance scores
- Test coverage
- Bug resolution time
- User experience metrics

### **Innovation Integration**
- Regular Next.js update evaluation
- New React patterns adoption
- Performance optimization techniques
- Developer experience improvements

---

**🎯 REMEMBER: Always Ultra Sync → Plan → Breakthrough Implementation**

*This document should be referenced before every development session and updated as the project evolves.*