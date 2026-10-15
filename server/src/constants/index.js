// "income" is the stored type value (per the API spec); the app presents it to students as pocket money.
export const TRANSACTION_TYPES = ['income', 'expense'];

export const TYPE_LABELS = { income: 'Pocket money', expense: 'Expense' };

export const CATEGORIES = {
  income: ['From Parents', 'Scholarship', 'Part-time Job', 'Internship Stipend', 'Prize Money', 'Gifts', 'Other'],
  expense: [
    'Canteen & Snacks',
    'Hostel & Mess',
    'Books & Notes',
    'Stationery',
    'Printouts & Xerox',
    'Fees & Exams',
    'Coaching & Tuition',
    'Transport',
    'Mobile & Internet',
    'Clubs & Events',
    'Outings & Fun',
    'Laundry & Essentials',
    'Medical',
    'Other',
  ],
};

export const PAYMENT_METHODS = [
  { value: 'cash', label: 'Cash' },
  { value: 'upi', label: 'UPI' },
  { value: 'debit_card', label: 'Debit Card' },
  { value: 'campus_card', label: 'Campus / ID Card' },
  { value: 'wallet', label: 'Wallet' },
  { value: 'bank_transfer', label: 'Bank Transfer' },
  { value: 'other', label: 'Other' },
];

export const PAYMENT_METHOD_VALUES = PAYMENT_METHODS.map((m) => m.value);

export const CURRENCIES = ['INR', 'USD', 'EUR', 'GBP', 'JPY', 'AUD', 'CAD', 'SGD', 'AED'];

export const NOTE_MAX_LENGTH = 200;
