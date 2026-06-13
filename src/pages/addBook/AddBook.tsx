import { useState } from "react";
import noImg from "../../assets/no-img.jpg";
import TextField from "@mui/material/TextField";
import FormControl from "@mui/material/FormControl";
import InputLabel from "@mui/material/InputLabel";
import Select from "@mui/material/Select";
import MenuItem from "@mui/material/MenuItem";
import { useNavigate } from "react-router-dom";
import CircularProgress from "@mui/material/CircularProgress";
import Snackbar from "@mui/material/Snackbar";
import Alert from "@mui/material/Alert";

// 🔥 Firebase
import { addBook, getCategories } from "../../firebase/services";
import { useEffect } from "react";

const AddBook = () => {
  const navigate = useNavigate();
  const [imgBook, setImgBook] = useState<any>(null);
  const [imgBgBook, setImgBgBook] = useState<any>(null);
  const [imgBookFile, setImgBookFile] = useState<File | null>(null);
  const [imgBgBookFile, setImgBgBookFile] = useState<File | null>(null);
  const [categoryValue, setCategoryValue] = useState("");
  const [categories, setCategories] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [loadingCategories, setLoadingCategories] = useState(false);

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
    loadCategories();
  }, []);

  async function loadCategories() {
    setLoadingCategories(true);
    try {
      const data = await getCategories();
      console.log("Loaded categories:", data);
      setCategories(data);
    } catch (error) {
      console.error("Error loading categories:", error);
      showSnackbar("Failed to load categories", "error");
    } finally {
      setLoadingCategories(false);
    }
  }

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
        if (!imgBookFile) {
          error = "Book cover image is required";
        } else if (!imgBookFile.type.startsWith("image/")) {
          error = "Please select an image file";
        } else if (imgBookFile.size > 5 * 1024 * 1024) {
          error = "Image size should be less than 5MB";
        }
        break;

      case "imgBgBook":
        if (!imgBgBookFile) {
          error = "Background image is required";
        } else if (!imgBgBookFile.type.startsWith("image/")) {
          error = "Please select an image file";
        } else if (imgBgBookFile.size > 5 * 1024 * 1024) {
          error = "Image size should be less than 5MB";
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
      if (!file.type.startsWith("image/")) {
        setErrors((prev) => ({
          ...prev,
          imgBook: "Please select an image file",
        }));
        return;
      }
      if (file.size > 5 * 1024 * 1024) {
        setErrors((prev) => ({
          ...prev,
          imgBook: "Image size should be less than 5MB",
        }));
        return;
      }
      setImgBookFile(file);
      setErrors((prev) => ({ ...prev, imgBook: "" }));
      const reader = new FileReader();
      reader.onload = (e: any) => setImgBook(e.target.result);
      reader.readAsDataURL(file);
    }
  };

  const handleBookBgImageChange = (event: any) => {
    const file = event.target.files[0];
    if (file) {
      if (!file.type.startsWith("image/")) {
        setErrors((prev) => ({
          ...prev,
          imgBgBook: "Please select an image file",
        }));
        return;
      }
      if (file.size > 5 * 1024 * 1024) {
        setErrors((prev) => ({
          ...prev,
          imgBgBook: "Image size should be less than 5MB",
        }));
        return;
      }
      setImgBgBookFile(file);
      setErrors((prev) => ({ ...prev, imgBgBook: "" }));
      const reader = new FileReader();
      reader.onload = (e: any) => setImgBgBook(e.target.result);
      reader.readAsDataURL(file);
    }
  };

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

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

      await addBook(
        bookData,
        imgBookFile || undefined,
        imgBgBookFile || undefined,
      );

      showSnackbar("Book added successfully!", "success");
      setTimeout(() => {
        navigate("/dashboard/books");
      }, 2000);
    } catch (error: any) {
      console.error(error);
      showSnackbar("Error adding book: " + error.message, "error");
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

  return (
    <>
      <div className="add_book_component px-4 py-4">
        <div className="add_book_component_block max-w-360 mx-auto">
          <form
            onSubmit={handleSubmit}
            className="form_add_book flex sm:flex-col lg:flex-row lg:justify-center lg:items-end gap-10"
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
                    accept="image/*"
                    className="rounded-[5px] max-w-55 outline-none px-3 shadow-xl py-1 bg-white cursor-pointer"
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
                    accept="image/*"
                    className="rounded-[5px] max-w-55 outline-none px-3 shadow-xl py-1 bg-white cursor-pointer"
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
                    htmlFor="category"
                    className="cursor-pointer text-[15px] font-500"
                  >
                    Category *
                  </label>
                  <FormControl fullWidth required error={!!errors.category}>
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
                      ) : categories.length === 0 ? (
                        <MenuItem disabled>No categories found</MenuItem>
                      ) : (
                        categories.map((cat) => (
                          <MenuItem key={cat.id} value={cat.filterName}>
                            {cat.filterName}
                          </MenuItem>
                        ))
                      )}
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
                    htmlFor="author_name"
                    className="cursor-pointer text-[15px] font-500"
                  >
                    Author *
                  </label>
                  <TextField
                    id="author_name"
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
                <label
                  htmlFor="book_info"
                  className="cursor-pointer text-[15px] font-500"
                >
                  Summary Book *
                </label>
                <textarea
                  id="book_info"
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
                  disabled={isLoading}
                  className={`btn_submit bg-[#20ACFF] px-6 py-2 rounded-[15px] cursor-pointer text-[#FFFFFF] text-[19px] font-500 hover:bg-[#0d8ae0] transition-colors sm:w-full disabled:opacity-50 flex items-center justify-center gap-2`}
                >
                  {isLoading ? (
                    <>
                      <CircularProgress size={20} color="inherit" /> Saving...
                    </>
                  ) : (
                    "Submit"
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

export default AddBook;
