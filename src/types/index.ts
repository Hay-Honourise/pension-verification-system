export interface Admin {
  id: string;
  email: string;
  name: string;
  role: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Pensioner {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phoneNumber: string;
  pensionNumber: string;
  dateOfBirth: Date;
  dateOfRetirement: Date;
  department: string;
  verificationStatus: 'pending' | 'verified' | 'rejected';
  documents: Document[];
  createdAt: Date;
  updatedAt: Date;
}

export interface Document {
  id: string;
  pensionerId: string;
  documentType: string;
  fileName: string;
  filePath: string;
  uploadedAt: Date;
  verifiedAt?: Date;
  status: 'pending' | 'verified' | 'rejected';
}

export interface LoginFormData {
  email: string;
  password: string;
}

export interface AuthContextType {
  user: Admin | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  isLoading: boolean;
}
