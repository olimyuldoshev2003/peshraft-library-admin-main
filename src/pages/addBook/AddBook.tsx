import { useState, useEffect } from "react";

// Img
import noImg from "../../assets/no-img.jpg";
import TextField from "@mui/material/TextField";
import FormControl from "@mui/material/FormControl";
import InputLabel from "@mui/material/InputLabel";
import Select from "@mui/material/Select";
import MenuItem from "@mui/material/MenuItem";
import { useNavigate } from "react-router-dom";
import { axiosRequest } from "../../utils/axiosRequest";
import CircularProgress from "@mui/material/CircularProgress";
import Backdrop from "@mui/material/Backdrop";
import Snackbar from "@mui/material/Snackbar";
import Alert from "@mui/material/Alert";
import Dialog from "@mui/material/Dialog";
import DialogTitle from "@mui/material/DialogTitle";
import DialogContent from "@mui/material/DialogContent";
import DialogActions from "@mui/material/DialogActions";
import Button from "@mui/material/Button";

const AddBook = () => {
  const navigate = useNavigate();

  const [imgBook, setImgBook] = useState<any>(null);
  const [imgBgBook, setImgBgBook] = useState<any>(null);
  const [bookName, setBookName] = useState<string>("");
  const [categoryValue, setCategoryValue] = useState<string>("");
  const [publicationYear, setPublicationYear] = useState<string>("");
  const [authorName, setAuthorName] = useState<string>("");
  const [pageSize, setPageSize] = useState<string>("");
  const [language, setLanguage] = useState<string>("");
  const [availableCopies, setAvailableCopies] = useState<string>("");
  const [description, setDescription] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);
  const [categories, setCategories] = useState<any[]>([]);
  const [loadingCategories, setLoadingCategories] = useState<boolean>(false);
  const [showConfirmDialog, setShowConfirmDialog] = useState<boolean>(false);

  // Validation error states
  const [errors, setErrors] = useState({
    bookName: "",
    authorName: "",
    categoryValue: "",
    publicationYear: "",
    pageSize: "",
    availableCopies: "",
    imgBook: "",
    imgBgBook: "",
    language: "",
  });

  // Snackbar states
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: "",
    severity: "success" as "success" | "error" | "warning" | "info",
  });

  // Validate single field
  const validateField = (name: string, value: any) => {
    let error = "";

    switch (name) {
      case "bookName":
        if (!value || !value.trim()) {
          error = "Book title is required";
        } else if (value.trim().length < 2) {
          error = "Book title must be at least 2 characters";
        } else if (value.trim().length > 200) {
          error = "Book title must be less than 200 characters";
        }
        break;

      case "authorName":
        if (!value || !value.trim()) {
          error = "Author name is required";
        } else if (value.trim().length < 2) {
          error = "Author name must be at least 2 characters";
        } else if (value.trim().length > 100) {
          error = "Author name must be less than 100 characters";
        }
        break;

      case "categoryValue":
        if (!value) {
          error = "Category is required";
        }
        break;

      case "publicationYear":
        if (!value) {
          error = "Publication year is required";
        } else {
          const year = parseInt(value);
          const currentYear = new Date().getFullYear();
          if (isNaN(year) || year < 1000 || year > currentYear) {
            error = `Publication year must be between 1000 and ${currentYear}`;
          }
        }
        break;

      case "pageSize":
        if (!value) {
          error = "Page count is required";
        } else {
          const pages = parseInt(value);
          if (isNaN(pages) || pages < 1) {
            error = "Page count must be at least 1";
          } else if (pages > 10000) {
            error = "Page count must be less than 10000";
          }
        }
        break;

      case "availableCopies":
        if (!value && value !== 0) {
          error = "Available copies is required";
        } else {
          const copies = parseInt(value);
          if (isNaN(copies) || copies < 0) {
            error = "Available copies must be 0 or greater";
          } else if (copies > 1000) {
            error = "Available copies must be less than 1000";
          }
        }
        break;

      case "imgBook":
        if (!value) {
          error = "Book cover image is required";
        }
        break;

      case "imgBgBook":
        if (!value) {
          error = "Background image is required";
        }
        break;

      case "language":
        if (!value || !value.trim()) {
          error = "Language is required";
        } else if (value.trim().length < 2) {
          error = "Language must be at least 2 characters";
        } else if (value.trim().length > 50) {
          error = "Language name must be less than 50 characters";
        }
        break;

      default:
        break;
    }

    setErrors((prev) => ({ ...prev, [name]: error }));
    return error === "";
  };

  // Validate all fields
  const validateAllFields = () => {
    const validations = [
      validateField("bookName", bookName),
      validateField("authorName", authorName),
      validateField("categoryValue", categoryValue),
      validateField("publicationYear", publicationYear),
      validateField("pageSize", pageSize),
      validateField("availableCopies", availableCopies),
      validateField("imgBook", imgBook),
      validateField("imgBgBook", imgBgBook),
      validateField("language", language),
    ];

    return validations.every((v) => v === true);
  };

  // Handle Change of image
  const handleBookImageChange = (event: any) => {
    const file = event.target.files[0];

    if (file) {
      // Validate file type
      if (!file.type.startsWith("image/")) {
        showSnackbar("Please select an image file", "error");
        setErrors((prev) => ({
          ...prev,
          imgBook: "Please select an image file",
        }));
        return;
      }

      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        showSnackbar("Image size should be less than 5MB", "error");
        setErrors((prev) => ({
          ...prev,
          imgBook: "Image size should be less than 5MB",
        }));
        return;
      }

      setErrors((prev) => ({ ...prev, imgBook: "" }));
      const reader = new FileReader();

      reader.onload = (event: any) => {
        setImgBook(event.target.result);
      };

      reader.readAsDataURL(file);
    } else {
      setErrors((prev) => ({
        ...prev,
        imgBook: "Book cover image is required",
      }));
    }
  };

  const handleBookBgImageChange = (event: any) => {
    const file = event.target.files[0];

    if (file) {
      // Validate file type
      if (!file.type.startsWith("image/")) {
        showSnackbar("Please select an image file", "error");
        setErrors((prev) => ({
          ...prev,
          imgBgBook: "Please select an image file",
        }));
        return;
      }

      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        showSnackbar("Image size should be less than 5MB", "error");
        setErrors((prev) => ({
          ...prev,
          imgBgBook: "Image size should be less than 5MB",
        }));
        return;
      }

      setErrors((prev) => ({ ...prev, imgBgBook: "" }));
      const reader = new FileReader();

      reader.onload = (event: any) => {
        setImgBgBook(event.target.result);
      };

      reader.readAsDataURL(file);
    } else {
      setErrors((prev) => ({
        ...prev,
        imgBgBook: "Background image is required",
      }));
    }
  };

  // Get categories from API
  async function getCategories() {
    setLoadingCategories(true);
    try {
      const { data } = await axiosRequest.get(
        `${import.meta.env.VITE_API_URL}/admin/filters`,
      );
      setCategories(data.filters || []);
    } catch (error) {
      console.error("Error fetching categories:", error);
      showSnackbar("Failed to load categories", "error");
    } finally {
      setLoadingCategories(false);
    }
  }

  useEffect(() => {
    getCategories();
  }, []);

  function handleSubmitAddBook(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    // Validate all fields
    if (!validateAllFields()) {
      showSnackbar("Please fix all validation errors", "warning");
      return;
    }

    setShowConfirmDialog(true);
  }

  async function addBook() {
    setLoading(true);
    setShowConfirmDialog(false);

    try {
      const newBook = {
        title: bookName,
        author: authorName,
        description: description,
        category: categoryValue,
        year: parseInt(publicationYear),
        available_copies: parseInt(availableCopies),
        // image_url: imgBook,
        // background_image: imgBgBook,
        page_count: parseInt(pageSize),
        // language: language,
      };

      const { data } = await axiosRequest.post(
        `${import.meta.env.VITE_API_URL}/admin/books`,
        newBook,
      );

      console.log("Book added successfully:", data);
      showSnackbar("Book added successfully!", "success");

      setTimeout(() => {
        navigate("/dashboard/books");
      }, 2000);
    } catch (error: any) {
      console.error("Error adding book:", error);
      const errorMessage =
        error.response?.data?.message ||
        "Failed to add book. Please try again.";
      showSnackbar(errorMessage, "error");
    } finally {
      setLoading(false);
    }
  }

  const showSnackbar = (
    message: string,
    severity: "success" | "error" | "warning" | "info",
  ) => {
    setSnackbar({
      open: true,
      message,
      severity,
    });
  };

  const handleCloseSnackbar = () => {
    setSnackbar({
      ...snackbar,
      open: false,
    });
  };

  const handleCancel = () => {
    navigate("/dashboard/books");
  };

  // Handle field changes with validation
  const handleBookNameChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const value = event.target.value;
    setBookName(value);
    validateField("bookName", value);
  };

  const handleAuthorNameChange = (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const value = event.target.value;
    setAuthorName(value);
    validateField("authorName", value);
  };

  const handleCategoryChange = (event: any) => {
    const value = event.target.value;
    setCategoryValue(value);
    validateField("categoryValue", value);
  };

  const handlePublicationYearChange = (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const value = event.target.value;
    setPublicationYear(value);
    validateField("publicationYear", value);
  };

  const handlePageSizeChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const value = event.target.value;
    setPageSize(value);
    validateField("pageSize", value);
  };

  const handleAvailableCopiesChange = (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const value = event.target.value;
    setAvailableCopies(value);
    validateField("availableCopies", value);
  };

  const handleLanguageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const value = event.target.value;
    setLanguage(value);
    validateField("language", value);
  };

  return (
    <>
      <div className="add_book_component px-4 py-4">
        <div className="add_book_component_block max-w-360 mx-auto">
          <form
            className="form_add_book flex sm:flex-col lg:flex-row lg:justify-center lg:items-end gap-10"
            onSubmit={handleSubmitAddBook}
          >
            <div className="block_img_book_and_bg_book_and_input_book_component flex sm:flex-row lg:flex-col sm:justify-center lg:justify-start sm:flex-wrap md:flex-nowrap gap-12">
              <div className="img_and_input_book flex flex-col gap-3">
                {imgBook ? (
                  <img
                    className="w-38.25 h-53.75 shadow-2xl object-contain rounded-[10px]"
                    src={imgBook}
                    alt="Book cover preview"
                  />
                ) : (
                  <img
                    className="w-38.25 h-53.75 shadow-2xl object-cover rounded-[10px]"
                    src={noImg}
                    alt="No image placeholder"
                  />
                )}
                <div className="label_and_input_book_img flex flex-col gap-1">
                  <label
                    htmlFor="book_img"
                    className="text-[15px] text-[gray] cursor-pointer hover:text-[#20ACFF] transition-colors"
                  >
                    Book Image *
                  </label>
                  <input
                    type="file"
                    className="rounded-[5px] max-w-55 outline-none px-3 shadow-xl py-1 bg-white cursor-pointer"
                    accept="image/*"
                    id="book_img"
                    onChange={handleBookImageChange}
                  />
                  <span className="text-xs text-gray-400">Max size: 5MB</span>
                  {errors.imgBook && (
                    <span className="text-xs text-red-500">
                      {errors.imgBook}
                    </span>
                  )}
                </div>
              </div>
              <div className="img_bg_and_input_book flex flex-col gap-3">
                {imgBgBook ? (
                  <img
                    className="w-38.25 h-53.75 shadow-2xl object-contain rounded-[10px]"
                    src={imgBgBook}
                    alt="Book background preview"
                  />
                ) : (
                  <img
                    className="w-38.25 h-53.75 shadow-2xl object-cover rounded-[10px]"
                    src={noImg}
                    alt="No image placeholder"
                  />
                )}
                <div className="label_and_input_book_bg_img flex flex-col gap-1">
                  <label
                    htmlFor="book_bg_img"
                    className="text-[15px] text-[gray] cursor-pointer hover:text-[#20ACFF] transition-colors"
                  >
                    Book Background Image *
                  </label>
                  <input
                    type="file"
                    className="rounded-[5px] max-w-55 outline-none px-3 shadow-xl py-1 bg-white cursor-pointer"
                    accept="image/*"
                    id="book_bg_img"
                    onChange={handleBookBgImageChange}
                  />
                  <span className="text-xs text-gray-400">Max size: 5MB</span>
                  {errors.imgBgBook && (
                    <span className="text-xs text-red-500">
                      {errors.imgBgBook}
                    </span>
                  )}
                </div>
              </div>
            </div>

            <div className="labels_select_and_inputs_block flex-1">
              <div className="first_block grid sm:grid-cols-1 md:grid-cols-2 gap-6">
                <div className="label_input_book_name flex flex-col gap-2">
                  <label
                    htmlFor="book_name"
                    className="cursor-pointer text-[15px] font-500"
                  >
                    Book Title *
                  </label>
                  <TextField
                    id="book_name"
                    label="Name of Book"
                    variant="outlined"
                    value={bookName}
                    onChange={handleBookNameChange}
                    error={!!errors.bookName}
                    helperText={errors.bookName}
                    required
                    fullWidth
                  />
                </div>

                <div className="label_select_book_category flex flex-col gap-2">
                  <label
                    htmlFor="category"
                    className="cursor-pointer text-[15px] font-500"
                  >
                    Category *
                  </label>
                  <FormControl
                    fullWidth
                    required
                    error={!!errors.categoryValue}
                  >
                    <InputLabel id="category-label">Category</InputLabel>
                    <Select
                      labelId="category-label"
                      id="category"
                      label="Category"
                      value={categoryValue}
                      onChange={handleCategoryChange}
                      disabled={loadingCategories}
                    >
                      <MenuItem value="">
                        <em>Select a category</em>
                      </MenuItem>
                      {loadingCategories ? (
                        <MenuItem disabled>Loading categories...</MenuItem>
                      ) : (
                        categories.map((category: any) => (
                          <MenuItem
                            key={category.id}
                            value={category.filterName}
                          >
                            {category.filterName}
                          </MenuItem>
                        ))
                      )}
                      <MenuItem value="Finance">Finance</MenuItem>
                    </Select>
                    {errors.categoryValue && (
                      <span className="text-xs text-red-500 mt-1">
                        {errors.categoryValue}
                      </span>
                    )}
                  </FormControl>
                </div>

                <div className="label_input_author_name flex flex-col gap-2">
                  <label
                    htmlFor="author_name"
                    className="cursor-pointer text-[15px] font-500"
                  >
                    Author *
                  </label>
                  <TextField
                    id="author_name"
                    label="Author Name"
                    variant="outlined"
                    value={authorName}
                    onChange={handleAuthorNameChange}
                    error={!!errors.authorName}
                    helperText={errors.authorName}
                    required
                    fullWidth
                  />
                </div>

                <div className="label_input_publication_year flex flex-col gap-2">
                  <label
                    htmlFor="publication_year"
                    className="cursor-pointer text-[15px] font-500"
                  >
                    Publication Year *
                  </label>
                  <TextField
                    id="publication_year"
                    label="Publication Year"
                    variant="outlined"
                    type="number"
                    value={publicationYear}
                    onChange={handlePublicationYearChange}
                    error={!!errors.publicationYear}
                    helperText={errors.publicationYear}
                    inputProps={{ min: 1000, max: new Date().getFullYear() }}
                    required
                    fullWidth
                  />
                </div>

                <div className="label_input_page_size flex flex-col gap-2">
                  <label
                    htmlFor="page-size"
                    className="cursor-pointer text-[15px] font-500"
                  >
                    Page Count *
                  </label>
                  <TextField
                    id="page-size"
                    label="Page Count"
                    variant="outlined"
                    type="number"
                    value={pageSize}
                    onChange={handlePageSizeChange}
                    error={!!errors.pageSize}
                    helperText={errors.pageSize}
                    inputProps={{ min: 1 }}
                    required
                    fullWidth
                  />
                </div>

                <div className="label_input_language flex flex-col gap-2">
                  <label
                    htmlFor="language"
                    className="cursor-pointer text-[15px] font-500"
                  >
                    Language *
                  </label>
                  <TextField
                    id="language"
                    label="Language"
                    variant="outlined"
                    value={language}
                    onChange={handleLanguageChange}
                    error={!!errors.language}
                    helperText={errors.language}
                    required
                    fullWidth
                    placeholder="e.g., English, Spanish, French"
                  />
                </div>

                <div className="label_input_available_copies flex flex-col gap-2">
                  <label
                    htmlFor="available-copies"
                    className="cursor-pointer text-[15px] font-500"
                  >
                    Available Copies *
                  </label>
                  <TextField
                    id="available-copies"
                    label="Available Copies"
                    variant="outlined"
                    type="number"
                    value={availableCopies}
                    onChange={handleAvailableCopiesChange}
                    error={!!errors.availableCopies}
                    helperText={errors.availableCopies}
                    inputProps={{ min: 0 }}
                    required
                    fullWidth
                  />
                </div>
              </div>

              <div className="second_block flex flex-col gap-2 mt-6">
                <label htmlFor="book_info" className="text-[15px] font-500">
                  Summary
                </label>
                <textarea
                  id="book_info"
                  placeholder="Write a brief summary of the book..."
                  className="outline-none border-2 border-[#DFEAF2] rounded-[15px] p-3 h-40 resize-none focus:border-[#20ACFF] transition-colors"
                  value={description}
                  onChange={(event: React.ChangeEvent<HTMLTextAreaElement>) => {
                    setDescription(event.target.value);
                  }}
                ></textarea>
                <span className="text-xs text-gray-400">
                  {description.length} characters
                </span>
              </div>

              <div className="block_btn_submit flex gap-4 mt-6 sm:flex-col md:flex-row">
                <button
                  type="button"
                  className="btn_cancel bg-gray-500 px-6 py-2 rounded-[15px] cursor-pointer text-[#FFFFFF] text-[19px] font-500 hover:bg-gray-600 transition-colors sm:w-full"
                  onClick={handleCancel}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn_submit bg-[#20ACFF] px-6 py-2 rounded-[15px] cursor-pointer text-[#FFFFFF] text-[19px] font-500 hover:bg-[#0d8ae0] transition-colors sm:w-full disabled:opacity-50"
                  disabled={loading}
                >
                  {loading ? (
                    <CircularProgress size={24} color="inherit" />
                  ) : (
                    "Submit"
                  )}
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>

      {/* Confirmation Dialog */}
      <Dialog
        open={showConfirmDialog}
        onClose={() => setShowConfirmDialog(false)}
        aria-labelledby="confirm-dialog-title"
        aria-describedby="confirm-dialog-description"
      >
        <DialogTitle id="confirm-dialog-title">Confirm Add Book</DialogTitle>
        <DialogContent>
          <p>Are you sure you want to add this book?</p>
          <div className="mt-4 p-3 bg-gray-50 rounded-lg">
            <p>
              <strong>Title:</strong> {bookName}
            </p>
            <p>
              <strong>Author:</strong> {authorName}
            </p>
            <p>
              <strong>Category:</strong> {categoryValue}
            </p>
            <p>
              <strong>Year:</strong> {publicationYear}
            </p>
            <p>
              <strong>Pages:</strong> {pageSize}
            </p>
            <p>
              <strong>Available Copies:</strong> {availableCopies}
            </p>
            <p>
              <strong>Language:</strong> {language}
            </p>
          </div>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowConfirmDialog(false)} color="primary">
            Cancel
          </Button>
          <Button
            onClick={addBook}
            color="primary"
            variant="contained"
            autoFocus
          >
            Confirm
          </Button>
        </DialogActions>
      </Dialog>

      {/* Loading Backdrop */}
      <Backdrop
        sx={{ color: "#fff", zIndex: (theme) => theme.zIndex.drawer + 1 }}
        open={loading}
      >
        <CircularProgress color="inherit" />
      </Backdrop>

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

export default AddBook;
