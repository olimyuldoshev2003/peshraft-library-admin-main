import { HiOutlineSearch } from "react-icons/hi";
import noImg from "../../assets/no-img.jpg";
import { useMemo, useState, useEffect, useCallback, useRef } from "react";
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

// 🔥 Firebase
import {
  getReceiveBookRequests,
  acceptReceiveBookRequest,
  declineReceiveBookRequest,
} from "../../firebase/services";
import { useAuth } from "../../context/AuthContext";

type Order = "asc" | "desc";

// Helper function to format date to DD.MM.YYYY
const formatDate = (dateValue: any): string => {
  if (!dateValue) return "-";

  let date: Date | null = null;

  // Handle Firebase Timestamp
  if (
    dateValue &&
    typeof dateValue === "object" &&
    "seconds" in dateValue &&
    "nanoseconds" in dateValue
  ) {
    date = new Date(dateValue.seconds * 1000);
  }
  // Handle string date
  else if (typeof dateValue === "string") {
    // Check if it's already in DD.MM.YYYY format
    if (/^\d{2}\.\d{2}\.\d{4}$/.test(dateValue)) {
      return dateValue;
    }
    date = new Date(dateValue);
  }
  // Handle Date object
  else if (dateValue instanceof Date) {
    date = dateValue;
  }
  // Handle function toDate (Firestore Timestamp alternative)
  else if (dateValue?.toDate && typeof dateValue.toDate === "function") {
    date = dateValue.toDate();
  }

  // Format date as DD.MM.YYYY
  if (date && !isNaN(date.getTime())) {
    const day = String(date.getDate()).padStart(2, "0");
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const year = date.getFullYear();
    return `${day}.${month}.${year}`;
  }

  return "-";
};

const ReceiveBookRequests = () => {
  const { adminProfile } = useAuth();
  const [order, setOrder] = useState<Order>("asc");
  const [orderBy, setOrderBy] = useState<any>("bookTitle");
  const [selected] = useState<readonly number[]>([]);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState<number>(17);
  const [modalConfirm, setModalConfirm] = useState(false);
  const [selectedRequestId, setSelectedRequestId] = useState<string | null>(
    null,
  );
  const [rows, setRows] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  // const [actionLoading, setActionLoading] = useState(false);
  const [accepting, setAccepting] = useState(false);
  const [declining, setDeclining] = useState(false);
  const [searchValue, setSearchValue] = useState("");
  const [debouncedSearchValue, setDebouncedSearchValue] = useState("");

  // Debounce timeout ref
  const debounceTimeoutRef = useRef<any>(null);

  // Debounced search handler
  const handleSearchChange = useCallback((value: string) => {
    setSearchValue(value);

    if (debounceTimeoutRef.current) {
      clearTimeout(debounceTimeoutRef.current);
    }

    debounceTimeoutRef.current = setTimeout(() => {
      setIsSearching(true);
      setDebouncedSearchValue(value);
      setPage(0);
      setTimeout(() => setIsSearching(false), 300);
    }, 500);
  }, []);

  // Clear timeout on unmount
  useEffect(() => {
    return () => {
      if (debounceTimeoutRef.current) {
        clearTimeout(debounceTimeoutRef.current);
      }
    };
  }, []);

  function descendingComparator<T>(a: T, b: T, key: keyof T) {
    if (b[key] < a[key]) return -1;
    if (b[key] > a[key]) return 1;
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

  const headCells: any[] = [
    { id: "img", label: "Image", disablePadding: true },
    {
      id: "receiver-full-name",
      label: "Receiver Full Name",
      disablePadding: false,
    },
    { id: "phone-number", label: "Phone number", disablePadding: false },
    { id: "email", label: "Email", disablePadding: false },
    { id: "request-date", label: "Request Date", disablePadding: false },
    { id: "borrow-until", label: "Borrow Until", disablePadding: false },
    { id: "book-title", label: "Book Title", disablePadding: true },
    { id: "author", label: "Author", disablePadding: true },
    { id: "action", label: "Action", disablePadding: false },
  ];

  function EnhancedTableHead({ order, orderBy, onRequestSort }: any) {
    const createSortHandler = (prop: any) => (e: React.MouseEvent<unknown>) =>
      onRequestSort(e, prop);
    return (
      <TableHead>
        <TableRow>
          {headCells.map((hc) => (
            <TableCell
              key={hc.id}
              padding={hc.disablePadding ? "none" : "normal"}
              sortDirection={orderBy === hc.id ? order : false}
            >
              <TableSortLabel
                active={orderBy === hc.id}
                direction={orderBy === hc.id ? order : "asc"}
                onClick={createSortHandler(hc.id)}
              >
                {hc.label}
                {orderBy === hc.id ? (
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
          Requested Book Members
          {isSearching && " (Searching...)"}
          {!isSearching &&
            debouncedSearchValue &&
            filteredRows.length > 0 &&
            ` (${filteredRows.length} result${filteredRows.length !== 1 ? "s" : ""})`}
        </Typography>
      </Toolbar>
    );
  }

  const handleRequestSort = (_: React.MouseEvent<unknown>, property: any) => {
    const isAsc = orderBy === property && order === "asc";
    setOrder(isAsc ? "desc" : "asc");
    setOrderBy(property);
  };

  const filteredRows = useMemo(() => {
    if (!debouncedSearchValue.trim()) {
      return rows;
    }
    const lower = debouncedSearchValue.toLowerCase();
    return rows.filter(
      (r) =>
        r.userName?.toLowerCase().includes(lower) ||
        r.bookTitle?.toLowerCase().includes(lower) ||
        r.email?.toLowerCase().includes(lower) ||
        r.receiverFullName?.toLowerCase().includes(lower),
    );
  }, [rows, debouncedSearchValue]);

  const emptyRows =
    page > 0 ? Math.max(0, (1 + page) * rowsPerPage - filteredRows.length) : 0;
  const visibleRows = useMemo(
    () =>
      [...filteredRows]
        .sort(getComparator(order, orderBy))
        .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage),
    [order, orderBy, page, rowsPerPage, filteredRows],
  );

  async function loadRequests() {
    setLoading(true);
    try {
      const data = await getReceiveBookRequests(); // 🔥 Firebase
      setRows(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadRequests();
  }, []);

  async function handleAccept() {
    if (!selectedRequestId) return;
    setAccepting(true);
    try {
      await acceptReceiveBookRequest(selectedRequestId); // 🔥 Firebase
      setModalConfirm(false);
      setSelectedRequestId(null);
      loadRequests();
    } catch (e) {
      alert("Error accepting request");
    } finally {
      setAccepting(false);
    }
  }

  async function handleDecline() {
    if (!selectedRequestId) return;
    setDeclining(true);
    try {
      await declineReceiveBookRequest(selectedRequestId); // 🔥 Firebase
      setModalConfirm(false);
      setSelectedRequestId(null);
      loadRequests();
    } catch (e) {
      alert("Error declining request");
    } finally {
      setDeclining(false);
    }
  }

  // Show spinner when loading OR searching
  const showSpinner = loading || isSearching;

  return (
    <>
      <div className="received_book_requests_conponent">
        <div className="received_book_requests_conponent_block px-4 py-4 max-w-360 mx-auto">
          <div className="header_received_book_requests flex justify-between items-center gap-6">
            <div className="search_logo_and_search_input relative flex-1">
              <HiOutlineSearch size={24} className="absolute top-2.5 left-3" />
              <input
                type="search"
                className="inp_search outline-none shadow-[0_0_6px_gray] pl-12 pr-4 py-2 rounded-[30px] text-[18px] font-500 sm:w-full md:w-[90%] lg:w-[80%]"
                placeholder="Search by name, book, email..."
                value={searchValue}
                onChange={(e) => handleSearchChange(e.target.value)}
              />
            </div>
            <div className="fullname_img_of_admin_and_admin_title sm:hidden md:flex items-center gap-3">
              <div className="fullname_of_user_and_admin_title">
                <h1 className="text-[22px] font-500">
                  {adminProfile?.fullName || "Unknown"}
                </h1>
                <h1 className="text-[#808080] text-[15px] font-400 text-right">
                  {adminProfile?.is_main_admin === true ? "Main Admin" : "Admin"}
                </h1>
              </div>
              <img
                className="w-14 h-14 rounded-full object-cover"
                src={adminProfile?.image_url || noImg}
                alt=""
              />
            </div>
          </div>

          <div className="section_received_book_requests mt-6">
            {showSpinner ? (
              <div className="flex justify-center mt-6">
                <CircularProgress />
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
                      onSelectAllClick={() => {}}
                      onRequestSort={handleRequestSort}
                      rowCount={filteredRows.length}
                    />
                    <TableBody>
                      {visibleRows.map((row, index) => (
                        <TableRow
                          hover
                          role="checkbox"
                          tabIndex={-1}
                          key={row.id}
                        >
                          <TableCell>
                            <img
                              src={
                                row.img || row.member_image_url || "/no-img.jpg"
                              }
                              className="min-w-10 h-10 rounded-full object-cover"
                              alt=""
                              onError={(e: any) => {
                                e.target.src = noImg;
                              }}
                            />
                          </TableCell>
                          <TableCell
                            component="th"
                            id={`row-${index}`}
                            scope="row"
                            padding="none"
                          >
                            {row.userName ||
                              row.receiverFullName ||
                              row.borrowerName ||
                              "-"}
                          </TableCell>
                          <TableCell>{row.phoneNumber || "-"}</TableCell>
                          <TableCell>{row.email || "-"}</TableCell>
                          <TableCell>
                            {formatDate(row.requestDate || row.createdAt)}
                          </TableCell>
                          <TableCell>
                            {formatDate(row.borrowUntil || row.dueDate)}
                          </TableCell>
                          <TableCell>{row.bookTitle || "-"}</TableCell>
                          <TableCell>{row.author || "-"}</TableCell>
                          <TableCell>
                            <button
                              className="bg-[green] px-2.5 py-1.5 rounded-[5px] text-white text-[14px] font-500 cursor-pointer outline-none hover:bg-[darkgreen] transition-colors"
                              onClick={() => {
                                setSelectedRequestId(row.id);
                                setModalConfirm(true);
                              }}
                            >
                              Accept
                            </button>
                          </TableCell>
                        </TableRow>
                      ))}
                      {!isSearching && filteredRows.length === 0 && (
                        <TableRow>
                          <TableCell colSpan={9}>
                            <h1 className="text-center py-4 text-gray-400">
                              {debouncedSearchValue
                                ? `No pending requests found matching "${debouncedSearchValue}"`
                                : "No pending receive requests"}
                            </h1>
                          </TableCell>
                        </TableRow>
                      )}
                      {emptyRows > 0 && (
                        <TableRow>
                          <TableCell colSpan={9} />
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </TableContainer>
                <TablePagination
                  rowsPerPageOptions={[17, 10, 8, 5]}
                  component="div"
                  count={filteredRows.length}
                  rowsPerPage={rowsPerPage}
                  page={page}
                  onPageChange={(_, p) => setPage(p)}
                  onRowsPerPageChange={(e) => {
                    setRowsPerPage(parseInt(e.target.value, 10));
                    setPage(0);
                  }}
                />
              </Paper>
            )}

            <Dialog
              open={modalConfirm}
              onClose={() => !accepting && !declining && setModalConfirm(false)}
              fullWidth
            >
              <div className="modal_delete_book_block px-4 py-4">
                <div className="header_delete_book_block flex items-center gap-6 justify-between">
                  <h1 className="text-[17px] font-600">
                    Request Receiving Book
                  </h1>
                  <button
                    className="close_modal_btn outline-none cursor-pointer p-2 bg-[#D9D9D9] rounded-full hover:bg-gray-400 transition-colors"
                    onClick={() =>
                      !accepting && !declining && setModalConfirm(false)
                    }
                    disabled={accepting || declining}
                  >
                    <MdOutlineClose size={27} />
                  </button>
                </div>
                <DialogTitle sx={{ fontSize: 15 }}>
                  {"Did this person really receive this book?"}
                </DialogTitle>
                <div className="block_btns flex gap-2 justify-between sm:flex-col-reverse md:flex-row">
                  <button
                    className="bg-[#20ACFF] p-2.5 rounded-[10px] text-white text-[18px] font-500 cursor-pointer w-full duration-300 hover:bg-[#0d8ae0] transition-colors flex items-center justify-center gap-2"
                    onClick={handleDecline}
                    disabled={accepting || declining}
                  >
                    {declining ? (
                      <>
                        <CircularProgress size={20} color="inherit" />
                        <span>Processing...</span>
                      </>
                    ) : (
                      "No"
                    )}
                  </button>
                  <button
                    className="bg-[red] p-2.5 rounded-[10px] text-white text-[18px] font-500 cursor-pointer w-full duration-300 hover:bg-[darkred] transition-colors flex items-center justify-center gap-2"
                    onClick={handleAccept}
                    disabled={accepting || declining}
                  >
                    {accepting ? (
                      <>
                        <CircularProgress size={20} color="inherit" />
                        <span>Processing...</span>
                      </>
                    ) : (
                      "Yes"
                    )}
                  </button>
                </div>
              </div>
            </Dialog>
          </div>
        </div>
      </div>
    </>
  );
};

export default ReceiveBookRequests;
