import { jwtDecode } from "jwt-decode";

// This is the way we know whether a user has ever signed up or not.
export const isTokenWithUserId = (token: string | null): boolean => {
  if (!token) return false;

  try {
    const decodedToken = jwtDecode<{ userId?: string; exp: number }>(token);
    return !!decodedToken.userId;
  } catch (error) {
    console.error("Error decoding token in isTokenWithUserId:", error);
    return false;
  }
};
