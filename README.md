# Content Analyzer

A powerful AI-powered web application that extracts insights from blog posts and articles using Google Gemini AI. The application features content fetching from URLs, text-to-speech functionality, and comprehensive content analysis.

## ✨ Features

### 🔗 Content Fetching
- **URL Content Extraction**: Automatically fetch and extract readable content from any blog post or article URL
- **Multiple Proxy Fallbacks**: Uses multiple CORS proxy services to ensure reliable content fetching
- **Smart Content Parsing**: Intelligently extracts main content while filtering out navigation, ads, and other non-essential elements

### 🧠 AI-Powered Analysis
- **Google Gemini Integration**: Leverages Google's advanced Gemini AI for comprehensive content analysis
- **Structured Insights**: Generates detailed analysis including:
  - Executive Summary
  - Key Themes and Topics
  - Content Quality Assessment
  - Target Audience Analysis
  - Key Takeaways
  - Strengths and Recommendations

### 🎵 Text-to-Speech
- **Advanced Speech Controls**: Full audio playback control with play, pause, resume, and stop functionality
- **High-Quality Voices**: Automatically selects the best available voice for optimal listening experience
- **Speech Optimization**: Cleans and formats text for better speech synthesis output

### 💫 User Experience
- **Beautiful Design**: Modern, responsive interface with gradient backgrounds and smooth animations
- **Real-time Feedback**: Loading states, progress indicators, and comprehensive error handling
- **Mobile Responsive**: Optimized for all device sizes from mobile to desktop
- **Accessibility**: Proper contrast ratios, keyboard navigation, and screen reader support

## 🚀 Getting Started

### Prerequisites
- Node.js 18+ and npm
- Google Gemini API key

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd content-analyzer
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   Create a `.env` file in the root directory:
   ```env
   VITE_GEMINI_API_KEY=your_actual_gemini_api_key_here
   ```

4. **Get your Gemini API key**
   - Visit [Google AI Studio](https://makersuite.google.com/app/apikey)
   - Create a new API key
   - Copy the key to your `.env` file

5. **Start the development server**
   ```bash
   npm run dev
   ```

6. **Open your browser**
   Navigate to `http://localhost:5173`

## 🎯 Usage

### Analyzing Content from URL
1. Enter a blog post or article URL in the "Fetch from URL" section
2. Click "Fetch Content" to automatically extract the text
3. Click "Generate Insights" to analyze the content with AI

### Analyzing Pasted Content
1. Paste your content directly into the "Paste Content" textarea
2. Click "Generate Insights" to get AI-powered analysis

### Using Text-to-Speech
1. After generating insights, use the speech controls:
   - **Read Aloud**: Start audio playback
   - **Pause**: Temporarily pause the speech
   - **Resume**: Continue from where paused
   - **Stop**: Completely stop the audio

## 🛠️ Technology Stack

### Frontend
- **React 18** - Modern React with hooks and functional components
- **TypeScript** - Type-safe development
- **Tailwind CSS** - Utility-first CSS framework
- **Vite** - Fast build tool and development server

### AI & APIs
- **Google Gemini AI** - Advanced language model for content analysis
- **Web Speech API** - Browser-native text-to-speech functionality
- **CORS Proxy Services** - Multiple fallback services for content fetching

### Icons & UI
- **Lucide React** - Beautiful, customizable icons
- **Responsive Design** - Mobile-first approach with breakpoints
- **Modern Animations** - Smooth transitions and micro-interactions

## 📁 Project Structure

```
src/
├── components/           # Reusable UI components
├── services/            # API and external service integrations
│   ├── geminiService.ts    # Google Gemini AI integration
│   ├── contentService.ts  # URL content fetching
│   └── speechService.ts   # Text-to-speech functionality
├── App.tsx             # Main application component
├── main.tsx            # Application entry point
└── index.css           # Global styles and Tailwind imports
```

## 🔧 Configuration

### Environment Variables
- `VITE_GEMINI_API_KEY` - Your Google Gemini API key (required)

### Customization
- **Speech Settings**: Modify rate, pitch, and volume in `speechService.ts`
- **Content Limits**: Adjust content length limits in `geminiService.ts`
- **Styling**: Customize colors and design in Tailwind classes

## 🚨 Error Handling

The application includes comprehensive error handling for:
- Invalid URLs or inaccessible content
- API rate limits and authentication issues
- Network connectivity problems
- Browser compatibility issues
- Content parsing failures

## 📝 API Limits

### Google Gemini API
- Free tier: 15 requests per minute
- Content limit: ~4000 characters per request
- Rate limiting is handled gracefully with user-friendly error messages
---

**Built with ❤️ using React, TypeScript, and Google Gemini AI**
