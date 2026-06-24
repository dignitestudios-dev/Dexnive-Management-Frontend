import ReduxProvider from "./redux-provider";
import QueryProvider from "./query-provider";
import AuthRehydrator from "./auth-rehydrator";
import ProgressProvider from "./progress-provider";

export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ReduxProvider>
      <QueryProvider>
        <AuthRehydrator>
          <ProgressProvider>
            {children}
          </ProgressProvider>
        </AuthRehydrator>
      </QueryProvider>
    </ReduxProvider>
  );
}
