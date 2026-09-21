
# PocketBuddy

### Student & Room Expense Tracker

PocketBuddy is a student-focused money management web application designed to help students manage their daily expenses, track their monthly budget, split room expenses, and keep a record of money borrowed from or lent to friends.

Managing money as a student can become confusing when daily spending, hostel expenses, shared bills, and personal loans are all handled separately.

PocketBuddy brings these everyday financial activities together in one simple and organized platform.

---

## About the Project

PocketBuddy is built for students, hostel residents, roommates, and friends who want a clear view of their money without using complicated financial tools.

The project focuses on practical student problems:

- Where is my monthly pocket money going?
- How much money have I spent today?
- How much budget is remaining?
- Who paid the room rent or electricity bill?
- How much money do I need to receive from a friend?
- How much money do I need to pay back?
- How can I keep my personal and shared expenses organized?

PocketBuddy provides a single place to manage these activities.

---

## Key Features

### 1. Student Money Dashboard

The My Money section helps students understand their monthly financial situation.

Features include:

- Monthly budget tracking
- Daily expense tracking
- Total amount spent
- Remaining budget
- Daily spending limit
- Cash in hand balance
- UPI / bank balance
- Recent expense history
- Monthly spending overview
- Budget and spending insights

### 2. My Room

The My Room section is designed for students living with roommates or friends.

Features include:

- Create a shared room
- Join a room using a room code
- Track shared expenses
- Manage rent and electricity expenses
- Record grocery and daily room purchases
- Track who paid for an expense
- View shared expense details
- Understand who owes whom
- Manage room-related spending

### 3. Friend Loans

The Friend Loans section helps students track personal money lending and borrowing.

Features include:

- Add a friend loan
- Record money lent to a friend
- Record money borrowed from a friend
- Track money to receive
- Track money to repay
- View pending loan records
- Maintain a clear personal loan history

### 4. Bills & Rent

The Bills & Rent section helps students keep track of regular financial commitments.

Examples:

- Hostel rent
- Room rent
- Electricity bills
- Internet bills
- Monthly subscriptions
- Other recurring expenses

### 5. Expense Management

PocketBuddy provides different ways to record expenses.

- Manual expense entry
- Expense category selection
- Expense amount tracking
- Expense date and description
- Cash and UPI expense records
- Expense history
- Budget impact tracking

### 6. Student-Friendly Design

The interface is designed around the daily needs of students.

- Clean dashboard
- Simple navigation
- Mobile-friendly layout
- Responsive design
- Easy-to-understand financial cards
- Clear spending indicators
- Dedicated sections for money and rooms

### Login / Register

The entry point of PocketBuddy.

Users can access the application through the authentication interface.

The login experience is designed to be simple and student-friendly.


## Technology Stack

### Frontend

- React.js
- TypeScript
- HTML
- CSS
- Vite

### UI & Design

- Responsive user interface
- Component-based architecture
- Modern dashboard design
- Mobile-first experience

### Development Tools

- Visual Studio Code
- Git
- GitHub
- Google AI Studio
- npm

---

## Project Structure

```text
PocketBuddy/
│
├── src/
│   ├── components/
│   │   ├── ...
│   │
│   ├── data/
│   │   ├── initialData.ts
│   │   └── sampleScreenshots.ts
│   │
│   ├── utils/
│   │
│   ├── App.tsx
│   ├── index.css
│   ├── main.tsx
│   └── types.ts
│
├── data_store/
│
├── index.html
├── package.json
├── tsconfig.json
├── vite.config.ts
├── server.ts
├── README.md
└── .gitignore
```

---

## Getting Started

Follow these steps to run PocketBuddy locally.

### 1. Clone the repository

```bash
git clone YOUR_GITHUB_REPOSITORY_URL
```

### 2. Open the project

```bash
cd PocketBuddy
```

### 3. Install dependencies

```bash
npm install
```

### 4. Start the development server

```bash
npm run dev
```

### 5. Open the local website

Open the localhost URL shown in your terminal.

Example:

```text
http://localhost:5173
```

The exact port may be different depending on the project configuration.

---

## How PocketBuddy Works

### Personal Expense Flow

```text
Student
   ↓
Open My Money
   ↓
Set Monthly Budget
   ↓
Add Daily Expense
   ↓
Select Category
   ↓
Enter Amount
   ↓
Save Expense
   ↓
Update Spending Summary
   ↓
View Remaining Budget
```

### Shared Room Expense Flow

```text
Student
   ↓
Open My Room
   ↓
Create Room / Join Room
   ↓
Share Room Code
   ↓
Add Shared Expense
   ↓
Select Who Paid
   ↓
Track Room Members
   ↓
Calculate Shared Balances
   ↓
Settle Expenses
```

### Friend Loan Flow

```text
Student
   ↓
Open Friend Loans
   ↓
Add Loan Record
   ↓
Select Lent / Borrowed
   ↓
Enter Friend Details
   ↓
Enter Amount
   ↓
Save Loan
   ↓
Track Pending Balance
```

---

## Project Goals

PocketBuddy was created with the following goals:

- Make student money management easier.
- Reduce confusion around daily expenses.
- Help students control their monthly budget.
- Make roommate expense tracking simpler.
- Keep personal loans organized.
- Provide a clean and useful financial dashboard.
- Build a practical project using modern web technologies.

---

## Future Improvements

The project can be extended with additional features such as:

- Secure user authentication
- Cloud database integration
- Real-time room expense synchronization
- Expense reminders
- Monthly financial reports
- PDF expense reports
- Advanced spending analytics
- UPI receipt scanning
- Voice-based expense entry
- Notifications for pending loans
- Dark mode
- Multi-device synchronization

---

## Project Status

🚧 **Active Development**

PocketBuddy is being developed as a student-focused finance and shared expense management application.

The project is continuously improved with new features, better UI, and usability enhancements.

---

## Developer

**Aditya Singh**

B.Tech Computer Science & Engineering

### Project

PocketBuddy

Student & Room Expense Tracker

---

## License

This project is developed for learning, experimentation, and portfolio purposes.

More details will be added as the project evolves.

---

## Acknowledgement

Built with React, TypeScript, and modern web development tools.

Designed to solve everyday student money management problems through a simple and practical application.
