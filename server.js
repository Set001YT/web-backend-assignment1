const express = require('express');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = 3000;
const DATA_FILE = path.join(__dirname, 'data.json');

// Middleware for JSON parsing
app.use(express.json());

// ============================================
// TEST ROUTES (for checking the server)
// ============================================

// GET / - returns "Server is running"
app.get('/', (req, res) => {
  res.send('Server is running');
});

// GET /hello - returns JSON
app.get('/hello', (req, res) => {
  res.json({ message: "Hello from server!" });
});

// GET /time - returns current server time
app.get('/time', (req, res) => {
  const currentTime = new Date().toLocaleString();
  res.json({ 
    serverTime: currentTime,
    timestamp: Date.now()
  });
});

// GET /status - returns 200 OK and "Server is healthy"
app.get('/status', (req, res) => {
  res.status(200).json({ 
    status: "OK",
    message: "Server is healthy"
  });
});

// ============================================
// Additional functions for work with JSON
// ============================================

// Function for reading a data from data.json
function readData() {
  try {
    const data = fs.readFileSync(DATA_FILE, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    console.error('Error reading data.json:', error);
    return { products: [] };
  }
}

// Function for writing a data in data.json
function writeData(data) {
  try {
    fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2), 'utf8');
    return true;
  } catch (error) {
    console.error('Error writing to data.json:', error);
    return false;
  }
}

// ============================================
// CRUD API FOR PRODUCTS (Restaurant meals)
// ============================================

// GET /products - get all products
app.get('/products', (req, res) => {
  const data = readData();
  res.json(data.products);
});

// GET /products/:id - get one product using ID
app.get('/products/:id', (req, res) => {
  const data = readData();
  const productId = parseInt(req.params.id);
  
  const product = data.products.find(p => p.id === productId);
  
  if (!product) {
    return res.status(404).json({ 
      error: "Product not found",
      message: `Product with id ${productId} does not exist`
    });
  }
  
  res.json(product);
});

// POST /products - create a new product
app.post('/products', (req, res) => {
  const data = readData();
  
  // Валидация: проверяем что есть name
  if (!req.body.name) {
    return res.status(400).json({ 
      error: "Validation error",
      message: "Field 'name' is required"
    });
  }
  
  // Creating a new product
  const newProduct = {
    id: data.products.length > 0 
      ? Math.max(...data.products.map(p => p.id)) + 1 
      : 1,
    name: req.body.name,
    description: req.body.description || "",
    price: req.body.price || 0,
    category: req.body.category || "Other"
  };

  // Adding to the array
  data.products.push(newProduct);
  
  // Saving to the file
  if (writeData(data)) {
    res.status(201).json(newProduct);
  } else {
    res.status(500).json({ error: "Failed to save data" });
  }
});

// PUT /products/:id - update a product
app.put('/products/:id', (req, res) => {
  const data = readData();
  const productId = parseInt(req.params.id);
  
  // Finding product's index
  const index = data.products.findIndex(p => p.id === productId);
  
  if (index === -1) {
    return res.status(404).json({ 
      error: "Product not found",
      message: `Product with id ${productId} does not exist`
    });
  }
  
  // Updating fields (только те что пришли в запросе)
  if (req.body.name !== undefined) {
    data.products[index].name = req.body.name;
  }
  if (req.body.description !== undefined) {
    data.products[index].description = req.body.description;
  }
  if (req.body.price !== undefined) {
    data.products[index].price = req.body.price;
  }
  if (req.body.category !== undefined) {
    data.products[index].category = req.body.category;
  }
  
  // Saving
  if (writeData(data)) {
    res.json(data.products[index]);
  } else {
    res.status(500).json({ error: "Failed to save data" });
  }
});

// DELETE /products/:id - delete a product
app.delete('/products/:id', (req, res) => {
  const data = readData();
  const productId = parseInt(req.params.id);
  
  // Finding product's index
  const index = data.products.findIndex(p => p.id === productId);
  
  if (index === -1) {
    return res.status(404).json({ 
      error: "Product not found",
      message: `Product with id ${productId} does not exist`
    });
  }
  
  // Deleting the products
  data.products.splice(index, 1);
  
  // Saving
  if (writeData(data)) {
    res.json({ 
      success: true,
      message: `Product with id ${productId} was deleted`
    });
  } else {
    res.status(500).json({ error: "Failed to save data" });
  }
});

// ============================================
// SERVER BOOT
// ============================================

app.listen(PORT, () => {
  console.log(` Server is running on http://localhost:${PORT}`);
  console.log(` Test routes:`);
  console.log(`  GET  http://localhost:${PORT}/`);
  console.log(`  GET  http://localhost:${PORT}/hello`);
  console.log(`  GET  http://localhost:${PORT}/time`);
  console.log(`  GET  http://localhost:${PORT}/status`);
  console.log(` CRUD routes:`);
  console.log(`  GET    http://localhost:${PORT}/products`);
  console.log(`  POST   http://localhost:${PORT}/products`);
  console.log(`  GET    http://localhost:${PORT}/products/id`);
  console.log(`  PUT    http://localhost:${PORT}/products/id`);
  console.log(`  DELETE http://localhost:${PORT}/products/id`);
});
