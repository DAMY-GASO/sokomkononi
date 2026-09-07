require("express-async-errors");
const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");
const { clientUrl } = require("./config/env");
const { notFound, errorHandler } = require("./middleware/errorHandler");

const authRoutes = require("./routes/auth.routes");
const categoryRoutes = require("./routes/category.routes");
const propertyRoutes = require("./routes/property.routes");
const dealRoomRoutes = require("./routes/dealroom.routes");
const reservationRoutes = require("./routes/reservation.routes");
const waitingListRoutes = require("./routes/waitinglist.routes");
const transactionRoutes = require("./routes/transaction.routes");
const notificationRoutes = require("./routes/notification.routes");
const adminRoutes = require("./routes/admin.routes");

const app = express();

app.use(helmet());
app.use(cors({ origin: clientUrl, credentials: true }));
app.use(express.json());
app.use(morgan("dev"));

app.get("/health", (req, res) => res.json({ success: true, message: "SokoMkononi API iko sawa" }));

app.use("/api/auth", authRoutes);
app.use("/api/categories", categoryRoutes);
app.use("/api/properties", propertyRoutes);
app.use("/api/deal-rooms", dealRoomRoutes);
app.use("/api/reservations", reservationRoutes);
app.use("/api/waiting-list", waitingListRoutes);
app.use("/api/transactions", transactionRoutes);
app.use("/api/notifications", notificationRoutes);
app.use("/api/admin", adminRoutes);

app.use(notFound);
app.use(errorHandler);

module.exports = app;
