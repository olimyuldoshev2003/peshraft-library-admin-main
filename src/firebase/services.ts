// ============================================================
// FIREBASE SERVICES - All database operations for Admin Panel
// ============================================================

import {
  collection,
  doc,
  getDocs,
  getDoc,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  Timestamp,
  setDoc,
} from "firebase/firestore";
import {
  signInWithEmailAndPassword,
  signOut,
  createUserWithEmailAndPassword,
  updateProfile,
} from "firebase/auth";
import { db, auth } from "./config";

// ============================================================
// CLOUDINARY IMAGE UPLOAD with auto compression
// ============================================================

const CLOUDINARY_CLOUD_NAME = "dpcb2bzyg";
const CLOUDINARY_UPLOAD_PRESET = "peshraft";

const compressImage = (file: File, maxSizeMB = 1): Promise<File> => {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (e) => {
      const img = new Image();
      img.src = e.target?.result as string;
      img.onload = () => {
        const canvas = document.createElement("canvas");
        let { width, height } = img;
        const MAX_DIMENSION = 1200;
        if (width > MAX_DIMENSION || height > MAX_DIMENSION) {
          if (width > height) {
            height = Math.round((height * MAX_DIMENSION) / width);
            width = MAX_DIMENSION;
          } else {
            width = Math.round((width * MAX_DIMENSION) / height);
            height = MAX_DIMENSION;
          }
        }
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d")!;
        ctx.drawImage(img, 0, 0, width, height);
        let quality = 0.8;
        const tryCompress = () => {
          canvas.toBlob(
            (blob) => {
              if (
                blob &&
                blob.size > maxSizeMB * 1024 * 1024 &&
                quality > 0.1
              ) {
                quality -= 0.1;
                tryCompress();
              } else if (blob) {
                resolve(new File([blob], file.name, { type: "image/jpeg" }));
              }
            },
            "image/jpeg",
            quality,
          );
        };
        tryCompress();
      };
    };
  });
};

export const uploadImageToCloudinary = async (file: File): Promise<string> => {
  const compressed = await compressImage(file);
  const formData = new FormData();
  formData.append("file", compressed);
  formData.append("upload_preset", CLOUDINARY_UPLOAD_PRESET);
  const response = await fetch(
    `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`,
    { method: "POST", body: formData },
  );
  const data = await response.json();
  if (!data.secure_url) throw new Error(data.error?.message || "Upload failed");
  return data.secure_url;
};

// ============================================================
// AUTH SERVICES
// ============================================================

export const firebaseSignIn = async (email: string, password: string) => {
  const userCredential = await signInWithEmailAndPassword(
    auth,
    email,
    password,
  );
  return userCredential.user;
};

export const firebaseSignUp = async (
  email: string,
  password: string,
  fullName: string,
  phoneNumber: string,
  dateOfBirth: string,
) => {
  const userCredential = await createUserWithEmailAndPassword(
    auth,
    email,
    password,
  );
  const user = userCredential.user;
  await updateProfile(user, { displayName: fullName });
  await setDoc(doc(db, "admins", user.uid), {
    uid: user.uid,
    fullName,
    email,
    phoneNumber,
    dateOfBirth,
    role: "pending",
    createdAt: Timestamp.now(),
  });
  return user;
};

export const firebaseSignOut = async () => {
  await signOut(auth);
};

// ============================================================
// BOOKS SERVICES
// ============================================================

export const getBooks = async (searchTerm = "") => {
  const booksRef = collection(db, "books");
  const snapshot = await getDocs(booksRef);
  const books = snapshot.docs.map((doc: any) => ({
    id: doc.id,
    ...doc.data(),
  }));
  if (searchTerm) {
    const lower = searchTerm.toLowerCase();
    return books.filter(
      (b: any) =>
        b.title?.toLowerCase().includes(lower) ||
        b.author?.toLowerCase().includes(lower),
    );
  }
  return books;
};

export const getBookById = async (bookId: string) => {
  const docRef = doc(db, "books", bookId);
  const docSnap = await getDoc(docRef);
  if (docSnap.exists()) return { id: docSnap.id, ...docSnap.data() };
  return null;
};

export const addBook = async (
  bookData: any,
  imageFile?: File,
  bgImageFile?: File,
) => {
  let image_url = "";
  let bg_image_url = "";
  if (imageFile) image_url = await uploadImageToCloudinary(imageFile);
  if (bgImageFile) bg_image_url = await uploadImageToCloudinary(bgImageFile);
  const docRef = await addDoc(collection(db, "books"), {
    ...bookData,
    image_url,
    bg_image_url,
    createdAt: Timestamp.now(),
  });
  return docRef.id;
};

export const updateBook = async (
  bookId: string,
  bookData: any,
  imageFile?: File,
  bgImageFile?: File,
) => {
  let updateData = { ...bookData };
  if (imageFile)
    updateData.image_url = await uploadImageToCloudinary(imageFile);
  if (bgImageFile)
    updateData.bg_image_url = await uploadImageToCloudinary(bgImageFile);
  await updateDoc(doc(db, "books", bookId), updateData);
};

export const deleteBook = async (bookId: string) => {
  await deleteDoc(doc(db, "books", bookId));
};

// ============================================================
// CATEGORIES / FILTERS SERVICES
// ============================================================

export const getCategories = async () => {
  const snapshot = await getDocs(collection(db, "categories"));
  return snapshot.docs.map((doc: any) => ({
    id: doc.id,
    filterName: doc.data().name,
    ...doc.data(),
  }));
};

export const addCategory = async (name: string) => {
  const docRef = await addDoc(collection(db, "categories"), {
    name,
    filterName: name,
    createdAt: Timestamp.now(),
  });
  return docRef.id;
};

export const updateCategory = async (categoryId: string, name: string) => {
  await updateDoc(doc(db, "categories", categoryId), {
    name,
    filterName: name,
  });
};

export const deleteCategory = async (categoryId: string) => {
  await deleteDoc(doc(db, "categories", categoryId));
};

// ============================================================
// MEMBERS SERVICES
// ============================================================

export const getAdmins = async () => {
  const snapshot = await getDocs(collection(db, "admins"));
  return snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
};

export const deleteAdmin = async (adminId: string) => {
  await deleteDoc(doc(db, "admins", adminId));
};

export const deleteMember = async (memberId: string) => {
  await deleteDoc(doc(db, "users", memberId));
};

export const getMembers = async () => {
  const snapshot = await getDocs(collection(db, "users"));
  return snapshot.docs.map((doc: any) => ({ id: doc.id, ...doc.data() }));
};

export const getMemberById = async (memberId: string) => {
  const docSnap = await getDoc(doc(db, "users", memberId));
  if (docSnap.exists()) return { id: docSnap.id, ...docSnap.data() };
  return null;
};

export const getMemberBookshelf = async (memberId: string) => {
  const q = query(
    collection(db, "borrows"),
    where("userId", "==", memberId),
    where("status", "==", "active"),
  );
  const snapshot = await getDocs(q);
  return snapshot.docs.map((doc: any) => ({ id: doc.id, ...doc.data() }));
};

export const getMemberHistory = async (memberId: string) => {
  const q = query(
    collection(db, "borrows"),
    where("userId", "==", memberId),
    where("status", "==", "returned"),
  );
  const snapshot = await getDocs(q);
  return snapshot.docs.map((doc: any) => ({ id: doc.id, ...doc.data() }));
};

// ============================================================
// BOOK REQUESTS SERVICES
// ============================================================

export const getReceiveBookRequests = async () => {
  const q = query(
    collection(db, "bookRequests"),
    where("type", "==", "receive"),
    where("status", "==", "pending"),
  );
  const snapshot = await getDocs(q);
  return snapshot.docs.map((doc: any) => ({ id: doc.id, ...doc.data() }));
};

export const acceptReceiveBookRequest = async (requestId: string) => {
  const reqDoc = await getDoc(doc(db, "bookRequests", requestId));
  if (!reqDoc.exists()) return;
  const reqData = reqDoc.data();
  await updateDoc(doc(db, "bookRequests", requestId), { status: "accepted" });
  await addDoc(collection(db, "borrows"), {
    userId: reqData.userId,
    bookId: reqData.bookId,
    bookTitle: reqData.bookTitle,
    borrowerName: reqData.userName,
    phoneNumber: reqData.phoneNumber,
    email: reqData.email,
    dateBorrowed: Timestamp.now(),
    dueDate: reqData.borrowUntil,
    status: "active",
  });
  const bookDoc = await getDoc(doc(db, "books", reqData.bookId));
  if (bookDoc.exists()) {
    const copies = bookDoc.data().available_copies || 1;
    await updateDoc(doc(db, "books", reqData.bookId), {
      available_copies: Math.max(0, copies - 1),
    });
  }
};

export const declineReceiveBookRequest = async (requestId: string) => {
  await updateDoc(doc(db, "bookRequests", requestId), { status: "declined" });
};

export const getReturnBookRequests = async () => {
  const q = query(
    collection(db, "bookRequests"),
    where("type", "==", "return"),
    where("status", "==", "pending"),
  );
  const snapshot = await getDocs(q);
  return snapshot.docs.map((doc: any) => ({ id: doc.id, ...doc.data() }));
};

export const acceptReturnBookRequest = async (requestId: string) => {
  const reqDoc = await getDoc(doc(db, "bookRequests", requestId));
  if (!reqDoc.exists()) return;
  const reqData = reqDoc.data();
  await updateDoc(doc(db, "bookRequests", requestId), { status: "accepted" });
  if (reqData.borrowId) {
    await updateDoc(doc(db, "borrows", reqData.borrowId), {
      status: "returned",
      returnedAt: Timestamp.now(),
    });
  }
  const bookDoc = await getDoc(doc(db, "books", reqData.bookId));
  if (bookDoc.exists()) {
    const copies = bookDoc.data().available_copies || 0;
    await updateDoc(doc(db, "books", reqData.bookId), {
      available_copies: copies + 1,
    });
  }
};

// ============================================================
// RECEIVED MEMBERS
// ============================================================

export const getReceivedMembers = async () => {
  const q = query(collection(db, "borrows"), where("status", "==", "active"));
  const snapshot = await getDocs(q);
  return snapshot.docs.map((doc: any) => ({ id: doc.id, ...doc.data() }));
};

export const deleteReceivedMember = async (borrowId: string) => {
  await deleteDoc(doc(db, "borrows", borrowId));
};

// ============================================================
// DASHBOARD STATS
// ============================================================

export const getDashboardStats = async () => {
  const [membersSnap, booksSnap, activeBorrowsSnap, overdueSnap] =
    await Promise.all([
      getDocs(collection(db, "users")),
      getDocs(collection(db, "books")),
      getDocs(
        query(collection(db, "borrows"), where("status", "==", "active")),
      ),
      getDocs(
        query(
          collection(db, "borrows"),
          where("status", "==", "active"),
          where("dueDate", "<", Timestamp.now()),
        ),
      ),
    ]);
  return {
    total_members: membersSnap.size,
    total_books: booksSnap.size,
    active_borrows: activeBorrowsSnap.size,
    overdue_books: overdueSnap.size,
  };
};

export const getOverdueBorrowers = async () => {
  const q = query(
    collection(db, "borrows"),
    where("status", "==", "active"),
    where("dueDate", "<", Timestamp.now()),
  );
  const snapshot = await getDocs(q);
  return snapshot.docs.map((doc: any) => {
    const data = doc.data();
    const dueDate = data.dueDate?.toDate?.() || new Date(data.dueDate);
    const now = new Date();
    const diffMs = now.getTime() - dueDate.getTime();
    const daysOverdue = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    return { id: doc.id, ...data, daysOverdue: `${daysOverdue} days overdue` };
  });
};

// ============================================================
// ADMINS MANAGEMENT
// ============================================================

export const getPendingAdmins = async () => {
  const q = query(collection(db, "admins"), where("role", "==", "pending"));
  const snapshot = await getDocs(q);
  return snapshot.docs.map((doc: any) => ({ id: doc.id, ...doc.data() }));
};

export const approveAdmin = async (adminId: string) => {
  await updateDoc(doc(db, "admins", adminId), { role: "admin" });
};

export const getCurrentAdminProfile = async (uid: string) => {
  const docSnap = await getDoc(doc(db, "admins", uid));
  if (docSnap.exists()) return { id: docSnap.id, ...docSnap.data() };
  return null;
};

export const updateAdminProfile = async (
  uid: string,
  data: any,
  imageFile?: File,
) => {
  let profileData = { ...data };
  if (imageFile)
    profileData.image_url = await uploadImageToCloudinary(imageFile);
  await updateDoc(doc(db, "admins", uid), profileData);
  if (data.fullName && auth.currentUser) {
    await updateProfile(auth.currentUser, { displayName: data.fullName });
  }
};
