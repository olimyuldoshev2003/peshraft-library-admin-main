import "./Dashboard.css";
// import { HiOutlineSearch } from "react-icons/hi";
import noImg from "../../assets/no-img.jpg";
import { LuUsers } from "react-icons/lu";
import { PiBookOpen } from "react-icons/pi";
import SecurityUpdateGoodOutlinedIcon from "@mui/icons-material/SecurityUpdateGoodOutlined";
import { MdOutlineSecurityUpdateWarning } from "react-icons/md";
import { BarChart } from "@mui/x-charts/BarChart";
import TableContainer from "@mui/material/TableContainer";
import Table from "@mui/material/Table";
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";
import TableCell, { tableCellClasses } from "@mui/material/TableCell";
import { styled } from "@mui/material/styles";
import TableBody from "@mui/material/TableBody";
import { useEffect, useState } from "react";
import CircularProgress from "@mui/material/CircularProgress";

// 🔥 Firebase
import {
  getDashboardStats,
  getOverdueBorrowers,
} from "../../firebase/services";
import { useAuth } from "../../context/AuthContext";

const Dashboard = () => {
  const { adminProfile } = useAuth();
  console.log(adminProfile);

  const [stat, setStat] = useState<any>({});
  const [loadingStat, setLoadingStat] = useState(false);
  const [overdueBorrowers, setOverdueBorrowers] = useState<any[]>([]);

  const [dataset, setDataset] = useState<any[]>([
    { overdue: 0, borrowed: 0, month: "Jan" },
    { overdue: 0, borrowed: 0, month: "Feb" },
    { overdue: 0, borrowed: 0, month: "Mar" },
    { overdue: 0, borrowed: 0, month: "Apr" },
    { overdue: 0, borrowed: 0, month: "May" },
    { overdue: 0, borrowed: 0, month: "June" },
    { overdue: 0, borrowed: 0, month: "July" },
    { overdue: 0, borrowed: 0, month: "Aug" },
    { overdue: 0, borrowed: 0, month: "Sept" },
    { overdue: 0, borrowed: 0, month: "Oct" },
    { overdue: 0, borrowed: 0, month: "Nov" },
    { overdue: 0, borrowed: 0, month: "Dec" },
  ]);

  const StyledTableCell = styled(TableCell)(({ theme }) => ({
    [`&.${tableCellClasses.head}`]: {
      backgroundColor: theme.palette.common.black,
      color: theme.palette.common.white,
      whiteSpace: "nowrap",
    },
    [`&.${tableCellClasses.body}`]: { fontSize: 14, whiteSpace: "nowrap" },
  }));

  const StyledTableRow = styled(TableRow)(({ theme }) => ({
    "&:nth-of-type(odd)": { backgroundColor: theme.palette.action.hover },
    "&:last-child td, &:last-child th": { border: 0 },
  }));

  async function loadData() {
    setLoadingStat(true);
    try {
      const [stats, overdue] = await Promise.all([
        getDashboardStats(),
        getOverdueBorrowers(),
      ]);
      setStat(stats);
      setOverdueBorrowers(overdue);

      // Build real monthly chart data from borrows collection
      const { getDocs, collection } = await import("firebase/firestore");
      const { db: firedb } = await import("../../firebase/config");
      const borrowsSnap = await getDocs(collection(firedb, "borrows"));
      const monthNames = [
        "Jan",
        "Feb",
        "Mar",
        "Apr",
        "May",
        "June",
        "July",
        "Aug",
        "Sept",
        "Oct",
        "Nov",
        "Dec",
      ];
      const monthData: any = {};
      monthNames.forEach((m, i) => {
        monthData[i] = { overdue: 0, borrowed: 0, month: m };
      });
      const now = new Date();
      borrowsSnap.forEach((doc: any) => {
        const d = doc.data();
        const borrowDate =
          d.dateBorrowed?.toDate?.() ||
          (d.dateBorrowed ? new Date(d.dateBorrowed) : null);
        if (borrowDate) {
          const monthIdx = borrowDate.getMonth();
          monthData[monthIdx].borrowed += 1;
          const dueDate =
            d.dueDate?.toDate?.() || (d.dueDate ? new Date(d.dueDate) : null);
          if (dueDate && dueDate < now && d.status === "active") {
            monthData[monthIdx].overdue += 1;
          }
        }
      });
      setDataset(Object.values(monthData));
    } catch (error) {
      console.error(error);
    } finally {
      setLoadingStat(false);
    }
  }

  useEffect(() => {
    loadData();
  }, []);

  return (
    <>
      <div className="dashboard_component p-4 max-w-360 mx-auto">
        <div className="header_dashboard_admin flex justify-end items-center">
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

        <div className="section_dashboard_admin mt-5">
          <h1 className="title_admin_dashboard text-[25px] font-600">
            Admin Dashboard
          </h1>

          {loadingStat ? (
            <div className="flex justify-center mt-6">
              <CircularProgress />
            </div>
          ) : (
            <div className="amount_block flex justify-between items-center mt-2 sm:flex-col md:flex-row md:flex-wrap gap-4">
              <div className="amount_block_members bg-[#F1E7FF] p-2.5 flex justify-between items-center gap-5 rounded-[10px] sm:w-full md:w-[48%] lg:w-max flex-1">
                <div>
                  <h1 className="title">Members</h1>
                  <h1 className="amount">{stat.total_members ?? 0}</h1>
                </div>
                <LuUsers style={{ color: "#6D05FF", fontSize: "40px" }} />
              </div>
              <div className="amount_block_total_books bg-[#E4F5FF] p-2.5 flex justify-between items-center gap-5 rounded-[10px] sm:w-full md:w-[48%] lg:w-max flex-1">
                <div>
                  <h1 className="title">Total Books</h1>
                  <h1 className="amount">{stat.total_books ?? 0}</h1>
                </div>
                <PiBookOpen style={{ color: "#37B5FF", fontSize: "40px" }} />
              </div>
              <div className="amount_block_books_borrowers bg-[#EAFEEF] p-2.5 flex justify-between items-center gap-5 rounded-[10px] sm:w-full md:w-[48%] lg:w-max flex-1">
                <div>
                  <h1 className="title">Books Borrowers</h1>
                  <h1 className="amount">{stat.active_borrows ?? 0}</h1>
                </div>
                <SecurityUpdateGoodOutlinedIcon
                  style={{ color: "#00FF40", fontSize: "40px" }}
                />
              </div>
              <div className="amount_block_overdue_books bg-[#FFDADB] p-2.5 flex justify-between items-center gap-5 rounded-[10px] sm:w-full md:w-[48%] lg:w-max flex-1">
                <div>
                  <h1 className="title">Overdue Books</h1>
                  <h1 className="amount">{stat.overdue_books ?? 0}</h1>
                </div>
                <MdOutlineSecurityUpdateWarning
                  style={{ color: "#FD286F", fontSize: "40px" }}
                />
              </div>
            </div>
          )}

          <div className="monthly_borrowing_summary_and_volunteeers_graph_block mt-5 flex flex-col lg:flex-row justify-between gap-8 lg:gap-20">
            <div className="monthly_borrowing_summary_graph_block w-full lg:w-2/3 overflow-x-auto">
              <h1 className="title_monthly_borrowing_summary text-[25px] font-600 mb-4">
                Monthly Borrowing Summary
              </h1>
              <BarChart
                dataset={dataset}
                xAxis={[{ dataKey: "month", scaleType: "band" }]}
                series={[
                  {
                    dataKey: "overdue",
                    label: "Overdue",
                    valueFormatter: (v: number | null) => `${v}`,
                  },
                  {
                    dataKey: "borrowed",
                    label: "Borrowed",
                    valueFormatter: (v: number | null) => `${v}`,
                  },
                ]}
                yAxis={[{ width: 60 }]}
                height={300}
              />
            </div>
          </div>

          <div className="priority_overdue_borrewers_list_block mt-8">
            <h1 className="title_priority_overdue_borrewers text-[25px] font-600 mb-4">
              Priority Overdue Borrowers
            </h1>
            <TableContainer>
              <Table aria-label="customized table">
                <TableHead>
                  <TableRow>
                    <StyledTableCell sx={{ minWidth: 150 }}>
                      Full Name
                    </StyledTableCell>
                    <StyledTableCell sx={{ minWidth: 150 }}>
                      Phone Number
                    </StyledTableCell>
                    <StyledTableCell sx={{ minWidth: 200 }}>
                      Book Title
                    </StyledTableCell>
                    <StyledTableCell sx={{ minWidth: 120 }}>
                      Borrow date
                    </StyledTableCell>
                    <StyledTableCell sx={{ minWidth: 120 }}>
                      Due Date
                    </StyledTableCell>
                    <StyledTableCell sx={{ minWidth: 120 }}>
                      Days Overdue
                    </StyledTableCell>
                    <StyledTableCell sx={{ minWidth: 120 }}>
                      Status
                    </StyledTableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {overdueBorrowers.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7}>
                        <h1 className="text-center text-gray-400 py-4">
                          No overdue borrowers 🎉
                        </h1>
                      </TableCell>
                    </TableRow>
                  ) : (
                    overdueBorrowers.map((borrower: any) => (
                      <StyledTableRow key={borrower.id}>
                        <StyledTableCell>
                          {borrower.borrowerName}
                        </StyledTableCell>
                        <StyledTableCell>
                          {borrower.phoneNumber}
                        </StyledTableCell>
                        <StyledTableCell>{borrower.bookTitle}</StyledTableCell>
                        <StyledTableCell>
                          {borrower.dateBorrowed
                            ?.toDate?.()
                            ?.toLocaleDateString?.() || borrower.dateBorrowed}
                        </StyledTableCell>
                        <StyledTableCell>
                          {borrower.dueDate
                            ?.toDate?.()
                            ?.toLocaleDateString?.() || borrower.dueDate}
                        </StyledTableCell>
                        <StyledTableCell>
                          {borrower.daysOverdue}
                        </StyledTableCell>
                        <StyledTableCell
                          style={{ color: "red", fontWeight: "bold" }}
                        >
                          Danger
                        </StyledTableCell>
                      </StyledTableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          </div>
        </div>
      </div>
    </>
  );
};

export default Dashboard;
