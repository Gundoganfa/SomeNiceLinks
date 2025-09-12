# 🔗 SomeNice Links

Modern, responsive ve kullanıcı dostu link koleksiyonu yönetim uygulaması. Offline-first yaklaşımla geliştirilmiş, authentication opsiyonel, full-featured link manager.

## ✨ Öne Çıkan Özellikler

### 🚀 **Modern Teknoloji Stack**
- **Next.js 15.5.2** - App Router & React 19
- **TypeScript 5** - Full type safety
- **Tailwind CSS 3.3** - Modern responsive design
- **Clerk Authentication** - Professional auth provider (optional)
- **Supabase PostgreSQL** - Cloud database with real-time sync
- **Offline-First Architecture** - Works without internet connection

### 🎯 **Core Features**

#### 📋 **Smart Link Management**
- ✅ **Giriş Gereksiz**: Authentication olmadan full functionality
- ✅ **URL Security**: Advanced validation + XSS protection
- ✅ **20+ Kategori**: Otomatik kategorileştirilmiş link organizasyonu
- ✅ **Responsive Modal**: Mobile-optimized link creation
- ✅ **Icon Selection**: 9 professional icon seçeneği

#### 🔍 **Advanced Search & Filter**
- ✅ **Real-time Search**: Title, URL, description içinde anlık arama
- ✅ **Category Filter**: Dynamic kategori filtreleme
- ✅ **Smart Results**: Case-insensitive partial matching

#### 🎨 **Visual Customization**
- ✅ **12 Gradient Colors**: Professional color palette
- ✅ **Drag & Drop Coloring**: Renkleri sürükleyip bırakma
- ✅ **10 Background Themes**: Dark mode variations
- ✅ **Glass Effect UI**: Modern glassmorphism design

#### 📱 **Responsive Design**
- ✅ **Mobile-First**: Touch-optimized interactions
- ✅ **Adaptive Grid**: 1-5 columns (breakpoint-based)
- ✅ **Smooth Animations**: 60fps transitions
- ✅ **Accessibility**: WCAG 2.1 AA compliant

#### ☁️ **Cloud Sync & Offline Support**
- ✅ **Offline-First**: LocalStorage primary, cloud secondary
- ✅ **Conflict Resolution**: Smart merge strategies
- ✅ **Auto-Sync**: Background synchronization
- ✅ **Manual Sync Check**: User-triggered verification

#### 📊 **Analytics & Tracking**
- ✅ **Click Analytics**: Per-link statistics
- ✅ **Offline Tracking**: Works without internet
- ✅ **Privacy-Focused**: No external tracking
- ✅ **Visual Indicators**: Optional click count badges

#### 💰 **Financial Data Widget**
- ✅ **Real-time Rates**: USD/TRY, EUR/USD, BTC/USD
- ✅ **BIST100 Index**: Turkish stock market tracking
- ✅ **Google Sheets Integration**: Custom data sources
- ✅ **Auto-refresh**: 15-second intervals

### 🛡️ **Security & Privacy**

#### 🔐 **Advanced Security**
- ✅ **URL Sanitization**: Protocol validation + dangerous URL blocking
- ✅ **XSS Prevention**: Safe string handling
- ✅ **Input Validation**: Length limits + type safety
- ✅ **Credential Blocking**: No user:pass@host URLs allowed

#### 🎭 **Privacy-First**
- ✅ **Local Storage Primary**: Data stays on device
- ✅ **Optional Cloud Sync**: User choice for cloud storage
- ✅ **No External Tracking**: Self-hosted analytics only
- ✅ **GDPR Compliant**: Privacy by design

---

## 🚀 **Quick Start**

### 📦 Installation
```bash
# Clone repository
git clone https://github.com/yourusername/somenice-links.git
cd somenice-links

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env.local
# Edit .env.local with your Clerk and Supabase credentials

# Run development server
npm run dev
```

### 🌐 **Environment Setup**
```env
# .env.local
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
CLERK_SECRET_KEY=sk_test_...
NEXT_PUBLIC_SUPABASE_URL=https://...
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
```

---

## 🎮 **Usage Guide**

### 📝 **Adding Links**
1. **Click "Add New Link"** button
2. **Fill Form**: Title*, URL*, Description, Icon, Category
3. **Smart URL Validation**: Auto-adds https:// if needed
4. **Instant Save**: Works offline, syncs when online

### 🎨 **Customizing Colors**
1. **Drag Color**: From left palette to any link card
2. **Drop to Apply**: Visual feedback during drag
3. **Reset Color**: Use 🗑️ icon or drag default color

### 🔍 **Search & Filter**
1. **Search Box**: Type to search across title/URL/description
2. **Category Filter**: Select specific category or "Hepsi" (All)
3. **Real-time Results**: Instant filtering as you type

### 📊 **Analytics**
1. **Enable Click Count**: Toggle in settings
2. **View Statistics**: Click counts shown on cards
3. **Privacy Control**: All data stays local unless you choose sync

---

## 🏗️ **Project Structure**

```
app/
├── 📁 components/           # React components
│   ├── 📄 AddLinkModal.tsx     # Link creation modal
│   ├── 📄 LinkGrid.tsx         # Main link display grid
│   ├── 📄 ColorPalette.tsx     # Drag & drop color system
│   ├── 📄 Header.tsx           # Navigation & settings
│   ├── 📄 SearchAndFilter.tsx  # Search & category filter
│   ├── 📄 FinancialData.tsx    # Real-time financial widget
│   └── 📁 ui/                  # UI components
│       ├── 📄 Toast.tsx            # Notification system
│       ├── 📄 WelcomeNotification.tsx # Onboarding
│       ├── 📄 ConfirmDialog.tsx    # Confirmation modals
│       └── 📄 ConflictModal.tsx    # Sync conflict resolution
├── 📁 hooks/               # Custom React hooks
│   └── 📄 useLinks.ts          # Main state management
├── 📁 utils/               # Utility functions
│   ├── 📄 linkUtils.ts         # Link manipulation helpers
│   ├── 📄 supabase.ts          # Database client
│   ├── 📄 financialApi.ts      # Financial data fetching
│   └── 📄 googleSheetsApi.ts   # Google Sheets integration
├── 📁 api/                 # API routes
│   ├── 📄 click-track/route.ts # Click analytics endpoint
│   └── 📄 quote/route.ts       # Financial data proxy
├── 📁 types/               # TypeScript definitions
│   └── 📄 index.ts             # App-wide type definitions
├── 📁 constants/           # Application constants
│   └── 📄 index.ts             # Default data & configurations
└── 📄 page.tsx             # Main application page
```

---

## 🛠️ **Technical Features**

### ⚡ **Performance Optimizations**
- **React.memo**: Memoized components for optimal re-renders
- **useMemo/useCallback**: Expensive calculation caching
- **Debounced Search**: Efficient search performance
- **Bundle Optimization**: Next.js automatic optimizations

### 📱 **Responsive Breakpoints**
```css
Mobile:    1 column  (0px+)
Small:     2 columns (640px+)
Medium:    3 columns (768px+)
Large:     4 columns (1024px+)
XL:        5 columns (1280px+)
```

### 🔄 **State Management**
- **Custom useLinks Hook**: Centralized state logic
- **Offline-First**: LocalStorage as primary data source
- **Optimistic Updates**: Instant UI feedback
- **Background Sync**: Cloud sync without blocking UI

### 🎯 **User Experience**
- **Toast Notifications**: 4 types (success, error, warning, info)
- **Welcome System**: Smart onboarding for new users
- **Loading States**: Visual feedback for all operations
- **Error Boundaries**: Graceful error handling

---

## 🔧 **Configuration**

### 🎨 **Customizing Colors**
Add new gradient colors in `app/constants/index.ts`:
```typescript
export const GRADIENTS: string[] = [
  'from-red-500 to-pink-600',
  'from-your-color to-your-color2', // Add your custom gradient
  // ...
]
```

### 📂 **Adding Categories**
Update category list in `app/components/AddLinkModal.tsx`:
```typescript
const categoryOptions = [
  'Your Custom Category',
  // ... existing categories
]
```

### 🎭 **Background Themes**
Add new themes in `app/constants/index.ts`:
```typescript
export const BACKGROUND_THEMES: BackgroundTheme[] = [
  { name: 'Your Theme', class: 'bg-gradient-to-b from-color to-color' },
  // ...
]
```

---

## 🚀 **Deployment**

### 🌐 **Vercel (Recommended)**
```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel --prod
```

### 🐳 **Docker**
```bash
# Build image
docker build -t somenice-links .

# Run container
docker run -p 3000:3000 somenice-links
```

### 📦 **Build for Production**
```bash
npm run build
npm start
```

---

## 🤝 **Contributing**

1. **Fork** the repository
2. **Create** feature branch (`git checkout -b feature/amazing-feature`)
3. **Commit** changes (`git commit -m 'Add amazing feature'`)
4. **Push** to branch (`git push origin feature/amazing-feature`)
5. **Open** Pull Request

---

## 📄 **License**

All Rights Reserved © 2024

---

## 🎯 **Use Cases**

### 👨‍💻 **Developers**
- API documentation quick access
- Development tool collections
- Learning resource organization
- Project-specific link management

### 📚 **Researchers**
- Academic paper collections
- Reference material organization
- Citation source tracking
- Research tool aggregation

### 🏢 **Businesses**
- Team resource sharing
- Client-specific link collections
- Business dashboard quick access
- Productivity tool organization

### 🎓 **Students**
- Course material collections
- Study resource organization
- Assignment link tracking
- Educational tool access

---

## 🔮 **Roadmap**

- [ ] **Teams & Collaboration**: Shared link collections
- [ ] **Advanced Analytics**: Detailed usage statistics
- [ ] **API Access**: RESTful API for integrations
- [ ] **Mobile App**: React Native companion app
- [ ] **Browser Extension**: Quick link addition
- [ ] **Import Integrations**: Chrome bookmarks, Pocket, etc.

---

**🔥 Built with modern web technologies**: [Next.js](https://nextjs.org) • [TypeScript](https://typescriptlang.org) • [Tailwind CSS](https://tailwindcss.com) • [Clerk](https://clerk.dev) • [Supabase](https://supabase.com)

**🌟 Star this repo if you find it useful!**