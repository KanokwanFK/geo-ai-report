import { createBrowserRouter } from "react-router";
import LayoutApp from "./components/Layout";
import Landing from "./components/Landing";
import Login from "./components/Loing";
import Register from "./components/Register";
import Map from "./components/Map";
import Report from "./components/Report";
import Dashboard from "./components/Dashboard";
import Table from "./components/Tabel";
import Problem from "./components/Problem";
import Admin from "./components/Admin";
import Password from "./components/Password";
import ReportForm from "./components/ReportForm";
import { AdminRoute, ProtectedRoute } from "./components/ProtectedRoute";


const Router = createBrowserRouter([
    {
        path: "/",
        element: <LayoutApp />,
        children: [
            {
                index: true,
                element: <Landing />
            },
            {
                path: "/Login",
                element: <Login />,
            },
            {
                path: "/Register",
                element: <Register />,
            },
            {
                path: "/Map",
                element: <ProtectedRoute><Map /></ProtectedRoute>,
            },
            {
                path: "/Report",
                element: <ProtectedRoute><Report /></ProtectedRoute>,
            },
            {
                path: "/report-form/:reportId?",
                element: <AdminRoute><ReportForm /></AdminRoute>,
            },
            {
                path: "/Dashboard",
                element: <Dashboard />,
            },
            {
                path: "/Table",
                element: <AdminRoute><Table /></AdminRoute>,
            },
            {
                path: "/Problem",
                element: <AdminRoute><Problem /></AdminRoute>,
            },
            {
                path: "/Admin",
                element: <AdminRoute><Admin /></AdminRoute>,
            },
            {
                path: "/Password",
                element: <Password />,
            },
        ],
    },
]);

export default Router;