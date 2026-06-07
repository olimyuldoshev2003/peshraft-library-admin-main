import { useEffect, useState } from "react";
import { useAuth } from "../../context/AuthContext";
import { auth } from "../../firebase/config";
import {
  EmailAuthProvider,
  reauthenticateWithCredential,
  updatePassword,
} from "firebase/auth";
import { updateAdminProfile } from "../../firebase/services";
import TextField from "@mui/material/TextField";
import { MdOutlineClose } from "react-icons/md";
import Dialog from "@mui/material/Dialog";
import Snackbar from "@mui/material/Snackbar";
import Alert from "@mui/material/Alert";
import noImg from "../../assets/no-img.jpg";
import { useNavigate } from "react-router-dom";

const EditAdmin = () => {
  const navigate = useNavigate();

  const { currentUser, adminProfile, refreshProfile } = useAuth();

  // Profile form state
  const [fullName, setFullName] = useState("");
  const [dateOfBirth, setDateOfBirth] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [email, setEmail] = useState("");
  const [imgPreview, setImgPreview] = useState<any>(null);
  const [imgFile, setImgFile] = useState<File | null>(null);
  const [profileLoading, setProfileLoading] = useState(false);

  // Snackbar state for profile
  const [profileSnackbar, setProfileSnackbar] = useState({
    open: false,
    message: "",
    severity: "success" as "success" | "error" | "warning" | "info",
  });

  // Validation errors for profile fields
  const [profileErrors, setProfileErrors] = useState({
    fullName: "",
    dateOfBirth: "",
    phoneNumber: "",
    email: "",
  });

  // Password form state
  const [modalChangePassword, setModalChangePassword] = useState(false);
  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmNewPassword, setConfirmNewPassword] = useState("");
  const [passwordLoading, setPasswordLoading] = useState(false);

  // Snackbar state for password
  const [passwordSnackbar, setPasswordSnackbar] = useState({
    open: false,
    message: "",
    severity: "success" as "success" | "error" | "warning" | "info",
  });

  // Show snackbar helper functions
  const showProfileSnackbar = (
    message: string,
    severity: "success" | "error" | "warning" | "info",
  ) => {
    setProfileSnackbar({
      open: true,
      message,
      severity,
    });
  };

  const showPasswordSnackbar = (
    message: string,
    severity: "success" | "error" | "warning" | "info",
  ) => {
    setPasswordSnackbar({
      open: true,
      message,
      severity,
    });
  };

  const handleCloseProfileSnackbar = () => {
    setProfileSnackbar({
      ...profileSnackbar,
      open: false,
    });
  };

  const handleClosePasswordSnackbar = () => {
    setPasswordSnackbar({
      ...passwordSnackbar,
      open: false,
    });
  };

  // Validate profile field
  const validateProfileField = (name: string, value: string) => {
    let error = "";

    switch (name) {
      case "fullName":
        if (!value || !value.trim()) {
          error = "Full name is required";
        } else if (value.trim().length < 2) {
          error = "Full name must be at least 2 characters";
        } else if (value.trim().length > 100) {
          error = "Full name must be less than 100 characters";
        } else if (!/^[a-zA-Z\s\u0600-\u06FF]+$/.test(value.trim())) {
          error = "Full name can only contain letters and spaces";
        }
        break;

      case "dateOfBirth":
        if (!value) {
          error = "Date of birth is required";
        } else {
          const birthDate = new Date(value);
          const today = new Date();
          let age = today.getFullYear() - birthDate.getFullYear();
          const monthDiff = today.getMonth() - birthDate.getMonth();
          if (
            monthDiff < 0 ||
            (monthDiff === 0 && today.getDate() < birthDate.getDate())
          ) {
            age--;
          }
          if (isNaN(birthDate.getTime())) {
            error = "Invalid date format";
          } else if (age < 18) {
            error = "You must be at least 18 years old";
          } else if (age > 120) {
            error = "Please enter a valid date of birth";
          }
        }
        break;

      case "phoneNumber":
        if (!value || !value.trim()) {
          error = "Phone number is required";
        } else {
          const phoneRegex =
            /^[\+]?[(]?[0-9]{1,4}[)]?[-\s\.]?[(]?[0-9]{1,4}[)]?[-\s\.]?[0-9]{1,9}$/;
          if (!phoneRegex.test(value.trim())) {
            error = "Please enter a valid phone number";
          } else if (value.trim().length < 10) {
            error = "Phone number must be at least 10 digits";
          } else if (value.trim().length > 15) {
            error = "Phone number must be less than 15 digits";
          }
        }
        break;

      case "email":
        if (!value || !value.trim()) {
          error = "Email is required";
        } else {
          const emailRegex = /^[^\s@]+@([^\s@.,]+\.)+[^\s@.,]{2,}$/;
          if (!emailRegex.test(value.trim())) {
            error = "Please enter a valid email address";
          } else if (value.trim().length > 100) {
            error = "Email must be less than 100 characters";
          }
        }
        break;

      default:
        break;
    }

    setProfileErrors((prev) => ({ ...prev, [name]: error }));
    return error === "";
  };

  // Validate all profile fields before submit
  const validateAllProfileFields = () => {
    const validations = [
      validateProfileField("fullName", fullName),
      validateProfileField("dateOfBirth", dateOfBirth),
      validateProfileField("phoneNumber", phoneNumber),
      validateProfileField("email", email),
    ];
    return validations.every((v) => v === true);
  };

  const handleImageChange = (event: any) => {
    const file = event.target.files[0];
    if (file) {
      // Validate file type
      if (!file.type.startsWith("image/")) {
        showProfileSnackbar("Please select an image file", "error");
        return;
      }
      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        showProfileSnackbar("Image size should be less than 5MB", "error");
        return;
      }
      setImgFile(file);
      const reader = new FileReader();
      reader.onload = (e: any) => setImgPreview(e.target.result);
      reader.readAsDataURL(file);
    }
  };

  // Handle field changes with REAL-TIME validation
  const handleFullNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFullName(e.target.value);
    validateProfileField("fullName", e.target.value);
  };

  const handleDateOfBirthChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setDateOfBirth(e.target.value);
    validateProfileField("dateOfBirth", e.target.value);
  };

  const handlePhoneNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPhoneNumber(e.target.value);
    validateProfileField("phoneNumber", e.target.value);
  };

  const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setEmail(e.target.value);
    validateProfileField("email", e.target.value);
  };

  async function handleProfileSave(e: any) {
    e.preventDefault();
    if (!currentUser) return;

    // Validate all fields before submission
    if (!validateAllProfileFields()) {
      showProfileSnackbar("Please fix all validation errors", "error");
      return;
    }

    setProfileLoading(true);
    try {
      await updateAdminProfile(
        currentUser.uid,
        { fullName, dateOfBirth, phoneNumber, email },
        imgFile || undefined,
      );
      await refreshProfile();
      showProfileSnackbar("Profile updated successfully!", "success");
      setTimeout(() => {
        navigate("/dashboard/profile");
      }, 500);
      setImgFile(null);
    } catch (err) {
      console.error(err);
      showProfileSnackbar("Failed to update profile", "error");
    } finally {
      setProfileLoading(false);
    }
  }

  async function handleChangePassword() {
    if (!oldPassword || !newPassword || !confirmNewPassword) {
      showPasswordSnackbar("Please fill in all fields", "error");
      return;
    }
    if (newPassword !== confirmNewPassword) {
      showPasswordSnackbar("New passwords do not match", "error");
      return;
    }
    if (newPassword.length < 6) {
      showPasswordSnackbar("Password must be at least 6 characters", "error");
      return;
    }
    if (newPassword.length > 50) {
      showPasswordSnackbar("Password must be less than 50 characters", "error");
      return;
    }
    if (!/^(?=.*[A-Za-z])(?=.*\d)/.test(newPassword)) {
      showPasswordSnackbar(
        "Password must contain at least one letter and one number",
        "error",
      );
      return;
    }
    if (oldPassword === newPassword) {
      showPasswordSnackbar(
        "New password must be different from old password",
        "error",
      );
      return;
    }
    setPasswordLoading(true);
    try {
      const user = auth.currentUser;
      if (!user || !user.email) return;
      // Re-authenticate first
      const credential = EmailAuthProvider.credential(user.email, oldPassword);
      await reauthenticateWithCredential(user, credential);
      // Then update password
      await updatePassword(user, newPassword);
      showPasswordSnackbar("Password changed successfully!", "success");
      setOldPassword("");
      setNewPassword("");
      setConfirmNewPassword("");
      setTimeout(() => {
        setModalChangePassword(false);
      }, 2000);
    } catch (err: any) {
      if (
        err.code === "auth/wrong-password" ||
        err.code === "auth/invalid-credential"
      ) {
        showPasswordSnackbar("Old password is incorrect", "error");
      } else {
        showPasswordSnackbar("Failed to change password. Try again.", "error");
      }
    } finally {
      setPasswordLoading(false);
    }
  }

  // Load profile data on mount
  useEffect(() => {
    if (adminProfile) {
      setFullName(adminProfile.fullName || adminProfile.name || "");
      setDateOfBirth(
        adminProfile.dateOfBirth || adminProfile.date_of_birth || "",
      );
      setPhoneNumber(adminProfile.phoneNumber || adminProfile.phone || "");
      setEmail(adminProfile.email || "");
      setImgPreview(
        adminProfile.image_url || adminProfile.admin_image_url || null,
      );
    }
  }, [adminProfile]);

  return (
    <div className="edit_admin_component">
      <div className="edit_admin_component_block p-5 max-w-360 mx-auto">
        {/* Profile Section */}
        <div className="section_profile_component mt-6">
          <h1 className="text-[24px] font-600">Profile</h1>
          <form
            onSubmit={handleProfileSave}
            className="edit_profile_form shadow-[0_0_8px_#00000040] rounded-xl px-7 py-4 mt-2 flex sm:flex-col lg:flex-row lg:justify-between lg:items-end gap-10"
          >
            <div className="block_img_profile_and_input_profile_component flex sm:flex-row lg:flex-col sm:justify-center lg:justify-start gap-12">
              <div className="block_edit_img flex flex-col gap-3">
                <img
                  className="w-38 h-38 shadow-2xl object-cover rounded-full"
                  src={imgPreview || noImg}
                  alt=""
                  onError={(e: any) => {
                    e.target.src = noImg;
                  }}
                />
                <div className="label_and_input_user_profile_img flex flex-col gap-1">
                  <label
                    htmlFor="user_profile_img"
                    className="text-[15px] text-[gray] cursor-pointer"
                  >
                    Profile image
                  </label>
                  <input
                    type="file"
                    accept="image/*"
                    className="rounded-[5px] max-w-55 outline-none px-3 shadow-xl py-1 bg-white cursor-pointer"
                    id="user_profile_img"
                    onChange={handleImageChange}
                  />
                </div>
              </div>
            </div>

            <div className="labels_and_inputs_edit_profile grid sm:grid-cols-1 md:grid-cols-2 gap-5">
              <div>
                <label
                  htmlFor="fullname"
                  className="label_email text-[#9794AA] text-[16px] font-500 cursor-pointer"
                >
                  Full Name *
                </label>
                <TextField
                  id="fullname"
                  label="Enter your full name"
                  variant="outlined"
                  fullWidth
                  sx={{ marginTop: 1 }}
                  value={fullName}
                  onChange={handleFullNameChange}
                  error={!!profileErrors.fullName}
                  helperText={profileErrors.fullName}
                  required
                />
              </div>
              <div>
                <label
                  htmlFor="dateOfBirth"
                  className="label_email text-[#9794AA] text-[16px] font-500 cursor-pointer"
                >
                  Date of Birth *
                </label>
                <TextField
                  id="dateOfBirth"
                  label="Date of Birth"
                  variant="outlined"
                  fullWidth
                  sx={{ marginTop: 1 }}
                  type="date"
                  InputLabelProps={{ shrink: true }}
                  value={dateOfBirth}
                  onChange={handleDateOfBirthChange}
                  error={!!profileErrors.dateOfBirth}
                  helperText={profileErrors.dateOfBirth}
                  required
                />
              </div>
              <div>
                <label
                  htmlFor="phoneNumber"
                  className="label_phone_number text-[#9794AA] text-[16px] font-500 cursor-pointer"
                >
                  Phone Number *
                </label>
                <TextField
                  id="phoneNumber"
                  label="Enter your phone number"
                  variant="outlined"
                  fullWidth
                  sx={{ marginTop: 1 }}
                  type="tel"
                  value={phoneNumber}
                  onChange={handlePhoneNumberChange}
                  error={!!profileErrors.phoneNumber}
                  helperText={profileErrors.phoneNumber}
                  required
                />
              </div>
              <div>
                <label
                  htmlFor="email"
                  className="label_email text-[#9794AA] text-[16px] font-500 cursor-pointer"
                >
                  Email *
                </label>
                <TextField
                  id="email"
                  label="Enter your email"
                  variant="outlined"
                  fullWidth
                  sx={{ marginTop: 1 }}
                  type="email"
                  value={email}
                  onChange={handleEmailChange}
                  error={!!profileErrors.email}
                  helperText={profileErrors.email}
                  required
                />
              </div>
            </div>

            <div className="block_btn_submit flex flex-col gap-2">
              <button
                type="submit"
                disabled={profileLoading}
                className="btn_submit bg-[#20ACFF] px-5 py-2 rounded-[15px] cursor-pointer text-[#FFFFFF] text-[19px] font-500 sm:w-full disabled:opacity-50"
              >
                {profileLoading ? "Saving..." : "Edit"}
              </button>
            </div>
          </form>

          {/* Change Password */}
          <div className="block_link_change_password mt-3">
            <h1 className="text-[24px] font-600">Edit Password</h1>
            <button
              onClick={() => setModalChangePassword(true)}
              className="text-[blue] hover:underline cursor-pointer bg-transparent border-none text-[16px]"
            >
              Change password
            </button>
          </div>
          {/* Modal: Change Password */}
          <Dialog
            open={modalChangePassword}
            onClose={() => setModalChangePassword(false)}
            fullWidth
          >
            <div className="px-4 py-4">
              <div className="flex items-center gap-6 justify-between mb-4">
                <h1 className="text-[22px] font-600">Change Password</h1>
                <button
                  className="outline-none cursor-pointer p-2 bg-[#D9D9D9] rounded-full"
                  onClick={() => setModalChangePassword(false)}
                >
                  <MdOutlineClose size={27} />
                </button>
              </div>
              <div className="flex flex-col gap-4">
                <TextField
                  label="Old Password"
                  type="password"
                  fullWidth
                  value={oldPassword}
                  onChange={(e) => setOldPassword(e.target.value)}
                  required
                />
                <TextField
                  label="New Password"
                  type="password"
                  fullWidth
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  required
                  helperText="Password must be at least 6 characters with at least one letter and one number"
                />
                <TextField
                  label="Confirm New Password"
                  type="password"
                  fullWidth
                  value={confirmNewPassword}
                  onChange={(e) => setConfirmNewPassword(e.target.value)}
                  required
                />
                <button
                  onClick={handleChangePassword}
                  disabled={passwordLoading}
                  className="bg-[#20ACFF] p-2.5 rounded-[10px] text-white text-[18px] font-500 cursor-pointer w-full disabled:opacity-50"
                >
                  {passwordLoading ? "Changing..." : "Change Password"}
                </button>
              </div>
            </div>
          </Dialog>
        </div>
      </div>

      {/* Snackbar for Profile Updates */}
      <Snackbar
        open={profileSnackbar.open}
        autoHideDuration={6000}
        onClose={handleCloseProfileSnackbar}
        anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
      >
        <Alert
          onClose={handleCloseProfileSnackbar}
          severity={profileSnackbar.severity}
          variant="filled"
          sx={{ width: "100%" }}
        >
          {profileSnackbar.message}
        </Alert>
      </Snackbar>

      {/* Snackbar for Password Changes */}
      <Snackbar
        open={passwordSnackbar.open}
        autoHideDuration={6000}
        onClose={handleClosePasswordSnackbar}
        anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
      >
        <Alert
          onClose={handleClosePasswordSnackbar}
          severity={passwordSnackbar.severity}
          variant="filled"
          sx={{ width: "100%" }}
        >
          {passwordSnackbar.message}
        </Alert>
      </Snackbar>
    </div>
  );
};

export default EditAdmin;
