import TextField from "@mui/material/TextField";
import { useState } from "react";
import Visibility from "@mui/icons-material/Visibility";
import VisibilityOff from "@mui/icons-material/VisibilityOff";
import { Swiper, SwiperSlide } from "swiper/react";
import slideImg1 from "../../assets/signIn/slide-img-1.svg";
import slideImg2 from "../../assets/signIn/slide-img-2.svg";
import slideImg3 from "../../assets/signIn/slide-img-3.svg";
import logoSignIn from "../../assets/signIn/logo-pehraft-sign-in.svg";
// @ts-ignore
import "swiper/css";
// @ts-ignore
import "swiper/css/pagination";
// @ts-ignore
import "swiper/css/navigation";
import "./SignUp.css";
import { Autoplay, Pagination, Navigation } from "swiper/modules";
import FormControl from "@mui/material/FormControl";
import InputLabel from "@mui/material/InputLabel";
import OutlinedInput from "@mui/material/OutlinedInput";
import InputAdornment from "@mui/material/InputAdornment";
import IconButton from "@mui/material/IconButton";
import { Link, useNavigate } from "react-router-dom";

// 🔥 Firebase
import { firebaseSignUp } from "../../firebase/services";

const SignUp = () => {
  const navigate = useNavigate();
  const [isShowPassword, setIsShowPassword] = useState(false);
  const [isShowConfirmPassword, setIsShowConfirmPassword] = useState(false);
  const [fullName, setFullName] = useState("");
  const [dateOfBirth, setDateOfBirth] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [errors, setErrors] = useState<any>({});
  const [isLoading, setIsLoading] = useState(false);

  const slidesData = [
    {
      id: 1,
      image: slideImg1,
      title: "Welcome",
      description: "You enter the verified login and become an administrator.",
    },
    {
      id: 2,
      image: slideImg2,
      title: "Dear Admin!",
      description: "All features are in your hands.",
    },
    {
      id: 3,
      image: slideImg3,
      title: "Dear Admin!",
      description: "All features are in your hands.",
    },
  ];

  function validate() {
    const newErrors: any = {};
    if (!fullName.trim()) newErrors.fullName = "Full name is required";
    else if (fullName.trim().split(/\s+/).length < 2)
      newErrors.fullName = "Enter first and last name";
    if (!dateOfBirth) newErrors.dateOfBirth = "Date of birth is required";
    if (!phoneNumber.trim()) newErrors.phoneNumber = "Phone number is required";
    if (!email.trim()) newErrors.email = "Email is required";
    else if (!/^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i.test(email))
      newErrors.email = "Invalid email";
    if (!password) newErrors.password = "Password is required";
    else if (password.length < 8) newErrors.password = "At least 8 characters";
    if (confirmPassword !== password)
      newErrors.confirmPassword = "Passwords do not match";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!validate()) return;
    try {
      setIsLoading(true);
      // 🔥 Create account in Firebase
      await firebaseSignUp(
        email.trim(),
        password,
        fullName.trim(),
        phoneNumber.trim(),
        dateOfBirth,
      );
      alert("Account created! Wait for admin approval.");
      navigate("/");
    } catch (error: any) {
      if (error.code === "auth/email-already-in-use") {
        setErrors((p: any) => ({ ...p, email: "Email already in use" }));
      } else if (error.code === "auth/weak-password") {
        setErrors((p: any) => ({ ...p, password: "Password is too weak" }));
      } else {
        alert("Something went wrong: " + error.message);
      }
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <>
      <div className="sign_up_component flex">
        <div className="sign_up_block_1 h-screen flex md:justify-center w-full sm:flex-col md:flex-row mt-3 mb-11">
          <form onSubmit={handleSubmit} className="form_sign_up px-4 pb-9">
            <div className="block_logo_and_title_sign_up_component flex flex-col justify-center items-center">
              <div className="logo_block sm:flex md:hidden items-center gap-1">
                <img src={logoSignIn} alt="Logo" className="w-23 h-23" />
                <h1 className="text-[#7EC7EC] text-[30px] font-400">
                  Peshraft Library
                </h1>
              </div>
              <h1 className="title_sign_up_block_2 text-center text-[#100F14] text-[32px] font-600">
                Sign Up
              </h1>
            </div>
            <div className="labels_and_inputs_sign_up mt-2 flex flex-col gap-5">
              <div>
                <label className="text-[#9794AA] text-[16px] font-500">
                  Full Name
                </label>
                <TextField
                  label="First and last name"
                  variant="outlined"
                  fullWidth
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  error={Boolean(errors.fullName)}
                  helperText={errors.fullName}
                  sx={{ marginTop: 1 }}
                />
              </div>
              <div>
                <label className="text-[#9794AA] text-[16px] font-500">
                  Date of Birth
                </label>
                <TextField
                  label="Date of birth"
                  variant="outlined"
                  fullWidth
                  type="date"
                  value={dateOfBirth}
                  onChange={(e) => setDateOfBirth(e.target.value)}
                  error={Boolean(errors.dateOfBirth)}
                  helperText={errors.dateOfBirth}
                  sx={{ marginTop: 1 }}
                  InputLabelProps={{ shrink: true }}
                />
              </div>
              <div>
                <label className="text-[#9794AA] text-[16px] font-500">
                  Phone Number
                </label>
                <TextField
                  label="Phone number"
                  variant="outlined"
                  fullWidth
                  type="tel"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  error={Boolean(errors.phoneNumber)}
                  helperText={errors.phoneNumber}
                  sx={{ marginTop: 1 }}
                />
              </div>
              <div>
                <label className="text-[#9794AA] text-[16px] font-500">
                  Email
                </label>
                <TextField
                  label="Enter your email"
                  variant="outlined"
                  fullWidth
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  error={Boolean(errors.email)}
                  helperText={errors.email}
                  sx={{ marginTop: 1 }}
                />
              </div>
              <div>
                <label className="text-[#9794AA] text-[16px] font-500">
                  Password
                </label>
                <FormControl
                  sx={{ width: "100%", marginTop: 1 }}
                  variant="outlined"
                  error={Boolean(errors.password)}
                >
                  <InputLabel>Password</InputLabel>
                  <OutlinedInput
                    type={isShowPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    endAdornment={
                      <InputAdornment position="end">
                        <IconButton
                          onClick={() => setIsShowPassword(!isShowPassword)}
                          edge="end"
                        >
                          {isShowPassword ? <VisibilityOff /> : <Visibility />}
                        </IconButton>
                      </InputAdornment>
                    }
                    label="Password"
                  />
                  {errors.password && (
                    <div
                      style={{
                        color: "#d32f2f",
                        fontSize: "0.75rem",
                        marginTop: "3px",
                        marginLeft: "14px",
                      }}
                    >
                      {errors.password}
                    </div>
                  )}
                </FormControl>
              </div>
              <div>
                <label className="text-[#9794AA] text-[16px] font-500">
                  Confirm Password
                </label>
                <FormControl
                  sx={{ width: "100%", marginTop: 1 }}
                  variant="outlined"
                  error={Boolean(errors.confirmPassword)}
                >
                  <InputLabel>Confirm Password</InputLabel>
                  <OutlinedInput
                    type={isShowConfirmPassword ? "text" : "password"}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    endAdornment={
                      <InputAdornment position="end">
                        <IconButton
                          onClick={() =>
                            setIsShowConfirmPassword(!isShowConfirmPassword)
                          }
                          edge="end"
                        >
                          {isShowConfirmPassword ? (
                            <VisibilityOff />
                          ) : (
                            <Visibility />
                          )}
                        </IconButton>
                      </InputAdornment>
                    }
                    label="Confirm Password"
                  />
                  {errors.confirmPassword && (
                    <div
                      style={{
                        color: "#d32f2f",
                        fontSize: "0.75rem",
                        marginTop: "3px",
                        marginLeft: "14px",
                      }}
                    >
                      {errors.confirmPassword}
                    </div>
                  )}
                </FormControl>
              </div>
            </div>
            <button
              type="submit"
              disabled={isLoading}
              className={`bg-[#7A5AF8] w-full mt-6 py-2 rounded-lg cursor-pointer text-white text-[20px] font-500 hover:bg-[#7A5AF8]/90 transition-colors duration-300 ${isLoading ? "opacity-50 cursor-not-allowed" : ""}`}
            >
              {isLoading ? "Creating Account..." : "Sign Up"}
            </button>
            <p className="text-center text-[#8E8E8E] text-[18px] font-400 mt-4">
              Already have an account?{" "}
              <Link to={"/"} className="text-[#3A65FF] hover:underline">
                Sign in
              </Link>
            </p>
          </form>
        </div>
        <div className="sign_up_block_2 w-1/2 h-screen sm:hidden md:block sticky top-0">
          <Swiper
            autoplay={{ delay: 2500, disableOnInteraction: false }}
            pagination={{ clickable: true }}
            modules={[Autoplay, Pagination, Navigation]}
            className="mySwiper"
          >
            {slidesData.map((slide) => (
              <SwiperSlide key={slide.id}>
                <div className="slide_block slides_block">
                  <img src={slide.image} className="img_slides" alt="" />
                  <div className="logo_block absolute top-0 left-0 flex items-center gap-1">
                    <img
                      src={logoSignIn}
                      alt="Logo"
                      className="md:w-12 md:h-12 lg:w-14 lg:h-14"
                    />
                    <h1 className="text-[#7EC7EC] md:text-[20px] lg:text-[25px] font-400">
                      Peshraft Library
                    </h1>
                  </div>
                  <div className="text_block absolute bottom-10 left-10 right-10 px-6 py-2 bg-white rounded-xl shadow-2xl">
                    <h1 className="title_admin md:text-[23px] lg:text-[27px] font-600">
                      {slide.title}
                    </h1>
                    <p className="description_admin md:text-[14px] lg:text-[17px] font-400">
                      {slide.description}
                    </p>
                  </div>
                </div>
              </SwiperSlide>
            ))}
          </Swiper>
        </div>
      </div>
    </>
  );
};

export default SignUp;
