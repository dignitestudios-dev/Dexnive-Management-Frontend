import axiosInstance from "@/lib/axios";
import { LoginCredentials, LoginResponse, ForgotPasswordPayload, VerifyOTPPayload } from "@/features/auth/types";

export async function loginUser(credentials: LoginCredentials): Promise<LoginResponse> {
  const { data } = await axiosInstance.post<LoginResponse>("/auth/login", credentials, {
    headers: {
      // These are required by the backend AuthValidator
      "deviceuniqueid": "web-browser", // Generate properly if needed
      "devicemodel": navigator.userAgent,
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
