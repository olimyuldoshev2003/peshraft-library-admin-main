import { useState, useEffect } from "react";
import { getAdmins, deleteAdmin } from "../../firebase/services";
import { Dialog, DialogTitle } from "@mui/material";
import { MdOutlineClose } from "react-icons/md";
import { CircularProgress } from "@mui/material";

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
    return <div className="p-6 text-gray-400">Loading admins...</div>;

  return (
    <>
      <div className="p-6 max-w-2xl">
        <h1 className="text-3xl font-semibold text-gray-800 mb-6">
          Admins
          <span className="ml-2 text-base text-gray-400 font-normal">
            {admins.length}/5
          </span>
        </h1>

        {admins.length === 0 ? (
          <p className="text-gray-400">No admins found.</p>
        ) : (
          <div className="flex flex-col gap-3">
            {admins.map((admin) => (
              <div
                key={admin.id}
                className="bg-white border border-gray-100 rounded-xl shadow-sm px-5 py-4 flex items-center justify-between gap-4"
              >
                <div className="flex items-center gap-3">
                  <img
                    src={
                      admin.admin_image_url ||
                      `https://ui-avatars.com/api/?name=${encodeURIComponent(admin.fullName || admin.name || "A")}`
                    }
                    className="w-10 h-10 rounded-full object-cover"
                    alt=""
                  />
                  <div>
                    <p className="font-semibold text-gray-800">
                      {admin.fullName || admin.name || "—"}
                      {admin.is_main_admin && (
                        <span className="ml-2 text-xs bg-blue-100 text-blue-600 px-2 py-0.5 rounded-full">
                          Main Admin
                        </span>
                      )}
                    </p>
                    <p className="text-gray-500 text-sm">{admin.email}</p>
                  </div>
                </div>
                {admin.is_main_admin ? (
                  <span className="text-gray-300 text-sm">Protected</span>
                ) : (
                  <button
                    onClick={() => handleDeleteClick(admin)}
                    disabled={deletingId === admin.id}
                    className="bg-red-50 hover:bg-red-100 text-red-500 border border-red-200 rounded-lg px-4 py-1.5 text-sm font-semibold transition disabled:opacity-50"
                  >
                    {deletingId === admin.id ? "..." : "Delete"}
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
      </Dialog>
    </>
  );
};

export default DeleteAdmins;
