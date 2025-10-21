import { createBrowserRouter } from "react-router-dom";
import App from "./App";
import AuthGuard from "../modules/auth/components/AuthGuard";
import Login from "../modules/auth/pages/Login";
import Dashboard from "../modules/dashboard/pages/Dashboard";
import RecordsList from "../modules/records/pages/RecordsList";
import RecordDetail from "../modules/records/pages/RecordDetail";
import Users from "../modules/users/pages/Users";

export const router = createBrowserRouter([
  { path: "/login", element: <Login /> },
  {
    path: "/",
    element: <App />,
    children: [
      {
        element: <AuthGuard />,
        children: [
          { path: "/", element: <Dashboard /> },
          { path: "/dashboard", element: <Dashboard /> },
          { path: "/registros", element: <RecordsList /> },
          { path: "/registros/:id", element: <RecordDetail /> },
          { path: "/usuarios", element: <Users /> },
        ],
      },
    ],
  },
]);
