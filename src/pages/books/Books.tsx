import { HiOutlineSearch } from "react-icons/hi";
import noImg from "../../assets/no-img.jpg";
import TuneIcon from "@mui/icons-material/Tune";
import { LuPlus } from "react-icons/lu";
import { useEffect, useMemo, useState, useCallback, useRef } from "react";
import { alpha, styled } from "@mui/material/styles";
import Box from "@mui/material/Box";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell, { tableCellClasses } from "@mui/material/TableCell";
import TableContainer from "@mui/material/TableContainer";
import TableHead from "@mui/material/TableHead";
import TablePagination from "@mui/material/TablePagination";
import TableRow from "@mui/material/TableRow";
import TableSortLabel from "@mui/material/TableSortLabel";
import Toolbar from "@mui/material/Toolbar";
import Typography from "@mui/material/Typography";
import Paper from "@mui/material/Paper";
import { visuallyHidden } from "@mui/utils";
import { IoClose } from "react-icons/io5";
import { AiFillEdit } from "react-icons/ai";
import Dialog from "@mui/material/Dialog";
import DialogTitle from "@mui/material/DialogTitle";
import { MdDelete, MdOutlineClose } from "react-icons/md";
import { useNavigate } from "react-router-dom";
import TextField from "@mui/material/TextField";
import CircularProgress from "@mui/material/CircularProgress";
import Backdrop from "@mui/material/Backdrop";
import Alert from "@mui/material/Alert";
import Snackbar from "@mui/material/Snackbar";

// 🔥 Firebase
import {
  getBooks,
  getCategories,
  addCategory,
  updateCategory,
  deleteCategory,
  deleteBook,
} from "../../firebase/services";
import { useAuth } from "../../context/AuthContext";
import DialogActions from "@mui/material/DialogActions";

type Order = "asc" | "desc";

const Books = () => {
  const navigate = useNavigate();
  const { adminProfile } = useAuth();

  const [order, setOrder] = useState<Order>("asc");
  const [orderBy, setOrderBy] = useState<any>("title");
  const [selected] = useState<readonly number[]>([]);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState<number>(17);
  const [modalFilter, setModalFilter] = useState(false);
  const [modalShowAllFilters, setModalShowAllFilters] =
    useState<boolean>(false);
  const [modalFilterOptions, setModalFilterOptions] = useState(false);
  const [modalDeleteBook, setModalDeleteBook] = useState(false);
  const [selectedBookId, setSelectedBookId] = useState<string | null>(null);
  const [modalFilterAdd, setModalFilterAdd] = useState(false);
  const [modalFilterEdit, setModalFilterEdit] = useState(false);
  const [modalFilterDelete, setModalFilterDelete] = useState(false);
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(
    null,
  );
  const [newFilterName, setNewFilterName] = useState("");
  const [editFilterName, setEditFilterName] = useState("");
  const [allBooks, setAllBooks] = useState<any[]>([]);
  const [searchInpValue, setSearchInpValue] = useState("");
  const [debouncedSearchValue, setDebouncedSearchValue] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [isFiltering, setIsFiltering] = useState(false);
  const [loadingBooks, setLoadingBooks] = useState(false);
  const [loadingAction, setLoadingAction] = useState(false);
  const [filtersOrCategories, setFiltersOrCategories] = useState<any[]>([]);
  const [loadingFiltersOrCategories, setLoadingFiltersOrCategories] =
    useState(false);

  // New state for selected filters
  const [selectedFilters, setSelectedFilters] = useState<string[]>([]);
  const [tempSelectedFilters, setTempSelectedFilters] = useState<string[]>([]);

  // Debounce timeout ref
  const debounceTimeoutRef = useRef<any>(null);
  const filterTimeoutRef = useRef<any>(null);

  // Validation errors for filters
  const [filterErrors, setFilterErrors] = useState({
    addFilter: "",
    editFilter: "",
  });

  // Snackbar states
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: "",
    severity: "success" as "success" | "error" | "warning" | "info",
  });

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

  // Debounced search handler - spinner only shows AFTER debounce
  const handleSearchChange = useCallback((value: string) => {
    setSearchInpValue(value);

    if (debounceTimeoutRef.current) {
      clearTimeout(debounceTimeoutRef.current);
    }

    debounceTimeoutRef.current = setTimeout(() => {
      // Only show spinner when actually processing the search
      setIsSearching(true);
      setDebouncedSearchValue(value);
      setPage(0);

      // Hide spinner after a short delay (simulating processing time)
      setTimeout(() => setIsSearching(false), 300);
    }, 500);
  }, []);

  // Filter handler with loading indicator
  const applyFiltersWithLoading = useCallback(() => {
    setIsFiltering(true);
    setSelectedFilters(tempSelectedFilters);
    setModalFilter(false);
    setModalShowAllFilters(false);
    showScrollbar();
    showSnackbar(`Applied ${tempSelectedFilters.length} filter(s)`, "success");

    if (filterTimeoutRef.current) {
      clearTimeout(filterTimeoutRef.current);
    }

    filterTimeoutRef.current = setTimeout(() => {
      setIsFiltering(false);
    }, 500);
  }, [tempSelectedFilters]);

  // Clear timeout on unmount
  useEffect(() => {
    return () => {
      if (debounceTimeoutRef.current) {
        clearTimeout(debounceTimeoutRef.current);
      }
      if (filterTimeoutRef.current) {
        clearTimeout(filterTimeoutRef.current);
      }
    };
  }, []);

  // Reset page when filters or search changes
  useEffect(() => {
    setPage(0);
  }, [selectedFilters, debouncedSearchValue]);

  // Validate filter name
  const validateFilterName = (name: string, isEdit: boolean = false) => {
    if (!name || !name.trim()) {
      if (isEdit) {
        setFilterErrors((prev) => ({
          ...prev,
          editFilter: "Filter name is required",
        }));
      } else {
        setFilterErrors((prev) => ({
          ...prev,
          addFilter: "Filter name is required",
        }));
      }
      return false;
    }

    if (name.trim().length < 2) {
      if (isEdit) {
        setFilterErrors((prev) => ({
          ...prev,
          editFilter: "Filter name must be at least 2 characters",
        }));
      } else {
        setFilterErrors((prev) => ({
          ...prev,
          addFilter: "Filter name must be at least 2 characters",
        }));
      }
      return false;
    }

    if (name.trim().length > 50) {
      if (isEdit) {
        setFilterErrors((prev) => ({
          ...prev,
          editFilter: "Filter name must be less than 50 characters",
        }));
      } else {
        setFilterErrors((prev) => ({
          ...prev,
          addFilter: "Filter name must be less than 50 characters",
        }));
      }
      return false;
    }

    const isDuplicate = filtersOrCategories.some(
      (cat) =>
        cat.filterName.toLowerCase() === name.trim().toLowerCase() &&
        (isEdit ? cat.id !== selectedCategoryId : true),
    );

    if (isDuplicate) {
      if (isEdit) {
        setFilterErrors((prev) => ({
          ...prev,
          editFilter: "Filter name already exists",
        }));
      } else {
        setFilterErrors((prev) => ({
          ...prev,
          addFilter: "Filter name already exists",
        }));
      }
      return false;
    }

    if (isEdit) {
      setFilterErrors((prev) => ({ ...prev, editFilter: "" }));
    } else {
      setFilterErrors((prev) => ({ ...prev, addFilter: "" }));
    }
    return true;
  };

  function descendingComparator<T>(a: T, b: T, orderBy: keyof T) {
    const aVal =
      typeof a[orderBy] === "string"
        ? (a[orderBy] as any).toLowerCase()
        : a[orderBy];
    const bVal =
      typeof b[orderBy] === "string"
        ? (b[orderBy] as any).toLowerCase()
        : b[orderBy];
    if (bVal < aVal) return -1;
    if (bVal > aVal) return 1;
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

  // Filter books based on selected categories
  const filteredBooks = useMemo(() => {
    if (selectedFilters.length === 0) {
      return allBooks;
    }
    return allBooks.filter((book) => selectedFilters.includes(book.category));
  }, [allBooks, selectedFilters]);

  // Apply search filter on top of category filter
  const searchedAndFilteredBooks = useMemo(() => {
    if (!debouncedSearchValue.trim()) {
      return filteredBooks;
    }
    const lowerSearch = debouncedSearchValue.toLowerCase();
    return filteredBooks.filter(
      (book) =>
        book.title?.toLowerCase().includes(lowerSearch) ||
        book.author?.toLowerCase().includes(lowerSearch),
    );
  }, [filteredBooks, debouncedSearchValue]);

  const visibleRows = useMemo(
    () =>
      [...searchedAndFilteredBooks]
        .sort(getComparator(order, orderBy))
        .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage),
    [order, orderBy, page, rowsPerPage, searchedAndFilteredBooks],
  );

  const headCells: any[] = [
    {
      id: "image_url",
      label: "Image",
      sortable: false,
      disablePadding: true,
    },
    {
      id: "title",
      label: "Book Title",
      sortable: true,
      disablePadding: true,
    },
    {
      id: "author",
      label: "Author",
      sortable: true,
      disablePadding: false,
    },
    {
      id: "category",
      label: "Category",
      sortable: true,
      disablePadding: false,
    },
    {
      id: "bookPage",
      label: "Book Page",
      sortable: true,
      disablePadding: false,
    },
    {
      id: "year",
      label: "Year",
      sortable: true,
      disablePadding: false,
    },
    {
      id: "available_copies",
      label: "Available Copies",
      sortable: true,
      disablePadding: false,
    },
    {
      id: "action",
      label: "Action",
      sortable: false,
      disablePadding: false,
    },
  ];

  const StyledTableCell = styled(TableCell)(({ theme }) => ({
    [`&.${tableCellClasses.head}`]: {
      backgroundColor: theme.palette.common.black,
      color: theme.palette.common.white,
      whiteSpace: "nowrap",
    },
    [`&.${tableCellClasses.body}`]: {
      fontSize: 14,
      whiteSpace: "nowrap",
    },
  }));
  const StyledTableRow = styled(TableRow)(({ theme }) => ({
    "&:nth-of-type(odd)": {
      backgroundColor: theme.palette.action.hover,
    },
    "&:last-child td, &:last-child th": {
      border: 0,
    },
  }));

  const handleRequestSort = (_: React.MouseEvent<unknown>, property: any) => {
    const isAsc = orderBy === property && order === "asc";
    setOrder(isAsc ? "desc" : "asc");
    setOrderBy(property);
  };

  function removeScrollbar() {
    document.body.classList.add("scroll_hidden_modal_filter_without_overlay");
    document.body.classList.remove(
      "scroll_visible_modal_filter_without_overlay",
    );
  }

  function showScrollbar() {
    document.body.classList.add("scroll_visible_modal_filter_without_overlay");
    document.body.classList.remove(
      "scroll_hidden_modal_filter_without_overlay",
    );
  }

  async function loadBooks() {
    setLoadingBooks(true);
    try {
      const data = await getBooks("");
      setAllBooks(data);
    } catch (error) {
      console.error(error);
      showSnackbar("Failed to load books", "error");
    } finally {
      setLoadingBooks(false);
    }
  }

  async function loadCategories() {
    setLoadingFiltersOrCategories(true);
    try {
      const data = await getCategories();
      setFiltersOrCategories(data);
    } catch (error) {
      console.error(error);
      showSnackbar("Failed to load categories", "error");
    } finally {
      setLoadingFiltersOrCategories(false);
    }
  }

  useEffect(() => {
    loadCategories();
  }, []);

  useEffect(() => {
    loadBooks();
  }, []);

  async function handleDeleteBook() {
    if (!selectedBookId) return;
    setLoadingAction(true);
    try {
      await deleteBook(selectedBookId);
      setModalDeleteBook(false);
      setSelectedBookId(null);
      await loadBooks();
      showSnackbar("Book deleted successfully!", "success");
    } catch (error) {
      console.error(error);
      showSnackbar("Error deleting book", "error");
    } finally {
      setLoadingAction(false);
    }
  }

  const handleAddFilterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateFilterName(newFilterName, false)) {
      return;
    }

    setLoadingAction(true);
    try {
      await addCategory(newFilterName.trim());
      setModalFilterAdd(false);
      setNewFilterName("");
      await loadCategories();
      showSnackbar("Filter added successfully!", "success");
    } catch (error) {
      showSnackbar("Error adding filter", "error");
    } finally {
      setLoadingAction(false);
    }
  };

  const handleEditFilterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCategoryId) return;

    if (!validateFilterName(editFilterName, true)) {
      return;
    }

    setLoadingAction(true);
    try {
      await updateCategory(selectedCategoryId, editFilterName.trim());
      setModalFilterEdit(false);
      setSelectedCategoryId(null);
      setEditFilterName("");
      await loadCategories();
      showSnackbar("Filter updated successfully!", "success");
    } catch (error) {
      showSnackbar("Error updating filter", "error");
    } finally {
      setLoadingAction(false);
    }
  };

  async function handleDeleteFilter() {
    if (!selectedCategoryId) return;
    setLoadingAction(true);
    try {
      await deleteCategory(selectedCategoryId);
      setModalFilterDelete(false);
      setSelectedCategoryId(null);
      await loadCategories();
      showSnackbar("Filter deleted successfully!", "success");
    } catch (error) {
      showSnackbar("Error deleting filter", "error");
    } finally {
      setLoadingAction(false);
    }
  }

  const handleFilterChange = (categoryName: string, checked: boolean) => {
    if (checked) {
      setTempSelectedFilters([...tempSelectedFilters, categoryName]);
    } else {
      setTempSelectedFilters(
        tempSelectedFilters.filter((f) => f !== categoryName),
      );
    }
  };

  const applyFilters = () => {
    applyFiltersWithLoading();
  };

  const clearFilters = () => {
    setIsFiltering(true);
    setSelectedFilters([]);
    setTempSelectedFilters([]);
    showSnackbar("All filters cleared", "info");
    setTimeout(() => setIsFiltering(false), 300);
  };

  const openFilterModal = () => {
    setTempSelectedFilters([...selectedFilters]);
    setModalFilter(true);
    removeScrollbar();
  };

  function EnhancedTableHead({ order, orderBy, onRequestSort }: any) {
    const createSortHandler =
      (property: any) => (event: React.MouseEvent<unknown>) =>
        onRequestSort(event, property);
    return (
      <TableHead>
        <TableRow>
          {headCells.map((headCell) => (
            <TableCell
              key={headCell.id}
              padding={headCell.disablePadding ? "none" : "normal"}
              sortDirection={orderBy === headCell.id ? order : false}
            >
              {headCell.sortable !== false ? (
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
              ) : (
                headCell.label
              )}
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
          Books{" "}
          {selectedFilters.length > 0 &&
            `(Filtered: ${selectedFilters.length} categor${selectedFilters.length > 1 ? "ies" : "y"})`}
          {(isSearching || isFiltering) && " (Loading...)"}
          {!isSearching &&
            !isFiltering &&
            debouncedSearchValue &&
            searchedAndFilteredBooks.length > 0 &&
            ` (${searchedAndFilteredBooks.length} result${searchedAndFilteredBooks.length !== 1 ? "s" : ""})`}
        </Typography>
        {selectedFilters.length > 0 && (
          <button
            onClick={clearFilters}
            className="text-red-500 hover:text-red-700 text-sm px-3 py-1 rounded border border-red-300 hover:border-red-500 transition-colors cursor-pointer"
            disabled={isFiltering}
          >
            {isFiltering ? "Clearing..." : "Clear Filters"}
          </button>
        )}
      </Toolbar>
    );
  }

  // Show backdrop when searching or filtering
  const showBackdrop = loadingBooks || isSearching || isFiltering;

  return (
    <>
      <div className="books_component p-4 max-w-360 mx-auto">
        <div className="header_books flex justify-between items-center gap-6">
          <div className="search_logo_and_search_input relative flex items-center flex-1 gap-4">
            <HiOutlineSearch size={24} className="absolute top-2.5 left-3" />
            <input
              type="search"
              className="inp_search outline-none shadow-[0_0_6px_gray] pl-12 pr-4 py-2 rounded-[30px] text-[18px] font-500 sm:w-full md:w-[90%] lg:w-[80%]"
              placeholder="Search by title or author..."
              value={searchInpValue}
              onChange={(e) => handleSearchChange(e.target.value)}
            />
            <div className="btn_filter_and_modal_filter_overlay_transparent_block md:relative flex flex-col">
              <button
                className="icons_filter_block shadow-[0_0_6px_gray] flex justify-center items-center p-2 rounded-[10px] cursor-pointer relative"
                onClick={openFilterModal}
                disabled={isFiltering}
              >
                <TuneIcon sx={{ fontSize: "26px" }} />
                {selectedFilters.length > 0 && (
                  <span className="absolute -top-1 -right-1 bg-blue-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                    {selectedFilters.length}
                  </span>
                )}
              </button>

              {/* Modal filter */}
              <div
                className={`modal_filter_transparent_overlay_main_block absolute sm:left-0 sm:w-full sm:top-13 md:top-13 md:-left-32 p-3 z-40 rounded-2xl duration-300 md:w-77.5 bg-white shadow-2xl ${modalFilter ? "pointer-events-auto opacity-100" : "pointer-events-none opacity-0"}`}
              >
                <div className="header_modal_filter flex justify-between items-center">
                  <h1 className="title_filter_modal text-[20px] font-500">
                    Filter Book
                  </h1>
                  <IoClose
                    size={31}
                    style={{ cursor: "pointer" }}
                    onClick={() => {
                      setModalFilter(false);
                      showScrollbar();
                    }}
                  />
                </div>
                <div className="section_modal_filter">
                  <div className="filter_by_category_block">
                    <h1 className="title_filter_by_category text-[#A1A1A1] text-[16px] font-400">
                      Category
                    </h1>
                    <div className="filter_by_category mt-1 grid grid-cols-2 gap-2">
                      {loadingFiltersOrCategories ? (
                        <div className="col-span-2 text-center py-4">
                          <CircularProgress size={24} />
                        </div>
                      ) : (
                        filtersOrCategories?.slice(0, 8)?.map((item: any) => (
                          <div
                            key={item.id}
                            className="flex items-center gap-2"
                          >
                            <input
                              type="checkbox"
                              id={`filter-${item.id}`}
                              className="outline-none cursor-pointer"
                              checked={tempSelectedFilters.includes(
                                item.filterName,
                              )}
                              onChange={(e) =>
                                handleFilterChange(
                                  item.filterName,
                                  e.target.checked,
                                )
                              }
                            />
                            <label
                              className="text-[#6C757D] text-[13px] font-400 cursor-pointer"
                              htmlFor={`filter-${item.id}`}
                            >
                              {item.filterName}
                            </label>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                  <div className="btns_show_filters_and_filter_options flex justify-between mt-3 px-5">
                    <button
                      className="show_filters cursor-pointer outline-none text-[14px] font-400 text-green-500"
                      onClick={() => {
                        setModalShowAllFilters(true);
                        setModalFilter(false);
                      }}
                    >
                      Show All Filters
                    </button>
                    <button
                      className="filter_options cursor-pointer outline-none text-[14px] font-400 text-green-500"
                      onClick={() => {
                        setModalFilterOptions(true);
                        setModalFilter(false);
                      }}
                    >
                      Filter Options
                    </button>
                  </div>
                  <div className="btn_submit_block flex justify-end gap-2 mt-2">
                    <button
                      className="btn_submit_filter cursor-pointer px-5 py-1 text-[#FFFFFF] text-[18px] font-500 bg-gray-500 rounded-[10px]"
                      onClick={() => {
                        setTempSelectedFilters([]);
                        setModalFilter(false);
                        showScrollbar();
                      }}
                    >
                      Reset
                    </button>
                    <button
                      className="btn_submit_filter cursor-pointer px-5 py-1 text-[#FFFFFF] text-[18px] font-500 bg-[#20ACFF] rounded-[10px]"
                      onClick={applyFilters}
                    >
                      Apply
                    </button>
                  </div>
                </div>
              </div>

              {/* Modal Show All Filters */}
              <Dialog
                open={modalShowAllFilters}
                onClose={() => {
                  setModalShowAllFilters(false);
                  showScrollbar();
                }}
                aria-labelledby="alert-dialog-title"
                aria-describedby="alert-dialog-description"
                maxWidth="md"
                fullWidth
              >
                <div className="modal_show_all_filters_block px-4 py-4">
                  <DialogTitle id="alert-dialog-title">
                    Filter by Category
                  </DialogTitle>
                  <div className="filter_by_category mt-1 grid sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
                    {loadingFiltersOrCategories ? (
                      <CircularProgress size={24} />
                    ) : (
                      filtersOrCategories?.map((item: any) => {
                        return (
                          <div
                            key={`${item.id}`}
                            className="flex items-center gap-2"
                          >
                            <input
                              type="checkbox"
                              id={`all-filter-${item.id}`}
                              className="outline-none cursor-pointer"
                              checked={tempSelectedFilters.includes(
                                item.filterName,
                              )}
                              onChange={(e) =>
                                handleFilterChange(
                                  item.filterName,
                                  e.target.checked,
                                )
                              }
                            />
                            <label
                              className="text-[#6C757D] text-[13px] font-400 cursor-pointer"
                              htmlFor={`all-filter-${item.id}`}
                            >
                              {item.filterName}
                            </label>
                          </div>
                        );
                      })
                    )}
                    {loadingFiltersOrCategories === false &&
                      filtersOrCategories.length === 0 && (
                        <h1 className="col-span-full text-center">
                          Filters not found
                        </h1>
                      )}
                  </div>
                  <DialogActions>
                    <button
                      className="btn_submit_filter cursor-pointer px-5 py-1 text-[#FFFFFF] text-[18px] font-500 bg-gray-500 rounded-[10px]"
                      onClick={() => {
                        setModalShowAllFilters(false);
                      }}
                    >
                      Cancel
                    </button>
                    <button
                      className="btn_submit_filter cursor-pointer px-5 py-1 text-[#FFFFFF] text-[18px] font-500 bg-[#20ACFF] rounded-[10px]"
                      onClick={applyFilters}
                    >
                      Apply Filters
                    </button>
                  </DialogActions>
                </div>
              </Dialog>

              {/* Modal Filter Options */}
              <Dialog
                open={modalFilterOptions}
                onClose={() => {
                  setModalFilterOptions(false);
                  showScrollbar();
                }}
                fullWidth
                maxWidth="sm"
              >
                <div className="modal_filter_options_block px-4 py-4">
                  <div className="header_modal_filter_options_block flex justify-between items-center mb-4">
                    <DialogTitle sx={{ p: 0 }}>Filter Options</DialogTitle>
                    <button
                      className="add_filter_btn flex items-center gap-1 bg-[#20ACFF] px-2 py-2 rounded-[10px] text-white text-[16px] font-500 cursor-pointer hover:bg-[#0d8ae0] transition-colors outline-none"
                      onClick={() => {
                        setModalFilterAdd(true);
                      }}
                    >
                      <LuPlus size={21} />
                    </button>
                  </div>
                  <div className="filter_functionalities_or_options">
                    <TableContainer>
                      <Table aria-label="customized table">
                        <TableHead>
                          <TableRow>
                            <StyledTableCell>Filter name</StyledTableCell>
                            <StyledTableCell align="right">
                              Action
                            </StyledTableCell>
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {loadingFiltersOrCategories ? (
                            <TableRow>
                              <TableCell colSpan={2} align="center">
                                <CircularProgress size={24} />
                              </TableCell>
                            </TableRow>
                          ) : filtersOrCategories.length === 0 ? (
                            <TableRow>
                              <TableCell colSpan={2} align="center">
                                <div className="text-center py-4 text-gray-400">
                                  Filters not found
                                </div>
                              </TableCell>
                            </TableRow>
                          ) : (
                            filtersOrCategories.map((cat: any) => (
                              <StyledTableRow key={cat.id}>
                                <StyledTableCell>
                                  {cat.filterName}
                                </StyledTableCell>
                                <StyledTableCell align="right">
                                  <div className="btn_func_block flex items-center gap-1.5 justify-end">
                                    <AiFillEdit
                                      size={27}
                                      className="cursor-pointer text-blue-600 hover:text-blue-800 duration-100"
                                      onClick={() => {
                                        setSelectedCategoryId(cat.id);
                                        setEditFilterName(cat.filterName);
                                        setFilterErrors((prev) => ({
                                          ...prev,
                                          editFilter: "",
                                        }));
                                        setModalFilterEdit(true);
                                      }}
                                    />
                                    <MdDelete
                                      size={27}
                                      className="cursor-pointer text-red-500 hover:text-red-600 duration-100"
                                      onClick={() => {
                                        setSelectedCategoryId(cat.id);
                                        setModalFilterDelete(true);
                                      }}
                                    />
                                  </div>
                                </StyledTableCell>
                              </StyledTableRow>
                            ))
                          )}
                        </TableBody>
                      </Table>
                    </TableContainer>
                  </div>
                </div>
              </Dialog>
            </div>
          </div>
          <div className="fullname_img_of_admin_and_admin_title sm:hidden md:flex items-center gap-3">
            <div className="fullname_of_user_and_admin_title">
              <h1 className="text-[22px] font-500">
                {adminProfile?.fullName || "Unknown"}
              </h1>
              <h1 className="text-[#808080] text-[15px] font-400 text-right">
                {adminProfile.is_main_admin === true ? "Main Admin" : "Admin"}
              </h1>
            </div>
            <img
              className="w-14 h-14 rounded-full object-cover"
              src={adminProfile?.image_url || noImg}
              alt=""
            />
          </div>
        </div>

        <div className="section_books mt-7">
          <div className="title_filter_btn_add__book_block flex justify-between items-center gap-2">
            <h1 className="title_filter text-[24px] font-medium">
              Manage Books
            </h1>
            <button
              className="flex items-center gap-2 bg-[#20ACFF] p-2.5 rounded-[10px] text-white text-[18px] font-500 cursor-pointer"
              onClick={() => navigate("/dashboard/add-book")}
            >
              <LuPlus />
              <span className="sm:hidden md:block">Add new book</span>
            </button>
          </div>
          <div className="table_books mt-6">
            <Paper
              sx={{
                width: "100%",
                paddingLeft: 3,
                paddingRight: 3,
                position: "relative",
              }}
            >
              <EnhancedTableToolbar numSelected={selected.length} />
              <TableContainer>
                <Table sx={{ minWidth: 750 }} aria-labelledby="tableTitle">
                  <EnhancedTableHead
                    numSelected={selected.length}
                    order={order}
                    orderBy={orderBy}
                    onSelectAllClick={() => {}}
                    onRequestSort={handleRequestSort}
                    rowCount={searchedAndFilteredBooks.length}
                  />
                  <TableBody>
                    {visibleRows.map((book: any, index: number) => (
                      <TableRow
                        hover
                        role="checkbox"
                        tabIndex={-1}
                        key={book.id}
                      >
                        <TableCell>
                          <img
                            src={book.image_url || "/no-img.jpg"}
                            className="min-w-10 h-10 rounded-full object-cover"
                            alt="Book cover"
                          />
                        </TableCell>
                        <TableCell
                          component="th"
                          id={`row-${index}`}
                          scope="row"
                          padding="none"
                        >
                          {book.title}
                        </TableCell>
                        <TableCell>{book.author}</TableCell>
                        <TableCell>{book.category}</TableCell>
                        <TableCell>{book.bookPage || book.book_page}</TableCell>
                        <TableCell>{book.year}</TableCell>
                        <TableCell>{book.available_copies}</TableCell>
                        <TableCell>
                          <div className="btn_func_block flex items-center gap-1.5">
                            <AiFillEdit
                              size={27}
                              className="cursor-pointer text-blue-600 hover:text-blue-800 duration-100"
                              onClick={() =>
                                navigate(`/dashboard/edit-book`, {
                                  state: { bookId: book.id },
                                })
                              }
                            />
                            <MdDelete
                              size={27}
                              className="cursor-pointer text-red-500 hover:text-red-600 duration-100"
                              onClick={() => {
                                setSelectedBookId(book.id);
                                setModalDeleteBook(true);
                              }}
                            />
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                    {!loadingBooks &&
                      !isSearching &&
                      !isFiltering &&
                      searchedAndFilteredBooks.length === 0 && (
                        <TableRow>
                          <TableCell colSpan={8}>
                            <h1 className="text-center py-4 text-gray-400">
                              {allBooks.length === 0
                                ? "No books found. Add your first book!"
                                : debouncedSearchValue
                                  ? `No books found matching "${debouncedSearchValue}"`
                                  : selectedFilters.length > 0
                                    ? "No books match the selected filters"
                                    : "No books found"}
                            </h1>
                          </TableCell>
                        </TableRow>
                      )}
                  </TableBody>
                </Table>
              </TableContainer>
              <TablePagination
                rowsPerPageOptions={[17, 10, 8, 5]}
                component="div"
                count={searchedAndFilteredBooks.length}
                rowsPerPage={rowsPerPage}
                page={page}
                onPageChange={(_, newPage) => setPage(newPage)}
                onRowsPerPageChange={(e) => {
                  setRowsPerPage(parseInt(e.target.value, 10));
                  setPage(0);
                }}
              />
            </Paper>
          </div>
        </div>

        <div
          className={`transpartent_overlay_modal_filter absolute inset-0 ${modalFilter ? "pointer-events-auto" : "pointer-events-none"}`}
          onClick={() => {
            setModalFilter(false);
            showScrollbar();
          }}
        ></div>

        {/* Delete Book Dialog */}
        <Dialog
          open={modalDeleteBook}
          onClose={() => setModalDeleteBook(false)}
          fullWidth
        >
          <div className="modal_delete_book_block px-4 py-4">
            <div className="header_delete_book_block flex items-center gap-6 justify-between">
              <h1 className="text-[19px] font-600">Delete Book</h1>
              <button
                className="close_modal_btn outline-none cursor-pointer p-2 bg-[#D9D9D9] rounded-full"
                onClick={() => setModalDeleteBook(false)}
              >
                <MdOutlineClose size={27} />
              </button>
            </div>
            <DialogTitle sx={{ fontSize: 17 }}>
              {"Are you sure to delete this book? This action can't be undone"}
            </DialogTitle>
            <div className="block_btns flex gap-2 justify-between sm:flex-col-reverse md:flex-row">
              <button
                className="bg-[#20ACFF] p-2.5 rounded-[10px] text-white text-[18px] font-500 cursor-pointer w-full duration-300"
                onClick={() => setModalDeleteBook(false)}
              >
                No
              </button>
              <button
                className="bg-[red] p-2.5 rounded-[10px] text-white text-[18px] font-500 cursor-pointer w-full duration-300"
                onClick={handleDeleteBook}
                disabled={loadingAction}
              >
                {loadingAction ? "Deleting..." : "Yes"}
              </button>
            </div>
          </div>
        </Dialog>

        {/* Add Filter Dialog */}
        <Dialog
          open={modalFilterAdd}
          onClose={() => {
            setModalFilterAdd(false);
            setNewFilterName("");
            setFilterErrors((prev) => ({ ...prev, addFilter: "" }));
          }}
          fullWidth
        >
          <div className="modal_add_filter_block px-4 py-4">
            <div className="header_modal_add_filter flex items-center gap-6 justify-between">
              <h1 className="text-[26px] font-600">Add Filter</h1>
              <button
                className="close_modal_btn outline-none cursor-pointer p-2 bg-[#D9D9D9] rounded-full"
                onClick={() => {
                  setModalFilterAdd(false);
                  setNewFilterName("");
                  setFilterErrors((prev) => ({ ...prev, addFilter: "" }));
                }}
              >
                <MdOutlineClose size={27} />
              </button>
            </div>
            <form
              onSubmit={handleAddFilterSubmit}
              className="form flex flex-col gap-2"
            >
              <div className="label_inp_filter flex flex-col gap-2">
                <label className="cursor-pointer text-[15px] font-500">
                  Filter Name *
                </label>
                <TextField
                  label="Name of Filter"
                  variant="outlined"
                  value={newFilterName}
                  onChange={(e) => {
                    setNewFilterName(e.target.value);
                    setFilterErrors((prev) => ({ ...prev, addFilter: "" }));
                  }}
                  error={!!filterErrors.addFilter}
                  helperText={filterErrors.addFilter}
                  required
                />
              </div>
              <div className="btn_submit_block mt-2">
                <button
                  type="submit"
                  className="bg-[#20ACFF] p-2.5 rounded-[10px] text-white text-[18px] font-500 cursor-pointer w-full disabled:opacity-50"
                  disabled={loadingAction}
                >
                  {loadingAction ? "Adding..." : "Submit"}
                </button>
              </div>
            </form>
          </div>
        </Dialog>

        {/* Edit Filter Dialog */}
        <Dialog
          open={modalFilterEdit}
          onClose={() => {
            setModalFilterEdit(false);
            setSelectedCategoryId(null);
            setEditFilterName("");
            setFilterErrors((prev) => ({ ...prev, editFilter: "" }));
          }}
          fullWidth
        >
          <div className="modal_edit_filter_block px-4 py-4">
            <div className="header_modal_edit_filter flex items-center gap-6 justify-between">
              <h1 className="text-[26px] font-600">Edit Filter</h1>
              <button
                className="close_modal_btn outline-none cursor-pointer p-2 bg-[#D9D9D9] rounded-full"
                onClick={() => {
                  setModalFilterEdit(false);
                  setSelectedCategoryId(null);
                  setEditFilterName("");
                  setFilterErrors((prev) => ({ ...prev, editFilter: "" }));
                }}
              >
                <MdOutlineClose size={27} />
              </button>
            </div>
            <form
              onSubmit={handleEditFilterSubmit}
              className="form flex flex-col gap-2"
            >
              <div className="label_inp_filter flex flex-col gap-2">
                <label className="cursor-pointer text-[15px] font-500">
                  Filter Name *
                </label>
                <TextField
                  label="Name of Filter"
                  variant="outlined"
                  value={editFilterName}
                  onChange={(e) => {
                    setEditFilterName(e.target.value);
                    setFilterErrors((prev) => ({ ...prev, editFilter: "" }));
                  }}
                  error={!!filterErrors.editFilter}
                  helperText={filterErrors.editFilter}
                  required
                />
              </div>
              <div className="btn_edit_block mt-2">
                <button
                  type="submit"
                  className="bg-[#20ACFF] p-2.5 rounded-[10px] text-white text-[18px] font-500 cursor-pointer w-full disabled:opacity-50"
                  disabled={loadingAction}
                >
                  {loadingAction ? "Updating..." : "Update"}
                </button>
              </div>
            </form>
          </div>
        </Dialog>

        {/* Delete Filter Dialog */}
        <Dialog
          open={modalFilterDelete}
          onClose={() => setModalFilterDelete(false)}
          fullWidth
        >
          <div className="modal_delete_filter_block px-4 py-4">
            <div className="header_delete_filter_block flex items-center gap-6 justify-between">
              <h1 className="text-[19px] font-600">Delete Filter</h1>
              <button
                className="close_modal_btn outline-none cursor-pointer p-2 bg-[#D9D9D9] rounded-full"
                onClick={() => setModalFilterDelete(false)}
              >
                <MdOutlineClose size={27} />
              </button>
            </div>
            <DialogTitle sx={{ fontSize: 17 }}>
              {
                "Are you sure to delete this filter? This action can't be undone"
              }
            </DialogTitle>
            <div className="block_btns flex gap-2 justify-between sm:flex-col-reverse md:flex-row">
              <button
                className="bg-[#20ACFF] p-2.5 rounded-[10px] text-white text-[18px] font-500 cursor-pointer w-full duration-300"
                onClick={() => setModalFilterDelete(false)}
              >
                No
              </button>
              <button
                className="bg-[red] p-2.5 rounded-[10px] text-white text-[18px] font-500 cursor-pointer w-full duration-300"
                onClick={handleDeleteFilter}
                disabled={loadingAction}
              >
                {loadingAction ? "Deleting..." : "Yes"}
              </button>
            </div>
          </div>
        </Dialog>
      </div>

      {/* Loading Backdrop - shows for initial load, search, and filter */}
      <Backdrop
        sx={{ color: "#fff", zIndex: (theme) => theme.zIndex.drawer + 1 }}
        open={showBackdrop}
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

export default Books;
