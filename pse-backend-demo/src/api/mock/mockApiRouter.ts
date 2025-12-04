import express, { type Router } from "express";
import { jwtDecode } from "jwt-decode";

const mockApiRouter: Router = express.Router();

// In-memory user store
const users: Record<string, any> = {};

// Helper to extract JWT from header
const getJwtFromHeader = (authHeader?: string): any => {
  if (!authHeader?.startsWith("Bearer ")) return null;
  try {
    const token = authHeader.substring(7);
    return jwtDecode(token) as any;
  } catch {
    return null;
  }
};

// Mock GET /api/v1/user
mockApiRouter.get("/api/v1/user", (req, res) => {
  const decoded = getJwtFromHeader(req.headers.authorization);
  if (!decoded?.userId) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  const user = users[decoded.userId] || {
    userId: decoded.userId,
    email: decoded.email || "user@example.com",
    kycStatus: "notStarted",
    isSourceOfFundsAnswered: false,
    isPhoneValidated: false,
    status: "ACTIVE",
    safeWallet: [],
  };

  users[decoded.userId] = user;
  res.json(user);
});

// Mock POST /api/v1/auth/signup
mockApiRouter.post("/api/v1/auth/signup", (req, res) => {
  const { authEmail, partnerId } = req.body;
  if (!authEmail) {
    return res.status(400).json({ error: "Email is required" });
  }

  // Generate a mock JWT
  const mockUserId = `user_${Date.now()}`;
  const mockToken = Buffer.from(JSON.stringify({ userId: mockUserId, email: authEmail })).toString("base64");

  users[mockUserId] = {
    userId: mockUserId,
    email: authEmail,
    kycStatus: "notStarted",
    isSourceOfFundsAnswered: false,
    isPhoneValidated: false,
    status: "ACTIVE",
    safeWallet: [],
  };

  res.json({ token: mockToken });
});

// Mock GET /api/v1/kyc/integration
mockApiRouter.get("/api/v1/kyc/integration", (_req, res) => {
  res.json({ url: "http://localhost:8080/kyc-iframe" });
});

// Mock GET /api/v1/terms
mockApiRouter.get("/api/v1/terms", (_req, res) => {
  res.json({
    terms: [
      {
        type: "general-tos",
        url: "https://gnosispay.com/terms",
        name: "Gnosis Pay Terms of Service",
        currentVersion: "v1",
        accepted: false,
        acceptedVersion: null,
      },
      {
        type: "privacy-policy",
        url: "https://gnosispay.com/privacy",
        name: "Privacy Policy",
        currentVersion: "v1",
        accepted: false,
        acceptedVersion: null,
      },
    ],
  });
});

// Mock GET /api/v1/user/terms
mockApiRouter.get("/api/v1/user/terms", (req, res) => {
  const decoded = getJwtFromHeader(req.headers.authorization);
  if (!decoded?.userId) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  res.json({
    terms: [
      {
        type: "general-tos",
        url: "https://gnosispay.com/terms",
        name: "Gnosis Pay Terms of Service",
        currentVersion: "v1",
        accepted: true,
        acceptedVersion: "v1",
      },
      {
        type: "privacy-policy",
        url: "https://gnosispay.com/privacy",
        name: "Privacy Policy",
        currentVersion: "v1",
        accepted: true,
        acceptedVersion: "v1",
      },
    ],
  });
});

// Mock POST /api/v1/user/terms (accept terms)
mockApiRouter.post("/api/v1/user/terms", (req, res) => {
  const decoded = getJwtFromHeader(req.headers.authorization);
  if (!decoded?.userId) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  res.json({ success: true });
});

// Mock POST /dev/kyc-approve (development helper)
mockApiRouter.post("/dev/kyc-approve", (req, res) => {
  const { userId } = req.body;
  if (!userId) {
    return res.status(400).json({ error: "userId is required" });
  }

  if (users[userId]) {
    users[userId].kycStatus = "approved";
  }

  res.json({ success: true, user: users[userId] });
});

// Mock POST /dev/source-of-funds-approve (development helper)
mockApiRouter.post("/dev/source-of-funds-approve", (req, res) => {
  const { userId } = req.body;
  if (!userId) {
    return res.status(400).json({ error: "userId is required" });
  }

  if (users[userId]) {
    users[userId].isSourceOfFundsAnswered = true;
  }

  res.json({ success: true, user: users[userId] });
});

// Mock POST /dev/phone-verify-approve (development helper)
mockApiRouter.post("/dev/phone-verify-approve", (req, res) => {
  const { userId } = req.body;
  if (!userId) {
    return res.status(400).json({ error: "userId is required" });
  }

  if (users[userId]) {
    users[userId].isPhoneValidated = true;
  }

  res.json({ success: true, user: users[userId] });
});

// Mock POST /dev/safe-deploy-approve (development helper)
mockApiRouter.post("/dev/safe-deploy-approve", (req, res) => {
  const { userId } = req.body;
  if (!userId) {
    return res.status(400).json({ error: "userId is required" });
  }

  if (users[userId]) {
    users[userId].safeWallet = [{ address: "0x" + Math.random().toString(16).slice(2, 42) }];
  }

  res.json({ success: true, user: users[userId] });
});

// Mock GET /api/v1/source-of-funds
mockApiRouter.get("/api/v1/source-of-funds", (_req, res) => {
  res.json([
    { question: "What is your primary source of funds?", answer: "" },
    { question: "How much do you plan to transfer annually?", answer: "" },
  ]);
});

// Mock POST /api/v1/source-of-funds (submit answers)
mockApiRouter.post("/api/v1/source-of-funds", (_req, res) => {
  res.json({ success: true });
});

// Mock POST /api/v1/verification (send phone code)
mockApiRouter.post("/api/v1/verification", (_req, res) => {
  res.json({ ok: true });
});

// Mock POST /api/v1/verification/check (verify OTP)
mockApiRouter.post("/api/v1/verification/check", (_req, res) => {
  res.json({ success: true });
});

// Mock GET /api/v1/safe-config
mockApiRouter.get("/api/v1/safe-config", (req, res) => {
  const decoded = getJwtFromHeader(req.headers.authorization);
  if (!decoded?.userId) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  res.json({ accountStatus: 0 });
});

// Mock POST /api/v1/safe/deploy
mockApiRouter.post("/api/v1/safe/deploy", (req, res) => {
  const decoded = getJwtFromHeader(req.headers.authorization);
  if (!decoded?.userId) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  const user = users[decoded.userId];
  if (user && user.kycStatus !== "approved") {
    return res.status(403).json({ error: "User is not KYC approved" });
  }

  res.json({ status: "accepted" });
});

// Mock GET /api/v1/safe/deploy
mockApiRouter.get("/api/v1/safe/deploy", (req, res) => {
  const decoded = getJwtFromHeader(req.headers.authorization);
  if (!decoded?.userId) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  res.json({ status: "ok" });
});

export { mockApiRouter };
