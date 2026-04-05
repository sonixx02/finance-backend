const cors = require('cors');
const express = require('express');
const helmet = require('helmet');
const morgan = require('morgan');

const docsRoutes = require('./docs/swagger.routes');
const logger = require('./config/logger');
const authRoutes = require('./modules/auth/auth.routes');
const recordsRoutes = require('./modules/records/records.routes');
const dashboardRoutes = require('./modules/dashboard/dashboard.routes');
const errorMiddleware = require('./middleware/error.middleware');
const notFoundMiddleware = require('./middleware/notFound.middleware');

const app = express();

app.set('trust proxy', true);

app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(morgan('combined', { stream: logger.httpStream }));

app.get('/health', (req, res) => {
  void req;
  res.status(200).json({
    success: true,
    message: 'Finance backend is healthy.',
  });
});

app.use('/docs', docsRoutes);
app.use('/auth', authRoutes);
app.use('/records', recordsRoutes);
app.use('/dashboard', dashboardRoutes);

app.use(notFoundMiddleware);
app.use(errorMiddleware);

module.exports = app;
