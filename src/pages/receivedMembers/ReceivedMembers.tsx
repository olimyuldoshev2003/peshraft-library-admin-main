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
import DialogTitle from "@mui/material/DialogTitle";
import { MdDelete, MdOutlineClose } from "react-icons/md";
import CircularProgress from "@mui/material/CircularProgress";
import { useAuth } from "../../context/AuthContext";

// 🔥 Firebase
import {
  getReceivedMembers,
  deleteReceivedMember,
} from "../../firebase/services";

type Order = "asc" | "desc";

// Helper function to format Firebase Timestamp or date string to DD.MM.YYYY
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

  // Format date as DD.MM.YYYY
  if (date && !isNaN(date.getTime())) {
    const day = String(date.getDate()).padStart(2, "0");
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const year = date.getFullYear();
    return `${day}.${month}.${year}`;
  }

  return "-";
};

// Helper function to calculate days left
const calculateDaysLeft = (dueDateValue: any): number | null => {
  if (!dueDateValue) return null;

  let dueDate: Date | null = null;

  // Handle Firebase Timestamp
  if (
    dueDateValue &&
    typeof dueDateValue === "object" &&
    "seconds" in dueDateValue &&
    "nanoseconds" in dueDateValue
  ) {
    dueDate = new Date(dueDateValue.seconds * 1000);
  }
  // Handle string date
  else if (typeof dueDateValue === "string") {
    // Try DD.MM.YYYY format first
    if (/^\d{2}\.\d{2}\.\d{4}$/.test(dueDateValue)) {
      const [day, month, year] = dueDateValue.split(".").map(Number);
      dueDate = new Date(year, month - 1, day);
    } else {
      dueDate = new Date(dueDateValue);
    }
  }
  // Handle Date object
  else if (dueDateValue instanceof Date) {
    dueDate = dueDateValue;
  }

  if (!dueDate || isNaN(dueDate.getTime())) return null;

  const now = new Date();
  now.setHours(0, 0, 0, 0);
  const diffTime = dueDate.getTime() - now.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  return diffDays;
};

// Helper function to get status text and color based on days left
const getStatusInfo = (dueDateValue: any): { text: string; color: string } => {
  const daysLeft = calculateDaysLeft(dueDateValue);

  if (daysLeft === null) return { text: "Unknown", color: "gray" };

  if (daysLeft < 0) {
    return { text: `Overdue by ${Math.abs(daysLeft)} days`, color: "red" };
  }

  if (daysLeft === 0) {
    return { text: "Due today", color: "orange" };
  }

  if (daysLeft <= 3) {
    return { text: `Due in ${daysLeft} days`, color: "orange" };
  }

  return { text: "Active", color: "green" };
};

const ReceivedMembers = () => {
  const { adminProfile } = useAuth();
  const [order, setOrder] = useState<Order>("asc");
  const [orderBy, setOrderBy] = useState<any>("bookTitle");
  const [selected, setSelected] = useState<readonly number[]>([]);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState<number>(17);
  const [modalDeleteReceivedUser, setModalDeleteReceivedUser] = useState(false);
  const [rows, setRows] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedId, setSelectedId] = useState<string>("");
  const [searchValue, setSearchValue] = useState("");

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    setLoading(true);
    try {
      const data = await getReceivedMembers();
      setRows(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete() {
    if (!selectedId) return;
    try {
      await deleteReceivedMember(selectedId);
      setModalDeleteReceivedUser(false);
      loadData();
    } catch (err) {
      console.error(err);
    }
  }

  const filteredRows = useMemo(() => {
    const lower = searchValue.toLowerCase();
    return rows.filter(
      (r) =>
        r.borrowerName?.toLowerCase().includes(lower) ||
        r.bookTitle?.toLowerCase().includes(lower) ||
        r.email?.toLowerCase().includes(lower),
    );
  }, [rows, searchValue]);

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
    { id: "img", numeric: false, disablePadding: true, label: "Image" },
    {
      id: "borrowerName",
      numeric: false,
      disablePadding: false,
      label: "Borrower Name",
    },
    {
      id: "dateBorrowed",
      numeric: false,
      disablePadding: false,
      label: "Date Borrowed",
    },
    { id: "dueDate", numeric: false, disablePadding: false, label: "Due Date" },
    { id: "status", numeric: false, disablePadding: false, label: "Status" },
    {
      id: "phoneNumber",
      numeric: false,
      disablePadding: false,
      label: "Phone number",
    },
    { id: "email", numeric: false, disablePadding: false, label: "Email" },
    {
      id: "bookTitle",
      numeric: false,
      disablePadding: true,
      label: "Book Title",
    },
    { id: "author", numeric: false, disablePadding: true, label: "Author" },
    { id: "action", numeric: false, disablePadding: false, label: "Action" },
  ];

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
          Received Members
        </Typography>
      </Toolbar>
    );
  }

  const handleRequestSort = (_: React.MouseEvent<unknown>, property: any) => {
    const isAsc = orderBy === property && order === "asc";
    setOrder(isAsc ? "desc" : "asc");
    setOrderBy(property);
  };

  const handleSelectAllClick = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.checked) {
      setSelected(filteredRows.map((n: any) => n.id));
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
    page > 0 ? Math.max(0, (1 + page) * rowsPerPage - filteredRows.length) : 0;
  const visibleRows = useMemo(
    () =>
      [...filteredRows]
        .sort(getComparator(order, orderBy))
        .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage),
    [filteredRows, order, orderBy, page, rowsPerPage],
  );

  return (
    <>
      <div className="borrowed_books_component">
        <div className="borrowed_books_component_block p-4 max-w-360 mx-auto">
          <div className="header_borrowed_books flex justify-between items-center gap-6">
            <div className="search_logo_and_search_input relative flex items-center flex-1 gap-4">
              <HiOutlineSearch size={24} className="absolute top-2.5 left-3" />
              <input
                type="search"
                value={searchValue}
                onChange={(e) => setSearchValue(e.target.value)}
                className="inp_search outline-none shadow-[0_0_6px_gray] pl-12 pr-4 py-2 rounded-[30px] text-[18px] font-500 sm:w-full md:w-[90%] lg:w-[80%]"
                placeholder="Search..."
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

          <div className="section_borrowed_books">
            <div className="table_books mt-6">
              {loading ? (
                <div className="flex justify-center py-10">
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
                        onSelectAllClick={handleSelectAllClick}
                        onRequestSort={handleRequestSort}
                        rowCount={filteredRows.length}
                      />
                      <TableBody>
                        {visibleRows.map((row, index) => {
                          const labelId = `enhanced-table-checkbox-${index}`;
                          const statusInfo = getStatusInfo(
                            row.dueDate || row.due_date,
                          );
                          return (
                            <TableRow
                              hover
                              role="checkbox"
                              tabIndex={-1}
                              key={row.id}
                            >
                              <TableCell>
                                <img
                                  src={row.member_image_url || noImg}
                                  className="w-10 h-10 rounded-full object-cover"
                                  alt=""
                                  onError={(e: any) => {
                                    e.target.src = noImg;
                                  }}
                                />
                              </TableCell>
                              <TableCell>{row.borrowerName || "-"}</TableCell>
                              <TableCell>
                                {formatDate(
                                  row.dateBorrowed || row.borrow_date,
                                )}
                              </TableCell>
                              <TableCell>
                                {formatDate(row.dueDate || row.due_date)}
                              </TableCell>
                              <TableCell>
                                <span
                                  className={`font-600`}
                                  style={{ color: statusInfo.color }}
                                >
                                  {statusInfo.text}
                                </span>
                              </TableCell>
                              <TableCell>
                                {row.phoneNumber || row.phone || "-"}
                              </TableCell>
                              <TableCell>{row.email || "-"}</TableCell>
                              <TableCell
                                component="th"
                                id={labelId}
                                scope="row"
                                padding="none"
                              >
                                {row.bookTitle || "-"}
                              </TableCell>
                              <TableCell>{row.author || "-"}</TableCell>
                              <TableCell>
                                <div className="btn_func_block flex items-center gap-1.5">
                                  <MdDelete
                                    size={27}
                                    onClick={() => {
                                      setSelectedId(row.id);
                                      setModalDeleteReceivedUser(true);
                                    }}
                                    className="cursor-pointer text-red-500 hover:text-red-600 duration-100"
                                  />
                                </div>
                              </TableCell>
                            </TableRow>
                          );
                        })}
                        {filteredRows.length === 0 && (
                          <TableRow>
                            <TableCell
                              colSpan={10}
                              align="center"
                              sx={{ py: 4, color: "gray" }}
                            >
                              No received members found
                            </TableCell>
                          </TableRow>
                        )}
                        {emptyRows > 0 && (
                          <TableRow>
                            <TableCell colSpan={10} />
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
                    onPageChange={handleChangePage}
                    onRowsPerPageChange={handleChangeRowsPerPage}
                  />
                </Paper>
              )}
            </div>
          </div>

          <Dialog
            open={modalDeleteReceivedUser}
            onClose={() => setModalDeleteReceivedUser(false)}
            fullWidth
          >
            <div className="modal_delete_received_book_user_block px-4 py-4">
              <div className="header_delete_received_book_user_block flex items-center gap-6 justify-between">
                <h1 className="text-[26px] font-600">Delete Received Member</h1>
                <button
                  className="close_modal_btn outline-none cursor-pointer p-2 bg-[#D9D9D9] rounded-full"
                  onClick={() => setModalDeleteReceivedUser(false)}
                >
                  <MdOutlineClose size={27} />
                </button>
              </div>
              <DialogTitle>
                {
                  "Are you sure to delete this received member? This action can't be undone"
                }
              </DialogTitle>
              <div className="block_btns flex gap-5 justify-between">
                <button
                  className="hover:bg-[#20ACFF] p-2.5 rounded-[10px] text-[#20ACFF] hover:text-white text-[18px] font-500 cursor-pointer w-full duration-300"
                  onClick={() => setModalDeleteReceivedUser(false)}
                >
                  No
                </button>
                <button
                  className="hover:bg-[red] text-[red] p-2.5 rounded-[10px] hover:text-white text-[18px] font-500 cursor-pointer w-full duration-300"
                  onClick={handleDelete}
                >
                  Yes
                </button>
              </div>
            </div>
          </Dialog>
        </div>
      </div>
    </>
  );
};

export default ReceivedMembers;
