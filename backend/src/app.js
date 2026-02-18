const express = require("express");
const cors = require("cors");
const cookieParser = require("cookie-parser");

const trackingRoutes = require("./modules/tracking/tracking.routes");
const authRoutes = require("./modules/auth/auth.routes");
const productRoutes = require("./modules/products/product.routes");
const orderRoutes = require("./modules/orders/order.routes");
const paymentRoutes = require("./modules/payments/payment.routes");
const adminRoutes = require("./modules/admin/admin.routes");
const userAuthRoutes = require("./modules/users/userAuthRoutes")
const cartRoutes = require("./modules/cart/cart.routes");
const settingRoutes=require("./modules/settings/settings.routes")
const routedapis=require("./modules/openRoutedapis/routesapi.route")
const app = express();


/* ================= CORS CONFIG ================= */



app.use(
  cors({
    origin: process.env.FRONTEND_URL,
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);


/* ================= MIDDLEWARE ================= */

app.use(cookieParser());

app.use(express.json());
app.use(express.urlencoded({ extended: true }));


/* ================= ROUTES ================= */

app.use("/api/auth", authRoutes);
app.use("/api/admin/settings", settingRoutes);
app.use("/api/admin", adminRoutes);

app.use("/api/shop", productRoutes);

app.use("/api/payments", paymentRoutes);
app.use("/api/orders", orderRoutes);
app.use("/api/tracking", trackingRoutes);
app.use("/api/users", userAuthRoutes)
app.use("/api/cart", cartRoutes);
app.use('/api',routedapis)


/* ================= EXPORT ================= */

module.exports = app;