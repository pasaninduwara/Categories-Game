API:
   - `URL` → `VITE_SUPABASE_URL`
   - `anon/public` key → `VITE_SUPABASE_ANON_KEY`
4. Enable Realtime: Go to Database > Replication and enable for all tables

### Step 2: Deploy to Netlify

1. Connect your GitHub repository to Netlify
2. Set build command: `npm run build`
3. Set publish directory: `dist`
4. Add environment variables:
   ```
   VITE_SUPABASE_URL=your-supabase-url
   VITE_SUPABASE_ANON_KEY=your-anon-key
   ```
5. Deploy!

### Step 3: Configure Telegram Mini App

1. Open [@BotFather](https://t.me/botfather)
2. Send `/newbot` and follow instructions
3. Send `/mybots` and select your bot
4. Go to Bot Settings > Configure Mini App
5. Enable Mini App
6. Set your Netlify URL as the Web App URL
7. Configure additional settings:
   - Short name (for deep links)
   - Title and description

### Step 4: Test Your Mini App

1. Open your bot in Telegram
2. You should see a "Launch" button
3. Test the game flow:
   - Create a game
   - Copy the session code
   - Share with friends
   - Play together!

## 🔧 Local Development

```bash
# Clone the repository
git clone <your-repo>
cd categories-game

# Install dependencies
npm install

# Create .env file
echo "VITE_SUPABASE_URL=your-url" > .env
echo "VITE_SUPABASE_ANON_KEY=your-key" >> .env

# Start development server
npm run dev

# Build for production
npm run build
```

### Testing in Telegram

1. Use [ngrok](https://ngrok.com) to expose local server:
   ```bash
   ngrok http 5173
   ```
2. Use the ngrok URL in BotFather configuration
3. Test on the test server environment

## 🎯 Game Flow

```
┌──────────┐    ┌──────────┐    ┌──────────┐    ┌──────────┐
│  Lobby   │───▶│ Select   │───▶│ Playing  │───▶│ Results  │
│ (waiting)│    │ Letter   │    │ (60-90s) │    │(scoring) │
└──────────┘    └──────────┘    └──────────┘    └──────────┘
     │                                               │
     │               ┌──────────┐                    │
     └──────────────▶│ Finished │◀───────────────────┘
        (play again) │(celebrate)│
                     └──────────┘
```

### Turn Rotation

- Round 1: Player 1 picks letter
- Round 2: Player 2 picks letter
- Round N: Player (N-1) mod playerCount picks letter

### Scoring

| Outcome | Points | Condition |
|---------|--------|-----------|
| Unique | 10 | Only player with this answer |
| Duplicate | 5 | Multiple players with same answer |
| Empty/Invalid | 0 | No answer or wrong starting letter |

## 🔒 Security Considerations

- Row Level Security (RLS) enabled on all tables
- Telegram user authentication via init data validation
- No sensitive data stored (only session state)
- Session expires after 30 minutes of inactivity

## 📱 Mobile Optimization

- Designed for 320px-428px width
- Touch-friendly buttons (min 44px touch targets)
- Safe area insets for notched devices
- Smooth 60fps animations
- Offline-friendly with local state

## 🌐 Internationalization

The app supports both Sinhala (si) and English (en):

```typescript
const UI_TEXT = {
  en: { title: 'Categories Game', ... },
  si: { title: 'කාණ්ඩ ක්‍රීඩාව', ... }
};
```

## 📊 Performance Targets

- ✅ < 500ms latency for real-time updates
- ✅ < 3s initial load time
- ✅ < 100KB gzipped bundle size
- ✅ Works on 3G networks

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

## 📄 License

MIT License - feel free to use this for your own projects!

---

Built with ❤️ for the Telegram Mini Apps ecosystem