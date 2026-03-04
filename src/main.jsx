import React from "react";
import ReactDOM from "react-dom/client";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter } from "react-router-dom";
import { SpeedInsights } from "@vercel/speed-insights/react";
import { AuthProvider } from "./contexts/AuthContext";
import { Toaster } from "./components/ui/toaster";
import App from "./App";
import "./index.css";

if (import.meta.env.DEV) {
  import("./debug/supabaseLogger").then(
    ({ debugSignUrl, debugEdgeFunction }) => {
      debugSignUrl(
        "cafe_photos",
        "cafe_photos/cafe/1768812174584_20150624174352_5642021286.jpg"
      );
     

      // debugEdgeFunction("sign-storage", { test: true });
    }
  );
}

const queryClient = new QueryClient();

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <BrowserRouter
      future={{ v7_startTransition: true, v7_relativeSplatPath: true }}
    >
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <App />
          <SpeedInsights />
          <Toaster />
        </AuthProvider>
      </QueryClientProvider>
    </BrowserRouter>
  </React.StrictMode>
);
