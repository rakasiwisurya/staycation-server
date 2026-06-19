const path = require("path");
const createError = require("http-errors");
const express = require("express");
const cookieParser = require("cookie-parser");
const logger = require("morgan");
const cors = require("cors");
const methodOverride = require("method-override");
const session = require("express-session");
const flash = require("connect-flash");

const config = require("./config");
const { assetUrl } = require("./helpers/storage");

const indexRouter = require("./routes/index");
const usersRouter = require("./routes/users");
const adminRouter = require("./routes/admin");
const apiRouter = require("./routes/api");

const app = express();

// Behind Render's proxy in production so secure cookies work correctly.
if (config.isProduction) app.set("trust proxy", 1);

// View engine (EJS admin dashboard).
app.set("views", path.join(__dirname, "views"));
app.set("view engine", "ejs");

// Cross-origin access for the React client.
app.use(
  cors({
    origin: config.corsOrigins.length ? config.corsOrigins : true,
    credentials: true,
  })
);

app.use(logger(config.isProduction ? "combined" : "dev"));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(methodOverride("_method"));

app.use(
  session({
    secret: config.session.secret,
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      secure: config.isProduction,
      maxAge: 1000 * 60 * 60 * 2, // 2 hours
    },
  })
);
app.use(flash());

// Expose the asset URL resolver to every EJS template.
app.use((req, res, next) => {
  res.locals.assetUrl = assetUrl;
  next();
});

// Static assets: uploaded images (local driver) and the admin theme.
app.use(express.static(path.join(__dirname, "public")));
app.use(
  "/sb-admin-2",
  express.static(path.join(__dirname, "node_modules/startbootstrap-sb-admin-2"))
);

app.use("/", indexRouter);
app.use("/users", usersRouter);
app.use("/admin", adminRouter);
app.use("/api/v1/member", apiRouter);

// 404 handler.
app.use((req, res, next) => next(createError(404)));

// Error handler. API requests get JSON; everything else renders the error view.
app.use((err, req, res, next) => {
  const status = err.status || 500;

  if (req.path.startsWith("/api/")) {
    return res.status(status).json({
      status: "Failed",
      message: status === 500 ? "Internal server error" : err.message,
    });
  }

  res.locals.message = err.message;
  res.locals.error = config.isProduction ? {} : err;
  res.status(status).render("error");
});

module.exports = app;
