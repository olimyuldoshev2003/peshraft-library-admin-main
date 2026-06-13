import { HiOutlineSearch } from "react-icons/hi";
import noImg from "../../assets/no-img.jpg";
import { LuPlus } from "react-icons/lu";
import { AiFillEdit } from "react-icons/ai";
import { MdDelete, MdOutlineClose } from "react-icons/md";
import TablePagination from "@mui/material/TablePagination";
import { useEffect, useState } from "react";
import Dialog from "@mui/material/Dialog";
import TextField from "@mui/material/TextField";
import FormControl from "@mui/material/FormControl";
import InputLabel from "@mui/material/InputLabel";
import Select from "@mui/material/Select";
import MenuItem from "@mui/material/MenuItem";
import DialogTitle from "@mui/material/DialogTitle";
import CircularProgress from "@mui/material/CircularProgress";
import Snackbar from "@mui/material/Snackbar";
import Alert from "@mui/material/Alert";
import { useAuth } from "../../context/AuthContext";

// 🔥 Firebase
import {
  collection,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  Timestamp,
} from "firebase/firestore";
import { db } from "../../firebase/config";
import { getMembers } from "../../firebase/services";

const Notifications = () => {
  const { adminProfile } = useAuth();
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState<number>(17);
  const [modalAddNotification, setModalAddNotification] =
    useState<boolean>(false);
  const [modalEditNotification, setModalEditNotification] =
    useState<boolean>(false);
  const [modalDeleteNotification, setModalDeleteNotification] =
    useState<boolean>(false);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [allNotifications, setAllNotifications] = useState<any[]>([]); // Store all notifications for searching
  const [searchInpValue, setSearchInpValue] = useState("");
  const [members, setMembers] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false); // For add/edit button loading
  const [selectedNotification, setSelectedNotification] = useState<any>(null);

  // Validation errors
  const [errors, setErrors] = useState({
    title: "",
    description: "",
    notificationType: "",
    userId: "",
    image: "",
  });

  // Snackbar state
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: "",
    severity: "error" as "error" | "success" | "warning" | "info",
  });

  // Form fields
  const [userIdValue, setUserIdValue] = useState("");
  const [notificationTypeValue, setNotificationTypeValue] = useState("");
  const [titleValue, setTitleValue] = useState("");
  const [descriptionValue, setDescriptionValue] = useState("");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState("");

  const showSnackbar = (
    message: string,
    severity: "error" | "success" | "warning" | "info",
  ) => {
    setSnackbar({ open: true, message, severity });
  };

  const handleCloseSnackbar = () => {
    setSnackbar({ ...snackbar, open: false });
  };

  // Get current date and time formatted
  const getCurrentDateTime = () => {
    const now = new Date();
    const date = now.toISOString().split("T")[0]; // YYYY-MM-DD
    const time = now.toTimeString().split(" ")[0].slice(0, 5); // HH:MM
    return { date, time };
  };

  useEffect(() => {
    loadNotifications();
    loadMembers();
  }, []);

  async function loadNotifications() {
    setLoading(true);
    try {
      const snap = await getDocs(collection(db, "notifications"));
      const data = snap.docs.map((d: any) => ({ id: d.id, ...d.data() }));
      setAllNotifications(data);
      setNotifications(data);
    } catch (err) {
      console.error(err);
      showSnackbar("Failed to load notifications", "error");
    } finally {
      setLoading(false);
    }
  }

  async function loadMembers() {
    try {
      const data = await getMembers();
      setMembers(data);
    } catch (err) {
      console.error(err);
    }
  }

  // Filter notifications based on search input
  useEffect(() => {
    if (!searchInpValue.trim()) {
      setNotifications(allNotifications);
    } else {
      const lowerSearch = searchInpValue.toLowerCase();
      const filtered = allNotifications.filter(
        (notification) =>
          notification.title?.toLowerCase().includes(lowerSearch) ||
          notification.description?.toLowerCase().includes(lowerSearch) ||
          notification.notification_type?.toLowerCase().includes(lowerSearch),
      );
      setNotifications(filtered);
      setPage(0); // Reset to first page when search results change
    }
  }, [searchInpValue, allNotifications]);

  // Validate single field
  const validateField = (name: string, value: any, isEdit: boolean = false) => {
    let error = "";

    switch (name) {
      case "title":
        if (!value || !value.trim()) {
          error = "Title is required";
        } else if (value.trim().length < 3) {
          error = "Title must be at least 3 characters";
        } else if (value.trim().length > 100) {
          error = "Title must be less than 100 characters";
        }
        break;

      case "description":
        if (!value || !value.trim()) {
          error = "Description is required";
        } else if (value.trim().length < 10) {
          error = "Description must be at least 10 characters";
        } else if (value.trim().length > 500) {
          error = "Description must be less than 500 characters";
        }
        break;

      case "notificationType":
        if (!value) {
          error = "Notification type is required";
        }
        break;

      case "userId":
        if (notificationTypeValue === "duetime" && !value) {
          error = "Please select a user for this notification";
        }
        break;

      case "image":
        // For add: image is required
        // For edit: image is required either existing or new
        if (!isEdit) {
          // Add mode - image is required
          if (!value) {
            error = "Image is required";
          } else if (value.size) {
            if (!value.type.startsWith("image/")) {
              error = "Please select an image file";
            } else if (value.size > 5 * 1024 * 1024) {
              error = "Image size should be less than 5MB";
            }
          }
        } else {
          // Edit mode - image is required either existing or new
          if (!imagePreview && !value) {
            error = "Image is required";
          } else if (value && value.size) {
            if (!value.type.startsWith("image/")) {
              error = "Please select an image file";
            } else if (value.size > 5 * 1024 * 1024) {
              error = "Image size should be less than 5MB";
            }
          }
        }
        break;

      default:
        break;
    }

    setErrors((prev) => ({ ...prev, [name]: error }));
    return error === "";
  };

  // Validate all fields before submit
  const validateAllFields = (isEdit: boolean = false) => {
    const validations = [
      validateField("title", titleValue),
      validateField("description", descriptionValue),
      validateField("notificationType", notificationTypeValue),
      validateField("userId", userIdValue),
      validateField("image", imageFile, isEdit),
    ];

    return validations.every((v) => v === true);
  };

  function resetForm() {
    setUserIdValue("");
    setNotificationTypeValue("");
    setTitleValue("");
    setDescriptionValue("");
    setImageFile(null);
    setImagePreview("");
    setErrors({
      title: "",
      description: "",
      notificationType: "",
      userId: "",
      image: "",
    });
  }

  const handleImageChange = (e: any) => {
    const file = e.target.files[0];
    if (file) {
      if (!file.type.startsWith("image/")) {
        setErrors((prev) => ({
          ...prev,
          image: "Please select an image file",
        }));
        return;
      }
      if (file.size > 5 * 1024 * 1024) {
        setErrors((prev) => ({
          ...prev,
          image: "Image size should be less than 5MB",
        }));
        return;
      }
      setImageFile(file);
      setErrors((prev) => ({ ...prev, image: "" }));
      const reader = new FileReader();
      reader.onload = (ev: any) => setImagePreview(ev.target.result);
      reader.readAsDataURL(file);
    }
  };

  async function handleAdd() {
    if (!validateAllFields(false)) {
      showSnackbar("Please fix all validation errors", "error");
      return;
    }

    setSubmitting(true);
    try {
      let notification_image_url = "";
      if (imageFile) {
        const { uploadImageToCloudinary } =
          await import("../../firebase/services");
        notification_image_url = await uploadImageToCloudinary(imageFile);
      }

      const { date, time } = getCurrentDateTime();

      await addDoc(collection(db, "notifications"), {
        member_id: notificationTypeValue === "news" ? "all_users" : userIdValue,
        notification_type: notificationTypeValue,
        notification_image_url,
        title: titleValue,
        description: descriptionValue,
        date: date,
        time: time,
        created_at: Timestamp.now(),
      });
      resetForm();
      setModalAddNotification(false);
      loadNotifications();
      showSnackbar("Notification added successfully!", "success");
    } catch (err) {
      console.error(err);
      showSnackbar("Failed to add notification", "error");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleEdit() {
    if (!selectedNotification) return;
    if (!validateAllFields(true)) {
      showSnackbar("Please fix all validation errors", "error");
      return;
    }

    setSubmitting(true);
    try {
      let notification_image_url =
        selectedNotification.notification_image_url || "";
      if (imageFile) {
        const { uploadImageToCloudinary } =
          await import("../../firebase/services");
        notification_image_url = await uploadImageToCloudinary(imageFile);
      }

      const { date, time } = getCurrentDateTime();

      await updateDoc(doc(db, "notifications", selectedNotification.id), {
        member_id: notificationTypeValue === "news" ? "all_users" : userIdValue,
        notification_type: notificationTypeValue,
        notification_image_url,
        title: titleValue,
        description: descriptionValue,
        date: date,
        time: time,
        updated_at: Timestamp.now(),
      });
      resetForm();
      setModalEditNotification(false);
      loadNotifications();
      showSnackbar("Notification updated successfully!", "success");
    } catch (err) {
      console.error(err);
      showSnackbar("Failed to update notification", "error");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete() {
    if (!selectedNotification) return;
    setSubmitting(true);
    try {
      await deleteDoc(doc(db, "notifications", selectedNotification.id));
      setModalDeleteNotification(false);
      loadNotifications();
      showSnackbar("Notification deleted successfully!", "success");
    } catch (err) {
      console.error(err);
      showSnackbar("Failed to delete notification", "error");
    } finally {
      setSubmitting(false);
    }
  }

  function openEditModal(notification: any) {
    setSelectedNotification(notification);
    setTitleValue(notification.title || "");
    setDescriptionValue(notification.description || "");
    setNotificationTypeValue(notification.notification_type || "");
    setUserIdValue(
      notification.member_id === "all_users"
        ? ""
        : notification.member_id || "",
    );
    setImagePreview(notification.notification_image_url || "");
    setImageFile(null);
    setErrors({
      title: "",
      description: "",
      notificationType: "",
      userId: "",
      image: "",
    });
    setModalEditNotification(true);
  }

  // Handle field changes with real-time validation
  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setTitleValue(e.target.value);
    validateField("title", e.target.value);
  };

  const handleDescriptionChange = (
    e: React.ChangeEvent<HTMLTextAreaElement>,
  ) => {
    setDescriptionValue(e.target.value);
    validateField("description", e.target.value);
  };

  const handleNotificationTypeChange = (e: any) => {
    setNotificationTypeValue(e.target.value);
    setUserIdValue("");
    validateField("notificationType", e.target.value);
  };

  const handleUserIdChange = (e: any) => {
    setUserIdValue(e.target.value);
    validateField("userId", e.target.value);
  };

  const handleChangePage = (_: unknown, newPage: number) => setPage(newPage);
  const handleChangeRowsPerPage = (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const visibleNotifications = notifications.slice(
    page * rowsPerPage,
    page * rowsPerPage + rowsPerPage,
  );

  return (
    <>
      <div className="notifications_component">
        <div className="notifications_component_block p-4 max-w-360 mx-auto">
          <div className="header_notifications_component flex justify-between items-center gap-6">
            <div className="search_logo_and_search_input relative flex-1">
              <HiOutlineSearch size={24} className="absolute top-2.5 left-3" />
              <input
                type="search"
                className="inp_search outline-none shadow-[0_0_6px_gray] pl-12 pr-4 py-2 rounded-[30px] text-[18px] font-500 sm:w-full md:w-[90%] lg:w-[80%]"
                placeholder="Search by title, description or type..."
                value={searchInpValue}
                onChange={(e) => setSearchInpValue(e.target.value)}
              />
            </div>
            <div className="fullname_img_of_admin_and_admin_title sm:hidden md:flex items-center gap-3">
              <div className="fullname_of_user_and_admin_title">
                <h1 className="text-[22px] font-500">
                  {adminProfile?.fullName || "Admin"}
                </h1>
                <h1 className="text-[#808080] text-[15px] font-400 text-right">
                  Admin
                </h1>
              </div>
              <img
                className="w-14 h-14 rounded-full object-cover"
                src={adminProfile?.image_url || noImg}
                alt=""
              />
            </div>
          </div>

          <div className="section_notifications_component mt-7">
            <div className="title_and_btn_add_notifications_block flex justify-between items-center gap-2">
              <h1 className="title_notitfications text-[24px] font-medium">
                Notifications
                {searchInpValue && notifications.length === 0 && (
                  <span className="text-sm text-gray-400 ml-2">
                    (No results found for "{searchInpValue}")
                  </span>
                )}
                {searchInpValue && notifications.length > 0 && (
                  <span className="text-sm text-gray-400 ml-2">
                    ({notifications.length} result
                    {notifications.length !== 1 ? "s" : ""})
                  </span>
                )}
              </h1>
              <div className="btn_add_block flex justify-between items-center gap-6">
                <button
                  className="flex items-center gap-2 bg-[#20ACFF] p-2.5 rounded-[10px] text-white text-[18px] font-500 cursor-pointer hover:bg-[#0d8ae0] transition-colors"
                  onClick={() => {
                    resetForm();
                    setModalAddNotification(true);
                  }}
                >
                  <LuPlus />
                  <span className="sm:hidden md:block">Add Notification</span>
                </button>
              </div>
            </div>

            {loading ? (
              <div className="flex justify-center py-10">
                <CircularProgress />
              </div>
            ) : (
              <div className="notifications_block mt-6 flex flex-col gap-3">
                {visibleNotifications.length === 0 ? (
                  <p className="text-center text-gray-400 py-8">
                    {searchInpValue
                      ? `No notifications found matching "${searchInpValue}"`
                      : "No notifications yet. Click 'Add Notification' to create one."}
                  </p>
                ) : (
                  visibleNotifications.map((notification: any) => (
                    <div
                      key={notification.id}
                      className="notification_container flex justify-between gap-5 shadow-[0_0_6px_gray] rounded-xl p-2 hover:shadow-[0_0_10px_gray] transition-shadow"
                    >
                      <div className="title_and_description_block">
                        <h1 className="title_notification text-[16px] font-bold">
                          {notification.title}
                        </h1>
                        <p className="description_notification text-[14px] font-400">
                          {notification.description}
                        </p>
                        <span className="text-[12px] text-gray-400">
                          {notification.notification_type || ""}
                        </span>
                      </div>
                      <div className="btns_functionalities_block flex items-center gap-1.5">
                        <AiFillEdit
                          size={27}
                          className="cursor-pointer text-blue-600 hover:text-blue-800 duration-100"
                          onClick={() => openEditModal(notification)}
                        />
                        <MdDelete
                          size={27}
                          className="cursor-pointer text-red-500 hover:text-red-600 duration-100"
                          onClick={() => {
                            setSelectedNotification(notification);
                            setModalDeleteNotification(true);
                          }}
                        />
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}

            {notifications.length > 0 && (
              <div className="pagination_notfications">
                <TablePagination
                  rowsPerPageOptions={[17, 10, 8, 5]}
                  component="div"
                  count={notifications.length}
                  rowsPerPage={rowsPerPage}
                  page={page}
                  onPageChange={handleChangePage}
                  onRowsPerPageChange={handleChangeRowsPerPage}
                />
              </div>
            )}

            {/* Modal Add Notification */}
            <Dialog
              open={modalAddNotification}
              onClose={() => !submitting && setModalAddNotification(false)}
              fullWidth
            >
              <div className="modal_add_notification_block px-4 py-4">
                <div className="header_modal_add_notification flex items-center gap-6 justify-between">
                  <h1 className="text-[26px] font-600">Add Notification</h1>
                  <button
                    className="close_modal_btn outline-none cursor-pointer p-2 bg-[#D9D9D9] rounded-full hover:bg-gray-400 transition-colors"
                    onClick={() =>
                      !submitting && setModalAddNotification(false)
                    }
                    disabled={submitting}
                  >
                    <MdOutlineClose size={27} />
                  </button>
                </div>
                <div className="section_modal_add_notification">
                  <div className="form flex flex-col gap-3">
                    <div className="label_select_notification_type flex flex-col gap-2">
                      <label className="cursor-pointer text-[15px] font-500">
                        Notification Type *
                      </label>
                      <FormControl fullWidth error={!!errors.notificationType}>
                        <InputLabel>Type of Notification</InputLabel>
                        <Select
                          label="Type of Notification"
                          value={notificationTypeValue}
                          onChange={handleNotificationTypeChange}
                          disabled={submitting}
                        >
                          <MenuItem value={""} sx={{ color: "gray" }}>
                            Select a type
                          </MenuItem>
                          <MenuItem value={"duetime"}>Duetime</MenuItem>
                          <MenuItem value={"news"}>News</MenuItem>
                        </Select>
                        {errors.notificationType && (
                          <span className="text-xs text-red-500 mt-1">
                            {errors.notificationType}
                          </span>
                        )}
                      </FormControl>
                    </div>
                    {notificationTypeValue === "duetime" && (
                      <div className="label_select_user flex flex-col gap-2">
                        <label className="cursor-pointer text-[15px] font-500">
                          For (Member) *
                        </label>
                        <FormControl fullWidth error={!!errors.userId}>
                          <InputLabel>Select The User</InputLabel>
                          <Select
                            label="Select the User"
                            value={userIdValue}
                            onChange={handleUserIdChange}
                            disabled={submitting}
                          >
                            <MenuItem value={""} sx={{ color: "gray" }}>
                              Select a user
                            </MenuItem>
                            {members.map((m: any) => (
                              <MenuItem key={m.id} value={m.id}>
                                {m.fullName || m.name || m.email}
                              </MenuItem>
                            ))}
                          </Select>
                          {errors.userId && (
                            <span className="text-xs text-red-500 mt-1">
                              {errors.userId}
                            </span>
                          )}
                        </FormControl>
                      </div>
                    )}

                    <div className="label_input_title flex flex-col gap-2">
                      <label className="cursor-pointer text-[15px] font-500">
                        Title *
                      </label>
                      <TextField
                        label="Title of Notification"
                        variant="outlined"
                        value={titleValue}
                        onChange={handleTitleChange}
                        error={!!errors.title}
                        helperText={errors.title}
                        required
                        disabled={submitting}
                        fullWidth
                      />
                    </div>
                    <div className="label_textarea_description flex flex-col gap-2">
                      <label className="cursor-pointer text-[15px] font-500">
                        Description *
                      </label>
                      <textarea
                        value={descriptionValue}
                        onChange={handleDescriptionChange}
                        placeholder="Description"
                        className={`outline-none border-2 rounded-[15px] p-3 h-40 resize-none focus:border-[#20ACFF] transition-colors ${
                          errors.description
                            ? "border-red-500"
                            : "border-[#DFEAF2]"
                        }`}
                        disabled={submitting}
                      ></textarea>
                      {errors.description && (
                        <span className="text-xs text-red-500">
                          {errors.description}
                        </span>
                      )}
                      <span className="text-xs text-gray-400">
                        {descriptionValue.length} characters
                      </span>
                    </div>
                    <div className="flex flex-col gap-2">
                      <label className="cursor-pointer text-[15px] font-500">
                        Image *
                      </label>
                      {imagePreview && (
                        <img
                          src={imagePreview}
                          className="w-20 h-20 object-cover rounded-lg"
                          alt="Preview"
                        />
                      )}
                      <input
                        type="file"
                        accept="image/*"
                        className={`outline-none border-2 rounded-[10px] p-2 cursor-pointer ${
                          errors.image ? "border-red-500" : "border-[#DFEAF2]"
                        }`}
                        onChange={handleImageChange}
                        disabled={submitting}
                      />
                      <span className="text-xs text-gray-400">
                        Max size: 5MB (JPG, PNG, GIF)
                      </span>
                      {errors.image && (
                        <span className="text-xs text-red-500">
                          {errors.image}
                        </span>
                      )}
                    </div>
                    <div className="btn_submit_block mt-2">
                      <button
                        onClick={handleAdd}
                        disabled={submitting}
                        className={`bg-[#20ACFF] p-2.5 rounded-[10px] text-white text-[18px] font-500 cursor-pointer w-full transition-colors ${
                          submitting
                            ? "opacity-50 cursor-not-allowed"
                            : "hover:bg-[#0d8ae0]"
                        }`}
                      >
                        {submitting ? (
                          <div className="flex items-center justify-center gap-2">
                            <CircularProgress size={24} color="inherit" />
                            <span>Submitting...</span>
                          </div>
                        ) : (
                          "Submit"
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </Dialog>

            {/* Modal Edit Notification */}
            <Dialog
              open={modalEditNotification}
              onClose={() => !submitting && setModalEditNotification(false)}
              fullWidth
            >
              <div className="modal_edit_notification_block px-4 py-4">
                <div className="header_modal_edit_notification flex items-center gap-6 justify-between">
                  <h1 className="text-[26px] font-600">Edit Notification</h1>
                  <button
                    className="close_modal_btn outline-none cursor-pointer p-2 bg-[#D9D9D9] rounded-full hover:bg-gray-400 transition-colors"
                    onClick={() =>
                      !submitting && setModalEditNotification(false)
                    }
                    disabled={submitting}
                  >
                    <MdOutlineClose size={27} />
                  </button>
                </div>
                <div className="section_modal_edit_notification">
                  <div className="form flex flex-col gap-3">
                    <div className="label_select_notification_type flex flex-col gap-2">
                      <label className="cursor-pointer text-[15px] font-500">
                        Notification Type *
                      </label>
                      <FormControl fullWidth error={!!errors.notificationType}>
                        <InputLabel>Type of Notification</InputLabel>
                        <Select
                          label="Type of Notification"
                          value={notificationTypeValue}
                          onChange={handleNotificationTypeChange}
                          disabled={submitting}
                        >
                          <MenuItem value={""} sx={{ color: "gray" }}>
                            Select a type
                          </MenuItem>
                          <MenuItem value={"duetime"}>Duetime</MenuItem>
                          <MenuItem value={"news"}>News</MenuItem>
                        </Select>
                        {errors.notificationType && (
                          <span className="text-xs text-red-500 mt-1">
                            {errors.notificationType}
                          </span>
                        )}
                      </FormControl>
                    </div>
                    {notificationTypeValue === "duetime" && (
                      <div className="label_select_user flex flex-col gap-2">
                        <label className="cursor-pointer text-[15px] font-500">
                          For (Member) *
                        </label>
                        <FormControl fullWidth error={!!errors.userId}>
                          <InputLabel>Select The User</InputLabel>
                          <Select
                            label="Select the User"
                            value={userIdValue}
                            onChange={handleUserIdChange}
                            disabled={submitting}
                          >
                            <MenuItem value={""} sx={{ color: "gray" }}>
                              Select a user
                            </MenuItem>
                            {members.map((m: any) => (
                              <MenuItem key={m.id} value={m.id}>
                                {m.fullName || m.name || m.email}
                              </MenuItem>
                            ))}
                          </Select>
                          {errors.userId && (
                            <span className="text-xs text-red-500 mt-1">
                              {errors.userId}
                            </span>
                          )}
                        </FormControl>
                      </div>
                    )}

                    <div className="label_input_title flex flex-col gap-2">
                      <label className="cursor-pointer text-[15px] font-500">
                        Title *
                      </label>
                      <TextField
                        label="Title of Notification"
                        variant="outlined"
                        value={titleValue}
                        onChange={handleTitleChange}
                        error={!!errors.title}
                        helperText={errors.title}
                        required
                        disabled={submitting}
                        fullWidth
                      />
                    </div>
                    <div className="label_textarea_description flex flex-col gap-2">
                      <label className="cursor-pointer text-[15px] font-500">
                        Description *
                      </label>
                      <textarea
                        value={descriptionValue}
                        onChange={handleDescriptionChange}
                        placeholder="Description"
                        className={`outline-none border-2 rounded-[15px] p-3 h-40 resize-none focus:border-[#20ACFF] transition-colors ${
                          errors.description
                            ? "border-red-500"
                            : "border-[#DFEAF2]"
                        }`}
                        disabled={submitting}
                      ></textarea>
                      {errors.description && (
                        <span className="text-xs text-red-500">
                          {errors.description}
                        </span>
                      )}
                      <span className="text-xs text-gray-400">
                        {descriptionValue.length} characters
                      </span>
                    </div>
                    <div className="flex flex-col gap-2">
                      <label className="cursor-pointer text-[15px] font-500">
                        Image *
                      </label>
                      {imagePreview && (
                        <img
                          src={imagePreview}
                          className="w-20 h-20 object-cover rounded-lg"
                          alt="Preview"
                        />
                      )}
                      <input
                        type="file"
                        accept="image/*"
                        className={`outline-none border-2 rounded-[10px] p-2 cursor-pointer ${
                          errors.image ? "border-red-500" : "border-[#DFEAF2]"
                        }`}
                        onChange={handleImageChange}
                        disabled={submitting}
                      />
                      <span className="text-xs text-gray-400">
                        Max size: 5MB (upload new to replace current)
                      </span>
                      {errors.image && (
                        <span className="text-xs text-red-500">
                          {errors.image}
                        </span>
                      )}
                    </div>
                    <div className="btn_submit_block mt-2">
                      <button
                        onClick={handleEdit}
                        disabled={submitting}
                        className={`bg-[#20ACFF] p-2.5 rounded-[10px] text-white text-[18px] font-500 cursor-pointer w-full transition-colors ${
                          submitting
                            ? "opacity-50 cursor-not-allowed"
                            : "hover:bg-[#0d8ae0]"
                        }`}
                      >
                        {submitting ? (
                          <div className="flex items-center justify-center gap-2">
                            <CircularProgress size={24} color="inherit" />
                            <span>Updating...</span>
                          </div>
                        ) : (
                          "Update"
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </Dialog>

            {/* Modal Delete */}
            <Dialog
              open={modalDeleteNotification}
              onClose={() => !submitting && setModalDeleteNotification(false)}
              fullWidth
            >
              <div className="modal_delete_notification_block px-4 py-4">
                <div className="header_delete_notification_block flex items-center gap-6 justify-between">
                  <h1 className="text-[17px] font-600">Delete Notification</h1>
                  <button
                    className="close_modal_btn outline-none cursor-pointer p-2 bg-[#D9D9D9] rounded-full hover:bg-gray-400 transition-colors"
                    onClick={() =>
                      !submitting && setModalDeleteNotification(false)
                    }
                    disabled={submitting}
                  >
                    <MdOutlineClose size={27} />
                  </button>
                </div>
                <DialogTitle sx={{ fontSize: 15, pt: 2 }}>
                  Are you sure you want to delete this notification? This action
                  cannot be undone.
                </DialogTitle>
                <div className="block_btns flex gap-2 justify-between sm:flex-col-reverse md:flex-row mt-2">
                  <button
                    className="bg-gray-500 p-2.5 rounded-[10px] text-white text-[18px] font-500 cursor-pointer w-full duration-300 hover:bg-gray-600 transition-colors"
                    onClick={() =>
                      !submitting && setModalDeleteNotification(false)
                    }
                    disabled={submitting}
                  >
                    Cancel
                  </button>
                  <button
                    className="bg-red-500 p-2.5 rounded-[10px] text-white text-[18px] font-500 cursor-pointer w-full duration-300 hover:bg-red-600 transition-colors"
                    onClick={handleDelete}
                    disabled={submitting}
                  >
                    {submitting ? (
                      <div className="flex items-center justify-center gap-2">
                        <CircularProgress size={20} color="inherit" />
                        <span>Deleting...</span>
                      </div>
                    ) : (
                      "Delete"
                    )}
                  </button>
                </div>
              </div>
            </Dialog>
          </div>
        </div>
      </div>

      {/* Snackbar for Notifications */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
      >
        <Alert
          onClose={handleCloseSnackbar}
          severity={snackbar.severity}
          variant="filled"
          sx={{ width: "100%" }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </>
  );
};

export default Notifications;
