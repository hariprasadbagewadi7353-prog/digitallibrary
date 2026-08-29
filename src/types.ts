export type UserRole = 'ADMIN' | 'LIBRARIAN';

export interface User {
  id: string;
  name: string;
  username: string;
  email: string;
  role: UserRole;
  is_active: boolean;
  created_at: string;
}

export type MemberStatus = 'ACTIVE' | 'INACTIVE' | 'SUSPENDED';

export interface Member {
  id: string;
  student_name: string;
  registration_number: string;
  father_name?: string;
  village: string;
  taluk?: string;
  district?: string;
  pincode: string;
  mobile: string;
  email?: string;
  aadhaar_masked?: string;
  caste_category?: string;
  education_qualification?: string;
  photo_path?: string;
  registration_date: string;
  status: MemberStatus;
  notes?: string;
  created_at: string;
  updated_at: string;
}

export type BookStatus = 'AVAILABLE' | 'ISSUED' | 'LOST' | 'DAMAGED' | 'ARCHIVED';

export interface Category {
  id: string;
  name: string;
  code: string;
  description?: string;
  created_at: string;
  book_count?: number;
}

export interface Book {
  id: string;
  book_number: string;
  title?: string;
  book_name?: string; // alias
  author: string;
  publisher?: string;
  category_id: string;
  category_name?: string;
  language: string;
  publication_year?: number | string;
  isbn?: string;
  shelf_location?: string;
  description?: string;
  cover_image_url?: string;
  cover_path?: string;
  digital_file_url?: string;
  digital_file_path?: string;
  status: BookStatus;
  created_at: string;
  updated_at: string;
  current_transaction?: Transaction;
}

export type TransactionStatus = 'ISSUED' | 'RETURNED' | 'OVERDUE';

export interface Transaction {
  id: string;
  member_id: string;
  book_id: string;
  issue_date: string;
  due_date?: string;
  expected_return_date?: string; // alias
  return_date?: string | null;
  actual_return_date?: string | null; // alias
  status: TransactionStatus;
  fine_amount?: number;
  issued_by?: string;
  issued_by_name?: string;
  returned_by?: string;
  remarks?: string;
  created_at: string;
  updated_at: string;
  // Joined fields
  member_name?: string;
  student_name?: string;
  member_reg_number?: string;
  registration_number?: string;
  member_mobile?: string;
  member_village?: string;
  book_number?: string;
  book_title?: string;
  book_name?: string;
  book_category?: string;
  days_overdue?: number;
}

export type DocumentType = 'MEMBER_RECORD' | 'BOOK_RECORD' | 'GENERAL_DOCUMENT';

export interface OCRScan {
  id: string;
  uploaded_file?: string;
  ocr_text: string;
  document_type: DocumentType;
  created_by: string;
  verified: boolean;
  extracted_data?: Record<string, string>;
  created_at: string;
}

export interface AuditLog {
  id: string;
  user_id: string;
  user_name?: string;
  action: string;
  entity_type: string;
  entity_id: string;
  description?: string;
  details?: string;
  created_at: string;
}

export interface LibrarySettings {
  library_name: string;
  department_name: string;
  district_taluk: string;
  address: string;
  contact_email: string;
  contact_phone: string;
  default_loan_days: number;
  max_books_per_member: number;
  fine_per_day: number;
  allow_digital_downloads: boolean;
}

export interface ExtractedMemberData {
  student_name?: string;
  father_name?: string;
  registration_number?: string;
  village?: string;
  taluk?: string;
  district?: string;
  pincode?: string;
  mobile?: string;
  email?: string;
  caste_category?: string;
  education_qualification?: string;
  registration_date?: string;
  confidence?: Record<string, number>;
  raw_text?: string;
}

export interface ExtractedBookData {
  book_number?: string;
  book_name?: string;
  author?: string;
  publisher?: string;
  category?: string;
  language?: string;
  publication_year?: number | string;
  isbn?: string;
  description?: string;
  confidence?: Record<string, number>;
  raw_text?: string;
}

export interface DashboardData {
  stats: {
    total_members: number;
    total_books: number;
    available_books: number;
    issued_books: number;
    overdue_books: number;
    total_transactions: number;
    recent_books_30_days: number;
    recent_members_30_days: number;
    books_added_recently?: number;
    members_registered_recently?: number;
  };
  category_breakdown?: Array<{
    category_name?: string;
    name?: string;
    count: number;
    available?: number;
    issued?: number;
  }>;
  circulation_trend?: Array<{
    month?: string;
    date?: string;
    issues: number;
    returns: number;
    new_members?: number;
  }>;
  charts?: {
    circulation_trend?: any[];
    category_distribution?: any[];
    book_status_distribution?: any[];
  };
  recent_issues: Transaction[];
  recent_returns: Transaction[];
  urgent_overdue?: Transaction[];
  urgent_overdues?: Transaction[];
}
