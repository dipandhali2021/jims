import { PrismaClient } from '@prisma/client'; 
const prisma = new PrismaClient();
async function main() {
  const trans = await prisma.transaction.findFirst();
  console.log('Transaction structure:');
  console.log(JSON.stringify(trans, null, 2));
  process.exit(0);
}
main().catch(e => console.error(e));
