import express, { type Router } from "express";
import { jwtDecode } from "jwt-decode";

const mockApiRouter: Router = express.Router();

// In-memory user store
const users: Record<string, any> = {};

// Helper to create a mock JWT token (simple base64 encoding of header.payload.signature)
const createMockJwt = (userId: string, email: string): string => {
  const header = { alg: "HS256", typ: "JWT" };
  const payload = {
    userId,
    email,
    iat: Math.floor(Date.now() / 1000),
    exp: Math.floor(Date.now() / 1000) + 86400 * 7, // 7 days
  };
  const signature = "mock_signature";

  const encodedHeader = Buffer.from(JSON.stringify(header)).toString("base64url");
  const encodedPayload = Buffer.from(JSON.stringify(payload)).toString("base64url");
  const encodedSignature = Buffer.from(signature).toString("base64url");

  return `${encodedHeader}.${encodedPayload}.${encodedSignature}`;
};

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
  const mockToken = createMockJwt(mockUserId, authEmail);

  users[mockUserId] = {
    userId: mockUserId,
    email: authEmail,
    firstName: "Demo",
    lastName: "User",
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

// Mock POST /dev/set-kyc-status (development helper to set specific KYC status)
mockApiRouter.post("/dev/set-kyc-status", (req, res) => {
  const { userId, status } = req.body;
  if (!userId) {
    return res.status(400).json({ error: "userId is required" });
  }

  if (users[userId]) {
    users[userId].kycStatus = status || "notStarted";
  }

  res.json({ success: true, user: users[userId] });
});

// Mock POST /api/v1/kyc/submit (KYC information submission)
mockApiRouter.post("/api/v1/kyc/submit", (req, res) => {
  const decoded = getJwtFromHeader(req.headers.authorization);
  if (!decoded?.userId) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  const { firstName, lastName, dateOfBirth, country } = req.body;
  const userId = decoded.userId;

  if (users[userId]) {
    users[userId].firstName = firstName || users[userId].firstName;
    users[userId].lastName = lastName || users[userId].lastName;
    users[userId].dateOfBirth = dateOfBirth;
    users[userId].country = country;
    users[userId].kycStatus = "approved";
  }

  res.json({ success: true, user: users[userId] });
});

// Mock POST /dev/reset-user (development helper to reset user state)
mockApiRouter.post("/dev/reset-user", (req, res) => {
  const { userId } = req.body;
  if (!userId) {
    return res.status(400).json({ error: "userId is required" });
  }

  if (users[userId]) {
    users[userId] = {
      userId,
      email: users[userId].email,
      kycStatus: "notStarted",
      isSourceOfFundsAnswered: false,
      isPhoneValidated: false,
      status: "ACTIVE",
      safeWallet: [],
    };
  }

  res.json({ success: true, message: "User state reset", user: users[userId] });
});

// Mock GET /api/v1/source-of-funds
mockApiRouter.get("/api/v1/source-of-funds", (_req, res) => {
  res.json([
    { question: "What is your primary source of funds?", answer: "" },
    { question: "How much do you plan to transfer annually?", answer: "" },
  ]);
});

// Mock POST /api/v1/source-of-funds (submit answers)
mockApiRouter.post("/api/v1/source-of-funds", (req, res) => {
  const decoded = getJwtFromHeader(req.headers.authorization);
  if (!decoded?.userId) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  const userId = decoded.userId;
  if (users[userId]) {
    users[userId].isSourceOfFundsAnswered = true;
  }

  res.json({ success: true });
});

// Mock POST /api/v1/verification (send phone code)
mockApiRouter.post("/api/v1/verification", (req, res) => {
  const decoded = getJwtFromHeader(req.headers.authorization);
  if (!decoded?.userId) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  res.json({ ok: true, requestId: "req_" + Date.now() });
});

// Mock POST /api/v1/verification/check (verify OTP)
mockApiRouter.post("/api/v1/verification/check", (req, res) => {
  const decoded = getJwtFromHeader(req.headers.authorization);
  if (!decoded?.userId) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  const userId = decoded.userId;
  if (users[userId]) {
    users[userId].isPhoneValidated = true;
  }

  res.json({ success: true });
});

// Mock GET /api/v1/safe-config
mockApiRouter.get("/api/v1/safe-config", (req, res) => {
  const decoded = getJwtFromHeader(req.headers.authorization);
  if (!decoded?.userId) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  // Check if user has deployed Safe wallet
  const user = users[decoded.userId];
  const hasSafeWallet = user && user.safeWallet && user.safeWallet.length > 0;
  const safeAddress = hasSafeWallet ? user.safeWallet[0].address : "0x1234567890123456789012345678901234567890";

  // Return a complete safe config object
  const mockSafeConfig = {
    address: safeAddress,
    chainId: 100,
    accountStatus: hasSafeWallet ? 0 : 2, // 0 = AccountIntegrityStatus.Ok, 2 = NotDeployed
    fiatSymbol: "EUR",
    accountNonce: 0,
    delayModuleAddress: "0x0987654321098765432109876543210987654321",
    ibanAddress: "DE89370400440532013000",
    ibanCountry: "DE",
  };

  res.json(mockSafeConfig);
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

  // Create Safe wallet for the user
  if (user) {
    user.safeWallet = [{ address: "0x" + Math.random().toString(16).slice(2, 42) }];
  }

  res.json({ status: "ok" });
});

// Mock GET /api/v1/safe/deploy
mockApiRouter.get("/api/v1/safe/deploy", (req, res) => {
  const decoded = getJwtFromHeader(req.headers.authorization);
  if (!decoded?.userId) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  res.json({ status: "ok" });
});

// Mock GET /api/v1/auth/nonce
mockApiRouter.get("/api/v1/auth/nonce", (_req, res) => {
  const nonce = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
  res.json(nonce);
});

// Mock POST /api/v1/auth/challenge
mockApiRouter.post("/api/v1/auth/challenge", (req, res) => {
  const { message, signature } = req.body;
  if (!message || !signature) {
    return res.status(400).json({ error: "Message and signature are required" });
  }

  const mockUserId = `user_${Date.now()}`;
  const mockToken = createMockJwt(mockUserId, "user@example.com");

  users[mockUserId] = {
    userId: mockUserId,
    email: "user@example.com",
    firstName: "Demo",
    lastName: "User",
    kycStatus: "notStarted",
    isSourceOfFundsAnswered: false,
    isPhoneValidated: false,
    status: "ACTIVE",
    safeWallet: [],
  };

  res.json({ token: mockToken });
});

export { mockApiRouter };
