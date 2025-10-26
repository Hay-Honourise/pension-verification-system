"use client"

import React, { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
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
  X
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
        alert('Failed to load pensioner details')
      }
    } catch (error) {
      console.error('Error loading pensioner details:', error)
      alert('Error loading pensioner details')
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
        alert('Pensioner approved successfully!')
        setShowApproveModal(false)
        loadPensioners() // Refresh the list
      } else {
        const error = await response.json()
        alert(error.message || 'Failed to approve pensioner')
      }
    } catch (error) {
      console.error('Error approving pensioner:', error)
      alert('Error approving pensioner')
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
      alert('Please provide a reason for flagging this pensioner')
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
        alert('Pensioner flagged successfully!')
        setShowFlagModal(false)
        loadPensioners() // Refresh the list
      } else {
        const error = await response.json()
        alert(error.message || 'Failed to flag pensioner')
      }
    } catch (error) {
      console.error('Error flagging pensioner:', error)
      alert('Error flagging pensioner')
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
        alert('Pensioner deleted successfully!')
        setShowDeleteModal(false)
        loadPensioners() // Refresh the list
      } else {
        const error = await response.json()
        alert(error.message || 'Failed to delete pensioner')
      }
    } catch (error) {
      console.error('Error deleting pensioner:', error)
      alert('Error deleting pensioner')
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
              <div className="text-2xl mr-3">🧮</div>
              {sidebarOpen && <h1 className="text-xl font-bold">Admin Panel</h1>}
            </div>
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="p-1 rounded-lg hover:bg-white/10 hover:text-oyoOrange transition-colors"
            >
              <div className="w-4 h-4">
                {sidebarOpen ? '←' : '→'}
              </div>
            </button>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-4 py-6 overflow-y-auto">
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
                  className={`w-full flex items-center px-3 py-2 rounded-lg transition-colors ${
                    activePage === item.id 
                      ? 'bg-white/20 text-oyoWhite' 
                      : 'text-oyoWhite hover:bg-white/10 hover:text-oyoOrange'
                  }`}
                >
                  <item.icon className="w-5 h-5 mr-3" />
                  {sidebarOpen && <span>{item.label}</span>}
                </button>
              </li>
            ))}
          </ul>
        </nav>

        {/* Footer - Logout Button */}
        <div className="p-4 border-t border-white/20 flex-shrink-0">
          <button
            onClick={handleLogout}
            className="w-full flex items-center justify-center px-3 py-3 rounded-lg text-oyoWhite bg-red-600 hover:bg-red-700 transition-colors font-medium"
          >
            <LogOut className="w-5 h-5 mr-2" />
            {sidebarOpen && <span>Logout</span>}
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
          {activePage === 'dashboard' && <DashboardOverview metrics={metrics} />}
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
                <div className="space-y-2 text-sm">
                  <div><span className="font-medium">Name:</span> {selectedPensioner.fullName}</div>
                  <div><span className="font-medium">Pension ID:</span> {selectedPensioner.pensionId}</div>
                  <div><span className="font-medium">Email:</span> {selectedPensioner.email}</div>
                  <div><span className="font-medium">Phone:</span> {selectedPensioner.phone}</div>
                  <div><span className="font-medium">NIN:</span> {selectedPensioner.nin}</div>
                  <div><span className="font-medium">Gender:</span> {selectedPensioner.gender}</div>
                  <div><span className="font-medium">Date of Birth:</span> {new Date(selectedPensioner.dateOfBirth).toLocaleDateString()}</div>
                </div>
              </div>

              {/* Employment Information */}
              <div className="space-y-4">
                <h4 className="font-semibold text-gray-800">Employment Information</h4>
                <div className="space-y-2 text-sm">
                  <div><span className="font-medium">Scheme Type:</span> {selectedPensioner.pensionSchemeType}</div>
                  <div><span className="font-medium">Current Level:</span> {selectedPensioner.currentLevel}</div>
                  <div><span className="font-medium">PF Number:</span> {selectedPensioner.pfNumber}</div>
                  <div><span className="font-medium">First Appointment:</span> {new Date(selectedPensioner.dateOfFirstAppointment).toLocaleDateString()}</div>
                  <div><span className="font-medium">Retirement Date:</span> {new Date(selectedPensioner.dateOfRetirement).toLocaleDateString()}</div>
                  <div><span className="font-medium">Last Salary:</span> ₦{selectedPensioner.salary?.toLocaleString()}</div>
                </div>
              </div>

              {/* Pension Benefits */}
              <div className="space-y-4">
                <h4 className="font-semibold text-gray-800">Pension Benefits</h4>
                <div className="space-y-2 text-sm">
                  <div><span className="font-medium">Years of Service:</span> {selectedPensioner.yearsOfService || 'N/A'}</div>
                  <div><span className="font-medium">Gratuity Rate:</span> {selectedPensioner.gratuityRate ? `${(selectedPensioner.gratuityRate * 100).toFixed(1)}%` : 'N/A'}</div>
                  <div><span className="font-medium">Pension Rate:</span> {selectedPensioner.pensionRate ? `${(selectedPensioner.pensionRate * 100).toFixed(1)}%` : 'N/A'}</div>
                  <div><span className="font-medium">Total Gratuity:</span> ₦{selectedPensioner.totalGratuity?.toLocaleString() || 'N/A'}</div>
                  <div><span className="font-medium">Monthly Pension:</span> ₦{selectedPensioner.monthlyPension?.toLocaleString() || 'N/A'}</div>
                </div>
              </div>

              {/* Status */}
              <div className="space-y-4">
                <h4 className="font-semibold text-gray-800">Status</h4>
                <div className="space-y-2 text-sm">
                  <div><span className="font-medium">Status:</span> 
                    <span className={`ml-2 px-2 py-1 rounded-full text-xs ${
                      selectedPensioner.status === 'VERIFIED' ? 'bg-green-100 text-green-800' :
                      selectedPensioner.status === 'PENDING_VERIFICATION' ? 'bg-yellow-100 text-yellow-800' :
                      selectedPensioner.status === 'FLAGGED' ? 'bg-red-100 text-red-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {selectedPensioner.status}
                    </span>
                  </div>
                  <div><span className="font-medium">Created:</span> {new Date(selectedPensioner.createdAt).toLocaleDateString()}</div>
                  <div><span className="font-medium">Updated:</span> {new Date(selectedPensioner.updatedAt).toLocaleDateString()}</div>
                </div>
              </div>
            </div>

            {/* Documents */}
            {selectedPensioner.pensionerfile && selectedPensioner.pensionerfile.length > 0 && (
              <div className="mt-6">
                <h4 className="font-semibold text-gray-800 mb-4">Documents</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {selectedPensioner.pensionerfile.map((file: any) => (
                    <div key={file.id} className="border rounded-lg p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="font-medium text-sm">{file.fileType}</div>
                          <div className="text-xs text-gray-500">{file.originalName}</div>
                          <div className="text-xs text-gray-500">{new Date(file.createdAt).toLocaleDateString()}</div>
                        </div>
                        <a
                          href={file.fileUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:text-blue-800"
                        >
                          <Download className="w-4 h-4" />
                        </a>
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
function DashboardOverview({ metrics }: { metrics: any }) {
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

      {/* Chart Section */}
      <div className="bg-white shadow-md rounded-xl p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">Pensioners Verified per Month</h3>
          <TrendingUp className="w-5 h-5 text-gray-400" />
        </div>
        <div className="h-64 bg-gray-50 rounded-lg flex items-center justify-center">
          <div className="text-center">
            <BarChart3 className="w-12 h-12 text-gray-400 mx-auto mb-2" />
            <p className="text-gray-500">Chart visualization will be implemented here</p>
          </div>
        </div>
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
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{pensioner.name}</td>
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
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">{pensioner.lastLogin}</td>
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
function NotificationsPanel({ notifications }: { notifications: any[] }) {
  return (
    <div className="space-y-4">
      {notifications.map((notification) => (
        <div
          key={notification.id}
          className={`bg-white shadow-sm rounded-md p-4 ${
            !notification.read ? 'border-l-4 border-green-500' : ''
          }`}
        >
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <p className="text-sm text-gray-900">{notification.message}</p>
              <p className="text-xs text-gray-500 mt-1">{notification.timestamp}</p>
            </div>
            <div className="flex space-x-2 ml-4">
              {!notification.read && (
                <button className="text-green-600 hover:text-green-800">
                  <CheckCircle className="w-4 h-4" />
                </button>
              )}
              <button className="text-red-600 hover:text-red-800">
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}

// Reports Section Component
function ReportsSection() {
  return (
    <div className="space-y-6">
      {/* Report Filters */}
      <div className="bg-white shadow-md rounded-xl p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Generate Reports</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Start Date</label>
            <input
              type="date"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">End Date</label>
            <input
              type="date"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Report Type</label>
            <select className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500">
              <option>Monthly Verification Summary</option>
              <option>Flagged Pensioners List</option>
              <option>Total Pensioners by Department</option>
              <option>System Activity Logs</option>
            </select>
          </div>
        </div>
        <div className="mt-6 flex space-x-4">
          <button className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center">
            <Download className="w-4 h-4 mr-2" />
            Export PDF
          </button>
          <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center">
            <FileText className="w-4 h-4 mr-2" />
            Export CSV
          </button>
        </div>
      </div>

      {/* Report Preview */}
      <div className="bg-white shadow-md rounded-xl p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Report Preview</h3>
        <div className="h-64 bg-gray-50 rounded-lg flex items-center justify-center">
          <div className="text-center">
            <BarChart3 className="w-12 h-12 text-gray-400 mx-auto mb-2" />
            <p className="text-gray-500">Report preview will appear here</p>
          </div>
        </div>
      </div>
    </div>
  )
}

// Settings Section Component
function SettingsSection({ user }: { user: any }) {
  const [settings, setSettings] = useState({
    systemName: 'Computerised Pension Verification System',
    verificationInterval: 3,
    fingerprintVerification: true,
    email: user?.email || '',
    phone: user?.phone || '',
    address: user?.address || ''
  })

  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  })

  const handleSaveSettings = () => {
    // Save settings logic
    console.log('Saving settings:', settings)
  }

  const handleChangePassword = () => {
    // Change password logic
    console.log('Changing password:', passwordForm)
  }

  return (
    <div className="space-y-6">
      {/* System Settings */}
      <div className="bg-white shadow-md rounded-xl p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-6">System Configuration</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">System Name</label>
            <input
              type="text"
              value={settings.systemName}
              onChange={(e) => setSettings({...settings, systemName: e.target.value})}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Verification Interval (years)</label>
            <input
              type="number"
              value={settings.verificationInterval}
              onChange={(e) => setSettings({...settings, verificationInterval: parseInt(e.target.value)})}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div className="md:col-span-2">
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={settings.fingerprintVerification}
                onChange={(e) => setSettings({...settings, fingerprintVerification: e.target.checked})}
                className="mr-2"
              />
              <span className="text-sm font-medium text-gray-700">Enable Fingerprint Verification</span>
            </label>
          </div>
        </div>
        <button
          onClick={handleSaveSettings}
          className="mt-6 px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
        >
          Save Changes
        </button>
      </div>

      {/* Admin Profile Settings */}
      <div className="bg-white shadow-md rounded-xl p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-6">Admin Profile</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Email Address</label>
            <input
              type="email"
              value={settings.email}
              onChange={(e) => setSettings({...settings, email: e.target.value})}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Phone Number</label>
            <input
              type="tel"
              value={settings.phone}
              onChange={(e) => setSettings({...settings, phone: e.target.value})}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-2">Address</label>
            <textarea
              value={settings.address}
              onChange={(e) => setSettings({...settings, address: e.target.value})}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>
      </div>

      {/* Change Password */}
      <div className="bg-white shadow-md rounded-xl p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-6">Change Password</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Current Password</label>
            <input
              type="password"
              value={passwordForm.currentPassword}
              onChange={(e) => setPasswordForm({...passwordForm, currentPassword: e.target.value})}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">New Password</label>
            <input
              type="password"
              value={passwordForm.newPassword}
              onChange={(e) => setPasswordForm({...passwordForm, newPassword: e.target.value})}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Confirm Password</label>
            <input
              type="password"
              value={passwordForm.confirmPassword}
              onChange={(e) => setPasswordForm({...passwordForm, confirmPassword: e.target.value})}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>
        <button
          onClick={handleChangePassword}
          className="mt-6 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          Change Password
        </button>
      </div>
    </div>
  )
}

// Enquiries Management Component
function EnquiriesManagement() {
  const [enquiries, setEnquiries] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')

  useEffect(() => {
    loadEnquiries()
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
        pageSize: '50',
        ...(searchTerm && { subject: searchTerm }),
        ...(statusFilter !== 'all' && { status: statusFilter })
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
      
    } catch (err) {
      console.error('Error loading enquiries:', err)
      setError(err instanceof Error ? err.message : 'Failed to load enquiries')
    } finally {
      setLoading(false)
    }
  }

  const handleStatusUpdate = async (enquiryId: number, newStatus: string) => {
    try {
      const token = localStorage.getItem('token')
      if (!token) return

      const response = await fetch(`/api/enquiry/${enquiryId}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ status: newStatus })
      })

      if (response.ok) {
        loadEnquiries() // Reload enquiries
      }
    } catch (err) {
      console.error('Error updating enquiry status:', err)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <div className="text-red-600 text-6xl mb-4">⚠️</div>
        <h3 className="text-lg font-semibold text-gray-900 mb-2">Error Loading Enquiries</h3>
        <p className="text-gray-600 mb-4">{error}</p>
        <button
          onClick={loadEnquiries}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          Retry
        </button>
      </div>
    )
  }

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
                placeholder="Search enquiries..."
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
              <option value="PENDING">Pending</option>
              <option value="RESOLVED">Resolved</option>
              <option value="CLOSED">Closed</option>
            </select>
            <button
              onClick={loadEnquiries}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center"
            >
              <Search className="w-4 h-4 mr-2" />
              Search
            </button>
          </div>
        </div>
      </div>

      {/* Enquiries Table */}
      <div className="bg-white shadow-md rounded-xl overflow-hidden">
        {enquiries.length === 0 ? (
          <div className="p-8 text-center">
            <Mail className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500">No enquiries found</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ID</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Subject</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Message</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {enquiries.map((enquiry: any, index: number) => (
                  <tr key={enquiry.id} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{enquiry.id}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{enquiry.subject}</td>
                    <td className="px-6 py-4 text-sm text-gray-700 max-w-xs truncate">{enquiry.message}</td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        enquiry.status === 'RESOLVED' 
                          ? 'bg-green-100 text-green-800' 
                          : enquiry.status === 'PENDING'
                          ? 'bg-yellow-100 text-yellow-800'
                          : 'bg-gray-100 text-gray-800'
                      }`}>
                        {enquiry.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                      {new Date(enquiry.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex space-x-2">
                        <button 
                          onClick={() => handleStatusUpdate(enquiry.id, 'RESOLVED')}
                          className="text-green-600 hover:text-green-900" 
                          title="Mark as Resolved"
                        >
                          <CheckCircle className="w-4 h-4" />
                        </button>
                        <button 
                          onClick={() => handleStatusUpdate(enquiry.id, 'CLOSED')}
                          className="text-gray-600 hover:text-gray-900" 
                          title="Close Enquiry"
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



