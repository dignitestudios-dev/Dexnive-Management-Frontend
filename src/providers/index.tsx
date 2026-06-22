import ReduxProvider from "./redux-provider";
import QueryProvider from "./query-provider";
import AuthRehydrator from "./auth-rehydrator";
import SocketProvider from "./socket-provider";
import ProgressProvider from "./progress-provider";

export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ReduxProvider>
      <QueryProvider>
        <AuthRehydrator>
          <SocketProvider>
            <ProgressProvider>
              {children}
            </ProgressProvider>
          </SocketProvider>
        </AuthRehydrator>
      </QueryProvider>
    </ReduxProvider>
  );
}
