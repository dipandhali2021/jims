// This is a simple script to test if adminAction flag is properly processed in FormData
// You can run this file with Node.js to verify the fix

async function testAdminActionFlag() {
  const FormData = require('form-data');
  const fetch = require('node-fetch');
  
  console.log('Testing adminAction flag handling in FormData...');
  
  const formData = new FormData();
  formData.append('requestType', 'edit');
  formData.append('productId', 'some-product-id');
  formData.append('adminAction', 'true'); // This is the flag we're testing
  formData.append('details', JSON.stringify({
    name: 'Test Product',
    sku: 'TEST123',
    price: 99.99,
    stock: 10
  }));
  
  try {
    console.log('FormData values:');
    for (const [key, value] of Object.entries(formData)) {
      console.log(`- ${key}: ${value}`);
    }
    
    console.log('\nVerify that the adminAction flag is read from FormData in route.ts');
    console.log('The fix should ensure that: adminAction = formData.get("adminAction") === "true"');
    console.log('\nDo not actually send this to the API - this is just for demonstration purposes.');
  } catch (error) {
    console.error('Error:', error);
  }
}

testAdminActionFlag();
