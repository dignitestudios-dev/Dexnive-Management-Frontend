import { useMutation } from "@tanstack/react-query";
import { loginUser, logoutUser, forgotPassword, verifyOTP, updatePassword } from "@/features/auth/api/auth.service";
import { LoginCredentials, ForgotPasswordPayload, VerifyOTPPayload } from "@/features/auth/types";

export function useLoginMutation() {
  return useMutation({
    mutationFn: (credentials: LoginCredentials) => loginUser(credentials),
  });
}

export function useLogoutMutation() {
  return useMutation({
    mutationFn: () => logoutUser(),
  });
}

export function useForgotPasswordMutation() {
  return useMutation({
    mutationFn: (data: ForgotPasswordPayload) => forgotPassword(data),
  });
}

export function useVerifyOTPMutation() {
  return useMutation({
    mutationFn: (data: VerifyOTPPayload) => verifyOTP(data),
  });
}

export function useUpdatePasswordMutation() {
  return useMutation({
    mutationFn: (data: { password: string; token: string }) => updatePassword(data),
  });
}
