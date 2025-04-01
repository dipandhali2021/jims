# Jewelry Shop Inventory Management System

## Overview

A modern, secure web-based inventory management system designed for jewelry shops. This system streamlines daily operations, maintains accurate stock levels, and facilitates smooth sales processes. Built to handle approximately 250 jewelry items with complete product details and real-time inventory tracking.

## Key Features

### Inventory Management
- Comprehensive product catalog with detailed item information
- Real-time stock tracking and low inventory alerts
- Complete history logging of inventory changes
- Advanced search and filtering capabilities
- Product categorization (necklaces, rings, bracelets, etc.)

### User Roles & Access Control
#### Admin (Owner)
- Full system access
- Inventory management
- Sales approval workflow
- User management
- Access to audit logs and security settings
- Reporting capabilities

#### Shopkeeper (Worker)
- Day-to-day operations access
- Inventory view access
- Sales request initiation
- Order status management
- New product addition (subject to approval)

### Order Processing & Workflow
- Real-time inventory verification
- Structured sales request workflow
- Order status tracking
- Automated inventory updates post-approval

### Product Management
- Detailed product listings with images
- Mobile-responsive design
- Advanced sorting and filtering
- Product addition/editing with validation
- Image upload support

## Technical Stack

- Frontend: React + TypeScript
- Styling: TailwindCSS
- Build Tool: Vite
- Type Checking: TypeScript
- Code Quality: ESLint
- CSS Processing: PostCSS

## Getting Started

### Prerequisites
```bash
- Node.js (v16 or higher)
- npm (v7 or higher)
```

### Installation
1. Clone the repository:
```bash
git clone [repository-url]
```

2. Install dependencies:
```bash
npm install
```

3. Start the development server:
```bash
npm run dev
```

4. Build for production:
```bash
npm run build
```

## Project Structure
```
src/               # Source files
├── components/    # React components
├── pages/        # Page components
├── services/     # API services
├── store/        # State management
└── types/        # TypeScript types

public/           # Static files
```

## Workflow Process

1. **Inventory Check**
   - System validates available quantities
   - Real-time stock level verification

2. **Sales Request**
   - Shopkeeper initiates request
   - Includes product details and quantity
   - Customer information captured

3. **Approval Process**
   - Owner reviews sales requests
   - Automated inventory updates upon approval
   - Rejection feedback if declined

4. **Product Management**
   - Add new products with full details
   - Update existing inventory
   - Automated stock tracking

## Contributing

1. Fork the repository
2. Create your feature branch
3. Commit your changes
4. Push to the branch
5. Open a pull request

## License

This project is licensed under the MIT License - see the LICENSE file for details.