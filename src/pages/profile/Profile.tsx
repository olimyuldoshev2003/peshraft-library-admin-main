import FormControl from "@mui/material/FormControl";
import InputLabel from "@mui/material/InputLabel";
import MenuItem from "@mui/material/MenuItem";
import Select from "@mui/material/Select";
import TextField from "@mui/material/TextField";
import { alpha } from "@mui/material/styles";
import Box from "@mui/material/Box";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableContainer from "@mui/material/TableContainer";
import TableHead from "@mui/material/TableHead";
import TablePagination from "@mui/material/TablePagination";
import TableRow from "@mui/material/TableRow";
import TableSortLabel from "@mui/material/TableSortLabel";
import Toolbar from "@mui/material/Toolbar";
import Typography from "@mui/material/Typography";
import Paper from "@mui/material/Paper";
import { visuallyHidden } from "@mui/utils";
import Dialog from "@mui/material/Dialog";
import { MdOutlineClose } from "react-icons/md";
import DialogTitle from "@mui/material/DialogTitle";
import CircularProgress from "@mui/material/CircularProgress";
import noImg from "../../assets/no-img.jpg";
import { useMemo, useState, useEffect } from "react";
import { useAuth } from "../../context/AuthContext";
import {
  updatePassword,
  EmailAuthProvider,
  reauthenticateWithCredential,
} from "firebase/auth";
import { auth } from "../../firebase/config";
import {
  getPendingAdmins,
  approveAdmin,
  firebaseSignOut,
} from "../../firebase/services";
import { useNavigate } from "react-router-dom";

type Order = "asc" | "desc";

const Profile = () => {
  const navigate = useNavigate();

  const { adminProfile } = useAuth();

  // Password form state
  const [modalChangePassword, setModalChangePassword] = useState(false);
  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmNewPassword, setConfirmNewPassword] = useState("");
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [passwordError, setPasswordError] = useState("");
  const [passwordSuccess, setPasswordSuccess] = useState("");

  // Admins table state
  const [order, setOrder] = useState<Order>("asc");
  const [orderBy, setOrderBy] = useState<any>("fullName");
  const [selected, setSelected] = useState<readonly number[]>([]);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState<number>(17);

  const [modalAccept, setModalAccept] = useState<boolean>(false);
  const [modalLogout, setModalLogout] = useState<boolean>(false);
  const [logoutLoading, setLogoutLoading] = useState<boolean>(false);

  const [pendingAdmins, setPendingAdmins] = useState<any[]>([]);
  const [selectedAdminId, setSelectedAdminId] = useState<string>("");
  const [adminsLoading, setAdminsLoading] = useState(false);
  const [profileLoading, setProfileLoading] = useState(true);
  const [userNotFound, setUserNotFound] = useState(false);

  // Format date to DD.MM.YYYY
  const formatDate = (dateString: string) => {
    if (!dateString) return "-";
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return dateString;
      const day = String(date.getDate()).padStart(2, "0");
      const month = String(date.getMonth() + 1).padStart(2, "0");
      const year = date.getFullYear();
      return `${day}.${month}.${year}`;
    } catch {
      return dateString;
    }
  };

  // Load profile data
  useEffect(() => {
    setProfileLoading(true);
    setUserNotFound(false);

    if (adminProfile) {
      const timer = setTimeout(() => {
        setProfileLoading(false);
        setUserNotFound(false);
      }, 500);
      return () => clearTimeout(timer);
    } else {
      const timer = setTimeout(() => {
        if (!adminProfile) {
          setProfileLoading(false);
          setUserNotFound(true);
        }
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [adminProfile]);

  // Load pending admins when component mounts
  useEffect(() => {
    loadPendingAdmins();
  }, []);

  async function loadPendingAdmins() {
    setAdminsLoading(true);
    try {
      const data = await getPendingAdmins();
      console.log(data);
      setPendingAdmins(data);
    } catch (err) {
      console.error(err);
    } finally {
      setAdminsLoading(false);
    }
  }

  async function handleChangePassword() {
    setPasswordError("");
    setPasswordSuccess("");
    if (!newPassword || !confirmNewPassword || !oldPassword) {
      setPasswordError("Please fill in all fields");
      return;
    }
    if (newPassword !== confirmNewPassword) {
      setPasswordError("New passwords do not match");
      return;
    }
    if (newPassword.length < 6) {
      setPasswordError("Password must be at least 6 characters");
      return;
    }
    setPasswordLoading(true);
    try {
      const user = auth.currentUser;
      if (!user || !user.email) return;
      const credential = EmailAuthProvider.credential(user.email, oldPassword);
      await reauthenticateWithCredential(user, credential);
      await updatePassword(user, newPassword);
      setPasswordSuccess("Password changed successfully!");
      setOldPassword("");
      setNewPassword("");
      setConfirmNewPassword("");
      setTimeout(() => {
        setPasswordSuccess("");
        setModalChangePassword(false);
      }, 2000);
    } catch (err: any) {
      if (
        err.code === "auth/wrong-password" ||
        err.code === "auth/invalid-credential"
      ) {
        setPasswordError("Old password is incorrect");
      } else {
        setPasswordError("Failed to change password. Try again.");
      }
    } finally {
      setPasswordLoading(false);
    }
  }

  async function handleApproveAdmin() {
    if (!selectedAdminId) return;
    try {
      await approveAdmin(selectedAdminId);
      setModalAccept(false);
      loadPendingAdmins();
    } catch (err) {
      console.error(err);
    }
  }

  function descendingComparator<T>(a: T, b: T, orderBy: keyof T) {
    if (b[orderBy] < a[orderBy]) return -1;
    if (b[orderBy] > a[orderBy]) return 1;
    return 0;
  }

  function getComparator<Key extends keyof any>(
    order: Order,
    orderBy: Key,
  ): (a: any, b: any) => number {
    return order === "desc"
      ? (a, b) => descendingComparator(a, b, orderBy)
      : (a, b) => -descendingComparator(a, b, orderBy);
  }

  const headCells: any = [
    {
      id: "fullName",
      numeric: false,
      disablePadding: false,
      label: "Full Name",
    },
    {
      id: "dateOfBirth",
      numeric: false,
      disablePadding: false,
      label: "Age",
    },
    {
      id: "phoneNumber",
      numeric: false,
      disablePadding: false,
      label: "Phone number",
    },
    {
      id: "email",
      numeric: false,
      disablePadding: false,
      label: "Email",
    },
    {
      id: "action",
      numeric: false,
      disablePadding: false,
      label: "Action",
    },
  ];

  const handleRequestSort = (_: React.MouseEvent<unknown>, property: any) => {
    const isAsc = orderBy === property && order === "asc";
    setOrder(isAsc ? "desc" : "asc");
    setOrderBy(property);
  };

  const handleSelectAllClick = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.checked) {
      setSelected(pendingAdmins.map((n: any) => n.id));
      return;
    }
    setSelected([]);
  };

  const handleChangePage = (_: unknown, newPage: number) => setPage(newPage);
  const handleChangeRowsPerPage = (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const emptyRows =
    page > 0 ? Math.max(0, (1 + page) * rowsPerPage - pendingAdmins.length) : 0;
  const visibleRows = useMemo(
    () =>
      [...pendingAdmins]
        .sort(getComparator(order, orderBy))
        .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage),
    [pendingAdmins, order, orderBy, page, rowsPerPage],
  );

  async function logoutFromAccount() {
    setLogoutLoading(true);
    try {
      await firebaseSignOut();
      setModalLogout(false);
      navigate("/");
    } catch (error) {
      console.error(error);
    } finally {
      setLogoutLoading(false);
    }
  }

  function EnhancedTableHead({ order, orderBy, onRequestSort }: any) {
    const createSortHandler =
      (property: any) => (event: React.MouseEvent<unknown>) =>
        onRequestSort(event, property);
    return (
      <TableHead>
        <TableRow>
          {headCells.map((headCell: any) => (
            <TableCell
              key={headCell.id}
              padding={headCell.disablePadding ? "none" : "normal"}
              sortDirection={orderBy === headCell.id ? order : false}
            >
              <TableSortLabel
                active={orderBy === headCell.id}
                direction={orderBy === headCell.id ? order : "asc"}
                onClick={createSortHandler(headCell.id)}
              >
                {headCell.label}
                {orderBy === headCell.id ? (
                  <Box component="span" sx={visuallyHidden}>
                    {order === "desc"
                      ? "sorted descending"
                      : "sorted ascending"}
                  </Box>
                ) : null}
              </TableSortLabel>
            </TableCell>
          ))}
        </TableRow>
      </TableHead>
    );
  }

  function EnhancedTableToolbar({ numSelected }: any) {
    return (
      <Toolbar
        sx={{
          pl: { sm: 2 },
          pr: { xs: 1, sm: 1 },
          ...(numSelected > 0 && {
            bgcolor: (theme) =>
              alpha(
                theme.palette.primary.main,
                theme.palette.action.activatedOpacity,
              ),
          }),
        }}
      >
        <Typography
          sx={{ flex: "1 1 100%" }}
          variant="h6"
          id="tableTitle"
          component="div"
        >
          Requested Admin Members
        </Typography>
      </Toolbar>
    );
  }

  return (
    <>
      <div className="profile_component">
        <div className="profile_component_block p-5 max-w-360 mx-auto">
          {/* Language Section */}
          <div className="header_profile_component flex flex-col gap-2">
            <h1 className="text-[24px] font-600">Options</h1>
            <div className="header_profile_component_block shadow-[0_0_8px_#00000040] rounded-xl px-7 py-4 flex justify-between items-center sm:flex-col md:flex-row gap-5">
              <FormControl fullWidth>
                <InputLabel>Language</InputLabel>
                <Select label="Language">
                  <MenuItem value={""} sx={{ color: "gray" }} disabled>
                    Language
                  </MenuItem>
                  <MenuItem value={"en"}>English</MenuItem>
                  <MenuItem value={"ru"}>Russian</MenuItem>
                  <MenuItem value={"tj"}>Tajik</MenuItem>
                </Select>
              </FormControl>
              <button
                className="btn_open_modal_logout outline-none bg-red-500 rounded-[10px] px-1 py-3.5 text-white text-[19px] cursor-pointer w-full"
                onClick={() => {
                  setModalLogout(true);
                }}
              >
                Logout
              </button>
            </div>
          </div>

          {/* Profile Section */}
          <div className="section_profile_component mt-6">
            <h1 className="text-[24px] font-600">Profile</h1>
            {profileLoading ? (
              <div className="px-7 py-4 mt-2 flex justify-center items-center">
                <CircularProgress size={50} />
              </div>
            ) : userNotFound ? (
              <div className="shadow-[0_0_8px_#00000040] rounded-xl px-7 py-4 mt-2 flex justify-center items-center">
                <Typography variant="h6" color="error">
                  User not found
                </Typography>
              </div>
            ) : (
              <>
                <div className="admin_info shadow-[0_0_8px_#00000040] rounded-xl px-7 py-4 mt-2 flex sm:flex-col lg:flex-row lg:justify-evenly lg:items-center gap-10">
                  <div className="block_admin_img flex sm:flex-row lg:flex-col sm:justify-center lg:justify-start gap-12">
                    <div className="block_flex_img flex flex-col gap-3">
                      <img
                        className="w-38 h-38 shadow-2xl object-cover rounded-full"
                        src={adminProfile?.image_url || noImg}
                        alt="Profile"
                        onError={(e: any) => {
                          e.target.src = noImg;
                        }}
                      />
                    </div>
                  </div>

                  <div className="admin_info_block grid sm:grid-cols-1 md:grid-cols-2 sm:place-items-center md:place-items-start gap-5">
                    <div>
                      <h2 className="title_fullname text-[#9794AA] text-[16px] font-500 sm:text-center md:text-start">
                        Full Name
                      </h2>
                      <h1 className="fullname sm:text-center md:text-start">
                        {adminProfile?.fullName || "-"}
                      </h1>
                    </div>
                    <div>
                      <h2 className="title_date_of_birth text-[#9794AA] text-[16px] font-500 sm:text-center md:text-start">
                        Date of birth
                      </h2>
                      <h1 className="date_of_birth sm:text-center md:text-start">
                        {formatDate(adminProfile?.dateOfBirth)}
                      </h1>
                    </div>
                    <div>
                      <h2 className="title_phone_number text-[#9794AA] text-[16px] font-500 sm:text-center md:text-start">
                        Phone Number
                      </h2>
                      <h1 className="phone_number sm:text-center md:text-start">
                        {adminProfile?.phoneNumber || "-"}
                      </h1>
                    </div>
                    <div>
                      <h2 className="title_email text-[#9794AA] text-[16px] font-500 sm:text-center md:text-start">
                        Email
                      </h2>
                      <h1 className="email sm:text-center md:text-start">{adminProfile?.email || "-"}</h1>
                    </div>
                    <div>
                      <h2 className="title_role text-[#9794AA] text-[16px] font-500 sm:text-center md:text-start">
                        Role
                      </h2>
                      <h1 className="role sm:text-center md:text-start">
                        {adminProfile.is_main_admin === true
                          ? "Main Admin"
                          : "Admin"}
                      </h1>
                    </div>
                  </div>
                </div>

                {/* Edit Admin - Only show if user is found */}
                <div className="block_link_change_password mt-3">
                  <h1 className="text-[24px] font-600">Edit Admin</h1>
                  <button
                    onClick={() => {
                      navigate("/dashboard/edit-admin");
                    }}
                    className="text-[blue] hover:underline cursor-pointer bg-transparent border-none text-[16px]"
                  >
                    Change admin info
                  </button>
                </div>
              </>
            )}
          </div>

          {/* Admins Table — only visible to main admin */}
          <div className="footer_profile_component mt-6">
            <h1 className="text-[24px] font-600">Admins</h1>
            {adminsLoading ? (
              <div className="flex justify-center py-6">
                <CircularProgress size={40} />
              </div>
            ) : (
              <Paper sx={{ width: "100%", paddingLeft: 3, paddingRight: 3 }}>
                <EnhancedTableToolbar numSelected={selected.length} />
                <TableContainer>
                  <Table sx={{ minWidth: 750 }} aria-labelledby="tableTitle">
                    <EnhancedTableHead
                      numSelected={selected.length}
                      order={order}
                      orderBy={orderBy}
                      onSelectAllClick={handleSelectAllClick}
                      onRequestSort={handleRequestSort}
                      rowCount={pendingAdmins.length}
                    />
                    <TableBody>
                      {visibleRows.map((row, index) => {
                        const labelId = `enhanced-table-checkbox-${index}`;
                        return (
                          <TableRow
                            hover
                            role="checkbox"
                            tabIndex={-1}
                            key={row.id}
                          >
                            <TableCell component="th" id={labelId} scope="row">
                              {row.fullName || row.name || "-"}
                            </TableCell>
                            <TableCell>
                              {formatDate(row.dateOfBirth || row.date_of_birth)}
                            </TableCell>
                            <TableCell>
                              {row.phoneNumber || row.phone || "-"}
                            </TableCell>
                            <TableCell>{row.email || "-"}</TableCell>
                            <TableCell>
                              <button
                                className="bg-[green] px-2.5 py-1.5 rounded-[5px] text-white text-[14px] font-500 cursor-pointer outline-none hover:bg-[#006600] transition-colors"
                                onClick={() => {
                                  setSelectedAdminId(row.id);
                                  setModalAccept(true);
                                }}
                              >
                                Accept
                              </button>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                      {pendingAdmins.length === 0 && (
                        <TableRow>
                          <TableCell
                            colSpan={5}
                            align="center"
                            sx={{ py: 4, color: "gray" }}
                          >
                            No pending admin requests
                          </TableCell>
                        </TableRow>
                      )}
                      {emptyRows > 0 && (
                        <TableRow>
                          <TableCell colSpan={5} />
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </TableContainer>
                <TablePagination
                  rowsPerPageOptions={[17, 10, 8, 5]}
                  component="div"
                  count={pendingAdmins.length}
                  rowsPerPage={rowsPerPage}
                  page={page}
                  onPageChange={handleChangePage}
                  onRowsPerPageChange={handleChangeRowsPerPage}
                />
              </Paper>
            )}
          </div>

          {/* Modal: Logout */}
          <Dialog
            open={modalLogout}
            onClose={() => setModalLogout(false)}
            fullWidth
          >
            <div className="modal_logput px-4 py-4">
              <div className="header_logput_block flex items-center gap-6 justify-between">
                <h1 className="text-[17px] font-600">Logout</h1>
                <button
                  className="close_modal_btn outline-none cursor-pointer p-2 bg-[#D9D9D9] rounded-full hover:bg-[#c0c0c0] transition-colors"
                  onClick={() => setModalLogout(false)}
                >
                  <MdOutlineClose size={27} />
                </button>
              </div>
              <DialogTitle sx={{ fontSize: 15 }}>
                {"Do you really want to logout from your account?"}
              </DialogTitle>
              <div className="block_btns flex gap-2 justify-between sm:flex-col-reverse md:flex-row">
                <button
                  className="bg-[#20ACFF] p-2.5 rounded-[10px] text-white text-[18px] font-500 cursor-pointer w-full duration-300 hover:bg-[#1a8fd4]"
                  onClick={() => setModalLogout(false)}
                  disabled={logoutLoading}
                >
                  No
                </button>
                <button
                  className="bg-[red] p-2.5 rounded-[10px] text-white text-[18px] font-500 cursor-pointer w-full duration-300 hover:bg-[#cc0000] disabled:opacity-50 disabled:cursor-not-allowed"
                  onClick={logoutFromAccount}
                  disabled={logoutLoading}
                >
                  {logoutLoading ? (
                    <CircularProgress size={24} color="inherit" />
                  ) : (
                    "Yes"
                  )}
                </button>
              </div>
            </div>
          </Dialog>

          {/* Modal: Accept Admin */}
          <Dialog
            open={modalAccept}
            onClose={() => setModalAccept(false)}
            fullWidth
          >
            <div className="modal_delete_book_block px-4 py-4">
              <div className="header_delete_book_block flex items-center gap-6 justify-between">
                <h1 className="text-[17px] font-600">
                  Request of becoming admin
                </h1>
                <button
                  className="close_modal_btn outline-none cursor-pointer p-2 bg-[#D9D9D9] rounded-full hover:bg-[#c0c0c0] transition-colors"
                  onClick={() => setModalAccept(false)}
                >
                  <MdOutlineClose size={27} />
                </button>
              </div>
              <DialogTitle sx={{ fontSize: 15 }}>
                {
                  "Is this person really a user of the admin side of Peshraft Library?"
                }
              </DialogTitle>
              <div className="block_btns flex gap-2 justify-between sm:flex-col-reverse md:flex-row">
                <button
                  className="bg-[#20ACFF] p-2.5 rounded-[10px] text-white text-[18px] font-500 cursor-pointer w-full duration-300 hover:bg-[#1a8fd4]"
                  onClick={() => setModalAccept(false)}
                >
                  No
                </button>
                <button
                  className="bg-[green] p-2.5 rounded-[10px] text-white text-[18px] font-500 cursor-pointer w-full duration-300 hover:bg-[#006600]"
                  onClick={handleApproveAdmin}
                >
                  Yes
                </button>
              </div>
            </div>
          </Dialog>

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
                  className="outline-none cursor-pointer p-2 bg-[#D9D9D9] rounded-full hover:bg-[#c0c0c0] transition-colors"
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
                />
                <TextField
                  label="New Password"
                  type="password"
                  fullWidth
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                />
                <TextField
                  label="Confirm New Password"
                  type="password"
                  fullWidth
                  value={confirmNewPassword}
                  onChange={(e) => setConfirmNewPassword(e.target.value)}
                />
                {passwordError && (
                  <p className="text-red-500 text-sm">{passwordError}</p>
                )}
                {passwordSuccess && (
                  <p className="text-green-500 text-sm">{passwordSuccess}</p>
                )}
                <button
                  onClick={handleChangePassword}
                  disabled={passwordLoading}
                  className="bg-[#20ACFF] p-2.5 rounded-[10px] text-white text-[18px] font-500 cursor-pointer w-full disabled:opacity-50 hover:bg-[#1a8fd4] transition-colors"
                >
                  {passwordLoading ? "Changing..." : "Change Password"}
                </button>
              </div>
            </div>
          </Dialog>
        </div>
      </div>
    </>
  );
};

export default Profile;
