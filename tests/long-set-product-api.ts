// Test script for long set product API endpoints
// This script is used for testing the long set product API endpoints in the development environment

async function testLongSetProductAPI() {
  // Define base URL for API
  const BASE_URL = 'http://localhost:3000/api/products/long-set';

  try {
    console.log('Starting Long Set Product API Test');

    // TEST 1: Create a new long set product
    const newProductData = {
      name: 'Test Long Set Product',
      sku: 'LS-TEST-001',
      description: 'This is a test long set product',
      category: 'Necklaces',
      material: 'Gold',
      price: 12500.00,
      costPrice: 10000.00,
      stock: 5,
      parts: [
        {
          partName: 'Pendant',
          partDescription: 'Main pendant part',
          costPrice: 6000.00,
          karigarId: null // Should be replaced with an actual karigar ID for testing
        },
        {
          partName: 'Chain',
          partDescription: 'Gold chain part',
          costPrice: 4000.00,
          karigarId: null // Should be replaced with an actual karigar ID for testing
        }
      ]
    };

    console.log('Test 1: Creating a new long set product...');
    
    const createResponse = await fetch(BASE_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(newProductData)
    });

    if (!createResponse.ok) {
      const errorData = await createResponse.json();
      throw new Error(`Failed to create long set product: ${errorData.error}`);
    }

    const createdProduct = await createResponse.json();
    console.log('Test 1 Result: Product created successfully', createdProduct);

    // TEST 2: Get the created product
    console.log(`Test 2: Fetching product with ID ${createdProduct.id}...`);
    
    const getResponse = await fetch(`${BASE_URL}/${createdProduct.id}`);
    
    if (!getResponse.ok) {
      const errorData = await getResponse.json();
      throw new Error(`Failed to fetch long set product: ${errorData.error}`);
    }
    
    const fetchedProduct = await getResponse.json();
    console.log('Test 2 Result: Product fetched successfully', fetchedProduct);

    // TEST 3: Update the product
    const updatedProductData = {
      name: 'Updated Long Set Product',
      sku: 'LS-TEST-001-U',
      description: 'This is an updated test long set product',
      category: 'Necklaces',
      material: 'Gold',
      price: 13500.00,
      costPrice: 11000.00,
      stock: 3,
      parts: [
        {
          partName: 'Pendant Updated',
          partDescription: 'Main pendant part updated',
          costPrice: 7000.00,
          karigarId: null
        },
        {
          partName: 'Chain Updated',
          partDescription: 'Gold chain part updated',
          costPrice: 4000.00,
          karigarId: null
        }
      ]
    };

    console.log(`Test 3: Updating product with ID ${createdProduct.id}...`);
    
    const updateResponse = await fetch(`${BASE_URL}/${createdProduct.id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(updatedProductData)
    });

    if (!updateResponse.ok) {
      const errorData = await updateResponse.json();
      throw new Error(`Failed to update long set product: ${errorData.error}`);
    }

    const updatedProduct = await updateResponse.json();
    console.log('Test 3 Result: Product updated successfully', updatedProduct);

    // TEST 4: Delete the product
    console.log(`Test 4: Deleting product with ID ${createdProduct.id}...`);
    
    const deleteResponse = await fetch(`${BASE_URL}/${createdProduct.id}`, {
      method: 'DELETE'
    });

    if (!deleteResponse.ok) {
      const errorData = await deleteResponse.json();
      throw new Error(`Failed to delete long set product: ${errorData.error}`);
    }

    const deleteResult = await deleteResponse.json();
    console.log('Test 4 Result: Product deleted successfully', deleteResult);

    console.log('Long Set Product API Test Completed Successfully');
  } catch (error) {
    console.error('Long Set Product API Test Error:', error);
  }
}

// To run this test, uncomment the line below
// testLongSetProductAPI();

export { testLongSetProductAPI };
