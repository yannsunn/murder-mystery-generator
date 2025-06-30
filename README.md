# 🎭 Murder Mystery Generator

**AI-Powered Murder Mystery Scenario Generator**

## 🚀 Features

- **8-Phase AI Generation**: Complete murder mystery scenarios with characters, plot, and resolution
- **Customizable Settings**: Era, setting, complexity, and special elements
- **ZIP Export**: Complete scenario packages with GM guides and player materials
- **Real-time Progress**: Live updates during generation process
- **Professional Quality**: Enterprise-grade codebase with comprehensive error handling

## 🎯 Quick Start

1. **Visit**: https://murdermysterynetlify.vercel.app
2. **Configure**: Choose participants, era, setting, and complexity
3. **Generate**: AI creates complete scenario in 8 phases
4. **Download**: Get ZIP package with all materials

## 🛠 Technical Stack

- **Frontend**: Vanilla JavaScript, Modern CSS
- **Backend**: Vercel Functions, Node.js
- **AI**: Groq AI (primary), OpenAI (fallback)
- **Export**: JSZip for scenario packages
- **Security**: Enterprise-grade headers and validation

## 📦 Project Structure

```
api/
├── config/env-manager.js     # Environment management
├── utils/                    # Shared utilities
├── export.js                 # ZIP generation
├── health.js                 # System health check
├── scenario-storage.js       # Session management
├── security-utils.js         # Security headers
└── ultra-integrated-generator.js  # Main AI generation

public/
├── js/UltraIntegratedApp.js  # Frontend application
├── ultra-modern-styles.css   # Responsive styling
└── index.html               # Main interface
```

## 🔧 Environment Variables

```env
GROQ_API_KEY=your_groq_api_key_here
OPENAI_API_KEY=your_openai_key_here  # Optional fallback
NODE_ENV=production
```

## 🎮 Generated Content

Each scenario package includes:

- **Complete Scenario**: Full story with all phases
- **Game Master Guide**: Secrets, timeline, troubleshooting
- **Player Handouts**: Spoiler-free materials
- **Individual Phase Files**: Detailed breakdowns
- **Configuration Info**: Generation settings and metadata

## 📊 API Endpoints

- `GET /api/health` - System status and environment check
- `POST /api/ultra-integrated-generator` - Main AI generation
- `POST /api/export` - ZIP package generation
- `POST /api/scenario-storage` - Session management

## 🛡 Security Features

- CORS protection
- Input validation
- Rate limiting ready
- Environment variable validation
- Secure header implementation

## 🚀 Performance

- **Generation Time**: 30-90 seconds
- **Package Size**: Optimized text files
- **Scalability**: Vercel Functions architecture
- **Caching**: Built-in session management

---

**Ultra-optimized for production deployment with enterprise-grade reliability.**