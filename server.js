const express = require("express");
const jwt = require("jsonwebtoken");

const app = express();
app.use(express.json());

const JWT_SECRET = "super-secret-key"; 
const PORT = 3000;

// Fake demo user (no real DB)
const USER = { id: 1, username: "alice", password: "password" };

// In-memory map: userId -> latest valid refreshToken uniqueTokenId
const refreshStore = new Map();

// TOKEN HELPERS 

function generateAccessToken(userId) {
  // short-lived for demo
  return jwt.sign({ userId }, JWT_SECRET, { expiresIn: "1m" });
}

function generateRefreshToken(userId) {
  const uniqueTokenId = Math.random().toString(36).substring(2);
  const token = jwt.sign({ userId, uniqueTokenId }, JWT_SECRET, { expiresIn: "7d" });

  // store latest valid uniqueTokenId for this user
  refreshStore.set(userId, uniqueTokenId);

  return token;
}

function auth(req, res, next) {
  const header = req.headers.authorization;
  if (!header) return res.status(401).json({ error: "No token provided" });

  const token = header.replace("Bearer ", "");

  try {
    const payload = jwt.verify(token, JWT_SECRET);
    req.userId = payload.userId;
    next();
  } catch (err) {
    return res.status(401).json({ error: "Invalid or expired access token" });
  }
}


// LOGIN returns accessToken and refreshToken
app.post("/login", (req, res) => {
  const { username, password } = req.body;

  if (username !== USER.username || password !== USER.password) {
    return res.status(401).json({ error: "Invalid credentials" });
  }

  const accessToken = generateAccessToken(USER.id);
  const refreshToken = generateRefreshToken(USER.id);

  res.json({ accessToken, refreshToken });
});

// PROTECTED ROUTE (requires access token)
app.get("/profile", auth, (req, res) => {
  res.json({
    message: "Protected profile data",
    userId: req.userId,
  });
});

// REFRESH TOKEN ROTATION
app.post("/refresh", (req, res) => {
  const { refreshToken } = req.body;

  if (!refreshToken) return res.status(400).json({ error: "No refresh token" });

  try {
    // decode and verify the token
    const payload = jwt.verify(refreshToken, JWT_SECRET);
    const { userId, uniqueTokenId } = payload;

    const validJti = refreshStore.get(userId);

    // replay attack or reused token
    if (!validJti || validJti !== uniqueTokenId) {
      return res.status(401).json({ error: "Invalid or reused refresh token" });
    }

    // ROTATE: invalidate old uniqueTokenId and issue new tokens
    const newAccessToken = generateAccessToken(userId);
    const newRefreshToken = generateRefreshToken(userId);

    res.json({
      accessToken: newAccessToken,
      refreshToken: newRefreshToken
    });

  } catch (err) {
    return res.status(401).json({ error: "Invalid refresh token" });
  }
});

// LOGOUT → remove refresh token uniqueTokenId
app.post("/logout", auth, (req, res) => {
  refreshStore.delete(req.userId);
  res.json({ message: "Logged out and refresh tokens invalidated" });
});

// START SERVER

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
