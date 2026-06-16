import { useState } from "react";
import { Link, Outlet, useLocation } from "react-router-dom";

import "./Layout.css";

// Images
import logo from "../assets/Logo.svg";

import { GoHome } from "react-icons/go";
import { PiBookOpen, PiKeyReturnFill, PiUsersThree } from "react-icons/pi";
import { GrNotification } from "react-icons/gr";
import { CgProfile } from "react-icons/cg";
import { FaPhoneAlt } from "react-icons/fa";
import { MdDeleteForever, MdOutlineEmail } from "react-icons/md";

import SecurityUpdateGoodOutlinedIcon from "@mui/icons-material/SecurityUpdateGoodOutlined";
import { IoMenu } from "react-icons/io5";

import CallReceivedIcon from "@mui/icons-material/CallReceived";

const Layout = () => {
  const location = useLocation();
  const [menuMobileSize, setMenuMobileSize] = useState<boolean>(false);

  function removeScrollbar() {
    document.body.classList.add("scroll_hidden");
    document.body.classList.remove("scroll_visible");
  }

  function showScrollbar() {
    document.body.classList.add("scroll_visible");
    document.body.classList.remove("scroll_hidden");
  }

  const navigationItems = [
    {
      id: 1,
      path: "/dashboard",
      icon: GoHome,
      label: "Dashboard",
      exact: true,
    },
    {
      id: 2,
      path: "/dashboard/books",
      icon: PiBookOpen,
      label: "Books",
      exact: false,
    },
    {
      id: 3,
      path: "/dashboard/members",
      icon: PiUsersThree,
      label: "Members",
      exact: false,
    },
    {
      id: 4,
      path: "/dashboard/received-members",
      icon: SecurityUpdateGoodOutlinedIcon,
      label: "Received Members",
      exact: false,
    },
    {
      id: 5,
      path: "/dashboard/receive-book-requests",
      icon: CallReceivedIcon,
      label: "Receive Book Requests",
      exact: false,
    },
    {
      id: 6,
      path: "/dashboard/return-book-requests",
      icon: PiKeyReturnFill,
      label: "Return Book Requests",
      exact: false,
    },
    {
      id: 7,
      path: "/dashboard/notifications",
      icon: GrNotification,
      label: "Notification",
      exact: false,
    },
    {
      id: 8,
      path: "/dashboard/profile",
      icon: CgProfile,
      label: "Profile",
      exact: false,
    },
    {
      id: 9,
      path: "/dashboard/delete-admins",
      icon: MdDeleteForever,
      label: "Delete Admins",
      exact: false,
    },
  ];

  const isActivePath = (path: string, exact: boolean = false) => {
    if (exact) return location.pathname === path;
    return location.pathname === path;
  };

  const renderNavLinks = (isMobile: boolean = false) => {
    const handleClick = () => {
      if (isMobile) {
        setMenuMobileSize(false);
        showScrollbar();
      }
    };

    return navigationItems.map((item: any) => (
      <Link
        key={item.id}
        className={`navigations px-3 py-1.5 hover:border-b-3 border-[#D9D9D9] outline-none ${
          isActivePath(item.path, item.exact) && "border-b-3"
        } transition-all duration-200`}
        onClick={handleClick}
        to={item.path}
      >
        <li className="navigations_list_item flex items-center gap-2.5">
          <item.icon className="text-white text-[22px]" />
          <span className="navigations_name text-white text-[20px] font-500 outline-none">
            {item.label}
          </span>
        </li>
      </Link>
    ));
  };

  return (
    <>
      <div className="layout_component flex sm:flex-col md:flex-row relative min-h-screen">
        {/* Desktop Header */}
        <header className="header bg-[#2262C6] hidden md:flex flex-col justify-between h-screen py-5 sticky top-0 max-w-70 overflow-auto gap-10">
          <div className="logo_and_nav_block">
            <div className="logo_block flex items-center">
              <img className="w-14 h-14" src={logo} alt="" />
              <Link
                to={"/dashboard"}
                className="text-[#FFFFFF] text-[24px] font-400 outline-none"
              >
                Peshraft Library
              </Link>
            </div>
            <nav className="nav mt-5">
              <ul className="nav_list flex flex-col gap-2">
                {renderNavLinks(false)}
              </ul>
            </nav>
          </div>
          <div className="contact_block">
            <h1 className="contact_title text-white text-[22px] font-500 pl-3 border-b-3 border-white">
              Contact us
            </h1>
            <div className="contact_info_block p-5 flex flex-col gap-2">
              <div className="number_phone_block flex items-center gap-3">
                <FaPhoneAlt size={19} className="text-white" />
                <Link
                  className="outline-none text-white text-[15px] font-500"
                  to={"tel:+992446101144"}
                >
                  (+992) 44 610 1144
                </Link>
              </div>
              <div className="email_block flex items-center gap-3">
                <MdOutlineEmail size={22} className="text-white" />
                <Link
                  className="outline-none text-white text-[15px] font-500"
                  to={"mailto:peshraftlibrary@gmail.com"}
                >
                  peshraftlibrary@gmail.com
                </Link>
              </div>
            </div>
          </div>
        </header>

        {/* Mobile top bar */}
        <div
          className={`block_mobile_size_btn_and_name_of_admin_side md:hidden p-1 flex justify-between items-center gap-5 bg-[#2262C6] sticky top-0 z-10`}
        >
          <div className="logo_block flex items-center">
            <img className="w-14 h-14" src={logo} alt="" />
            <Link
              to={"/dashboard"}
              className="text-[#FFFFFF] text-[20px] font-400 outline-none"
            >
              Peshraft Library
            </Link>
          </div>
          <button
            className="text-white p-2 transition-colors outline-none hover:cursor-pointer"
            onClick={() => {
              setMenuMobileSize(true);
              removeScrollbar();
            }}
            aria-label="Open menu"
          >
            <IoMenu size={44} />
          </button>
        </div>

        {/* Overlay */}
        <div
          className={`md:hidden fixed inset-0 opacity-50 z-45 transition-all ${
            menuMobileSize
              ? "pointer-events-auto bg-black"
              : "pointer-events-none bg-none"
          }`}
          onClick={() => {
            setMenuMobileSize(false);
            showScrollbar();
          }}
        />

        {/* Mobile Header */}
        <header
          className={`fixed md:hidden bg-[#2262C6] flex flex-col justify-between h-screen py-5 top-0 left-0 z-50 max-w-70 transform transition-transform duration-300 ease-in-out overflow-auto gap-10 pb-22
            ${menuMobileSize ? "translate-x-0" : "-translate-x-full"}
          `}
        >
          <div className="logo_and_nav_block">
            <div className="logo_block flex items-center">
              <img className="w-14 h-14" src={logo} alt="" />
              <Link
                onClick={() => {
                  setMenuMobileSize(false);
                  showScrollbar();
                }}
                to={"/dashboard"}
                className="text-[#FFFFFF] text-[24px] font-400 outline-none"
              >
                Peshraft Library
              </Link>
            </div>
            <nav className="nav mt-5">
              <ul className="nav_list flex flex-col gap-2">
                {renderNavLinks(true)}
              </ul>
            </nav>
          </div>
          <div className="contact_block">
            <h1 className="contact_title text-white text-[22px] font-500 pl-3 border-b-3 border-white">
              Contact us
            </h1>
            <div className="contact_info_block p-5 flex flex-col gap-2">
              <div className="number_phone_block flex items-center gap-3">
                <FaPhoneAlt size={19} className="text-white" />
                <Link
                  className="outline-none text-white text-[15px] font-500"
                  to={"tel:+992446101144"}
                >
                  (+992) 44 610 1144
                </Link>
              </div>
              <div className="email_block flex items-center gap-3">
                <MdOutlineEmail size={22} className="text-white" />
                <Link
                  className="outline-none text-white text-[15px] font-500"
                  to={"mailto:peshraftlibrary@gmail.com"}
                >
                  peshraftlibrary@gmail.com
                </Link>
              </div>
            </div>
          </div>
        </header>

        <main className="flex-1 bg-gray-50 min-w-0 overflow-x-auto">
          <Outlet />
        </main>
      </div>
    </>
  );
};

export default Layout;
