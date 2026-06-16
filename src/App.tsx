import { createBrowserRouter, RouterProvider } from "react-router-dom";
import Layout from "./layout/Layout";
import Dashboard from "./pages/dashboard/Dashboard";
import Books from "./pages/books/Books";
import Members from "./pages/members/Members";
import Notifications from "./pages/notifications/Notifications";
import Profile from "./pages/profile/Profile";
import SignIn from "./pages/signIn/SignIn";
import AddBook from "./pages/addBook/AddBook";
import NotFound from "./pages/notFound/NotFound";
import Member from "./pages/member/Member";
import EditBook from "./pages/editBook/EditBook";
import ReceivedMembers from "./pages/receivedMembers/ReceivedMembers";
import ReceiveBookRequests from "./pages/receiveBookRequests/ReceiveBookRequests";
import ReturnBookRequests from "./pages/returnBookRequests/ReturnBookRequests";
import SignUp from "./pages/signUp/SignUp";
import AuthCheck from "./utils/AuthCheck";
import ForgotPassword from "./pages/forgotPassword/ForgotPassword";
import ProtectedRoute from "./utils/ProtectedRoute";
import EditAdmin from "./pages/editAdmin/EditAdmin";
import DeleteAdmins from "./pages/deleteAdmins/DeleteAdmins";

function App() {
  const router = createBrowserRouter([
    {
      path: "/",
      element: (
        <AuthCheck>
          <SignIn />
        </AuthCheck>
      ),
    },
    {
      path: "/sign-up",
      element: (
        <AuthCheck>
          <SignUp />
        </AuthCheck>
      ),
    },
    {
      path: "/forgot-password",
      element: (
        <AuthCheck>
          <ForgotPassword />
        </AuthCheck>
      ),
    },
    {
      path: "/dashboard",
      element: (
        <ProtectedRoute>
          <Layout />
        </ProtectedRoute>
      ),
      children: [
        // main pages
        {
          index: true,
          element: (
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          ),
        },
        {
          path: "books",
          element: (
            <ProtectedRoute>
              <Books />
            </ProtectedRoute>
          ),
        },
        {
          path: "members",
          element: (
            <ProtectedRoute>
              <Members />
            </ProtectedRoute>
          ),
        },
        {
          path: "received-members",
          element: (
            <ProtectedRoute>
              <ReceivedMembers />
            </ProtectedRoute>
          ),
        },
        {
          path: "notifications",
          element: (
            <ProtectedRoute>
              <Notifications />
            </ProtectedRoute>
          ),
        },
        {
          path: "profile",
          element: (
            <ProtectedRoute>
              <Profile />
            </ProtectedRoute>
          ),
        },

        // pages for functionalities
        {
          path: "add-book",
          element: (
            <ProtectedRoute>
              <AddBook />
            </ProtectedRoute>
          ),
        },
        {
          path: "edit-book",
          element: (
            <ProtectedRoute>
              <EditBook />
            </ProtectedRoute>
          ),
        },
        {
          path: "member",
          element: (
            <ProtectedRoute>
              <Member />
            </ProtectedRoute>
          ),
        },
        {
          path: "receive-book-requests",
          element: (
            <ProtectedRoute>
              <ReceiveBookRequests />
            </ProtectedRoute>
          ),
        },
        {
          path: "return-book-requests",
          element: (
            <ProtectedRoute>
              <ReturnBookRequests />
            </ProtectedRoute>
          ),
        },
        {
          path: "edit-admin",
          element: (
            <ProtectedRoute>
              <EditAdmin />
            </ProtectedRoute>
          ),
        },
        {
          path: "delete-admins",
          element: (
            <ProtectedRoute>
              <DeleteAdmins />
            </ProtectedRoute>
          ),
        },
      ],
    },
    {
      path: "*",
      element: <NotFound />,
    },
  ]);

  return (
    <>
      <RouterProvider router={router} />
    </>
  );
}

export default App;