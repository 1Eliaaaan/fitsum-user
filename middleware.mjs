import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key";

export const authenticateToken = async (event) => {
  const cookieHeader = event.cookies[0];

  if (!cookieHeader) {
    return null;
  }

  const token = cookieHeader.split("token=")[1];

  if (!token) {
    return null;
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);

    return {
      userId: decoded.userId,
    };
  } catch (error) {
    console.error("Invalid token", error);
    return null;
  }
};
