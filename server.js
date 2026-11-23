import express from 'express';
import cors from 'cors';
import contactRoutes from './routes/contactRoutes.js';

// Automatically load .env environment variables (Node.js 20+ native)
try {
  process.loadEnvFile();
} catch (e) {
  // If .env is not found, fallback to defaults
}

const app = express();
const PORT = process.env.PORT || 5000;

// Enable Cross-Origin Resource Sharing so both frontend and admin panel can connect
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Body parser middleware
app.use(express.json());

// Health check root
app.get('/', (req, res) => {
  res.json({
    status: 'online',
    project: 'Co-Working Space TheWorkPlace API',
    version: '1.0.0',
    endpoints: {
      contacts: '/api/contacts',
      stats: '/api/stats',
      reset: '/api/reset'
    }
  });
});

// API Routes
app.use('/api', contactRoutes);

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Unhandled Server Error:', err);
  res.status(500).json({ success: false, message: 'Internal Server Error' });
});

// Start Server
app.listen(PORT, () => {
  console.log(`🚀 Co-working Backend Server running on http://localhost:${PORT}`);
  console.log(`📊 Contact API available at http://localhost:${PORT}/api/contacts`);
});
