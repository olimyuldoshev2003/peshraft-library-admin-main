import { useState } from "react";
import { Link } from "react-router-dom";
import TextField from "@mui/material/TextField";
import { sendPasswordResetEmail } from "firebase/auth";
import { auth } from "../../firebase/config";
import logoSignIn from "../../assets/signIn/logo-pehraft-sign-in.svg";

const ForgotPassword = () => {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email.trim()) {
      setError("Please enter your email");
      return;
    }
    setLoading(true);
    setError("");
    try {
      await sendPasswordResetEmail(auth, email.trim());
      setSuccess(true);
    } catch (err: any) {
      if (err.code === "auth/user-not-found") {
        setError("No account found with this email");
      } else if (err.code === "auth/invalid-email") {
        setError("Invalid email address");
      } else {
        setError("Something went wrong. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-lg p-8 flex flex-col gap-6">
        {/* Logo */}
        <div className="flex items-center justify-center gap-2">
          <img src={logoSignIn} alt="Logo" className="w-12 h-12" />
          <h1 className="text-[#7EC7EC] text-[24px] font-400">
            Peshraft Library
          </h1>
        </div>

        <div className="flex flex-col gap-2">
          <h1 className="text-[28px] font-600 text-center text-[#100F14]">
            Forgot Password
          </h1>
          <p className="text-center text-[#9794AA] text-[15px]">
            Enter your email address and we'll send you a link to reset your
            password.
          </p>
        </div>

        {success ? (
          <div className="flex flex-col gap-4 items-center">
            <div className="bg-green-50 border border-green-200 rounded-xl p-4 text-center">
              <p className="text-green-700 text-[16px] font-500">
                ✅ Reset email sent!
              </p>
              <p className="text-green-600 text-[14px] mt-1">
                Check your inbox at <strong>{email}</strong> and follow the
                instructions.
              </p>
            </div>
            <Link to="/" className="text-[#3A65FF] hover:underline text-[16px]">
              Back to Sign In
            </Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div>
              <label
                htmlFor="email"
                className="text-[#9794AA] text-[16px] font-500 cursor-pointer"
              >
                Email
              </label>
              <TextField
                id="email"
                label="Enter your email"
                variant="outlined"
                fullWidth
                sx={{ marginTop: 1 }}
                type="email"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  setError("");
                }}
                error={Boolean(error)}
                helperText={error}
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className={`w-full mt-2 py-2 rounded-lg text-white text-[20px] font-500 transition-colors duration-300 cursor-pointer ${loading ? "bg-gray-400 cursor-not-allowed" : "bg-[#7A5AF8] hover:bg-[#7A5AF8]/90"}`}
            >
              {loading ? "Sending..." : "Send Reset Link"}
            </button>

            <p className="text-center text-[#8E8E8E] text-[16px]">
              Remember your password?{" "}
              <Link to="/" className="text-[#3A65FF] hover:underline">
                Sign In
              </Link>
            </p>
          </form>
        )}
      </div>
    </div>
  );
};

export default ForgotPassword;
