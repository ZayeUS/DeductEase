import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import usersRouter from './routes/users.js';
import rolesRouter from './routes/roles.js';
import profileRouter from './routes/profiles.js';
import auditRouter from './routes/auditRoutes.js';
import testEmailRoutes from './routes/testEmail.js';
import stripeRouter from './routes/stripeRoutes.js';
import plaidRoutes from './routes/plaid/plaidRoutes.js';
import taxRoutes from './routes/taxRoutes.js';
import categoryRoutes from './routes/plaid/autoCategory.js';
import dashboardRoutes from './routes/dashboard/dashboard.js'; // ✅ NEW import
import reportsRouter from './routes/reports/reports.js'; // ✅ NEW import

dotenv.config();

const app = express();

const corsOptions = {
  origin: process.env.CORS_ORIGIN || "*",
  methods: "GET,POST,PUT,DELETE",
  allowedHeaders: "Content-Type,Authorization",
};

app.use(cors(corsOptions));
app.use(express.json());

// Mount all routes
app.use("/api/users", usersRouter);
app.use("/api/roles", rolesRouter);
app.use("/api/profile", profileRouter);
app.use("/api/audit", auditRouter);
app.use("/api/email", testEmailRoutes);
app.use("/api/stripe", stripeRouter);
app.use("/api/plaid", plaidRoutes);
app.use("/api/tax", taxRoutes);
app.use("/api/category", categoryRoutes);
app.use("/api/dashboard", dashboardRoutes); // ✅ NEW route
app.use("/api/reports", reportsRouter); // ✅ NEW route


const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
