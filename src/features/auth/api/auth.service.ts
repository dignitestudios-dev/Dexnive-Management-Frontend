import axiosInstance from "@/lib/axios";
import { LoginCredentials, LoginResponse, ForgotPasswordPayload, VerifyOTPPayload } from "@/features/auth/types";

const generateDeviceId = () => {
  return `web-${Math.random().toString(36).substring(2, 15)}-${Date.now().toString(36)}`;
};

export async function loginUser(credentials: LoginCredentials): Promise<LoginResponse> {
  const { data } = await axiosInstance.post<LoginResponse>("/auth/login", credentials, {
    headers: {
      "deviceuniqueid": generateDeviceId(),
      "devicemodel": typeof navigator !== "undefined" ? navigator.userAgent : "web-browser",
    }
  });
  return data;
}

export async function logoutUser(): Promise<void> {
  await axiosInstance.post("/auth/logout");
}

export async function forgotPassword(data: ForgotPasswordPayload): Promise<void> {
  const response = await axiosInstance.post("/auth/forgot", data);
  return response.data;
}

export async function verifyOTP(data: VerifyOTPPayload): Promise<LoginResponse> {
  const response = await axiosInstance.post("/auth/verify", data);
  return response.data;
}

export async function updatePassword({ password, token }: { password: string; token: string }): Promise<void> {
  const response = await axiosInstance.post("/auth/updatePassword", { password }, {
    headers: { Authorization: `Bearer ${token}` }
  });
  return response.data;
}
