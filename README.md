# Medigence Frontend (Next.js)

The patient and doctor portal for Medigence.

## 🚀 Quick Setup

1. **Install Dependencies**
   ```bash
   npm install
   ```

2. **Environment Configuration**
   - Copy `.env.example` to `.env.local`
   - Ensure `NEXT_PUBLIC_SOCKET_URL` (usually [http://localhost:4000](http://localhost:4000)) and `NEXT_PUBLIC_API_URL` are correct.

3. **Start Development Server**
   ```bash
   npm run dev
   ```
   *Runs on [http://localhost:3000](http://localhost:3000)*

## 🛠 Tech Stack
- **Next.js 15 (App Router)**: React Framework
- **Tailwind CSS**: Styling
- **Socket.io Client**: Real-time messaging/presence
- **Lucide React**: Icons
- **Axios**: HTTP requests
- **Sonner**: Notifications
