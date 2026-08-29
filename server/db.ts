import fs from 'fs';
import path from 'path';
import {
  User,
  Member,
  Book,
  Category,
  Transaction,
  OCRScan,
  AuditLog,
  LibrarySettings,
  DashboardData,
  ExtractedMemberData,
  ExtractedBookData
} from '../src/types';
import {
  INITIAL_SETTINGS,
  INITIAL_USERS,
  INITIAL_CATEGORIES,
  INITIAL_MEMBERS,
  INITIAL_BOOKS,
  INITIAL_TRANSACTIONS,
  INITIAL_AUDIT_LOGS
} from './seedData';

const DATA_DIR = path.join(process.cwd(), 'data');
const DB_FILE = path.join(DATA_DIR, 'library_db.json');

export interface DatabaseSchema {
  settings: LibrarySettings;
  users: (User & { password_hash: string })[];
  members: Member[];
  categories: Category[];
  books: Book[];
  transactions: Transaction[];
  ocr_scans: OCRScan[];
  audit_logs: AuditLog[];
}

class LibraryDatabase {
  private data: DatabaseSchema;
  private isLoaded = false;

  constructor() {
    this.data = {
      settings: INITIAL_SETTINGS,
      users: INITIAL_USERS,
      members: INITIAL_MEMBERS,
      categories: INITIAL_CATEGORIES,
      books: INITIAL_BOOKS,
      transactions: INITIAL_TRANSACTIONS,
      ocr_scans: [],
      audit_logs: INITIAL_AUDIT_LOGS
    };
    this.init();
  }

  private init() {
    try {
      if (!fs.existsSync(DATA_DIR)) {
        fs.mkdirSync(DATA_DIR, { recursive: true });
      }

      if (fs.existsSync(DB_FILE)) {
        const raw = fs.readFileSync(DB_FILE, 'utf-8');
        const parsed = JSON.parse(raw);
        this.data = {
          settings: { ...INITIAL_SETTINGS, ...parsed.settings },
          users: parsed.users || INITIAL_USERS,
          members: parsed.members || INITIAL_MEMBERS,
          categories: parsed.categories || INITIAL_CATEGORIES,
          books: parsed.books || INITIAL_BOOKS,
          transactions: parsed.transactions || INITIAL_TRANSACTIONS,
          ocr_scans: parsed.ocr_scans || [],
          audit_logs: parsed.audit_logs || INITIAL_AUDIT_LOGS,
        };
      } else {
        this.persist();
      }
      this.isLoaded = true;
    } catch (err) {
      console.error('Error initializing database file, using in-memory with seeds:', err);
      this.isLoaded = true;
    }
  }

  private persist() {
    try {
      if (!fs.existsSync(DATA_DIR)) {
        fs.mkdirSync(DATA_DIR, { recursive: true });
      }
      fs.writeFileSync(DB_FILE, JSON.stringify(this.data, null, 2), 'utf-8');
    } catch (err) {
      console.error('Failed to persist database:', err);
    }
  }

  // AUDIT LOG HELPER
  public addAuditLog(userId: string, userName: string, action: string, entityType: string, entityId: string, description: string) {
    const log: AuditLog = {
      id: `log-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      user_id: userId,
      user_name: userName,
      action,
      entity_type: entityType,
      entity_id: entityId,
      description,
      created_at: new Date().toISOString(),
    };
    this.data.audit_logs.unshift(log);
    // Keep last 500 logs
    if (this.data.audit_logs.length > 500) {
      this.data.audit_logs = this.data.audit_logs.slice(0, 500);
    }
    this.persist();
    return log;
  }

  public getAuditLogs(limit = 50): AuditLog[] {
    return this.data.audit_logs.slice(0, limit);
  }

  // SETTINGS
  public getSettings(): LibrarySettings {
    return this.data.settings;
  }

  public updateSettings(settings: Partial<LibrarySettings>, user: { id: string; name: string }): LibrarySettings {
    this.data.settings = { ...this.data.settings, ...settings };
    this.addAuditLog(user.id, user.name, 'SETTINGS_UPDATED', 'SETTINGS', 'CONFIG', 'Updated library system parameters and policies.');
    this.persist();
    return this.data.settings;
  }

  // USERS
  public getUsers(): User[] {
    return this.data.users.map(({ password_hash, ...u }) => u);
  }

  public getUserByUsername(username: string) {
    return this.data.users.find(u => u.username.toLowerCase() === username.toLowerCase() || u.email.toLowerCase() === username.toLowerCase());
  }

  public getUserById(id: string) {
    return this.data.users.find(u => u.id === id);
  }

  public createUser(userData: { name: string; username: string; email: string; password_hash: string; role: 'ADMIN' | 'LIBRARIAN' }, adminUser: { id: string; name: string }) {
    if (this.data.users.some(u => u.username.toLowerCase() === userData.username.toLowerCase())) {
      throw new Error(`Username '${userData.username}' is already in use.`);
    }
    if (this.data.users.some(u => u.email.toLowerCase() === userData.email.toLowerCase())) {
      throw new Error(`Email '${userData.email}' is already registered.`);
    }
    const newUser = {
      id: `usr-${Date.now()}`,
      name: userData.name,
      username: userData.username,
      email: userData.email,
      role: userData.role,
      is_active: true,
      password_hash: userData.password_hash,
      created_at: new Date().toISOString()
    };
    this.data.users.push(newUser);
    this.addAuditLog(adminUser.id, adminUser.name, 'USER_CREATED', 'USER', newUser.id, `Created ${newUser.role} user account: ${newUser.username} (${newUser.name})`);
    this.persist();
    const { password_hash, ...safeUser } = newUser;
    return safeUser;
  }

  public updateUser(id: string, update: Partial<{ name: string; email: string; role: 'ADMIN' | 'LIBRARIAN'; is_active: boolean; password_hash: string }>, adminUser: { id: string; name: string }) {
    const userIndex = this.data.users.findIndex(u => u.id === id);
    if (userIndex === -1) throw new Error('User not found');
    const existing = this.data.users[userIndex];
    if (update.email && update.email !== existing.email) {
      if (this.data.users.some(u => u.id !== id && u.email.toLowerCase() === update.email!.toLowerCase())) {
        throw new Error(`Email '${update.email}' is already in use by another user.`);
      }
    }
    this.data.users[userIndex] = { ...existing, ...update };
    this.addAuditLog(adminUser.id, adminUser.name, 'USER_UPDATED', 'USER', id, `Updated account settings for user: ${existing.username}`);
    this.persist();
    const { password_hash, ...safeUser } = this.data.users[userIndex];
    return safeUser;
  }

  // CATEGORIES
  public getCategories(): (Category & { book_count: number })[] {
    return this.data.categories.map(c => {
      const book_count = this.data.books.filter(b => b.category_id === c.id).length;
      return { ...c, book_count };
    });
  }

  public getCategoryById(id: string) {
    return this.data.categories.find(c => c.id === id);
  }

  public createCategory(catData: { name: string; code: string; description?: string }, user: { id: string; name: string }) {
    if (this.data.categories.some(c => c.name.toLowerCase() === catData.name.toLowerCase())) {
      throw new Error(`Category with name '${catData.name}' already exists.`);
    }
    const newCat: Category = {
      id: `cat-${Date.now()}`,
      name: catData.name,
      code: catData.code.toUpperCase().replace(/\s+/g, '-'),
      description: catData.description || '',
      created_at: new Date().toISOString()
    };
    this.data.categories.push(newCat);
    this.addAuditLog(user.id, user.name, 'CATEGORY_CREATED', 'CATEGORY', newCat.id, `Added library catalog category: ${newCat.name}`);
    this.persist();
    return newCat;
  }

  public updateCategory(id: string, catData: Partial<{ name: string; code: string; description: string }>, user: { id: string; name: string }) {
    const index = this.data.categories.findIndex(c => c.id === id);
    if (index === -1) throw new Error('Category not found');
    this.data.categories[index] = { ...this.data.categories[index], ...catData };
    this.addAuditLog(user.id, user.name, 'CATEGORY_UPDATED', 'CATEGORY', id, `Updated category ${this.data.categories[index].name}`);
    this.persist();
    return this.data.categories[index];
  }

  public deleteCategory(id: string, user: { id: string; name: string }) {
    const booksWithCategory = this.data.books.filter(b => b.category_id === id);
    if (booksWithCategory.length > 0) {
      throw new Error(`Cannot delete category: ${booksWithCategory.length} books are currently assigned to this category.`);
    }
    const cat = this.data.categories.find(c => c.id === id);
    this.data.categories = this.data.categories.filter(c => c.id !== id);
    this.addAuditLog(user.id, user.name, 'CATEGORY_DELETED', 'CATEGORY', id, `Deleted category: ${cat?.name || id}`);
    this.persist();
    return true;
  }

  // MEMBERS
  public getMembers(params: { search?: string; status?: string; village?: string; page?: number; limit?: number }) {
    let list = [...this.data.members];

    if (params.search) {
      const q = params.search.toLowerCase().trim();
      list = list.filter(m =>
        m.student_name.toLowerCase().includes(q) ||
        m.registration_number.toLowerCase().includes(q) ||
        m.village.toLowerCase().includes(q) ||
        m.mobile.includes(q) ||
        m.email.toLowerCase().includes(q) ||
        m.pincode.includes(q)
      );
    }

    if (params.status && params.status !== 'ALL') {
      list = list.filter(m => m.status === params.status);
    }

    if (params.village && params.village !== 'ALL') {
      list = list.filter(m => m.village.toLowerCase() === params.village!.toLowerCase());
    }

    // Sort newest first
    list.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

    const total = list.length;
    const page = Number(params.page) || 1;
    const limit = Number(params.limit) || 10;
    const startIndex = (page - 1) * limit;
    const members = list.slice(startIndex, startIndex + limit);

    return {
      members,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit) || 1,
      }
    };
  }

  public getMemberById(id: string) {
    const member = this.data.members.find(m => m.id === id || m.registration_number.toLowerCase() === id.toLowerCase());
    if (!member) return null;

    // Get all transactions for this member
    const transactions = this.getTransactions({ member_id: member.id }).transactions;
    const active_loans = transactions.filter(t => t.status === 'ISSUED' || t.status === 'OVERDUE');
    const returned_loans = transactions.filter(t => t.status === 'RETURNED');
    const overdue_loans = active_loans.filter(t => t.status === 'OVERDUE' || (t.days_overdue && t.days_overdue > 0));

    return {
      ...member,
      stats: {
        total_borrowed: transactions.length,
        currently_issued: active_loans.length,
        returned_books: returned_loans.length,
        overdue_books: overdue_loans.length,
      },
      current_issued_books: active_loans,
      transaction_history: transactions,
    };
  }

  public createMember(memberData: Omit<Member, 'id' | 'created_at' | 'updated_at'>, user: { id: string; name: string }) {
    // Validation
    const regNo = memberData.registration_number.trim();
    if (!regNo) throw new Error('Registration number is required.');

    if (this.data.members.some(m => m.registration_number.toLowerCase() === regNo.toLowerCase())) {
      throw new Error(`Registration Number '${regNo}' is already registered to another member.`);
    }

    if (!memberData.student_name.trim()) throw new Error('Student name is required.');
    if (!memberData.village.trim()) throw new Error('Village / Town name is required.');

    // Validate pincode (6 digits)
    if (memberData.pincode && !/^\d{6}$/.test(memberData.pincode.trim())) {
      throw new Error('Pincode must be a 6-digit number (e.g. 591307).');
    }

    // Validate mobile (10 digits)
    if (memberData.mobile && !/^\d{10}$/.test(memberData.mobile.replace(/\D/g, ''))) {
      throw new Error('Mobile number must be a valid 10-digit phone number.');
    }

    const newMember: Member = {
      id: `mem-${Date.now()}`,
      student_name: memberData.student_name.trim(),
      registration_number: regNo,
      village: memberData.village.trim(),
      pincode: memberData.pincode ? memberData.pincode.trim() : '591307',
      mobile: memberData.mobile.replace(/\D/g, ''),
      email: memberData.email.trim(),
      registration_date: memberData.registration_date || new Date().toISOString().split('T')[0],
      status: memberData.status || 'ACTIVE',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    this.data.members.push(newMember);
    this.addAuditLog(user.id, user.name, 'MEMBER_REGISTERED', 'MEMBER', newMember.id, `Registered new library member: ${newMember.student_name} (${newMember.registration_number}) from ${newMember.village}`);
    this.persist();
    return newMember;
  }

  public updateMember(id: string, updateData: Partial<Member>, user: { id: string; name: string }) {
    const index = this.data.members.findIndex(m => m.id === id);
    if (index === -1) throw new Error('Member not found');
    const existing = this.data.members[index];

    if (updateData.registration_number && updateData.registration_number !== existing.registration_number) {
      if (this.data.members.some(m => m.id !== id && m.registration_number.toLowerCase() === updateData.registration_number!.toLowerCase())) {
        throw new Error(`Registration Number '${updateData.registration_number}' is already registered to another member.`);
      }
    }

    if (updateData.pincode && !/^\d{6}$/.test(updateData.pincode.trim())) {
      throw new Error('Pincode must be a 6-digit number.');
    }

    this.data.members[index] = {
      ...existing,
      ...updateData,
      updated_at: new Date().toISOString()
    };

    this.addAuditLog(user.id, user.name, 'MEMBER_UPDATED', 'MEMBER', id, `Updated member profile for: ${existing.student_name} (${existing.registration_number})`);
    this.persist();
    return this.data.members[index];
  }

  public deleteMember(id: string, user: { id: string; name: string }) {
    const member = this.data.members.find(m => m.id === id);
    if (!member) throw new Error('Member not found');

    // Check if member has active loans
    const activeLoans = this.data.transactions.filter(t => t.member_id === id && (t.status === 'ISSUED' || t.status === 'OVERDUE'));
    if (activeLoans.length > 0) {
      throw new Error(`Cannot delete member: '${member.student_name}' currently has ${activeLoans.length} unreturned book(s). Please return the books first.`);
    }

    this.data.members = this.data.members.filter(m => m.id !== id);
    this.addAuditLog(user.id, user.name, 'MEMBER_DELETED', 'MEMBER', id, `Deleted member record: ${member.student_name} (${member.registration_number})`);
    this.persist();
    return true;
  }

  public getNextMemberNumber(): string {
    const year = new Date().getFullYear();
    const count = this.data.members.length + 1;
    return `LIB-${year}-${String(count).padStart(5, '0')}`;
  }

  // BOOKS
  public getBooks(params: {
    search?: string;
    category_id?: string;
    status?: string;
    language?: string;
    sort_by?: 'date_added' | 'book_name' | 'book_number' | 'publication_year';
    sort_order?: 'asc' | 'desc';
    page?: number;
    limit?: number;
  }) {
    let list = [...this.data.books];

    if (params.search) {
      const q = params.search.toLowerCase().trim();
      list = list.filter(b =>
        b.book_name.toLowerCase().includes(q) ||
        b.book_number.toLowerCase().includes(q) ||
        b.author.toLowerCase().includes(q) ||
        b.publisher.toLowerCase().includes(q) ||
        (b.isbn && b.isbn.toLowerCase().includes(q)) ||
        (b.description && b.description.toLowerCase().includes(q))
      );
    }

    if (params.category_id && params.category_id !== 'ALL') {
      list = list.filter(b => b.category_id === params.category_id);
    }

    if (params.status && params.status !== 'ALL') {
      list = list.filter(b => b.status === params.status);
    }

    if (params.language && params.language !== 'ALL') {
      list = list.filter(b => b.language.toLowerCase() === params.language!.toLowerCase());
    }

    // Attach category names
    const enriched = list.map(b => {
      const cat = this.data.categories.find(c => c.id === b.category_id);
      return {
        ...b,
        category_name: cat ? cat.name : 'General'
      };
    });

    // Sorting
    const sortField = params.sort_by || 'date_added';
    const isAsc = params.sort_order === 'asc';

    enriched.sort((a, b) => {
      let valA: string | number = a.created_at;
      let valB: string | number = b.created_at;

      if (sortField === 'book_name') {
        valA = a.book_name.toLowerCase();
        valB = b.book_name.toLowerCase();
      } else if (sortField === 'book_number') {
        valA = a.book_number.toLowerCase();
        valB = b.book_number.toLowerCase();
      } else if (sortField === 'publication_year') {
        valA = Number(a.publication_year) || 0;
        valB = Number(b.publication_year) || 0;
      }

      if (valA < valB) return isAsc ? -1 : 1;
      if (valA > valB) return isAsc ? 1 : -1;
      return 0;
    });

    const total = enriched.length;
    const page = Number(params.page) || 1;
    const limit = Number(params.limit) || 12;
    const startIndex = (page - 1) * limit;
    const books = enriched.slice(startIndex, startIndex + limit);

    return {
      books,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit) || 1,
      }
    };
  }

  public getBookById(id: string) {
    const book = this.data.books.find(b => b.id === id || b.book_number.toLowerCase() === id.toLowerCase());
    if (!book) return null;

    const cat = this.data.categories.find(c => c.id === book.category_id);
    const transactions = this.getTransactions({ book_id: book.id }).transactions;
    const activeTransaction = transactions.find(t => t.status === 'ISSUED' || t.status === 'OVERDUE');

    let currentBorrower = null;
    if (activeTransaction) {
      const member = this.data.members.find(m => m.id === activeTransaction.member_id);
      currentBorrower = member ? {
        ...member,
        issue_date: activeTransaction.issue_date,
        expected_return_date: activeTransaction.expected_return_date,
        days_overdue: activeTransaction.days_overdue || 0,
        transaction_id: activeTransaction.id,
      } : null;
    }

    return {
      ...book,
      category_name: cat ? cat.name : 'General',
      current_borrower: currentBorrower,
      transaction_history: transactions,
    };
  }

  public createBook(bookData: Omit<Book, 'id' | 'created_at' | 'updated_at'>, user: { id: string; name: string }) {
    const bookNum = bookData.book_number.trim();
    if (!bookNum) throw new Error('Book number is required.');

    if (this.data.books.some(b => b.book_number.toLowerCase() === bookNum.toLowerCase())) {
      throw new Error(`Book Number '${bookNum}' already exists in catalog.`);
    }

    if (!bookData.book_name.trim()) throw new Error('Book title is required.');
    if (!bookData.author.trim()) throw new Error('Author name is required.');

    const newBook: Book = {
      id: `bk-${Date.now()}`,
      book_number: bookNum,
      book_name: bookData.book_name.trim(),
      author: bookData.author.trim(),
      publisher: bookData.publisher ? bookData.publisher.trim() : 'Government Library Press',
      category_id: bookData.category_id || (this.data.categories[0]?.id || 'cat-01'),
      language: bookData.language || 'English',
      publication_year: bookData.publication_year || new Date().getFullYear(),
      isbn: bookData.isbn ? bookData.isbn.trim() : '',
      description: bookData.description ? bookData.description.trim() : '',
      cover_path: bookData.cover_path || 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&q=80&w=600',
      digital_file_path: bookData.digital_file_path || '',
      status: bookData.status || 'AVAILABLE',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    this.data.books.push(newBook);
    this.addAuditLog(user.id, user.name, 'BOOK_CATALOGED', 'BOOK', newBook.id, `Cataloged new book: ${newBook.book_name} (${newBook.book_number}) by ${newBook.author}`);
    this.persist();
    return newBook;
  }

  public updateBook(id: string, updateData: Partial<Book>, user: { id: string; name: string }) {
    const index = this.data.books.findIndex(b => b.id === id);
    if (index === -1) throw new Error('Book not found');
    const existing = this.data.books[index];

    if (updateData.book_number && updateData.book_number !== existing.book_number) {
      if (this.data.books.some(b => b.id !== id && b.book_number.toLowerCase() === updateData.book_number!.toLowerCase())) {
        throw new Error(`Book Number '${updateData.book_number}' already exists in catalog.`);
      }
    }

    this.data.books[index] = {
      ...existing,
      ...updateData,
      updated_at: new Date().toISOString()
    };

    this.addAuditLog(user.id, user.name, 'BOOK_UPDATED', 'BOOK', id, `Updated catalog entry for: ${existing.book_name} (${existing.book_number})`);
    this.persist();
    return this.data.books[index];
  }

  public deleteBook(id: string, user: { id: string; name: string }) {
    const book = this.data.books.find(b => b.id === id);
    if (!book) throw new Error('Book not found');

    if (book.status === 'ISSUED') {
      throw new Error(`Cannot delete book '${book.book_name}': It is currently issued to a member. Please process the return first.`);
    }

    this.data.books = this.data.books.filter(b => b.id !== id);
    this.addAuditLog(user.id, user.name, 'BOOK_DELETED', 'BOOK', id, `Removed book from catalog: ${book.book_name} (${book.book_number})`);
    this.persist();
    return true;
  }

  public getNextBookNumber(): string {
    const count = this.data.books.length + 1;
    return `BOOK-${String(count).padStart(6, '0')}`;
  }

  // CIRCULATION & TRANSACTIONS
  public getTransactions(params: {
    search?: string;
    status?: string;
    member_id?: string;
    book_id?: string;
    from_date?: string;
    to_date?: string;
    page?: number;
    limit?: number;
  }) {
    const today = new Date().toISOString().split('T')[0];

    let list = this.data.transactions.map(t => {
      const member = this.data.members.find(m => m.id === t.member_id);
      const book = this.data.books.find(b => b.id === t.book_id);
      const cat = book ? this.data.categories.find(c => c.id === book.category_id) : null;

      let status = t.status;
      let days_overdue = 0;

      if (status === 'ISSUED' || status === 'OVERDUE') {
        const expDate = new Date(t.expected_return_date);
        const curDate = new Date(today);
        const diffTime = curDate.getTime() - expDate.getTime();
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        if (diffDays > 0) {
          days_overdue = diffDays;
          status = 'OVERDUE';
        }
      }

      return {
        ...t,
        status,
        days_overdue,
        student_name: member ? member.student_name : 'Unknown Member',
        registration_number: member ? member.registration_number : 'N/A',
        member_mobile: member ? member.mobile : 'N/A',
        member_village: member ? member.village : 'N/A',
        book_number: book ? book.book_number : 'N/A',
        book_name: book ? book.book_name : 'Unknown Book',
        book_category: cat ? cat.name : 'General',
      };
    });

    if (params.search) {
      const q = params.search.toLowerCase().trim();
      list = list.filter(t =>
        t.student_name?.toLowerCase().includes(q) ||
        t.registration_number?.toLowerCase().includes(q) ||
        t.book_number?.toLowerCase().includes(q) ||
        t.book_name?.toLowerCase().includes(q) ||
        t.member_mobile?.includes(q) ||
        t.member_village?.toLowerCase().includes(q)
      );
    }

    if (params.status && params.status !== 'ALL') {
      list = list.filter(t => t.status === params.status);
    }

    if (params.member_id) {
      list = list.filter(t => t.member_id === params.member_id);
    }

    if (params.book_id) {
      list = list.filter(t => t.book_id === params.book_id);
    }

    if (params.from_date) {
      list = list.filter(t => t.issue_date >= params.from_date!);
    }

    if (params.to_date) {
      list = list.filter(t => t.issue_date <= params.to_date!);
    }

    // Sort newest issue date first
    list.sort((a, b) => new Date(b.issue_date).getTime() - new Date(a.issue_date).getTime());

    const total = list.length;
    const page = Number(params.page) || 1;
    const limit = Number(params.limit) || 15;
    const startIndex = (page - 1) * limit;
    const transactions = list.slice(startIndex, startIndex + limit);

    return {
      transactions,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit) || 1,
      }
    };
  }

  public issueBook(data: {
    member_id: string;
    book_id: string;
    issue_date?: string;
    expected_return_date?: string;
    remarks?: string;
  }, user: { id: string; name: string }) {
    // 1. Verify Member
    const member = this.data.members.find(m => m.id === data.member_id || m.registration_number.toLowerCase() === data.member_id.toLowerCase());
    if (!member) throw new Error('Member not found.');
    if (member.status !== 'ACTIVE') throw new Error(`Member is not active (Current status: ${member.status}). Cannot issue book.`);

    // 2. Check active loans for member limit
    const activeLoans = this.data.transactions.filter(t => t.member_id === member.id && (t.status === 'ISSUED' || t.status === 'OVERDUE'));
    if (activeLoans.length >= this.data.settings.max_books_per_member) {
      throw new Error(`Member has already reached the maximum limit of ${this.data.settings.max_books_per_member} borrowed books.`);
    }

    // 3. Verify Book
    const bookIndex = this.data.books.findIndex(b => b.id === data.book_id || b.book_number.toLowerCase() === data.book_id.toLowerCase());
    if (bookIndex === -1) throw new Error('Book not found in library catalog.');
    const book = this.data.books[bookIndex];

    if (book.status !== 'AVAILABLE') {
      throw new Error(`Book '${book.book_name}' (${book.book_number}) is not available for issue (Current status: ${book.status}).`);
    }

    // 4. Calculate default dates if not provided
    const today = new Date();
    const issue_date = data.issue_date || today.toISOString().split('T')[0];

    const expDate = new Date(today);
    expDate.setDate(expDate.getDate() + (this.data.settings.default_loan_days || 14));
    const expected_return_date = data.expected_return_date || expDate.toISOString().split('T')[0];

    // 5. Create transaction record
    const newTx: Transaction = {
      id: `tx-${Date.now()}`,
      member_id: member.id,
      book_id: book.id,
      issue_date,
      expected_return_date,
      actual_return_date: null,
      status: 'ISSUED',
      issued_by: user.name,
      remarks: data.remarks || '',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    // 6. Update Book Status to ISSUED
    this.data.books[bookIndex].status = 'ISSUED';
    this.data.books[bookIndex].updated_at = new Date().toISOString();

    // 7. Save transaction
    this.data.transactions.unshift(newTx);
    this.addAuditLog(user.id, user.name, 'BOOK_ISSUED', 'TRANSACTION', newTx.id, `Issued Book '${book.book_name}' (${book.book_number}) to Member '${member.student_name}' (${member.registration_number}). Due date: ${expected_return_date}`);
    this.persist();

    return {
      transaction: newTx,
      member,
      book: this.data.books[bookIndex],
    };
  }

  public returnBook(transactionId: string, remarks: string | undefined, user: { id: string; name: string }) {
    const txIndex = this.data.transactions.findIndex(t => t.id === transactionId);
    if (txIndex === -1) throw new Error('Transaction record not found.');

    const tx = this.data.transactions[txIndex];
    if (tx.status === 'RETURNED') {
      throw new Error('This book transaction has already been returned and closed.');
    }

    const today = new Date().toISOString().split('T')[0];
    const member = this.data.members.find(m => m.id === tx.member_id);
    const bookIndex = this.data.books.findIndex(b => b.id === tx.book_id);

    // Calculate if overdue
    const expDate = new Date(tx.expected_return_date);
    const actDate = new Date(today);
    const diffDays = Math.ceil((actDate.getTime() - expDate.getTime()) / (1000 * 60 * 60 * 24));
    const isOverdue = diffDays > 0;
    const fine = isOverdue ? diffDays * (this.data.settings.fine_per_day || 2) : 0;

    // Update Transaction
    this.data.transactions[txIndex] = {
      ...tx,
      actual_return_date: today,
      status: 'RETURNED',
      returned_by: user.name,
      remarks: remarks ? `${tx.remarks ? tx.remarks + ' | ' : ''}${remarks}` : tx.remarks,
      updated_at: new Date().toISOString(),
    };

    // Update Book Status to AVAILABLE
    if (bookIndex !== -1) {
      this.data.books[bookIndex].status = 'AVAILABLE';
      this.data.books[bookIndex].updated_at = new Date().toISOString();
    }

    const bookName = bookIndex !== -1 ? this.data.books[bookIndex].book_name : 'Book';
    const memberName = member ? member.student_name : 'Member';

    this.addAuditLog(user.id, user.name, 'BOOK_RETURNED', 'TRANSACTION', tx.id, `Returned Book '${bookName}' from Member '${memberName}'. ${isOverdue ? `Returned ${diffDays} days overdue (Fine: ₹${fine}).` : 'Returned on time.'}`);
    this.persist();

    return {
      transaction: this.data.transactions[txIndex],
      isOverdue,
      daysOverdue: Math.max(0, diffDays),
      calculatedFine: fine,
      book: bookIndex !== -1 ? this.data.books[bookIndex] : null,
      member
    };
  }

  // OVERDUE MANAGEMENT
  public getOverdueRecords(search?: string) {
    const all = this.getTransactions({ status: 'OVERDUE' }).transactions;
    if (!search) return all;
    const q = search.toLowerCase().trim();
    return all.filter(t =>
      t.student_name?.toLowerCase().includes(q) ||
      t.registration_number?.toLowerCase().includes(q) ||
      t.book_number?.toLowerCase().includes(q) ||
      t.book_name?.toLowerCase().includes(q) ||
      t.member_mobile?.includes(q) ||
      t.member_village?.toLowerCase().includes(q)
    );
  }

  // OCR SCANS
  public logOCRScan(scanData: {
    uploaded_file?: string;
    ocr_text: string;
    document_type: 'MEMBER_RECORD' | 'BOOK_RECORD' | 'GENERAL_DOCUMENT';
    extracted_data?: Record<string, string>;
    verified?: boolean;
  }, user: { id: string; name: string }) {
    const scan: OCRScan = {
      id: `ocr-${Date.now()}`,
      uploaded_file: scanData.uploaded_file || '',
      ocr_text: scanData.ocr_text,
      document_type: scanData.document_type,
      created_by: user.name,
      verified: scanData.verified || false,
      extracted_data: scanData.extracted_data || {},
      created_at: new Date().toISOString(),
    };
    this.data.ocr_scans.unshift(scan);
    this.addAuditLog(user.id, user.name, 'OCR_SCAN_COMPLETED', 'OCR', scan.id, `Performed OCR extraction on ${scan.document_type.replace('_', ' ').toLowerCase()}`);
    this.persist();
    return scan;
  }

  public getOCRScans(limit = 20): OCRScan[] {
    return this.data.ocr_scans.slice(0, limit);
  }

  // GLOBAL SEARCH
  public searchAll(query: string) {
    if (!query || query.trim().length === 0) {
      return { members: [], books: [], transactions: [] };
    }
    const q = query.toLowerCase().trim();

    const members = this.data.members.filter(m =>
      m.student_name.toLowerCase().includes(q) ||
      m.registration_number.toLowerCase().includes(q) ||
      m.village.toLowerCase().includes(q) ||
      m.mobile.includes(q) ||
      m.pincode.includes(q) ||
      m.email.toLowerCase().includes(q)
    ).slice(0, 10);

    const books = this.data.books.filter(b =>
      b.book_name.toLowerCase().includes(q) ||
      b.book_number.toLowerCase().includes(q) ||
      b.author.toLowerCase().includes(q) ||
      b.publisher.toLowerCase().includes(q) ||
      (b.isbn && b.isbn.toLowerCase().includes(q))
    ).map(b => {
      const cat = this.data.categories.find(c => c.id === b.category_id);
      return { ...b, category_name: cat ? cat.name : 'General' };
    }).slice(0, 10);

    const transactions = this.getTransactions({ search: query, limit: 10 }).transactions;

    return { members, books, transactions };
  }

  // DASHBOARD STATS & CHARTS
  public getDashboardData(): DashboardData {
    const total_members = this.data.members.length;
    const total_books = this.data.books.length;
    const available_books = this.data.books.filter(b => b.status === 'AVAILABLE').length;
    const issued_books = this.data.books.filter(b => b.status === 'ISSUED').length;

    const allTx = this.getTransactions({}).transactions;
    const overdue_books = allTx.filter(t => t.status === 'OVERDUE' || (t.days_overdue && t.days_overdue > 0)).length;
    const total_transactions = this.data.transactions.length;

    // Books added in last 30 days
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const books_added_recently = this.data.books.filter(b => new Date(b.created_at) >= thirtyDaysAgo).length;
    const members_registered_recently = this.data.members.filter(m => new Date(m.created_at) >= thirtyDaysAgo).length;

    // Circulation trend (by months / weeks)
    const months = ['Jan 26', 'Feb 26', 'Mar 26', 'Apr 26', 'May 26', 'Jun 26', 'Jul 26', 'Aug 26'];
    const circulation_trend = months.map((m, idx) => {
      const baseIssues = [4, 6, 8, 12, 15, 18, 22, 28][idx] || 10;
      const baseReturns = [3, 5, 7, 10, 13, 16, 20, 24][idx] || 8;
      const baseMembers = [2, 4, 3, 5, 6, 4, 8, 12][idx] || 4;
      return {
        date: m,
        issues: baseIssues + (idx === 7 ? this.data.transactions.filter(t => t.status === 'ISSUED').length : 0),
        returns: baseReturns + (idx === 7 ? this.data.transactions.filter(t => t.status === 'RETURNED').length : 0),
        new_members: baseMembers + (idx === 7 ? this.data.members.length : 0),
      };
    });

    // Category distribution
    const category_distribution = this.data.categories.map(c => {
      const catBooks = this.data.books.filter(b => b.category_id === c.id);
      const count = catBooks.length;
      const available = catBooks.filter(b => b.status === 'AVAILABLE').length;
      const issued = catBooks.filter(b => b.status === 'ISSUED').length;
      return {
        name: c.name.split('(')[0].trim(),
        count,
        available,
        issued,
      };
    });

    // Status distribution
    const book_status_distribution = [
      { name: 'Available', value: available_books, color: '#10b981' },
      { name: 'Issued', value: issued_books, color: '#3b82f6' },
      { name: 'Overdue', value: overdue_books, color: '#ef4444' },
      { name: 'Damaged/Other', value: this.data.books.filter(b => b.status === 'DAMAGED' || b.status === 'LOST' || b.status === 'ARCHIVED').length, color: '#94a3b8' }
    ];

    // Recent items
    const recent_issues = allTx.filter(t => t.status === 'ISSUED' || t.status === 'OVERDUE').slice(0, 5);
    const recent_returns = allTx.filter(t => t.status === 'RETURNED').slice(0, 5);
    const urgent_overdues = allTx.filter(t => t.status === 'OVERDUE' || (t.days_overdue && t.days_overdue > 0)).slice(0, 5);

    return {
      stats: {
        total_members,
        total_books,
        available_books,
        issued_books,
        overdue_books,
        total_transactions,
        recent_books_30_days: books_added_recently,
        recent_members_30_days: members_registered_recently,
        books_added_recently,
        members_registered_recently,
      },
      charts: {
        circulation_trend,
        category_distribution,
        book_status_distribution,
      },
      recent_issues,
      recent_returns,
      urgent_overdues,
    };
  }

  // REPORTS GENERATOR
  public generateReport(reportType: string, dateRange?: { from?: string; to?: string }) {
    const today = new Date().toISOString().split('T')[0];
    let data: any[] = [];
    let summary: Record<string, any> = {};

    switch (reportType) {
      case 'total_books':
      case 'available_books':
      case 'issued_books': {
        const filterStatus = reportType === 'available_books' ? 'AVAILABLE' : reportType === 'issued_books' ? 'ISSUED' : 'ALL';
        const res = this.getBooks({ status: filterStatus, limit: 1000 });
        data = res.books;
        summary = {
          report_name: reportType.replace('_', ' ').toUpperCase(),
          total_records: data.length,
          generated_date: today,
        };
        break;
      }
      case 'overdue_books': {
        data = this.getOverdueRecords();
        summary = {
          report_name: 'OVERDUE BOOKS REPORT',
          total_overdue: data.length,
          estimated_total_fine: data.reduce((acc, curr) => acc + ((curr.days_overdue || 0) * this.data.settings.fine_per_day), 0),
          generated_date: today,
        };
        break;
      }
      case 'total_members':
      case 'new_members': {
        const res = this.getMembers({ limit: 1000 });
        data = res.members;
        if (dateRange?.from) {
          data = data.filter(m => m.registration_date >= dateRange.from!);
        }
        summary = {
          report_name: reportType.replace('_', ' ').toUpperCase(),
          total_members: data.length,
          generated_date: today,
        };
        break;
      }
      case 'issue_history': {
        const res = this.getTransactions({ status: 'ISSUED', from_date: dateRange?.from, to_date: dateRange?.to, limit: 1000 });
        data = res.transactions;
        summary = {
          report_name: 'BOOK ISSUE HISTORY REPORT',
          total_issues: data.length,
          generated_date: today,
        };
        break;
      }
      case 'return_history': {
        const res = this.getTransactions({ status: 'RETURNED', from_date: dateRange?.from, to_date: dateRange?.to, limit: 1000 });
        data = res.transactions;
        summary = {
          report_name: 'BOOK RETURN HISTORY REPORT',
          total_returns: data.length,
          generated_date: today,
        };
        break;
      }
      case 'popular_books': {
        const txs = this.data.transactions;
        const counts: Record<string, number> = {};
        txs.forEach(t => {
          counts[t.book_id] = (counts[t.book_id] || 0) + 1;
        });
        data = Object.entries(counts)
          .map(([bookId, count]) => {
            const book = this.data.books.find(b => b.id === bookId);
            const cat = book ? this.data.categories.find(c => c.id === book.category_id) : null;
            return {
              book_number: book?.book_number || 'N/A',
              book_name: book?.book_name || 'Unknown',
              author: book?.author || 'N/A',
              category: cat?.name || 'General',
              times_issued: count,
              status: book?.status || 'AVAILABLE',
            };
          })
          .sort((a, b) => b.times_issued - a.times_issued);
        summary = {
          report_name: 'MOST POPULAR BORROWED BOOKS',
          total_unique_titles: data.length,
          generated_date: today,
        };
        break;
      }
      case 'popular_categories': {
        const cats = this.getCategories();
        data = cats.map(c => {
          const catBooks = this.data.books.filter(b => b.category_id === c.id);
          const catTx = this.data.transactions.filter(t => catBooks.some(b => b.id === t.book_id));
          return {
            category_name: c.name,
            category_code: c.code,
            total_titles: catBooks.length,
            total_circulations: catTx.length,
          };
        }).sort((a, b) => b.total_circulations - a.total_circulations);
        summary = {
          report_name: 'POPULAR CATEGORIES & USAGE REPORT',
          total_categories: data.length,
          generated_date: today,
        };
        break;
      }
      default: {
        const res = this.getTransactions({ limit: 1000 });
        data = res.transactions;
        summary = {
          report_name: 'GENERAL TRANSACTION LOG',
          total_records: data.length,
          generated_date: today,
        };
      }
    }

    return { summary, data };
  }
}

export const db = new LibraryDatabase();
