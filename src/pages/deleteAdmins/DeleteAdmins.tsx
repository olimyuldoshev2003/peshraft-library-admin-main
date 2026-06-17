import { useState, useEffect } from "react";
import { getAdmins, deleteAdmin } from "../../firebase/services";
import { Dialog } from "@mui/material";
import { MdOutlineClose } from "react-icons/md";
import { CircularProgress } from "@mui/material";
import { FaUserShield, FaTrashAlt, FaUserCog } from "react-icons/fa";
import { HiOutlineMail } from "react-icons/hi";
import { RiAdminLine } from "react-icons/ri";

const DeleteAdmins = () => {
  const [admins, setAdmins] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [modalDeleteOpen, setModalDeleteOpen] = useState(false);
  const [selectedAdmin, setSelectedAdmin] = useState<any>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    loadAdmins();
  }, []);

  const loadAdmins = async () => {
    setLoading(true);
    const data = await getAdmins();
    console.log(data);

    setAdmins(data);
    setLoading(false);
  };

  const handleDeleteClick = (admin: any) => {
    if (admin.is_main_admin) {
      alert("Cannot delete the main admin.");
      return;
    }
    setSelectedAdmin(admin);
    setModalDeleteOpen(true);
  };

  const handleDelete = async () => {
    if (!selectedAdmin) return;

    setSubmitting(true);
    setDeletingId(selectedAdmin.id);

    await deleteAdmin(selectedAdmin.id);
    setAdmins((prev) => prev.filter((a) => a.id !== selectedAdmin.id));

    setDeletingId(null);
    setSubmitting(false);
    setModalDeleteOpen(false);
    setSelectedAdmin(null);
  };

  if (loading)
    return (
      <div className="p-6 w-full flex items-center justify-center h-full">
        <div className="flex flex-col items-center gap-4">
          <CircularProgress size={40} sx={{ color: "#6366f1" }} />
          <p className="text-gray-400 font-medium">Loading admins...</p>
        </div>
      </div>
    );

  return (
    <>
      <div className="p-6 max-w-3xl mx-auto">
        {/* Header Section */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-indigo-50 rounded-xl">
                <RiAdminLine className="text-2xl text-indigo-600" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-gray-800">Admins</h1>
                <p className="text-sm text-gray-500 mt-0.5">
                  Manage your admin team members
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 bg-gray-50 px-4 py-2 rounded-full border border-gray-200">
              <span className="text-sm font-semibold text-gray-700">
                {admins.length}
              </span>
              <span className="text-gray-400">/ 5</span>
              <span className="w-px h-4 bg-gray-300 mx-2"></span>
              <FaUserCog className="text-gray-400" />
            </div>
          </div>
        </div>

        {admins.length === 0 ? (
          <div className="text-center py-12 bg-gray-50 rounded-2xl border-2 border-dashed border-gray-200">
            <RiAdminLine className="text-5xl text-gray-300 mx-auto mb-3" />
            <p className="text-gray-400 font-medium">No admins found</p>
            <p className="text-sm text-gray-300 mt-1">
              Add your first admin to get started
            </p>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {admins.map((admin) => (
              <div
                key={admin.id}
                className="group bg-white border border-gray-100 hover:border-indigo-200 rounded-2xl shadow-sm hover:shadow-md transition-all duration-300 px-5 py-4 flex items-center justify-between gap-4"
              >
                <div className="flex items-center gap-4 flex-1 min-w-0">
                  <div className="relative">
                    <img
                      src={
                        admin.admin_image_url ||
                        `https://ui-avatars.com/api/?name=${encodeURIComponent(
                          admin.fullName || admin.name || "A",
                        )}&background=6366f1&color=fff&size=40`
                      }
                      className="w-12 h-12 rounded-full object-cover ring-2 ring-indigo-100"
                      alt=""
                    />
                    {admin.is_main_admin && (
                      <div className="absolute -top-1 -right-1 bg-indigo-600 rounded-full p-0.5">
                        <FaUserShield className="text-white text-[10px]" />
                      </div>
                    )}
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="font-semibold text-gray-800 truncate">
                        {admin.fullName || admin.name || "—"}
                      </p>
                      {admin.is_main_admin && (
                        <span className="text-xs bg-indigo-100 text-indigo-700 px-2.5 py-0.5 rounded-full font-medium flex items-center gap-1">
                          <FaUserShield className="text-[10px]" />
                          Main Admin
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-1.5 text-gray-500 text-sm">
                      <HiOutlineMail className="text-gray-400" />
                      <span className="truncate">{admin.email}</span>
                    </div>
                  </div>
                </div>

                {admin.is_main_admin ? (
                  <span className="text-xs font-medium text-gray-400 bg-gray-50 px-3 py-1.5 rounded-full border border-gray-200">
                    Protected
                  </span>
                ) : (
                  <button
                    onClick={() => handleDeleteClick(admin)}
                    disabled={deletingId === admin.id}
                    className="flex items-center gap-2 bg-red-50 hover:bg-red-100 text-red-500 border border-red-200 hover:border-red-300 rounded-xl px-4 py-2 text-sm font-semibold transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed hover:shadow-sm group/btn cursor-pointer"
                  >
                    {deletingId === admin.id ? (
                      <CircularProgress size={16} sx={{ color: "#ef4444" }} />
                    ) : (
                      <>
                        <FaTrashAlt className="text-xs" />
                        Delete
                      </>
                    )}
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      <Dialog
        open={modalDeleteOpen}
        onClose={() => !submitting && setModalDeleteOpen(false)}
        fullWidth
        maxWidth="sm"
        PaperProps={{
          sx: {
            borderRadius: "16px",
            padding: "8px",
          },
        }}
      >
        <div className="px-6 py-5">
          {/* Header */}
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-red-50 rounded-xl">
                <FaTrashAlt className="text-red-500 text-lg" />
              </div>
              <h2 className="text-xl font-bold text-gray-800">Delete Admin</h2>
            </div>
            <button
              className="p-2 hover:bg-gray-100 rounded-full transition-colors duration-200 cursor-pointer"
              onClick={() => !submitting && setModalDeleteOpen(false)}
              disabled={submitting}
            >
              <MdOutlineClose size={22} className="text-gray-500" />
            </button>
          </div>

          {/* Content */}
          <div className="mt-4 mb-6">
            <p className="text-gray-600 text-[15px] leading-relaxed">
              Are you sure you want to delete admin{" "}
              <span className="font-semibold text-gray-800">
                "
                {selectedAdmin?.fullName ||
                  selectedAdmin?.name ||
                  selectedAdmin?.email}
                "
              </span>
              ? This action{" "}
              <span className="text-red-500 font-medium">cannot be undone</span>
              .
            </p>

            {selectedAdmin && (
              <div className="mt-4 p-3 bg-gray-50 rounded-xl border border-gray-100 flex items-center gap-3">
                <img
                  src={
                    selectedAdmin.admin_image_url ||
                    `https://ui-avatars.com/api/?name=${encodeURIComponent(
                      selectedAdmin.fullName || selectedAdmin.name || "A",
                    )}&background=6366f1&color=fff&size=32`
                  }
                  className="w-8 h-8 rounded-full object-cover"
                  alt=""
                />
                <div>
                  <p className="text-sm font-medium text-gray-700">
                    {selectedAdmin.fullName || selectedAdmin.name}
                  </p>
                  <p className="text-xs text-gray-400">{selectedAdmin.email}</p>
                </div>
              </div>
            )}
          </div>

          {/* Buttons */}
          <div className="flex gap-3">
            <button
              className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold py-2.5 rounded-xl transition-colors duration-200 cursor-pointer"
              onClick={() => !submitting && setModalDeleteOpen(false)}
              disabled={submitting}
            >
              Cancel
            </button>
            <button
              className="flex-1 bg-red-500 hover:bg-red-600 text-white font-semibold py-2.5 rounded-xl transition-colors duration-200 cursor-pointer disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center"
              onClick={handleDelete}
              disabled={submitting}
            >
              {submitting ? (
                <div className="flex items-center gap-2">
                  <CircularProgress size={20} sx={{ color: "white" }} />
                  <span>Deleting...</span>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <FaTrashAlt className="text-sm" />
                  Delete Admin
                </div>
              )}
            </button>
          </div>
        </div>
      </Dialog>

      {/* Delete Confirmation Modal */}
      {/* <Dialog
        open={modalDeleteOpen}
        onClose={() => !submitting && setModalDeleteOpen(false)}
        fullWidth
      >
        <div className="modal_delete_notification_block px-4 py-4">
          <div className="header_delete_notification_block flex items-center gap-6 justify-between">
            <h1 className="text-[17px] font-600">Delete Admin</h1>
            <button
              className="close_modal_btn outline-none cursor-pointer p-2 bg-[#D9D9D9] rounded-full hover:bg-gray-400 transition-colors"
              onClick={() => !submitting && setModalDeleteOpen(false)}
              disabled={submitting}
            >
              <MdOutlineClose size={27} />
            </button>
          </div>
          <DialogTitle sx={{ fontSize: 15, pt: 2 }}>
            Are you sure you want to delete admin "
            {selectedAdmin?.fullName ||
              selectedAdmin?.name ||
              selectedAdmin?.email}
            "? This action cannot be undone.
          </DialogTitle>
          <div className="block_btns flex gap-2 justify-between sm:flex-col-reverse md:flex-row">
            <button
              className="bg-gray-500 p-2.5 rounded-[10px] text-white text-[18px] font-500 cursor-pointer w-full duration-300 hover:bg-gray-600 transition-colors"
              onClick={() => !submitting && setModalDeleteOpen(false)}
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
      </Dialog> */}
    </>
  );
};

export default DeleteAdmins;
