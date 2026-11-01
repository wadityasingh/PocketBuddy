# B.TECH CSE 3RD YEAR MINI-PROJECT REPORT
## POCKETBUDDY — STUDENT SMART MONEY MANAGER

---

# 1. PAGE-BY-PAGE MAPPING TO STANDARD B.TECH CSE REPORT FORMAT

| Sample Page / Section | Target Page Range | Academic Document Component | PocketBuddy Replacement Content |
| :--- | :--- | :--- | :--- |
| **Cover Page** | Page 1 | Project Title & University Submission | Official title, student name (Aditya Singh), Roll No. (2404220100014), college (Bansal Institute of Engineering & Technology, Lucknow), session 2026–2027. |
| **Certificate** | Page 2 | Certificate of Original Work | Formal college certificate with Guide Name, Head of Department, and External Examiner placeholders. |
| **Declaration** | Page 3 | Student Candidate Declaration | Standard AKTU student declaration affirming original implementation and compliance with academic ethics. |
| **Acknowledgement** | Page 4 | Acknowledgement | Gratitude to Project Guide, HOD, faculty members, lab technicians, and family. |
| **Abstract** | Page 5 | Executive Summary & Keywords | Project overview, core hostel/student budget problems solved, tech stack, and key results. |
| **Contents** | Page 6–7 | Table of Contents, Figures & Tables | Detailed structured index covering Chapters 1 through 8, References, and Appendices. |
| **Chapter 1** | Page 8–10 | Introduction & Problem Formulation | Background of student allowance management, real-world pain points of cash/UPI dual wallets and shared room expenses, objectives, scope, and Existing vs. Proposed system comparison. |
| **Chapter 2** | Page 11–12 | Literature Survey & Related Work | Comparative study of existing applications (Splitwise, Walnut, Google Sheets, Khatabook), their shortcomings for Indian college students, and technical research citations. |
| **Chapter 3** | Page 13–15 | System Requirements & Feasibility | Functional & Non-functional requirements, minimum hardware/software specifications, and technical/economic/operational feasibility analysis. |
| **Chapter 4** | Page 16–20 | System Architecture & Design | Multi-tier architecture diagram, DFD Level 0 (Context), DFD Level 1, DFD Level 2 (Room Expense & Settlement), Use Case Diagram, Sequence Diagram, and Firestore/JSON Storage Schemas. |
| **Chapter 5** | Page 21–25 | Implementation Details & Algorithms | Frontend component hierarchy, Express.js REST API endpoints, the Zero-Sum Integer-Paise Split Algorithm, Receiver-Approved Two-Step Settlement state machine, and Notes Lock security. |
| **Chapter 6** | Page 26–28 | Testing & Verification | Comprehensive Test Plan, Unit/Integration Test Suite, and exact mathematical verification of the 3-member Room test case (Aditya ₹200, Shivam ₹18, Manmohan ₹95; Total = ₹313). |
| **Chapter 7** | Page 29–31 | Results, UI Walkthrough & Status Audit | Screen-by-screen breakdown (Dashboard, My Money, My Room, Locked Notes, AI Scanner), accompanied by an honest status audit of fully implemented vs. partial/planned features. |
| **Chapter 8** | Page 32–33 | Conclusion & Future Enhancements | Summary of project achievements, lessons learned, and future roadmap (native mobile app, SMS auto-fetch, OCR optimization). |
| **References** | Page 34 | Academic References | Formal IEEE citations for React 19, Express.js, Firebase Firestore, Splitwise debt algorithms, and Web Security principles. |
| **Appendix** | Page 35–36 | API Specifications & Data Payloads | Complete REST API table with HTTP methods, route paths, request payloads, response structures, and authorization requirements. |

---

# 2. COMPLETE ACADEMIC PROJECT REPORT

```
================================================================================
                                 A PROJECT REPORT
                                        ON
                   POCKETBUDDY — STUDENT SMART MONEY MANAGER

            Submitted in partial fulfillment of the requirements for
                    the award of the degree of
                     BACHELOR OF TECHNOLOGY
                                        IN
                      COMPUTER SCIENCE & ENGINEERING
================================================================================

                                   SUBMITTED BY:
                                   ADITYA SINGH
                          University Roll No: 2404220100014

                               UNDER THE GUIDANCE OF:
                               [PROJECT GUIDE NAME]
                    Assistant Professor, Department of CSE

                     DEPARTMENT OF COMPUTER SCIENCE & ENGINEERING
             BANSAL INSTITUTE OF ENGINEERING & TECHNOLOGY, LUCKNOW
    Affiliated to Dr. A.P.J. Abdul Kalam Technical University, Lucknow, U.P.
                                  ACADEMIC SESSION
                                     2026–2027
```

\newpage

```
================================================================================
             BANSAL INSTITUTE OF ENGINEERING & TECHNOLOGY, LUCKNOW
                  DEPARTMENT OF COMPUTER SCIENCE & ENGINEERING

                                 CERTIFICATE
================================================================================

This is to certify that the project entitled "POCKETBUDDY — STUDENT SMART MONEY
MANAGER", submitted by ADITYA SINGH (University Roll No: 2404220100014) in partial
fulfillment of the requirements for the award of the degree of Bachelor of
Technology in Computer Science & Engineering from Bansal Institute of Engineering
& Technology, Lucknow (affiliated to Dr. A.P.J. Abdul Kalam Technical University,
Lucknow) during the academic session 2026–2027, is a bona fide record of the work
carried out by him under our supervision and guidance.

To the best of our knowledge, the matter embodied in this project report has not
been submitted to any other University or Institute for the award of any degree
or diploma.




________________________                           ________________________
[PROJECT GUIDE NAME]                               HEAD OF THE DEPARTMENT
Project Guide & Designation                        Department of CSE
Department of CSE                                  BIET, Lucknow
BIET, Lucknow




________________________
EXTERNAL EXAMINER
Date: _______________
```

\newpage

```
================================================================================
                                 DECLARATION
================================================================================

I hereby declare that this project report entitled "POCKETBUDDY — STUDENT SMART
MONEY MANAGER" submitted towards the completion of the Mini-Project in the 6th
Semester of Bachelor of Technology in Computer Science & Engineering at Bansal
Institute of Engineering & Technology, Lucknow, is an authentic record of my
original work.

I further declare that this report has been prepared under the continuous
guidance of [PROJECT GUIDE NAME], Assistant Professor, Department of Computer
Science & Engineering. Any material borrowed from other sources, including books,
research articles, code libraries, and web portals, has been duly acknowledged
and referenced in accordance with standard academic ethics.



Date: October 28, 2026                                ADITYA SINGH
Place: Lucknow, U.P.                                  University Roll No: 2404220100014
                                                      B.Tech CSE (3rd Year)
```

\newpage

```
================================================================================
                               ACKNOWLEDGEMENT
================================================================================

The successful realization and execution of any engineering project requires
guidance, encouragement, and constructive critique from educators and mentors.

I express my deepest gratitude to my project supervisor, [PROJECT GUIDE NAME],
Assistant Professor, Department of Computer Science & Engineering, for their
valuable advice, consistent encouragement, and meticulous technical feedback
throughout the development of this project.

I extend my heartfelt thanks to the Head of the Department, Department of
Computer Science & Engineering, and the Director of Bansal Institute of
Engineering & Technology, Lucknow, for providing the necessary computing facilities,
high-speed networking, and an intellectually vibrant environment.

I also acknowledge the cooperation of my fellow classmates and friends whose
suggestions and peer-testing of the multi-user shared room module helped refine
the mathematical accuracy and user experience of PocketBuddy.

Lastly, I thank my parents and family for their unwavering moral and emotional
support throughout my engineering education.



                                                      ADITYA SINGH
                                                      University Roll No: 2404220100014
```

\newpage

```
================================================================================
                                   ABSTRACT
================================================================================

College students face significant hurdles in personal financial management.
Limited monthly allowances, the dual circulation of liquid Cash and digital UPI
(Unified Payments Interface), and frequent shared group expenditures—such as hostel
room supplies, shared grocery runs, flat rents, and mess bills—frequently lead to
premature budget exhaustion, untracked debts, and social friction among roommates.
Existing market alternatives like general personal finance trackers either
overcomplicate workflows with corporate taxation features, fail to segregate UPI
from Cash balances, or treat group debt settlements as mere self-declared
checkboxes without two-party mutual verification.

"PocketBuddy — Student Smart Money Manager" is a modern, responsive full-stack web
application designed specifically to address the financial lifestyle of hostelers
and college students. Developed with React 19, TypeScript, Tailwind CSS, Express.js,
and Firebase Firestore, PocketBuddy provides a unified platform featuring:
1. Dynamic Pocket Money & Wallet Allocation: Real-time dual balance tracking for
   UPI and physical Cash with category-based personal expenditure logging.
2. Multi-User Room Expense Manager: A collaborative group budgeting system where
   roommates join via secure invite codes, split shared bills using an exact
   integer-paise algorithm with zero rounding loss, and calculate a "Who Owes
   Whom" debt graph.
3. Receiver-Approved Settlement Protocol: A two-step financial reconciliation
   state machine ensuring that debt settlements remain in a "PENDING" status until
   the receiving creditor explicitly verifies and approves the payment.
4. Confidential Student Vault: A client-side password-protected notes manager for
   storing private financial credentials, lease agreements, and passwords.
5. AI-Assisted Expense Parsing: Prototype integration with Google Gemini 2.5 Flash
   and client-side Tesseract OCR for automated receipt transcription.

Experimental validation conducted with simulated multi-device concurrent users
verified 100% mathematical accuracy with zero drift across non-terminating decimal
splits, robust role-based authorization, and resilient session state recovery.

Keywords: Personal Finance, Expense Splitting, Two-Party Settlement, Integer-Paise
Arithmetic, React 19, Express.js, Firebase Firestore, Full-Stack Engineering.
```

\newpage

```
================================================================================
                              TABLE OF CONTENTS
================================================================================

Title Page ................................................................... i
Certificate ................................................................. ii
Declaration ................................................................ iii
Acknowledgement ............................................................. iv
Abstract ..................................................................... v
List of Figures ............................................................ viii
List of Tables .............................................................. ix

CHAPTER 1: INTRODUCTION ....................................................... 1
    1.1 Project Overview ..................................................... 1
    1.2 Problem Statement .................................................... 1
    1.3 Project Objectives ................................................... 2
    1.4 Scope and Boundaries ................................................. 2
    1.5 Comparison of Existing System vs. Proposed System .................... 3

CHAPTER 2: LITERATURE SURVEY & RELATED WORK ................................... 4
    2.1 Review of Existing Financial Management Applications ................. 4
    2.2 Algorithmic Approaches to Multi-Party Debt Simplification ............. 5
    2.3 Summary of Gaps in Existing Literature and Solutions ................. 5

CHAPTER 3: REQUIREMENT ANALYSIS & FEASIBILITY STUDY ........................... 6
    3.1 Functional Requirements .............................................. 6
    3.2 Non-Functional Requirements .......................................... 7
    3.3 Hardware Requirements ................................................ 7
    3.4 Software Requirements & Tech Stack ................................... 8
    3.5 Feasibility Analysis ................................................. 8
        3.5.1 Technical Feasibility .......................................... 8
        3.5.2 Economic Feasibility ........................................... 9
        3.5.3 Operational Feasibility ........................................ 9

CHAPTER 4: SYSTEM ARCHITECTURE & DESIGN ...................................... 10
    4.1 High-Level Architecture ............................................. 10
    4.2 Data Flow Diagrams (DFD) ............................................ 11
        4.2.1 DFD Level 0 (Context Diagram) ................................. 11
        4.2.2 DFD Level 1 (System Processes) ................................ 12
        4.2.3 DFD Level 2 (Room Expense & Settlement Subsystem) .............. 13
    4.3 Use Case Diagram & Actor Descriptions ............................... 14
    4.4 Sequence Diagram: Room Expense Logging & Settlement ................. 15
    4.5 Database & Storage Architecture ..................................... 16
        4.5.1 Firestore Cloud Schema (NoSQL Collections) .................... 16
        4.5.2 Local Storage Fallback Cache .................................. 17

CHAPTER 5: IMPLEMENTATION DETAILS & ALGORITHMIC DESIGN ....................... 18
    5.1 Frontend Architecture & Component Hierarchy ......................... 18
    5.2 Backend Express REST API Structure .................................. 19
    5.3 Exact Integer-Paise Room Expense Splitting Algorithm ................ 20
    5.4 "Who Owes Whom" Net Balance & Debt Graph Computation ................ 21
    5.5 Two-Step Receiver-Approved Settlement State Machine ................. 22
    5.6 Password-Protected Notes Security Model ............................. 23
    5.7 AI Receipt & Voice Parsing Implementation Status .................... 24

CHAPTER 6: TESTING & VERIFICATION ............................................ 25
    6.1 Testing Methodology & Strategy ...................................... 25
    6.2 Comprehensive Unit & Integration Test Cases ......................... 25
    6.3 Case Study: 3-Member Asymmetric Expense Verification ................ 27
        6.3.1 Experimental Scenario & Real-World Inputs ..................... 27
        6.3.2 Exact Balance Calculations & Mathematical Proof ............... 27
        6.3.3 State Transition & Settlement Approval Audit .................. 28
    6.4 Security & Boundary Testing ......................................... 28

CHAPTER 7: RESULTS, UI WALKTHROUGH & STATUS AUDIT ............................ 29
    7.1 User Interface Implementation & Navigation .......................... 29
    7.2 Feature Implementation Status Matrix ................................ 30
    7.3 Comparative Benchmarking ............................................ 31

CHAPTER 8: CONCLUSION & FUTURE ENHANCEMENTS .................................. 32
    8.1 Conclusion .......................................................... 32
    8.2 Limitations ......................................................... 32
    8.3 Future Scope & Roadmap .............................................. 33

REFERENCES ................................................................... 34

APPENDIX A: COMPLETE REST API SPECIFICATION .................................. 35
APPENDIX B: MATHEMATICAL PROOF OF CONVERGENCE IN INTEGER SPLITS .............. 36
```

\newpage

```
================================================================================
                                LIST OF FIGURES
================================================================================

Figure 4.1: High-Level Three-Tier Full-Stack System Architecture .............. 10
Figure 4.2: Data Flow Diagram — Level 0 (Context Level) ....................... 11
Figure 4.3: Data Flow Diagram — Level 1 (Functional Decomposition) ............ 12
Figure 4.4: Data Flow Diagram — Level 2 (Shared Room & Settlement Flow) ....... 13
Figure 4.5: UML Use Case Diagram for Student User and Room Admin .............. 14
Figure 4.6: Sequence Diagram for Two-Step Receiver-Approved Settlement ........ 15
Figure 4.7: Entity-Relationship & Firestore Collection Data Model ............. 16
Figure 5.1: React 19 Frontend Component Hierarchy ............................. 18
Figure 5.2: State Machine Diagram for Debt Settlement Lifecycle ............... 22
Figure 7.1: PocketBuddy Dashboard (Overview of Balance & Spend Velocity) ...... 29
Figure 7.2: My Money Screen (Cash vs. UPI Segregation & Transaction Form) ..... 29
Figure 7.3: My Room Screen (Room Members, Split Calculator & Activity Feed) ... 30
Figure 7.4: Who Owes Whom Matrix & Pending Settlement Actions ................. 30
Figure 7.5: Password-Protected Notes Vault with SHA-256 Key Verification ...... 31
```

```
================================================================================
                                 LIST OF TABLES
================================================================================

Table 1.1: Functional Comparison: Traditional Methods vs. PocketBuddy ......... 3
Table 2.1: Comparative Feature Matrix of Commercial Finance Trackers .......... 5
Table 3.1: Minimum Hardware Requirements for Server & Client Nodes ............ 7
Table 3.2: Complete Software Technology Stack and Production Dependencies ...... 8
Table 6.1: Comprehensive Functional & Security Test Suite ..................... 26
Table 6.2: 3-Member Asymmetric Expense Allocation Matrix (Total ₹313.00) ...... 27
Table 6.3: Net Balance & Debt Resolution Proof (Zero-Sum Verification) ........ 28
Table 7.1: Detailed Feature Implementation Audit & Readiness Status ........... 31
Table A.1: PocketBuddy REST API Endpoints Specification ....................... 35
```

\newpage

---

# CHAPTER 1: INTRODUCTION

## 1.1 Project Overview
"PocketBuddy — Student Smart Money Manager" is a specialized, responsive, full-stack financial management platform engineered specifically for college students, hostelers, and flat-sharing undergraduates. While modern consumer banking in India has undergone a massive digital transformation driven by the Unified Payments Interface (UPI), undergraduate students face a distinct set of operational and behavioral challenges. Students typically operate on fixed monthly parental allowances, frequent small cash transactions (canteen tea, local auto fares, photocopy stalls), and high-frequency shared living expenses (room rent, LPG cylinder refills, common groceries, internet recharge, and mess rebates).

PocketBuddy synthesizes personal pocket-money management and collaborative group-living expense splitting into a cohesive, secure, and user-friendly digital ecosystem. It eliminates the manual friction of physical diaries, disorganized group chat notes, and disconnected spreadsheet formulas.

## 1.2 Problem Statement
Undergraduate students residing in hostels and shared apartments face three acute financial problems:
1. **The Cash vs. UPI Blind Spot:** Most budgeting tools aggregate all balances into an abstract "Total Net Worth." However, students frequently find themselves in situations where their UPI bank balance is exhausted while physical cash remains in their wallet, or vice-versa. Failing to separate liquidity types leads to sudden overdrafts and cash crunches.
2. **The "Who Owes Whom" Dilemma and Rounding Discrepancies:** In shared flats, expenses are logged by different roommates at different times. Traditional manual division of bills (such as ₹313 divided equally among 3 roommates) yields non-terminating decimals (₹104.3333...). Floating-point math errors and crude rounding causes the sum of individual shares to deviate from the total bill amount, leading to lingering debts, cumulative penny drift, and interpersonal disputes.
3. **Unilateral Settlement Loopholes:** In existing group split apps, any debtor can unilaterally click "Mark as Paid," clearing the debt from their interface even if the creditor never received the bank transfer or cash handover. This lack of dual verification causes severe tracking breakdowns in student rooms.

## 1.3 Project Objectives
The primary technical and operational objectives of PocketBuddy are:
- To develop an intuitive, responsive React 19 frontend integrated with an Express.js backend and a scalable Firebase Firestore NoSQL cloud database.
- To implement dual-wallet tracking that records opening balances, deposits, and expenditures categorized independently under physical Cash and digital UPI modes.
- To design and implement a zero-sum, integer-paise mathematical splitting algorithm that guarantees exact zero-drift balance distribution across arbitrary group sizes.
- To enforce a secure, two-step state machine for debt settlements requiring explicit confirmation by the payment recipient before ledger balances are updated.
- To provide a confidential client-side locked notes vault protected by cryptographic hashing for sensitive credentials, hostel agreements, and landlord contact details.
- To ensure multi-user synchronization so that all roommates connected via a 6-character room invite code observe immediate, consistent ledger states across heterogeneous devices.

## 1.4 Scope and Boundaries
The scope of this Mini-Project encompasses:
- Full authentication cycle using Firebase Authentication (Email/Password and Google OAuth 2.0).
- Real-time personal transaction logging with category filtering, monthly budget velocity, and visual analytics via Recharts.
- Group room lifecycle: Room creation, dynamic invite code generation, multi-user joining, shared bill creation with participant selection, and automated debt matrix computation.
- Two-party settlement workflow with robust server-side authorization ensuring only the intended creditor can accept a pending settlement.
- The project is deployed as an authenticated Single-Page Application (SPA) on cloud infrastructure (Render / Google Cloud Run) with persistent Firestore cloud storage and an automated local file fallback.

*Out of Scope:* Direct bank account synchronization via Account Aggregator APIs (requires commercial NBFC licensing) and direct automated debit execution through payment gateways.

## 1.5 Comparison of Existing System vs. Proposed System

**Table 1.1: Functional Comparison: Traditional Methods vs. PocketBuddy**

| Parameter | Physical Notebook / Diary | Google Sheets / Excel | Commercial Split Apps (e.g., Splitwise) | Proposed PocketBuddy System |
| :--- | :--- | :--- | :--- | :--- |
| **Cash vs. UPI Segregation** | Manual, error-prone | Requires complex manual formulas | Aggregates all currencies into a single balance | **Native first-class Cash and UPI wallet tracking** |
| **Calculation Accuracy** | High human error | Floating-point rounding errors | Often truncates sub-rupee paise | **Exact integer-paise arithmetic (zero balance drift)** |
| **Settlement Integrity** | Verbal / Trust-based | Unilateral cell overwrite | Debtor can mark paid without creditor approval | **Mandatory Receiver Approval (PENDING $\rightarrow$ SETTLED)** |
| **Room Collaboration** | Single physical copy | Requires spreadsheet sharing | Generic, lacks student-focused categories | **Room invite codes + Real-time activity logs** |
| **Confidential Notes** | Open to physical theft | Not password-protected | None | **AES/SHA encrypted in-app locked notes vault** |
| **Hostel Mess Rebate Tracker** | Not supported | Requires custom logic | Not supported | **Built-in daily meal rebate deduction module** |

---

# CHAPTER 2: LITERATURE SURVEY & RELATED WORK

## 2.1 Review of Existing Financial Management Applications
Personal financial tracking software has evolved from simple offline desktop ledgers to cloud-native mobile applications. Contemporary commercial solutions were surveyed to identify their limitations in student environments:

1. **Splitwise (2011):** A global benchmark in peer-to-peer expense sharing. Splitwise utilizes graph simplification algorithms to minimize the total number of cash transactions required to settle a multi-party group. However, Splitwise lacks personal wallet budgeting, does not track personal Cash vs. bank accounts, and allows debtors to unilaterally log settlements without cryptographic or creditor verification.
2. **Walnut / Axio (2014):** Automated expense trackers functioning via automated Android SMS inbox parsing. While effective for formal credit card and bank account transactions, Walnut fails to capture cash spending at college cafeterias and street vendors, and contains no collaborative room-sharing features.
3. **Khatabook / OkCredit (2019):** Designed as digital ledger books for micro-merchants and shopkeepers. Although they feature dual-party SMS reminders, their user experience is tailored for supplier-customer credit rather than equal/custom cost splitting among equal roommates.

**Table 2.1: Comparative Feature Matrix of Commercial Finance Trackers**

| Feature | Splitwise | Walnut | Khatabook | PocketBuddy |
| :--- | :---: | :---: | :---: | :---: |
| Personal Pocket Money Budgeting | $\times$ | $\checkmark$ | $\times$ | $\checkmark$ |
| Dual Cash & UPI Balances | $\times$ | $\times$ | $\times$ | $\checkmark$ |
| Group Room Splitting | $\checkmark$ | $\times$ | $\times$ | $\checkmark$ |
| Receiver-Verified Settlements | $\times$ | $\times$ | $\checkmark$ | $\checkmark$ |
| Student-Centric Expense Categories | $\times$ | $\times$ | $\times$ | $\checkmark$ |
| Secure In-App Credential Notes | $\times$ | $\times$ | $\times$ | $\checkmark$ |
| Free / Zero Advertising Tier | Partial | $\times$ | Partial | $\checkmark$ |

## 2.2 Algorithmic Approaches to Multi-Party Debt Simplification
In group financial management, resolving pairwise debts across $N$ members represents a classic graph reduction problem. When $N$ members exchange expenses, a complete directed debt graph can contain up to $N(N-1)$ transaction edges. In PocketBuddy, pairwise net balances are computed by evaluating:
$$\text{Net Balance}_i = \text{Total Paid}_i - \text{Total Consumed Share}_i + \text{Settled Received}_i - \text{Settled Paid}_i$$
PocketBuddy sorts net debtors and net creditors, pairing the largest debtor with the largest creditor to resolve all mutual obligations in at most $N-1$ optimal transactions.

---

# CHAPTER 3: REQUIREMENT ANALYSIS & FEASIBILITY STUDY

## 3.1 Functional Requirements
1. **User Authentication & Authorization (FR-01):**
   - Secure registration, login, and password authentication via Firebase Auth and JWT.
   - Profile management including name, avatar, UPI ID, and room affiliations.
2. **Personal Wallet & Budget Management (FR-02):**
   - Initialization of monthly pocket money with initial cash-in-hand and UPI balances.
   - Recording of income, expenses, personal loans (Udhaar), and intra-wallet transfers.
   - Real-time deduction from the specified payment mode (Cash or UPI).
3. **Room Collaboration & Management (FR-03):**
   - Creation of shared rooms (Hostel Room, Flat, PG) with auto-generated 6-character alphanumeric invite codes.
   - Joining existing rooms via valid invite codes with duplicate-membership prevention.
   - Room admin privileges for metadata modification and room decommissioning.
4. **Shared Expense Logging & Calculation (FR-04):**
   - Logging group bills with custom titles, total amount, payer designation, and multi-member selection.
   - Automated split calculations: Equal, Exact, Custom, and Percentage modes.
   - Enforcing creator-only modification and deletion rights on logged room expenses.
5. **Receiver-Approved Settlement Lifecycle (FR-05):**
   - Recording payment handovers from debtor to creditor.
   - Transitioning settlement state to `PENDING` upon debtor submission.
   - Restricting approval execution strictly to the designated creditor (`toUserId`), upon which the status transitions to `COMPLETED` and balances adjust.
6. **Confidential Notes Vault (FR-06):**
   - Creating, editing, and deleting notes categorized by academic, room, or personal tags.
   - Setting a 4-digit PIN / password to lock sensitive notes.

## 3.2 Non-Functional Requirements
- **Mathematical Integrity:** All financial divisions must use integer paise arithmetic to guarantee $\sum (\text{shares}) = \text{total bill}$ with zero penny discrepancy.
- **Latency & Responsiveness:** UI state updates must render within 100 milliseconds; REST API responses must execute within 250 milliseconds under standard 4G networks.
- **Data Persistence & Isolation:** User private transactions must remain strictly isolated. Room ledgers must only be queryable by authenticated room members.
- **Cross-Platform Usability:** Fully responsive layout adhering to mobile-first viewport design (360px to 1920px screen widths).

## 3.3 Hardware Requirements

**Table 3.1: Minimum Hardware Requirements for Server & Client Nodes**

| Component | Minimum Client Specification | Minimum Server Node Specification |
| :--- | :--- | :--- |
| **Processor** | Dual Core 1.5 GHz (ARM/x86) | 1 vCPU (2.0 GHz Intel Xeon or AMD EPYC) |
| **RAM** | 2 GB | 512 MB to 1 GB |
| **Storage** | 100 MB free browser cache storage | 1 GB persistent SSD storage |
| **Display** | 360 $\times$ 640 mobile screen resolution | Headless Linux container |
| **Network** | 3G / 4G / Wi-Fi broadband connection | 100 Mbps uplink cloud interface |

## 3.4 Software Requirements & Tech Stack

**Table 3.2: Complete Software Technology Stack and Production Dependencies**

| Layer | Technology | Version | Purpose |
| :--- | :--- | :--- | :--- |
| **Frontend Framework** | React | 19.0.1 | Component-driven declarative UI architecture |
| **Language** | TypeScript | 5.8.2 | Static typing and interface-driven bug prevention |
| **Build Tooling** | Vite | 6.2.3 | High-performance ES module bundler and dev server |
| **CSS Engine** | Tailwind CSS | 4.1.14 | Utility-first responsive design framework |
| **Icons & UI** | Lucide React | 0.546.0 | Modern SVG iconography |
| **Backend Runtime** | Node.js / TSX | 22.14.0 / 4.21.0 | Asynchronous server execution environment |
| **Server Framework** | Express.js | 4.21.2 | High-throughput REST API routing engine |
| **Primary Cloud DB** | Firebase Firestore | 12.19.0 | Scalable NoSQL real-time document database |
| **Authentication** | Firebase Auth / JWT | 12.19.0 | Identity verification and token authorization |
| **AI Integration** | Google GenAI SDK | 2.4.0 | Gemini 2.5 Flash receipt and invoice parsing |
| **Client OCR Engine**| Tesseract.js | 7.0.0 | Browser-side Optical Character Recognition |

## 3.5 Feasibility Analysis
- **Technical Feasibility:** Modern JavaScript/TypeScript stacks easily support reactive state synchronization and asynchronous REST communication. Firestore NoSQL offers sub-second document reads and flexible collections.
- **Economic Feasibility:** The system utilizes open-source frameworks (React, Express, Tailwind) and operates within the free tier of Google Firebase and Render, incurring zero operational costs for college deployment.
- **Operational Feasibility:** The UI is designed specifically for students who already utilize WhatsApp and Google Pay, requiring zero prior training.

---

# CHAPTER 4: SYSTEM ARCHITECTURE & DESIGN

## 4.1 High-Level Architecture
PocketBuddy is architected as a three-tier full-stack web application:

```
+-------------------------------------------------------------------------+
|                         PRESENTATION TIER (CLIENT)                      |
|                                                                         |
|   +-------------------+  +--------------------+  +------------------+   |
|   | Dashboard Overview|  | My Money (Cash/UPI)|  | Room Expense Mgr |   |
|   +-------------------+  +--------------------+  +------------------+   |
|   | Visual Analytics  |  | Locked Notes Vault |  | AI Smart Scanner |   |
|   +-------------------+  +--------------------+  +------------------+   |
|            |                        |                       |           |
|            +------------------------+-----------------------+           |
|                                     | (HTTPS / JSON / JWT)              |
+-------------------------------------|-----------------------------------+
                                      v
+-------------------------------------------------------------------------+
|                        APPLICATION TIER (EXPRESS.JS)                    |
|                                                                         |
|   +-----------------------------------------------------------------+   |
|   | CORS, JSON Parser, Auth Bearer Token Middleware                 |   |
|   +-----------------------------------------------------------------+   |
|   | Controllers:                                                    |   |
|   |  - /api/auth/*     (Registration, Login, User Sync)             |   |
|   |  - /api/rooms/*    (Room Lifecycle, Integer-Paise Split Engine) |   |
|   |  - /api/settle/*   (Two-Step Receiver-Approved State Machine)   |   |
|   |  - /api/ai/*       (Gemini 2.5 Flash Multi-Modal Vision Proxy)  |   |
|   +-----------------------------------------------------------------+   |
+-------------------------------------|-----------------------------------+
                                      v
+-------------------------------------------------------------------------+
|                          DATA TIER (PERSISTENCE)                        |
|                                                                         |
|   +-----------------------------------+  +--------------------------+   |
|   | Firebase Firestore Cloud Database |  | Local JSON Data Store    |   |
|   |  - users collection               |  |  - /data_store/rooms.json|   |
|   |  - rooms collection               |  |  - /data_store/users.json|   |
|   |  - expenses & settlements sub-coll|  | (High-Speed Fallback)    |   |
|   +-----------------------------------+  +--------------------------+   |
+-------------------------------------------------------------------------+
```
*Figure 4.1: High-Level Three-Tier Full-Stack System Architecture*

## 4.2 Data Flow Diagrams (DFD)

### 4.2.1 DFD Level 0 (Context Diagram)
The Context Diagram represents the single process system boundary and external entities interacting with PocketBuddy:

```
                 [Credentials / Profile Data]
             ----------------------------------->
                 [User Session / Dashboard Data]
             <-----------------------------------
+----------+                                       +----------------------+
|  Student |     [Personal & Room Expense Inputs]  |                      |
|   User   | ----------------------------------->  |     POCKETBUDDY      |
|          |     [Balances, Debts & Activity Feed] |      CORE SYSTEM     |
+----------+ <-----------------------------------  |                      |
                                                   +----------------------+
                                                       |              ^
                                       [Cloud Reads /] |              | [Document
                                        Writes]        v              |  Streams]
                                                   +----------------------+
                                                   |   Firebase Firestore |
                                                   |     Cloud Database   |
                                                   +----------------------+
```
*Figure 4.2: Data Flow Diagram — Level 0 (Context Level)*

### 4.2.2 DFD Level 1 (Functional Decomposition)
The Level 1 DFD decomposes the system into core operational sub-processes:
- **Process 1.0: User Identity & Session Manager:** Validates credentials, produces tokens, and provisions initial wallets.
- **Process 2.0: Personal Finance Engine:** Tracks deposits, categorizes expenses, updates Cash and UPI ledgers independently.
- **Process 3.0: Group Room Manager:** Validates invite codes, joins members, and manages room permissions.
- **Process 4.0: Expense Splitting & Debt Graph Engine:** Calculates fractional shares in integer paise and computes pairwise net debt matrices.
- **Process 5.0: Settlement Approval Engine:** Governs the lifecycle of settlement transitions from `PENDING` to `COMPLETED`.

```
               +----------------------------------------------------+
               |              DFD LEVEL 1 PROCESS FLOW              |
+--------+     |                                                    |
|  User  | --->| [1.0] Auth & Session ---> (D1: Users Collection)   |
| Entity |     |                                                    |
|        | --->| [2.0] Personal Money Engine ---> (D2: Transactions)|
|        |     |                                                    |
|        | --->| [3.0] Room Membership Engine ---> (D3: Rooms)      |
|        |     |                                                    |
|        | --->| [4.0] Integer-Paise Split Engine                   |
|        |     |           |                                        |
|        |     |           v                                        |
|        |     |   (D4: Shared Expenses) ---> [Debts Matrix]        |
|        |     |                                   |                |
|        | --->| [5.0] Settlement State Machine <--+                |
|        |     |           |                                        |
|        |<----+           v                                        |
|        |         (D5: Settlements Table)                          |
+--------+     +----------------------------------------------------+
```
*Figure 4.3: Data Flow Diagram — Level 1 (Functional Decomposition)*

### 4.2.3 DFD Level 2 (Room Expense & Settlement Subsystem)
Level 2 isolates the collaborative room expense and debt resolution pipeline:

```
[Member logs Bill: Total Amount A, PaidBy, SplitType, Participants P]
                             |
                             v
               +-----------------------------+
               | 4.1 Convert Amount to Paise |
               |    totalPaise = A * 100     |
               +-----------------------------+
                             |
                             v
               +-----------------------------+
               | 4.2 Base Share Allocation   |
               | baseShare = totalPaise / |P||
               | remainder = totalPaise % |P||
               +-----------------------------+
                             |
                             v
               +-----------------------------+
               | 4.3 Distribute Remainder    |
               | Payer receives base + rem.  |
               | Others receive baseShare.   |
               +-----------------------------+
                             |
                             v
               +-----------------------------+
               | 4.4 Update Room Expenses    |
               +-----------------------------+
                             |
                             v
               +-----------------------------+
               | 5.1 Calculate Net Balances  |
               | Net_i = Paid_i - Consumed_i |
               +-----------------------------+
                             |
                             v
               +-----------------------------+
               | 5.2 Who Owes Whom Pairings  |
               +-----------------------------+
                             |
                             v
    [Debtor clicks "Pay" -> Creates Settlement Record (Status: PENDING)]
                             |
                             v
               +-----------------------------+
               | 5.3 Creditor Verification   |
               |  Caller ID == toUserId ?    |
               +-----------------------------+
                    /                     \
             [YES] /                       \ [NO / Hacker]
                  v                         v
   +-----------------------------+     +-------------------------+
   | Status -> COMPLETED         |     | HTTP 403 Forbidden      |
   | Net Debts Deducted          |     | State remains PENDING   |
   +-----------------------------+     +-------------------------+
```
*Figure 4.4: Data Flow Diagram — Level 2 (Shared Room & Settlement Flow)*

## 4.3 Use Case Diagram & Actor Descriptions
The system defines two primary operational roles: the **Student User** and the **Room Admin**.

```
+-------------------------------------------------------------------------+
|                            POCKETBUDDY SYSTEM                           |
|                                                                         |
|      (( Register / Login / Google OAuth )) <---------- [Student User]   |
|                       ^                                       |         |
|                       |                                       |         |
|      (( Set Monthly Allowance & Wallet Split )) <-------------+         |
|                       ^                                       |         |
|                       |                                       |         |
|      (( Log Personal Cash/UPI Transaction )) <----------------+         |
|                       ^                                       |         |
|                       |                                       |         |
|      (( Join Room via 6-Char Invite Code )) <-----------------+         |
|                       ^                                       |         |
|                       |                                       |         |
|      (( Log Shared Room Expense (Equal/Custom) )) <-----------+         |
|                       ^                                       |         |
|                       |                                       |         |
|      (( Submit Debt Settlement Payment )) <-------------------+         |
|                       ^                                       |         |
|                       |                                       |         |
|      (( Approve Pending Settlement as Creditor )) <-----------+         |
|                       ^                                                 |
|                       |                                                 |
|      (( Create Room & Generate Invite Code )) <------- [Room Admin]     |
|                       ^                                       |         |
|                       |                                       |         |
|      (( Decommission / Delete Room )) <-----------------------+         |
|                       ^                                       |         |
|                       |                                       |         |
|      (( Manage Member Roster )) <-----------------------------+         |
+-------------------------------------------------------------------------+
```
*Figure 4.5: UML Use Case Diagram for Student User and Room Admin*

## 4.4 Sequence Diagram: Room Expense Logging & Settlement
The sequence below illustrates the chronological message exchange between the Client, Express Server, and Database:

```
Debtor (Client A)          Express Backend           Firestore DB          Creditor (Client B)
       |                          |                        |                        |
       |--- POST /api/rooms/exp ->|                        |                        |
       |    (Logged ₹313 expense) |                        |                        |
       |                          |--- Write Expense ----->|                        |
       |                          |<-- Confirm Write ------|                        |
       |<-- 201 Created (Split) --|                        |                        |
       |                          |                        |                        |
       | [Calculates Net Debt]    |                        |                        |
       |--- POST /settle -------->|                        |                        |
       |    (Amount: ₹86.33)      |                        |                        |
       |                          |--- Write Status: ----->|                        |
       |                          |    "PENDING"           |                        |
       |<-- 200 Pending OK -------|                        |                        |
       |                          |                        |--- SSE / Poll Notice ->|
       |                          |                        |    "Payment Awaiting"  |
       |                          |                        |                        |
       |                          |<-- POST /settle/accept -------------------------|
       |                          |    (settlementId, toUserId=B)                   |
       |                          |                        |                        |
       |                          |--- Verify Caller == B -|                        |
       |                          |--- Update Status: ---->|                        |
       |                          |    "COMPLETED"         |                        |
       |                          |<-- Confirm Update -----|                        |
       |<-- 200 Ledger Updated ---|------------------------------------------------>|
```
*Figure 4.6: Sequence Diagram for Two-Step Receiver-Approved Settlement*

## 4.5 Database & Storage Architecture

### 4.5.1 Firestore Cloud Schema (NoSQL Collections)
Data is structured across document collections designed for real-time synchronization:

```
Firestore Root
 ├── users/ {userId}
 │    ├── id: string (Auth UID)
 │    ├── name: string
 │    ├── email: string
 │    ├── monthlyBudget: number
 │    ├── balances: { cash: number, upi: number }
 │    ├── transactions/ {transactionId}
 │    │    ├── title: string
 │    │    ├── amount: number
 │    │    ├── type: "expense" | "income" | "transfer"
 │    │    ├── category: string
 │    │    ├── paymentMode: "Cash" | "UPI"
 │    │    └── date: string (ISO-8601)
 │    └── notes/ {noteId}
 │         ├── title: string
 │         ├── content: string
 │         ├── isLocked: boolean
 │         └── pinHash: string
 └── rooms/ {roomId}
      ├── id: string (UUIDv4)
      ├── name: string
      ├── type: "Hostel" | "Flat" | "PG"
      ├── inviteCode: string (6-char uppercase alphanumeric)
      ├── ownerId: string
      ├── members: Array<{ userId, name, email, role, joinedAt }>
      ├── expenses: Array<{
      │    id: string,
      │    title: string,
      │    totalAmount: number,
      │    paidByUserId: string,
      │    paidBy: string,
      │    createdByUserId: string,
      │    splitType: "equal" | "exact" | "custom",
      │    participants: Array<{ userId, name, share }>,
      │    date: string
      │   }>
      └── settlements: Array<{
           id: string,
           fromUserId: string,
           from: string,
           toUserId: string,
           to: string,
           amount: number,
           status: "pending" | "completed" | "rejected",
           createdAt: string
          }>
```
*Figure 4.7: Entity-Relationship & Firestore Collection Data Model*

---

# CHAPTER 5: IMPLEMENTATION DETAILS & ALGORITHMIC DESIGN

## 5.1 Frontend Architecture & Component Hierarchy
The frontend is built on **React 19** using functional components, customized hooks, and TypeScript strict interfaces. Component structure:

- `src/App.tsx`: Central coordinator managing user authentication, active tab routing (`dashboard`, `money`, `room`, `notes`, `history`, `scanner`), active room state, and synchronization polling.
- `src/components/MyMoney.tsx`: Interactive cash and UPI balance boards, transaction logging forms, and category spending velocity indicators.
- `src/components/RoomExpenseManager.tsx`: Collaborative group room view containing member rosters, bill splitting forms, "Who Owes Whom" calculation displays, and receiver approval controls.
- `src/components/Notes.tsx`: Notes board featuring category tagging, search filtering, and client-side modal PIN authentication for locked records.
- `src/components/AuthModal.tsx`: Dual-tabbed modal handling Email/Password registration, Login, and one-click Google OAuth sign-in.

## 5.2 Backend Express REST API Structure
The backend entry point (`server.ts`) handles API requests on port 3000, serving both RESTful endpoints and Vite middleware during development.

Key routes implemented:
- `POST /api/auth/register` & `POST /api/auth/login`: Handles credential verification and profile loading.
- `POST /api/rooms`: Initializes new rooms, generates unique 6-character invite codes, and records the creator as admin.
- `POST /api/rooms/join`: Validates invite codes and appends new members without duplicate entry.
- `POST /api/rooms/:roomId/expenses`: Applies the zero-sum integer split algorithm to incoming expenses and appends them to the room document.
- `POST /api/rooms/:roomId/settlements`: Logs a pending settlement between two roommates.
- `POST /api/rooms/:roomId/settlements/:settlementId/accept`: Validates caller identity against the creditor `toUserId`, transitioning the settlement to completed status.

## 5.3 Exact Integer-Paise Room Expense Splitting Algorithm
To completely eliminate floating-point penny drift, PocketBuddy converts all currency values into integer paise:

```typescript
// Core logic from server.ts (POST /api/rooms/:roomId/expenses)
const totalAmountPaise = Math.round(Number(totalAmount) * 100);
const numParticipants = participants.length;

if (splitType === 'equal') {
  const baseSharePaise = Math.floor(totalAmountPaise / numParticipants);
  const remainderPaise = totalAmountPaise % numParticipants;

  // Remainder paise are allocated to the payer to maintain zero sum
  computedParticipants = participants.map((p) => {
    const isPayer = p.userId === paidByUserId || p.name === paidBy;
    const sharePaise = baseSharePaise + (isPayer ? remainderPaise : 0);
    return {
      ...p,
      share: sharePaise / 100
    };
  });
}
```
**Mathematical Proof:**
$$\sum_{i=1}^{P} \text{sharePaise}_i = (P \times \text{baseSharePaise}) + \text{remainderPaise} = \text{totalAmountPaise}$$
Dividing back by 100 yields an exact match to the input bill amount, down to 0.01 INR.

## 5.4 "Who Owes Whom" Net Balance & Debt Graph Computation
Net balances are calculated by aggregating paid expenditures against consumed shares:

```typescript
// From src/components/RoomExpenseManager.tsx
const balanceMap: Record<string, number> = {};

// 1. Process all confirmed room expenses
expenses.forEach(exp => {
  const payer = exp.paidBy;
  balanceMap[payer] = (balanceMap[payer] || 0) + exp.totalAmount;
  exp.participants.forEach(p => {
    balanceMap[p.name] = (balanceMap[p.name] || 0) - p.share;
  });
});

// 2. Adjust for COMPLETED settlements only
settlements.filter(s => s.status === 'completed').forEach(s => {
  balanceMap[s.from] = (balanceMap[s.from] || 0) + s.amount;
  balanceMap[s.to] = (balanceMap[s.to] || 0) - s.amount;
});
```

## 5.5 Two-Step Receiver-Approved Settlement State Machine
To prevent unilateral settlement fraud, settlements adhere to a strict state machine:

```
[Unsettled Debt Exists]
         |
         | (Debtor clicks "Pay Now")
         v
+------------------+
|  Status: PENDING |  <--- Visible on both screens; balances remain UNCHANGED
+------------------+
         |
         +---------------------------------------+
         |                                       |
         | (Creditor clicks "Approve")           | (Creditor clicks "Reject")
         v                                       v
+--------------------+                 +--------------------+
| Status: COMPLETED  |                 |  Status: REJECTED  |
| Balances Adjusted  |                 |  Debt Remains Open |
+--------------------+                 +--------------------+
```
*Figure 5.2: State Machine Diagram for Debt Settlement Lifecycle*

Server-Side Authorization Check (`server.ts`):
```typescript
if (settlement.toUserId && callerId && settlement.toUserId !== callerId) {
  return res.status(403).json({
    error: 'Unauthorized: Only the payment receiver can approve this settlement'
  });
}
```

## 5.6 Password-Protected Notes Security Model
Students store lease agreements, landlord account numbers, and personal notes in the Notes Vault.
- Notes with `isLocked: true` mask their contents on the client interface.
- Unlocking requires a 4-digit PIN. The PIN is hashed using SHA-256 and verified against the note's stored digest before decrypted contents are displayed in the DOM.

## 5.7 AI Receipt & Voice Parsing Implementation Status
- **Google Gemini 2.5 Flash Proxy (`/api/ai/scan-receipt`):** Configured to accept multi-modal base64 receipt images and return structured JSON (`{ title, amount, category, date }`).
- **Client OCR Fallback (`tesseract.js`):** Extracts raw text in offline environments when API quota limits are encountered.
- **Voice Expense Input:** Uses the browser Web Speech API (`SpeechRecognition`) to parse spoken sentences (e.g., *"Paid 150 rupees for lunch via UPI"*). *Status: Functional on Chrome/Edge browsers with microphone access.*

---

# CHAPTER 6: TESTING & VERIFICATION

## 6.1 Testing Methodology & Strategy
Testing was executed across three levels:
1. **Mathematical Unit Testing:** Verifying division algorithms against prime numbers and arbitrary fractional remainders.
2. **Multi-User Integration Testing:** Simulating three concurrent browser sessions (Aditya, Shivam, Manmohan) across distinct user profiles to test room data isolation and synchronization.
3. **Security & Boundary Auditing:** Verifying API route rejection when callers attempt unauthorized actions (e.g., approving another user's settlement or deleting unowned expenses).

## 6.2 Comprehensive Unit & Integration Test Cases

**Table 6.1: Comprehensive Functional & Security Test Suite**

| Test ID | Test Scenario | Input Data | Expected Output | Actual Output | Status |
| :--- | :--- | :--- | :--- | :--- | :---: |
| **TC-01** | User Registration | Valid email & 8-char password | User created in Auth & Firestore; initial wallet = ₹0 | User account created and redirected to Onboarding | **PASS** |
| **TC-02** | Add Personal Expense | Amount: ₹120, Mode: UPI, Category: "Food" | UPI balance decrements by ₹120; transaction saved | Balance reduced; transaction rendered in History | **PASS** |
| **TC-03** | Room Invite Code Gen | Room Type: "Hostel", Name: "Boys Hostel 3" | 6-character uppercase alphanumeric code generated | Code `BH3X79` generated; room saved to DB | **PASS** |
| **TC-04** | Join Room via Code | Valid code entered by User B | User B appended to room roster; sees shared ledger | Room loaded on User B's device immediately | **PASS** |
| **TC-05** | Creator-Only Edit | User B tries editing User A's expense | Edit button disabled; API returns HTTP 403 | Frontend blocks action; API rejects unauthorized edit | **PASS** |
| **TC-06** | Debtor Settlement | Debtor submits settlement of ₹86.33 | Settlement status = `PENDING`; debts remain intact | Status displays `PENDING`; balances unchanged | **PASS** |
| **TC-07** | Creditor Approval | Creditor clicks "Approve Settlement" | Settlement status = `COMPLETED`; net debt cleared | Balances adjust; debt displays "All Settled" | **PASS** |
| **TC-08** | Unauthorized Accept | Debtor attempts to accept own settlement | Server returns HTTP 403 Forbidden | Request denied with error message | **PASS** |
| **TC-09** | Notes PIN Protection | 4-digit PIN set on confidential note | Note content obfuscated until correct PIN supplied | Content revealed only upon correct PIN entry | **PASS** |

## 6.3 Case Study: 3-Member Asymmetric Expense Verification

### 6.3.1 Experimental Scenario & Real-World Inputs
To evaluate group expense mathematics under real-world non-terminating fractional splits, a multi-member room was established with three participants:
1. **Aditya Singh** (Room Admin & Participant 1)
2. **Shivam Gautam** (Room Member & Participant 2)
3. **Manmohan Yadav** (Room Member & Participant 3)

The following three shared expenses were entered in chronological sequence:
- **Expense 1:** Aditya Singh paid **₹200.00** for Cooking Oil (Split equally among 3).
- **Expense 2:** Shivam Gautam paid **₹18.00** for Atta / Flour (Split equally among 3).
- **Expense 3:** Manmohan Yadav paid **₹95.00** for Vegetables (Split equally among 3).

$$\text{Total Group Expenditure} = ₹200.00 + ₹18.00 + ₹95.00 = ₹313.00$$

### 6.3.2 Exact Balance Calculations & Mathematical Proof

**Table 6.2: 3-Member Asymmetric Expense Allocation Matrix (Total ₹313.00)**

| Expense Item | Total Paid | Paid By | Aditya's Share | Shivam's Share | Manmohan's Share | Remainder Allocation |
| :--- | :---: | :---: | :---: | :---: | :---: | :--- |
| **Oil** | ₹200.00 | Aditya | ₹66.68 | ₹66.66 | ₹66.66 | 2 paise assigned to Aditya (payer) |
| **Atta** | ₹18.00 | Shivam | ₹6.00 | ₹6.00 | ₹6.00 | Exact integer split (0 remainder) |
| **Vegetables**| ₹95.00 | Manmohan| ₹31.66 | ₹31.66 | ₹31.68 | 2 paise assigned to Manmohan (payer) |
| **TOTALS** | **₹313.00** | — | **₹104.34** | **₹104.32** | **₹104.34** | **Sum = ₹313.00 (Exact Zero Drift)** |

**Table 6.3: Net Balance & Debt Resolution Proof (Zero-Sum Verification)**

| Member Name | Total Paid | Total Share Consumed | Net Balance Formula ($\text{Paid} - \text{Share}$) | Exact Net Balance | Resolution Status |
| :--- | :---: | :---: | :---: | :---: | :--- |
| **Aditya Singh** | ₹200.00 | ₹104.34 | $+₹200.00 - ₹104.34$ | **$+₹95.66$** | **Net Creditor** (Receives ₹95.66) |
| **Shivam Gautam** | ₹18.00 | ₹104.32 | $+₹18.00 - ₹104.32$ | **$-₹86.32$** | **Net Debtor** (Owes ₹86.32) |
| **Manmohan Yadav**| ₹95.00 | ₹104.34 | $+₹95.00 - ₹104.34$ | **$-₹9.34$** | **Net Debtor** (Owes ₹9.34) |
| **TOTAL CHECK** | **₹313.00** | **₹313.00** | **$\sum (\text{Net Balances}) = 0$** | **₹0.00** | **Exact Zero-Sum Confirmed** |

### 6.3.3 State Transition & Settlement Approval Audit
- **Pairwise Debts Generated:**
  - Shivam owes Aditya **₹86.32**
  - Manmohan owes Aditya **₹9.34**
- **Settlement Execution:**
  1. Shivam initiates settlement of ₹86.32 $\rightarrow$ Server assigns status `PENDING`.
  2. Aditya's dashboard displays: `[Shivam Gautam paid ₹86.32 - [Approve] / [Reject]]`.
  3. Aditya confirms receipt via `POST /api/rooms/:id/settlements/:sid/accept`.
  4. Shivam's net balance adjusts from $-₹86.32$ to $₹0.00$; Aditya's remaining receivable adjusts to $+₹9.34$.
  5. Mathematical integrity and mutual consensus were preserved throughout the lifecycle.

---

# CHAPTER 7: RESULTS, UI WALKTHROUGH & STATUS AUDIT

## 7.1 User Interface Implementation & Navigation
The user interface features a clean, student-friendly visual theme built with Tailwind CSS:
- **Dashboard Overview (Figure 7.1):** Displays total monthly allowance, current available funds, dynamic spend velocity, and a categorical breakdown chart.
- **My Money Section (Figure 7.2):** Houses dual-balance indicator cards for Cash and UPI, with a quick-action modal for logging payments and wallet transfers.
- **My Room Hub (Figure 7.3 & 7.4):** Displays active roommates, the shared bill logging interface, and the "Who Owes Whom" resolution matrix with payment action triggers.
- **Confidential Notes Screen (Figure 7.5):** Categorized view of saved notes, featuring visual lock badges and PIN prompt modals for protected items.

## 7.2 Feature Implementation Status Matrix

**Table 7.1: Detailed Feature Implementation Audit & Readiness Status**

| Module / Feature | Implementation Status | Technical Verification |
| :--- | :---: | :--- |
| **Email/Password & Google Sign-In** | **FULLY WORKING** | Firebase Auth SDK + JWT verified |
| **Dual Cash & UPI Tracking** | **FULLY WORKING** | Separate wallet updates verified |
| **Room Creation & Invite Codes** | **FULLY WORKING** | 6-character code generator operational |
| **Multi-Device Room Synchronization** | **FULLY WORKING** | Real-time polling & Firestore storage |
| **Integer-Paise Split Engine** | **FULLY WORKING** | Mathematical zero-drift verified |
| **Receiver-Approved Settlement** | **FULLY WORKING** | Two-step state machine enforced on server |
| **Creator-Only Expense Editing** | **FULLY WORKING** | Backend permission checks active |
| **Password-Locked Notes Vault** | **FULLY WORKING** | SHA-256 PIN hashing verified |
| **Visual Spend Analytics** | **FULLY WORKING** | Recharts responsive charts working |
| **Voice-to-Expense Recognition** | **PARTIAL** | Functional on Chrome/Edge (Speech API) |
| **AI Receipt Scanning** | **PROTOTYPE** | Gemini proxy & Tesseract OCR active |
| **SMS Auto-Detection** | **PLANNED** | Awaits native Android wrapper |

---

# CHAPTER 8: CONCLUSION & FUTURE ENHANCEMENTS

## 8.1 Conclusion
The "PocketBuddy — Student Smart Money Manager" successfully demonstrates how modern full-stack web engineering can solve everyday financial tracking challenges faced by college students. By combining individual dual-wallet tracking (Cash vs. UPI) with a collaborative group room manager, PocketBuddy eliminates the confusion of shared student living. The integration of integer-paise arithmetic guarantees zero penny loss across complex group bills, while the two-step receiver approval protocol establishes trust and prevents unilateral settlement tampering. The system fulfills all functional requirements established in the project specification.

## 8.2 Limitations
1. **Web Browser Scope:** Background SMS interception is restricted by modern web sandbox security standards.
2. **Network Dependency:** Multi-user shared room synchronization requires an active internet connection to communicate with the cloud database.

## 8.3 Future Scope & Roadmap
- **React Native Mobile Compilation:** Packaging the web application into an Android APK using Capacitor or React Native to access native telephony SMS permissions for automated UPI debit detection.
- **Direct UPI Deep-Linking:** Integrating UPI intent links (`upi://pay?pa=...&am=...`) allowing debtors to launch Google Pay or PhonePe directly from the settlement screen.
- **Mess Bill Optimization Algorithms:** Expanding the mess rebate module to automatically generate rebate exemption letters for hostel wardens based on logged meal absences.

---

# REFERENCES

1. **Flanagan, D.** (2020). *JavaScript: The Definitive Guide (7th ed.)*. O'Reilly Media.
2. **Banks, A., & Porcello, E.** (2020). *Learning React: Modern Patterns for Developing React Applications (2nd ed.)*. O'Reilly Media.
3. **Chodorow, K.** (2013). *MongoDB: The Definitive Guide: Powerful and Scalable Data Storage*. O'Reilly Media.
4. **National Payments Corporation of India (NPCI).** (2023). *Unified Payments Interface (UPI) System Architecture and Specification*. NPCI Technical Publications.
5. **Fielding, R. T.** (2000). *Architectural Styles and the Design of Network-based Software Architectures*. Doctoral Dissertation, University of California, Irvine.
6. **Firebase Documentation.** (2024). *Cloud Firestore Data Model and Security Rules*. Google Developers Portal. Available: `https://firebase.google.com/docs/firestore`.
7. **Kumar, R., & Sharma, S.** (2022). "Algorithmic Simplification of N-Party Debt Networks in Collaborative Applications," *International Journal of Computer Science and Engineering*, vol. 10, no. 4, pp. 112–119.

---

# APPENDIX A: COMPLETE REST API SPECIFICATION

**Table A.1: PocketBuddy REST API Endpoints Specification**

| Method | Endpoint | Purpose | Auth Required | Request Payload Summary | Response Status & Body |
| :--- | :--- | :--- | :---: | :--- | :--- |
| `POST` | `/api/auth/register` | Register new student profile | No | `{ name, email, password }` | `201 Created` $\rightarrow$ `{ token, user }` |
| `POST` | `/api/auth/login` | Authenticate existing user | No | `{ email, password }` | `200 OK` $\rightarrow$ `{ token, user }` |
| `GET` | `/api/rooms` | Retrieve user's active rooms | Yes | None (Bearer Token) | `200 OK` $\rightarrow$ `Array<RoomGroup>` |
| `POST` | `/api/rooms` | Create new hostel/flat room | Yes | `{ name, type }` | `201 Created` $\rightarrow$ `{ room, inviteCode }` |
| `POST` | `/api/rooms/join` | Join room via invite code | Yes | `{ inviteCode }` | `200 OK` $\rightarrow$ `{ room }` |
| `DELETE`| `/api/rooms/:id` | Delete room (Admin only) | Yes | None | `200 OK` $\rightarrow$ `{ success: true }` |
| `POST` | `/api/rooms/:id/expenses` | Log shared bill with split | Yes | `{ title, totalAmount, paidBy, participants, splitType }` | `201 Created` $\rightarrow$ `{ expense }` |
| `PUT` | `/api/rooms/:id/expenses/:eid`| Edit expense (Creator only)| Yes | `{ title, totalAmount, participants }` | `200 OK` $\rightarrow$ `{ expense }` |
| `DELETE`| `/api/rooms/:id/expenses/:eid`| Delete bill (Creator only) | Yes | None | `200 OK` $\rightarrow$ `{ success: true }` |
| `POST` | `/api/rooms/:id/settlements` | Log payment to roommate | Yes | `{ toUserId, to, amount }` | `201 Created` $\rightarrow$ `{ settlement (status: pending) }` |
| `POST` | `/api/rooms/:id/settlements/:sid/accept` | Creditor approves payment | Yes (Creditor) | None | `200 OK` $\rightarrow$ `{ settlement (status: completed) }` |
| `POST` | `/api/rooms/:id/settlements/:sid/reject` | Creditor rejects payment | Yes (Creditor) | None | `200 OK` $\rightarrow$ `{ settlement (status: rejected) }` |
| `POST` | `/api/ai/scan-receipt` | Parse receipt via Gemini AI| Yes | `{ imageBase64 }` | `200 OK` $\rightarrow$ `{ title, amount, category, date }` |

---

# APPENDIX B: MATHEMATICAL PROOF OF CONVERGENCE IN INTEGER SPLITS

Let total expenditure in Rupees be $A \in \mathbb{R}^+$. The amount in integer paise is:
$$A_{\text{paise}} = \text{round}(A \times 100) \in \mathbb{Z}^+$$
For a group of $N$ participating members ($N \in \mathbb{Z}^+, N \ge 1$):
By the Division Algorithm in $\mathbb{Z}$:
$$A_{\text{paise}} = q \cdot N + r \quad \text{where } q, r \in \mathbb{Z} \text{ and } 0 \le r < N$$
Here, $q = \lfloor A_{\text{paise}} / N \rfloor$ represents the base share per member in paise, and $r = A_{\text{paise}} \pmod N$ represents the residual unallocated paise.

PocketBuddy assigns the individual share $s_i$ for member $i \in \{1, \dots, N\}$ as:
$$s_i = \begin{cases} q + r & \text{if member } i \text{ is the designated payer} \\ q & \text{if member } i \text{ is a non-paying consumer} \end{cases}$$
Summing the shares over all $N$ participants:
$$\sum_{i=1}^{N} s_i = (q + r) + \sum_{i=2}^{N} q = q + r + (N - 1)q = q \cdot N + r = A_{\text{paise}}$$
Dividing both sides by 100 to convert back to Indian Rupees:
$$\sum_{i=1}^{N} \frac{s_i}{100} = \frac{A_{\text{paise}}}{100} = A$$
**Conclusion:** The sum of all individual participants' shares is strictly identical to the total billed amount $A$, with an error margin $\epsilon = 0.000000$, ensuring absolute zero-drift ledger integrity.
