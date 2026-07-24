/* global checkAnswer */

// State Variables
let activeModule = 0;
let activeLesson = 0;
let userProgress = JSON.parse(localStorage.getItem('mongoHubProgress')) || {
  completedLessons: [],
  completedQuizzes: [],
};

// Mock MongoDB Database — Realistic Datasets (e-commerce, IoT, analytics)
const mockDB = {
  // ─── Users (e-commerce) ───
  users: [
    { _id: '5f8a3d12b5a9c2a1d8f7e6a1', name: 'Alice Johnson', email: 'alice@example.com', status: 'A', age: 28, role: 'admin', address: { city: 'New York', state: 'NY' }, joined: new Date('2023-01-15'), lastLogin: new Date('2024-06-10') },
    { _id: '5f8a3d12b5a9c2a1d8f7e6a2', name: 'Bob Smith', email: 'bob@example.com', status: 'A', age: 34, role: 'user', address: { city: 'San Francisco', state: 'CA' }, joined: new Date('2023-03-20'), lastLogin: new Date('2024-06-12') },
    { _id: '5f8a3d12b5a9c2a1d8f7e6a3', name: 'Charlie Brown', email: 'charlie@example.com', status: 'D', age: 41, role: 'user', address: { city: 'Chicago', state: 'IL' }, joined: new Date('2022-11-01'), lastLogin: new Date('2024-01-05') },
    { _id: '5f8a3d12b5a9c2a1d8f7e6a4', name: 'Diana Prince', email: 'diana@example.com', status: 'A', age: 29, role: 'admin', address: { city: 'New York', state: 'NY' }, joined: new Date('2023-06-10'), lastLogin: new Date('2024-06-14') },
    { _id: '5f8a3d12b5a9c2a1d8f7e6a5', name: 'Eve Wilson', email: 'eve@example.com', status: 'A', age: 25, role: 'user', address: { city: 'Austin', state: 'TX' }, joined: new Date('2024-02-01'), lastLogin: new Date('2024-06-15') },
  ],
  // ─── Products (e-commerce) ───
  products: [
    { _id: 'p1', name: 'UltraBook Pro 15', price: 1299, category: 'Electronics', stock: 45, rating: 4.5, tags: ['laptop', 'ultrabook', 'premium'] },
    { _id: 'p2', name: 'Ceramic Coffee Mug', price: 18, category: 'Kitchen', stock: 200, rating: 4.2, tags: ['mug', 'ceramic', 'gift'] },
    { _id: 'p3', name: 'Ergonomic Desk Chair', price: 349, category: 'Furniture', stock: 30, rating: 4.7, tags: ['chair', 'office', 'ergonomic'] },
    { _id: 'p4', name: 'Wireless Noise-Canceling Headphones', price: 249, category: 'Electronics', stock: 78, rating: 4.8, tags: ['headphones', 'wireless', 'audio'] },
    { _id: 'p5', name: 'Stainless Steel Water Bottle', price: 25, category: 'Kitchen', stock: 150, rating: 4.3, tags: ['bottle', 'stainless', 'eco-friendly'] },
    { _id: 'p6', name: 'Standing Desk Converter', price: 199, category: 'Furniture', stock: 22, rating: 4.1, tags: ['desk', 'standing', 'office'] },
    { _id: 'p7', name: 'Mechanical Keyboard RGB', price: 89, category: 'Electronics', stock: 120, rating: 4.6, tags: ['keyboard', 'mechanical', 'gaming'] },
    { _id: 'p8', name: 'Smart LED Desk Lamp', price: 59, category: 'Electronics', stock: 65, rating: 4.4, tags: ['lamp', 'smart', 'led'] },
  ],
  // ─── Orders (e-commerce) ───
  orders: [
    { _id: 'o1', userId: '5f8a3d12b5a9c2a1d8f7e6a1', items: [{ productId: 'p1', qty: 1, price: 1299 }, { productId: 'p3', qty: 1, price: 349 }], total: 1648, status: 'delivered', createdAt: new Date('2024-05-10') },
    { _id: 'o2', userId: '5f8a3d12b5a9c2a1d8f7e6a2', items: [{ productId: 'p4', qty: 2, price: 498 }, { productId: 'p5', qty: 1, price: 25 }], total: 523, status: 'shipped', createdAt: new Date('2024-06-01') },
    { _id: 'o3', userId: '5f8a3d12b5a9c2a1d8f7e6a4', items: [{ productId: 'p7', qty: 1, price: 89 }], total: 89, status: 'pending', createdAt: new Date('2024-06-14') },
    { _id: 'o4', userId: '5f8a3d12b5a9c2a1d8f7e6a5', items: [{ productId: 'p2', qty: 4, price: 72 }, { productId: 'p6', qty: 1, price: 199 }], total: 271, status: 'processing', createdAt: new Date('2024-06-12') },
    { _id: 'o5', userId: '5f8a3d12b5a9c2a1d8f7e6a1', items: [{ productId: 'p8', qty: 1, price: 59 }], total: 59, status: 'delivered', createdAt: new Date('2024-04-20') },
  ],
  // ─── Inventory (e-commerce) ───
  inventory: [
    { _id: 'inv1', productId: 'p1', warehouse: 'WH-NYC', qty: 45, minStock: 10, maxStock: 100 },
    { _id: 'inv2', productId: 'p2', warehouse: 'WH-NYC', qty: 200, minStock: 20, maxStock: 500 },
    { _id: 'inv3', productId: 'p3', warehouse: 'WH-SFO', qty: 30, minStock: 5, maxStock: 50 },
    { _id: 'inv4', productId: 'p4', warehouse: 'WH-NYC', qty: 78, minStock: 15, maxStock: 150 },
    { _id: 'inv5', productId: 'p7', warehouse: 'WH-SFO', qty: 120, minStock: 20, maxStock: 200 },
  ],
  // ─── Reviews (e-commerce) ───
  reviews: [
    { _id: 'r1', productId: 'p1', userId: '5f8a3d12b5a9c2a1d8f7e6a2', rating: 5, text: 'Amazing laptop! Fast and lightweight.', createdAt: new Date('2024-05-15') },
    { _id: 'r2', productId: 'p3', userId: '5f8a3d12b5a9c2a1d8f7e6a1', rating: 4, text: 'Very comfortable for 8-hour workdays.', createdAt: new Date('2024-05-12') },
    { _id: 'r3', productId: 'p4', userId: '5f8a3d12b5a9c2a1d8f7e6a5', rating: 5, text: 'Best noise cancellation I have ever used!', createdAt: new Date('2024-06-05') },
    { _id: 'r4', productId: 'p2', userId: '5f8a3d12b5a9c2a1d8f7e6a4', rating: 3, text: 'Nice mug but a bit smaller than expected.', createdAt: new Date('2024-05-20') },
    { _id: 'r5', productId: 'p7', userId: '5f8a3d12b5a9c2a1d8f7e6a2', rating: 5, text: 'The RGB lighting is incredible!', createdAt: new Date('2024-06-10') },
  ],
  // ─── Sensor Readings (IoT) ───
  sensor_readings: [
    { _id: 's1', deviceId: 'sensor-temp-01', type: 'temperature', value: 72.5, unit: 'F', timestamp: new Date('2024-06-14T10:00:00Z') },
    { _id: 's2', deviceId: 'sensor-temp-01', type: 'temperature', value: 73.1, unit: 'F', timestamp: new Date('2024-06-14T10:05:00Z') },
    { _id: 's3', deviceId: 'sensor-temp-01', type: 'temperature', value: 71.8, unit: 'F', timestamp: new Date('2024-06-14T10:10:00Z') },
    { _id: 's4', deviceId: 'sensor-hum-01', type: 'humidity', value: 45, unit: '%', timestamp: new Date('2024-06-14T10:00:00Z') },
    { _id: 's5', deviceId: 'sensor-hum-01', type: 'humidity', value: 47, unit: '%', timestamp: new Date('2024-06-14T10:05:00Z') },
    { _id: 's6', deviceId: 'sensor-hum-01', type: 'humidity', value: 44, unit: '%', timestamp: new Date('2024-06-14T10:10:00Z') },
    { _id: 's7', deviceId: 'sensor-temp-02', type: 'temperature', value: 98.6, unit: 'F', timestamp: new Date('2024-06-14T10:00:00Z') },
    { _id: 's8', deviceId: 'sensor-temp-02', type: 'temperature', value: 99.2, unit: 'F', timestamp: new Date('2024-06-14T10:05:00Z') },
  ],
  // ─── Events / Logs (analytics) ───
  events: [
    { _id: 'e1', eventType: 'page_view', userId: '5f8a3d12b5a9c2a1d8f7e6a1', page: '/products/p1', timestamp: new Date('2024-06-14T09:00:00Z') },
    { _id: 'e2', eventType: 'purchase', userId: '5f8a3d12b5a9c2a1d8f7e6a1', value: 1648, timestamp: new Date('2024-06-14T09:30:00Z') },
    { _id: 'e3', eventType: 'page_view', userId: '5f8a3d12b5a9c2a1d8f7e6a2', page: '/products/p4', timestamp: new Date('2024-06-14T10:00:00Z') },
    { _id: 'e4', eventType: 'search', userId: '5f8a3d12b5a9c2a1d8f7e6a5', query: 'wireless headphones', timestamp: new Date('2024-06-14T10:15:00Z') },
    { _id: 'e5', eventType: 'purchase', userId: '5f8a3d12b5a9c2a1d8f7e6a2', value: 523, timestamp: new Date('2024-06-14T11:00:00Z') },
  ],
  // ─── Transactions (for finance/accounting) ───
  transactions: [
    { _id: 't1', fromAccount: 'acc-savings-001', toAccount: 'acc-checking-001', amount: 500, type: 'transfer', status: 'completed', timestamp: new Date('2024-06-10') },
    { _id: 't2', fromAccount: 'acc-checking-001', toAccount: 'acc-merchant-paypal', amount: 89, type: 'payment', status: 'completed', timestamp: new Date('2024-06-12') },
    { _id: 't3', fromAccount: 'acc-savings-001', toAccount: 'acc-checking-001', amount: 200, type: 'transfer', status: 'pending', timestamp: new Date('2024-06-14') },
  ],
};

// ─── Curriculum Data (11 Modules, 2-3 Lessons Each) ───
const curriculum = [
  // ═══════════════════════════════════════════════
  // Module 1: NoSQL & Document Modeling
  // ═══════════════════════════════════════════════
  {
    id: 'mod-1',
    title: 'NoSQL & Document Modeling',
    lessons: [
      {
        id: 'm1-l1',
        title: 'What is MongoDB?',
        objectives: [
          'Understand how MongoDB differs from traditional SQL databases',
          'Identify the key features of document databases',
          'Understand JSON/BSON document structure',
          'Recognize when to use MongoDB over relational databases',
        ],
        content: `
          <h2 class="text-2xl font-bold mb-4 text-gray-900">Introduction to MongoDB</h2>
          <p class="mb-4 text-gray-700 leading-relaxed">MongoDB is a <strong>document database</strong> designed for ease of development and scaling. Unlike relational databases (SQL), MongoDB stores data in flexible, JSON-like documents.</p>
          <p class="mb-4 text-gray-700 leading-relaxed">This means fields can vary from document to document, and the data structure can evolve over time without migrations.</p>
          
          <h3 class="text-xl font-semibold mt-6 mb-3 text-gray-800">Key Concepts</h3>
          <ul class="list-disc pl-6 mb-4 text-gray-700 space-y-2">
            <li><strong>Document</strong> — A record in MongoDB, stored as BSON (Binary JSON). Analogous to a row in SQL.</li>
            <li><strong>Collection</strong> — A group of documents. Analogous to a table in SQL.</li>
            <li><strong>Database</strong> — A container for collections.</li>
            <li><strong>_id</strong> — A unique identifier automatically added to every document.</li>
          </ul>

          <h3 class="text-xl font-semibold mt-6 mb-3 text-gray-800">Basic Commands</h3>
          <pre class="bg-gray-900 text-green-400 p-4 rounded-lg overflow-x-auto mb-4"><code>// View all databases
show dbs

// Switch to a database (creates one if it doesn't exist)
use academy

// View all documents in a collection
db.collection_name.find()</code></pre>

          <p class="mb-4 text-gray-700 leading-relaxed">Head to the <strong>Mongo Shell Simulator</strong> tab to run <code>db.users.find()</code> and see our user documents!</p>

          <div class="bg-green-50 border-l-4 border-green-600 p-4 my-6 rounded-r-lg">
            <p class="text-green-800"><strong>💡 Tip:</strong> MongoDB creates databases and collections lazily — they only appear when you insert the first document. No CREATE TABLE statements needed!</p>
          </div>
        `,
        defaultCode: 'db.users.find()',
        takeaways: [
          'MongoDB stores data in flexible, JSON-like documents rather than rigid table rows',
          'Documents live in collections; collections live in databases',
          'BSON (Binary JSON) is MongoDB\'s internal storage format that supports more data types than JSON',
          'MongoDB is schema-less — documents in the same collection can have different fields',
        ],
      },
      {
        id: 'm1-l2',
        title: 'Documents & Collections Deep Dive',
        objectives: [
          'Understand the structure of MongoDB documents and BSON data types',
          'Work with the _id field and ObjectId',
          'Create and list databases and collections',
          'Understand document size limits and nesting capabilities',
        ],
        content: `
          <h2 class="text-2xl font-bold mb-4 text-gray-900">Documents and Collections</h2>
          <p class="mb-4 text-gray-700 leading-relaxed">A <strong>document</strong> is a set of key-value pairs stored in BSON format. BSON extends JSON with additional data types like Date, ObjectId, and Binary data.</p>
          
          <h3 class="text-xl font-semibold mt-6 mb-3 text-gray-800">BSON Data Types</h3>
          <pre class="bg-gray-900 text-green-400 p-4 rounded-lg overflow-x-auto mb-4"><code>{
  _id: ObjectId("507f1f77bcf86cd799439011"),  // Unique ID
  name: "Alice",                               // String
  age: 28,                                      // Integer
  price: 1299.99,                               // Double
  isActive: true,                               // Boolean
  tags: ["admin", "premium"],                   // Array
  address: { city: "NYC", state: "NY" },       // Embedded Document
  joined: ISODate("2023-01-15"),                // Date
  metadata: null                                // Null
}</code></pre>

          <h3 class="text-xl font-semibold mt-6 mb-3 text-gray-800">Working with Collections</h3>
          <pre class="bg-gray-900 text-green-400 p-4 rounded-lg overflow-x-auto mb-4"><code>// List all collections
show collections

// Create a collection explicitly (optional — created lazily on first insert)
db.createCollection("analytics")

// Drop a collection
db.analytics.drop()

// Rename a collection
db.users.renameCollection("customers")</code></pre>

          <div class="bg-blue-50 border-l-4 border-blue-600 p-4 my-6 rounded-r-lg">
            <p class="text-blue-800"><strong>📐 Document Limits:</strong> Maximum document size is 16MB. For large files, use GridFS. You can nest documents up to 100 levels deep.</p>
          </div>
        `,
        defaultCode: '// List all collections\nshow collections\n\n// View products collection\ndb.products.find()',
        takeaways: [
          'Documents are stored as BSON — a binary JSON format with extended data types',
          'Every document requires an _id field; MongoDB generates an ObjectId if omitted',
          'Maximum document size is 16MB; nested documents are supported up to 100 levels deep',
          'Collections can be created explicitly with createCollection() or implicitly on first insert',
        ],
      },
      {
        id: 'm1-l3',
        title: 'Schema Design Principles',
        objectives: [
          'Understand the difference between embedding and referencing',
          'Learn when to embed documents vs when to reference them',
          'Apply schema design patterns for common use cases',
          'Design schemas optimized for query patterns, not storage',
        ],
        content: `
          <h2 class="text-2xl font-bold mb-4 text-gray-900">Schema Design Principles</h2>
          <p class="mb-4 text-gray-700 leading-relaxed">Schema design in MongoDB is about choosing between <strong>embedding</strong> (nested documents) and <strong>referencing</strong> (linking via IDs). This choice dramatically impacts performance and query complexity.</p>

          <h3 class="text-xl font-semibold mt-6 mb-3 text-gray-800">Embedding (Denormalization)</h3>
          <pre class="bg-gray-900 text-green-400 p-4 rounded-lg overflow-x-auto mb-4"><code>// Embedded: order contains items directly
{
  _id: ObjectId("..."),
  customer: {
    name: "Alice Johnson",
    email: "alice@example.com"
  },
  items: [
    { product: "Laptop", qty: 1, price: 1299 },
    { product: "Chair", qty: 1, price: 349 }
  ],
  total: 1648
}</code></pre>

          <h3 class="text-xl font-semibold mt-6 mb-3 text-gray-800">Referencing (Normalization)</h3>
          <pre class="bg-gray-900 text-green-400 p-4 rounded-lg overflow-x-auto mb-4"><code>// Referenced: order references user by ID
{
  _id: ObjectId("..."),
  userId: "5f8a3d12b5a9c2a1d8f7e6a1",
  items: [
    { productId: "p1", qty: 1, price: 1299 }
  ],
  total: 1299
}</code></pre>

          <div class="bg-yellow-50 border-l-4 border-yellow-500 p-4 my-6 rounded-r-lg">
            <p class="text-yellow-800"><strong>⚖️ Rule of Thumb:</strong> Embed when data is <em>always accessed together</em> and doesn't grow unbounded. Reference when data is <em>accessed independently</em> or grows without limit (e.g., a user's 10,000 tweets).</p>
          </div>
        `,
        defaultCode: '// View embedded order documents\n// Orders embed items directly\ndb.orders.findOne({ _id: "o1" })',
        takeaways: [
          'Embedding improves read performance by keeping related data in one document (no JOINs)',
          'Referencing is better for data that grows unbounded or is accessed independently',
          'Design your schema for your application\'s query patterns, not for storage normalization',
          'Common patterns: Subset, Computed, Bucket, Polymorphic — each solves specific problems',
        ],
      },
    ],
    quiz: [
      { id: 'q1', question: 'How does MongoDB store data?', options: ['In tables with rows and columns', 'In JSON-like documents', 'In a simple text file', 'In a graph structure'], correct: 1 },
      { id: 'q2', question: 'What is the maximum size of a MongoDB document?', options: ['4MB', '16MB', '64MB', '256MB'], correct: 1 },
      { id: 'q3', question: 'What is BSON?', options: ['Binary SQL', 'Binary JSON — MongoDB\'s storage format', 'A query language', 'A type of index'], correct: 1 },
      { id: 'q4', question: 'When should you embed documents instead of reference them?', options: ['Always embed everything', 'When data is always accessed together and does not grow unbounded', 'Never embed — always reference', 'Only for arrays'], correct: 1 },
      { id: 'q5', question: 'Which command lists all collections in the current database?', options: ['list collections', 'show collections', 'db.listCollections()', 'collections()'], correct: 1 },
    ],
    exercises: [
      { title: 'User Profile Design', description: 'Design a document structure for a user profile that includes name, email, address (embedded), and recent orders (referenced). Explain your embedding vs referencing choices.', dataset: 'users' },
      { title: 'Product Catalog', description: 'Write a query to find all Electronics products with a rating of 4.5 or higher, showing only the name and price.', dataset: 'products', defaultCode: 'db.products.find(\n  { category: "Electronics", rating: { $gte: 4.5 } },\n  { name: 1, price: 1 }\n)' },
      { title: 'E-commerce Data Model', description: 'Design a schema for an e-commerce order. Should shipping addresses be embedded or referenced? What about payment info?', dataset: 'orders' },
    ],
  },

  // ═══════════════════════════════════════════════
  // Module 2: CRUD Operations
  // ═══════════════════════════════════════════════
  {
    id: 'mod-2',
    title: 'CRUD Operations',
    lessons: [
      {
        id: 'm2-l1',
        title: 'Finding Documents',
        objectives: [
          'Use find() to retrieve documents with query filters',
          'Use query operators: $gt, $lt, $in, $regex',
          'Apply projections to limit returned fields',
          'Chain methods: sort(), limit(), skip()',
        ],
        content: `
          <h2 class="text-2xl font-bold mb-4 text-gray-900">Reading Data with find()</h2>
          <p class="mb-4 text-gray-700 leading-relaxed">The <code>find()</code> method accepts a <strong>query filter document</strong> to specify which documents to return. Without a filter, it returns all documents in the collection.</p>

          <h3 class="text-xl font-semibold mt-6 mb-3 text-gray-800">Basic Queries</h3>
          <pre class="bg-gray-900 text-green-400 p-4 rounded-lg overflow-x-auto mb-4"><code>// All documents
db.users.find()

// Exact match
db.users.find({ status: "A" })

// Comparison operators
db.users.find({ age: { $gt: 30 } })        // age > 30
db.users.find({ age: { $gte: 25, $lte: 35 } }) // 25 <= age <= 35
db.users.find({ role: { $in: ["admin", "moderator"] } })</code></pre>

          <h3 class="text-xl font-semibold mt-6 mb-3 text-gray-800">Projections & Chaining</h3>
          <pre class="bg-gray-900 text-green-400 p-4 rounded-lg overflow-x-auto mb-4"><code>// Projection — only return name and email
db.users.find({ status: "A" }, { name: 1, email: 1 })

// Chaining — sort, skip, limit
db.users.find().sort({ age: -1 }).limit(3)

// Regex search
db.users.find({ name: { $regex: /^A/ } })  // Names starting with A</code></pre>

          <div class="bg-green-50 border-l-4 border-green-600 p-4 my-6 rounded-r-lg">
            <p class="text-green-800"><strong>🔍 Try it:</strong> <code>db.users.find({ status: "A" }, { name: 1, email: 1, role: 1 })</code> in the simulator to see only active users with selected fields.</p>
          </div>
        `,
        defaultCode: 'db.users.find({ status: "A" }, { name: 1, email: 1, role: 1 })',
        takeaways: [
          'find() with an empty filter returns all documents; pass a filter object to narrow results',
          'Use comparison operators ($gt, $lt, $gte, $lte, $ne, $in) for range/conditional queries',
          'Projection as second argument: 1 includes a field, 0 excludes fields',
          'Chain cursor methods like .sort(), .limit(), .skip() for pagination and ordering',
        ],
      },
      {
        id: 'm2-l2',
        title: 'Inserting Documents',
        objectives: [
          'Insert single documents with insertOne()',
          'Insert multiple documents with insertMany()',
          'Understand ordered vs unordered inserts',
          'Handle insertion errors and duplicate keys',
        ],
        content: `
          <h2 class="text-2xl font-bold mb-4 text-gray-900">Creating Data</h2>
          <p class="mb-4 text-gray-700 leading-relaxed">To insert documents into a collection, use <code>insertOne()</code> or <code>insertMany()</code>. MongoDB automatically generates an <code>_id</code> field if you don't provide one.</p>

          <h3 class="text-xl font-semibold mt-6 mb-3 text-gray-800">Insert Operations</h3>
          <pre class="bg-gray-900 text-green-400 p-4 rounded-lg overflow-x-auto mb-4"><code>// Insert a single document
db.products.insertOne({
  name: "4K Monitor",
  price: 499,
  category: "Electronics",
  stock: 25,
  rating: 4.6
})

// Insert multiple documents
db.products.insertMany([
  { name: "USB-C Hub", price: 35, category: "Electronics", stock: 100 },
  { name: "Mouse Pad XL", price: 20, category: "Accessories", stock: 200 }
])</code></pre>

          <div class="bg-yellow-50 border-l-4 border-yellow-500 p-4 my-6 rounded-r-lg">
            <p class="text-yellow-800"><strong>⚠️ Ordered Inserts:</strong> By default, insertMany() stops on the first error (<code>ordered: true</code>). Use <code>{ ordered: false }</code> to continue inserting even if some documents fail (e.g., duplicate keys).</p>
          </div>
        `,
        defaultCode: 'db.products.insertMany([\n  { name: "USB-C Hub", price: 35, category: "Electronics", stock: 100 },\n  { name: "Mouse Pad XL", price: 20, category: "Accessories", stock: 200 }\n])',
        takeaways: [
          'insertOne() inserts a single document; insertMany() inserts multiple at once (more efficient)',
          'MongoDB auto-generates an ObjectId _id if you don\'t provide one',
          'Ordered inserts (default) stop at first error; unordered inserts continue on error',
          'Inserting returns an acknowledged result with the inserted _id(s)',
        ],
      },
      {
        id: 'm2-l3',
        title: 'Updating & Deleting Documents',
        objectives: [
          'Update documents with updateOne(), updateMany(), replaceOne()',
          'Use update operators: $set, $unset, $inc, $push, $pull',
          'Delete documents with deleteOne() and deleteMany()',
          'Understand the difference between update and replace',
        ],
        content: `
          <h2 class="text-2xl font-bold mb-4 text-gray-900">Updating and Deleting Data</h2>
          <p class="mb-4 text-gray-700 leading-relaxed">Update operations modify existing documents. MongoDB provides powerful <strong>update operators</strong> for atomic field-level changes.</p>

          <h3 class="text-xl font-semibold mt-6 mb-3 text-gray-800">Update Operators</h3>
          <pre class="bg-gray-900 text-green-400 p-4 rounded-lg overflow-x-auto mb-4"><code>// $set — change specific fields
db.products.updateOne(
  { name: "4K Monitor" },
  { $set: { price: 449, stock: 30 } }
)

// $inc — increment a number
db.products.updateOne(
  { name: "Coffee Mug" },
  { $inc: { stock: -1 } }  // One sold!
)

// $push — add to an array
db.products.updateOne(
  { name: "4K Monitor" },
  { $push: { tags: "monitor" } }
)</code></pre>

          <h3 class="text-xl font-semibold mt-6 mb-3 text-gray-800">Deleting Documents</h3>
          <pre class="bg-gray-900 text-green-400 p-4 rounded-lg overflow-x-auto mb-4"><code>// Delete one matching document
db.products.deleteOne({ name: "4K Monitor" })

// Delete all matching documents
db.products.deleteMany({ category: "Accessories" })

// Delete all documents (empty filter)
db.products.deleteMany({})</code></pre>

          <div class="bg-red-50 border-l-4 border-red-500 p-4 my-6 rounded-r-lg">
            <p class="text-red-800"><strong>🚨 Warning:</strong> <code>deleteMany({})</code> with an empty filter removes ALL documents from the collection — no confirmation prompt! Always double-check your filter first.</p>
          </div>
        `,
        defaultCode: '// Try updating a product price\ndb.products.updateOne(\n  { name: "UltraBook Pro 15" },\n  { $set: { price: 1199 } }\n)',
        takeaways: [
          'Use $set to change specific fields, $inc for numeric increments, $push/$pull for array manipulation',
          'updateOne() updates the first match; updateMany() updates all matches',
          'replaceOne() completely replaces a document (all old fields are lost!)',
          'deleteOne() and deleteMany() remove documents; be careful with empty filters!',
        ],
      },
    ],
    quiz: [
      { id: 'q2-1', question: 'Which command finds all users with age exactly 28?', options: ['db.users.find("age": 28)', 'db.users.find({ age: 28 })', 'db.users.select({ age: 28 })', 'db.users.get(age=28)'], correct: 1 },
      { id: 'q2-2', question: 'What does the $gt operator do?', options: ['Greater than', 'Less than', 'Equal to', 'Not equal to'], correct: 0 },
      { id: 'q2-3', question: 'Which operator is used to increment a numeric field?', options: ['$add', '$inc', '$increase', '$plus'], correct: 1 },
      { id: 'q2-4', question: 'What does insertMany() with { ordered: false } do?', options: ['Inserts in reverse order', 'Continues inserting even if some documents fail', 'Only inserts if the collection is empty', 'Skips duplicate _id values'], correct: 1 },
      { id: 'q2-5', question: 'Which update method completely replaces the entire document content?', options: ['updateOne()', 'replaceOne()', 'setContent()', 'overwriteOne()'], correct: 1 },
    ],
    exercises: [
      { title: 'Find Active Users', description: 'Write a query to find all active (status "A") users, sorted by age descending, showing only name and email.', dataset: 'users', defaultCode: 'db.users.find(\n  { status: "A" },\n  { name: 1, email: 1 }\n).sort({ age: -1 })' },
      { title: 'Price Range Query', description: 'Find all products with a price between $50 and $300, sorted by price ascending.', dataset: 'products', defaultCode: 'db.products.find(\n  { price: { $gte: 50, $lte: 300 } }\n).sort({ price: 1 })' },
      { title: 'Bulk Insert Products', description: 'Insert three new products into the electronics category using a single insertMany() call.', dataset: 'products', defaultCode: 'db.products.insertMany([\n  { name: "Webcam HD", price: 79, category: "Electronics", stock: 50 },\n  { name: "Microphone USB", price: 129, category: "Electronics", stock: 35 },\n  { name: "Monitor Stand", price: 45, category: "Accessories", stock: 80 }\n])' },
      { title: 'Update Inventory', description: 'Decrease the stock of "Stainless Steel Water Bottle" by 10 (simulating a bulk sale).', dataset: 'products', defaultCode: 'db.products.updateOne(\n  { name: "Stainless Steel Water Bottle" },\n  { $inc: { stock: -10 } }\n)' },
      { title: 'Delete Inactive Users', description: 'Remove all users with status "D" (deactivated) from the users collection.', dataset: 'users', defaultCode: 'db.users.deleteMany({ status: "D" })' },
    ],
  },

  // ═══════════════════════════════════════════════
  // Module 3: The Aggregation Pipeline
  // ═══════════════════════════════════════════════
  {
    id: 'mod-3',
    title: 'The Aggregation Pipeline',
    lessons: [
      {
        id: 'm3-l1',
        title: 'Basic Aggregation Stages',
        objectives: [
          'Understand the aggregation pipeline concept and stage ordering',
          'Use $match to filter documents',
          'Use $group for grouping and accumulators',
          'Use $sort and $project for ordering and shaping output',
        ],
        content: `
          <h2 class="text-2xl font-bold mb-4 text-gray-900">Aggregation Pipeline Basics</h2>
          <p class="mb-4 text-gray-700 leading-relaxed">The aggregation pipeline processes documents through a sequence of stages. Each stage transforms the documents and passes them to the next stage. It's like an <strong>assembly line</strong> — each station does one job.</p>

          <h3 class="text-xl font-semibold mt-6 mb-3 text-gray-800">Core Stages</h3>
          <pre class="bg-gray-900 text-green-400 p-4 rounded-lg overflow-x-auto mb-4"><code>// $match — Filter documents (like find)
db.orders.aggregate([
  { $match: { status: "delivered" } }
])

// $group — Group by a field, compute aggregates
db.products.aggregate([
  { $group: { _id: "$category", count: { $sum: 1 }, avgPrice: { $avg: "$price" } } }
])

// $sort — Order results
db.products.aggregate([
  { $group: { _id: "$category", totalStock: { $sum: "$stock" } } },
  { $sort: { totalStock: -1 } }
])

// $project — Shape output
db.products.aggregate([
  { $project: { name: 1, price: 1, discountedPrice: { $subtract: ["$price", 10] } } }
])</code></pre>

          <div class="bg-green-50 border-l-4 border-green-600 p-4 my-6 rounded-r-lg">
            <p class="text-green-800"><strong>⚡ Performance Tip:</strong> Always put $match as the FIRST stage in your pipeline. This reduces the number of documents flowing through subsequent stages, making the pipeline faster.</p>
          </div>
        `,
        defaultCode: 'db.products.aggregate([\n  { $group: { _id: "$category", count: { $sum: 1 }, avgPrice: { $avg: "$price" } } }\n])',
        takeaways: [
          'The aggregation pipeline processes documents through sequential stages (like an assembly line)',
          '$match filters documents early to reduce pipeline workload',
          '$group groups documents by a key and computes aggregates (sum, avg, count, min, max)',
          '$project shapes the output by including, excluding, or transforming fields',
        ],
      },
      {
        id: 'm3-l2',
        title: 'Pipeline Stages: $group, $sort, $project',
        objectives: [
          'Use accumulator expressions: $sum, $avg, $max, $min, $first',
          'Build multi-stage pipelines combining $match, $group, $sort, $project',
          'Use $addFields to add computed fields',
          'Use $bucket for histogram-style grouping',
        ],
        content: `
          <h2 class="text-2xl font-bold mb-4 text-gray-900">Advanced Pipeline Stages</h2>
          <p class="mb-4 text-gray-700 leading-relaxed">Combine multiple stages to build powerful data transformations. Each stage's output feeds into the next.</p>

          <h3 class="text-xl font-semibold mt-6 mb-3 text-gray-800">Practical Examples</h3>
          <pre class="bg-gray-900 text-green-400 p-4 rounded-lg overflow-x-auto mb-4"><code>// Products by category with stats
db.products.aggregate([
  { $match: { stock: { $gt: 0 } } },
  { $group: {
    _id: "$category",
    totalProducts: { $sum: 1 },
    avgRating: { $avg: "$rating" },
    cheapest: { $min: "$price" },
    mostExpensive: { $max: "$price" }
  }},
  { $sort: { avgRating: -1 } }
])

// Add computed field
db.orders.aggregate([
  { $addFields: { tax: { $multiply: ["$total", 0.08] } } },
  { $project: { total: 1, tax: 1, grandTotal: { $add: ["$total", { $multiply: ["$total", 0.08] }] } } }
])</code></pre>

          <div class="bg-blue-50 border-l-4 border-blue-600 p-4 my-6 rounded-r-lg">
            <p class="text-blue-800"><strong>📊 $bucket Example:</strong> <code>{ $bucket: { groupBy: "$price", boundaries: [0, 50, 100, 500, 1000], default: "Other", output: { count: { $sum: 1 } } } }</code> creates price-range buckets like a histogram.</p>
          </div>
        `,
        defaultCode: 'db.products.aggregate([\n  { $match: { stock: { $gt: 0 } } },\n  { $group: {\n    _id: "$category",\n    totalProducts: { $sum: 1 },\n    avgRating: { $avg: "$rating" },\n    cheapest: { $min: "$price" },\n    mostExpensive: { $max: "$price" }\n  }},\n  { $sort: { avgRating: -1 } }\n])',
        takeaways: [
          'Accumulators ($sum, $avg, $max, $min) compute values within each $group bucket',
          '$addFields creates new fields without affecting existing ones (unlike $project which hides them)',
          '$bucket groups documents into ranges — useful for histograms and price brackets',
          'Put stages in the right order: $match → $group → $sort → $project for optimal performance',
        ],
      },
    ],
    quiz: [
      { id: 'q3-1', question: 'Which method is used for running an aggregation pipeline?', options: ['db.collection.pipeline()', 'db.collection.find()', 'db.collection.aggregate()', 'db.collection.group()'], correct: 2 },
      { id: 'q3-2', question: 'Which pipeline stage is used to filter documents?', options: ['$sort', '$match', '$group', '$project'], correct: 1 },
      { id: 'q3-3', question: 'What does the $sum accumulator do in a $group stage?', options: ['Adds two numbers together', 'Counts documents in each group', 'Calculates average', 'Finds the maximum value'], correct: 1 },
      { id: 'q3-4', question: 'What is the best practice for ordering $match in a pipeline?', options: ['Put it last', 'Put it first', 'Put it after $group', 'Order does not matter'], correct: 1 },
      { id: 'q3-5', question: 'Which stage adds computed fields without removing existing fields?', options: ['$project', '$addFields', '$set', '$compute'], correct: 1 },
    ],
    exercises: [
      { title: 'Category Summary', description: 'Use $group to count products per category and calculate the average price per category.', dataset: 'products', defaultCode: 'db.products.aggregate([\n  { $group: { _id: "$category", count: { $sum: 1 }, avgPrice: { $avg: "$price" } } }\n])' },
      { title: 'Order Revenue Analysis', description: 'Calculate total revenue from delivered orders, grouped by user ID.', dataset: 'orders', defaultCode: 'db.orders.aggregate([\n  { $match: { status: "delivered" } },\n  { $group: { _id: "$userId", totalSpent: { $sum: "$total" } } }\n])' },
      { title: 'Sensor Stats', description: 'Calculate the average, min, and max temperature from sensor_readings, grouped by device ID.', dataset: 'sensor_readings', defaultCode: 'db.sensor_readings.aggregate([\n  { $match: { type: "temperature" } },\n  { $group: {\n    _id: "$deviceId",\n    avgTemp: { $avg: "$value" },\n    minTemp: { $min: "$value" },\n    maxTemp: { $max: "$value" }\n  }}\n])' },
      { title: 'Price Buckets', description: 'Use $bucket to group products into price ranges: 0-50, 50-100, 100-500, 500+.', dataset: 'products', defaultCode: 'db.products.aggregate([\n  { $bucket: {\n    groupBy: "$price",\n    boundaries: [0, 50, 100, 500, 1000],\n    default: "Luxury",\n    output: { count: { $sum: 1 } }\n  }}\n])' },
    ],
  },

  // ═══════════════════════════════════════════════
  // Module 4: Data Modeling & Schema Design
  // ═══════════════════════════════════════════════
  {
    id: 'mod-4',
    title: 'Data Modeling & Schema Design',
    lessons: [
      {
        id: 'm4-l1',
        title: 'Embedding vs Referencing',
        objectives: [
          'Understand the tradeoffs between embedding and referencing data',
          'Identify one-to-one, one-to-many, and many-to-many relationships',
          'Apply the "query together" principle to schema design decisions',
          'Recognize when embedding would lead to performance problems',
        ],
        content: `
          <h2 class="text-2xl font-bold mb-4 text-gray-900">Embedding vs Referencing</h2>
          <p class="mb-4 text-gray-700 leading-relaxed">The most important design decision in MongoDB is choosing between <strong>embedding</strong> related data inside a document or <strong>referencing</strong> it from another document.</p>

          <h3 class="text-xl font-semibold mt-6 mb-3 text-gray-800">When to Embed</h3>
          <ul class="list-disc pl-6 mb-4 text-gray-700 space-y-2">
            <li><strong>One-to-one</strong> relationships (e.g., user profile and user settings)</li>
            <li><strong>Small one-to-many</strong> (e.g., a blog post with up to 10 comments)</li>
            <li>Data that is almost always queried together</li>
            <li>Data that doesn't grow unbounded (avoid arrays that keep growing)</li>
          </ul>

          <h3 class="text-xl font-semibold mt-6 mb-3 text-gray-800">When to Reference</h3>
          <ul class="list-disc pl-6 mb-4 text-gray-700 space-y-2">
            <li><strong>Large one-to-many</strong> (e.g., a user with thousands of orders)</li>
            <li><strong>Many-to-many</strong> (e.g., students and courses)</li>
            <li>Data accessed independently (e.g., order details vs user profile)</li>
            <li>Data that changes frequently (avoid updating large embedded documents)</li>
          </ul>

          <pre class="bg-gray-900 text-green-400 p-4 rounded-lg overflow-x-auto mb-4"><code>// Embedded (good): Product with embedded reviews (max 10)
{
  name: "UltraBook Pro 15",
  price: 1299,
  reviews: [
    { user: "Bob", rating: 5, text: "Great laptop!" },
    { user: "Eve", rating: 4, text: "Fast but expensive" }
  ]
}

// Referenced (better): User with separate orders collection
// User document
{ _id: "user1", name: "Alice", email: "alice@example.com" }
// Order documents (referenced by userId)
{ _id: "order1", userId: "user1", total: 1648 }</code></pre>
        `,
        defaultCode: '// View embedded reviews inside a product\ndb.products.findOne({ name: "UltraBook Pro 15" })',
        takeaways: [
          'Embed when related data is small, accessed together, and doesn\'t grow unbounded',
          'Reference when data grows large, is accessed independently, or has many-to-many relationships',
          'The 16MB document size limit constrains how much you can embed in one document',
          'Design your schema around your application\'s query patterns, not relational normalization rules',
        ],
      },
      {
        id: 'm4-l2',
        title: 'Schema Design Patterns',
        objectives: [
          'Apply the Subset pattern for optimized list views',
          'Use the Computed pattern to avoid recalculating aggregates',
          'Implement the Bucket pattern for time-series data',
          'Recognize the Polymorphic pattern for similar but different documents',
        ],
        content: `
          <h2 class="text-2xl font-bold mb-4 text-gray-900">Battle-Tested Schema Patterns</h2>
          <p class="mb-4 text-gray-700 leading-relaxed">Over years of real-world use, the MongoDB community has developed <strong>proven patterns</strong> for common data modeling challenges.</p>

          <h3 class="text-xl font-semibold mt-6 mb-3 text-gray-800">The Subset Pattern</h3>
          <p class="mb-4 text-gray-700 leading-relaxed">Store a lightweight subset of data for list views, and keep the full details in a separate collection. Like having <strong>thumbnails</strong> for a photo gallery.</p>

          <h3 class="text-xl font-semibold mt-6 mb-3 text-gray-800">The Computed Pattern</h3>
          <p class="mb-4 text-gray-700 leading-relaxed">Pre-compute and store values that would otherwise require expensive calculations. Like keeping a <strong>running total</strong> in an order document instead of summing line items every time.</p>
          <pre class="bg-gray-900 text-green-400 p-4 rounded-lg overflow-x-auto mb-4"><code>// Instead of calculating this every time you view an order:
// Total = sum of all item prices * quantities

// Store it directly in the order document:
{
  _id: "o1",
  items: [ ... ],
  total: 1648,  // Pre-computed!
  itemCount: 2  // Also pre-computed
}</code></pre>

          <h3 class="text-xl font-semibold mt-6 mb-3 text-gray-800">The Bucket Pattern</h3>
          <p class="mb-4 text-gray-700 leading-relaxed">Group related data into "buckets" — commonly by time. Instead of one document per sensor reading, store multiple readings per document in time-based buckets. See the sensor_readings collection for an example.</p>

          <div class="bg-green-50 border-l-4 border-green-600 p-4 my-6 rounded-r-lg">
            <p class="text-green-800"><strong>💡 Pro Tip:</strong> The Polymorphic pattern is useful when different documents share the same purpose but have different fields — like "Events" where each event type (page_view, purchase, search) has different fields.</p>
          </div>
        `,
        defaultCode: '// View events collection — polymorphic pattern in action\ndb.events.find()',
        takeaways: [
          'Subset pattern: keep a lightweight version for list queries, full version for detail views',
          'Computed pattern: store aggregates (totals, counts) to avoid recalculating on every read',
          'Bucket pattern: group time-series or log data into chunks instead of individual documents',
          'Polymorphic pattern: different document shapes in one collection, distinguished by a type field',
        ],
      },
      {
        id: 'm4-l3',
        title: 'Indexing Strategies for Data Models',
        objectives: [
          'Understand how indexes affect query performance for different schema designs',
          'Design compound indexes that match your query patterns',
          'Apply the ESR rule (Equality, Sort, Range) for compound index field order',
          'Recognize when an index hurts write performance',
        ],
        content: `
          <h2 class="text-2xl font-bold mb-4 text-gray-900">Indexing Strategies</h2>
          <p class="mb-4 text-gray-700 leading-relaxed">Indexes are critical for query performance, but they also impact write speed and storage. Smart indexing starts with understanding your query patterns.</p>

          <h3 class="text-xl font-semibold mt-6 mb-3 text-gray-800">The ESR Rule</h3>
          <p class="mb-4 text-gray-700 leading-relaxed">When building a compound index, put fields in this order:</p>
          <ol class="list-decimal pl-6 mb-4 text-gray-700 space-y-2">
            <li><strong>E</strong>quality — Fields that use exact matches first</li>
            <li><strong>S</strong>ort — Fields used in sort() calls second</li>
            <li><strong>R</strong>ange — Fields using range operators ($gt, $lt, $in) last</li>
          </ol>

          <pre class="bg-gray-900 text-green-400 p-4 rounded-lg overflow-x-auto mb-4"><code>// Query: find active users in NYC, sorted by age
db.users.find({ status: "A", "address.city": "NYC" }).sort({ age: -1 })

// Index following ESR: Equality (status, city) → Sort (age) → Range (none)
db.users.createIndex({ status: 1, "address.city": 1, age: -1 })</code></pre>

          <div class="bg-yellow-50 border-l-4 border-yellow-500 p-4 my-6 rounded-r-lg">
            <p class="text-yellow-800"><strong>⚡ Remember:</strong> More indexes ≠ better performance. Each index consumes storage and slows down writes. Index only what your queries actually need!</p>
          </div>
        `,
        defaultCode: '// Create a compound index on status and city\ndb.users.createIndex({ status: 1, "address.city": 1, age: -1 })',
        takeaways: [
          'ESR rule: Equality fields first, Sort fields second, Range fields last in compound indexes',
          'Compound indexes can support multiple query patterns — order fields by frequency of use',
          'Indexes speed up reads but slow down writes (indexes must be updated on every write)',
          'Use explain() to verify your indexes are being used effectively',
        ],
      },
    ],
    quiz: [
      { id: 'q4-1', question: 'When is embedding a better choice than referencing?', options: ['When data grows unbounded', 'When data is always queried together and is small', 'For many-to-many relationships', 'When data changes frequently'], correct: 1 },
      { id: 'q4-2', question: 'What is the Bucket pattern used for?', options: ['Storing user passwords', 'Grouping time-series data for efficiency', 'Creating backups', 'Indexing fields'], correct: 1 },
      { id: 'q4-3', question: 'What does ESR stand for in compound index design?', options: ['Equal, Sort, Range', 'Equality, Sort, Range', 'Efficient, Structured, Reliable', 'Exact, Sorted, Referenced'], correct: 1 },
      { id: 'q4-4', question: 'What is a downside of having too many indexes?', options: ['No downsides — more indexes is always better', 'Slower write performance and more storage used', 'Indexes can crash the database', 'Documents become read-only'], correct: 1 },
    ],
    exercises: [
      { title: 'Schema Design Decision', description: 'Should product reviews be embedded in the product document or stored separately? Explain your reasoning considering the 16MB document limit.', dataset: 'products' },
      { title: 'Composite Index', description: 'Create a compound index to optimize the query: find active users in NYC sorted by age.', dataset: 'users', defaultCode: 'db.users.createIndex({ status: 1, "address.city": 1, age: -1 })' },
      { title: 'Computed Pattern', description: 'Add a pre-computed "totalStock" field to each category document that sums all product stock quantities. Explain why this helps performance.', dataset: 'products' },
    ],
  },

  // ═══════════════════════════════════════════════
  // Module 5: Aggregation Pipeline Deep Dive
  // ═══════════════════════════════════════════════
  {
    id: 'mod-5',
    title: 'Aggregation Pipeline Deep Dive',
    lessons: [
      {
        id: 'm5-l1',
        title: 'Advanced Pipeline Stages',
        objectives: [
          'Use $lookup to join data across collections',
          'Use $unwind to deconstruct arrays',
          'Use $facet for multi-faceted aggregations',
          'Apply $sample for random document selection',
        ],
        content: `
          <h2 class="text-2xl font-bold mb-4 text-gray-900">Advanced Aggregation Stages</h2>
          <p class="mb-4 text-gray-700 leading-relaxed">Beyond basic stages, MongoDB provides powerful operators for joining collections, processing arrays, and building complex analytical queries.</p>

          <h3 class="text-xl font-semibold mt-6 mb-3 text-gray-800">$lookup — Join Collections</h3>
          <pre class="bg-gray-900 text-green-400 p-4 rounded-lg overflow-x-auto mb-4"><code>// Join orders with users to get customer details
db.orders.aggregate([
  { $lookup: {
    from: "users",
    localField: "userId",
    foreignField: "_id",
    as: "customer"
  }},
  { $unwind: "$customer" },
  { $project: {
    "customer.name": 1,
    total: 1,
    status: 1
  }}
])</code></pre>

          <h3 class="text-xl font-semibold mt-6 mb-3 text-gray-800">$facet — Multi-Faceted Analysis</h3>
          <pre class="bg-gray-900 text-green-400 p-4 rounded-lg overflow-x-auto mb-4"><code>// Run multiple aggregations in parallel on the same data
db.products.aggregate([
  { $facet: {
    byCategory: [
      { $group: { _id: "$category", count: { $sum: 1 } } }
    ],
    priceStats: [
      { $group: { _id: null, avg: { $avg: "$price" }, max: { $max: "$price" }, min: { $min: "$price" } } }
    ],
    lowStock: [
      { $match: { stock: { $lt: 50 } } },
      { $project: { name: 1, stock: 1 } }
    ]
  }}
])</code></pre>

          <div class="bg-blue-50 border-l-4 border-blue-600 p-4 my-6 rounded-r-lg">
            <p class="text-blue-800"><strong>🔗 $lookup vs Embedded:</strong> $lookup is powerful but can be slow on large datasets. If you frequently need data from two collections together, consider embedding instead.</p>
          </div>
        `,
        defaultCode: 'db.orders.aggregate([\n  { $lookup: {\n    from: "users",\n    localField: "userId",\n    foreignField: "_id",\n    as: "customer"\n  }}\n])',
        takeaways: [
          '$lookup performs a left outer join between collections (similar to SQL JOIN)',
          '$unwind deconstructs an array field into multiple documents (one per array element)',
          '$facet runs multiple pipelines on the same data in parallel, returning results as separate arrays',
          '$sample randomly selects N documents from the collection',
        ],
      },
      {
        id: 'm5-l2',
        title: 'Aggregation with $lookup & $unwind',
        objectives: [
          'Perform multi-collection joins with $lookup',
          'Flatten arrays with $unwind for further processing',
          'Combine $lookup and $unwind for relational-style queries',
          'Optimize pipelines that use $lookup',
        ],
        content: `
          <h2 class="text-2xl font-bold mb-4 text-gray-900">$lookup & $unwind in Action</h2>
          <p class="mb-4 text-gray-700 leading-relaxed">Together, $lookup and $unwind give you the ability to build relational-style queries while leveraging the aggregation pipeline's power.</p>

          <h3 class="text-xl font-semibold mt-6 mb-3 text-gray-800">E-commerce Analytics Example</h3>
          <pre class="bg-gray-900 text-green-400 p-4 rounded-lg overflow-x-auto mb-4"><code>// For each order, get user details, then analyze per user
db.orders.aggregate([
  // Join with users
  { $lookup: {
    from: "users",
    localField: "userId",
    foreignField: "_id",
    as: "customer"
  }},
  { $unwind: "$customer" },

  // Join with products via items
  { $unwind: "$items" },
  { $lookup: {
    from: "products",
    localField: "items.productId",
    foreignField: "_id",
    as: "productDetails"
  }},
  { $unwind: "$productDetails" },

  // Group by category to see which categories sell best
  { $group: {
    _id: "$productDetails.category",
    totalRevenue: { $sum: "$items.price" },
    unitsSold: { $sum: "$items.qty" }
  }},
  { $sort: { totalRevenue: -1 } }
])</code></pre>

          <div class="bg-yellow-50 border-l-4 border-yellow-500 p-4 my-6 rounded-r-lg">
            <p class="text-yellow-800"><strong>⚠️ Performance Warning:</strong> $unwind followed by $lookup creates many join operations. If performance is critical, consider embedding the data instead or using $lookup before $unwind.</p>
          </div>
        `,
        defaultCode: '// Simple lookup: orders with user details\ndb.orders.aggregate([\n  { $lookup: {\n    from: "users",\n    localField: "userId",\n    foreignField: "_id",\n    as: "customer"\n  }},\n  { $unwind: "$customer" },\n  { $project: { "customer.name": 1, total: 1, status: 1 } }\n])',
        takeaways: [
          'Chain $lookup + $unwind to flatten joined arrays into individual documents',
          'Multiple $lookup stages can join several collections together',
          'Use $project after $lookup to limit fields and reduce memory usage',
          '$lookup performance depends on indexes on the foreign field',
        ],
      },
      {
        id: 'm5-l3',
        title: 'Pipeline Optimization',
        objectives: [
          'Understand how to optimize aggregation pipeline performance',
          'Place $match and $limit early in the pipeline',
          'Use indexes effectively within pipelines',
          'Avoid blocking stages like $sort without indexes',
        ],
        content: `
          <h2 class="text-2xl font-bold mb-4 text-gray-900">Pipeline Optimization Techniques</h2>
          <p class="mb-4 text-gray-700 leading-relaxed">A well-optimized aggregation pipeline can be 10-100x faster than one that's poorly ordered. Follow these principles to keep your pipelines fast.</p>

          <h3 class="text-xl font-semibold mt-6 mb-3 text-gray-800">Key Optimization Principles</h3>
          <ol class="list-decimal pl-6 mb-4 text-gray-700 space-y-2">
            <li><strong>$match first</strong> — Filter out as many documents as early as possible</li>
            <li><strong>$project early</strong> — Remove unnecessary fields before $group or $sort to reduce memory</li>
            <li><strong>Use indexes</strong> — A $match at the start can use an index if it matches the index fields</li>
            <li><strong>$sort after $match</strong> — Sorting fewer documents is faster</li>
            <li><strong>Prefer $limit before $skip</strong> — For pagination, use { $match } → { $sort } → { $skip } → { $limit }</li>
          </ol>

          <h3 class="text-xl font-semibold mt-6 mb-3 text-gray-800">Before & After</h3>
          <pre class="bg-gray-900 text-green-400 p-4 rounded-lg overflow-x-auto mb-4"><code>// ❌ Slow: sorts ALL documents before filtering
db.orders.aggregate([
  { $sort: { total: -1 } },
  { $match: { status: "delivered" } }
])

// ✅ Fast: filters first, then sorts only matching docs
db.orders.aggregate([
  { $match: { status: "delivered" } },
  { $sort: { total: -1 } }
])</code></pre>

          <div class="bg-green-50 border-l-4 border-green-600 p-4 my-6 rounded-r-lg">
            <p class="text-green-800"><strong>⚡ Memory Tip:</strong> Stages like $group, $sort, $bucket require memory. MongoDB limits pipeline RAM to 100MB by default. Use <code>{ allowDiskUse: true }</code> for large datasets.</p>
          </div>
        `,
        defaultCode: '// Optimized pipeline: match first, sort matches only\ndb.orders.aggregate([\n  { $match: { status: "delivered" } },\n  { $sort: { total: -1 } },\n  { $limit: 3 }\n])',
        takeaways: [
          'Always put $match as the first stage to reduce data flowing through the pipeline',
          'Use $project early to trim fields and reduce memory usage',
          '$group and $sort are memory-intensive — use { allowDiskUse: true } for large data',
          'Put $limit before $skip for pagination to avoid sorting unnecessary documents',
        ],
      },
    ],
    quiz: [
      { id: 'q5-1', question: 'What does the $lookup stage do?', options: ['Looks up a value in an array', 'Joins documents from another collection', 'Finds duplicate documents', 'Checks if a field exists'], correct: 1 },
      { id: 'q5-2', question: 'What does $unwind do to an array field?', options: ['Removes the array', 'Creates one output document per array element', 'Sorts the array', 'Adds elements to the array'], correct: 1 },
      { id: 'q5-3', question: 'Which stage allows running multiple sub-pipelines on the same data?', options: ['$multi', '$branch', '$facet', '$parallel'], correct: 2 },
      { id: 'q5-4', question: 'What is the most important optimization for aggregation pipelines?', options: ['Use $facet everywhere', 'Put $match as the first stage', 'Always use $project last', 'Avoid using $sort'], correct: 1 },
      { id: 'q5-5', question: 'What does { allowDiskUse: true } do?', options: ['Speeds up all queries', 'Allows pipeline to use disk when memory limit is exceeded', 'Creates an index on disk', 'Enables caching'], correct: 1 },
    ],
    exercises: [
      { title: 'User Order Lookup', description: 'Join orders with users to show each order\'s user name, total, and status.', dataset: 'orders', defaultCode: 'db.orders.aggregate([\n  { $lookup: { from: "users", localField: "userId", foreignField: "_id", as: "customer" } },\n  { $unwind: "$customer" },\n  { $project: { "customer.name": 1, total: 1, status: 1 } }\n])' },
      { title: 'Category Revenue via Lookup', description: 'Join orders with products to calculate total revenue per product category.', dataset: 'orders' },
      { title: 'Optimize a Pipeline', description: 'Rewrite this suboptimal pipeline: sort all orders by total descending, then filter by status "delivered", then show only the top 3.', dataset: 'orders', defaultCode: '// Optimized:\ndb.orders.aggregate([\n  { $match: { status: "delivered" } },\n  { $sort: { total: -1 } },\n  { $limit: 3 }\n])' },
    ],
  },

  // ═══════════════════════════════════════════════
  // Module 6: Transactions & Concurrency Control
  // ═══════════════════════════════════════════════
  {
    id: 'mod-6',
    title: 'Transactions & Concurrency Control',
    lessons: [
      {
        id: 'm6-l1',
        title: 'ACID Transactions in MongoDB',
        objectives: [
          'Understand ACID properties and how transactions enforce them',
          'Use session.withTransaction() for multi-document transactions',
          'Implement money transfer scenarios with rollback on failure',
          'Understand transaction limits and when to use them',
        ],
        content: `
          <h2 class="text-2xl font-bold mb-4 text-gray-900">ACID Transactions</h2>
          <p class="mb-4 text-gray-700 leading-relaxed">MongoDB supports <strong>multi-document ACID transactions</strong> (since version 4.0). A transaction ensures a group of operations either ALL succeed or ALL are rolled back.</p>

          <h3 class="text-xl font-semibold mt-6 mb-3 text-gray-800">The ACID Acronym</h3>
          <ul class="list-disc pl-6 mb-4 text-gray-700 space-y-2">
            <li><strong>Atomic</strong> — All operations in the transaction complete, or none do</li>
            <li><strong>Consistent</strong> — The database moves from one valid state to another</li>
            <li><strong>Isolated</strong> — Concurrent transactions don't interfere with each other</li>
            <li><strong>Durable</strong> — Once committed, the data persists even after a crash</li>
          </ul>

          <h3 class="text-xl font-semibold mt-6 mb-3 text-gray-800">Transaction Example</h3>
          <pre class="bg-gray-900 text-green-400 p-4 rounded-lg overflow-x-auto mb-4"><code>// Transfer $100 from Savings to Checking
const session = db.getMongo().startSession();
session.startTransaction();

try {
  db.transactions.updateOne(
    { fromAccount: "acc-savings-001" },
    { $inc: { amount: -100 } },
    { session }
  );
  db.transactions.updateOne(
    { fromAccount: "acc-checking-001" },
    { $inc: { amount: 100 } },
    { session }
  );
  session.commitTransaction();
} catch (error) {
  session.abortTransaction();  // Both updates are rolled back!
}</code></pre>
        `,
        defaultCode: '// View account transactions\ndb.transactions.find()',
        takeaways: [
          'ACID transactions ensure all-or-nothing execution across multiple documents and collections',
          'Use session.withTransaction() for automatic retry and commit/abort logic',
          'Transactions in MongoDB work across replica sets (4.0+) and sharded clusters (4.2+)',
          'Keep transactions short — they hold locks and impact concurrent operations',
        ],
      },
      {
        id: 'm6-l2',
        title: 'Concurrency & Isolation',
        objectives: [
          'Understand read and write conflicts in concurrent environments',
          'Configure Read Concern and Write Concern for consistency guarantees',
          'Use optimistic concurrency control patterns',
          'Understand the tradeoff between consistency and performance',
        ],
        content: `
          <h2 class="text-2xl font-bold mb-4 text-gray-900">Concurrency Control</h2>
          <p class="mb-4 text-gray-700 leading-relaxed">When multiple users or processes read and write data simultaneously, you need <strong>concurrency control</strong> to prevent data corruption and ensure consistent results.</p>

          <h3 class="text-xl font-semibold mt-6 mb-3 text-gray-800">Read Concern Levels</h3>
          <ul class="list-disc pl-6 mb-4 text-gray-700 space-y-2">
            <li><strong>"local"</strong> — Return the most recent data on this server (fast, may be stale)</li>
            <li><strong>"majority"</strong> — Return data that has been acknowledged by a majority of replica set members</li>
            <li><strong>"linearizable"</strong> — Return the most current data (slowest, strongest guarantee)</li>
          </ul>

          <h3 class="text-xl font-semibold mt-6 mb-3 text-gray-800">Write Concern Levels</h3>
          <ul class="list-disc pl-6 mb-4 text-gray-700 space-y-2">
            <li><strong>w: 1</strong> — Acknowledge after primary writes (fast, risk of rollback)</li>
            <li><strong>w: "majority"</strong> — Acknowledge after majority of members confirm (safer)</li>
            <li><strong>w: "majority", j: true</strong> — Acknowledge after majority writes to journal (safest)</li>
          </ul>

          <div class="bg-yellow-50 border-l-4 border-yellow-500 p-4 my-6 rounded-r-lg">
            <p class="text-yellow-800"><strong>⚖️ Trade-off:</strong> Stronger consistency guarantees = slower performance. Choose the minimal level that meets your application's needs. A social media "like" button can use "local"; a bank transfer needs "majority".</p>
          </div>
        `,
        defaultCode: '// View transactions data (simulating concurrent updates)\ndb.transactions.find()',
        takeaways: [
          'Read Concern controls which data is visible to reads (stale vs up-to-date)',
          'Write Concern controls when a write is acknowledged (fast vs durable)',
          'Higher consistency levels provide stronger guarantees but slower performance',
          'Optimistic concurrency uses version numbers or timestamps to detect conflicts',
        ],
      },
      {
        id: 'm6-l3',
        title: 'Multi-Document Transactions in Practice',
        objectives: [
          'Write robust transaction logic with retry mechanisms',
          'Handle transaction errors and conflicts gracefully',
          'Use the transaction number pattern for idempotent operations',
          'Understand when transactions are necessary vs overkill',
        ],
        content: `
          <h2 class="text-2xl font-bold mb-4 text-gray-900">Transactions in Practice</h2>
          <p class="mb-4 text-gray-700 leading-relaxed">Multi-document transactions are powerful but should be used judiciously. Many operations that would require transactions in SQL can be handled with atomic operations or embedded documents in MongoDB.</p>

          <h3 class="text-xl font-semibold mt-6 mb-3 text-gray-800">When to Use Transactions</h3>
          <ul class="list-disc pl-6 mb-4 text-gray-700 space-y-2">
            <li><strong>Financial transfers</strong> — Must debit one account and credit another atomically</li>
            <li><strong>Order + Inventory</strong> — Reserve stock when an order is placed, both must succeed</li>
            <li><strong>Multi-document consistency</strong> — When two documents must be updated together</li>
          </ul>

          <h3 class="text-xl font-semibold mt-6 mb-3 text-gray-800">When NOT to Use Transactions</h3>
          <ul class="list-disc pl-6 mb-4 text-gray-700 space-y-2">
            <li>Single document updates (atomic by default!)</li>
            <li>Operations that can use atomic operators like $inc or $push</li>
            <li>Read-only operations that don't need strict consistency</li>
          </ul>

          <pre class="bg-gray-900 text-green-400 p-4 rounded-lg overflow-x-auto mb-4"><code>// Atomic single-document update (no transaction needed!)
db.inventory.updateOne(
  { productId: "p1", stock: { $gte: 1 } },
  { $inc: { stock: -1 } }
)
// The $inc is atomic — no two clients can decrement the same stock simultaneously</code></pre>
        `,
        defaultCode: '// View inventory stock (used with atomic $inc updates)\ndb.inventory.find()',
        takeaways: [
          'Use transactions only when you need atomic updates across multiple documents',
          'Many operations can be done atomically on a single document with $inc, $push, etc.',
          'Always include retry logic in transaction code — conflicts are common under load',
          'Keep transactions short (under 1 minute) to avoid holding locks too long',
        ],
      },
    ],
    quiz: [
      { id: 'q6-1', question: 'What does ACID stand for?', options: ['Atomic, Consistent, Isolated, Durable', 'Accurate, Complete, Independent, Durable', 'Atomic, Concurrent, Isolated, Durable', 'Automatic, Consistent, Isolated, Data'], correct: 0 },
      { id: 'q6-2', question: 'Which method commits a transaction?', options: ['session.commit()', 'session.commitTransaction()', 'db.commit()', 'transaction.save()'], correct: 1 },
      { id: 'q6-3', question: 'What does Write Concern w: "majority" mean?', options: ['Write is acknowledged after primary writes', 'Write is acknowledged after most replica set members confirm', 'Write waits for all members to confirm', 'Write is not acknowledged'], correct: 1 },
      { id: 'q6-4', question: 'Which update operator is atomic and does not require a transaction?', options: ['$set', '$inc', '$push', '$pull'], correct: 1 },
    ],
    exercises: [
      { title: 'Atomic Stock Decrement', description: 'Use $inc to atomically decrement stock for product p4 by 1 (simulating a sale). No transaction needed!', dataset: 'inventory', defaultCode: 'db.inventory.updateOne(\n  { productId: "p4", qty: { $gte: 1 } },\n  { $inc: { qty: -1 } }\n)' },
      { title: 'Transaction Scenario', description: 'Design a transaction flow for processing a customer order that must: (1) create the order, (2) decrement inventory, and (3) charge the customer. Which operations need a transaction?', dataset: 'orders' },
    ],
  },

  // ═══════════════════════════════════════════════
  // Module 7: Performance Tuning & Query Optimization
  // ═══════════════════════════════════════════════
  {
    id: 'mod-7',
    title: 'Performance Tuning & Query Optimization',
    lessons: [
      {
        id: 'm7-l1',
        title: 'Indexing Strategies',
        objectives: [
          'Create single-field, compound, and multikey indexes',
          'Understand index types: unique, sparse, TTL, text',
          'Use explain() to verify index usage',
          'Analyze index performance with execution stats',
        ],
        content: `
          <h2 class="text-2xl font-bold mb-4 text-gray-900">Index Types and Strategies</h2>
          <p class="mb-4 text-gray-700 leading-relaxed">Indexes are data structures that improve the speed of data retrieval operations. Think of them as a <strong>book index</strong> — without one, you'd have to read every page to find what you need.</p>

          <h3 class="text-xl font-semibold mt-6 mb-3 text-gray-800">Index Types</h3>
          <ul class="list-disc pl-6 mb-4 text-gray-700 space-y-2">
            <li><strong>Single Field</strong> — Index on one field (db.collection.createIndex({ name: 1 }))</li>
            <li><strong>Compound</strong> — Index on multiple fields (db.collection.createIndex({ name: 1, age: -1 }))</li>
            <li><strong>Multikey</strong> — Automatically created for array fields (each array element gets an index entry)</li>
            <li><strong>Text</strong> — Full-text search index for string content</li>
            <li><strong>TTL</strong> — Time-To-Live index that automatically expires documents</li>
            <li><strong>Unique</strong> — Ensures no duplicate values in the indexed field</li>
          </ul>

          <h3 class="text-xl font-semibold mt-6 mb-3 text-gray-800">Using explain()</h3>
          <pre class="bg-gray-900 text-green-400 p-4 rounded-lg overflow-x-auto mb-4"><code>// Check how MongoDB executes a query
db.users.find({ status: "A" }).explain("executionStats")

// Look for:
// "stage": "COLLSCAN"  ← Bad! Scanning every document
// "stage": "IXSCAN"    ← Good! Using an index
// "totalDocsExamined" vs "nReturned" ← Should be close!</code></pre>
        `,
        defaultCode: 'db.users.find({ status: "A" }).explain("executionStats")',
        takeaways: [
          'Indexes dramatically speed up reads but slow down writes — find the right balance',
          'Use explain("executionStats") to verify queries use indexes (IXSCAN vs COLLSCAN)',
          'Compound indexes should follow the ESR rule: Equality → Sort → Range',
          'Multikey indexes are automatically created for array fields',
        ],
      },
      {
        id: 'm7-l2',
        title: 'Query Profiling & explain()',
        objectives: [
          'Read and interpret explain() output to diagnose slow queries',
          'Identify COLLSCAN vs IXSCAN and understand the difference',
          'Use the MongoDB profiler to find slow queries automatically',
          'Optimize queries based on profiling data',
        ],
        content: `
          <h2 class="text-2xl font-bold mb-4 text-gray-900">Profiling and explain()</h2>
          <p class="mb-4 text-gray-700 leading-relaxed">When a query is slow, <code>explain()</code> is your first diagnostic tool. It reveals exactly how MongoDB executed the query — which indexes were used, how many documents were examined, and how long it took.</p>

          <h3 class="text-xl font-semibold mt-6 mb-3 text-gray-800">Reading explain Output</h3>
          <pre class="bg-gray-900 text-green-400 p-4 rounded-lg overflow-x-auto mb-4"><code>// Key fields in explain("executionStats"):
// 
// winningPlan.stage: "COLLSCAN" = full collection scan (BAD!)
//                    "IXSCAN"    = index scan (GOOD!)
//
// executionStats.nReturned         = documents returned
// executionStats.totalDocsExamined = documents examined
// executionStats.executionTimeMillis = time in ms
//
// If totalDocsExamined >> nReturned, create a better index!</code></pre>

          <h3 class="text-xl font-semibold mt-6 mb-3 text-gray-800">The MongoDB Profiler</h3>
          <pre class="bg-gray-900 text-green-400 p-4 rounded-lg overflow-x-auto mb-4"><code>// Enable profiling for slow queries (> 100ms)
db.setProfilingLevel(1, { slowms: 100 })

// View recent slow queries
db.system.profile.find().sort({ ts: -1 }).limit(5)

// Disable profiling
db.setProfilingLevel(0)</code></pre>

          <div class="bg-green-50 border-l-4 border-green-600 p-4 my-6 rounded-r-lg">
            <p class="text-green-800"><strong>🎯 Target:</strong> In a well-tuned system, totalDocsExamined should be close to nReturned. If you're examining 10,000 documents to return 10, something is wrong!</p>
          </div>
        `,
        defaultCode: 'db.products.find({ category: "Electronics", price: { $gt: 100 } }).explain("executionStats")',
        takeaways: [
          'explain("executionStats") shows exact execution details: stages, documents examined, time taken',
          'COLLSCAN means MongoDB scanned every document — add an index for better performance',
          'The MongoDB profiler logs slow queries to the system.profile collection automatically',
          'A large gap between totalDocsExamined and nReturned signals a missing or incorrect index',
        ],
      },
      {
        id: 'm7-l3',
        title: 'Performance Monitoring Tools',
        objectives: [
          'Use mongostat and mongotop for real-time monitoring',
          'Monitor key metrics: opcounters, connections, page faults',
          'Identify common performance bottlenecks',
          'Apply performance best practices for production deployments',
        ],
        content: `
          <h2 class="text-2xl font-bold mb-4 text-gray-900">Performance Monitoring</h2>
          <p class="mb-4 text-gray-700 leading-relaxed">Monitoring MongoDB's performance is essential for production deployments. Key tools help you identify bottlenecks before they become outages.</p>

          <h3 class="text-xl font-semibold mt-6 mb-3 text-gray-800">Key Metrics</h3>
          <ul class="list-disc pl-6 mb-4 text-gray-700 space-y-2">
            <li><strong>Opcounters</strong> — Rate of inserts, queries, updates, deletes per second</li>
            <li><strong>Connections</strong> — Current number of client connections (default max: 1000)</li>
            <li><strong>Page Faults</strong> — Data requested that wasn't in RAM (slower, requires disk reads)</li>
            <li><strong>Working Set</strong> — The data and indexes that need to fit in RAM for good performance</li>
            <li><strong>Write Conflicts</strong> — Number of concurrent write conflicts (indicates contention)</li>
          </ul>

          <h3 class="text-xl font-semibold mt-6 mb-3 text-gray-800">Common Bottlenecks</h3>
          <pre class="bg-gray-900 text-green-400 p-4 rounded-lg overflow-x-auto mb-4"><code>// 1. Missing Index — Full collection scans
//    Fix: Add index matching the query pattern

// 2. Working Set > RAM — High page faults
//    Fix: Scale up RAM or reduce working set size

// 3. Hot Shard — Uneven data distribution
//    Fix: Choose a better shard key with high cardinality

// 4. Lock Contention — Too many concurrent writes
//    Fix: Use document-level concurrency (modern WiredTiger)</code></pre>
        `,
        defaultCode: '// Check server status (simplified)\ndb.serverStatus().opcounters',
        takeaways: [
          'Monitor opcounters to understand your workload patterns (read-heavy vs write-heavy)',
          'Page faults indicate the working set exceeds available RAM — the most common performance issue',
          'Write conflicts suggest contention on hot documents — consider schema redesign',
          'The working set (frequently accessed data + indexes) should fit in RAM for optimal performance',
        ],
      },
    ],
    quiz: [
      { id: 'q7-1', question: 'What does "COLLSCAN" mean in explain output?', options: ['Query used an index', 'Query scanned every document (no index used)', 'Query returned no results', 'Query was cached'], correct: 1 },
      { id: 'q7-2', question: 'What command enables the MongoDB profiler for slow queries?', options: ['db.enableProfiler()', 'db.setProfilingLevel(1, { slowms: 100 })', 'db.startProfile()', 'db.setProfiler(100)'], correct: 1 },
      { id: 'q7-3', question: 'What does a high page fault rate indicate?', options: ['Database is very fast', 'Working set exceeds available RAM', 'Too many indexes', 'Network issues'], correct: 1 },
      { id: 'q7-4', question: 'What is the recommended ratio of totalDocsExamined to nReturned?', options: ['10:1', 'As close to 1:1 as possible', 'TotalDocsExamined should always be larger', 'It doesn\'t matter'], correct: 1 },
    ],
    exercises: [
      { title: 'Explain Analysis', description: 'Run explain("executionStats") on a query that filters by category and sorts by price. Identify whether it uses COLLSCAN or IXSCAN.', dataset: 'products', defaultCode: 'db.products.find({ category: "Electronics" }).sort({ price: -1 }).explain("executionStats")' },
      { title: 'Create Index', description: 'Create an index on the products collection to optimize queries filtering by category and sorting by price.', dataset: 'products', defaultCode: 'db.products.createIndex({ category: 1, price: -1 })' },
      { title: 'Profiler Setup', description: 'Set up profiling to capture all queries taking longer than 50ms (simulated command).', dataset: 'products', defaultCode: 'db.setProfilingLevel(1, { slowms: 50 })' },
    ],
  },

  // ═══════════════════════════════════════════════
  // Module 8: Replication & Sharding Architecture
  // ═══════════════════════════════════════════════
  {
    id: 'mod-8',
    title: 'Replication & Sharding Architecture',
    lessons: [
      {
        id: 'm8-l1',
        title: 'Replica Sets & High Availability',
        objectives: [
          'Understand replica set architecture (primary, secondary, arbiter)',
          'Explain the election process and automatic failover',
          'Configure read preference for scaling reads',
          'Understand the oplog and data replication mechanism',
        ],
        content: `
          <h2 class="text-2xl font-bold mb-4 text-gray-900">Replica Sets</h2>
          <p class="mb-4 text-gray-700 leading-relaxed">A <strong>replica set</strong> is a group of MongoDB servers that maintain the same data set. It provides <strong>high availability</strong> and <strong>redundancy</strong> through automatic failover and data replication.</p>

          <h3 class="text-xl font-semibold mt-6 mb-3 text-gray-800">Replica Set Members</h3>
          <ul class="list-disc pl-6 mb-4 text-gray-700 space-y-2">
            <li><strong>Primary</strong> — The main member. All writes go to the primary. There is only one primary at any time.</li>
            <li><strong>Secondary</strong> — Replicates the primary's data (via oplog). Can serve read queries if configured. Steps up if the primary fails.</li>
            <li><strong>Arbiter</strong> — A lightweight member that only votes in elections. Doesn't store data. Used for tie-breaking in even-numbered replica sets.</li>
          </ul>

          <h3 class="text-xl font-semibold mt-6 mb-3 text-gray-800">The Oplog</h3>
          <pre class="bg-gray-900 text-green-400 p-4 rounded-lg overflow-x-auto mb-4"><code>// The oplog (operations log) is a capped collection
// that records every write operation.
// Secondaries read from the oplog to replicate data.

// View oplog status
rs.printReplicationInfo()

// Check replica set status
rs.status()</code></pre>

          <div class="bg-green-50 border-l-4 border-green-600 p-4 my-6 rounded-r-lg">
            <p class="text-green-800"><strong>🏆 Recommendation:</strong> Use at least 3 members: Primary + Secondary + Secondary. Avoid arbiters in production if possible — they add a vote but no data redundancy.</p>
          </div>
        `,
        defaultCode: '// Simulated: view replica set status\nrs.status()',
        takeaways: [
          'Replica sets provide automatic failover: if the primary fails, a secondary is elected as new primary',
          'The oplog records all writes and enables secondaries to stay in sync with the primary',
          'Read preference can route reads to secondaries to distribute load (secondaryPreferred)',
          'Most replica sets should have an odd number of members (3, 5, 7) to avoid tie votes in elections',
        ],
      },
      {
        id: 'm8-l2',
        title: 'Sharding Concepts',
        objectives: [
          'Understand when to shard — data size and throughput thresholds',
          'Identify sharding components: mongos, shards, config servers',
          'Choose appropriate shard keys for even data distribution',
          'Understand chunk splitting and balancing',
        ],
        content: `
          <h2 class="text-2xl font-bold mb-4 text-gray-900">Sharding Concepts</h2>
          <p class="mb-4 text-gray-700 leading-relaxed"><strong>Sharding</strong> is MongoDB's approach to horizontal scaling. It distributes data across multiple machines, allowing you to store more data and handle more throughput than any single server could.</p>

          <h3 class="text-xl font-semibold mt-6 mb-3 text-gray-800">Sharding Architecture</h3>
          <ul class="list-disc pl-6 mb-4 text-gray-700 space-y-2">
            <li><strong>Shards</strong> — Each shard contains a subset of the data. Each shard is typically a replica set.</li>
            <li><strong>mongos</strong> — Query router. The application connects to mongos, which routes queries to the appropriate shards.</li>
            <li><strong>Config Servers</strong> — Store metadata about which data lives on which shard.</li>
          </ul>

          <h3 class="text-xl font-semibold mt-6 mb-3 text-gray-800">When to Shard</h3>
          <pre class="bg-gray-900 text-green-400 p-4 rounded-lg overflow-x-auto mb-4"><code>// Consider sharding when:
// 1. Data exceeds 2-3 TB per server
// 2. Write throughput exceeds a single server's capacity
// 3. Working set doesn't fit in RAM
// 4. Need geographically distributed data (data locality)

// Enable sharding on a database
sh.enableSharding("academy")

// Shard a collection by a key
sh.shardCollection("academy.orders", { userId: "hashed" })</code></pre>
        `,
        defaultCode: '// Simulated: view sharding status\nsh.status()',
        takeaways: [
          'Sharding horizontally partitions data across servers — each shard holds a subset of the data',
          'Use mongos routers to connect applications to the sharded cluster transparently',
          'Choose a shard key with high cardinality and even distribution to avoid "hot shards"',
          'Hashed shard keys provide the most even distribution but don\'t support range queries',
        ],
      },
      {
        id: 'm8-l3',
        title: 'Choosing a Shard Key',
        objectives: [
          'Evaluate shard key candidates based on cardinality, frequency, and distribution',
          'Differentiate between ranged and hashed sharding strategies',
          'Avoid common shard key pitfalls (monotonic keys, low cardinality)',
          'Recognize the "jumbo chunk" problem and how to prevent it',
        ],
        content: `
          <h2 class="text-2xl font-bold mb-4 text-gray-900">Choosing the Right Shard Key</h2>
          <p class="mb-4 text-gray-700 leading-relaxed">The shard key is the single most important decision in sharding. A bad shard key leads to uneven data distribution, performance problems, and operational headaches.</p>

          <h3 class="text-xl font-semibold mt-6 mb-3 text-gray-800">Characteristics of a Good Shard Key</h3>
          <ul class="list-disc pl-6 mb-4 text-gray-700 space-y-2">
            <li><strong>High Cardinality</strong> — Many distinct values (email > gender, zip code > state)</li>
            <li><strong>Low Frequency</strong> — No single value appears in too many documents</li>
            <li><strong>Non-Monotonic</strong> — Values don't always increase (a timestamp alone is a poor choice)</li>
          </ul>

          <h3 class="text-xl font-semibold mt-6 mb-3 text-gray-800">Ranged vs Hashed Sharding</h3>
          <pre class="bg-gray-900 text-green-400 p-4 rounded-lg overflow-x-auto mb-4"><code>// Ranged Sharding — Good for range queries
sh.shardCollection("academy.users", { "address.city": 1 })
// Data is split by city: A-D on shard1, E-K on shard2, etc.
// ❌ Risk: "New York" has more users than other cities (hot shard)

// Hashed Sharding — Even distribution, no range queries
sh.shardCollection("academy.orders", { _id: "hashed" })
// _id is hashed into a random distribution
// ✅ Even data across shards
// ❌ Can't do range queries on _id efficiently</code></pre>
        `,
        defaultCode: '// Check shard distribution\nsh.status()',
        takeaways: [
          'Good shard key: high cardinality, low frequency, evenly distributed values',
          'Avoid monotonic shard keys (timestamps, auto-increment IDs) — they create hot spots',
          'Hashed sharding provides the most even distribution but sacrifices range query support',
          'Jumbo chunks (un-splittable chunks) occur when many documents share the same shard key value',
        ],
      },
    ],
    quiz: [
      { id: 'q8-1', question: 'What happens when a primary node fails in a replica set?', options: ['The database stops working', 'A secondary is automatically elected as the new primary', 'Data is lost', 'Clients must manually select a new primary'], correct: 1 },
      { id: 'q8-2', question: 'Which component routes queries in a sharded cluster?', options: ['mongod', 'mongos', 'config server', 'shard'], correct: 1 },
      { id: 'q8-3', question: 'What is a characteristic of a good shard key?', options: ['Low cardinality', 'High cardinality and even distribution', 'Monotonically increasing', 'Based on timestamp only'], correct: 1 },
      { id: 'q8-4', question: 'What is the minimum recommended number of replica set members?', options: ['1', '2', '3', '5'], correct: 2 },
    ],
    exercises: [
      { title: 'Evaluate Shard Key', description: 'Consider sharding the orders collection. Which field(s) would make a good shard key? userId, order date, order status, or _id hashed? Explain your reasoning.', dataset: 'orders' },
      { title: 'Replica Set Design', description: 'Design a replica set for a critical e-commerce platform. How many members? Where should they be geographically located?', dataset: 'orders' },
    ],
  },

  // ═══════════════════════════════════════════════
  // Module 9: Change Streams & Real-time Apps
  // ═══════════════════════════════════════════════
  {
    id: 'mod-9',
    title: 'Change Streams & Real-time Apps',
    lessons: [
      {
        id: 'm9-l1',
        title: 'Introduction to Change Streams',
        objectives: [
          'Understand what change streams are and how they work',
          'Open a change stream on a collection, database, or deployment',
          'Process change events (insert, update, replace, delete)',
          'Use resume tokens for fault-tolerant event processing',
        ],
        content: `
          <h2 class="text-2xl font-bold mb-4 text-gray-900">Introduction to Change Streams</h2>
          <p class="mb-4 text-gray-700 leading-relaxed"><strong>Change Streams</strong> allow applications to access real-time data changes without the overhead of polling. MongoDB pushes change events to subscribers as they happen.</p>

          <h3 class="text-xl font-semibold mt-6 mb-3 text-gray-800">How Change Streams Work</h3>
          <p class="mb-4 text-gray-700 leading-relaxed">Change streams use the <strong>oplog</strong> (operations log) — the same mechanism used by replica sets. When a write happens, MongoDB adds an entry to the oplog. Change streams read from the oplog and emit events to subscribers.</p>

          <h3 class="text-xl font-semibold mt-6 mb-3 text-gray-800">Opening a Change Stream</h3>
          <pre class="bg-gray-900 text-green-400 p-4 rounded-lg overflow-x-auto mb-4"><code>// Watch all changes on a collection
const changeStream = db.orders.watch();

// Listen for change events
while (!changeStream.isClosed()) {
  const event = changeStream.next();
  printjson(event);
}

// Sample change event output:
// {
//   "operationType": "insert",
//   "fullDocument": { "_id": "o6", "total": 99, ... },
//   "ns": { "db": "academy", "coll": "orders" },
//   "documentKey": { "_id": "o6" }
// }</code></pre>

          <div class="bg-green-50 border-l-4 border-green-600 p-4 my-6 rounded-r-lg">
            <p class="text-green-800"><strong>🔑 Resume Tokens:</strong> Each change event includes a resume token. If your application restarts, you can resume the change stream from the last processed token — no events missed!</p>
          </div>
        `,
        defaultCode: '// Watch the orders collection for changes\ndb.orders.watch()',
        takeaways: [
          'Change streams provide real-time data change notifications without polling',
          'Events include: insert, update, replace, delete, drop, rename, invalidate',
          'Each event has a resume token for fault-tolerant event processing',
          'Change streams require a replica set (they read from the oplog)',
        ],
      },
      {
        id: 'm9-l2',
        title: 'Building Real-time Applications',
        objectives: [
          'Implement real-time dashboards using change streams',
          'Combine change streams with WebSockets for live updates',
          'Filter change events using $match stage in the pipeline',
          'Handle change stream errors and resumption gracefully',
        ],
        content: `
          <h2 class="text-2xl font-bold mb-4 text-gray-900">Building Real-time Apps</h2>
          <p class="mb-4 text-gray-700 leading-relaxed">Change streams enable powerful real-time applications: live dashboards, notification systems, collaborative editing, and event-driven architectures.</p>

          <h3 class="text-xl font-semibold mt-6 mb-3 text-gray-800">Real-time Dashboard Example</h3>
          <pre class="bg-gray-900 text-green-400 p-4 rounded-lg overflow-x-auto mb-4"><code>// Watch for new high-value orders (real-time alert)
db.orders.watch([
  { $match: { 
    "operationType": "insert",
    "fullDocument.total": { $gte: 500 } 
  }}
]);

// When a new order > $500 comes in:
// 1. Change stream emits the event
// 2. Server pushes notification to dashboard via WebSocket
// 3. Dashboard shows a green flash: "New order: $1,299!"
// 4. Inventory chart updates automatically</code></pre>

          <h3 class="text-xl font-semibold mt-6 mb-3 text-gray-800">Common Use Cases</h3>
          <ul class="list-disc pl-6 mb-4 text-gray-700 space-y-2">
            <li><strong>Live dashboards</strong> — Sales metrics that update in real-time</li>
            <li><strong>Notifications</strong> — Alert when a critical event occurs</li>
            <li><strong>Caching invalidation</strong> — Clear cache when data changes</li>
            <li><strong>Cross-service sync</strong> — Trigger actions in other microservices</li>
          </ul>

          <div class="bg-blue-50 border-l-4 border-blue-600 p-4 my-6 rounded-r-lg">
            <p class="text-blue-800"><strong>🔄 Pattern:</strong> Change Streams → Message Queue → Workers. Use change streams as a trigger to publish messages to a queue (like RabbitMQ or Kafka) for reliable async processing.</p>
          </div>
        `,
        defaultCode: '// Watch for inserts with total >= 500\ndb.orders.watch([\n  { $match: { "operationType": "insert", "fullDocument.total": { $gte: 500 } } }\n])',
        takeaways: [
          'Filter change streams with aggregation pipelines to receive only relevant events',
          'Combine with WebSockets for browser-based real-time updates',
          'Common patterns: live dashboards, notifications, cache invalidation, cross-service triggers',
          'Always handle change stream errors and implement reconnection logic',
        ],
      },
      {
        id: 'm9-l3',
        title: 'Change Streams with Aggregation',
        objectives: [
          'Apply aggregation pipelines to filter and transform change events',
          'Use $project on change events to reshape output',
          'Monitor specific document changes with documentKey filters',
          'Understand change event structure and how to parse it',
        ],
        content: `
          <h2 class="text-2xl font-bold mb-4 text-gray-900">Change Streams with Aggregation Pipelines</h2>
          <p class="mb-4 text-gray-700 leading-relaxed">You can pass an aggregation pipeline to <code>watch()</code> to filter, transform, and reshape change events before they reach your application.</p>

          <h3 class="text-xl font-semibold mt-6 mb-3 text-gray-800">Filtering Change Events</h3>
          <pre class="bg-gray-900 text-green-400 p-4 rounded-lg overflow-x-auto mb-4"><code>// Only watch for updates and inserts
db.orders.watch([
  { $match: { 
    operationType: { $in: ["insert", "update"] }
  }}
]);

// Watch a specific document
db.orders.watch([
  { $match: { 
    "documentKey._id": "o1" 
  }}
]);

// Project only relevant fields from change events
db.orders.watch([
  { $match: { operationType: "insert" } },
  { $project: {
    "fullDocument.total": 1,
    "fullDocument.status": 1,
    operationType: 1
  }}
]);</code></pre>

          <div class="bg-yellow-50 border-l-4 border-yellow-500 p-4 my-6 rounded-r-lg">
            <p class="text-yellow-800"><strong>⚠️ Note:</strong> Change events from updates include only the fields that changed (updateDescription). To see the full document after an update, enable <code>{ fullDocument: "updateLookup" }</code> on the watch.</p>
          </div>
        `,
        defaultCode: '// Filtered watch: only inserts with total > 200\ndb.orders.watch([\n  { $match: { "operationType": "insert", "fullDocument.total": { $gt: 200 } } }\n])',
        takeaways: [
          'Pass an aggregation pipeline to watch() to filter and transform change events',
          'Filter by operationType to receive only specific operations (insert, update, delete)',
          'Use documentKey to watch changes on a specific document',
          'The fullDocument: "updateLookup" option retrieves the complete document after an update',
        ],
      },
    ],
    quiz: [
      { id: 'q9-1', question: 'What do Change Streams use to detect data changes?', options: ['Watchdog timers', 'The oplog (operations log)', 'Polling every second', 'Database triggers'], correct: 1 },
      { id: 'q9-2', question: 'What is a resume token used for?', options: ['Restarting the database', 'Resuming a change stream from a specific point after a restart', 'Creating a backup', 'Pausing a change stream'], correct: 1 },
      { id: 'q9-3', question: 'Which prerequisite is required for Change Streams?', options: ['Standalone server', 'Replica set', 'Sharded cluster only', 'Atlas only'], correct: 1 },
      { id: 'q9-4', question: 'How can you filter change events to only receive inserts?', options: ['Use a $match pipeline stage on operationType', 'Use the filter() method', 'Use onlyInsert: true', 'Filtering is not possible'], correct: 0 },
    ],
    exercises: [
      { title: 'Change Stream Filter', description: 'Write a change stream that only watches for "update" operations on the inventory collection (to track stock changes).', dataset: 'inventory', defaultCode: 'db.inventory.watch([\n  { $match: { operationType: "update" } }\n])' },
      { title: 'Real-time Alert', description: 'Create a change stream pipeline that alerts when a new order with total > $1000 is inserted.', dataset: 'orders', defaultCode: 'db.orders.watch([\n  { $match: { operationType: "insert", "fullDocument.total": { $gt: 1000 } } }\n])' },
    ],
  },

  // ═══════════════════════════════════════════════
  // Module 10: Time Series & Atlas Search
  // ═══════════════════════════════════════════════
  {
    id: 'mod-10',
    title: 'Time Series & Atlas Search',
    lessons: [
      {
        id: 'm10-l1',
        title: 'Time Series Collections',
        objectives: [
          'Understand time series collections and when to use them',
          'Create a time series collection with proper configuration',
          'Query time series data efficiently',
          'Compare time series collections vs regular collections for IoT data',
        ],
        content: `
          <h2 class="text-2xl font-bold mb-4 text-gray-900">Time Series Collections</h2>
          <p class="mb-4 text-gray-700 leading-relaxed"><strong>Time Series Collections</strong> (MongoDB 5.0+) are optimized for storing and querying time-based data. They automatically organize data into buckets for efficient storage and fast temporal queries.</p>

          <h3 class="text-xl font-semibold mt-6 mb-3 text-gray-800">Creating a Time Series Collection</h3>
          <pre class="bg-gray-900 text-green-400 p-4 rounded-lg overflow-x-auto mb-4"><code>// Create a time series collection for sensor data
db.createCollection("sensorData", {
  timeseries: {
    timeField: "timestamp",
    metaField: "deviceId",
    granularity: "minutes"
  }
});

// Insert data (looks the same as regular inserts)
db.sensorData.insertOne({
  deviceId: "sensor-temp-01",
  timestamp: ISODate("2024-06-14T10:00:00Z"),
  temperature: 72.5,
  humidity: 45
});</code></pre>

          <h3 class="text-xl font-semibold mt-6 mb-3 text-gray-800">Benefits Over Regular Collections</h3>
          <ul class="list-disc pl-6 mb-4 text-gray-700 space-y-2">
            <li>Up to 90% storage reduction through automatic bucketing and compression</li>
            <li>Optimized queries for time-range aggregations ($avg, $min, $max over time windows)</li>
            <li>Automatic indexing on timeField for fast range queries</li>
            <li>Built-in bucket granularity options: seconds, minutes, hours</li>
          </ul>

          <div class="bg-green-50 border-l-4 border-green-600 p-4 my-6 rounded-r-lg">
            <p class="text-green-800"><strong>📈 Perfect for:</strong> IoT sensor data, financial tick data, server metrics, application logs, weather data, or any time-stamped measurements.</p>
          </div>
        `,
        defaultCode: '// View sensor readings (simulating time series data)\ndb.sensor_readings.find()',
        takeaways: [
          'Time Series Collections automatically bucket data by time, reducing storage by up to 90%',
          'Configure with timeField (required), metaField (optional), and granularity',
          'Built-in optimizations for time-range aggregations like hourly/daily averages',
          'Ideal for IoT, financial data, metrics, logs, and any time-stamped measurement data',
        ],
      },
      {
        id: 'm10-l2',
        title: 'Atlas Search Fundamentals',
        objectives: [
          'Understand Atlas Search and its Lucene-based search engine',
          'Create search indexes with dynamic and static mappings',
          'Write $search queries with compound operators',
          'Implement autocomplete, fuzzy search, and relevance scoring',
        ],
        content: `
          <h2 class="text-2xl font-bold mb-4 text-gray-900">Atlas Search</h2>
          <p class="mb-4 text-gray-700 leading-relaxed"><strong>Atlas Search</strong> is MongoDB's integrated full-text search solution, powered by Apache Lucene. It provides advanced search capabilities directly within MongoDB Atlas.</p>

          <h3 class="text-xl font-semibold mt-6 mb-3 text-gray-800">Search vs Regular Queries</h3>
          <pre class="bg-gray-900 text-green-400 p-4 rounded-lg overflow-x-auto mb-4"><code>// Regular find — exact match only
db.products.find({ name: /wireless/i })

// Atlas Search — fuzzy, ranked, relevance-scored
db.products.aggregate([
  { $search: {
    index: "default",
    text: {
      query: "wireless headphone",
      path: "name",
      fuzzy: { maxEdits: 1 }
    }
  }},
  { $project: { name: 1, score: { $meta: "searchScore" } } }
]);</code></pre>

          <h3 class="text-xl font-semibold mt-6 mb-3 text-gray-800">Search Capabilities</h3>
          <ul class="list-disc pl-6 mb-4 text-gray-700 space-y-2">
            <li><strong>Full-text search</strong> — Search across multiple fields with ranking</li>
            <li><strong>Fuzzy search</strong> — Handle typos and misspellings (maxEdits: 1 or 2)</li>
            <li><strong>Autocomplete</strong> — Suggest search terms as the user types</li>
            <li><strong>Compound queries</strong> — Combine multiple search clauses (must, should, filter)</li>
            <li><strong>Facets</strong> — Count results by category, price range, etc.</li>
          </ul>
        `,
        defaultCode: '// Search for products containing "headphone"\ndb.products.aggregate([\n  { $search: {\n    index: "default",\n    text: { query: "headphone", path: "name" }\n  }}\n])',
        takeaways: [
          'Atlas Search provides full-text search with relevance scoring, fuzzy matching, and autocomplete',
          'Uses Apache Lucene under the hood — the same engine powering Elasticsearch',
          'Define search indexes with dynamic (auto) or static (manual) mappings',
          '$search stage integrates search results directly into aggregation pipelines',
        ],
      },
      {
        id: 'm10-l3',
        title: 'Building Search Indexes',
        objectives: [
          'Create search indexes with static mappings for field-level control',
          'Configure analyzers for different languages and use cases',
          'Use synonyms to improve search relevance',
          'Optimize search indexes for performance and relevance',
        ],
        content: `
          <h2 class="text-2xl font-bold mb-4 text-gray-900">Building Search Indexes</h2>
          <p class="mb-4 text-gray-700 leading-relaxed">Search indexes define how your data is processed for search. A well-configured search index is the foundation of a great search experience.</p>

          <h3 class="text-xl font-semibold mt-6 mb-3 text-gray-800">Dynamic vs Static Mappings</h3>
          <pre class="bg-gray-900 text-green-400 p-4 rounded-lg overflow-x-auto mb-4"><code>// Dynamic mapping — auto-indexes all string fields
{
  "mappings": { "dynamic": true }
}

// Static mapping — explicit control over indexed fields
{
  "mappings": {
    "dynamic": false,
    "fields": {
      "name": [ { "type": "string" }, { "type": "autocomplete" } ],
      "category": [ { "type": "string" } ],
      "price": [ { "type": "number" } ]
    }
  }
}</code></pre>

          <h3 class="text-xl font-semibold mt-6 mb-3 text-gray-800">Analyzers</h3>
          <ul class="list-disc pl-6 mb-4 text-gray-700 space-y-2">
            <li><strong>lucene.standard</strong> — Splits on whitespace and punctuation, lowercases (default)</li>
            <li><strong>lucene.simple</strong> — Divides text at non-letters and lowercases</li>
            <li><strong>lucene.keyword</strong> — Treats the entire field as one token (for exact matches)</li>
            <li><strong>lucene.english</strong> — English-specific stemming (running → run)</li>
          </ul>

          <div class="bg-blue-50 border-l-4 border-blue-600 p-4 my-6 rounded-r-lg">
            <p class="text-blue-800"><strong>💡 Synonyms:</strong> You can configure synonym mappings like "laptop" → "notebook", "computer" so searching for any of these terms returns all relevant products.</p>
          </div>
        `,
        defaultCode: '// Search with autocomplete suggestion\ndb.products.aggregate([\n  { $search: {\n    index: "default",\n    autocomplete: { query: "ultra", path: "name" }\n  }}\n])',
        takeaways: [
          'Static mappings give you precise control over which fields are indexed and how',
          'Analyzers determine how text is processed: tokenized, stemmed, lowercased, etc.',
          'Autocomplete fields enable real-time search suggestions as the user types',
          'Synonyms improve search relevance by mapping related terms together',
        ],
      },
    ],
    quiz: [
      { id: 'q10-1', question: 'What type of collection is optimized for IoT sensor data?', options: ['Capped collections', 'Time Series collections', 'Regular collections', 'Sharded collections'], correct: 1 },
      { id: 'q10-2', question: 'Which engine powers Atlas Search?', options: ['Elasticsearch', 'Apache Lucene', 'Google Search', 'Algolia'], correct: 1 },
      { id: 'q10-3', question: 'What does a fuzzy search with maxEdits: 1 do?', options: ['Searches for exact matches only', 'Finds results that differ by up to 1 character (handles typos)', 'Removes duplicates', 'Searches only in the first field'], correct: 1 },
      { id: 'q10-4', question: 'What is a key benefit of Time Series Collections?', options: ['Faster random reads', 'Up to 90% storage reduction through compression', 'Support for SQL queries', 'Automatic backups'], correct: 1 },
    ],
    exercises: [
      { title: 'Time Series Query', description: 'Calculate the average temperature per device from the sensor_readings collection, grouping by deviceId.', dataset: 'sensor_readings', defaultCode: 'db.sensor_readings.aggregate([\n  { $match: { type: "temperature" } },\n  { $group: { _id: "$deviceId", avgTemp: { $avg: "$value" } } }\n])' },
      { title: 'Search for Products', description: 'Write a $search query to find products with "mechanical" or "keyboard" in their name (with fuzzy matching).', dataset: 'products', defaultCode: 'db.products.aggregate([\n  { $search: { index: "default", text: { query: "mechanical keyboard", path: "name", fuzzy: { maxEdits: 1 } } } }\n])' },
    ],
  },

  // ═══════════════════════════════════════════════
  // Module 11: Realm Sync & Mobile
  // ═══════════════════════════════════════════════
  {
    id: 'mod-11',
    title: 'Realm Sync & Mobile',
    lessons: [
      {
        id: 'm11-l1',
        title: 'Introduction to Realm',
        objectives: [
          'Understand what Realm is and how it differs from MongoDB server',
          'Create data models using Realm object schemas',
          'Perform local CRUD operations with Realm',
          'Understand Realm\'s object-oriented data access patterns',
        ],
        content: `
          <h2 class="text-2xl font-bold mb-4 text-gray-900">Introduction to Realm</h2>
          <p class="mb-4 text-gray-700 leading-relaxed"><strong>Realm</strong> is a mobile-first, embedded database that runs directly on the client device (mobile, desktop, or IoT). It is designed for <strong>offline-first</strong> applications with optional synchronization to MongoDB Atlas.</p>

          <h3 class="text-xl font-semibold mt-6 mb-3 text-gray-800">Key Differences from MongoDB Server</h3>
          <ul class="list-disc pl-6 mb-4 text-gray-700 space-y-2">
            <li><strong>Embedded</strong> — Runs inside your app, no separate server needed</li>
            <li><strong>Object-based</strong> — Data maps directly to objects/classes in your code</li>
            <li><strong>Zero-copy</strong> — Reads are direct memory access (extremely fast)</li>
            <li><strong>Live objects</strong> — Changes to objects automatically update the UI</li>
          </ul>

          <h3 class="text-xl font-semibold mt-6 mb-3 text-gray-800">Realm Data Model Example</h3>
          <pre class="bg-gray-900 text-green-400 p-4 rounded-lg overflow-x-auto mb-4"><code>// Realm Object Schema (JavaScript example)
const TaskSchema = {
  name: "Task",
  primaryKey: "_id",
  properties: {
    _id: "objectId",
    name: "string",
    isComplete: { type: "bool", default: false },
    assignee: "string?",
    priority: { type: "int", default: 1 }
  }
};

// CRUD operations
const realm = await Realm.open({ schema: [TaskSchema] });

// Create
realm.write(() => {
  realm.create("Task", {
    _id: new Realm.BSON.ObjectId(),
    name: "Learn Realm",
    isComplete: false
  });
});</code></pre>
        `,
        defaultCode: '// Realm is a client-side database\n// This simulates how you would define a Realm schema\nconst TaskSchema = {\n  name: "Task",\n  primaryKey: "_id",\n  properties: {\n    _id: "objectId",\n    name: "string",\n    isComplete: { type: "bool", default: false },\n    priority: { type: "int", default: 1 }\n  }\n};\nprint("Task schema defined")',
        takeaways: [
          'Realm is an embedded, offline-first database for mobile and desktop applications',
          'Data models are defined as object schemas (classes) in your programming language',
          'Realm objects are "live" — they automatically update when underlying data changes',
          'Local operations are extremely fast (memory-mapped, zero-copy architecture)',
        ],
      },
      {
        id: 'm11-l2',
        title: 'Device Sync & Offline-First Architecture',
        objectives: [
          'Understand Device Sync and how it keeps devices consistent',
          'Implement offline-first patterns with Realm Sync',
          'Handle conflict resolution strategies',
          'Use Flexible Sync for selective data synchronization',
        ],
        content: `
          <h2 class="text-2xl font-bold mb-4 text-gray-900">Device Sync</h2>
          <p class="mb-4 text-gray-700 leading-relaxed"><strong>Device Sync</strong> (formerly Realm Sync) synchronizes data between local Realm databases and MongoDB Atlas. It enables <strong>offline-first</strong> apps where users can work without internet and sync when connected.</p>

          <h3 class="text-xl font-semibold mt-6 mb-3 text-gray-800">Offline-First Flow</h3>
          <pre class="bg-gray-900 text-green-400 p-4 rounded-lg overflow-x-auto mb-4"><code>// 1. User opens app — data loads from local Realm (instant!)
// 2. User makes changes — written to local Realm (offline-capable)
// 3. Internet available — syncs changes to Atlas automatically
// 4. Other devices receive changes via their own sync connections

// Flexible Sync: subscribe to only relevant data
const config = {
  sync: {
    user: app.currentUser,
    flexible: true,
    initialSubscriptions: {
      update(subs) {
        // Only sync tasks assigned to this user
        subs.add(realm.objects("Task")
          .filtered("assignee == $0", currentUserId));
      }
    }
  }
};</code></pre>

          <h3 class="text-xl font-semibold mt-6 mb-3 text-gray-800">Conflict Resolution</h3>
          <ul class="list-disc pl-6 mb-4 text-gray-700 space-y-2">
            <li><strong>Last-Writer-Wins (LWW)</strong> — The most recent change wins (default for most field types)</li>
            <li><strong>CRDT-based</strong> — Some data types use Conflict-Free Replicated Data Types for automatic merging</li>
            <li><strong>Custom resolution</strong> — You can implement custom conflict handlers for business-specific logic</li>
          </ul>
        `,
        defaultCode: '// Simulating Device Sync configuration\n// Flexible Sync subscribes to specific data\nprint("Flexible Sync configured to sync user-specific tasks")',
        takeaways: [
          'Device Sync enables offline-first apps — users can read/write data without internet',
          'Flexible Sync allows subscribing to only the data a user needs (reduces bandwidth)',
          'Conflicts are resolved automatically using LWW or CRDT-based strategies',
          'Sync is bidirectional: changes flow from device → Atlas → all connected devices',
        ],
      },
      {
        id: 'm11-l3',
        title: 'Realm Data Models & Relationships',
        objectives: [
          'Define Realm object schemas with relationships (to-one, to-many)',
          'Implement inverse relationships for automatic backlinks',
          'Use embedded objects for tightly coupled data',
          'Apply Realm best practices for data modeling on mobile',
        ],
        content: `
          <h2 class="text-2xl font-bold mb-4 text-gray-900">Realm Data Models</h2>
          <p class="mb-4 text-gray-700 leading-relaxed">Realm data models define the structure of your objects. Relationships between objects are defined using <strong>links</strong> — similar to referencing in MongoDB.</p>

          <h3 class="text-xl font-semibold mt-6 mb-3 text-gray-800">Relationships</h3>
          <pre class="bg-gray-900 text-green-400 p-4 rounded-lg overflow-x-auto mb-4"><code>// To-one relationship: Task has one User (assignee)
const TaskSchema = {
  name: "Task",
  properties: {
    _id: "objectId",
    name: "string",
    assignee: "User?"  // Link to a User object
  }
};

// To-many relationship: User has many Tasks
const UserSchema = {
  name: "User",
  properties: {
    _id: "objectId",
    name: "string",
    tasks: { type: "list", objectType: "Task" }
  }
};

// Inverse relationship: Automatically maintained backlink
const TaskSchema_v2 = {
  name: "Task",
  properties: {
    _id: "objectId",
    name: "string",
    assignee: {
      type: "linkingObjects",
      objectType: "User",
      property: "tasks"
    }
  }
};</code></pre>

          <div class="bg-green-50 border-l-4 border-green-600 p-4 my-6 rounded-r-lg">
            <p class="text-green-800"><strong>📱 Mobile Best Practice:</strong> Design your Realm schemas around the mobile UI. If a screen needs user + their tasks, model them as a relationship (not a join). Realm resolves links instantly because data is local.</p>
          </div>
        `,
        defaultCode: '// Simulating Realm relationship schema\nconst UserSchema = {\n  name: "User",\n  properties: {\n    _id: "objectId",\n    name: "string",\n    email: "string",\n    tasks: { type: "list", objectType: "Task" }\n  }\n};\nprint("User and Task schemas with relationship defined")',
        takeaways: [
          'Realm supports to-one, to-many, and inverse relationships between objects',
          'Inverse relationships (linkingObjects) are automatically maintained — no manual updates needed',
          'Embedded objects are owned by a single parent and deleted when the parent is deleted',
          'Design mobile schemas around UI screens for optimal local-first performance',
        ],
      },
    ],
    quiz: [
      { id: 'q11-1', question: 'What makes Realm different from MongoDB Server?', options: ['Realm is a cloud-only database', 'Realm is an embedded, mobile-first database that runs inside the app', 'Realm only works with SQL', 'Realm is a caching layer'], correct: 1 },
      { id: 'q11-2', question: 'What does "offline-first" mean in the context of Realm?', options: ['The app only works offline', 'The app works fully without internet and syncs when connected', 'Data is never synced to the cloud', 'Offline mode must be enabled manually'], correct: 1 },
      { id: 'q11-3', question: 'What does Flexible Sync allow you to do?', options: ['Change the sync frequency', 'Subscribe to only relevant subsets of data', 'Use any programming language', 'Sync without an internet connection'], correct: 1 },
      { id: 'q11-4', question: 'What is the default conflict resolution strategy in Realm Sync?', options: ['First-writer-wins', 'Last-writer-wins', 'Manual resolution', 'Random selection'], correct: 1 },
    ],
    exercises: [
      { title: 'Realm To-Do Model', description: 'Design a Realm schema for a to-do app with Users, Projects, and Tasks. Define relationships between them.', dataset: 'users' },
      { title: 'Sync Strategy', description: 'For a collaborative note-taking app, what Flexible Sync subscriptions would you set up to ensure users only sync their own notes?', dataset: 'users' },
    ],
  },
];

// ─── DOM Elements ───
const elements = {
  sidebarContent: document.getElementById('sidebar-content'),
  lessonContent: document.getElementById('lesson-content'),
  quizContent: document.getElementById('quiz-content'),
  mongoEditor: document.getElementById('mongo-editor'),
  resultsPane: document.getElementById('results-pane'),
  runQueryBtn: document.getElementById('run-query-btn'),
  tabBtns: document.querySelectorAll('.tab-btn'),
  tabPanes: document.querySelectorAll('.tab-pane'),
  progressBar: document.getElementById('progress-bar'),
  progressText: document.getElementById('progress-text'),
  mobileMenuBtn: document.getElementById('mobile-menu-btn'),
  sidebar: document.getElementById('sidebar'),
  sidebarOverlay: document.getElementById('sidebar-overlay'),
};

// ─── Initialization ───
function init() {
  renderSidebar();
  loadLesson(activeModule, activeLesson);
  updateProgress();
  setupEventListeners();
}

// ─── Event Listeners Setup ───
function setupEventListeners() {
  elements.tabBtns.forEach((btn) => {
    btn.addEventListener('click', (e) => {
      switchTab(e.target.closest('button').dataset.tab);
    });
  });

  elements.runQueryBtn.addEventListener('click', runQuery);

  // Mobile sidebar toggle
  elements.mobileMenuBtn.addEventListener('click', toggleSidebar);
  elements.sidebarOverlay.addEventListener('click', toggleSidebar);

  elements.sidebarContent.addEventListener('click', (e) => {
    const btn = e.target.closest('button[data-module]');
    if (btn) {
      loadLesson(parseInt(btn.dataset.module), parseInt(btn.dataset.lesson));
    }
  });

  document.addEventListener('click', (e) => {
    const quizBtn = e.target.closest('button[data-quiz-id]');
    if (quizBtn) {
      checkAnswer(quizBtn.dataset.quizId, parseInt(quizBtn.dataset.module), parseInt(quizBtn.dataset.option));
    }
    const exeBtn = e.target.closest('button[data-exercise]');
    if (exeBtn) {
      const mIndex = parseInt(exeBtn.dataset.module);
      const eIndex = parseInt(exeBtn.dataset.exercise);
      const exercises = curriculum[mIndex].exercises;
      if (exercises && exercises[eIndex] && exercises[eIndex].defaultCode) {
        elements.mongoEditor.value = exercises[eIndex].defaultCode;
        switchTab('simulator');
      }
    }
  });
}

function toggleSidebar() {
  const isClosed = elements.sidebar.classList.contains('-translate-x-full');
  if (isClosed) {
    elements.sidebar.classList.remove('-translate-x-full');
    elements.sidebarOverlay.classList.remove('hidden');
  } else {
    elements.sidebar.classList.add('-translate-x-full');
    elements.sidebarOverlay.classList.add('hidden');
  }
}

// ─── Tab Management ───
function switchTab(tabId) {
  elements.tabBtns.forEach((btn) => {
    if (btn.dataset.tab === tabId) {
      btn.classList.add('active', 'border-green-600', 'text-green-600');
      btn.classList.remove('text-gray-500', 'border-transparent');
    } else {
      btn.classList.remove('active', 'border-green-600', 'text-green-600');
      btn.classList.add('text-gray-500', 'border-transparent');
    }
  });

  elements.tabPanes.forEach((pane) => {
    if (pane.id === `${tabId}-tab`) {
      pane.classList.remove('hidden');
      pane.classList.add('block');
      if (tabId === 'simulator') {
        pane.classList.remove('block');
        pane.classList.add('flex', 'flex-col');
      }
    } else {
      pane.classList.add('hidden');
      pane.classList.remove('block', 'flex', 'flex-col');
    }
  });
}

// ─── Sidebar Rendering ───
function renderSidebar() {
  let html = '';
  curriculum.forEach((mod, mIndex) => {
    html += `
      <div class="sidebar-module">
        <h3 class="sidebar-module-title">${mod.title}</h3>
        <ul class="space-y-1">
    `;

    mod.lessons.forEach((lesson, lIndex) => {
      const isCompleted = userProgress.completedLessons.includes(lesson.id);
      const isActive = mIndex === activeModule && lIndex === activeLesson;
      html += `
          <li>
            <button class="w-full text-left sidebar-lesson ${isActive ? 'active' : ''}" 
                    data-module="${mIndex}" data-lesson="${lIndex}">
              <i class="${isCompleted ? 'fas fa-check-circle text-green-500' : 'far fa-circle text-gray-400'} mr-2 w-4"></i>
              ${lesson.title}
            </button>
          </li>
      `;
    });

    html += `</ul></div>`;
  });

  elements.sidebarContent.innerHTML = html;
}

// ─── Load Specific Lesson ───
function loadLesson(mIndex, lIndex) {
  activeModule = mIndex;
  activeLesson = lIndex;

  const mod = curriculum[mIndex];
  const lesson = mod.lessons[lIndex];

  // Build objectives HTML
  const objectivesHtml = lesson.objectives && lesson.objectives.length
    ? `
      <div class="bg-indigo-50 border-l-4 border-indigo-500 p-4 my-6 rounded-r-lg">
        <h4 class="font-semibold text-indigo-800 mb-2"><i class="fas fa-bullseye mr-2"></i>Learning Objectives</h4>
        <ul class="list-disc pl-5 space-y-1 text-indigo-700 text-sm">
          ${lesson.objectives.map(o => `<li>${o}</li>`).join('')}
        </ul>
      </div>`
    : '';

  // Build takeaways HTML
  const takeawaysHtml = lesson.takeaways && lesson.takeaways.length
    ? `
      <div class="mt-8 p-5 bg-gray-50 border border-gray-200 rounded-xl">
        <h4 class="font-semibold text-gray-800 mb-3"><i class="fas fa-check-double mr-2 text-green-600"></i>Key Takeaways</h4>
        <ul class="space-y-2">
          ${lesson.takeaways.map(t => `
            <li class="flex items-start gap-2 text-gray-700 text-sm">
              <i class="fas fa-circle-check text-green-500 mt-1 text-sm"></i>
              <span>${t}</span>
            </li>
          `).join('')}
        </ul>
      </div>`
    : '';

  // Build exercises HTML
  const exercisesHtml = mod.exercises && mod.exercises.length
    ? `
      <div class="mt-8 p-5 bg-amber-50 border border-amber-200 rounded-xl">
        <h4 class="font-semibold text-amber-800 mb-3"><i class="fas fa-dumbbell mr-2"></i>Practice Exercises</h4>
        <div class="space-y-3">
          ${mod.exercises.map((ex, i) => `
            <div class="bg-white border border-amber-100 rounded-lg p-4">
              <div class="flex items-start justify-between gap-3">
                <div>
                  <h5 class="font-medium text-gray-800 text-sm">${ex.title}</h5>
                  <p class="text-gray-600 text-sm mt-1">${ex.description}</p>
                  ${ex.dataset ? `<span class="inline-block mt-1 text-xs font-mono bg-gray-100 text-gray-500 px-2 py-0.5 rounded">Collection: ${ex.dataset}</span>` : ''}
                </div>
                ${ex.defaultCode ? `
                  <button data-exercise="${i}" data-module="${mIndex}" class="flex-shrink-0 bg-amber-500 hover:bg-amber-600 text-white text-xs px-3 py-1.5 rounded transition-colors">
                    <i class="fas fa-terminal mr-1"></i>Open in Simulator
                  </button>
                ` : ''}
              </div>
            </div>
          `).join('')}
        </div>
      </div>`
    : '';

  // Auto-mark lesson as complete
  if (!userProgress.completedLessons.includes(lesson.id)) {
    markLessonComplete(lesson.id);
  }

  // Build ELI5 content
  let eli5Html = '';
  const eli5Key = lesson.id;
  if (window.eli5MongoData && window.eli5MongoData[eli5Key]) {
    eli5Html = window.eli5MongoData[eli5Key];
  }

  // Render lesson content with objectives, takeaways, and exercises
  const fullContent = objectivesHtml + lesson.content + takeawaysHtml + exercisesHtml;
  elements.lessonContent.innerHTML = (window.eli5Toggle ? window.eli5Toggle.wrapContent(fullContent, eli5Html) : fullContent);
  if (window.eli5Toggle) {
    window.eli5Toggle.initToggle('mongodb', elements.lessonContent);
  }

  // Initialize copy-code
  if (window.copyCode && typeof window.copyCode.init === 'function') {
    window.copyCode.init(elements.lessonContent);
  }

  // Set simulator default code
  elements.mongoEditor.value = lesson.defaultCode || '';

  // Reset terminal
  elements.resultsPane.innerHTML = '';

  // Render quiz
  renderQuiz(mIndex);

  // Update sidebar
  renderSidebar();

  // Close sidebar on mobile
  if (window.innerWidth < 768 && !elements.sidebar.classList.contains('-translate-x-full')) {
    toggleSidebar();
  }
}

// ─── Quiz Rendering ───
function renderQuiz(mIndex) {
  const quiz = curriculum[mIndex].quiz;
  let html = `<h2 class="text-2xl font-bold mb-6 text-gray-800"><i class="fas fa-tasks mr-2 text-green-600"></i>Module Knowledge Check</h2>`;

  if (!quiz || quiz.length === 0) {
    elements.quizContent.innerHTML = html + '<p class="text-gray-500">No quiz for this module.</p>';
    return;
  }

  quiz.forEach((q, i) => {
    html += `
      <div class="mb-6 p-5 bg-green-50 rounded-lg border border-green-100 quiz-question" id="q-container-${q.id}">
        <p class="font-semibold text-gray-800 mb-3">${i + 1}. ${q.question}</p>
        <div class="space-y-2">
    `;

    q.options.forEach((opt, oIndex) => {
      html += `
          <label class="flex items-center p-3 bg-white border border-gray-200 rounded cursor-pointer hover:bg-gray-50 transition-colors">
            <input type="radio" name="quiz-${q.id}" value="${oIndex}" class="mr-3 w-4 h-4 text-green-600">
            <span class="text-gray-700">${opt}</span>
          </label>
      `;
    });

    html += `
        </div>
        <button data-quiz-id="${q.id}" data-module="${mIndex}" data-option="${i}" class="mt-3 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded text-sm font-medium transition-colors">
          Submit Answer
        </button>
        <div id="q-feedback-${q.id}" class="mt-2 hidden text-sm font-medium"></div>
      </div>
    `;
  });

  elements.quizContent.innerHTML = html;
}

// ─── Check Quiz Answer ───
window.checkAnswer = function (qId, mIndex, qIndex) {
  const selected = document.querySelector(`input[name="quiz-${qId}"]:checked`);
  const feedback = document.getElementById(`q-feedback-${qId}`);
  const container = document.getElementById(`q-container-${qId}`);

  if (!selected) {
    feedback.innerHTML = '<i class="fas fa-exclamation-circle mr-1"></i> Please select an answer.';
    feedback.className = 'mt-2 text-sm font-medium text-amber-600 block';
    return;
  }

  const correctAns = curriculum[mIndex].quiz[qIndex].correct;

  if (parseInt(selected.value) === correctAns) {
    feedback.innerHTML = '<i class="fas fa-check-circle mr-1"></i> Correct! Great job.';
    feedback.className = 'mt-2 text-sm font-medium text-green-600 block';
    container.classList.replace('bg-green-50', 'bg-emerald-50');
    container.classList.replace('border-green-100', 'border-emerald-200');

    if (!userProgress.completedQuizzes.includes(qId)) {
      userProgress.completedQuizzes.push(qId);
      saveProgress();
    }
  } else {
    feedback.innerHTML = '<i class="fas fa-times-circle mr-1"></i> Incorrect. Try again.';
    feedback.className = 'mt-2 text-sm font-medium text-red-600 block';
  }
};

// ─── Progress Tracking ───
function markLessonComplete(lessonId) {
  if (!userProgress.completedLessons.includes(lessonId)) {
    userProgress.completedLessons.push(lessonId);
    saveProgress();
  }
}

function saveProgress() {
  localStorage.setItem('mongoHubProgress', JSON.stringify(userProgress));
  updateProgress();
}

function updateProgress() {
  let totalItems = 0;
  curriculum.forEach((m) => {
    totalItems += m.lessons.length;
    if (m.quiz) totalItems += m.quiz.length;
  });

  const completedItems = userProgress.completedLessons.length + userProgress.completedQuizzes.length;
  const percentage = totalItems > 0 ? Math.round((completedItems / totalItems) * 100) : 0;

  elements.progressBar.style.width = `${percentage}%`;
  elements.progressText.textContent = `${percentage}%`;
}

// ─── MongoDB Simulator Engine ───
function runQuery() {
  const rawQuery = elements.mongoEditor.value.trim();

  if (!rawQuery) {
    appendTerminalOutput('> ', 'error-msg', 'SyntaxError: Unexpected end of input');
    return;
  }

  appendTerminalOutput('academy> ', 'query', rawQuery);

  // Handle `show collections` and `show dbs` and other meta-commands
  const trimmedLower = rawQuery.toLowerCase().trim();
  if (trimmedLower === 'show collections') {
    const collections = Object.keys(mockDB).sort();
    appendTerminalOutput('', 'result-json', JSON.stringify(collections, null, 2));
    return;
  }
  if (trimmedLower === 'show dbs') {
    appendTerminalOutput('', 'result-json', JSON.stringify({
      admin: '0.1GB',
      local: '0.1GB',
      academy: Object.keys(mockDB).reduce((acc, coll) => ({ ...acc, [coll]: `${mockDB[coll].length} docs` }), {})
    }, null, 2));
    return;
  }

  // Parse the query: expected format e.g., db.users.find({status: "A"})
  const mongoRegex = /^db\.(\w+)\.(\w+)\(([\s\S]*)\)$/;
  const match = rawQuery.match(mongoRegex);

  if (!match) {
    appendTerminalOutput('', 'error-msg', 'TypeError: Invalid command format. Try: db.collection.method(args)');
    return;
  }

  const collectionName = match[1];
  const method = match[2];
  const argsStr = match[3].trim();

  // Handle special commands like createIndex, explain
  if (method === 'createIndex' || method === 'createCollection' || method === 'drop') {
    appendTerminalOutput('', 'result-json', JSON.stringify({ ok: 1, note: `Simulated: ${method} executed successfully` }, null, 2));
    return;
  }
  if (method === 'explain') {
    appendTerminalOutput('', 'result-json', JSON.stringify({
      queryPlanner: { winningPlan: { stage: 'IXSCAN', inputStage: null, indexName: 'simulated_index' } },
      executionStats: { nReturned: 0, totalDocsExamined: 0, executionTimeMillis: 2 }
    }, null, 2));
    return;
  }
  if (method === 'watch') {
    appendTerminalOutput('', 'result-json', JSON.stringify({ ok: 1, note: 'Change stream opened. Events will appear here as they occur (simulated).' }, null, 2));
    return;
  }
  if (method === 'serverStatus') {
    appendTerminalOutput('', 'result-json', JSON.stringify({
      opcounters: { insert: 0, query: 0, update: 0, delete: 0, command: 1 },
      connections: { current: 1, available: 999 },
      version: '6.0.0'
    }, null, 2));
    return;
  }

  if (!mockDB[collectionName]) {
    if (method !== 'insertOne' && method !== 'insertMany') {
      appendTerminalOutput('', 'result-json', '[]');
      return;
    } else {
      mockDB[collectionName] = [];
    }
  }

  try {
    let args = {};
    if (argsStr) {
      const parseArgs = new Function('return ' + (argsStr || '{}'));
      args = parseArgs();
    }
    executeMongoCommand(collectionName, method, args);
  } catch (e) {
    appendTerminalOutput('', 'error-msg', 'SyntaxError: Invalid query arguments. ' + e.message);
  }
}

function executeMongoCommand(collectionName, method, args) {
  const collection = mockDB[collectionName];
  let result = null;
  let isError = false;

  switch (method) {
    case 'find': {
      let pipeline = null;
      // Handle aggregate-like syntax for find
      if (Array.isArray(args)) {
        pipeline = args;
      }

      if (pipeline) {
        // Simple aggregation simulation
        let currentData = [...collection];
        pipeline.forEach((stage) => {
          if (stage.$match) {
            currentData = currentData.filter((doc) => {
              for (let key in stage.$match) {
                const val = stage.$match[key];
                if (typeof val === 'object' && val !== null) {
                  // Handle operators
                  for (let op in val) {
                    if (op === '$gte') { if (doc[key] < val[op]) return false; }
                    else if (op === '$lte') { if (doc[key] > val[op]) return false; }
                    else if (op === '$gt') { if (doc[key] <= val[op]) return false; }
                    else if (op === '$lt') { if (doc[key] >= val[op]) return false; }
                    else if (op === '$in') { if (!val[op].includes(doc[key])) return false; }
                    else if (op === '$ne') { if (doc[key] === val[op]) return false; }
                  }
                } else {
                  if (doc[key] !== val) return false;
                }
              }
              return true;
            });
          } else if (stage.$group) {
            const groups = {};
            currentData.forEach((doc) => {
              const key = typeof stage.$group._id === 'string' && stage.$group._id.startsWith('$')
                ? doc[stage.$group._id.slice(1)] : 'all';
              if (!groups[key]) groups[key] = {};
              Object.entries(stage.$group).forEach(([k, expr]) => {
                if (k === '_id') return;
                if (!groups[key][k]) groups[key][k] = 0;
                if (expr.$sum === 1) groups[key][k]++;
                else if (expr.$sum && typeof expr.$sum === 'string' && expr.$sum.startsWith('$')) {
                  groups[key][k] += (doc[expr.$sum.slice(1)] || 0);
                }
                else if (expr.$avg) {
                  // Simplified avg
                  if (!groups[key]._avgCount) groups[key]._avgCount = 0;
                  groups[key]._avgCount++;
                  const field = expr.$avg.startsWith('$') ? expr.$avg.slice(1) : null;
                  groups[key][k] = ((groups[key][k] || 0) + (field ? (doc[field] || 0) : 0));
                }
                else if (expr.$min) {
                  const field = expr.$min.startsWith('$') ? expr.$min.slice(1) : null;
                  if (field && (groups[key][k] === undefined || doc[field] < groups[key][k])) groups[key][k] = doc[field];
                }
                else if (expr.$max) {
                  const field = expr.$max.startsWith('$') ? expr.$max.slice(1) : null;
                  if (field && (groups[key][k] === undefined || doc[field] > groups[key][k])) groups[key][k] = doc[field];
                }
              });
            });
            // Convert to array
            result = Object.entries(groups).map(([k, v]) => {
              const obj = { _id: k };
              Object.entries(v).forEach(([k2, v2]) => {
                if (k2 === '_avgCount') return;
                obj[k2] = k2 === 'avgTemp' || k2 === 'avgPrice' || k2 === 'avgRating'
                  ? Math.round((v[k2] / (v._avgCount || 1)) * 100) / 100
                  : v[k2];
              });
              return obj;
            });
          } else if (stage.$sort) {
            const sortKey = Object.keys(stage.$sort)[0];
            const sortDir = stage.$sort[sortKey];
            if (currentData.length > 0 && currentData[0][sortKey] !== undefined) {
              currentData.sort((a, b) => {
                return (a[sortKey] < b[sortKey] ? -1 : a[sortKey] > b[sortKey] ? 1 : 0) * sortDir;
              });
            }
            result = currentData;
          } else if (stage.$limit) {
            currentData = currentData.slice(0, stage.$limit);
            result = currentData;
          } else if (stage.$project) {
            result = currentData.map(doc => {
              const newDoc = {};
              Object.entries(stage.$project).forEach(([key, val]) => {
                if (val === 1) newDoc[key] = doc[key];
                else if (val === 0) { /* exclude */ }
                else if (typeof val === 'object' && val !== null) {
                  // Computed fields
                  if (val.$subtract && Array.isArray(val.$subtract)) {
                    const a = typeof val.$subtract[0] === 'string' && val.$subtract[0].startsWith('$')
                      ? doc[val.$subtract[0].slice(1)] : val.$subtract[0];
                    const b = typeof val.$subtract[1] === 'string' && val.$subtract[1].startsWith('$')
                      ? doc[val.$subtract[1].slice(1)] : val.$subtract[1];
                    newDoc[key] = a - b;
                  } else if (val.$multiply && Array.isArray(val.$multiply)) {
                    let result = 1;
                    val.$multiply.forEach(v => {
                      result *= (typeof v === 'string' && v.startsWith('$') ? (doc[v.slice(1)] || 0) : v);
                    });
                    newDoc[key] = result;
                  } else if (val.$add && Array.isArray(val.$add)) {
                    let total = 0;
                    val.$add.forEach(v => {
                      total += (typeof v === 'string' && v.startsWith('$') ? (doc[v.slice(1)] || 0) : v);
                    });
                    newDoc[key] = total;
                  } else if (val.$meta) {
                    newDoc[key] = 1.0; // simulated search score
                  }
                }
              });
              return newDoc;
            });
          } else if (stage.$addFields) {
            result = currentData.map(doc => {
              const newDoc = { ...doc };
              Object.entries(stage.$addFields).forEach(([key, val]) => {
                if (typeof val === 'object' && val !== null) {
                  if (val.$multiply && Array.isArray(val.$multiply)) {
                    let result = 1;
                    val.$multiply.forEach(v => {
                      result *= (typeof v === 'string' && v.startsWith('$') ? (doc[v.slice(1)] || 0) : v);
                    });
                    newDoc[key] = result;
                  } else if (val.$add && Array.isArray(val.$add)) {
                    let total = 0;
                    val.$add.forEach(v => {
                      total += (typeof v === 'string' && v.startsWith('$') ? (doc[v.slice(1)] || 0) : v);
                    });
                    newDoc[key] = total;
                  } else if (val.$subtract && Array.isArray(val.$subtract)) {
                    const a = typeof val.$subtract[0] === 'string' && val.$subtract[0].startsWith('$')
                      ? doc[val.$subtract[0].slice(1)] : val.$subtract[0];
                    const b = typeof val.$subtract[1] === 'string' && val.$subtract[1].startsWith('$')
                      ? doc[val.$subtract[1].slice(1)] : val.$subtract[1];
                    newDoc[key] = a - b;
                  }
                }
              });
              return newDoc;
            });
          } else if (stage.$bucket) {
            const boundaries = stage.$bucket.boundaries || [];
            const buckets = {};
            for (let i = 0; i < boundaries.length - 1; i++) {
              buckets[`${boundaries[i]}-${boundaries[i+1]}`] = { _id: `${boundaries[i]}-${boundaries[i+1]}`, count: 0 };
            }
            const defaultBucket = stage.$bucket.default;
            if (defaultBucket) buckets[defaultBucket] = { _id: defaultBucket, count: 0 };

            const groupBy = stage.$bucket.groupBy;
            currentData.forEach(doc => {
              const val = typeof groupBy === 'string' && groupBy.startsWith('$') ? doc[groupBy.slice(1)] : null;
              let placed = false;
              for (let i = 0; i < boundaries.length - 1; i++) {
                if (val >= boundaries[i] && val < boundaries[i+1]) {
                  buckets[`${boundaries[i]}-${boundaries[i+1]}`].count++;
                  placed = true;
                  break;
                }
              }
              if (!placed && defaultBucket) {
                buckets[defaultBucket].count++;
              }
            });
            result = Object.values(buckets);
          } else if (stage.$facet) {
            result = {};
            Object.entries(stage.$facet).forEach(([facetName, pipeline]) => {
              // Simplified facet: just count
              result[facetName] = [{ count: currentData.length }];
            });
          } else if (stage.$sample) {
            const size = stage.$sample.size || 1;
            const shuffled = [...currentData].sort(() => 0.5 - Math.random());
            result = shuffled.slice(0, size);
          }
        });

        // If no stage matched (empty result)
        if (Array.isArray(pipeline) && !result) {
          result = currentData;
        }
      } else {
        // Regular find with filter and projection
        const filter = args;
        const projection = typeof filter === 'object' && !Array.isArray(filter) ? null : null;

        if (Object.keys(filter).length === 0) {
          result = collection;
        } else {
          result = collection.filter((doc) => {
            for (const key in filter) {
              const val = filter[key];
              if (typeof val === 'object' && val !== null && !Array.isArray(val)) {
                // Handle operators
                for (const op in val) {
                  if (op === '$gte') { if (doc[key] < val[op]) return false; }
                  else if (op === '$lte') { if (doc[key] > val[op]) return false; }
                  else if (op === '$gt') { if (doc[key] <= val[op]) return false; }
                  else if (op === '$lt') { if (doc[key] >= val[op]) return false; }
                  else if (op === '$in') { if (!val[op].includes(doc[key])) return false; }
                  else if (op === '$ne') { if (doc[key] === val[op]) return false; }
                  else if (op === '$regex') {
                    const regex = new RegExp(val[op].source || val[op], val.$options || '');
                    if (!regex.test(String(doc[key]))) return false;
                  }
                }
              } else {
                if (doc[key] !== val) return false;
              }
            }
            return true;
          });
        }
      }
      break;
    }

    case 'findOne': {
      const filter = args;
      const all = [...collection];
      for (const doc of all) {
        let match = true;
        for (const key in filter) {
          if (doc[key] !== filter[key]) { match = false; break; }
        }
        if (match) { result = doc; break; }
      }
      if (!result) result = null;
      break;
    }

    case 'insertOne': {
      const newId = Math.floor(Math.random() * 10000000000).toString(16) + 'a1b2c3d4e5';
      const newDoc = { _id: newId, ...args };
      collection.push(newDoc);
      result = { acknowledged: true, insertedId: newId };
      break;
    }

    case 'insertMany': {
      if (!Array.isArray(args)) {
        result = { acknowledged: false, error: 'insertMany() expects an array of documents' };
        isError = true;
        break;
      }
      const insertedIds = [];
      args.forEach((doc) => {
        const newId = Math.floor(Math.random() * 10000000000).toString(16) + 'a1b2c3d4e5';
        collection.push({ _id: newId, ...doc });
        insertedIds.push(newId);
      });
      result = { acknowledged: true, insertedIds };
      break;
    }

    case 'updateOne':
    case 'updateMany': {
      const filter = args[0] || {};
      const update = args[1] || {};
      let count = 0;

      collection.forEach((doc) => {
        let match = true;
        for (const key in filter) {
          if (doc[key] !== filter[key]) { match = false; break; }
        }
        if (match && (method === 'updateOne' ? count === 0 : true)) {
          if (update.$set) Object.assign(doc, update.$set);
          if (update.$inc) {
            Object.entries(update.$inc).forEach(([k, v]) => {
              doc[k] = (doc[k] || 0) + v;
            });
          }
          if (update.$push) {
            Object.entries(update.$push).forEach(([k, v]) => {
              if (!doc[k]) doc[k] = [];
              doc[k].push(v);
            });
          }
          if (update.$pull) {
            Object.entries(update.$pull).forEach(([k, v]) => {
              if (Array.isArray(doc[k])) {
                doc[k] = doc[k].filter(item => item !== v);
              }
            });
          }
          if (update.$unset) {
            Object.keys(update.$unset).forEach(k => delete doc[k]);
          }
          count++;
        }
      });

      result = { acknowledged: true, matchedCount: method === 'updateOne' ? (count > 0 ? 1 : 0) : count, modifiedCount: count };
      break;
    }

    case 'deleteOne':
    case 'deleteMany': {
      const filter = args;
      let indicesToRemove = [];
      collection.forEach((doc, idx) => {
        let match = true;
        if (Object.keys(filter).length === 0) {
          match = true;
        } else {
          for (const key in filter) {
            if (doc[key] !== filter[key]) { match = false; break; }
          }
        }
        if (match && (method === 'deleteOne' ? indicesToRemove.length === 0 : true)) {
          indicesToRemove.push(idx);
        }
      });

      indicesToRemove.sort((a, b) => b - a);
      indicesToRemove.forEach(idx => collection.splice(idx, 1));

      result = { acknowledged: true, deletedCount: indicesToRemove.length };
      break;
    }

    case 'aggregate': {
      if (!Array.isArray(args)) {
        result = 'Error: aggregate() expects an array of pipeline stages';
        isError = true;
        break;
      }
      let currentData = [...collection];
      args.forEach((stage) => {
        if (stage.$match) {
          currentData = currentData.filter((doc) => {
            for (const key in stage.$match) {
              const val = stage.$match[key];
              if (typeof val === 'object' && val !== null) {
                for (const op in val) {
                  if (op === '$gte') { if (doc[key] < val[op]) return false; }
                  else if (op === '$lte') { if (doc[key] > val[op]) return false; }
                  else if (op === '$gt') { if (doc[key] <= val[op]) return false; }
                  else if (op === '$lt') { if (doc[key] >= val[op]) return false; }
                  else if (op === '$in') { if (!val[op].includes(doc[key])) return false; }
                }
              } else {
                if (doc[key] !== val) return false;
              }
            }
            return true;
          });
        } else if (stage.$group) {
          const groups = {};
          currentData.forEach((doc) => {
            const key = typeof stage.$group._id === 'string' && stage.$group._id.startsWith('$')
              ? doc[stage.$group._id.slice(1)] : 'all';
            if (!groups[key]) groups[key] = {};
            Object.entries(stage.$group).forEach(([k, expr]) => {
              if (k === '_id') return;
              if (!groups[key][k]) { groups[key][k] = 0; }
              if (expr.$sum === 1) { groups[key][k]++; }
              else if (expr.$sum && typeof expr.$sum === 'string' && expr.$sum.startsWith('$')) {
                groups[key][k] += (doc[expr.$sum.slice(1)] || 0);
              }
              else if (expr.$avg) {
                if (!groups[key]._avgCount) groups[key]._avgCount = 0;
                groups[key]._avgCount++;
                const field = typeof expr.$avg === 'string' && expr.$avg.startsWith('$') ? expr.$avg.slice(1) : null;
                if (field) groups[key][k] = (groups[key][k] || 0) + (doc[field] || 0);
              }
              else if (expr.$min) {
                const field = typeof expr.$min === 'string' && expr.$min.startsWith('$') ? expr.$min.slice(1) : null;
                if (field && (groups[key][k] === undefined || doc[field] < groups[key][k])) groups[key][k] = doc[field];
              }
              else if (expr.$max) {
                const field = typeof expr.$max === 'string' && expr.$max.startsWith('$') ? expr.$max.slice(1) : null;
                if (field && (groups[key][k] === undefined || doc[field] > groups[key][k])) groups[key][k] = doc[field];
              }
            });
          });
          currentData = Object.entries(groups).map(([k, v]) => {
            const obj = { _id: k };
            Object.entries(v).forEach(([k2, v2]) => {
              if (k2 === '_avgCount') return;
              obj[k2] = k2 === 'avgTemp' || k2 === 'avgPrice' || k2 === 'avgRating'
                ? Math.round((v[k2] / (v._avgCount || 1)) * 100) / 100
                : v[k2];
            });
            return obj;
          });
        } else if (stage.$sort) {
          const sortKey = Object.keys(stage.$sort)[0];
          const sortDir = stage.$sort[sortKey];
          if (currentData.length > 0 && currentData[0][sortKey] !== undefined) {
            currentData.sort((a, b) => {
              return (a[sortKey] < b[sortKey] ? -1 : a[sortKey] > b[sortKey] ? 1 : 0) * sortDir;
            });
          }
        } else if (stage.$limit) {
          currentData = currentData.slice(0, stage.$limit);
        } else if (stage.$project) {
          currentData = currentData.map(doc => {
            const newDoc = {};
            Object.entries(stage.$project).forEach(([key, val]) => {
              if (val === 1) newDoc[key] = doc[key];
              else if (typeof val === 'object' && val !== null && val.$subtract) {
                const a = typeof val.$subtract[0] === 'string' && val.$subtract[0].startsWith('$')
                  ? doc[val.$subtract[0].slice(1)] : val.$subtract[0];
                const b = typeof val.$subtract[1] === 'string' && val.$subtract[1].startsWith('$')
                  ? doc[val.$subtract[1].slice(1)] : val.$subtract[1];
                newDoc[key] = a - b;
              } else if (typeof val === 'object' && val !== null && val.$multiply) {
                let res = 1;
                val.$multiply.forEach(v => {
                  res *= (typeof v === 'string' && v.startsWith('$') ? (doc[v.slice(1)] || 0) : v);
                });
                newDoc[key] = res;
              } else if (typeof val === 'object' && val !== null && val.$add) {
                let total = 0;
                val.$add.forEach(v => {
                  total += (typeof v === 'string' && v.startsWith('$') ? (doc[v.slice(1)] || 0) : v);
                });
                newDoc[key] = total;
              }
            });
            if (Object.keys(newDoc).length === 0) return doc;
            return newDoc;
          });
        } else if (stage.$addFields) {
          currentData = currentData.map(doc => {
            const newDoc = { ...doc };
            Object.entries(stage.$addFields).forEach(([key, val]) => {
              if (typeof val === 'object' && val !== null && val.$multiply) {
                let res = 1;
                val.$multiply.forEach(v => {
                  res *= (typeof v === 'string' && v.startsWith('$') ? (doc[v.slice(1)] || 0) : v);
                });
                newDoc[key] = res;
              } else if (typeof val === 'object' && val !== null && val.$add) {
                let total = 0;
                val.$add.forEach(v => {
                  total += (typeof v === 'string' && v.startsWith('$') ? (doc[v.slice(1)] || 0) : v);
                });
                newDoc[key] = total;
              } else if (typeof val === 'object' && val !== null && val.$subtract) {
                const a = typeof val.$subtract[0] === 'string' && val.$subtract[0].startsWith('$')
                  ? doc[val.$subtract[0].slice(1)] : val.$subtract[0];
                const b = typeof val.$subtract[1] === 'string' && val.$subtract[1].startsWith('$')
                  ? doc[val.$subtract[1].slice(1)] : val.$subtract[1];
                newDoc[key] = a - b;
              }
            });
            return newDoc;
          });
        } else if (stage.$lookup) {
          const from = mockDB[stage.$lookup.from];
          if (from) {
            currentData = currentData.map(doc => {
              const localVal = doc[stage.$lookup.localField];
              const joined = from.filter(fDoc => fDoc[stage.$lookup.foreignField] === localVal);
              return { ...doc, [stage.$lookup.as]: joined };
            });
          }
        } else if (stage.$unwind) {
          const path = typeof stage.$unwind === 'string'
            ? stage.$unwind.replace(/^\$/, '')
            : (stage.$unwind.path ? stage.$unwind.path.replace(/^\$/, '') : null);
          if (path) {
            const newData = [];
            currentData.forEach(doc => {
              const arr = doc[path];
              if (Array.isArray(arr)) {
                arr.forEach(item => {
                  newData.push({ ...doc, [path]: item });
                });
              } else {
                newData.push(doc);
              }
            });
            currentData = newData;
          }
        } else if (stage.$bucket) {
          const boundaries = stage.$bucket.boundaries || [];
          const buckets = {};
          for (let i = 0; i < boundaries.length - 1; i++) {
            buckets[`${boundaries[i]}-${boundaries[i+1]}`] = { _id: `${boundaries[i]}-${boundaries[i+1]}`, count: 0 };
          }
          const defaultBucket = stage.$bucket.default;
          if (defaultBucket) buckets[defaultBucket] = { _id: defaultBucket, count: 0 };

          const groupBy = stage.$bucket.groupBy;
          const field = typeof groupBy === 'string' && groupBy.startsWith('$') ? groupBy.slice(1) : null;
          currentData.forEach(doc => {
            const val = field ? doc[field] : null;
            let placed = false;
            for (let i = 0; i < boundaries.length - 1; i++) {
              if (val >= boundaries[i] && val < boundaries[i+1]) {
                buckets[`${boundaries[i]}-${boundaries[i+1]}`].count++;
                placed = true;
                break;
              }
            }
            if (!placed && defaultBucket) buckets[defaultBucket].count++;
          });
          currentData = Object.values(buckets);
        } else if (stage.$facet) {
          const result = {};
          Object.entries(stage.$facet).forEach(([name, subPipeline]) => {
            result[name] = [{ count: currentData.length }];
          });
          currentData = result;
        } else if (stage.$sample) {
          const size = stage.$sample.size || 1;
          currentData = [...currentData].sort(() => 0.5 - Math.random()).slice(0, size);
        } else if (stage.$search) {
          // Simulated search — filter by text match
          if (stage.$search.text && stage.$search.text.query) {
            const query = stage.$search.text.query.toLowerCase();
            const path = stage.$search.text.path;
            currentData = currentData.filter(doc => {
              const val = String(doc[path] || '').toLowerCase();
              return val.includes(query);
            });
          } else if (stage.$search.autocomplete) {
            const query = stage.$search.autocomplete.query.toLowerCase();
            const path = stage.$search.autocomplete.path;
            currentData = currentData.filter(doc => {
              const val = String(doc[path] || '').toLowerCase();
              return val.startsWith(query);
            });
          }
        }
      });
      result = currentData;
      break;
    }

    default:
      result = `TypeError: db.${collectionName}.${method} is not a valid simulator function`;
      isError = true;
  }

  if (isError) {
    appendTerminalOutput('', 'error-msg', result);
  } else {
    appendTerminalOutput('', 'result-json', JSON.stringify(result, null, 2));
  }
}

/**
 * Process an aggregation pipeline on an array of documents.
 * Shared by both find() (when given array args) and aggregate().
 */
function processPipeline(stages, data) {
  let currentData = [...data];

  stages.forEach((stage) => {
    if (stage.$match) {
      currentData = currentData.filter((doc) => {
        for (const key in stage.$match) {
          const val = stage.$match[key];
          if (typeof val === 'object' && val !== null) {
            for (const op in val) {
              if (op === '$gte') { if (doc[key] < val[op]) return false; }
              else if (op === '$lte') { if (doc[key] > val[op]) return false; }
              else if (op === '$gt') { if (doc[key] <= val[op]) return false; }
              else if (op === '$lt') { if (doc[key] >= val[op]) return false; }
              else if (op === '$in') { if (!val[op].includes(doc[key])) return false; }
              else if (op === '$ne') { if (doc[key] === val[op]) return false; }
            }
          } else {
            if (doc[key] !== val) return false;
          }
        }
        return true;
      });
    } else if (stage.$group) {
      currentData = processGroupStage(stage.$group, currentData);
    } else if (stage.$sort) {
      const sortKey = Object.keys(stage.$sort)[0];
      const sortDir = stage.$sort[sortKey];
      if (currentData.length > 0 && currentData[0][sortKey] !== undefined) {
        currentData.sort((a, b) => (a[sortKey] < b[sortKey] ? -1 : a[sortKey] > b[sortKey] ? 1 : 0) * sortDir);
      }
    } else if (stage.$limit) {
      currentData = currentData.slice(0, stage.$limit);
    } else if (stage.$project) {
      currentData = processProjectStage(stage.$project, currentData);
    } else if (stage.$addFields) {
      currentData = processAddFieldsStage(stage.$addFields, currentData);
    } else if (stage.$lookup) {
      const from = mockDB[stage.$lookup.from];
      if (from) {
        currentData = currentData.map(doc => ({
          ...doc,
          [stage.$lookup.as]: from.filter(fDoc => fDoc[stage.$lookup.foreignField] === doc[stage.$lookup.localField])
        }));
      }
    } else if (stage.$unwind) {
      currentData = processUnwindStage(stage.$unwind, currentData);
    } else if (stage.$bucket) {
      currentData = processBucketStage(stage.$bucket, currentData);
    } else if (stage.$facet) {
      currentData = Object.fromEntries(
        Object.entries(stage.$facet).map(([name]) => [name, [{ count: currentData.length }]])
      );
    } else if (stage.$sample) {
      const size = stage.$sample.size || 1;
      currentData = [...currentData].sort(() => 0.5 - Math.random()).slice(0, size);
    } else if (stage.$search) {
      currentData = processSearchStage(stage.$search, currentData);
    }
  });

  return currentData;
}

function processGroupStage(groupExpr, data) {
  const groups = {};
  data.forEach((doc) => {
    const key = typeof groupExpr._id === 'string' && groupExpr._id.startsWith('$')
      ? doc[groupExpr._id.slice(1)] : 'all';
    if (!groups[key]) groups[key] = {};
    Object.entries(groupExpr).forEach(([k, expr]) => {
      if (k === '_id') return;
      if (!groups[key][k]) { groups[key][k] = 0; groups[key]._avgCount = groups[key]._avgCount || 0; }
      if (expr.$sum === 1) { groups[key][k]++; }
      else if (expr.$sum && typeof expr.$sum === 'string' && expr.$sum.startsWith('$')) {
        groups[key][k] += (doc[expr.$sum.slice(1)] || 0);
      } else if (expr.$avg) {
        groups[key]._avgCount++;
        const field = typeof expr.$avg === 'string' && expr.$avg.startsWith('$') ? expr.$avg.slice(1) : null;
        if (field) groups[key][k] = (groups[key][k] || 0) + (doc[field] || 0);
      } else if (expr.$min) {
        const field = typeof expr.$min === 'string' && expr.$min.startsWith('$') ? expr.$min.slice(1) : null;
        if (field && (groups[key][k] === undefined || doc[field] < groups[key][k])) groups[key][k] = doc[field];
      } else if (expr.$max) {
        const field = typeof expr.$max === 'string' && expr.$max.startsWith('$') ? expr.$max.slice(1) : null;
        if (field && (groups[key][k] === undefined || doc[field] > groups[key][k])) groups[key][k] = doc[field];
      }
    });
  });
  return Object.entries(groups).map(([k, v]) => {
    const obj = { _id: k === 'all' ? null : k };
    Object.entries(v).forEach(([k2, v2]) => {
      if (k2 === '_avgCount') return;
      obj[k2] = k2 === 'avgTemp' || k2 === 'avgPrice' || k2 === 'avgRating'
        ? Math.round((v[k2] / (v._avgCount || 1)) * 100) / 100
        : v[k2];
    });
    return obj;
  });
}

function processProjectStage(projectExpr, data) {
  return data.map(doc => {
    const newDoc = {};
    Object.entries(projectExpr).forEach(([key, val]) => {
      if (val === 1) newDoc[key] = doc[key];
      else if (typeof val === 'object' && val !== null) {
        if (val.$subtract) {
          const a = typeof val.$subtract[0] === 'string' && val.$subtract[0].startsWith('$')
            ? doc[val.$subtract[0].slice(1)] : val.$subtract[0];
          const b = typeof val.$subtract[1] === 'string' && val.$subtract[1].startsWith('$')
            ? doc[val.$subtract[1].slice(1)] : val.$subtract[1];
          newDoc[key] = a - b;
        } else if (val.$multiply) {
          let res = 1;
          val.$multiply.forEach(v => { res *= (typeof v === 'string' && v.startsWith('$') ? (doc[v.slice(1)] || 0) : v); });
          newDoc[key] = res;
        } else if (val.$add) {
          let total = 0;
          val.$add.forEach(v => { total += (typeof v === 'string' && v.startsWith('$') ? (doc[v.slice(1)] || 0) : v); });
          newDoc[key] = total;
        } else if (val.$meta) {
          newDoc[key] = 1.0; // simulated search score
        }
      }
    });
    return Object.keys(newDoc).length ? newDoc : doc;
  });
}

function processAddFieldsStage(addFieldsExpr, data) {
  return data.map(doc => {
    const newDoc = { ...doc };
    Object.entries(addFieldsExpr).forEach(([key, val]) => {
      if (typeof val === 'object' && val !== null) {
        if (val.$multiply) {
          let res = 1;
          val.$multiply.forEach(v => { res *= (typeof v === 'string' && v.startsWith('$') ? (doc[v.slice(1)] || 0) : v); });
          newDoc[key] = res;
        } else if (val.$add) {
          let total = 0;
          val.$add.forEach(v => { total += (typeof v === 'string' && v.startsWith('$') ? (doc[v.slice(1)] || 0) : v); });
          newDoc[key] = total;
        } else if (val.$subtract) {
          const a = typeof val.$subtract[0] === 'string' && val.$subtract[0].startsWith('$')
            ? doc[val.$subtract[0].slice(1)] : val.$subtract[0];
          const b = typeof val.$subtract[1] === 'string' && val.$subtract[1].startsWith('$')
            ? doc[val.$subtract[1].slice(1)] : val.$subtract[1];
          newDoc[key] = a - b;
        }
      }
    });
    return newDoc;
  });
}

function processUnwindStage(unwindExpr, data) {
  const path = typeof unwindExpr === 'string'
    ? unwindExpr.replace(/^\$/, '')
    : (unwindExpr.path ? unwindExpr.path.replace(/^\$/, '') : null);
  if (!path) return data;
  const result = [];
  data.forEach(doc => {
    const arr = doc[path];
    if (Array.isArray(arr) && arr.length > 0) {
      arr.forEach(item => result.push({ ...doc, [path]: item }));
    } else {
      result.push(doc);
    }
  });
  return result;
}

function processBucketStage(bucketExpr, data) {
  const boundaries = bucketExpr.boundaries || [];
  const buckets = {};
  for (let i = 0; i < boundaries.length - 1; i++) {
    buckets[`${boundaries[i]}-${boundaries[i+1]}`] = { _id: `${boundaries[i]}-${boundaries[i+1]}`, count: 0 };
  }
  if (bucketExpr.default) buckets[bucketExpr.default] = { _id: bucketExpr.default, count: 0 };
  const field = typeof bucketExpr.groupBy === 'string' && bucketExpr.groupBy.startsWith('$') ? bucketExpr.groupBy.slice(1) : null;
  data.forEach(doc => {
    const val = field ? doc[field] : null;
    let placed = false;
    for (let i = 0; i < boundaries.length - 1; i++) {
      if (val >= boundaries[i] && val < boundaries[i+1]) {
        buckets[`${boundaries[i]}-${boundaries[i+1]}`].count++;
        placed = true;
        break;
      }
    }
    if (!placed && bucketExpr.default) buckets[bucketExpr.default].count++;
  });
  return Object.values(buckets);
}

function processSearchStage(searchExpr, data) {
  if (searchExpr.text && searchExpr.text.query) {
    const query = searchExpr.text.query.toLowerCase();
    const path = searchExpr.text.path;
    return data.filter(doc => String(doc[path] || '').toLowerCase().includes(query));
  }
  if (searchExpr.autocomplete) {
    const query = searchExpr.autocomplete.query.toLowerCase();
    const path = searchExpr.autocomplete.path;
    return data.filter(doc => String(doc[path] || '').toLowerCase().startsWith(query));
  }
  return data;
}

function appendTerminalOutput(promptText, className, message) {
  const div = document.createElement('div');
  div.className = 'mb-4';

  if (promptText) {
    const promptSpan = document.createElement('span');
    promptSpan.className = 'prompt';
    promptSpan.innerText = promptText;
    div.appendChild(promptSpan);
  }

  const msgSpan = document.createElement('span');
  msgSpan.className = className;
  msgSpan.innerText = message;

  div.appendChild(msgSpan);
  elements.resultsPane.appendChild(div);

  const terminal = document.getElementById('terminal-content');
  terminal.scrollTop = terminal.scrollHeight;
}

// Run app
document.addEventListener('DOMContentLoaded', init);
