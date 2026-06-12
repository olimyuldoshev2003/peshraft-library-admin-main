import { HiOutlineSearch } from "react-icons/hi";
import noImg from "../../assets/no-img.jpg";
import { useMemo, useState, useEffect } from "react";
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
  getReturnBookRequests,
  acceptReturnBookRequest,
} from "../../firebase/services";
import { useAuth } from "../../context/AuthContext";

type Order = "asc" | "desc";

// Helper function to format Firestore timestamp to DD.MM.YYYY
const formatTimestamp = (timestamp: any): string => {
  if (!timestamp) return "-";

  let date: Date | null = null;

  // If it's a Firestore Timestamp object
  if (timestamp?.toDate && typeof timestamp.toDate === "function") {
    date = timestamp.toDate();
  }
  // If it has seconds and nanoseconds
  else if (timestamp?.seconds) {
    date = new Date(timestamp.seconds * 1000);
  }
  // If it's already a string
  else if (typeof timestamp === "string") {
    // Check if it's already in DD.MM.YYYY format
    if (/^\d{2}\.\d{2}\.\d{4}$/.test(timestamp)) {
      return timestamp;
    }
    date = new Date(timestamp);
  }
  // If it's a Date object
  else if (timestamp instanceof Date) {
    date = timestamp;
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

const ReturnBookRequests = () => {
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
  const [actionLoading, setActionLoading] = useState(false);
  const [searchValue, setSearchValue] = useState("");

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
      id: "returner-full-name",
      label: "Returner Full Name",
      disablePadding: false,
    },
    { id: "phone-number", label: "Phone number", disablePadding: false },
    { id: "email", label: "Email", disablePadding: false },
    { id: "borrowed-date", label: "Borrowed Date", disablePadding: false },
    { id: "request-date", label: "Request Date", disablePadding: false },
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
          Return Book Requests
        </Typography>
      </Toolbar>
    );
  }

  const handleRequestSort = (_: React.MouseEvent<unknown>, property: any) => {
    const isAsc = orderBy === property && order === "asc";
    setOrder(isAsc ? "desc" : "asc");
    setOrderBy(property);
  };

  const filteredRows = rows.filter((r) => {
    const lower = searchValue.toLowerCase();
    return (
      !lower ||
      r.borrowerName?.toLowerCase().includes(lower) ||
      r.bookTitle?.toLowerCase().includes(lower) ||
      r.email?.toLowerCase().includes(lower)
    );
  });
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
      const data = await getReturnBookRequests(); // 🔥 Firebase
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
    setActionLoading(true);
    try {
      await acceptReturnBookRequest(selectedRequestId); // 🔥 Firebase
      setModalConfirm(false);
      setSelectedRequestId(null);
      loadRequests();
    } catch (e) {
      alert("Error accepting return request");
    } finally {
      setActionLoading(false);
    }
  }

  return (
    <>
      <div className="return_book_request_component">
        <div className="return_book_request_component_block px-4 py-4 max-w-360 mx-auto">
          <div className="header_return_book_requests flex justify-between items-center gap-6">
            <div className="search_logo_and_search_input relative flex-1">
              <HiOutlineSearch size={24} className="absolute top-2.5 left-3" />
              <input
                type="search"
                className="inp_search outline-none shadow-[0_0_6px_gray] pl-12 pr-4 py-2 rounded-[30px] text-[18px] font-500 sm:w-full md:w-[90%] lg:w-[80%]"
                placeholder="Search by name, book, email..."
                value={searchValue}
                onChange={(e) => setSearchValue(e.target.value)}
              />
            </div>
            <div className="fullname_img_of_admin_and_admin_title sm:hidden md:flex items-center gap-3">
              <div>
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

          <div className="section_received_book_requests mt-6">
            {loading ? (
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
                      rowCount={rows.length}
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
                              src={row.img || "/no-img.jpg"}
                              className="w-10 h-10 rounded-full object-cover"
                              alt=""
                            />
                          </TableCell>
                          <TableCell
                            component="th"
                            id={`row-${index}`}
                            scope="row"
                            padding="none"
                          >
                            {row.borrowerName || row.returnerFullName}
                          </TableCell>
                          <TableCell>{row.phoneNumber}</TableCell>
                          <TableCell>{row.email}</TableCell>
                          <TableCell>
                            {formatTimestamp(
                              row.dateBorrowed || row.borrowedDate,
                            )}
                          </TableCell>
                          <TableCell>
                            {formatTimestamp(row.createdAt || row.requestDate)}
                          </TableCell>
                          <TableCell>{row.bookTitle}</TableCell>
                          <TableCell>{row.author}</TableCell>
                          <TableCell>
                            <button
                              className="bg-[green] px-2.5 py-1.5 rounded-[5px] text-white text-[14px] font-500 cursor-pointer outline-none"
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
                      {!loading && rows.length === 0 && (
                        <TableRow>
                          <TableCell colSpan={9}>
                            <h1 className="text-center py-4 text-gray-400">
                              No pending return requests
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
              onClose={() => setModalConfirm(false)}
              fullWidth
            >
              <div className="modal_delete_book_block px-4 py-4">
                <div className="header_delete_book_block flex items-center gap-6 justify-between">
                  <h1 className="text-[17px] font-600">
                    Request Returning Book
                  </h1>
                  <button
                    className="close_modal_btn outline-none cursor-pointer p-2 bg-[#D9D9D9] rounded-full"
                    onClick={() => setModalConfirm(false)}
                  >
                    <MdOutlineClose size={27} />
                  </button>
                </div>
                <DialogTitle sx={{ fontSize: 15 }}>
                  {"Did this person really return this book?"}
                </DialogTitle>
                <div className="block_btns flex gap-2 justify-between sm:flex-col-reverse md:flex-row">
                  <button
                    className="bg-[#20ACFF] p-2.5 rounded-[10px] text-white text-[18px] font-500 cursor-pointer w-full duration-300"
                    onClick={() => setModalConfirm(false)}
                    disabled={actionLoading}
                  >
                    No
                  </button>
                  <button
                    className="bg-[red] p-2.5 rounded-[10px] text-white text-[18px] font-500 cursor-pointer w-full duration-300"
                    onClick={handleAccept}
                    disabled={actionLoading}
                  >
                    {actionLoading ? "Processing..." : "Yes"}
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

export default ReturnBookRequests;
