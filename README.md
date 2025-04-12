# Jewelry Shop Inventory Management System

A comprehensive jewelry shop management system built with Next.js, featuring role-based authentication, inventory management, and sales request workflows.

## Implemented Features

### 1. User Roles & Permissions
The system implements role-based access control (RBAC) with two user types:
- **Admin (Owner)**: Full control over inventory and sales approval
- **Shopkeeper (Worker)**: Can browse products and create sales requests

### 2. Product Management
Products are managed with jewelry-specific attributes:
- Product ID tracking
- Detailed product information (name, description, category)
- Material specification
- Price and stock management
- Image support
- Automated inventory tracking

### 3. Sales Request Workflow
Streamlined process for handling sales:
- Shopkeepers can create single or bulk sales requests
- Customer information tracking
- Real-time stock validation
- Automated total value calculation
- Status tracking (Pending, Approved, Rejected)
- Unique request ID generation (Format: SR-YYYY-XXXX)

### 4. Notification System
Real-time notifications for:
- Sales request status updates
- New request notifications
- Unread notification tracking
- Interactive notification interface

## System Workflows

### Sales Request Workflow
```mermaid
flowchart TD
    A[Shopkeeper] -->|Creates| B[Sales Request]
    B -->|Notifies| C[Admin]
    C -->|Reviews| D{Decision}
    D -->|Approve| E[Update Inventory]
    E -->|Notify| A
    D -->|Reject| F[Send Feedback]
    F -->|Notify| A
    style A fill:#f9f,stroke:#333
    style C fill:#bbf,stroke:#333
    style D fill:#dfd,stroke:#333
```

### User Role Interaction
```mermaid
flowchart LR
    A[Admin] -->|Manages| B[Products]
    A -->|Approves| C[Sales Requests]
    D[Shopkeeper] -->|Views| B
    D -->|Creates| C
    B -->|Stock Updates| E[Notifications]
    C -->|Status Changes| E
    E -->|Alerts| A
    E -->|Alerts| D
    style A fill:#bbf,stroke:#333
    style D fill:#f9f,stroke:#333
    style E fill:#dfd,stroke:#333
```

## Getting Started

### Prerequisites
- Node.js (v14 or later)
- PostgreSQL database
- NPM or Yarn

### Installation

1. Clone the repository:
```bash
git clone [repository-url]
cd jewelry-management-system
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
Create a `.env.local` file with required configuration.

4. Initialize the database:
```bash
npx prisma db push
npx prisma generate
```

5. Start the development server:
```bash
npm run dev
```

## Tech Stack

- **Frontend**: Next.js with TypeScript
- **Database**: PostgreSQL with Prisma ORM
- **UI Components**: Custom components with Tailwind CSS
- **State Management**: React Hooks
- **API**: Next.js API routes

## License

This project is licensed under the MIT License.
