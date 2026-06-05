import { HiOutlineSearch } from "react-icons/hi";
import userImg from "../../assets/user-img.svg";
import { BsThreeDots } from "react-icons/bs";
import { alpha } from "@mui/material/styles";
import { useEffect, useMemo, useState } from "react";
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
import { IoArrowBackCircleOutline } from "react-icons/io5";
import { LuOctagonAlert } from "react-icons/lu";
import CircularProgress from "@mui/material/CircularProgress";
import { useAuth } from "../../context/AuthContext";

// 🔥 Firebase
import { getMembers, getMemberBookshelf, getMemberHistory } from "../../firebase/services";

type Order = "asc" | "desc";

const Members = () => {
  const { adminProfile } = useAuth();
  const [order, setOrder] = useState<Order>("asc");
  const [orderBy, setOrderBy] = useState<any>("fullName");
  const [selected, setSelected] = useState<readonly number[]>([]);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState<number>(17);
  const [modalInfoAboutMember, setModalInfoAboutMember] = useState<boolean>(false);
  const [members, setMembers] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedMember, setSelectedMember] = useState<any>(null);
  const [bookshelf, setBookshelf] = useState<any[]>([]);
  const [history, setHistory] = useState<any[]>([]);
  const [searchValue, setSearchValue] = useState("");

  useEffect(() => {
    loadMembers();
  }, []);

  async function loadMembers() {
    setLoading(true);
    try {
      const data = await getMembers();
      setMembers(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  async function openMemberModal(member: any) {
    setSelectedMember(member);
    setModalInfoAboutMember(true);
    try {
      const [shelf, hist] = await Promise.all([
        getMemberBookshelf(member.id),
        getMemberHistory(member.id),
      ]);
      setBookshelf(shelf);
      setHistory(hist);
    } catch (err) {
      console.error(err);
    }
  }

  const filteredMembers = useMemo(() => {
    const lower = searchValue.toLowerCase();
    return members.filter(
      (m) =>
        m.fullName?.toLowerCase().includes(lower) ||
        m.email?.toLowerCase().includes(lower) ||
        m.phoneNumber?.toLowerCase().includes(lower)
    );
  }, [members, searchValue]);

  function descendingComparator<T>(a: T, b: T, orderBy: keyof T) {
    if (b[orderBy] < a[orderBy]) return -1;
    if (b[orderBy] > a[orderBy]) return 1;
    return 0;
  }

  function getComparator<Key extends keyof any>(order: Order, orderBy: Key): (a: any, b: any) => number {
    return order === "desc"
      ? (a, b) => descendingComparator(a, b, orderBy)
      : (a, b) => -descendingComparator(a, b, orderBy);
  }

  const headCells: any = [
    { id: "img", numeric: false, disablePadding: true, label: "Image" },
    { id: "fullName", numeric: false, disablePadding: true, label: "Full Name" },
    { id: "dateOfBirth", numeric: false, disablePadding: false, label: "Date of Birth" },
    { id: "phoneNumber", numeric: false, disablePadding: false, label: "Phone Number" },
    { id: "email", numeric: false, disablePadding: false, label: "Email Address" },
    { id: "action", numeric: false, disablePadding: false, label: "Action" },
  ];

  function EnhancedTableHead({ order, orderBy, onRequestSort }: any) {
    const createSortHandler = (property: any) => (event: React.MouseEvent<unknown>) => {
      onRequestSort(event, property);
    };
    return (
      <TableHead>
        <TableRow>
          {headCells.map((headCell: any) => (
            <TableCell key={headCell.id} padding={headCell.disablePadding ? "none" : "normal"} sortDirection={orderBy === headCell.id ? order : false}>
              <TableSortLabel active={orderBy === headCell.id} direction={orderBy === headCell.id ? order : "asc"} onClick={createSortHandler(headCell.id)}>
                {headCell.label}
                {orderBy === headCell.id ? (
                  <Box component="span" sx={visuallyHidden}>
                    {order === "desc" ? "sorted descending" : "sorted ascending"}
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
      <Toolbar sx={{ pl: { sm: 2 }, pr: { xs: 1, sm: 1 }, ...(numSelected > 0 && { bgcolor: (theme) => alpha(theme.palette.primary.main, theme.palette.action.activatedOpacity) }) }}>
        <Typography sx={{ flex: "1 1 100%" }} variant="h6" id="tableTitle" component="div">
          Members
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
      setSelected(filteredMembers.map((n: any) => n.id));
      return;
    }
    setSelected([]);
  };

  const handleChangePage = (_: unknown, newPage: number) => setPage(newPage);
  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const emptyRows = page > 0 ? Math.max(0, (1 + page) * rowsPerPage - filteredMembers.length) : 0;

  const visibleRows = useMemo(
    () => [...filteredMembers].sort(getComparator(order, orderBy)).slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage),
    [filteredMembers, order, orderBy, page, rowsPerPage]
  );

  return (
    <>
      <div className="members_component">
        <div className="members_component_block p-4 max-w-360 mx-auto">
          <div className="header_member_component flex justify-between items-center gap-6">
            <div className="search_logo_and_search_input relative flex-1">
              <HiOutlineSearch size={24} className="absolute top-2.5 left-3" />
              <input
                type="search"
                value={searchValue}
                onChange={(e) => setSearchValue(e.target.value)}
                className="inp_search outline-none shadow-[0_0_6px_gray] pl-12 pr-4 py-2 rounded-[30px] text-[18px] font-500 sm:w-full md:w-[90%] lg:w-[80%]"
                placeholder="Search members..."
              />
            </div>
            <div className="fullname_img_of_admin_and_admin_title sm:hidden md:flex items-center gap-3">
              <div className="fullname_of_user_and_admin_title">
                <h1 className="text-[22px] font-500">{adminProfile?.fullName || "Admin"}</h1>
                <h1 className="text-[#808080] text-[15px] font-400 text-right">Admin</h1>
              </div>
              <img className="w-14 h-14" src={userImg} alt="" />
            </div>
          </div>

          <div className="section_member_component mt-6">
            {loading ? (
              <div className="flex justify-center py-10"><CircularProgress /></div>
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
                      rowCount={filteredMembers.length}
                    />
                    <TableBody>
                      {visibleRows.map((row, index) => {
                        const labelId = `enhanced-table-checkbox-${index}`;
                        return (
                          <TableRow hover role="checkbox" tabIndex={-1} key={row.id}>
                            <TableCell>
                              <img
                                src={row.member_image_url || row.photoURL || userImg}
                                className="w-10 h-10 rounded-full object-cover"
                                alt=""
                                onError={(e: any) => { e.target.src = userImg; }}
                              />
                            </TableCell>
                            <TableCell component="th" id={labelId} scope="row" padding="none">
                              {row.fullName || row.name || "-"}
                            </TableCell>
                            <TableCell>{row.dateOfBirth || row.date_of_birth || "-"}</TableCell>
                            <TableCell>{row.phoneNumber || row.phone || "-"}</TableCell>
                            <TableCell>{row.email || "-"}</TableCell>
                            <TableCell>
                              <BsThreeDots
                                size={27}
                                className="cursor-pointer text-blue-600 hover:text-blue-800 duration-100"
                                onClick={() => openMemberModal(row)}
                              />
                            </TableCell>
                          </TableRow>
                        );
                      })}
                      {filteredMembers.length === 0 && (
                        <TableRow>
                          <TableCell colSpan={6} align="center" sx={{ py: 4, color: "gray" }}>
                            No members found
                          </TableCell>
                        </TableRow>
                      )}
                      {emptyRows > 0 && <TableRow><TableCell colSpan={6} /></TableRow>}
                    </TableBody>
                  </Table>
                </TableContainer>
                <TablePagination
                  rowsPerPageOptions={[17, 10, 8, 5]}
                  component="div"
                  count={filteredMembers.length}
                  rowsPerPage={rowsPerPage}
                  page={page}
                  onPageChange={handleChangePage}
                  onRowsPerPageChange={handleChangeRowsPerPage}
                />
              </Paper>
            )}

            {/* Modal about member info */}
            <Dialog
              open={modalInfoAboutMember}
              onClose={() => setModalInfoAboutMember(false)}
              maxWidth="md"
              fullWidth
            >
              <div className="modal_info_about_member_block sm:p-4 md:p-2.5 flex items-center gap-5 min-w-0 flex-wrap">
                <div className="info_about_member shrink-0 flex flex-col sm:justify-center md:justify-start sm:w-full md:w-[45%]">
                  <div className="btn_close_block">
                    <IoArrowBackCircleOutline size={25} className="cursor-pointer" onClick={() => setModalInfoAboutMember(false)} />
                  </div>
                  <div className="info_about_member flex flex-col sm:justify-center md:justify-start sm:items-center md:items-start">
                    <img
                      src={selectedMember?.member_image_url || selectedMember?.photoURL || userImg}
                      className="w-58.5 h-68.5 rounded-xl object-cover"
                      alt=""
                      onError={(e: any) => { e.target.src = userImg; }}
                    />
                    <div className="info_text_block">
                      <h1 className="info_text_title text-[22px] font-500">Bio Info</h1>
                      <h1 className="text-[#6E6E6E] text-[17px] font-500">Full Name: <span className="text-black font-400">{selectedMember?.fullName || selectedMember?.name || "-"}</span></h1>
                      <h1 className="text-[#6E6E6E] text-[17px] font-500">Birth Date: <span className="text-black font-400">{selectedMember?.dateOfBirth || selectedMember?.date_of_birth || "-"}</span></h1>
                      <h1 className="text-[#6E6E6E] text-[17px] font-500">Phone: <span className="text-black font-400">{selectedMember?.phoneNumber || selectedMember?.phone || "-"}</span></h1>
                      <h1 className="text-[#6E6E6E] text-[17px] font-500">Email: <span className="text-black font-400">{selectedMember?.email || "-"}</span></h1>
                    </div>
                  </div>
                </div>
                <div className="info_bookshelf_and_history_book_block flex flex-col gap-3 flex-1 min-w-0">
                  <div className="info_about_bookshelf_of_member">
                    <h1 className="bookshelf_title text-[25px] font-500 border-b-3">Bookshelf</h1>
                    <div className="bookshelf_block p-3 h-47 overflow-auto flex flex-col gap-3 border-b-2 border-b-[#D9D9D9] w-full">
                      {bookshelf.length === 0 ? (
                        <p className="text-gray-400 text-center py-4">No books currently borrowed</p>
                      ) : (
                        bookshelf.map((book: any) => (
                          <div key={book.id} className="boolshelf_container flex justify-between items-center gap-3">
                            <div className="img_book_name_and_author_name_block flex items-center gap-3">
                              <div className="block_img bg-[#F5EABD] p-2 rounded-[5px]">
                                <img src={book.image_url || userImg} alt="" className="w-10.75 h-15 object-cover" />
                              </div>
                              <div className="name_and_author_of_book">
                                <h1 className="name_of_book text-[20px] font-500">{book.bookTitle || book.title}</h1>
                                <p className="author_of_book text-[#515151] text-[14px] font-400">{book.author}</p>
                              </div>
                            </div>
                            <div className="icon_and_days_left">
                              <h1 className="flex items-center text-[#FF383C] gap-1.5">
                                <LuOctagonAlert size={18} />
                                <span className="text-[12px] font-600">{book.dueDate || "-"}</span>
                              </h1>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                  <div className="info_about_history_book_of_member">
                    <h1 className="history_book_title text-[25px] font-500 border-b-3">History Book</h1>
                    <div className="history_book_block p-3 h-47 overflow-auto flex flex-col gap-3 border-b-2 border-b-[#D9D9D9]">
                      {history.length === 0 ? (
                        <p className="text-gray-400 text-center py-4">No history yet</p>
                      ) : (
                        history.map((book: any) => (
                          <div key={book.id} className="hisory_book_container flex items-center gap-3">
                            <div className="block_img bg-[#F5EABD] p-2 rounded-[5px]">
                              <img src={book.image_url || userImg} alt="" className="w-10.75 h-15 object-cover" />
                            </div>
                            <div className="name_and_author_of_book">
                              <h1 className="name_of_book text-[20px] font-500">{book.bookTitle || book.title}</h1>
                              <p className="author_of_book text-[#515151] text-[14px] font-400">{book.author}</p>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </Dialog>
          </div>
        </div>
      </div>
    </>
  );
};

export default Members;