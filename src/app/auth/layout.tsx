import { ReactNode } from "react";


export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="absolute inset-0 bg-gradient-to-br from-primary-900/5 to-primary-50/50 -z-10 pointer-events-none" />
      <div className="w-full max-w-md p-8 bg-white rounded-xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-gray-100">
        {children}
      </div>
    </div>
  );
}
