"use client"

import React, { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import toast from 'react-hot-toast'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line, AreaChart, Area } from 'recharts'
import { 
  Home, 
  Users, 
  Bell, 
  BarChart3, 
  Settings, 
  LogOut, 
  Search, 
  Filter, 
  Eye, 
  CheckCircle, 
  Flag, 
  Trash2, 
  Download, 
  FileText,
  Calendar,
  TrendingUp,
  AlertTriangle,
  UserCheck,
  Clock,
  Mail,
  Phone,
  MapPin,
  X,
  User,
  UserPlus,
  Shield,
  AlertCircle,
  CheckCircle2,
  Loader2,
  RefreshCw,
  Activity
} from 'lucide-react'

export default function AdminDashboard() {
  const router = useRouter()
  const [authorized, setAuthorized] = useState(false)
  const [activePage, setActivePage] = useState('dashboard')
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [user, setUser] = useState<any>(null)

  // Dashboard metrics state
  const [metrics, setMetrics] = useState({
    totalPensioners: 0,
    verifiedPensioners: 0,
    pendingReviews: 0,
    flaggedAccounts: 0
  })

  // Pensioners state
  const [pensioners, setPensioners] = useState<any[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [pensionTypeFilter, setPensionTypeFilter] = useState('all')

  // Notifications state
  const [notifications, setNotifications] = useState<any[]>([])

  // Chart data state
  const [monthlyVerifications, setMonthlyVerifications] = useState<any[]>([])

  // Loading states
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  
  // Logout modal state
  const [showLogoutModal, setShowLogoutModal] = useState(false)
  
  // Pensioner action modals state
  const [showViewModal, setShowViewModal] = useState(false)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [showFlagModal, setShowFlagModal] = useState(false)
  const [showApproveModal, setShowApproveModal] = useState(false)
  const [selectedPensioner, setSelectedPensioner] = useState<any>(null)
  const [flagReason, setFlagReason] = useState('')
  const [actionLoading, setActionLoading] = useState(false)
  const [downloadingFileId, setDownloadingFileId] = useState<string | null>(null)

  useEffect(() => {
    const u = localStorage.getItem('user')
    const t = localStorage.getItem('token') || ''
    if (!u || !t) {
      router.push('/admin/login')
      return
    }
    try {
      const parsed = JSON.parse(u)
      if (parsed?.role === 'admin') {
        setAuthorized(true)
        setUser(parsed)
        loadDashboardData()
      } else {
        router.push('/admin/login')
      }
    } catch {
      router.push('/admin/login')
    }
  }, [router])

  // Load data when page changes
  useEffect(() => {
    if (authorized) {
      if (activePage === 'dashboard') {
        loadDashboardData()
      } else if (activePage === 'pensioners') {
        loadPensioners()
      } else if (activePage === 'notifications') {
        // Reload notifications when navigating to notifications tab
        loadDashboardData()
      }
      // Enquiries page will load its own data via the EnquiriesManagement component
    }
  }, [activePage, authorized])

  // Reload pensioners when filters change
  useEffect(() => {
    if (authorized && activePage === 'pensioners') {
      loadPensioners()
    }
  }, [searchTerm, statusFilter, pensionTypeFilter, authorized, activePage])

  const loadDashboardData = async () => {
    try {
      setLoading(true)
      setError(null)
      
      const token = localStorage.getItem('token')
      if (!token) {
        throw new Error('No authentication token found')
      }

      // Load dashboard metrics and data
      const response = await fetch('/api/admin/dashboard', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      })

      if (!response.ok) {
        throw new Error(`Failed to load dashboard data: ${response.statusText}`)
      }

      const data = await response.json()
      
      setMetrics(data.metrics)
      setNotifications(data.notifications)
      setPensioners(data.recentPensioners)
      setMonthlyVerifications(data.monthlyVerifications || [])
      
    } catch (err) {
      console.error('Error loading dashboard data:', err)
      setError(err instanceof Error ? err.message : 'Failed to load dashboard data')
    } finally {
      setLoading(false)
    }
  }

  const loadPensioners = async () => {
    try {
      setLoading(true)
      setError(null)
      
      const token = localStorage.getItem('token')
      if (!token) {
        throw new Error('No authentication token found')
      }

      const params = new URLSearchParams({
        page: '1',
        pageSize: '50',
        ...(searchTerm && { search: searchTerm }),
        ...(statusFilter !== 'all' && { status: statusFilter }),
        ...(pensionTypeFilter !== 'all' && { pensionType: pensionTypeFilter })
      })

      const response = await fetch(`/api/admin/pensioners?${params}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      })

      if (!response.ok) {
        throw new Error(`Failed to load pensioners: ${response.statusText}`)
      }

      const data = await response.json()
      setPensioners(data.pensioners)
      
    } catch (err) {
      console.error('Error loading pensioners:', err)
      setError(err instanceof Error ? err.message : 'Failed to load pensioners')
    } finally {
      setLoading(false)
    }
  }

  const handleLogout = () => {
    console.log('Logout button clicked!')
    setShowLogoutModal(true)
  }

  const confirmLogout = () => {
    localStorage.removeItem('user')
    localStorage.removeItem('token')
    router.push('/admin/login')
  }

  // Pensioner action handlers
  const handleViewPensioner = async (pensioner: any) => {
    try {
      setActionLoading(true)
      const token = localStorage.getItem('token')
      
      const response = await fetch(`/api/admin/pensioners/${pensioner.id}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      })

      if (response.ok) {
        const data = await response.json()
        setSelectedPensioner(data.pensioner)
        setShowViewModal(true)
      } else {
        toast.error('Failed to load pensioner details')
      }
    } catch (error) {
      console.error('Error loading pensioner details:', error)
      toast.error('Error loading pensioner details')
    } finally {
      setActionLoading(false)
    }
  }

  const handleApprovePensioner = (pensioner: any) => {
    setSelectedPensioner(pensioner)
    setShowApproveModal(true)
  }

  const confirmApprovePensioner = async () => {
    try {
      setActionLoading(true)
      const token = localStorage.getItem('token')
      
      const response = await fetch(`/api/admin/pensioners/${selectedPensioner.id}/update-status`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ action: 'approve' })
      })

      if (response.ok) {
        toast.success('Pensioner approved successfully!')
        setShowApproveModal(false)
        loadPensioners() // Refresh the list
      } else {
        const error = await response.json()
        toast.error(error.message || 'Failed to approve pensioner')
      }
    } catch (error) {
      console.error('Error approving pensioner:', error)
      toast.error('Error approving pensioner')
    } finally {
      setActionLoading(false)
    }
  }

  const handleFlagPensioner = (pensioner: any) => {
    setSelectedPensioner(pensioner)
    setFlagReason('')
    setShowFlagModal(true)
  }

  const confirmFlagPensioner = async () => {
    if (!flagReason.trim()) {
      toast.error('Please provide a reason for flagging this pensioner')
      return
    }

    try {
      setActionLoading(true)
      const token = localStorage.getItem('token')
      
      const response = await fetch(`/api/admin/pensioners/${selectedPensioner.id}/update-status`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ 
          action: 'flag',
          reason: flagReason
        })
      })

      if (response.ok) {
        toast.success('Pensioner flagged successfully!')
        setShowFlagModal(false)
        loadPensioners() // Refresh the list
      } else {
        const error = await response.json()
        toast.error(error.message || 'Failed to flag pensioner')
      }
    } catch (error) {
      console.error('Error flagging pensioner:', error)
      toast.error('Error flagging pensioner')
    } finally {
      setActionLoading(false)
    }
  }

  const handleDeletePensioner = (pensioner: any) => {
    setSelectedPensioner(pensioner)
    setShowDeleteModal(true)
  }

  const confirmDeletePensioner = async () => {
    try {
      setActionLoading(true)
      const token = localStorage.getItem('token')
      
      const response = await fetch(`/api/admin/pensioners/${selectedPensioner.id}/delete`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      })

      if (response.ok) {
        toast.success('Pensioner deleted successfully!')
        setShowDeleteModal(false)
        loadPensioners() // Refresh the list
      } else {
        const error = await response.json()
        toast.error(error.message || 'Failed to delete pensioner')
      }
    } catch (error) {
      console.error('Error deleting pensioner:', error)
      toast.error('Error deleting pensioner')
    } finally {
      setActionLoading(false)
    }
  }

  const cancelLogout = () => {
    setShowLogoutModal(false)
  }

  if (!authorized) return null

  // Loading state
  if (loading) {
    return (
      <div className="flex min-h-screen bg-gray-50 items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    )
  }

  // Error state
  if (error) {
    return (
      <div className="flex min-h-screen bg-gray-50 items-center justify-center">
        <div className="text-center">
          <div className="text-red-600 text-6xl mb-4">⚠️</div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Error Loading Dashboard</h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <button
            onClick={() => {
              setError(null)
              if (activePage === 'dashboard') {
                loadDashboardData()
              } else if (activePage === 'pensioners') {
                loadPensioners()
              }
            }}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Retry
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen bg-gray-50">
      {/* Sidebar */}
      <aside className={`${sidebarOpen ? 'w-64' : 'w-16'} bg-oyoGreen text-oyoWhite flex flex-col fixed h-screen transition-all duration-300 z-50 left-0 top-0`}>
        {/* Header */}
        <div className="p-4 flex-shrink-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <div className={`text-2xl ${sidebarOpen ? 'mr-3' : 'mx-auto'}`}>🧮</div>
              {sidebarOpen && <h1 className="text-xl font-bold">Admin Panel</h1>}
            </div>
            {sidebarOpen && (
              <button
                onClick={() => setSidebarOpen(!sidebarOpen)}
                className="p-1 rounded-lg hover:bg-white/10 hover:text-oyoOrange transition-colors"
              >
                <div className="w-4 h-4 text-white">←</div>
              </button>
            )}
          </div>
          {!sidebarOpen && (
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="w-full mt-2 p-1 rounded-lg hover:bg-white/10 transition-colors flex justify-center"
            >
              <div className="w-4 h-4 text-white">→</div>
            </button>
          )}
        </div>

        {/* Navigation */}
        <nav className={`flex-1 py-6 overflow-y-auto ${sidebarOpen ? 'px-4' : 'px-2'}`}>
          <ul className="space-y-2">
            {[
              { id: 'dashboard', label: 'Dashboard', icon: Home },
              { id: 'pensioners', label: 'Pensioners', icon: Users },
              { id: 'enquiries', label: 'Enquiries', icon: Mail },
              { id: 'notifications', label: 'Notifications', icon: Bell },
              { id: 'reports', label: 'Reports', icon: BarChart3 },
              { id: 'settings', label: 'Settings', icon: Settings }
            ].map((item) => (
              <li key={item.id}>
                <button
                  onClick={() => setActivePage(item.id)}
                  className={`w-full flex items-center ${sidebarOpen ? 'px-3' : 'px-0 justify-center'} py-2 rounded-lg transition-colors ${
                    activePage === item.id 
                      ? 'bg-white/20 text-white' 
                      : 'text-white hover:bg-white/10 hover:text-oyoOrange'
                  }`}
                >
                  <item.icon className={`w-5 h-5 text-white ${sidebarOpen ? 'mr-3' : 'mr-0'}`} />
                  {sidebarOpen && <span className="text-white">{item.label}</span>}
                </button>
              </li>
            ))}
          </ul>
        </nav>

        {/* Footer - Logout Button */}
        <div className={`border-t border-white/20 flex-shrink-0 ${sidebarOpen ? 'p-4' : 'p-2'}`}>
          <button
            onClick={handleLogout}
            className={`w-full flex items-center ${sidebarOpen ? 'justify-start px-3' : 'justify-center px-0'} py-3 rounded-lg text-white bg-red-600 hover:bg-red-700 transition-colors font-medium`}
          >
            <LogOut className={`w-5 h-5 text-white ${sidebarOpen ? 'mr-2' : 'mr-0'}`} />
            {sidebarOpen && <span className="text-white">Logout</span>}
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className={`flex-1 transition-all duration-300 ${sidebarOpen ? 'ml-64' : 'ml-16'} overflow-y-auto`}>
        <div className="p-6">
          {/* Header */}
          <div className="mb-8 flex justify-between items-start">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                {activePage === 'dashboard' && 'Dashboard Overview'}
                {activePage === 'pensioners' && 'Pensioner Management'}
                {activePage === 'enquiries' && 'Enquiry Management'}
                {activePage === 'notifications' && 'System Notifications'}
                {activePage === 'reports' && 'Reports & Analytics'}
                {activePage === 'settings' && 'System Settings'}
              </h1>
              <p className="text-gray-600 mt-2">
                {activePage === 'dashboard' && 'Monitor system performance and key metrics'}
                {activePage === 'pensioners' && 'Manage pensioner accounts and verification status'}
                {activePage === 'enquiries' && 'View and manage system enquiries and support requests'}
                {activePage === 'notifications' && 'View and manage system notifications'}
                {activePage === 'reports' && 'Generate and download system reports'}
                {activePage === 'settings' && 'Configure system settings and preferences'}
              </p>
            </div>
            
            {/* Fallback Logout Button */}
            <button
              onClick={handleLogout}
              className="flex items-center px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
            >
              <LogOut className="w-4 h-4 mr-2" />
              Logout
            </button>
          </div>

          {/* Dashboard Content */}
          {activePage === 'dashboard' && <DashboardOverview metrics={metrics} monthlyVerifications={monthlyVerifications} />}
          {activePage === 'pensioners' && <PensionerManagement 
            pensioners={pensioners} 
            searchTerm={searchTerm}
            setSearchTerm={setSearchTerm}
            statusFilter={statusFilter}
            setStatusFilter={setStatusFilter}
            pensionTypeFilter={pensionTypeFilter}
            setPensionTypeFilter={setPensionTypeFilter}
            handleViewPensioner={handleViewPensioner}
            handleApprovePensioner={handleApprovePensioner}
            handleFlagPensioner={handleFlagPensioner}
            handleDeletePensioner={handleDeletePensioner}
            actionLoading={actionLoading}
          />}
          {activePage === 'enquiries' && <EnquiriesManagement />}
          {activePage === 'notifications' && <NotificationsPanel notifications={notifications} />}
          {activePage === 'reports' && <ReportsSection />}
          {activePage === 'settings' && <SettingsSection user={user} />}
        </div>
      </main>

      {/* Logout Confirmation Modal */}
      {showLogoutModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <div className="flex items-center mb-4">
              <div className="flex-shrink-0">
                <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
                  <LogOut className="w-6 h-6 text-red-600" />
                </div>
              </div>
              <div className="ml-3">
                <h3 className="text-lg font-medium text-gray-900">Confirm Logout</h3>
                <p className="text-sm text-gray-500">Are you sure you want to logout?</p>
              </div>
            </div>
            
            <div className="flex justify-end space-x-3">
              <button
                onClick={cancelLogout}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={confirmLogout}
                className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 transition-colors"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      )}

      {/* View Pensioner Modal */}
      {showViewModal && selectedPensioner && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-semibold text-gray-900">Pensioner Details</h3>
              <button
                onClick={() => setShowViewModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Personal Information */}
              <div className="space-y-4">
                <h4 className="font-semibold text-gray-800">Personal Information</h4>
                <div className="space-y-2 text-sm text-gray-900">
                  <div className="text-gray-900 flex items-center gap-2">
                    <span className="font-medium text-gray-900">Name:</span>
                    <div className="flex items-center gap-2">
                      <User className="w-4 h-4 text-gray-500" />
                      <span className="text-gray-900">{selectedPensioner.fullName}</span>
                    </div>
                  </div>
                  <div className="text-gray-900"><span className="font-medium text-gray-900">Pension ID:</span> <span className="text-gray-900">{selectedPensioner.pensionId}</span></div>
                  <div className="text-gray-900"><span className="font-medium text-gray-900">Email:</span> <span className="text-gray-900">{selectedPensioner.email}</span></div>
                  <div className="text-gray-900"><span className="font-medium text-gray-900">Phone:</span> <span className="text-gray-900">{selectedPensioner.phone}</span></div>
                  <div className="text-gray-900"><span className="font-medium text-gray-900">NIN:</span> <span className="text-gray-900">{selectedPensioner.nin}</span></div>
                  <div className="text-gray-900"><span className="font-medium text-gray-900">Gender:</span> <span className="text-gray-900">{selectedPensioner.gender}</span></div>
                  <div className="text-gray-900"><span className="font-medium text-gray-900">Date of Birth:</span> <span className="text-gray-900">{new Date(selectedPensioner.dateOfBirth).toLocaleDateString()}</span></div>
                </div>
              </div>

              {/* Employment Information */}
              <div className="space-y-4">
                <h4 className="font-semibold text-gray-800">Employment Information</h4>
                <div className="space-y-2 text-sm text-gray-900">
                  <div className="text-gray-900"><span className="font-medium text-gray-900">Scheme Type:</span> <span className="text-gray-900">{selectedPensioner.pensionSchemeType}</span></div>
                  <div className="text-gray-900"><span className="font-medium text-gray-900">Current Level:</span> <span className="text-gray-900">{selectedPensioner.currentLevel}</span></div>
                  <div className="text-gray-900"><span className="font-medium text-gray-900">PF Number:</span> <span className="text-gray-900">{selectedPensioner.pfNumber}</span></div>
                  <div className="text-gray-900"><span className="font-medium text-gray-900">First Appointment:</span> <span className="text-gray-900">{new Date(selectedPensioner.dateOfFirstAppointment).toLocaleDateString()}</span></div>
                  <div className="text-gray-900"><span className="font-medium text-gray-900">Retirement Date:</span> <span className="text-gray-900">{new Date(selectedPensioner.dateOfRetirement).toLocaleDateString()}</span></div>
                  <div className="text-gray-900"><span className="font-medium text-gray-900">Last Salary:</span> <span className="text-gray-900">₦{selectedPensioner.salary?.toLocaleString()}</span></div>
                </div>
              </div>

              {/* Pension Benefits */}
              <div className="space-y-4">
                <h4 className="font-semibold text-gray-800">Pension Benefits</h4>
                <div className="space-y-2 text-sm text-gray-900">
                  <div className="text-gray-900"><span className="font-medium text-gray-900">Years of Service:</span> <span className="text-gray-900">{selectedPensioner.yearsOfService || 'N/A'}</span></div>
                  <div className="text-gray-900"><span className="font-medium text-gray-900">Gratuity Rate:</span> <span className="text-gray-900">{selectedPensioner.gratuityRate ? `${(selectedPensioner.gratuityRate * 100).toFixed(1)}%` : 'N/A'}</span></div>
                  <div className="text-gray-900"><span className="font-medium text-gray-900">Pension Rate:</span> <span className="text-gray-900">{selectedPensioner.pensionRate ? `${(selectedPensioner.pensionRate * 100).toFixed(1)}%` : 'N/A'}</span></div>
                  <div className="text-gray-900"><span className="font-medium text-gray-900">Total Gratuity:</span> <span className="text-gray-900">₦{selectedPensioner.totalGratuity?.toLocaleString() || 'N/A'}</span></div>
                  <div className="text-gray-900"><span className="font-medium text-gray-900">Monthly Pension:</span> <span className="text-gray-900">₦{selectedPensioner.monthlyPension?.toLocaleString() || 'N/A'}</span></div>
                </div>
              </div>

              {/* Status */}
              <div className="space-y-4">
                <h4 className="font-semibold text-gray-800">Status</h4>
                <div className="space-y-2 text-sm text-gray-900">
                  <div className="text-gray-900"><span className="font-medium text-gray-900">Status:</span> 
                    <span className={`ml-2 px-2 py-1 rounded-full text-xs ${
                      selectedPensioner.status === 'VERIFIED' ? 'bg-green-100 text-green-800' :
                      selectedPensioner.status === 'PENDING_VERIFICATION' ? 'bg-yellow-100 text-yellow-800' :
                      selectedPensioner.status === 'FLAGGED' ? 'bg-red-100 text-red-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {selectedPensioner.status}
                    </span>
                  </div>
                  <div className="text-gray-900"><span className="font-medium text-gray-900">Last Login:</span> <span className="text-gray-900">
                    {selectedPensioner.lastLogin 
                      ? new Date(selectedPensioner.lastLogin).toLocaleString('en-US', { 
                          year: 'numeric', 
                          month: 'short', 
                          day: 'numeric', 
                          hour: '2-digit', 
                          minute: '2-digit' 
                        })
                      : 'Never'}
                  </span></div>
                  <div className="text-gray-900"><span className="font-medium text-gray-900">Created:</span> <span className="text-gray-900">{new Date(selectedPensioner.createdAt).toLocaleDateString()}</span></div>
                  <div className="text-gray-900"><span className="font-medium text-gray-900">Updated:</span> <span className="text-gray-900">{new Date(selectedPensioner.updatedAt).toLocaleDateString()}</span></div>
                </div>
              </div>
            </div>

            {/* Documents */}
            {selectedPensioner.pensionerfile && selectedPensioner.pensionerfile.length > 0 && (
              <div className="mt-6">
                <h4 className="font-semibold text-gray-800 mb-4">Documents</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {selectedPensioner.pensionerfile.map((file: any) => (
                    <div key={file.id} className="border rounded-lg p-4 bg-white">
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="font-medium text-sm text-gray-900">{file.fileType}</div>
                          <div className="text-xs text-gray-500">{file.originalName}</div>
                          <div className="text-xs text-gray-500">{new Date(file.createdAt).toLocaleDateString()}</div>
                        </div>
                        <button
                          type="button"
                          aria-label="Download"
                          disabled={downloadingFileId === file.id}
                          onClick={async () => {
                            // Prevent duplicate downloads
                            if (downloadingFileId === file.id) {
                              console.log('Download already in progress for this file');
                              return;
                            }

                            try {
                              setDownloadingFileId(file.id);
                              const getSigned = async () => {
                                // Add cache-busting timestamp to ensure fresh URL every time
                                const params = new URLSearchParams({
                                  url: file.fileUrl,
                                  filename: file.originalName || '',
                                  _t: Date.now().toString() // Cache buster
                                });
                                const res = await fetch(`/api/download?${params.toString()}`, { 
                                  method: 'GET', 
                                  cache: 'no-store',
                                  headers: {
                                    'Cache-Control': 'no-cache',
                                    'Pragma': 'no-cache'
                                  }
                                });
                                const data = await res.json();
                                if (!res.ok || !data?.url) {
                                  throw new Error(data?.error || 'Failed to get download URL');
                                }
                                return data.url as string;
                              };
                              // Get fresh signed URL and open immediately
                              const signedUrl = await getSigned();
                              // Open immediately to minimize delay between generation and use
                              const win = window.open(signedUrl, '_blank', 'noopener,noreferrer');
                              // Only retry if popup was actually blocked (not just closed)
                              if (!win) {
                                console.warn('Popup blocked, retrying with fresh URL...');
                                const retryUrl = await getSigned();
                                window.open(retryUrl, '_blank', 'noopener,noreferrer');
                              }
                            } catch (e) {
                              console.error('Download failed', e);
                              toast.error('Failed to generate download link. Please try again.');
                            } finally {
                              setDownloadingFileId(null);
                            }
                          }}
                          className="text-blue-600 hover:text-blue-800 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          <Download className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="flex justify-end mt-6">
              <button
                onClick={() => setShowViewModal(false)}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Flag Pensioner Modal */}
      {showFlagModal && selectedPensioner && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <div className="flex items-center mb-4">
              <div className="flex-shrink-0">
                <div className="w-10 h-10 bg-yellow-100 rounded-full flex items-center justify-center">
                  <Flag className="w-6 h-6 text-yellow-600" />
                </div>
              </div>
              <div className="ml-3">
                <h3 className="text-lg font-medium text-gray-900">Flag Pensioner</h3>
                <p className="text-sm text-gray-500">Flag {selectedPensioner.fullName} for suspicious activity</p>
              </div>
            </div>
            
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">Reason for Flagging</label>
              <textarea
                value={flagReason}
                onChange={(e) => setFlagReason(e.target.value)}
                placeholder="Please provide a detailed reason for flagging this pensioner..."
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500"
                rows={4}
              />
            </div>
            
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => setShowFlagModal(false)}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={confirmFlagPensioner}
                disabled={actionLoading}
                className="px-4 py-2 text-sm font-medium text-white bg-yellow-600 rounded-lg hover:bg-yellow-700 disabled:opacity-50 transition-colors"
              >
                {actionLoading ? 'Flagging...' : 'Flag Pensioner'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Approve Pensioner Modal */}
      {showApproveModal && selectedPensioner && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <div className="flex items-center mb-4">
              <div className="flex-shrink-0">
                <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                  <CheckCircle className="w-6 h-6 text-green-600" />
                </div>
              </div>
              <div className="ml-3">
                <h3 className="text-lg font-medium text-gray-900">Approve Pensioner</h3>
                <p className="text-sm text-gray-500">Approve {selectedPensioner.fullName} for verification</p>
              </div>
            </div>
            
            <div className="mb-6">
              <p className="text-sm text-gray-700">
                Are you sure you want to approve <strong>{selectedPensioner.fullName}</strong> 
                ({selectedPensioner.pensionId}) for pension verification?
              </p>
              <p className="text-sm text-green-600 mt-2">
                This will mark the pensioner as verified and eligible for pension benefits.
              </p>
            </div>
            
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => setShowApproveModal(false)}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={confirmApprovePensioner}
                disabled={actionLoading}
                className="px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-lg hover:bg-green-700 disabled:opacity-50 transition-colors"
              >
                {actionLoading ? 'Approving...' : 'Approve Pensioner'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Pensioner Modal */}
      {showDeleteModal && selectedPensioner && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <div className="flex items-center mb-4">
              <div className="flex-shrink-0">
                <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
                  <Trash2 className="w-6 h-6 text-red-600" />
                </div>
              </div>
              <div className="ml-3">
                <h3 className="text-lg font-medium text-gray-900">Delete Pensioner</h3>
                <p className="text-sm text-gray-500">This action cannot be undone</p>
              </div>
            </div>
            
            <div className="mb-6">
              <p className="text-sm text-gray-700">
                Are you sure you want to permanently delete <strong>{selectedPensioner.fullName}</strong> 
                ({selectedPensioner.pensionId}) from the system?
              </p>
              <p className="text-sm text-red-600 mt-2">
                This will delete all associated data including documents and verification logs.
              </p>
            </div>
            
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => setShowDeleteModal(false)}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={confirmDeletePensioner}
                disabled={actionLoading}
                className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 disabled:opacity-50 transition-colors"
              >
                {actionLoading ? 'Deleting...' : 'Delete Pensioner'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// Dashboard Overview Component
function DashboardOverview({ metrics, monthlyVerifications }: { metrics: any, monthlyVerifications: any[] }) {
  // Prepare pie chart data
  const pieChartData = monthlyVerifications.length > 0 
    ? monthlyVerifications.map(item => ({
        name: item.label,
        value: item.count
      }))
    : [];

  // Professional color palette for pie chart
  const COLORS = [
    '#3b82f6', // Blue
    '#10b981', // Green
    '#f59e0b', // Amber
    '#ef4444', // Red
    '#8b5cf6', // Purple
    '#06b6d4', // Cyan
    '#ec4899', // Pink
    '#14b8a6', // Teal
  ];

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0];
      const total = pieChartData.reduce((sum, item) => sum + item.value, 0);
      const percentage = total > 0 ? ((data.value / total) * 100).toFixed(1) : 0;
      
      return (
        <div className="bg-white border border-gray-200 rounded-lg shadow-xl p-4">
          <p className="text-sm font-semibold text-gray-900 mb-1">{data.name}</p>
          <p className="text-lg font-bold text-blue-600">{data.value} pensioners</p>
          <p className="text-xs text-gray-500 mt-1">{percentage}% of total</p>
        </div>
      );
    }
    return null;
  };

  const renderCustomLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent, name }: any) => {
    const RADIAN = Math.PI / 180;
    const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
    const x = cx + radius * Math.cos(-midAngle * RADIAN);
    const y = cy + radius * Math.sin(-midAngle * RADIAN);

    // Only show label if percentage is significant (>5%)
    if (percent < 0.05) return null;

    return (
      <text
        x={x}
        y={y}
        fill="white"
        textAnchor={x > cx ? 'start' : 'end'}
        dominantBaseline="central"
        className="text-xs font-semibold"
        style={{ textShadow: '0 1px 2px rgba(0,0,0,0.3)' }}
      >
        {`${(percent * 100).toFixed(0)}%`}
      </text>
    );
  };

  const totalVerified = pieChartData.reduce((sum, item) => sum + item.value, 0);

  return (
    <div className="space-y-6">
      {/* Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <MetricCard
          title="Total Pensioners"
          value={metrics.totalPensioners}
          icon={Users}
          color="bg-blue-100 text-blue-600"
          bgColor="bg-blue-50"
        />
        <MetricCard
          title="Verified Pensioners"
          value={metrics.verifiedPensioners}
          icon={UserCheck}
          color="bg-green-100 text-green-600"
          bgColor="bg-green-50"
        />
        <MetricCard
          title="Pending Reviews"
          value={metrics.pendingReviews}
          icon={Clock}
          color="bg-yellow-100 text-yellow-600"
          bgColor="bg-yellow-50"
        />
        <MetricCard
          title="Flagged Accounts"
          value={metrics.flaggedAccounts}
          icon={AlertTriangle}
          color="bg-red-100 text-red-600"
          bgColor="bg-red-50"
        />
      </div>

      {/* Pie Chart Section */}
      <div className="bg-white shadow-md rounded-xl p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Pensioners Verified per Month</h3>
            <p className="text-sm text-gray-500 mt-1">Distribution of verifications over the last 6 months</p>
          </div>
          <div className="flex items-center gap-2">
            <div className="text-right">
              <p className="text-2xl font-bold text-gray-900">{totalVerified}</p>
              <p className="text-xs text-gray-500">Total Verified</p>
            </div>
            <TrendingUp className="w-6 h-6 text-blue-600" />
          </div>
        </div>
        
        {pieChartData.length === 0 ? (
          <div className="h-64 bg-gray-50 rounded-lg flex items-center justify-center">
            <div className="text-center">
              <BarChart3 className="w-12 h-12 text-gray-400 mx-auto mb-2" />
              <p className="text-gray-500">No verification data available</p>
              <p className="text-sm text-gray-400 mt-1">Data will appear here as pensioners are verified</p>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Pie Chart */}
            <div>
              <ResponsiveContainer width="100%" height={350}>
                <PieChart>
                  <Pie
                    data={pieChartData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={renderCustomLabel}
                    outerRadius={120}
                    innerRadius={60}
                    fill="#8884d8"
                    dataKey="value"
                    stroke="#fff"
                    strokeWidth={2}
                  >
                    {pieChartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip content={<CustomTooltip />} />
                </PieChart>
              </ResponsiveContainer>
            </div>
            
            {/* Legend */}
            <div className="flex flex-col justify-center">
              <div className="space-y-3">
                {pieChartData.map((item, index) => {
                  const percentage = totalVerified > 0 ? ((item.value / totalVerified) * 100).toFixed(1) : 0;
                  return (
                    <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                      <div className="flex items-center gap-3">
                        <div
                          className="w-4 h-4 rounded-full"
                          style={{ backgroundColor: COLORS[index % COLORS.length] }}
                        />
                        <div>
                          <p className="text-sm font-medium text-gray-900">{item.name}</p>
                          <p className="text-xs text-gray-500">{item.value} pensioners</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-semibold text-gray-900">{percentage}%</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

// Metric Card Component
function MetricCard({ title, value, icon: Icon, color, bgColor }: any) {
  return (
    <div className={`${bgColor} rounded-xl p-6 shadow-sm`}>
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-600">{title}</p>
          <p className="text-3xl font-bold text-gray-900 mt-2">{value.toLocaleString()}</p>
        </div>
        <div className={`p-3 rounded-lg ${color}`}>
          <Icon className="w-6 h-6" />
        </div>
      </div>
    </div>
  )
}

// Pensioner Management Component
function PensionerManagement({ 
  pensioners, 
  searchTerm, 
  setSearchTerm, 
  statusFilter, 
  setStatusFilter, 
  pensionTypeFilter, 
  setPensionTypeFilter,
  handleViewPensioner,
  handleApprovePensioner,
  handleFlagPensioner,
  handleDeletePensioner,
  actionLoading
}: any) {
  return (
    <div className="space-y-6">
      {/* Search and Filters */}
      <div className="bg-white shadow-md rounded-xl p-6">
        <div className="flex flex-col lg:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Search pensioners..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>
          <div className="flex gap-4">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Status</option>
              <option value="verified">Verified</option>
              <option value="pending">Pending</option>
              <option value="flagged">Flagged</option>
            </select>
            <select
              value={pensionTypeFilter}
              onChange={(e) => setPensionTypeFilter(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Types</option>
              <option value="contributory">Contributory</option>
              <option value="total">Total</option>
            </select>
          </div>
        </div>
      </div>

      {/* Pensioners Table */}
      <div className="bg-white shadow-md rounded-xl overflow-hidden">
        {pensioners.length === 0 ? (
          <div className="p-8 text-center">
            <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500">No pensioners found</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Pensioner ID</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Category</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Documents</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Last Login</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date Registered</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {pensioners.map((pensioner: any, index: number) => (
                  <tr key={pensioner.id} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{pensioner.id}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      <div className="flex items-center gap-2">
                        <User className="w-4 h-4 text-gray-500" />
                        <span>{pensioner.name}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">{pensioner.category}</td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        pensioner.status === 'VERIFIED' 
                          ? 'bg-green-100 text-green-800' 
                          : pensioner.status === 'PENDING'
                          ? 'bg-yellow-100 text-yellow-800'
                          : pensioner.status === 'FLAGGED'
                          ? 'bg-red-100 text-red-800'
                          : 'bg-gray-100 text-gray-800'
                      }`}>
                        {pensioner.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                      <div className="flex flex-wrap gap-1">
                        {pensioner.documents.slice(0, 2).map((doc: string, idx: number) => (
                          <span key={idx} className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-blue-100 text-blue-800">
                            {doc}
                          </span>
                        ))}
                        {pensioner.documents.length > 2 && (
                          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-gray-100 text-gray-600">
                            +{pensioner.documents.length - 2} more
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                      <div className="flex items-center gap-2">
                        <Clock className="w-4 h-4 text-gray-400" />
                        <span className={pensioner.lastLogin === 'Never' ? 'text-gray-400 italic' : ''}>
                          {pensioner.lastLogin}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">{pensioner.dateRegistered}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex space-x-2">
                        <button 
                          onClick={() => handleViewPensioner(pensioner)}
                          disabled={actionLoading}
                          className="text-blue-600 hover:text-blue-900 disabled:opacity-50" 
                          title="View Details"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button 
                          onClick={() => handleApprovePensioner(pensioner)}
                          disabled={actionLoading || pensioner.status === 'VERIFIED'}
                          className="text-green-600 hover:text-green-900 disabled:opacity-50" 
                          title="Approve"
                        >
                          <CheckCircle className="w-4 h-4" />
                        </button>
                        <button 
                          onClick={() => handleFlagPensioner(pensioner)}
                          disabled={actionLoading}
                          className="text-yellow-600 hover:text-yellow-900 disabled:opacity-50" 
                          title="Flag"
                        >
                          <Flag className="w-4 h-4" />
                        </button>
                        <button 
                          onClick={() => handleDeletePensioner(pensioner)}
                          disabled={actionLoading}
                          className="text-red-600 hover:text-red-900 disabled:opacity-50" 
                          title="Delete"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}

// Notifications Panel Component
function NotificationsPanel({ notifications: initialNotifications }: { notifications: any[] }) {
  const [localNotifications, setLocalNotifications] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<'all' | 'pending_verification' | 'new_registration' | 'flagged_account' | 'failed_verification' | 'verification_due' | 'enquiry' | 'system_alert'>('all')
  const [unreadCount, setUnreadCount] = useState(0)

  useEffect(() => {
    loadNotifications()
  }, [filter])

  const loadNotifications = async () => {
    try {
      setLoading(true)
      const token = localStorage.getItem('token') || ''
      
      const params = new URLSearchParams()
      params.append('limit', '50')
      if (filter !== 'all') {
        params.append('type', filter)
      }

      const response = await fetch(`/api/admin/notifications?${params.toString()}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      if (response.ok) {
        const data = await response.json()
        setLocalNotifications(data.notifications || [])
        setUnreadCount(data.unread || 0)
      } else {
        toast.error('Failed to load notifications')
        // Fallback to initial notifications if API fails
        setLocalNotifications(initialNotifications)
      }
    } catch (error) {
      console.error('Error loading notifications:', error)
      toast.error('Failed to load notifications')
      setLocalNotifications(initialNotifications)
    } finally {
      setLoading(false)
    }
  }

  const handleMarkAsRead = async (id: string) => {
    try {
      const token = localStorage.getItem('token') || ''
      const response = await fetch('/api/admin/notifications', {
        method: 'PATCH',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ notificationId: id, read: true }),
      })

      if (response.ok) {
        setLocalNotifications(prev => 
          prev.map(notif => 
            notif.id === id ? { ...notif, read: true } : notif
          )
        )
        setUnreadCount(prev => Math.max(0, prev - 1))
      }
    } catch (error) {
      console.error('Error marking notification as read:', error)
      // Update locally anyway
      setLocalNotifications(prev => 
        prev.map(notif => 
          notif.id === id ? { ...notif, read: true } : notif
        )
      )
      setUnreadCount(prev => Math.max(0, prev - 1))
    }
  }

  const handleDeleteNotification = (id: string) => {
    setLocalNotifications(prev => prev.filter(notif => notif.id !== id))
    const deleted = localNotifications.find(n => n.id === id)
    if (deleted && !deleted.read) {
      setUnreadCount(prev => Math.max(0, prev - 1))
    }
  }

  const handleMarkAllAsRead = async () => {
    try {
      const unreadNotifications = localNotifications.filter(n => !n.read)
      for (const notif of unreadNotifications) {
        await handleMarkAsRead(notif.id)
      }
      toast.success('All notifications marked as read')
    } catch (error) {
      console.error('Error marking all as read:', error)
      toast.error('Failed to mark all as read')
    }
  }

  const getNotificationIcon = (iconName: string) => {
    const iconMap: { [key: string]: any } = {
      UserCheck: UserCheck,
      UserPlus: UserPlus,
      AlertTriangle: AlertTriangle,
      X: X,
      XCircle: X,
      Calendar: Calendar,
      Mail: Mail,
      AlertCircle: AlertCircle,
      Shield: Shield,
      CheckCircle: CheckCircle,
    }
    const IconComponent = iconMap[iconName] || Bell
    return <IconComponent className="w-5 h-5" />
  }

  const getNotificationColor = (type: string, priority: string) => {
    if (priority === 'high') {
      return 'border-red-500 bg-red-50'
    } else if (priority === 'medium') {
      return 'border-yellow-500 bg-yellow-50'
    } else if (type === 'system_alert') {
      return 'border-purple-500 bg-purple-50'
    }
    return 'border-blue-500 bg-blue-50'
  }

  const formatTimestamp = (timestamp: string | Date) => {
    const date = new Date(timestamp)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffMins = Math.floor(diffMs / 60000)
    const diffHours = Math.floor(diffMs / 3600000)
    const diffDays = Math.floor(diffMs / 86400000)

    if (diffMins < 1) return 'Just now'
    if (diffMins < 60) return `${diffMins}m ago`
    if (diffHours < 24) return `${diffHours}h ago`
    if (diffDays < 7) return `${diffDays}d ago`
    return date.toLocaleDateString()
  }

  const filteredNotifications = filter === 'all' 
    ? localNotifications 
    : localNotifications.filter(n => n.type === filter)

  return (
    <div className="space-y-6">
      {/* Header with actions */}
      <div className="bg-gradient-to-r from-blue-600 to-indigo-700 text-white rounded-xl p-6 shadow-lg">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-2xl font-bold mb-1">System Notifications</h3>
            <p className="text-sm opacity-90">
              {unreadCount} unread notification{unreadCount !== 1 ? 's' : ''}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={loadNotifications}
              className="px-4 py-2 bg-white/20 hover:bg-white/30 rounded-lg transition-colors text-sm font-medium flex items-center"
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              Refresh
            </button>
            <button
              onClick={handleMarkAllAsRead}
              disabled={unreadCount === 0}
              className="px-4 py-2 bg-white/20 hover:bg-white/30 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium transition-colors"
            >
              Mark All as Read
            </button>
          </div>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="bg-white shadow-md rounded-xl p-4 border border-gray-200">
        <div className="flex flex-wrap gap-2">
          {[
            { value: 'all', label: 'All', count: localNotifications.length },
            { value: 'pending_verification', label: 'Pending', count: localNotifications.filter(n => n.type === 'pending_verification').length },
            { value: 'new_registration', label: 'New Registrations', count: localNotifications.filter(n => n.type === 'new_registration').length },
            { value: 'flagged_account', label: 'Flagged', count: localNotifications.filter(n => n.type === 'flagged_account').length },
            { value: 'failed_verification', label: 'Failed', count: localNotifications.filter(n => n.type === 'failed_verification').length },
            { value: 'verification_due', label: 'Due Soon', count: localNotifications.filter(n => n.type === 'verification_due').length },
            { value: 'enquiry', label: 'Enquiries', count: localNotifications.filter(n => n.type === 'enquiry').length },
            { value: 'system_alert', label: 'System Alerts', count: localNotifications.filter(n => n.type === 'system_alert').length },
          ].map((tab) => (
            <button
              key={tab.value}
              onClick={() => setFilter(tab.value as any)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                filter === tab.value
                  ? 'bg-blue-600 text-white shadow-md'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {tab.label}
              {tab.count > 0 && (
                <span className={`ml-2 px-2 py-0.5 rounded-full text-xs ${
                  filter === tab.value ? 'bg-white/20' : 'bg-gray-300'
                }`}>
                  {tab.count}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Notifications List */}
      {loading ? (
        <div className="bg-white shadow-md rounded-xl p-12 text-center">
          <Loader2 className="w-12 h-12 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-gray-600">Loading notifications...</p>
        </div>
      ) : filteredNotifications.length === 0 ? (
        <div className="bg-white shadow-md rounded-xl p-12 text-center border border-gray-200">
          <Bell className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">No Notifications</h3>
          <p className="text-gray-500">
            {filter === 'all' 
              ? "You're all caught up! New notifications will appear here."
              : `No ${filter.replace('_', ' ')} notifications found.`}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredNotifications.map((notification) => {
            const IconComponent = getNotificationIcon(notification.icon || 'Bell')
            const isUnread = !notification.read
            const borderColor = isUnread 
              ? getNotificationColor(notification.type, notification.priority || 'low')
              : 'border-gray-200 bg-white'

            return (
              <div
                key={notification.id}
                className={`bg-white shadow-sm rounded-lg p-5 border-l-4 transition-all hover:shadow-md ${borderColor}`}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-4 flex-1">
                    <div className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center ${
                      isUnread 
                        ? notification.priority === 'high' ? 'bg-red-100 text-red-600' :
                          notification.priority === 'medium' ? 'bg-yellow-100 text-yellow-600' :
                          'bg-blue-100 text-blue-600'
                        : 'bg-gray-100 text-gray-400'
                    }`}>
                      {IconComponent}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2 mb-1">
                        <h4 className="text-sm font-semibold text-gray-900">{notification.title}</h4>
                        {notification.priority === 'high' && (
                          <span className="flex-shrink-0 px-2 py-0.5 bg-red-100 text-red-700 text-xs font-medium rounded-full">
                            High Priority
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-gray-700 mb-2">{notification.message}</p>
                      <div className="flex items-center gap-3 flex-wrap">
                        <span className="text-xs text-gray-500 flex items-center">
                          <Clock className="w-3 h-3 mr-1" />
                          {formatTimestamp(notification.timestamp)}
                        </span>
                        {notification.type && (
                          <span className="text-xs px-2 py-0.5 bg-gray-100 text-gray-600 rounded-full capitalize">
                            {notification.type.replace(/_/g, ' ')}
                          </span>
                        )}
                        {isUnread && (
                          <span className="flex-shrink-0 w-2 h-2 rounded-full bg-blue-500"></span>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    {isUnread && (
                      <button
                        onClick={() => handleMarkAsRead(notification.id)}
                        className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                        title="Mark as read"
                      >
                        <CheckCircle className="w-5 h-5" />
                      </button>
                    )}
                    {notification.actionUrl && (
                      <a
                        href={notification.actionUrl}
                        className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                        title="View details"
                      >
                        <Eye className="w-5 h-5" />
                      </a>
                    )}
                    <button
                      onClick={() => handleDeleteNotification(notification.id)}
                      className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      title="Delete notification"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

// Reports Section Component
function ReportsSection() {
  const [loading, setLoading] = useState(true);
  const [verificationTrends, setVerificationTrends] = useState<any[]>([]);
  const [schemeBreakdown, setSchemeBreakdown] = useState<any[]>([]);
  const [departmentPerformance, setDepartmentPerformance] = useState<any>(null);
  const [methodBreakdown, setMethodBreakdown] = useState<any[]>([]);
  const [recentActivity, setRecentActivity] = useState<any>(null);
  const [summary, setSummary] = useState<any>(null);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [reportType, setReportType] = useState('Monthly Verification Summary');
  const [exporting, setExporting] = useState(false);

  const schemeColors = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4', '#ec4899', '#14b8a6'];

  useEffect(() => {
    loadReportsData();
  }, [startDate, endDate]);

  const loadReportsData = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token') || '';
      
      const params = new URLSearchParams();
      if (startDate) params.append('startDate', startDate);
      if (endDate) params.append('endDate', endDate);

      const response = await fetch(`/api/admin/reports?${params.toString()}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setVerificationTrends(data.verificationTrends || []);
        setSchemeBreakdown(data.schemeBreakdown || []);
        setDepartmentPerformance(data.departmentPerformance);
        setMethodBreakdown(data.methodBreakdown || []);
        setRecentActivity(data.recentActivity);
        setSummary(data.summary);
      } else {
        toast.error('Failed to load reports data');
      }
    } catch (error) {
      console.error('Error loading reports:', error);
      toast.error('Failed to load reports data');
    } finally {
      setLoading(false);
    }
  };

  const handleExport = async (format: 'pdf' | 'csv') => {
    try {
      setExporting(true);
      // TODO: Implement actual export functionality
      toast.success(`${format.toUpperCase()} export will be implemented soon`);
    } catch (error) {
      console.error('Export error:', error);
      toast.error('Failed to export report');
    } finally {
      setExporting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-gray-600">Loading reports data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      {summary && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-gradient-to-br from-blue-500 to-blue-700 text-white rounded-xl p-6 shadow-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium opacity-90">Total Pensioners</p>
                <p className="text-3xl font-bold mt-1">{summary.totalPensioners || 0}</p>
              </div>
              <Users className="w-10 h-10 opacity-80" />
            </div>
          </div>
          <div className="bg-gradient-to-br from-green-500 to-green-700 text-white rounded-xl p-6 shadow-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium opacity-90">Verified</p>
                <p className="text-3xl font-bold mt-1">{summary.verifiedPensioners || 0}</p>
              </div>
              <CheckCircle className="w-10 h-10 opacity-80" />
            </div>
          </div>
          <div className="bg-gradient-to-br from-yellow-500 to-yellow-700 text-white rounded-xl p-6 shadow-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium opacity-90">Pending Reviews</p>
                <p className="text-3xl font-bold mt-1">{summary.pendingReviews || 0}</p>
              </div>
              <Clock className="w-10 h-10 opacity-80" />
            </div>
          </div>
          <div className="bg-gradient-to-br from-purple-500 to-purple-700 text-white rounded-xl p-6 shadow-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium opacity-90">Completion Rate</p>
                <p className="text-3xl font-bold mt-1">{summary.completionRate || 0}%</p>
              </div>
              <TrendingUp className="w-10 h-10 opacity-80" />
            </div>
          </div>
        </div>
      )}

      {/* Report Filters */}
      <div className="bg-white shadow-md rounded-xl p-6 border border-gray-200">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">Generate Reports</h3>
          <button
            onClick={loadReportsData}
            className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors text-sm font-medium flex items-center"
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh
          </button>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Start Date</label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">End Date</label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Report Type</label>
            <select
              value={reportType}
              onChange={(e) => setReportType(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option>Monthly Verification Summary</option>
              <option>Flagged Pensioners List</option>
              <option>Total Pensioners by Department</option>
              <option>System Activity Logs</option>
            </select>
          </div>
        </div>
        <div className="mt-6 flex space-x-4">
          <button
            onClick={() => handleExport('pdf')}
            disabled={exporting}
            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-md"
          >
            {exporting ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <Download className="w-4 h-4 mr-2" />
            )}
            Export PDF
          </button>
          <button
            onClick={() => handleExport('csv')}
            disabled={exporting}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-md"
          >
            {exporting ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <FileText className="w-4 h-4 mr-2" />
            )}
            Export CSV
          </button>
        </div>
      </div>

      {/* Recent Activity */}
      {recentActivity && (
        <div className="bg-gradient-to-r from-indigo-500 to-purple-600 text-white rounded-xl p-6 shadow-lg">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-xl font-bold">Recent Activity (Last 30 Days)</h3>
              <p className="text-sm opacity-90 mt-1">Verification activity overview</p>
            </div>
            <Activity className="w-8 h-8 opacity-80" />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4">
              <p className="text-sm opacity-90">Verifications</p>
              <p className="text-3xl font-bold mt-1">{recentActivity.verifications || 0}</p>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4">
              <p className="text-sm opacity-90">Flagged Cases</p>
              <p className="text-3xl font-bold mt-1">{recentActivity.flags || 0}</p>
            </div>
          </div>
        </div>
      )}

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Verification Trend */}
        <div className="bg-white shadow-md rounded-xl p-6 border border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Verification Trend</h3>
              <p className="text-sm text-gray-500">Performance over the last 6 months</p>
            </div>
            <TrendingUp className="w-5 h-5 text-blue-600" />
          </div>
          {verificationTrends.length === 0 ? (
            <div className="h-64 bg-gray-50 rounded-lg flex items-center justify-center">
              <div className="text-center">
                <BarChart3 className="w-12 h-12 text-gray-400 mx-auto mb-2" />
                <p className="text-gray-500">No verification data available</p>
              </div>
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={280}>
              <LineChart data={verificationTrends} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis dataKey="month" stroke="#9ca3af" />
                <YAxis stroke="#9ca3af" />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'white',
                    border: '1px solid #e5e7eb',
                    borderRadius: '8px',
                    boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
                  }}
                />
                <Legend />
                <Line type="monotone" dataKey="verified" stroke="#3b82f6" strokeWidth={3} dot={{ r: 5 }} name="Verified" />
                <Line type="monotone" dataKey="flagged" stroke="#ef4444" strokeWidth={2} dot={{ r: 4 }} name="Flagged" />
              </LineChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Scheme Distribution */}
        <div className="bg-white shadow-md rounded-xl p-6 border border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Scheme Distribution</h3>
              <p className="text-sm text-gray-500">Active pension schemes mix</p>
            </div>
            <BarChart3 className="w-5 h-5 text-green-600" />
          </div>
          {schemeBreakdown.length === 0 ? (
            <div className="h-64 bg-gray-50 rounded-lg flex items-center justify-center">
              <div className="text-center">
                <PieChart className="w-12 h-12 text-gray-400 mx-auto mb-2" />
                <p className="text-gray-500">No scheme data available</p>
              </div>
            </div>
          ) : (
            <div className="flex flex-col lg:flex-row gap-6">
              <div className="h-64 lg:w-1/2">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={schemeBreakdown}
                      cx="50%"
                      cy="50%"
                      outerRadius={90}
                      innerRadius={50}
                      label={(entry) => `${entry.value}%`}
                      dataKey="value"
                    >
                      {schemeBreakdown.map((entry, index) => (
                        <Cell key={`cell-${entry.name}`} fill={schemeColors[index % schemeColors.length]} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{
                        backgroundColor: 'white',
                        border: '1px solid #e5e7eb',
                        borderRadius: '8px',
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="flex-1 space-y-3">
                {schemeBreakdown.map((item, index) => (
                  <div key={item.name} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                    <div className="flex items-center gap-3">
                      <div className="w-4 h-4 rounded-full" style={{ backgroundColor: schemeColors[index % schemeColors.length] }} />
                      <div>
                        <p className="text-sm font-medium text-gray-900">{item.name}</p>
                        <p className="text-xs text-gray-500">{item.count || 0} pensioners • {item.value}%</p>
                      </div>
                    </div>
                    <span className="text-sm font-semibold text-gray-800">{item.value}%</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Method Breakdown */}
      {methodBreakdown.length > 0 && (
        <div className="bg-white shadow-md rounded-xl p-6 border border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Verification Methods</h3>
              <p className="text-sm text-gray-500">Breakdown by verification method</p>
            </div>
            <Shield className="w-5 h-5 text-purple-600" />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {methodBreakdown.map((method, index) => (
              <div key={method.method} className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-lg p-4 border border-gray-200">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-700">{method.method}</p>
                    <p className="text-2xl font-bold text-gray-900 mt-1">{method.count}</p>
                  </div>
                  <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center">
                    <Shield className="w-6 h-6 text-blue-600" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* System Performance */}
      {departmentPerformance && (
        <div className="bg-white shadow-md rounded-xl p-6 border border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-lg font-semibold text-gray-900">System Performance</h3>
              <p className="text-sm text-gray-500">Overall verification statistics</p>
            </div>
            <TrendingUp className="w-5 h-5 text-purple-600" />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
              <p className="text-sm font-medium text-blue-700 mb-1">Total Pensioners</p>
              <p className="text-2xl font-bold text-blue-900">{departmentPerformance.totalPensioners || 0}</p>
            </div>
            <div className="bg-green-50 rounded-lg p-4 border border-green-200">
              <p className="text-sm font-medium text-green-700 mb-1">Verified</p>
              <p className="text-2xl font-bold text-green-900">{departmentPerformance.verifiedPensioners || 0}</p>
            </div>
            <div className="bg-yellow-50 rounded-lg p-4 border border-yellow-200">
              <p className="text-sm font-medium text-yellow-700 mb-1">Pending Reviews</p>
              <p className="text-2xl font-bold text-yellow-900">{departmentPerformance.pendingReviews || 0}</p>
            </div>
            <div className="bg-purple-50 rounded-lg p-4 border border-purple-200">
              <p className="text-sm font-medium text-purple-700 mb-1">Completion Rate</p>
              <p className="text-2xl font-bold text-purple-900">{departmentPerformance.completionRate || 0}%</p>
            </div>
          </div>
          <div className="mt-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-700">Overall Progress</span>
              <span className="text-sm font-semibold text-gray-900">{departmentPerformance.completionRate || 0}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-3">
              <div
                className="bg-gradient-to-r from-blue-500 to-purple-600 h-3 rounded-full transition-all duration-500"
                style={{ width: `${departmentPerformance.completionRate || 0}%` }}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// Settings Section Component
function SettingsSection({ user }: { user: any }) {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [adminProfile, setAdminProfile] = useState<any>(null);
  const [systemSettings, setSystemSettings] = useState<any>(null);
  const [profileForm, setProfileForm] = useState({
    name: '',
    email: '',
  });
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token') || '';

      // Load admin profile
      const profileRes = await fetch('/api/admin/me', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (profileRes.ok) {
        const profileData = await profileRes.json();
        setAdminProfile(profileData.admin);
        setProfileForm({
          name: profileData.admin?.name || '',
          email: profileData.admin?.email || '',
        });
      }

      // Load system settings
      const settingsRes = await fetch('/api/admin/settings', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (settingsRes.ok) {
        const settingsData = await settingsRes.json();
        setSystemSettings(settingsData.settings);
      }
    } catch (error) {
      console.error('Error loading settings:', error);
      toast.error('Failed to load settings');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveProfile = async () => {
    try {
      setSaving(true);
      setMessage(null);
      const token = localStorage.getItem('token') || '';

      const response = await fetch('/api/admin/me', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(profileForm),
      });

      const data = await response.json();

      if (response.ok) {
        setAdminProfile(data.admin);
        setMessage({ type: 'success', text: 'Profile updated successfully' });
        toast.success('Profile updated successfully');
        // Update localStorage user
        const currentUser = JSON.parse(localStorage.getItem('user') || '{}');
        localStorage.setItem('user', JSON.stringify({ ...currentUser, ...data.admin }));
      } else {
        setMessage({ type: 'error', text: data.message || 'Failed to update profile' });
        toast.error(data.message || 'Failed to update profile');
      }
    } catch (error) {
      console.error('Error saving profile:', error);
      setMessage({ type: 'error', text: 'An error occurred while saving' });
      toast.error('Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  const handleChangePassword = async () => {
    try {
      if (passwordForm.newPassword !== passwordForm.confirmPassword) {
        toast.error('New password and confirm password do not match');
        return;
      }

      if (passwordForm.newPassword.length < 6) {
        toast.error('Password must be at least 6 characters');
        return;
      }

      setSaving(true);
      setMessage(null);
      const token = localStorage.getItem('token') || '';

      const response = await fetch('/api/admin/change-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(passwordForm),
      });

      const data = await response.json();

      if (response.ok) {
        setMessage({ type: 'success', text: 'Password changed successfully' });
        toast.success('Password changed successfully');
        setPasswordForm({
          currentPassword: '',
          newPassword: '',
          confirmPassword: '',
        });
      } else {
        setMessage({ type: 'error', text: data.message || 'Failed to change password' });
        toast.error(data.message || 'Failed to change password');
      }
    } catch (error) {
      console.error('Error changing password:', error);
      setMessage({ type: 'error', text: 'An error occurred while changing password' });
      toast.error('Failed to change password');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-gray-600">Loading settings...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* System Information */}
      <div className="bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-200 rounded-xl shadow-lg p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 bg-blue-100 rounded-lg">
            <Settings className="w-6 h-6 text-blue-600" />
          </div>
          <div>
            <h3 className="text-xl font-bold text-gray-900">System Information</h3>
            <p className="text-sm text-gray-600">Current system configuration and statistics</p>
          </div>
        </div>

        {systemSettings && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="bg-white rounded-lg p-4 border border-gray-200">
              <p className="text-xs font-medium text-gray-500 uppercase mb-1">System Name</p>
              <p className="text-sm font-semibold text-gray-900">{systemSettings.systemName}</p>
            </div>
            <div className="bg-white rounded-lg p-4 border border-gray-200">
              <p className="text-xs font-medium text-gray-500 uppercase mb-1">System Version</p>
              <p className="text-sm font-semibold text-gray-900">{systemSettings.systemVersion}</p>
            </div>
            <div className="bg-white rounded-lg p-4 border border-gray-200">
              <p className="text-xs font-medium text-gray-500 uppercase mb-1">Verification Interval</p>
              <p className="text-sm font-semibold text-gray-900">
                {systemSettings.verificationIntervalMonths} months ({systemSettings.verificationIntervalYears} years)
              </p>
            </div>
            <div className="bg-white rounded-lg p-4 border border-gray-200">
              <p className="text-xs font-medium text-gray-500 uppercase mb-1">Environment</p>
              <p className="text-sm font-semibold text-gray-900 capitalize">{systemSettings.environment?.nodeEnv}</p>
            </div>
            <div className="bg-white rounded-lg p-4 border border-gray-200">
              <p className="text-xs font-medium text-gray-500 uppercase mb-1">Database</p>
              <p className="text-sm font-semibold text-gray-900">{systemSettings.databaseProvider}</p>
            </div>
            <div className="bg-white rounded-lg p-4 border border-gray-200">
              <p className="text-xs font-medium text-gray-500 uppercase mb-1">AWS Region</p>
              <p className="text-sm font-semibold text-gray-900">{systemSettings.awsRegion}</p>
            </div>
          </div>
        )}
      </div>

      {/* System Statistics */}
      {systemSettings?.statistics && (
        <div className="bg-white shadow-lg rounded-xl p-6 border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-6 flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-blue-600" />
            System Statistics
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            <div className="text-center p-4 bg-blue-50 rounded-lg">
              <p className="text-2xl font-bold text-blue-600">{systemSettings.statistics.totalPensioners}</p>
              <p className="text-xs text-gray-600 mt-1">Total Pensioners</p>
            </div>
            <div className="text-center p-4 bg-green-50 rounded-lg">
              <p className="text-2xl font-bold text-green-600">{systemSettings.statistics.verifiedPensioners}</p>
              <p className="text-xs text-gray-600 mt-1">Verified</p>
            </div>
            <div className="text-center p-4 bg-yellow-50 rounded-lg">
              <p className="text-2xl font-bold text-yellow-600">{systemSettings.statistics.pendingReviews}</p>
              <p className="text-xs text-gray-600 mt-1">Pending Reviews</p>
            </div>
            <div className="text-center p-4 bg-purple-50 rounded-lg">
              <p className="text-2xl font-bold text-purple-600">{systemSettings.statistics.totalAdmins}</p>
              <p className="text-xs text-gray-600 mt-1">Admins</p>
            </div>
            <div className="text-center p-4 bg-indigo-50 rounded-lg">
              <p className="text-2xl font-bold text-indigo-600">{systemSettings.statistics.totalOfficers}</p>
              <p className="text-xs text-gray-600 mt-1">Officers</p>
            </div>
            <div className="text-center p-4 bg-gray-50 rounded-lg">
              <p className="text-2xl font-bold text-gray-600">{systemSettings.statistics.totalVerificationLogs}</p>
              <p className="text-xs text-gray-600 mt-1">Verification Logs</p>
            </div>
          </div>
        </div>
      )}

      {/* AWS Configuration */}
      {systemSettings && (
        <div className="bg-white shadow-lg rounded-xl p-6 border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-6 flex items-center gap-2">
            <Shield className="w-5 h-5 text-blue-600" />
            AWS Configuration
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">S3 Bucket</label>
              <div className="px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-700">
                {systemSettings.s3Bucket}
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Rekognition Collection</label>
              <div className="px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-700">
                {systemSettings.rekognitionCollection}
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">RP ID</label>
              <div className="px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-700">
                {systemSettings.rpId}
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Origin</label>
              <div className="px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-700 break-all">
                {systemSettings.origin}
              </div>
            </div>
            <div className="md:col-span-2">
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <div className={`w-3 h-3 rounded-full ${systemSettings.environment?.hasAwsConfig ? 'bg-green-500' : 'bg-red-500'}`} />
                  <span className="text-sm text-gray-700">AWS Credentials</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className={`w-3 h-3 rounded-full ${systemSettings.redisConfigured ? 'bg-green-500' : 'bg-red-500'}`} />
                  <span className="text-sm text-gray-700">Redis Configuration</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className={`w-3 h-3 rounded-full ${systemSettings.environment?.hasDatabaseConfig ? 'bg-green-500' : 'bg-red-500'}`} />
                  <span className="text-sm text-gray-700">Database Connection</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Verification Features */}
      {systemSettings && (
        <div className="bg-white shadow-lg rounded-xl p-6 border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-6 flex items-center gap-2">
            <CheckCircle className="w-5 h-5 text-blue-600" />
            Verification Features
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border border-gray-200">
              <div className="flex items-center gap-3">
                <div className={`w-3 h-3 rounded-full ${systemSettings.biometricVerificationEnabled ? 'bg-green-500' : 'bg-gray-400'}`} />
                <span className="text-sm font-medium text-gray-700">Biometric Verification</span>
              </div>
              <span className={`text-xs font-semibold ${systemSettings.biometricVerificationEnabled ? 'text-green-600' : 'text-gray-500'}`}>
                {systemSettings.biometricVerificationEnabled ? 'Enabled' : 'Disabled'}
              </span>
            </div>
            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border border-gray-200">
              <div className="flex items-center gap-3">
                <div className={`w-3 h-3 rounded-full ${systemSettings.faceVerificationEnabled ? 'bg-green-500' : 'bg-gray-400'}`} />
                <span className="text-sm font-medium text-gray-700">Face Verification</span>
              </div>
              <span className={`text-xs font-semibold ${systemSettings.faceVerificationEnabled ? 'text-green-600' : 'text-gray-500'}`}>
                {systemSettings.faceVerificationEnabled ? 'Enabled' : 'Disabled'}
              </span>
            </div>
            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border border-gray-200">
              <div className="flex items-center gap-3">
                <div className={`w-3 h-3 rounded-full ${systemSettings.fingerprintVerificationEnabled ? 'bg-green-500' : 'bg-gray-400'}`} />
                <span className="text-sm font-medium text-gray-700">Fingerprint Verification</span>
              </div>
              <span className={`text-xs font-semibold ${systemSettings.fingerprintVerificationEnabled ? 'text-green-600' : 'text-gray-500'}`}>
                {systemSettings.fingerprintVerificationEnabled ? 'Enabled' : 'Disabled'}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Admin Profile Settings */}
      <div className="bg-white shadow-lg rounded-xl p-6 border border-gray-200">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
              <User className="w-5 h-5 text-blue-600" />
              Admin Profile
            </h3>
            <p className="text-sm text-gray-500 mt-1">Update your personal information</p>
          </div>
          {adminProfile && (
            <div className="text-right">
              <p className="text-xs text-gray-500">Member since</p>
              <p className="text-sm font-medium text-gray-700">
                {new Date(adminProfile.createdAt).toLocaleDateString()}
              </p>
            </div>
          )}
        </div>

        {message && (
          <div className={`mb-4 p-3 rounded-lg ${
            message.type === 'success' ? 'bg-green-50 text-green-800 border border-green-200' : 'bg-red-50 text-red-800 border border-red-200'
          }`}>
            {message.text}
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Full Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={profileForm.name}
              onChange={(e) => setProfileForm({ ...profileForm, name: e.target.value })}
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
              placeholder="Enter your full name"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Email Address <span className="text-red-500">*</span>
            </label>
            <input
              type="email"
              value={profileForm.email}
              onChange={(e) => setProfileForm({ ...profileForm, email: e.target.value })}
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
              placeholder="Enter your email"
            />
          </div>
          {adminProfile && (
            <div className="md:col-span-2 grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-gray-500">Role</p>
                <p className="font-medium text-gray-900 capitalize">{adminProfile.role}</p>
              </div>
              <div>
                <p className="text-gray-500">Last Updated</p>
                <p className="font-medium text-gray-900">
                  {new Date(adminProfile.updatedAt).toLocaleString()}
                </p>
              </div>
            </div>
          )}
        </div>
        <div className="mt-6 flex justify-end">
          <button
            onClick={handleSaveProfile}
            disabled={saving || !profileForm.name || !profileForm.email}
            className="px-6 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 shadow-md hover:shadow-lg"
          >
            {saving ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <CheckCircle className="w-4 h-4" />
                Save Profile
              </>
            )}
          </button>
        </div>
      </div>

      {/* Change Password */}
      <div className="bg-white shadow-lg rounded-xl p-6 border border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900 mb-6 flex items-center gap-2">
          <Shield className="w-5 h-5 text-blue-600" />
          Change Password
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Current Password <span className="text-red-500">*</span>
            </label>
            <input
              type="password"
              value={passwordForm.currentPassword}
              onChange={(e) => setPasswordForm({ ...passwordForm, currentPassword: e.target.value })}
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
              placeholder="Enter current password"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              New Password <span className="text-red-500">*</span>
            </label>
            <input
              type="password"
              value={passwordForm.newPassword}
              onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
              placeholder="Enter new password"
            />
            <p className="text-xs text-gray-500 mt-1">Minimum 6 characters</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Confirm Password <span className="text-red-500">*</span>
            </label>
            <input
              type="password"
              value={passwordForm.confirmPassword}
              onChange={(e) => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })}
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
              placeholder="Confirm new password"
            />
            {passwordForm.newPassword && passwordForm.confirmPassword && passwordForm.newPassword !== passwordForm.confirmPassword && (
              <p className="text-xs text-red-500 mt-1">Passwords do not match</p>
            )}
          </div>
        </div>
        <div className="mt-6 flex justify-end">
          <button
            onClick={handleChangePassword}
            disabled={
              saving ||
              !passwordForm.currentPassword ||
              !passwordForm.newPassword ||
              !passwordForm.confirmPassword ||
              passwordForm.newPassword !== passwordForm.confirmPassword ||
              passwordForm.newPassword.length < 6
            }
            className="px-6 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 shadow-md hover:shadow-lg"
          >
            {saving ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Changing...
              </>
            ) : (
              <>
                <Shield className="w-4 h-4" />
                Change Password
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

// Enquiries Management Component
function EnquiriesManagement() {
  const [enquiries, setEnquiries] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [statistics, setStatistics] = useState<any>(null)
  const [selectedEnquiry, setSelectedEnquiry] = useState<any>(null)
  const [showModal, setShowModal] = useState(false)
  const [actionLoading, setActionLoading] = useState<number | null>(null)

  useEffect(() => {
    loadEnquiries()
  }, [])

  useEffect(() => {
    // Auto-refresh every 30 seconds
    const interval = setInterval(() => {
      loadEnquiries()
    }, 30000)
    return () => clearInterval(interval)
  }, [])

  const loadEnquiries = async () => {
    try {
      setLoading(true)
      setError(null)
      
      const token = localStorage.getItem('token')
      if (!token) {
        throw new Error('No authentication token found')
      }

      const params = new URLSearchParams({
        page: '1',
        pageSize: '100',
        ...(searchTerm && { search: searchTerm }),
      })

      const response = await fetch(`/api/enquiry/list?${params}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      })

      if (!response.ok) {
        throw new Error(`Failed to load enquiries: ${response.statusText}`)
      }

      const data = await response.json()
      setEnquiries(data.rows || [])
      setStatistics(data.statistics || null)
      
    } catch (err) {
      console.error('Error loading enquiries:', err)
      setError(err instanceof Error ? err.message : 'Failed to load enquiries')
      toast.error('Failed to load enquiries')
    } finally {
      setLoading(false)
    }
  }

  const handleViewEnquiry = async (enquiryId: number) => {
    try {
      const token = localStorage.getItem('token')
      if (!token) return

      const response = await fetch(`/api/enquiry/${enquiryId}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      })

      if (response.ok) {
        const data = await response.json()
        setSelectedEnquiry(data.enquiry)
        setShowModal(true)
      }
    } catch (err) {
      console.error('Error fetching enquiry:', err)
      toast.error('Failed to load enquiry details')
    }
  }

  const handleDeleteEnquiry = async (enquiryId: number) => {
    if (!confirm('Are you sure you want to delete this enquiry?')) return

    try {
      setActionLoading(enquiryId)
      const token = localStorage.getItem('token')
      if (!token) return

      const response = await fetch(`/api/enquiry/${enquiryId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      })

      if (response.ok) {
        toast.success('Enquiry deleted successfully')
        loadEnquiries()
      } else {
        toast.error('Failed to delete enquiry')
      }
    } catch (err) {
      console.error('Error deleting enquiry:', err)
      toast.error('Failed to delete enquiry')
    } finally {
      setActionLoading(null)
    }
  }

  const formatDate = (date: string | Date) => {
    const d = new Date(date)
    return d.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const formatRelativeTime = (date: string | Date) => {
    const d = new Date(date)
    const now = new Date()
    const diffMs = now.getTime() - d.getTime()
    const diffMins = Math.floor(diffMs / 60000)
    const diffHours = Math.floor(diffMs / 3600000)
    const diffDays = Math.floor(diffMs / 86400000)

    if (diffMins < 1) return 'Just now'
    if (diffMins < 60) return `${diffMins}m ago`
    if (diffHours < 24) return `${diffHours}h ago`
    if (diffDays < 7) return `${diffDays}d ago`
    return formatDate(date)
  }

  if (loading && enquiries.length === 0) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-gray-600">Loading enquiries...</p>
        </div>
      </div>
    )
  }

  if (error && enquiries.length === 0) {
    return (
      <div className="text-center py-12">
        <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-gray-900 mb-2">Error Loading Enquiries</h3>
        <p className="text-gray-600 mb-4">{error}</p>
        <button
          onClick={loadEnquiries}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          Retry
        </button>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Statistics Cards */}
      {statistics && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-gradient-to-br from-blue-500 to-blue-700 text-white rounded-xl p-6 shadow-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium opacity-90">Today</p>
                <p className="text-3xl font-bold mt-1">{statistics.today || 0}</p>
              </div>
              <Calendar className="w-10 h-10 opacity-80" />
            </div>
          </div>
          <div className="bg-gradient-to-br from-green-500 to-green-700 text-white rounded-xl p-6 shadow-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium opacity-90">This Week</p>
                <p className="text-3xl font-bold mt-1">{statistics.thisWeek || 0}</p>
              </div>
              <TrendingUp className="w-10 h-10 opacity-80" />
            </div>
          </div>
          <div className="bg-gradient-to-br from-purple-500 to-purple-700 text-white rounded-xl p-6 shadow-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium opacity-90">Total Enquiries</p>
                <p className="text-3xl font-bold mt-1">{statistics.total || 0}</p>
              </div>
              <Mail className="w-10 h-10 opacity-80" />
            </div>
          </div>
        </div>
      )}

      {/* Search and Filters */}
      <div className="bg-white shadow-md rounded-xl p-6 border border-gray-200">
        <div className="flex flex-col lg:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Search by name, email, subject, or message..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && loadEnquiries()}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>
          <div className="flex gap-3">
            <button
              onClick={loadEnquiries}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center transition-colors shadow-md"
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              Refresh
            </button>
            {searchTerm && (
              <button
                onClick={() => {
                  setSearchTerm('')
                  loadEnquiries()
                }}
                className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 flex items-center transition-colors"
              >
                <X className="w-4 h-4 mr-2" />
                Clear
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Enquiries Table */}
      <div className="bg-white shadow-md rounded-xl overflow-hidden border border-gray-200">
        {enquiries.length === 0 ? (
          <div className="p-12 text-center">
            <Mail className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No Enquiries Found</h3>
            <p className="text-gray-500">
              {searchTerm ? 'Try adjusting your search terms' : 'No enquiries have been submitted yet'}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gradient-to-r from-gray-50 to-gray-100">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Tracking ID</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">From</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Subject</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Message</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Date</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {enquiries.map((enquiry: any, index: number) => (
                  <tr 
                    key={enquiry.id} 
                    className={`hover:bg-blue-50 transition-colors ${index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}`}
                  >
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{enquiry.trackingId}</div>
                      <div className="text-xs text-gray-500">#{enquiry.id}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{enquiry.fullName}</div>
                      <div className="text-xs text-gray-500">{enquiry.email}</div>
                      {enquiry.phone && (
                        <div className="text-xs text-gray-500">{enquiry.phone}</div>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm font-medium text-gray-900 max-w-xs">{enquiry.subject}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-700 max-w-md truncate">{enquiry.message}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{formatDate(enquiry.createdAt)}</div>
                      <div className="text-xs text-gray-500">{formatRelativeTime(enquiry.createdAt)}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleViewEnquiry(enquiry.id)}
                          className="p-2 text-blue-600 hover:bg-blue-100 rounded-lg transition-colors"
                          title="View Details"
                        >
                          <Eye className="w-5 h-5" />
                        </button>
                        <a
                          href={`mailto:${enquiry.email}?subject=Re: ${enquiry.subject}`}
                          className="p-2 text-green-600 hover:bg-green-100 rounded-lg transition-colors"
                          title="Reply via Email"
                        >
                          <Mail className="w-5 h-5" />
                        </a>
                        <button
                          onClick={() => handleDeleteEnquiry(enquiry.id)}
                          disabled={actionLoading === enquiry.id}
                          className="p-2 text-red-600 hover:bg-red-100 rounded-lg transition-colors disabled:opacity-50"
                          title="Delete Enquiry"
                        >
                          {actionLoading === enquiry.id ? (
                            <Loader2 className="w-5 h-5 animate-spin" />
                          ) : (
                            <Trash2 className="w-5 h-5" />
                          )}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Enquiry Detail Modal */}
      {showModal && selectedEnquiry && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
              <h3 className="text-xl font-bold text-gray-900">Enquiry Details</h3>
              <button
                onClick={() => {
                  setShowModal(false)
                  setSelectedEnquiry(null)
                }}
                className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            <div className="p-6 space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-500">Tracking ID</label>
                  <p className="text-lg font-semibold text-gray-900">{selectedEnquiry.trackingId}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Enquiry ID</label>
                  <p className="text-lg font-semibold text-gray-900">#{selectedEnquiry.id}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Full Name</label>
                  <p className="text-base text-gray-900">{selectedEnquiry.fullName}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Email</label>
                  <a href={`mailto:${selectedEnquiry.email}`} className="text-base text-blue-600 hover:underline">
                    {selectedEnquiry.email}
                  </a>
                </div>
                {selectedEnquiry.phone && (
                  <div>
                    <label className="text-sm font-medium text-gray-500">Phone</label>
                    <a href={`tel:${selectedEnquiry.phone}`} className="text-base text-blue-600 hover:underline">
                      {selectedEnquiry.phone}
                    </a>
                  </div>
                )}
                <div>
                  <label className="text-sm font-medium text-gray-500">Date Submitted</label>
                  <p className="text-base text-gray-900">{formatDate(selectedEnquiry.createdAt)}</p>
                </div>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">Subject</label>
                <p className="text-base font-semibold text-gray-900 mt-1">{selectedEnquiry.subject}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">Message</label>
                <div className="mt-2 p-4 bg-gray-50 rounded-lg border border-gray-200">
                  <p className="text-base text-gray-900 whitespace-pre-wrap">{selectedEnquiry.message}</p>
                </div>
              </div>
              <div className="flex gap-3 pt-4 border-t border-gray-200">
                <a
                  href={`mailto:${selectedEnquiry.email}?subject=Re: ${selectedEnquiry.subject}`}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center justify-center transition-colors"
                >
                  <Mail className="w-5 h-5 mr-2" />
                  Reply via Email
                </a>
                <button
                  onClick={() => {
                    setShowModal(false)
                    setSelectedEnquiry(null)
                  }}
                  className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}



