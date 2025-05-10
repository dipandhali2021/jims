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
- BILL GENERATION
    - bill button in sidebar
    - When an admin approves a SALES REQUEST, provide two options: "Create bill with GST" and "Create bill without GST".
    - Once an option is chosen (e.g., "Create bill with GST"), the other option (e.g., "Create bill without GST") cannot be used for that specific transaction.
    - In UI show like this after admin approves a SALES REQUEST:
        - open a dialofue with two options in top tab select GST and NON GST
        - according to the schema prepare the GST and NON GST bills.            
    - Implement a separate bill page to track all bills.
    - Automatically delete all bills (both GST and non-GST) that are older than two months from the current date.
    - Provide functionality for manual deletion of individual bills (both GST and non-GST).
    - Implement search functionality on the BILLS PAGE, allowing searches based on customer name.
    - Implement MANUAL BILL CREATION (i.e., FAKE BILLS) that are not stored in the database and not displayed on the sales or bill dashboards.
        - This feature should support creating bills both with and without GST.
    - On the BILLS PAGE, add the ability to edit existing bills.
        - Allow admins to update bill details and save changes.
    - Add a "Print Bill" feature for each bill.
        - Clicking "Print" should open a printable view of the bill in a beautiful, well-formatted layout.
        - Ensure the printed format is clean, professional, and suitable for sharing with customers.


