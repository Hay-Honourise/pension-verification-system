"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

interface User {
  id: string;
  pensionId: string;
  fullName: string;
  status: string;
  email: string;
  // Calculated benefits
  yearsOfService?: number;
  totalGratuity?: number;
  monthlyPension?: number;
  gratuityRate?: number;
  pensionRate?: number;
  salary?: number;
  pensionSchemeType?: string;
  currentLevel?: string;
  dateOfFirstAppointment?: string;
  expectedRetirementDate?: string;
}

export default function PensionerDashboard() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"profile" | "documents">(
    "profile"
  );
  // const [showRegistrationSuccess, setShowRegistrationSuccess] = useState(false);

  // Profile state
  const [profile, setProfile] = useState<{
    fullName: string;
    email: string;
    phone: string;
    address: string;
    pensionNumber: string;
    bankDetails: string;
  }>({
    fullName: "",
    email: "",
    phone: "",
    address: "",
    pensionNumber: "",
    bankDetails: "",
  });
  const [profileLoading, setProfileLoading] = useState(false);
  const [profileMsg, setProfileMsg] = useState<string>("");
  const [profileMsgType, setProfileMsgType] = useState<"success" | "error">(
    "success"
  );

  // Documents state
  const [documents, setDocuments] = useState<{
    idCard?: string;
    birthCert?: string;
    appointment?: string;
    retirement?: string;
  }>({});
  const [selectedFiles, setSelectedFiles] = useState<
    Partial<Record<"idCard" | "birthCert" | "appointment" | "retirement", File>>
  >({});
  const [docsLoading, setDocsLoading] = useState(false);
  const [docsMsg, setDocsMsg] = useState<string>("");
  const [docsMsgType, setDocsMsgType] = useState<"success" | "error">(
    "success"
  );
  const [downloadsOpen, setDownloadsOpen] = useState(false);
  const [showLogoutModal, setShowLogoutModal] = useState(false);

  // Managed Cloudinary files
  type ManagedFile = {
    id: string;
    fileType: string;
    fileUrl: string;
    originalName: string;
    createdAt: string;
  };
  const [managedFiles, setManagedFiles] = useState<ManagedFile[]>([]);
  const [filesLoading, setFilesLoading] = useState(false);
  const [fileOpId, setFileOpId] = useState<string | null>(null);
  const [replaceTargetId, setReplaceTargetId] = useState<string | null>(null);
  const replaceInputRef = React.useRef<HTMLInputElement | null>(null);

  // Verification state
  const [verification, setVerification] = useState<{
    status: string;
    lastVerifiedAt: string | null;
    nextDueAt: string | null;
  }>({
    status: "UNKNOWN",
    lastVerifiedAt: null,
    nextDueAt: null,
  });

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-NG", {
      style: "currency",
      currency: "NGN",
      minimumFractionDigits: 2,
    }).format(amount);
  };

  const formatPercentage = (rate: number) => {
    return `${(rate * 100).toFixed(1)}%`;
  };

  useEffect(() => {
    // Check if user is authenticated
    const token = localStorage.getItem("token");
    const userData = localStorage.getItem("user");

    if (!token || !userData) {
      router.push("/pensioner/login");
      return;
    }

    // Check if user just completed registration
    const registrationCompleted = sessionStorage.getItem(
      "registrationCompleted"
    );
    if (registrationCompleted) {
      // setShowRegistrationSuccess(true);
      // Clear the flag after showing the alert
      sessionStorage.removeItem("registrationCompleted");
    }

    try {
      const parsedUser = JSON.parse(userData);
      setUser(parsedUser);
      // Initialize profile from stored user where possible
      setProfile({
        fullName: parsedUser.fullName || "",
        email: parsedUser.email || "",
        phone: parsedUser.phone || "",
        address: parsedUser.residentialAddress || "",
        pensionNumber: parsedUser.pensionId || "",
        bankDetails: parsedUser.bankDetails || "",
      });
      // Fetch latest profile and documents from server
      (async () => {
        try {
          const res = await fetch("/api/pensioner/me", {
            method: "GET",
            headers: {
              Authorization: `Bearer ${token}`,
            },
          });
          if (res.ok) {
            const data = await res.json();
            const p = data?.pensioner;
            if (p) {
              setProfile({
                fullName: p.fullName || "",
                email: p.email || parsedUser.email || "",
                phone: p.phone || "",
                address: p.residentialAddress || "",
                pensionNumber: p.pensionId || parsedUser.pensionId || "",
                bankDetails: p.bankDetails || "",
              });
              const latestLog = p?.verificationLogs?.[0];
              setVerification({
                status: latestLog?.status || "UNKNOWN",
                lastVerifiedAt: latestLog?.verifiedAt || null,
                nextDueAt: latestLog?.nextDueAt || null,
              });
              if (data?.documents) setDocuments(data.documents);
              const merged = { ...parsedUser, ...p };
              setUser(merged);
              localStorage.setItem("user", JSON.stringify(merged));
            }
          }
        } catch (e) {
          // ignore fetch error, fallback to local data
        }
      })();
    } catch (error) {
      console.error("Error parsing user data:", error);
      router.push("/pensioner/login");
    } finally {
      setLoading(false);
    }
  }, [router]);

  const loadManagedFiles = async () => {
    try {
      setFilesLoading(true);
      const token = localStorage.getItem("token") || "";
      const res = await fetch("/api/files/list", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error("Failed to load files");
      const data = await res.json();
      setManagedFiles(data.files || []);
    } catch (e) {
      // ignore
    } finally {
      setFilesLoading(false);
    }
  };

  useEffect(() => {
    loadManagedFiles();
  }, []);

  const getFileName = (path: string) => {
    try {
      const url = new URL(
        path,
        typeof window !== "undefined"
          ? window.location.origin
          : "http://localhost"
      );
      return url.pathname.split("/").pop() || path;
    } catch {
      return path.split("/").pop() || path;
    }
  };

  const handleProfileSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    if (
      !profile.fullName ||
      !profile.email ||
      !profile.phone ||
      !profile.address
    ) {
      setProfileMsgType("error");
      setProfileMsg("Please fill all required fields.");
      return;
    }
    try {
      setProfileLoading(true);
      setProfileMsg("");
      const res = await fetch("/api/pensioner/update-profile", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token") || ""}`,
        },
        body: JSON.stringify({
          id: user.id,
          fullName: profile.fullName,
          phone: profile.phone,
          address: profile.address,
          bankDetails: profile.bankDetails,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.message || "Failed to update profile");
      setProfileMsgType("success");
      setProfileMsg("Profile updated successfully");
      // Optionally update local user cache
      const updatedUser = {
        ...user,
        fullName: profile.fullName,
        phone: profile.phone,
        residentialAddress: profile.address,
        bankDetails: profile.bankDetails,
      } as any;
      setUser(updatedUser);
      localStorage.setItem("user", JSON.stringify(updatedUser));
    } catch (err: any) {
      setProfileMsgType("error");
      setProfileMsg(err?.message || "Failed to update profile");
    } finally {
      setProfileLoading(false);
    }
  };

  const handleFileChange = (
    e: React.ChangeEvent<HTMLInputElement>,
    key: "idCard" | "birthCert" | "appointment" | "retirement"
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const allowed = ["application/pdf", "image/png", "image/jpeg"];
    if (!allowed.includes(file.type)) {
      setDocsMsgType("error");
      setDocsMsg("Only PDF, PNG, or JPG files are allowed");
      return;
    }
    setSelectedFiles((prev) => ({ ...prev, [key]: file }));
  };

  const handleDocumentsSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    try {
      setDocsLoading(true);
      setDocsMsg("");
      const form = new FormData();
      form.append("id", String(user.id));
      if (selectedFiles.idCard) form.append("idCard", selectedFiles.idCard);
      if (selectedFiles.birthCert)
        form.append("birthCert", selectedFiles.birthCert);
      if (selectedFiles.appointment)
        form.append("appointment", selectedFiles.appointment);
      if (selectedFiles.retirement)
        form.append("retirement", selectedFiles.retirement);

      const res = await fetch("/api/pensioner/update-documents", {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token") || ""}`,
        },
        body: form,
      });
      const data = await res.json();
      if (!res.ok)
        throw new Error(data?.message || "Failed to update documents");
      setDocsMsgType("success");
      setDocsMsg("Documents re-submitted successfully");
      // Update shown document links if returned
      if (data?.documents) setDocuments(data.documents);
      // Clear selected files
      setSelectedFiles({});
    } catch (err: any) {
      setDocsMsgType("error");
      setDocsMsg(err?.message || "Failed to re-submit documents");
    } finally {
      setDocsLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    router.push("/");
  };

  const goToVerification = () => {
    router.push("/pensioner/verification");
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <h1 className="text-xl font-semibold text-gray-900">
                Pension Verification Dashboard
              </h1>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-600">
                Welcome, {user.fullName}
              </span>
              <>
                <button
                  onClick={() => setShowLogoutModal(true)}
                  className="px-4 py-2 text-sm text-red-600 hover:text-red-700 hover:bg-red-50 rounded-md transition-colors"
                >
                  Logout
                </button>
                {typeof window !== "undefined" && (
                  <div
                    className={`fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40 transition-opacity ${
                      showLogoutModal ? "" : "hidden"
                    }`}
                  >
                    <div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-sm">
                      <h2 className="text-lg font-semibold mb-2 text-gray-900">
                        Confirm Logout
                      </h2>
                      <p className="text-gray-700 mb-4">
                        Are you sure you want to logout?
                      </p>
                      <div className="flex justify-end gap-2">
                        <button
                          onClick={() => setShowLogoutModal(false)}
                          className="px-4 py-2 text-sm rounded-md bg-gray-100 text-gray-700 hover:bg-gray-200"
                        >
                          Cancel
                        </button>
                        <button
                          onClick={() => {
                            setShowLogoutModal(false);
                            handleLogout();
                          }}
                          className="px-4 py-2 text-sm rounded-md bg-red-600 text-white hover:bg-red-700"
                        >
                          Logout
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </>
              <button
                onClick={goToVerification}
                className="px-4 py-2 text-sm bg-blue-600 text-white hover:bg-blue-700 rounded-md transition-colors"
              >
                Start Verification
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-center justify-center mb-8">
          {/* Registration Card */}
          <div className="bg-white rounded-lg shadow p-6">
            <div className="items-center justify-between mb-5">
              <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-3 mb-4">
                <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-green-100 text-green-700">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                    className="h-4 w-4"
                  >
                    <path
                      fillRule="evenodd"
                      d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.857-9.809a.75.75 0 00-1.214-.882l-3.2 4.4-1.728-1.728a.75.75 0 10-1.06 1.06l2.25 2.25a.75.75 0 001.153-.09l3.8-5.01z"
                      clipRule="evenodd"
                    />
                  </svg>
                </span>
                Registration Status
              </h3>
              <span className="items-center rounded-full p-2 text-xs font-medium bg-green-50 text-green-700 ring-1 ring-inset ring-green-600/20">
                Registration Successful
              </span>
            </div>
            <p className="text-sm text-gray-600">
              Registration successful. Confirm all uploaded documents and
              perform biometric registration to complete verification.
            </p>
          </div>

          {/* Status Card */}
          <div className="bg-white rounded-lg shadow p-5">
            <div className="items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-3 mb-3">
                <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-gray-100 text-gray-700">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                    className="h-4 w-4"
                  >
                    <path
                      fillRule="evenodd"
                      d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.857-9.809a.75.75 0 00-1.214-.882l-3.2 4.4-1.728-1.728a.75.75 0 10-1.06 1.06l2.25 2.25a.75.75 0 001.153-.09l3.8-5.01z"
                      clipRule="evenodd"
                    />
                  </svg>
                </span>
                Verification Status
              </h3>
              <span
                className={`items-center rounded-full p-2 text-xs font-medium ${
                  user.status === "VERIFIED"
                    ? "bg-green-50 text-green-700 ring-1 ring-inset ring-green-600/20"
                    : user.status === "REJECTED"
                    ? "bg-red-50 text-red-700 ring-1 ring-inset ring-red-600/20"
                    : "bg-yellow-50 text-yellow-700 ring-1 ring-inset ring-yellow-600/20"
                }`}
              >
                {user.status === "VERIFIED"
                  ? "Verified"
                  : user.status === "REJECTED"
                  ? "Rejected"
                  : "Pending Verification"}
              </span>
            </div>
            <p className="text-sm text-gray-600">
              {user.status === "VERIFIED"
                ? "Your pension verification has been completed successfully."
                : user.status === "REJECTED"
                ? "Your verification was not approved. Please contact support."
                : "Your biometeric verification has not been completed.  Please click the start verification button to start your verification process. You will be notified once verified."}
            </p>
          </div>

          {/* Personal Info Card */}
          <div className="bg-white rounded-lg shadow p-4">
            <h3 className="text-lg font-medium text-gray-900 mb-3">
              Personal Information
            </h3>
            <div className="space-y-2 text-sm">
              <div>
                <span className="font-medium text-gray-700">Pension ID:</span>
                <span className="ml-2 text-gray-900">{user.pensionId}</span>
              </div>
              <div>
                <span className="font-medium text-gray-700">Full Name:</span>
                <span className="ml-2 text-gray-900">{user.fullName}</span>
              </div>
              <div>
                <span className="font-medium text-gray-700">Email:</span>
                <span className="ml-2 text-gray-900">{user.email}</span>
              </div>
              {user.currentLevel && (
                <div>
                  <span className="font-medium text-gray-700">
                    Current Level:
                  </span>
                  <span className="ml-2 text-gray-900">
                    {user.currentLevel}
                  </span>
                </div>
              )}
              {user.salary && (
                <div>
                  <span className="font-medium text-gray-700">
                    Last Salary:
                  </span>
                  <span className="ml-2 text-gray-900">
                    {formatCurrency(user.salary)}
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Benefits Section */}
        {user.yearsOfService && user.totalGratuity && user.monthlyPension && (
          <div className="mt-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">
              Pension Benefits
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {/* Years of Service */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
                <h3 className="font-semibold text-blue-800 mb-2">
                  Years of Service
                </h3>
                <div className="text-3xl font-bold text-blue-900">
                  {user.yearsOfService}
                </div>
                <p className="text-sm text-blue-700 mt-1">years</p>
                {user.dateOfFirstAppointment && user.expectedRetirementDate && (
                  <p className="text-xs text-blue-600 mt-2">
                    From {new Date(user.dateOfFirstAppointment).getFullYear()}{" "}
                    to {new Date(user.expectedRetirementDate).getFullYear()}
                  </p>
                )}
              </div>

              {/* Total Gratuity */}
              <div className="bg-green-50 border border-green-200 rounded-lg p-6">
                <h3 className="font-semibold text-green-800 mb-2">
                  Total Gratuity
                </h3>
                <div className="text-3xl font-bold text-green-900">
                  {formatCurrency(user.totalGratuity)}
                </div>
                <p className="text-sm text-green-700 mt-1">one-time payment</p>
                {user.gratuityRate && (
                  <p className="text-xs text-green-600 mt-2">
                    Rate: {formatPercentage(user.gratuityRate)}
                  </p>
                )}
              </div>

              {/* Monthly Pension */}
              <div className="bg-purple-50 border border-purple-200 rounded-lg p-6">
                <h3 className="font-semibold text-purple-800 mb-2">
                  Monthly Pension
                </h3>
                <div className="text-3xl font-bold text-purple-900">
                  {formatCurrency(user.monthlyPension)}
                </div>
                <p className="text-sm text-purple-700 mt-1">per month</p>
                {user.pensionRate && (
                  <p className="text-xs text-purple-600 mt-2">
                    Rate: {formatPercentage(user.pensionRate)}
                  </p>
                )}
              </div>
            </div>

            {/* Scheme Information */}
            {user.pensionSchemeType && (
              <div className="mt-6 bg-gray-50 border border-gray-200 rounded-lg p-6">
                <h3 className="font-semibold text-gray-800 mb-3">
                  Pension Scheme Details
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="font-medium text-gray-700">
                      Scheme Type:
                    </span>
                    <span className="ml-2 text-gray-900 capitalize">
                      {user.pensionSchemeType}
                    </span>
                  </div>
                  {user.gratuityRate && (
                    <div>
                      <span className="font-medium text-gray-700">
                        Gratuity Rate:
                      </span>
                      <span className="ml-2 text-gray-900">
                        {formatPercentage(user.gratuityRate)}
                      </span>
                    </div>
                  )}
                  {user.pensionRate && (
                    <div>
                      <span className="font-medium text-gray-700">
                        Pension Rate:
                      </span>
                      <span className="ml-2 text-gray-900">
                        {formatPercentage(user.pensionRate)}
                      </span>
                    </div>
                  )}
                  {user.salary && (
                    <div>
                      <span className="font-medium text-gray-700">
                        Last Salary:
                      </span>
                      <span className="ml-2 text-gray-900">
                        {formatCurrency(user.salary)}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start justify-center my-4">
          {/* Quick Actions Card */}
          <div className="bg-white rounded-lg shadow p-6 col-span-2">
            <h3 className="text-lg font-semibold text-gray-900 mb-1">
              Quick Actions
            </h3>
            <p className="text-xs text-gray-500 mb-4">
              Update your profile or re-submit documents as needed.
            </p>
            <div className="space-y-3">
              <div className="mb-4">
                <div className="flex flex-wrap gap-4 border-b border-gray-200 mb-4">
                  <button
                    className={`w-1/2 sm:w-auto text-center px-4 py-2 font-medium focus:outline-none ${
                      activeTab === "profile"
                        ? "border-b-2 border-oyoGreen text-oyoGreen"
                        : "text-gray-500"
                    }`}
                    onClick={() => setActiveTab("profile")}
                  >
                    Profile Info
                  </button>
                  <button
                    className={`w-1/2 sm:w-auto text-center px-4 py-2 font-medium focus:outline-none ${
                      activeTab === "documents"
                        ? "border-b-2 border-blue-600 text-blue-600"
                        : "text-gray-500"
                    }`}
                    onClick={() => setActiveTab("documents")}
                  >
                    Uploaded Documents
                  </button>
                </div>
                {/* Profile Info Tab */}
                {activeTab === "profile" && (
                  <form className="space-y-4" onSubmit={handleProfileSave}>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">
                        Full Name
                      </label>
                      <input
                        type="text"
                        className="mt-1 block w-full rounded-md border-gray-300 focus:ring-oyoOrange focus:border-oyoOrange"
                        value={profile.fullName}
                        onChange={(e) =>
                          setProfile({ ...profile, fullName: e.target.value })
                        }
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">
                        Email
                      </label>
                      <input
                        type="email"
                        className="mt-1 block w-full rounded-md border-gray-300 bg-gray-100"
                        value={profile.email}
                        readOnly
                        disabled
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">
                        Phone
                      </label>
                      <input
                        type="tel"
                        className="mt-1 block w-full rounded-md border-gray-300 focus:ring-oyoOrange focus:border-oyoOrange"
                        value={profile.phone || ""}
                        onChange={(e) =>
                          setProfile({ ...profile, phone: e.target.value })
                        }
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">
                        Address
                      </label>
                      <input
                        type="text"
                        className="mt-1 block w-full rounded-md border-gray-300 focus:ring-oyoOrange focus:border-oyoOrange"
                        value={profile.address || ""}
                        onChange={(e) =>
                          setProfile({ ...profile, address: e.target.value })
                        }
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">
                        Pension Number
                      </label>
                      <input
                        type="text"
                        className="mt-1 block w-full rounded-md border-gray-300 bg-gray-100"
                        value={profile.pensionNumber}
                        readOnly
                        disabled
                      />
                    </div>
                    <button
                      type="submit"
                      className="w-full px-4 py-2 bg-oyoGreen text-white rounded-md hover:bg-green-700 transition-colors flex items-center justify-center"
                      disabled={profileLoading}
                    >
                      {profileLoading && (
                        <svg
                          className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
                          xmlns="http://www.w3.org/2000/svg"
                          fill="none"
                          viewBox="0 0 24 24"
                        >
                          <circle
                            className="opacity-25"
                            cx="12"
                            cy="12"
                            r="10"
                            stroke="currentColor"
                            strokeWidth="4"
                          ></circle>
                          <path
                            className="opacity-75"
                            fill="currentColor"
                            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                          ></path>
                        </svg>
                      )}
                      {profileLoading ? "Saving..." : "Save Changes"}
                    </button>
                    {profileMsg && (
                      <div
                        className={`text-sm mt-2 ${
                          profileMsgType === "success"
                            ? "text-green-600"
                            : "text-red-600"
                        }`}
                      >
                        {profileMsg}
                      </div>
                    )}
                  </form>
                )}
                {/* Documents Tab */}
                {activeTab === "documents" && (
                  <div className="mt-6">
                    <h4 className="text-md font-semibold text-gray-900 mb-2">
                      Your Uploaded Files
                    </h4>
                    <div className="bg-white border rounded-md overflow-hidden">
                      <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                          <thead className="bg-gray-50">
                            <tr>
                              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Filename
                              </th>
                              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Type
                              </th>
                              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Uploaded
                              </th>
                              <th className="px-4 py-2"></th>
                            </tr>
                          </thead>
                          <tbody className="bg-white divide-y divide-gray-200">
                            {filesLoading ? (
                              <tr>
                                <td
                                  colSpan={4}
                                  className="px-4 py-6 text-sm text-gray-600"
                                >
                                  Loading files…
                                </td>
                              </tr>
                            ) : managedFiles.length === 0 ? (
                              <tr>
                                <td
                                  colSpan={4}
                                  className="px-4 py-6 text-sm text-gray-600"
                                >
                                  No files uploaded yet.
                                </td>
                              </tr>
                            ) : (
                              managedFiles.map((f) => (
                                <tr key={f.id}>
                                  <td className="px-4 py-2 text-sm text-gray-900 break-all">
                                    {f.originalName}
                                  </td>
                                  <td className="px-4 py-2 text-sm text-gray-700">
                                    {f.fileType}
                                  </td>
                                  <td className="px-4 py-2 text-sm text-gray-700">
                                    {new Date(f.createdAt).toLocaleString()}
                                  </td>
                                  <td className="px-4 py-2 text-sm text-right space-x-2">
                                    <button
                                      type="button"
                                      className="px-3 py-1 rounded bg-gray-100 hover:bg-gray-200 text-gray-800"
                                      onClick={() =>
                                        window.open(f.fileUrl, "_blank")
                                      }
                                    >
                                      {f.fileType.startsWith("image")
                                        ? "Preview"
                                        : "Download"}
                                    </button>
                                    <button
                                      type="button"
                                      className="px-3 py-1 rounded bg-blue-600 hover:bg-blue-700 text-white disabled:opacity-60"
                                      disabled={fileOpId === f.id}
                                      onClick={() => {
                                        setReplaceTargetId(f.id);
                                        replaceInputRef.current?.click();
                                      }}
                                    >
                                      {fileOpId === f.id &&
                                      replaceTargetId === f.id
                                        ? "Replacing…"
                                        : "Replace"}
                                    </button>
                                    <button
                                      type="button"
                                      className="px-3 py-1 rounded bg-red-600 hover:bg-red-700 text-white disabled:opacity-60"
                                      disabled={fileOpId === f.id}
                                      onClick={async () => {
                                        if (
                                          !confirm(
                                            "Delete this file permanently?"
                                          )
                                        )
                                          return;
                                        try {
                                          setFileOpId(f.id);
                                          const token =
                                            localStorage.getItem("token") || "";
                                          const res = await fetch(
                                            "/api/files/delete",
                                            {
                                              method: "POST",
                                              headers: {
                                                "Content-Type":
                                                  "application/json",
                                                Authorization: `Bearer ${token}`,
                                              },
                                              body: JSON.stringify({
                                                fileId: f.id,
                                              }),
                                            }
                                          );
                                          if (!res.ok)
                                            throw new Error("Delete failed");
                                          await loadManagedFiles();
                                          setDocsMsgType("success");
                                          setDocsMsg("File deleted");
                                        } catch (e: any) {
                                          setDocsMsgType("error");
                                          setDocsMsg(
                                            e?.message || "Delete failed"
                                          );
                                        } finally {
                                          setFileOpId(null);
                                        }
                                      }}
                                    >
                                      {fileOpId === f.id
                                        ? "Deleting…"
                                        : "Delete"}
                                    </button>
                                  </td>
                                </tr>
                              ))
                            )}
                          </tbody>
                        </table>
                      </div>
                    </div>
                    <input
                      ref={replaceInputRef}
                      type="file"
                      className="hidden"
                      onChange={async (e) => {
                        const newFile = e.target.files?.[0];
                        const targetId = replaceTargetId;
                        setReplaceTargetId(null);
                        if (!newFile || !targetId || !user) return;
                        try {
                          setFileOpId(targetId);
                          // Delete old
                          const token = localStorage.getItem("token") || "";
                          const del = await fetch("/api/files/delete", {
                            method: "POST",
                            headers: {
                              "Content-Type": "application/json",
                              Authorization: `Bearer ${token}`,
                            },
                            body: JSON.stringify({ fileId: targetId }),
                          });
                          if (!del.ok)
                            throw new Error("Failed to delete old file");
                          // Upload new
                          const form = new FormData();
                          form.append("pensionerId", String(user.id));
                          const label = newFile.type.startsWith("image")
                            ? "image"
                            : newFile.type === "application/pdf"
                            ? "pdf"
                            : "file";
                          form.append("fileType", label);
                          form.append("file", newFile);
                          const up = await fetch("/api/files/upload", {
                            method: "POST",
                            headers: { Authorization: `Bearer ${token}` },
                            body: form,
                          });
                          if (!up.ok) throw new Error("Upload failed");
                          await loadManagedFiles();
                          setDocsMsgType("success");
                          setDocsMsg("File replaced successfully");
                        } catch (err: any) {
                          setDocsMsgType("error");
                          setDocsMsg(err?.message || "Replace failed");
                        } finally {
                          setFileOpId(null);
                          if (replaceInputRef.current)
                            replaceInputRef.current.value = "";
                        }
                      }}
                      accept=".pdf,.jpg,.jpeg,.png"
                    />
                  </div>
                )}
              </div>
              <button
                className="w-full px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 transition-colors"
                onClick={() => (window.location.href = "/contact")}
              >
                Contact Support
              </button>
            </div>
          </div>
          {/* Recent Activity */}
          <div className="bg-white rounded-lg shadow col-span-1">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-medium text-gray-900">
                Recent Activity
              </h3>
            </div>
            <div className="p-6">
              <div className="space-y-4">
                
                {/* Verification completed */}
                <div className="flex items-center space-x-4">
                  <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                  <div className="flex-1">
                    <p className="text-sm text-gray-900">Verification completed</p>
                    <p className="text-xs text-gray-500">Today at 10:30 AM</p>
                  </div>
                </div>

                {/* Registration completed */}
                <div className="flex items-center space-x-4">
                  <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                  <div className="flex-1">
                    <p className="text-sm text-gray-900">
                      Registration completed
                    </p>
                    <p className="text-xs text-gray-500">Today at 10:30 AM</p>
                  </div>
                </div>

                {/* Documents uploaded */}
                <div className="flex items-center space-x-4">
                  <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
                  <div className="flex-1">
                    <p className="text-sm text-gray-900">Documents uploaded</p>
                    <p className="text-xs text-gray-500">Today at 10:25 AM</p>
                  </div>
                </div>

                {/* Account created */}
                <div className="flex items-center space-x-4">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <div className="flex-1">
                    <p className="text-sm text-gray-900">Account created</p>
                    <p className="text-xs text-gray-500">Today at 10:20 AM</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
