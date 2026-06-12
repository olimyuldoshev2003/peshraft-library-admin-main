import { useState, useEffect } from "react";
import noImg from "../../assets/no-img.jpg";
import TextField from "@mui/material/TextField";
import FormControl from "@mui/material/FormControl";
import InputLabel from "@mui/material/InputLabel";
import Select from "@mui/material/Select";
import MenuItem from "@mui/material/MenuItem";
import { useNavigate, useLocation } from "react-router-dom";
import CircularProgress from "@mui/material/CircularProgress";
import Snackbar from "@mui/material/Snackbar";
import Alert from "@mui/material/Alert";

// 🔥 Firebase
import {
  getBookById,
  updateBook,
  getCategories,
} from "../../firebase/services";

const EditBook = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const bookId = (location.state as any)?.bookId;

  const [imgBook, setImgBook] = useState<any>(null);
  const [imgBgBook, setImgBgBook] = useState<any>(null);
  const [imgBookFile, setImgBookFile] = useState<File | null>(null);
  const [imgBgBookFile, setImgBgBookFile] = useState<File | null>(null);
  const [categoryValue, setCategoryValue] = useState("");
  const [categories, setCategories] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingBook, setIsLoadingBook] = useState(true);
  const [existingImageUrl, setExistingImageUrl] = useState<string | null>(null);
  const [existingBgImageUrl, setExistingBgImageUrl] = useState<string | null>(
    null,
  );

  // Snackbar state
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: "",
    severity: "error" as "error" | "success" | "warning" | "info",
  });

  // Validation errors for ALL fields
  const [errors, setErrors] = useState({
    title: "",
    author: "",
    category: "",
    year: "",
    bookPage: "",
    availableCopies: "",
    language: "",
    imgBook: "",
    imgBgBook: "",
    description: "",
  });

  // Form fields
  const [title, setTitle] = useState("");
  const [author, setAuthor] = useState("");
  const [year, setYear] = useState("");
  const [bookPage, setBookPage] = useState("");
  const [language, setLanguage] = useState("");
  const [availableCopies, setAvailableCopies] = useState("");
  const [description, setDescription] = useState("");

  const showSnackbar = (
    message: string,
    severity: "error" | "success" | "warning" | "info",
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

  useEffect(() => {
    getCategories().then(setCategories);

    if (bookId) {
      // 🔥 Load existing book from Firebase
      getBookById(bookId).then((book: any) => {
        if (book) {
          setTitle(book.title || "");
          setAuthor(book.author || "");
          setYear(book.year?.toString() || "");
          setBookPage((book.bookPage || book.book_page)?.toString() || "");
          setLanguage(book.language || "");
          setAvailableCopies(book.available_copies?.toString() || "");
          setDescription(book.description || "");
          setCategoryValue(book.category || "");
          setImgBook(book.image_url || null);
          setImgBgBook(book.bg_image_url || null);
          setExistingImageUrl(book.image_url || null);
          setExistingBgImageUrl(book.bg_image_url || null);
        }
        setIsLoadingBook(false);
      });
    } else {
      setIsLoadingBook(false);
    }
  }, [bookId]);

  // Validate single field
  const validateField = (name: string, value: any) => {
    let error = "";

    switch (name) {
      case "title":
        if (!value || !value.trim()) {
          error = "Book title is required";
        } else if (value.trim().length < 2) {
          error = "Book title must be at least 2 characters";
        } else if (value.trim().length > 200) {
          error = "Book title must be less than 200 characters";
        }
        break;

      case "author":
        if (!value || !value.trim()) {
          error = "Author name is required";
        } else if (value.trim().length < 2) {
          error = "Author name must be at least 2 characters";
        } else if (value.trim().length > 100) {
          error = "Author name must be less than 100 characters";
        }
        break;

      case "category":
        if (!value) {
          error = "Category is required";
        }
        break;

      case "year":
        if (!value) {
          error = "Publication year is required";
        } else {
          const yearNum = parseInt(value);
          const currentYear = new Date().getFullYear();
          if (isNaN(yearNum) || yearNum < 1000 || yearNum > currentYear) {
            error = `Publication year must be between 1000 and ${currentYear}`;
          }
        }
        break;

      case "bookPage":
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

      case "language":
        if (!value || !value.trim()) {
          error = "Language is required";
        } else if (value.trim().length < 2) {
          error = "Language must be at least 2 characters";
        } else if (value.trim().length > 50) {
          error = "Language name must be less than 50 characters";
        }
        break;

      case "imgBook":
        // Image is required - either existing or new file
        if (!existingImageUrl && !imgBookFile) {
          error = "Book image is required";
        } else if (imgBookFile && imgBookFile.size) {
          if (!imgBookFile.type.startsWith("image/")) {
            error = "Please select an image file";
          } else if (imgBookFile.size > 5 * 1024 * 1024) {
            error = "Image size should be less than 5MB";
          }
        }
        break;

      case "imgBgBook":
        // Background image is required - either existing or new file
        if (!existingBgImageUrl && !imgBgBookFile) {
          error = "Background image is required";
        } else if (imgBgBookFile && imgBgBookFile.size) {
          if (!imgBgBookFile.type.startsWith("image/")) {
            error = "Please select an image file";
          } else if (imgBgBookFile.size > 5 * 1024 * 1024) {
            error = "Image size should be less than 5MB";
          }
        }
        break;

      case "description":
        if (!value || !value.trim()) {
          error = "Description is required";
        } else if (value.trim().length < 10) {
          error = "Description must be at least 10 characters";
        } else if (value.trim().length > 5000) {
          error = "Description must be less than 5000 characters";
        }
        break;

      default:
        break;
    }

    setErrors((prev) => ({ ...prev, [name]: error }));
    return error === "";
  };

  // Validate all fields before submit
  const validateAllFields = () => {
    const validations = [
      validateField("title", title),
      validateField("author", author),
      validateField("category", categoryValue),
      validateField("year", year),
      validateField("bookPage", bookPage),
      validateField("availableCopies", availableCopies),
      validateField("language", language),
      validateField("imgBook", imgBookFile),
      validateField("imgBgBook", imgBgBookFile),
      validateField("description", description),
    ];
    return validations.every((v) => v === true);
  };

  const handleBookImageChange = (event: any) => {
    const file = event.target.files[0];
    if (file) {
      // Validate file type
      if (!file.type.startsWith("image/")) {
        setErrors((prev) => ({
          ...prev,
          imgBook: "Please select an image file",
        }));
        return;
      }
      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        setErrors((prev) => ({
          ...prev,
          imgBook: "Image size should be less than 5MB",
        }));
        return;
      }
      setImgBookFile(file);
      setImgBook(null);
      setErrors((prev) => ({ ...prev, imgBook: "" }));
      const reader = new FileReader();
      reader.onload = (e: any) => setImgBook(e.target.result);
      reader.readAsDataURL(file);
    }
  };

  const handleBookBgImageChange = (event: any) => {
    const file = event.target.files[0];
    if (file) {
      // Validate file type
      if (!file.type.startsWith("image/")) {
        setErrors((prev) => ({
          ...prev,
          imgBgBook: "Please select an image file",
        }));
        return;
      }
      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        setErrors((prev) => ({
          ...prev,
          imgBgBook: "Image size should be less than 5MB",
        }));
        return;
      }
      setImgBgBookFile(file);
      setImgBgBook(null);
      setErrors((prev) => ({ ...prev, imgBgBook: "" }));
      const reader = new FileReader();
      reader.onload = (e: any) => setImgBgBook(e.target.result);
      reader.readAsDataURL(file);
    }
  };

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (!bookId) {
      showSnackbar("No book selected to edit.", "error");
      return;
    }

    // Validate all fields before submission
    if (!validateAllFields()) {
      showSnackbar("Please fix all validation errors", "error");
      return;
    }

    setIsLoading(true);
    try {
      const bookData = {
        title: title.trim(),
        author: author.trim(),
        category: categoryValue,
        year: year ? parseInt(year) : null,
        bookPage: bookPage ? parseInt(bookPage) : null,
        book_page: bookPage ? parseInt(bookPage) : null,
        language: language.trim(),
        available_copies: availableCopies ? parseInt(availableCopies) : 1,
        description: description.trim(),
      };

      // 🔥 Update in Firebase
      await updateBook(
        bookId,
        bookData,
        imgBookFile || undefined,
        imgBgBookFile || undefined,
      );
      showSnackbar("Book updated successfully!", "success");
      setTimeout(() => {
        navigate("/dashboard/books");
      }, 2000);
    } catch (error: any) {
      showSnackbar("Error updating book: " + error.message, "error");
    } finally {
      setIsLoading(false);
    }
  }

  // Handle field changes with REAL-TIME validation
  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setTitle(e.target.value);
    validateField("title", e.target.value);
  };

  const handleAuthorChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setAuthor(e.target.value);
    validateField("author", e.target.value);
  };

  const handleCategoryChange = (e: any) => {
    setCategoryValue(e.target.value);
    validateField("category", e.target.value);
  };

  const handleYearChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setYear(e.target.value);
    validateField("year", e.target.value);
  };

  const handleBookPageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setBookPage(e.target.value);
    validateField("bookPage", e.target.value);
  };

  const handleAvailableCopiesChange = (
    e: React.ChangeEvent<HTMLInputElement>,
  ) => {
    setAvailableCopies(e.target.value);
    validateField("availableCopies", e.target.value);
  };

  const handleLanguageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setLanguage(e.target.value);
    validateField("language", e.target.value);
  };

  const handleDescriptionChange = (
    e: React.ChangeEvent<HTMLTextAreaElement>,
  ) => {
    setDescription(e.target.value);
    validateField("description", e.target.value);
  };

  if (isLoadingBook) {
    return (
      <div className="flex justify-center items-center h-screen">
        <CircularProgress />
      </div>
    );
  }

  if (!bookId) {
    return (
      <div className="flex flex-col items-center justify-center h-screen gap-4">
        <h1 className="text-2xl text-gray-500">No book selected to edit.</h1>
        <button
          className="bg-[#20ACFF] px-5 py-2 rounded-[15px] text-white cursor-pointer hover:bg-[#0d8ae0] transition-colors"
          onClick={() => navigate("/dashboard/books")}
        >
          Go to Books
        </button>
      </div>
    );
  }

  return (
    <>
      <div className="edit_book_component px-4 py-4">
        <div className="edit_book_component_block max-w-360 mx-auto">
          <form
            className="form_edit_book flex sm:flex-col lg:flex-row lg:justify-center lg:items-end gap-10"
            onSubmit={handleSubmit}
          >
            <div className="block_img_book_and_bg_book_and_input_book_component flex sm:flex-row lg:flex-col sm:justify-center lg:justify-start sm:flex-wrap md:flex-nowrap gap-12">
              <div className="img_and_input_book flex flex-col gap-3">
                {imgBook ? (
                  <img
                    className="w-38.25 h-53.75 shadow-2xl object-contain rounded-[10px]"
                    src={imgBook}
                    alt="Book cover preview"
                  />
                ) : existingImageUrl ? (
                  <img
                    className="w-38.25 h-53.75 shadow-2xl object-cover rounded-[10px]"
                    src={existingImageUrl}
                    alt="Book cover"
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
                    htmlFor="edit_book_img"
                    className="text-[15px] text-[gray] cursor-pointer hover:text-[#20ACFF] transition-colors"
                  >
                    Book Image *
                  </label>
                  <input
                    type="file"
                    className="rounded-[5px] max-w-55 outline-none px-3 shadow-xl py-1 bg-white cursor-pointer"
                    accept="image/*"
                    id="edit_book_img"
                    onChange={handleBookImageChange}
                  />
                  <span className="text-xs text-gray-400">
                    Max size: 5MB (upload new to replace current)
                  </span>
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
                ) : existingBgImageUrl ? (
                  <img
                    className="w-38.25 h-53.75 shadow-2xl object-cover rounded-[10px]"
                    src={existingBgImageUrl}
                    alt="Book background"
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
                    htmlFor="edit_book_bg_img"
                    className="text-[15px] text-[gray] cursor-pointer hover:text-[#20ACFF] transition-colors"
                  >
                    Book Background Image *
                  </label>
                  <input
                    type="file"
                    className="rounded-[5px] max-w-55 outline-none px-3 shadow-xl py-1 bg-white cursor-pointer"
                    accept="image/*"
                    id="edit_book_bg_img"
                    onChange={handleBookBgImageChange}
                  />
                  <span className="text-xs text-gray-400">
                    Max size: 5MB (upload new to replace current)
                  </span>
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
                    htmlFor="edit_book_name"
                    className="cursor-pointer text-[15px] font-500"
                  >
                    Book Title *
                  </label>
                  <TextField
                    id="edit_book_name"
                    label="Name of Book"
                    variant="outlined"
                    value={title}
                    onChange={handleTitleChange}
                    error={!!errors.title}
                    helperText={errors.title}
                    required
                    fullWidth
                  />
                </div>

                <div className="label_select_book_category flex flex-col gap-2">
                  <label
                    htmlFor="edit_category"
                    className="cursor-pointer text-[15px] font-500"
                  >
                    Category *
                  </label>
                  <FormControl fullWidth required error={!!errors.category}>
                    <InputLabel id="edit-category-label">Category</InputLabel>
                    <Select
                      labelId="edit-category-label"
                      id="edit_category"
                      label="Category"
                      value={categoryValue}
                      onChange={handleCategoryChange}
                    >
                      <MenuItem value="">
                        <em>Select a category</em>
                      </MenuItem>
                      {categories.map((cat) => (
                        <MenuItem key={cat.id} value={cat.filterName}>
                          {cat.filterName}
                        </MenuItem>
                      ))}
                    </Select>
                    {errors.category && (
                      <span className="text-xs text-red-500 mt-1">
                        {errors.category}
                      </span>
                    )}
                  </FormControl>
                </div>

                <div className="label_input_author_name flex flex-col gap-2">
                  <label
                    htmlFor="edit_author_name"
                    className="cursor-pointer text-[15px] font-500"
                  >
                    Author *
                  </label>
                  <TextField
                    id="edit_author_name"
                    label="Author Name"
                    variant="outlined"
                    value={author}
                    onChange={handleAuthorChange}
                    error={!!errors.author}
                    helperText={errors.author}
                    required
                    fullWidth
                  />
                </div>

                <div className="label_input_publication_year flex flex-col gap-2">
                  <label
                    htmlFor="edit_publication_year"
                    className="cursor-pointer text-[15px] font-500"
                  >
                    Publication Year *
                  </label>
                  <TextField
                    id="edit_publication_year"
                    label="Publication Year"
                    variant="outlined"
                    type="number"
                    value={year}
                    onChange={handleYearChange}
                    error={!!errors.year}
                    helperText={errors.year}
                    inputProps={{ min: 1000, max: new Date().getFullYear() }}
                    required
                    fullWidth
                  />
                </div>

                <div className="label_input_page_size flex flex-col gap-2">
                  <label
                    htmlFor="edit_page-size"
                    className="cursor-pointer text-[15px] font-500"
                  >
                    Page Count *
                  </label>
                  <TextField
                    id="edit_page-size"
                    label="Page Count"
                    variant="outlined"
                    type="number"
                    value={bookPage}
                    onChange={handleBookPageChange}
                    error={!!errors.bookPage}
                    helperText={errors.bookPage}
                    inputProps={{ min: 1 }}
                    required
                    fullWidth
                  />
                </div>

                <div className="label_input_language flex flex-col gap-2">
                  <label
                    htmlFor="edit_language"
                    className="cursor-pointer text-[15px] font-500"
                  >
                    Language *
                  </label>
                  <TextField
                    id="edit_language"
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
                    htmlFor="edit_available-copies"
                    className="cursor-pointer text-[15px] font-500"
                  >
                    Available Copies *
                  </label>
                  <TextField
                    id="edit_available-copies"
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
                <label
                  htmlFor="edit_book_info"
                  className="text-[15px] font-500"
                >
                  Summary
                </label>
                <textarea
                  id="edit_book_info"
                  placeholder="Write a brief summary of the book..."
                  className="outline-none border-2 border-[#DFEAF2] rounded-[15px] p-3 h-40 resize-none focus:border-[#20ACFF] transition-colors"
                  value={description}
                  onChange={handleDescriptionChange}
                ></textarea>
                {errors.description && (
                  <span className="text-xs text-red-500">
                    {errors.description}
                  </span>
                )}
                <span className="text-xs text-gray-400">
                  {description.length} characters
                </span>
              </div>

              <div className="block_btn_submit flex gap-4 mt-6 sm:flex-col md:flex-row">
                <button
                  type="button"
                  className="btn_cancel bg-gray-500 px-6 py-2 rounded-[15px] cursor-pointer text-[#FFFFFF] text-[19px] font-500 hover:bg-gray-600 transition-colors sm:w-full"
                  onClick={() => navigate("/dashboard/books")}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn_submit bg-[#20ACFF] px-6 py-2 rounded-[15px] cursor-pointer text-[#FFFFFF] text-[19px] font-500 hover:bg-[#0d8ae0] transition-colors sm:w-full disabled:opacity-50"
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <CircularProgress size={24} color="inherit" />
                  ) : (
                    "Update Book"
                  )}
                </button>
              </div>
            </div>
          </form>
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

export default EditBook;
