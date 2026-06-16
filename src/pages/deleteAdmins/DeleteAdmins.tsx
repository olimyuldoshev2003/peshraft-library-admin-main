import { useState } from "react";
import { getAdmins, deleteAdmin } from "../../firebase/services";

const MASTER_PASSWORD = "1masterside$";

const DeleteAdmins = () => {
  const [password, setPassword] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [admins, setAdmins] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const handleUnlock = () => {
    if (password === MASTER_PASSWORD) {
      setIsUnlocked(true);
      setPasswordError("");
      loadAdmins();
    } else {
      setPasswordError("Incorrect password. Access denied.");
    }
  };

  const loadAdmins = async () => {
    setLoading(true);
    const data = await getAdmins();
    setAdmins(data);
    setLoading(false);
  };

  const handleDelete = async (admin: any) => {
    if (admin.is_main_admin) { alert("Cannot delete the main admin."); return; }
    if (!window.confirm(`Delete admin "${admin.fullName || admin.name || admin.email}"?`)) return;
    setDeletingId(admin.id);
    await deleteAdmin(admin.id);
    setAdmins((prev) => prev.filter((a) => a.id !== admin.id));
    setDeletingId(null);
  };

  if (!isUnlocked) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-6">
        <div className="bg-white rounded-2xl shadow-md p-8 w-full max-w-sm flex flex-col gap-4">
          <h1 className="text-2xl font-semibold text-center text-gray-800">🔒 Master Access</h1>
          <p className="text-sm text-gray-500 text-center">Enter the master password to continue.</p>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleUnlock()}
            placeholder="Enter master password"
            className="border border-gray-300 rounded-lg px-4 py-2.5 text-base outline-none focus:border-blue-400"
          />
          {passwordError && <p className="text-red-500 text-sm text-center">{passwordError}</p>}
          <button onClick={handleUnlock} className="bg-blue-500 hover:bg-blue-600 text-white rounded-lg py-2.5 font-semibold transition">
            Unlock
          </button>
        </div>
      </div>
    );
  }

  if (loading) return <div className="p-6 text-gray-400">Loading admins...</div>;

  return (
    <div className="p-6 max-w-2xl">
      <h1 className="text-3xl font-semibold text-gray-800 mb-6">
        Admins
        <span className="ml-2 text-base text-gray-400 font-normal">{admins.length}/5</span>
      </h1>

      {admins.length === 0 ? (
        <p className="text-gray-400">No admins found.</p>
      ) : (
        <div className="flex flex-col gap-3">
          {admins.map((admin) => (
            <div key={admin.id} className="bg-white border border-gray-100 rounded-xl shadow-sm px-5 py-4 flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <img
                  src={admin.admin_image_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(admin.fullName || admin.name || "A")}`}
                  className="w-10 h-10 rounded-full object-cover"
                  alt=""
                />
                <div>
                  <p className="font-semibold text-gray-800">
                    {admin.fullName || admin.name || "—"}
                    {admin.is_main_admin && (
                      <span className="ml-2 text-xs bg-blue-100 text-blue-600 px-2 py-0.5 rounded-full">Main Admin</span>
                    )}
                  </p>
                  <p className="text-gray-500 text-sm">{admin.email}</p>
                </div>
              </div>
              {admin.is_main_admin ? (
                <span className="text-gray-300 text-sm">Protected</span>
              ) : (
                <button
                  onClick={() => handleDelete(admin)}
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
  );
};

export default DeleteAdmins;