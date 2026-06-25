const express = require("express");
const cors = require("cors");
const cookieParser = require("cookie-parser");
const rateLimit = require("express-rate-limit");
const helmet = require("helmet");

const trackingRoutes = require("./modules/tracking/tracking.routes");
const authRoutes = require("./modules/auth/auth.routes");
const productRoutes = require("./modules/products/product.routes");
const orderRoutes = require("./modules/orders/order.routes");
const paymentRoutes = require("./modules/payments/payment.routes");
const adminRoutes = require("./modules/admin/admin.routes");
const userAuthRoutes = require("./modules/users/userAuthRoutes")
const cartRoutes = require("./modules/cart/cart.routes");
const settingRoutes=require("./modules/settings/settings.routes")
const companyRoutes=require("./modules/companyDetails/companyRoutes")
const routedapis=require("./modules/openRoutedapis/routesapi.route")
const couponRoutes = require("./modules/coupons/coupon.routes");
const bannerRoutes = require("./modules/banners/banner.routes");
const flashRoutes = require('./modules/flash-sales/flash.routes');
const walletRoutes = require('./modules/wallet/wallet.routes');
const qaRoutes = require('./modules/qa/qa.routes');
const pushRoutes = require('./modules/push/push.routes');
const supportRoutes = require('./modules/support/support.routes');
const analyticsRoutes = require('./modules/analytics/analytics.routes');

const app = express();

/* ================= SECURITY HEADERS ================= */
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" },
  contentSecurityPolicy: false,
}));
app.set('trust proxy', 1);

/* ================= RATE LIMITING ================= */
const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 300,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Too many requests, please try again later.' },
});

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Too many login attempts, please try again in 15 minutes.' },
});

const orderLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Too many order requests, please slow down.' },
});

app.use(globalLimiter);

/* ================= CORS CONFIG ================= */



app.use(
  cors({
    origin: [process.env.FRONTEND_URL, /^http:\/\/localhost/, /^exp:\/\//, /^oroganix:/].filter(Boolean),
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

app.use("/api/auth", authLimiter, authRoutes);
app.use("/api/admin/settings", settingRoutes);
app.use("/api/admin", adminRoutes);

app.use("/api/shop", productRoutes);

app.use("/api/payments", paymentRoutes);
app.use("/api/orders", orderLimiter, orderRoutes);
app.use("/api/tracking", trackingRoutes);
app.use("/api/users", userAuthRoutes)
app.use("/api/cart", cartRoutes);
app.use("/api/company",companyRoutes)
app.use('/api',routedapis)
app.use('/api/coupons', couponRoutes);
app.use('/api/banners', bannerRoutes);
app.use('/api/flash-sales', flashRoutes);
app.use('/api/wallet', walletRoutes);
app.use('/api/qa', qaRoutes);
app.use('/api/push', pushRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/support', supportRoutes);


/* ================= EXPORT ================= */

module.exports = app;