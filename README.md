# 🕵️ Supernatural Detective Game

An immersive AI-powered detective adventure where you investigate supernatural mysteries and make crucial decisions that determine your fate. Each playthrough is unique, with dynamic storylines, voice narration, and personalized endings based on your choices.

![Supernatural Detective](https://images.unsplash.com/photo-1518709268805-4e9042af2176?w=800&h=400&fit=crop&q=80)

## 🎮 Game Features

### 🧠 **AI-Powered Storytelling**
- **Dynamic Narratives**: Every story is generated uniquely by OpenAI's GPT
- **Intelligent Choices**: 5 meaningful decisions per turn with hidden point values
- **Adaptive Difficulty**: Story complexity adapts to your investigation progress
- **Personalized Endings**: Victory and defeat conclusions tailored to your journey

### 🎭 **Immersive Experience**
- **Voice Narration**: High-quality AI voice synthesis (ElevenLabs + OpenAI)
- **Atmospheric Design**: Dark, noir-inspired interface with smooth animations
- **Choice Consequences**: Every decision impacts your detective's fate
- **Progress Tracking**: Visual score system showing case advancement

### 🔮 **Supernatural Elements**
- **Customizable Mysteries**: Choose your supernatural threat, location, and objective
- **Rich Atmosphere**: Haunting narratives with supernatural tension
- **Multiple Outcomes**: Triumph over evil or succumb to dark forces
- **Memorable Characters**: AI-generated NPCs and situations

### 📊 **Game Mechanics**
- **Scoring System**: 8-point scale from failure (0) to complete success (8)
- **Turn-Based Investigation**: Make strategic choices to advance the story
- **History Tracking**: Review all decisions and their consequences
- **Replay Value**: Each game offers completely different narratives

## 🚀 Getting Started

### Prerequisites
- Modern web browser (Chrome 61+, Firefox 60+, Safari 11+, Edge 16+)
- OpenAI API key (required for story generation)
- ElevenLabs API key (optional, for premium voice narration)

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/yourusername/supernatural-detective-game.git
   cd supernatural-detective-game
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Start the development server**
   ```bash
   npm run dev
   ```

4. **Open in browser**
   Navigate to `http://localhost:3000`

## ⚙️ Configuration

### 🔑 API Keys Setup

#### OpenAI API Key (Required)
1. Visit [OpenAI Platform](https://platform.openai.com/api-keys)
2. Create a new API key
3. Copy the complete key (starts with `sk-proj-`)
4. Enter it in the game's Settings page

#### ElevenLabs API Key (Optional - for premium voice)
1. Visit [ElevenLabs](https://elevenlabs.io/)
2. Sign up for an account (free tier available)
3. Generate an API key from your dashboard
4. Enter it in Settings for high-quality voice narration

### 🔊 Voice Settings
- **Enable/Disable**: Toggle voice narration on/off
- **Voice Selection**: Choose from 6 different AI voices
- **Quality Options**: OpenAI voices (standard) or ElevenLabs (premium)

## 🎯 How to Play

### 1. **Create Your Detective Story**
- **Detective Name**: Choose your investigator's identity
- **Supernatural Element**: Select the paranormal threat (ghosts, curses, demons, etc.)
- **Primary Location**: Pick the investigation site (mansion, asylum, cemetery, etc.)
- **Main Objective**: Define your mission (stop killings, banish evil, solve mystery, etc.)

### 2. **Navigate the Investigation**
- Read the AI-generated narrative describing your current situation
- Choose from 5 strategic options (A through E)
- Each choice has hidden consequences affecting your progress
- Watch your case progress bar and score

### 3. **Decision Impact System**
- **🌟 Excellent (+2)**: Brilliant detective work, major breakthrough
- **👍 Good (+1)**: Solid investigation technique, helpful progress  
- **⚖️ Neutral (0)**: Safe choice with no major impact
- **⚠️ Poor (-1)**: Risky decision, minor setback
- **💀 Very Bad (-2)**: Dangerous mistake, significant consequences

### 4. **Reach Your Conclusion**
- **Victory (8+ points)**: Solve the mystery with a triumphant ending
- **Defeat (0 points)**: Succumb to supernatural forces with a haunting finale
- Each ending is personalized based on your specific choices and story

## 🛠️ Technical Details

### Built With
- **React 18** - Modern UI framework
- **Vite** - Lightning-fast build tool
- **Tailwind CSS** - Utility-first styling
- **Framer Motion** - Smooth animations
- **OpenAI API** - Story generation
- **ElevenLabs API** - Premium voice synthesis
- **React Icons** - Beautiful icon library

### Project Structure
```
src/
├── components/          # React components
│   ├── GameSetup.jsx   # Character creation
│   ├── GamePlay.jsx    # Main game interface
│   ├── GameHistory.jsx # Decision tracking
│   └── Settings.jsx    # Configuration
├── contexts/           # State management
│   └── GameContext.jsx # Game state & actions
├── hooks/              # Custom React hooks
│   └── useSpeech.js    # Voice narration logic
├── services/           # External APIs
│   └── aiService.js    # OpenAI & ElevenLabs
├── common/             # Shared utilities
│   └── SafeIcon.jsx    # Icon management
└── App.jsx             # Main application
```

### Performance Features
- **Code Splitting**: Automatic bundle optimization
- **Lazy Loading**: Components load on demand  
- **Optimized Assets**: Compressed images and fast loading
- **Responsive Design**: Works on all device sizes
- **Error Boundaries**: Graceful error handling

## 🎨 Customization

### Adding New Supernatural Elements
Edit the suggestions in `GameSetup.jsx`:
```javascript
const suggestions = {
  supernaturalElement: [
    'Vengeful Spirits',
    'Ancient Curses',
    'Your Custom Element' // Add here
  ]
};
```

### Modifying Game Difficulty
Adjust scoring thresholds in `GameContext.jsx`:
```javascript
const initialState = {
  maxScore: 8,        // Victory threshold
  // Defeat at 0 points
};
```

### Styling Changes
- Edit `tailwind.config.js` for theme customization
- Modify `App.css` for custom animations
- Update color schemes in component files

## 🐛 Troubleshooting

### Common Issues

**"API Key Required" Error**
- Ensure your OpenAI API key is correctly entered in Settings
- Verify the key starts with `sk-` and is complete
- Check your OpenAI account has sufficient credits

**Voice Narration Not Working**  
- Confirm voice narration is enabled in Settings
- Check browser allows audio autoplay
- Try refreshing the page if audio gets stuck

**Slow Story Generation**
- This is normal - AI generation can take 10-30 seconds
- Ensure stable internet connection
- Check OpenAI service status if consistently slow

**Game Won't Load**
- Clear browser cache and cookies
- Disable ad blockers or browser extensions
- Try in incognito/private browsing mode

### Debug Mode
Open browser developer tools (F12) to see detailed logs and error messages.

## 🤝 Contributing

We welcome contributions! Here's how to get started:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Development Guidelines
- Follow existing code style and patterns
- Add comments for complex logic
- Test thoroughly before submitting
- Update documentation for new features

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- **OpenAI** for powerful language models enabling dynamic storytelling
- **ElevenLabs** for high-quality voice synthesis technology
- **React Team** for the excellent framework
- **Tailwind CSS** for beautiful, responsive styling
- **Framer Motion** for smooth, professional animations

## 📞 Support

- **Issues**: [GitHub Issues](https://github.com/yourusername/supernatural-detective-game/issues)
- **Discussions**: [GitHub Discussions](https://github.com/yourusername/supernatural-detective-game/discussions)
- **Email**: your-email@example.com

## 🔮 Future Features

- **Multiplayer Mode**: Investigate mysteries with friends
- **Character Progression**: Unlock new abilities and story options
- **Extended Campaigns**: Multi-case storylines with recurring characters
- **Custom Voice Training**: Upload your own voice for narration
- **Story Sharing**: Share your best investigation stories with the community

---

**Ready to investigate the supernatural?** 🕵️‍♂️✨

Start your first case and discover what mysteries await in the shadows...