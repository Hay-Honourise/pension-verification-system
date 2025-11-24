"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { User as UserIcon } from "lucide-react";

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
  dateOfRetirement?: string;
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
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [profileEdited, setProfileEdited] = useState(false);
  const [originalProfile, setOriginalProfile] = useState<{ email: string; phone: string; address: string }>({ email: '', phone: '', address: '' });

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
  const [downloadingFileId, setDownloadingFileId] = useState<string | null>(null);
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

  // Recent Activity state
  interface ActivityItem {
    id: string;
    type: 'verification' | 'document' | 'registration' | 'login' | 'profile_update';
    title: string;
    description?: string;
    timestamp: string;
    status?: string;
    color: string;
  }
  const [recentActivities, setRecentActivities] = useState<ActivityItem[]>([]);
  const [activitiesLoading, setActivitiesLoading] = useState(false);

  // Due Notification Popup state
  const [showDuePopup, setShowDuePopup] = useState(false);
  const [nextDueDateForPopup, setNextDueDateForPopup] = useState<string | null>(null);

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

  const getDocumentTypeLabel = (fileType: string) => {
    const typeMap: { [key: string]: string } = {
      'appointmentLetter': 'Appointment Letter',
      'idCard': 'ID Card',
      'retirementLetter': 'Retirement Letter',
      'birthCertificate': 'Birth Certificate',
      'passportPhoto': 'Passport Photo'
    };
    return typeMap[fileType] || fileType;
  };

  const handleDownload = async (fileUrl: string, filename: string, fileId: string) => {
    if (downloadingFileId === fileId) {
      console.log('Download already in progress for this file');
      return;
    }
  
    try {
      setDownloadingFileId(fileId);
  
      const getSigned = async () => {
        const params = new URLSearchParams({
          url: fileUrl,
          filename: filename || '',
          _t: Date.now().toString(), // cache buster
        });
  
        const res = await fetch(`/api/download?${params.toString()}`, {
          method: 'GET',
          cache: 'no-store',
          headers: {
            'Cache-Control': 'no-cache',
            'Pragma': 'no-cache',
          },
        });
  
        const data = await res.json();
        if (!res.ok || !data?.url) {
          throw new Error(data?.error || 'Failed to get download URL');
        }
        return data.url as string;
      };
  
      // Get signed URL and open immediately
      const signedUrl = await getSigned();
      const win = window.open(signedUrl, '_blank', 'noopener,noreferrer');
  
      // Retry once if popup was blocked
      if (!win) {
        console.warn('Popup blocked, retrying with fresh URL...');
        const retryUrl = await getSigned();
        window.open(retryUrl, '_blank', 'noopener,noreferrer');
      }
  
      // Show toast/message
      setDocsMsgType('success');
      setDocsMsg(`Download started: ${filename || 'document'}`);
      setTimeout(() => setDocsMsg(''), 3000);
  
    } catch (error) {
      console.error('Download failed', error);
      setDocsMsgType('error');
      setDocsMsg('Failed to download document. Please try again.');
    } finally {
      setDownloadingFileId(null);
    }
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
    loadRecentActivities();
    checkDueNotification();
  }, []);

  const checkDueNotification = async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) return;

      const res = await fetch("/api/pensioner/due-notification", {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (!res.ok) return;

      const data = await res.json();

      if (data.show) {
        setShowDuePopup(true);
        setNextDueDateForPopup(data.nextDueAt);
      }
    } catch (error) {
      console.error("Error checking due notification:", error);
      // Silently fail - don't break the dashboard if notification check fails
    }
  };

  const loadRecentActivities = async () => {
    try {
      setActivitiesLoading(true);
      const token = localStorage.getItem("token") || "";
      const res = await fetch("/api/pensioner/activity", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error("Failed to load activities");
      const data = await res.json();
      setRecentActivities(data.activities || []);
    } catch (e) {
      console.error("Error loading activities:", e);
      // Set empty array on error
      setRecentActivities([]);
    } finally {
      setActivitiesLoading(false);
    }
  };

  const formatActivityTime = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return "Just now";
    if (diffMins < 60) return `${diffMins} minute${diffMins !== 1 ? 's' : ''} ago`;
    if (diffHours < 24) return `${diffHours} hour${diffHours !== 1 ? 's' : ''} ago`;
    if (diffDays < 7) return `${diffDays} day${diffDays !== 1 ? 's' : ''} ago`;
    
    // For older dates, show formatted date and time
    const isToday = date.toDateString() === now.toDateString();
    if (isToday) {
      return `Today at ${date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}`;
    }
    
    const isYesterday = new Date(now.getTime() - 86400000).toDateString() === date.toDateString();
    if (isYesterday) {
      return `Yesterday at ${date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}`;
    }

    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric',
      year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined
    }) + ` at ${date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}`;
  };

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
    
    // Check if at least one field has been modified and has a value
    const hasValidPhone = profile.phone && profile.phone.trim() !== '';
    const hasValidAddress = profile.address && profile.address.trim() !== '';
    const hasValidEmail = profile.email && profile.email.trim() !== '';
    
    // Debug logging
    console.log('Profile validation:', {
      phone: profile.phone,
      address: profile.address,
      email: profile.email,
      hasValidPhone,
      hasValidAddress,
      hasValidEmail
    });
    
    if (!hasValidPhone || !hasValidAddress || !hasValidEmail) {
      setProfileMsgType("error");
      setProfileMsg("Please fill all required fields (Phone, Email, and Address).");
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
          email: profile.email,
          phone: profile.phone,
          address: profile.address,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.message || "Failed to update profile");
      setProfileMsgType("success");
      setProfileMsg("Profile updated successfully");
      // Optionally update local user cache
      const updatedUser = {
        ...user,
        phone: profile.phone,
        residentialAddress: profile.address,
        bankDetails: profile.bankDetails,
      } as any;
      setUser(updatedUser);
      localStorage.setItem("user", JSON.stringify(updatedUser));
      setIsEditingProfile(false);
      setProfileEdited(false);
      // Reload activities after profile update
      loadRecentActivities();
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
      // Reload activities after document update
      loadRecentActivities();
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
              <span className="text-sm text-gray-600 flex items-center gap-2">
                <UserIcon className="w-4 h-4 text-gray-500" />
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
            {verification.nextDueAt && (
              <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <p className="text-sm font-medium text-blue-900 mb-1">Next Verification Due:</p>
                <p className="text-base font-semibold text-blue-700">
                  {new Date(verification.nextDueAt).toLocaleDateString('en-US', { 
                    weekday: 'long',
                    year: 'numeric', 
                    month: 'long', 
                    day: 'numeric' 
                  })}
                </p>
                <p className="text-xs text-blue-600 mt-1">
                  Your next verification is due in 3 months from your last successful verification.
                </p>
              </div>
            )}
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
              <div className="flex items-center">
                <span className="font-medium text-gray-700">Full Name:</span>
                <span className="ml-2 text-gray-900 flex items-center gap-2">
                  <UserIcon className="w-4 h-4 text-gray-500" />
                  {user.fullName}
                </span>
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
                {user.dateOfFirstAppointment && user.dateOfRetirement && (
                  <p className="text-xs text-blue-600 mt-2">
                    From {new Date(user.dateOfFirstAppointment).getFullYear()}{" "}
                    to {new Date(user.dateOfRetirement).getFullYear()}
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
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-1">
                  Quick Actions
                </h3>
                <p className="text-xs text-gray-500">
                  Update your profile or re-submit documents as needed.
                </p>
              </div>
              <button
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium shadow-sm"
                onClick={() => (window.location.href = "/contact")}
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
                Contact Support
              </button>
            </div>
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
                    {/* Controls */}
                    <div className="flex items-center justify-between">
                      <h4 className="text-sm font-medium text-gray-900">Edit Contact Details</h4>
                      {!isEditingProfile ? (
                        <button
                          type="button"
                          className="px-3 py-1.5 rounded-md text-sm bg-gray-100 hover:bg-gray-200 text-gray-800"
                          onClick={() => {
                            setIsEditingProfile(true);
                            setOriginalProfile({ email: profile.email, phone: profile.phone, address: profile.address });
                            setProfileEdited(false);
                          }}
                        >
                          Edit
                        </button>
                      ) : (
                        <div className="space-x-2">
                          <button
                            type="button"
                            className="px-3 py-1.5 rounded-md text-sm bg-gray-100 hover:bg-gray-200 text-gray-800"
                            onClick={() => {
                              setIsEditingProfile(false);
                              setProfile({ ...profile, email: originalProfile.email, phone: originalProfile.phone, address: originalProfile.address });
                              setProfileEdited(false);
                            }}
                          >
                            Cancel
                          </button>
                          <button
                            type="submit"
                            className={`px-3 py-1.5 rounded-md text-sm text-white ${profileEdited ? 'bg-oyoGreen hover:bg-green-700' : 'bg-gray-300 cursor-not-allowed'}`}
                            disabled={!profileEdited || profileLoading}
                          >
                            {profileLoading ? 'Saving...' : 'Save Changes'}
                          </button>
                    </div>
                      )}
                    </div>

                    {/* Email */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Email Address</label>
                      <input
                        type="email"
                        className={`mt-1 block w-full rounded-md border border-gray-300 focus:ring-oyoOrange focus:border-oyoOrange ${!isEditingProfile ? 'bg-gray-100' : ''}`}
                        value={profile.email}
                        readOnly={!isEditingProfile}
                        onChange={(e) => { setProfile({ ...profile, email: e.target.value }); setProfileEdited(true); }}
                        required
                      />
                    </div>

                    {/* Phone */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number</label>
                      <input
                        type="tel"
                        className={`mt-1 block w-full rounded-md border border-gray-300 focus:ring-oyoOrange focus:border-oyoOrange ${!isEditingProfile ? 'bg-gray-100' : ''}`}
                        value={profile.phone || ''}
                        readOnly={!isEditingProfile}
                        onChange={(e) => { setProfile({ ...profile, phone: e.target.value }); setProfileEdited(true); }}
                        required
                      />
                    </div>

                    {/* Address */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
                      <textarea
                        rows={3}
                        className={`mt-1 block w-full rounded-md border border-gray-300 focus:ring-oyoOrange focus:border-oyoOrange ${!isEditingProfile ? 'bg-gray-100' : ''}`}
                        value={profile.address || ''}
                        readOnly={!isEditingProfile}
                        onChange={(e) => { setProfile({ ...profile, address: e.target.value }); setProfileEdited(true); }}
                        required
                      />
                    </div>

                    {/* Hidden Save at bottom when not using header controls - kept for accessibility */}
                    <div className="sr-only">
                      <button type="submit">Save Changes</button>
                    </div>

                    {profileMsg && (
                      <div
                        className={`text-sm mt-2 ${profileMsgType === 'success' ? 'text-green-600' : 'text-red-600'}`}
                      >
                        {profileMsg}
                      </div>
                    )}
                  </form>
                )}
                {/* Documents Tab */}
                {activeTab === "documents" && (
                  <div className="mt-6">
                    <div className="flex items-center justify-between mb-4">
                    <div>
                        <h4 className="text-md font-semibold text-gray-900 mb-1">
                          Registration Documents
                        </h4>
                        <p className="text-xs text-gray-500">
                          Documents uploaded during your registration process
                        </p>
                      </div>
                      <div className="text-xs text-gray-400">
                        {managedFiles.length} file{managedFiles.length !== 1 ? 's' : ''}
                    </div>
                      </div>
                    <div className="bg-white border rounded-md overflow-hidden">
                      <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                          <thead className="bg-gray-50">
                            <tr>
                              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Document
                              </th>
                              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Type
                              </th>
                              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Uploaded
                              </th>
                              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Actions
                              </th>
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
                                  className="px-6 py-8 text-center"
                                >
                                  <div className="flex flex-col items-center">
                                    <svg className="w-12 h-12 text-gray-300 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                    </svg>
                                    <p className="text-sm text-gray-500 mb-1">No documents uploaded yet</p>
                                    <p className="text-xs text-gray-400">Documents will appear here after registration</p>
                                  </div>
                                </td>
                              </tr>
                            ) : (
                              managedFiles.map((f) => (
                                <tr key={f.id} className="hover:bg-gray-50">
                                  <td className="px-4 py-3">
                                    <div className="flex items-center">
                                      <div className="flex-shrink-0">
                                        {f.fileType.startsWith("image") ? (
                                          <svg className="w-5 h-5 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                          </svg>
                                        ) : (
                                          <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                          </svg>
                                        )}
                                      </div>
                                      <div className="ml-3">
                                        <p className="text-sm font-medium text-gray-900 truncate max-w-xs">
                                          {f.originalName}
                                        </p>
                                        <p className="text-xs text-gray-500">
                                          {getDocumentTypeLabel(f.fileType)}
                                        </p>
                                      </div>
                                    </div>
                                  </td>
                                  <td className="px-4 py-3">
                                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                      {f.fileType}
                                    </span>
                                  </td>
                                  <td className="px-4 py-3 text-sm text-gray-500">
                                    {new Date(f.createdAt).toLocaleDateString()}
                                  </td>
                                  <td className="px-4 py-3">
                                    <div className="flex items-center space-x-2">
                                      <button
                                        type="button"
                                        className="inline-flex items-center px-2.5 py-1.5 border border-gray-300 shadow-sm text-xs font-medium rounded text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
                                        disabled={downloadingFileId === f.id}
                                        onClick={() => handleDownload(f.fileUrl, f.originalName, f.id)}
                                      >
                                        {downloadingFileId === f.id ? (
                                          <svg className="w-3 h-3 mr-1 animate-spin" fill="none" viewBox="0 0 24 24">
                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                          </svg>
                                        ) : (
                                          <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                          </svg>
                                        )}
                                        {downloadingFileId === f.id ? "Downloading..." : (f.fileType.startsWith("image") ? "View" : "Download")}
                                      </button>
                                    <button
                                      type="button"
                                        className="inline-flex items-center px-2.5 py-1.5 border border-transparent text-xs font-medium rounded text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
                                      disabled={fileOpId === f.id}
                                      onClick={() => {
                                        setReplaceTargetId(f.id);
                                        replaceInputRef.current?.click();
                                      }}
                                    >
                                        <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                                        </svg>
                                        {fileOpId === f.id && replaceTargetId === f.id ? "Replacing..." : "Replace"}
                                    </button>
                                    <button
                                      type="button"
                                        className="inline-flex items-center px-2.5 py-1.5 border border-transparent text-xs font-medium rounded text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50"
                                      disabled={fileOpId === f.id}
                                      onClick={async () => {
                                          if (!confirm("Delete this document permanently?")) return;
                                        try {
                                          setFileOpId(f.id);
                                            const token = localStorage.getItem("token") || "";
                                            const res = await fetch("/api/files/delete", {
                                              method: "POST",
                                              headers: {
                                                "Content-Type": "application/json",
                                                Authorization: `Bearer ${token}`,
                                              },
                                            body: JSON.stringify({ fileId: f.id }),
                                          });
                                            if (!res.ok) throw new Error("Delete failed");
                                          await loadManagedFiles();
                                            setDocsMsgType("success");
                                            setDocsMsg("Document deleted successfully");
                                        } catch (e: any) {
                                            setDocsMsgType("error");
                                            setDocsMsg(e?.message || "Delete failed");
                                        } finally {
                                          setFileOpId(null);
                                        }
                                      }}
                                    >
                                        <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                        </svg>
                                        {fileOpId === f.id ? "Deleting..." : "Delete"}
                                    </button>
                                    </div>
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
              {activitiesLoading ? (
                <div className="flex items-center justify-center py-8">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
                  <span className="ml-2 text-sm text-gray-500">Loading activities...</span>
                </div>
              ) : recentActivities.length === 0 ? (
                <div className="text-center py-8">
                  <svg className="w-12 h-12 text-gray-300 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <p className="text-sm text-gray-500 mb-1">No recent activity</p>
                  <p className="text-xs text-gray-400">Activities will appear here</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {recentActivities.map((activity) => {
                    const colorClasses: { [key: string]: string } = {
                      blue: 'bg-blue-500',
                      yellow: 'bg-yellow-500',
                      green: 'bg-green-500',
                      purple: 'bg-purple-500',
                      gray: 'bg-gray-500',
                    };
                    return (
                      <div key={activity.id} className="flex items-start space-x-4">
                        <div className={`w-2 h-2 rounded-full mt-2 flex-shrink-0 ${colorClasses[activity.color] || 'bg-gray-500'}`}></div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm text-gray-900 font-medium">{activity.title}</p>
                          {activity.description && (
                            <p className="text-xs text-gray-600 mt-0.5">{activity.description}</p>
                          )}
                          <p className="text-xs text-gray-500 mt-1">{formatActivityTime(activity.timestamp)}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      </main>

      {/* Due Notification Popup */}
      {showDuePopup && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50 p-4">
          <div className="bg-white p-6 rounded-lg shadow-xl w-full max-w-md text-center border-2 border-red-300">
            <div className="flex justify-center mb-4">
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-8 w-8 text-red-600"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                  />
                </svg>
              </div>
            </div>
            <h2 className="text-2xl font-bold text-red-600 mb-3">Verification Due</h2>
            <p className="text-gray-700 mb-4">
              Your next biometric verification is due. Please complete your verification to continue accessing your pension services.
            </p>
            {nextDueDateForPopup && (
              <div className="mb-4 p-3 bg-gray-50 border border-gray-200 rounded-lg">
                <p className="text-sm font-medium text-gray-700 mb-1">Due since:</p>
                <p className="text-lg font-semibold text-gray-900">
                  {new Date(nextDueDateForPopup).toLocaleDateString("en-US", {
                    weekday: "long",
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  })}
                </p>
              </div>
            )}
            <div className="flex gap-3 justify-center">
              <button
                onClick={async () => {
                  const token = localStorage.getItem("token");
                  if (token) {
                    try {
                      await fetch("/api/pensioner/due-notification", {
                        method: "POST",
                        headers: { Authorization: `Bearer ${token}` },
                      });
                    } catch (error) {
                      console.error("Error marking notification as seen:", error);
                    }
                  }
                  setShowDuePopup(false);
                }}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium shadow-sm"
              >
                OK, I Understand
              </button>
              <button
                onClick={() => {
                  router.push("/pensioner/verification");
                }}
                className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium shadow-sm"
              >
                Go to Verification
              </button>
            </div>
            <p className="text-xs text-gray-500 mt-4">
              You can access the verification page at any time from the dashboard.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
