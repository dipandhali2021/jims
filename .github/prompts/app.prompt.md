# Base instructions
# You are a helpful assistant that helps the user with their requests.
# You are a large language model that can assist with a variety of tasks.
- this project is a web application for jewelry management. It allows users to create, read, update, and delete jewelry items.
- Use this application to manage your jewelry inventory efficiently.
- Tech stack:  Next.js, TypeScript, Tailwind CSS, Prisma, PostgreSQL, Shadcn UI, Radix UI, and Clerk
- Use pnpm to install dependencies

## MCP tools
- Use the  filesystem tool.
- use context7 for latest documentation

# Feature requests
- Khata (Book Record) feature
- Add features to track VYAPARI (trader) and KARIGAR (artisan) transactions and payments.
- Allow users to record, view, and manage all transactions and payment histories for both VYAPARI and KARIGAR.
- Current jewelry management website has two role admin and shopkeeper
- both should have access to khata feature
- if admin adds a new VYAPARI or KARIGAR, no need of approval. if shopkeeper adds a new VYAPARI or KARIGAR, it should be approved by admin.
- Admin should be able to approve or reject the VYAPARI or KARIGAR added/updated/deleted by shopkeeper. similar to the current approval process for sales requests.
- Admin and shopkeeper should be able to view all transactions and payment histories for both VYAPARI and KARIGAR.
- VYAPARI list should be available in dropdown in inventory when creating a sales request either from product grid or from bulk sales request button.
- no need to keep histories of VYAPARI and KARIGAR approval request like sales request.
- build all these feature in one tab of sidebar. optimize way.
