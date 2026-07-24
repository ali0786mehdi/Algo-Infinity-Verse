/**
 * ELI5 (Explain Like I'm 5) content for MongoDB Academy lessons.
 * Each key is a lesson `id`. Value is plain-language HTML with real-world analogies.
 */

const eli5MongoData = {
  // ─── Module 1: NoSQL & Document Modeling ───
  'm1-l1': `
    <p>Think of MongoDB like a <strong>giant backpack</strong> where you can stuff anything you want.</p>
    <p>In a regular <strong>SQL database</strong>, it's like having a <strong>filing cabinet</strong> with strict rules. Every paper (row) in each drawer (table) must have the exact same columns — "Name", "Age", "Email" — and every paper must have all of them filled in.</p>
    <p>But MongoDB is a <strong>backpack</strong>. You can put a textbook, a sandwich, a phone, and a pair of socks in there — all different shapes and sizes! That's <strong>flexible</strong>. One document might have 5 fields, another might have 10 — and that's perfectly fine.</p>
    <p><strong>Documents</strong> are like the individual items in your backpack. They're written in <strong>JSON</strong> (a format you might already know), so they look like <code>{ "name": "Alice", "age": 28 }</code>.</p>
    <p><strong>Collections</strong> are like the compartments in your backpack — "Snacks compartment", "Books compartment", "Electronics compartment". Related documents go in the same collection.</p>
    <p>The main point: MongoDB doesn't force you to decide EVERY field upfront. You can add fields later, change them, or have different documents with different fields. Like a real backpack — you pack what you need!</p>
  `,
  'm1-l2': `
    <p>A <strong>document</strong> in MongoDB is like a <strong>business card</strong> or a <strong>baseball card</strong>. Each card has info written on it — name, team, position, stats. But some cards have more info than others (a rookie card might just have a name and photo, while an MVP card has stats, awards, and a biography).</p>
    <p><strong>BSON</strong> (Binary JSON) is how MongoDB stores documents under the hood. Think of it like <strong>shipping a package</strong>. You write your message on paper (JSON), but to ship it, you put it in a box with bubble wrap (BSON) — it's more compact, safer, and computers can handle it faster!</p>
    <p><strong>Collections</strong> are like <strong>shoeboxes</strong> where you keep your cards. You might have one shoebox for "Baseball Players" and another for "Basketball Players". In MongoDB, you'd have a <code>players</code> collection and a <code>games</code> collection.</p>
    <p><strong>_id</strong> is like a <strong>unique barcode</strong> on every item. No two items in the same collection can have the same barcode. MongoDB automatically adds one if you don't — like the store putting a price tag on everything.</p>
  `,
  'm1-l3': `
    <p><strong>Schema design</strong> is deciding how to organize your data — like deciding whether to <strong>build a bookshelf</strong> or <strong>just pile books on the floor</strong>.</p>
    <p>The two big choices are <strong>embedding</strong> and <strong>referencing</strong>.</p>
    <p><strong>Embedding</strong> is like <strong>keeping all your vacation photos in one photo album</strong>. Your "Trip to Paris" album has photos, ticket stubs, and a map — all inside one book. You grab one thing and you have everything!</p>
    <p><strong>Referencing</strong> is like having a <strong>library catalog card</strong>. The card says "The Hobbit is located on Shelf 3, Row 2." You don't have the book itself, but you know exactly where to find it.</p>
    <p>General rule: If data is <strong>always accessed together</strong> (like a user and their profile picture), embed it. If data is <strong>accessed separately or grows a lot</strong> (like a user and their 10,000 tweets), reference it.</p>
    <p>Think of it like a restaurant menu: <strong>embedding</strong> = a combo meal (everything in one basket), <strong>referencing</strong> = à la carte (each item ordered separately).</p>
  `,

  // ─── Module 2: CRUD Operations ───
  'm2-l1': `
    <p><code>find()</code> is like asking a <strong>librarian for books</strong> based on certain criteria.</p>
    <p><strong>db.users.find()</strong> — "Show me ALL the books in the library." (No filter — everything!)</p>
    <p><strong>db.users.find({ status: "A" })</strong> — "Show me ONLY the books that have a green sticker on the spine."</p>
    <p>The <strong>filter document</strong> (<code>{ status: "A" }</code>) is like a <strong>shopping list</strong>: "I want items that match these exact things." MongoDB checks every document and returns the ones that match.</p>
    <p><strong>Projection</strong> (<code>find({}, { name: 1 })</code>) is like saying "Show me only the TITLES of the books, I don't need the author or year." You tell MongoDB which fields to include (1) or exclude (0).</p>
    <p><strong>Comparison operators</strong> are like special filters:</p>
    <ul>
      <li><code>$gt</code> (greater than) = "Find books with MORE than 300 pages"</li>
      <li><code>$lt</code> (less than) = "Find books with FEWER than 100 pages"</li>
      <li><code>$in</code> = "Find books in the 'Fantasy' OR 'Sci-Fi' section"</li>
    </ul>
    <p>Think of <code>find()</code> as a <strong>search engine for your data</strong>.</p>
  `,
  'm2-l2': `
    <p><code>insertOne()</code> and <code>insertMany()</code> are like <strong>adding items to your shopping cart</strong>.</p>
    <p><strong>insertOne()</strong> — You pick up one item and put it in the cart. "I'll take this one bag of chips."</p>
    <p><strong>insertMany()</strong> — You grab a whole pile of items and drop them in. "I'll take these 10 bags of chips, these 5 sodas, and this pack of gum."</p>
    <p>When you insert, MongoDB gives you back an <strong>_id</strong> for each document — like a receipt showing what you bought. If you don't provide an _id, MongoDB creates one automatically (it's like the store putting their own barcode on items that don't have one).</p>
    <p><strong>insertMany()</strong> is <strong>much faster</strong> than calling insertOne() in a loop — like paying for all your groceries at once instead of buying each item from a separate cashier!</p>
    <div class="bg-yellow-50 border-l-4 border-yellow-500 p-3 my-4 rounded-r-lg text-sm">
      <p class="text-yellow-800"><strong>⚠️ Remember:</strong> If you insertMany() with ordered:false and one insert fails, MongoDB continues with the rest. With ordered:true (default), it stops at the first error.</p>
    </div>
  `,
  'm2-l3': `
    <p><strong>Updating</strong> documents is like <strong>editing a document in Google Docs</strong> — you can change a word, add a sentence, or delete a whole paragraph.</p>
    <p><strong>updateOne()</strong> — Like fixing a typo in a specific sentence. You find the document that needs changing and say "Change this field to this new value."</p>
    <p><strong>updateMany()</strong> — Like doing "Find and Replace" across your entire document. "Everywhere it says 'MongoDB', change it to 'Mongo'."</p>
    <p><strong>replaceOne()</strong> — Like ripping out an entire page and writing a completely new one. Everything old is gone.</p>
    <p><strong>Update operators</strong> are your editing tools:</p>
    <ul>
      <li><code>$set</code> — "Change this field to X" (like correcting a typo)</li>
      <li><code>$inc</code> — "Add 5 to this number" (like a score counter)</li>
      <li><code>$push</code> — "Add this item to the array" (like adding an item to a list)</li>
      <li><code>$unset</code> — "Remove this field entirely" (like deleting a column in a spreadsheet)</li>
    </ul>
    <p><strong>Deleting</strong> is exactly what it sounds like — <strong>deleteOne()</strong> removes one document, <strong>deleteMany()</strong> removes all matching documents. Like throwing away one note vs emptying the whole folder in the trash.</p>
  `,

  // ─── Module 3: The Aggregation Pipeline ───
  'm3-l1': `
    <p>The <strong>aggregation pipeline</strong> is like a <strong>factory assembly line</strong>.</p>
    <p>Each document starts at one end of the factory. It passes through <strong>stations</strong> (stages), and each station does something to it:</p>
    <ul>
      <li><strong>$match</strong> — The quality control station. "Is this document the right type? If not, throw it off the line."</li>
      <li><strong>$group</strong> — The sorting station. "Put all red items in one bin, all blue items in another."</li>
      <li><strong>$sort</strong> — The organizing station. "Arrange these boxes from smallest to largest."</li>
      <li><strong>$project</strong> — The packaging station. "Only show the label and price; hide the barcode and serial number."</li>
    </ul>
    <p>The pipeline is an <strong>array of stages</strong>: <code>[{ $match: ... }, { $group: ... }, { $sort: ... }]</code>. Each stage's output feeds into the next stage's input.</p>
    <p>Think of it like: <strong>pick tomatoes → wash them → chop them → cook them → can them</strong>. Each step transforms the tomatoes and passes them to the next step!</p>
  `,
  'm3-l2': `
    <p><strong>$group</strong> is like <strong>sorting LEGO bricks by color</strong>. You dump all the bricks on the floor (your collection) and then say "Put all red bricks in a red pile, all blue bricks in a blue pile, etc."</p>
    <p><code>{ $group: { _id: "$category", total: { $sum: 1 }, avgPrice: { $avg: "$price" } } }</code></p>
    <p>Let's break this down:</p>
    <ul>
      <li><strong>_id: "$category"</strong> — "Group by the 'category' field" (like sorting by color)</li>
      <li><strong>{ $sum: 1 }</strong> — "Count how many are in each group" (like counting how many red bricks you have)</li>
      <li><strong>{ $avg: "$price" }</strong> — "Calculate the average price per group" (like the average size of red bricks)</li>
    </ul>
    <p><strong>$project</strong> is like <strong>using a highlighter</strong> on a textbook chapter. You can choose which fields to show, rename fields, or create computed fields. <code>{ $project: { name: 1, price: 1, discountedPrice: { $subtract: ["$price", 10] } } }</code> — "Show me only the name and price, and also show a discounted price that's $10 less."</p>
    <p><strong>$sort</strong> is like <strong>organizing books on a shelf</strong> by height. <code>{ $sort: { price: -1 } }</code> — "From most expensive to cheapest." (1 = ascending, -1 = descending)</p>
  `,

  // ─── Module 4: Data Modeling & Schema Design ───
  'm4-l1': `
    <p><strong>Embedding vs Referencing</strong> is like deciding whether to <strong>pack a lunchbox</strong> or use a <strong>cafeteria tray</strong>.</p>
    <p><strong>Embedding</strong> = a <strong>lunchbox</strong>. You put the sandwich, apple, and juice ALL inside one box. When you open it, you have everything at once. Perfect for data that's always together — like a user's profile and their settings.</p>
    <p><strong>Referencing</strong> = a <strong>cafeteria tray with a receipt</strong>. Your tray has just one item: a receipt that says "Your meal will be ready at Station 3." You take the receipt, walk to Station 3, and pick up your food there. Perfect for data that's separate — like a user and their 10,000 orders.</p>
    <table>
      <tr><td><strong>Embed when:</strong></td><td><strong>Reference when:</strong></td></tr>
      <tr><td>Data is always read together</td><td>Data grows unbounded</td></tr>
      <tr><td>One-to-one or small one-to-many</td><td>Large one-to-many or many-to-many</td></tr>
      <tr><td>Data rarely changes</td><td>Data is updated independently</td></tr>
    </table>
    <p>The golden rule: <strong>Design your schema for how you QUERY data, not how you STORE it.</strong> Ask yourself: "When I open this app, what data do I need to show on the same screen?" — that data should probably be embedded together!</p>
  `,
  'm4-l2': `
    <p>MongoDB has <strong>battle-tested schema patterns</strong> — like <strong>proven recipes</strong> that chefs know work well.</p>
    <ul>
      <li><strong>Subset Pattern</strong> — Like having a <strong>thumbnail</strong> of a photo instead of the full 4K image. When you show a list of products, you don't need the 5000-word description — just the name and price. Keep the heavy stuff in a separate collection.</li>
      <li><strong>Computed Pattern</strong> — Like <strong>pre-calculating the bill</strong> instead of adding each item's price when the customer asks. Store computed values (totals, counts, averages) in the document so you don't have to recalculate every time.</li>
      <li><strong>Bucket Pattern</strong> — Like <strong>organizing receipts by month</strong> instead of keeping each receipt individually. Group related data (like sensor readings) into time-based buckets to reduce the number of documents.</li>
      <li><strong>Polymorphic Pattern</strong> — Like having a <strong>wallet with slots for different cards</strong>. One slot holds a credit card, another a driver's license, another a gym membership. They're all cards, but have different fields. Perfect when documents have the same purpose but different structures.</li>
    </ul>
  `,
  'm4-l3': `
    <p><strong>Indexes</strong> are like the <strong>index at the back of a textbook</strong>. Without an index, you'd have to read every single page to find "Photosynthesis" (bad!). With an index, you flip directly to page 142 (good!).</p>
    <p>When you create a <strong>query plan</strong>, MongoDB is like a GPS choosing the best route. It looks at your indexes (like highways) and decides: "Should I use Index A (the highway) or scan all documents (take local streets)?"</p>
    <p><strong>Compound indexes</strong> are like having an index that goes by <strong>Last Name then First Name</strong> in a phone book. If you know both, you zoom right to the name. But if you only know the first name, a compound index that starts with last name won't help much — it's like trying to look up someone in a phone book when you only know their first name!</p>
    <p><strong>ESR Rule:</strong> When building compound indexes, put fields in this order:</p>
    <ul>
      <li><strong>E</strong>quality fields first (exact matches)</li>
      <li><strong>S</strong>ort fields second (order by)</li>
      <li><strong>R</strong>ange fields last (greater than, less than)</li>
    </ul>
    <p>Like packing a suitcase: heavy items first (equality), then medium (sort), then light items on top (range).</p>
  `,

  // ─── Module 5: Aggregation Pipeline Deep Dive ───
  'm5-l1': `
    <p>Advanced pipeline stages are like <strong>specialized tools in a Swiss Army knife</strong>.</p>
    <ul>
      <li><strong>$bucket</strong> — Like sorting students by letter grade. A = 90-100, B = 80-89, C = 70-79. Each bucket gets counted.</li>
      <li><strong>$facet</strong> — Like having <strong>multiple assembly lines in parallel</strong>. One line counts total products, another finds the cheapest, another finds the most expensive — all at the same time on the same data!</li>
      <li><strong>$addFields</strong> — Like <strong>adding a sticky note</strong> to each document with computed information. "Add a field called 'totalPrice' that's price × quantity."</li>
      <li><strong>$sample</strong> — Like <strong>pulling random names from a hat</strong>. Great for getting a random subset of data.</li>
    </ul>
    <p><strong>Accumulators</strong> are like the <strong>counters in a video game</strong>:</p>
    <ul>
      <li><strong>$sum</strong> — "How many coins did I collect?"</li>
      <li><strong>$avg</strong> — "What's my average score per level?"</li>
      <li><strong>$first/$last</strong> — "Who was the first/last player to join?"</li>
      <li><strong>$max/$min</strong> — "What's the highest/lowest temperature today?"</li>
    </ul>
  `,
  'm5-l2': `
    <p><strong>$lookup</strong> is like <strong>doing a GROUP BY in SQL</strong> — it joins data from two collections. Think of it as a <strong>phone book lookup</strong>: "I have a user ID here, let me look up that user's full details in the Users table."</p>
    <p><code>{ $lookup: { from: "orders", localField: "_id", foreignField: "user_id", as: "user_orders" } }</code></p>
    <p>Translation: "For each user, go find all orders where the order's user_id matches the user's _id, and add those orders to a new field called 'user_orders'."</p>
    <p><strong>$unwind</strong> is like <strong>unraveling a rope into individual threads</strong>. If you have a document with an array of 5 items, $unwind creates 5 separate documents, each with one item from the array.</p>
    <p>This is useful after $lookup because $lookup returns an array. To do further filtering/grouping on each order individually, you first $unwind the array into separate documents.</p>
    <p>Together, $lookup + $unwind is like: "Find all orders for each user, then split each order into its own row for detailed analysis."</p>
  `,
  'm5-l3': `
    <p>Optimizing the aggregation pipeline is like <strong>tuning a race car</strong> — every small improvement makes a big difference!</p>
    <ul>
      <li><strong>Do $match early!</strong> Like putting the bouncer at the door instead of the back of the club. Filter out documents as early as possible so later stages have less work to do.</li>
      <li><strong>Use indexes.</strong> If your $match filters on indexed fields, MongoDB can quickly find matching documents instead of scanning everything — like using the table of contents instead of reading every page.</li>
      <li><strong>$project before $group</strong> if possible. Remove fields you don't need before grouping — lighter documents move faster through the pipeline.</li>
      <li><strong>Avoid $unwind if you can use $first/$last</strong> or $max/$min directly on arrays. $unwind multiplies the number of documents, which can slow things down.</li>
    </ul>
    <p>Think of it like making a sandwich: you wouldn't make 100 sandwiches and THEN ask "Does anyone want a sandwich?" — you'd ask first, then make only the ones people want!</p>
  `,

  // ─── Module 6: Transactions & Concurrency Control ───
  'm6-l1': `
    <p><strong>ACID transactions</strong> in MongoDB are like <strong>a bank transfer between two accounts</strong>.</p>
    <p>Imagine you're transferring $100 from your Savings to your Checking. This involves TWO steps:</p>
    <ol>
      <li>Subtract $100 from Savings</li>
      <li>Add $100 to Checking</li>
    </ol>
    <p>What if Step 1 succeeds but Step 2 fails? You just lost $100! That's where transactions come in — they make sure EVERY step succeeds or NONE of them do.</p>
    <p>ACID is an acronym:</p>
    <ul>
      <li><strong>A</strong>tomic — All or nothing. Like an atom that can't be split. Either everything happens, or nothing happens.</li>
      <li><strong>C</strong>onsistent — The data always follows the rules. No invalid states.</li>
      <li><strong>I</strong>solated — Other users don't see the partial result. If Mom is looking at your accounts while you're transferring, she sees either the full before or the full after — never the in-between.</li>
      <li><strong>D</strong>urable — Once done, it stays done. Even if the power goes out, the money is transferred.</li>
    </ul>
    <p>MongoDB's transactions work just like a SQL transaction — you start, do operations, then either commit (save) or abort (rollback).</p>
  `,
  'm6-l2': `
    <p><strong>Concurrency</strong> is like <strong>two people trying to edit the same Google Doc at the same time</strong>.</p>
    <p>If Alice and Bob both try to buy the last concert ticket at the exact same moment, who gets it? MongoDB needs a system to prevent double-selling.</p>
    <p><strong>Optimistic Concurrency Control</strong> is like the <strong>honor system</strong>. "I'll check if the ticket is still available when I'm about to buy." If two people check at the same time and both see 1 ticket, one will get an error when trying to buy. More efficient but can fail at the last second.</p>
    <p><strong>Pessimistic Concurrency</strong> is like a <strong>lock on a dressing room</strong>. Before you try on clothes, you grab the key. Nobody else can use that room until you're done and return the key. Safer but slower.</p>
    <p><strong>Read Concerns</strong> tell MongoDB how confident you need the data to be:</p>
    <ul>
      <li>"local" — "Just tell me what's on this server right now (might be stale)." Fast.</li>
      <li>"majority" — "Only tell me after MOST servers agree on this data." Slower but accurate.</li>
      <li>"linearizable" — "I need the ABSOLUTE latest data, no shortcuts." Slowest but safest.</li>
    </ul>
  `,
  'm6-l3': `
    <p>Multi-document transactions are like <strong>a shopping list for a group of friends</strong>. Everyone agrees what to buy, and you either buy everything or buy nothing.</p>
    <p>In MongoDB, you use <code>session.withTransaction()</code> like this:</p>
    <p><code>session.withTransaction(() => {<br>&nbsp;&nbsp;db.orders.insertOne(order, { session });<br>&nbsp;&nbsp;db.inventory.updateOne(stock, { $inc: { qty: -1 } }, { session });<br>});</code></p>
    <p>The <strong>session</strong> is the <strong>shopping cart</strong>. It ties all operations together. If you're ordering a pizza AND updating the inventory of ingredients, both happen in one session. If the inventory update fails, the pizza order never happened — no half-baked meals!</p>
    <p><strong>Retry logic</strong> is important: transactions sometimes fail due to conflicts (Alice and Bob buying the same item). You should try again — like waiting for someone to finish at the ATM before you use it.</p>
    <div class="bg-yellow-50 border-l-4 border-yellow-500 p-3 my-4 rounded-r-lg text-sm">
      <p class="text-yellow-800"><strong>⏱️ Keep transactions short!</strong> A transaction holds locks on documents. Long transactions are like holding a door open — nobody else can get through until you're done.</p>
    </div>
  `,

  // ─── Module 7: Performance Tuning & Query Optimization ───
  'm7-l1': `
    <p>An <strong>index</strong> in MongoDB is like a <strong>book index</strong> at the back of a textbook. Without it, you'd read every page to find "JavaScript" (full scan = slow). With it, you flip directly to page 245 (index lookup = fast).</p>
    <p><strong>Types of indexes:</strong></p>
    <ul>
      <li><strong>Single field index</strong> — Like a phone book sorted by last name. Great if you always search by last name.</li>
      <li><strong>Compound index</strong> — Like a phone book sorted by last name THEN first name. Great if you search by "Smith, John" — you find Smith quickly, then John within the Smiths.</li>
      <li><strong>Multikey index</strong> — Like an index for a cookbook where one recipe appears under multiple categories. For arrays — if a document has a "tags" array, each tag gets its own index entry.</li>
      <li><strong>Text index</strong> — Like Google for your database. Full-text search on string fields.</li>
      <li><strong>Geospatial index</strong> — For location data. "Find all coffee shops within 1 mile of my current location."</li>
    </ul>
    <p><strong>createIndex()</strong> is like telling the librarian: "People often look up books by author, so please make an Author Index card." You create it once, and MongoDB maintains it automatically!</p>
    <p>But be careful: <strong>indexes take up space</strong> and <strong>slow down writes</strong> (because MongoDB must update the index when you insert/update). It's like having too many tabs open — helpful for finding things but slows down the browser.</p>
  `,
  'm7-l2': `
    <p><strong>explain()</strong> is like <strong>asking a GPS to show you the route it took</strong>. After a query runs, you can call <code>.explain("executionStats")</code> to see EXACTLY how MongoDB executed it.</p>
    <p>The explain output tells you:</p>
    <ul>
      <li><strong>COLLSCAN</strong> — "I had to look at EVERY document." (🚩 Bad — a red flag!)</li>
      <li><strong>IXSCAN</strong> — "I used an index, so I only checked matching documents." (✅ Good!)</li>
      <li><strong>nReturned</strong> — "How many documents did I actually return?"</li>
      <li><strong>totalDocsExamined</strong> — "How many documents did I look at to find the results?"</li>
      <li><strong>executionTimeMillis</strong> — "How long did it take in milliseconds?"</li>
    </ul>
    <p>If <strong>totalDocsExamined >> nReturned</strong>, you're doing too much work! Like checking every seat in a stadium when you only need the front row. This usually means you need a better index.</p>
    <p><strong>Query Profiling</strong> is like having a <strong>dashcam for your database</strong>. You can turn on profiling to log all slow queries. <code>db.setProfilingLevel(1, { slowms: 100 })</code> logs all queries taking more than 100ms.</p>
  `,
  'm7-l3': `
    <p>Monitoring MongoDB performance is like <strong>looking at your car's dashboard</strong> while driving.</p>
    <p><strong>Key metrics to watch:</strong></p>
    <ul>
      <li><strong>Opcounters</strong> — Your speedometer. How many operations (inserts, queries, updates) per second?</li>
      <li><strong>Connections</strong> — Your passenger count. How many clients are connected?</li>
      <li><strong>Memory Usage</strong> — Your fuel gauge. MongoDB tries to keep "working set" in RAM.</li>
      <li><strong>Page Faults</strong> — Your engine sputtering. When MongoDB needs data NOT in RAM, it has to read from disk (much slower!).</li>
    </ul>
    <p><strong>mongostat</strong> is like your car's basic dashboard — shows operations per second, connections, and memory at a glance.</p>
    <p><strong>mongotop</strong> is like a stopwatch for each collection — tells you which collections are being read/written the most.</p>
    <p><strong>Common performance killers:</strong></p>
    <ul>
      <li>Queries without indexes (COLLSCAN) — like searching for a book by going shelf by shelf</li>
      <li>Returning too much data — like asking for the entire encyclopedia when you just want one fact</li>
      <li>No $match early in aggregation — like making a sandwich BEFORE asking what people want</li>
      <li>Too many indexes on write-heavy collections — like updating 10 different phone books every time someone changes their address</li>
    </ul>
  `,

  // ─── Module 8: Replication & Sharding Architecture ───
  'm8-l1': `
    <p>A <strong>replica set</strong> is like having <strong>backup singers</strong> for a lead singer.</p>
    <p>The <strong>primary</strong> is the lead singer — she sings the main vocals (handles all writes). The <strong>secondaries</strong> are the backup singers — they sing the same song but slightly behind (they replicate data from the primary).</p>
    <p>If the lead singer gets sick (the primary goes down), one of the backup singers steps up to become the new lead (automatic failover). The show goes on! The audience hardly notices.</p>
    <p>Replica sets give you two things:</p>
    <ul>
      <li><strong>High availability</strong> — Your database stays up even if a server crashes</li>
      <li><strong>Read scaling</strong> — You can read from secondaries to spread out the load (like listening to any backup singer instead of just the lead)</li>
    </ul>
    <p>MongoDB recommends at least 3 members: primary, secondary, and an <strong>arbiter</strong> (a tiebreaker that doesn't store data — like a referee who just votes on who should be the new lead).</p>
  `,
  'm8-l2': `
    <p><strong>Sharding</strong> is like <strong>splitting a giant pizza among friends</strong>.</p>
    <p>One pizza is too big for one person to eat (One server can't handle all the data). So you split it into slices and give each friend a slice. Each friend (shard) holds a portion of the data.</p>
    <p><strong>Shard key</strong> is how you decide who gets which slice. If you use <code>{ country: 1 }</code> as the shard key, all data for "USA" goes to Shard A, all data for "India" goes to Shard B, etc.</p>
    <p>The <strong>mongos</strong> router is like the <strong>pizza chef</strong> who knows which friend has which slice. When you ask for "All users in India," mongos knows to ask Shard B — it doesn't bother Shard A, C, or D.</p>
    <p>Sharding solves two problems:</p>
    <ul>
      <li><strong>Storage</strong> — Data too big for one server (petabytes of data!)</li>
      <li><strong>Throughput</strong> — Too many queries for one server to handle</li>
    </ul>
    <p>Think of it like a library with so many books that they need multiple buildings. Each building (shard) holds some books. The librarian (mongos) knows which book is in which building.</p>
  `,
  'm8-l3': `
    <p>Choosing a <strong>shard key</strong> is the most important decision you'll make about sharding. A bad shard key is like <strong>splitting a pizza into one huge slice and 7 tiny slices</strong> — one friend gets almost everything, and the others barely have anything!</p>
    <p><strong>Characteristics of a good shard key:</strong></p>
    <ul>
      <li><strong>High cardinality</strong> — Many different values. Like "email address" (everyone's unique) vs "gender" (only 2-3 values).</li>
      <li><strong>Low frequency</strong> — No single value appears too often. Like "city" is bad if 80% of your users are in "New York" — that one shard would be overloaded.</li>
      <li><strong>Even distribution</strong> — Data spreads roughly equally across all shards. Like splitting a pizza into equal slices.</li>
    </ul>
    <p><strong>Poor shard key examples:</strong></p>
    <ul>
      <li><code>{ status: 1 }</code> — Only 3 values (active, inactive, deleted). Low cardinality!</li>
      <li><code>{ createdDate: 1 }</code> — All new data goes to one shard. "Hot shard" problem!</li>
    </ul>
    <p><strong>Good shard key example:</strong> <code>{ customerId: 1, createdDate: 1 }</code> — High cardinality from customerId, and the date helps with range queries. Like distributing files by first letter AND date.</p>
  `,

  // ─── Module 9: Change Streams & Real-time Apps ───
  'm9-l1': `
    <p><strong>Change Streams</strong> are like <strong>watching a live sports game on TV</strong> — you see events as they happen.</p>
    <p>Instead of constantly asking "Did anything change? Did anything change? Did anything change?" (polling), MongoDB Tells you "Hey, something just changed!" (push).</p>
    <p>It's the difference between:</p>
    <ul>
      <li><strong>Polling</strong> — Calling the stadium every 5 seconds: "Did anyone score yet?" (Wasteful!)</li>
      <li><strong>Change Streams</strong> — The stadium texts you: "GOAL! Minute 23: Alice scored!" (Instant!)</li>
    </ul>
    <p>Change streams give you a <strong>real-time feed</strong> of:</p>
    <ul>
      <li>New documents inserted</li>
      <li>Documents updated</li>
      <li>Documents replaced</li>
      <li>Documents deleted</li>
    </ul>
    <p>Each change event tells you <strong>what operation happened</strong>, <strong>which document changed</strong>, and optionally <strong>the before/after state</strong>.</p>
  `,
  'm9-l2': `
    <p>Building a <strong>real-time app</strong> with Change Streams is like setting up <strong>instant notifications</strong> on your phone.</p>
    <p>Think of a <strong>stock trading app</strong>: when the price of AAPL changes, you want to see the new price immediately without refreshing the page.</p>
    <ol>
      <li>Your Node.js app opens a Change Stream on the <code>stocks</code> collection</li>
      <li>When a stock price updates, MongoDB sends a change event</li>
      <li>Your app receives the event and pushes it to connected users via WebSocket</li>
      <li>Users see the new price instantly!</li>
    </ol>
    <p><strong>Use cases:</strong></p>
    <ul>
      <li>Chat applications — new messages appear instantly</li>
      <li>Collaborative editing — like Google Docs</li>
      <li>Dashboard updates — live charts and metrics</li>
      <li>Notification systems — alert when a new order is placed</li>
    </ul>
    <p>It's like having a <strong>friend in the kitchen</strong> who tells you "The pizza is ready!" the moment it comes out of the oven — no need to keep checking!</p>
  `,
  'm9-l3': `
    <p>You can <strong>filter change streams</strong> with an aggregation pipeline — like setting up a <strong>smart notification filter</strong> on your phone.</p>
    <p>Without filtering: "Tell me EVERYTHING that changes in the database." (Annoying — like getting notified about every single email!)</p>
    <p>With filtering: "Only tell me when a new ORDER is placed with total > $100." (Useful!)</p>
    <p><code>db.orders.watch([{ $match: { 'fullDocument.total': { $gt: 100 } } }])</code></p>
    <p>This is like telling the stadium: "Don't bother me with corner kicks or fouls — ONLY call me when someone scores a GOAL!"</p>
    <p><strong>Resume tokens</strong> are like <strong>bookmarks</strong>. If your app crashes and restarts, you can resume the change stream from where you left off — you don't miss any events that happened while you were down!</p>
    <div class="bg-yellow-50 border-l-4 border-yellow-500 p-3 my-4 rounded-r-lg text-sm">
      <p class="text-yellow-800"><strong>🔑 Important:</strong> Change streams require a replica set (not a standalone server). They work with the <code>oplog</code> — MongoDB's operation log — which only exists in replica sets.</p>
    </div>
  `,

  // ─── Module 10: Time Series & Atlas Search ───
  'm10-l1': `
    <p><strong>Time Series Collections</strong> are like a <strong>weather logbook</strong> — you record the temperature every hour, every day, for years.</p>
    <p>Normal collections would store each reading as a separate document. 1 year of hourly readings = 8,760 documents. 10 years = 87,600 documents. That's a LOT of documents!</p>
    <p>Time Series Collections optimize this by <strong>grouping measurements into buckets</strong>. Instead of 8,760 separate documents, MongoDB groups them into say 365 buckets (one per day). Each bucket holds 24 readings.</p>
    <p>This gives you:</p>
    <ul>
      <li><strong>Way fewer documents</strong> (365 instead of 8,760)</li>
      <li><strong>Automatic time-based indexing</strong> — querying by time range is super fast</li>
      <li><strong>Lower storage</strong> — MongoDB compresses time series data well</li>
    </ul>
    <p><strong>Perfect for:</strong> IoT sensor data, stock prices, server metrics, weather data — anything where you collect measurements over time.</p>
    <p>It's like the difference between keeping each individual receipt vs taping all receipts for the day onto one page in a logbook!</p>
  `,
  'm10-l2': `
    <p><strong>Atlas Search</strong> is like having <strong>Google search for your MongoDB database</strong>.</p>
    <p>Normal <code>find()</code> is like searching a dictionary by looking up a word in the index. But what if you want:</p>
    <ul>
      <li>"Find products that mention 'wireless' AND 'Bluetooth'"</li>
      <li>"Find reviews similar to 'great battery life'" (fuzzy search)</li>
      <li>"Find all articles about 'climate change' including synonyms like 'global warming'"</li>
      <li>"Auto-complete my search as I type"</li>
    </ul>
    <p>Regular <code>find()</code> can't do these well. Atlas Search uses <strong>Apache Lucene</strong> (the same engine behind Elasticsearch) to provide full-text search capabilities.</p>
    <p>Think of it like the difference between:</p>
    <ul>
      <li><strong>find()</strong> — Asking a librarian "Do you have a book called 'Moby Dick'?" (exact match)</li>
      <li><strong>Atlas Search</strong> — Asking "I'm looking for a book about a whale and a captain. The name might be something like Moby something...?" (fuzzy, ranked results!)</li>
    </ul>
  `,
  'm10-l3': `
    <p>Search Indexes are like <strong>Google's search index for your data</strong>. Before you can search, you need to build the index — like Google's crawlers visiting every website and taking notes.</p>
    <p><strong>Dynamic mapping</strong> — "Index everything automatically based on field types." Like saying "read my mind and figure out what I want to search." Easy to start, but less control.</p>
    <p><strong>Static mapping</strong> — "Only index these specific fields with these specific analyzers." Like telling Google "Only index my blog posts, not the comments, and treat 'JS' and 'JavaScript' as the same word."</p>
    <p><strong>Analyzers</strong> decide HOW to process text for searching:</p>
    <ul>
      <li><strong>Standard analyzer</strong> — Splits on spaces and punctuation, lowercases everything. "Hello World" → ["hello", "world"]</li>
      <li><strong>Keyword analyzer</strong> — Treats the whole field as one token. "John Smith" → ["John Smith"] (not split)</li>
      <li><strong>Custom analyzers</strong> — Add synonyms, stem words (running → run), remove common words (the, a, an).</li>
    </ul>
    <p>Think of analyzers like a <strong>coffee grinder</strong>: Standard = fine grind (many small pieces), Keyword = coarse grind (fewer, bigger pieces). Different recipes need different grinds!</p>
  `,

  // ─── Module 11: Realm Sync & Mobile ───
  'm11-l1': `
    <p><strong>Realm</strong> is like a <strong>local toy box that syncs with your friend's toy box</strong>.</p>
    <p>Imagine you and your friend each have a toy box in your own rooms. You want to share toys, but you don't want to carry them back and forth. Realm automatically syncs the toy boxes — when you put a new toy in YOUR box, it magically appears in your friend's box too!</p>
    <p>Realm is a <strong>mobile-first database</strong> that runs directly on your phone or tablet. It's:</p>
    <ul>
      <li><strong>Embedded</strong> — The database lives INSIDE your app, not on a remote server</li>
      <li><strong>Fast</strong> — Reading from local storage is instant, no network needed</li>
      <li><strong>Object-oriented</strong> — Your data maps directly to objects in your code (like classes)</li>
    </ul>
    <p>Unlike MongoDB (which is a server database), Realm is designed for client-side apps. When you need to share data across devices, you use <strong>Realm Sync</strong> which connects local Realm databases with a backend MongoDB Atlas cluster.</p>
  `,
  'm11-l2': `
    <p><strong>Device Sync</strong> is like having a <strong>shared to-do list with your family</strong> that updates automatically.</p>
    <p>Dad adds "Buy milk" on his phone → the list updates on Mom's phone → Kid sees it on the iPad — all without anyone pressing "refresh" or "sync".</p>
    <p><strong>Offline-first</strong> means the app works even WITHOUT internet. You can:</p>
    <ul>
      <li>Browse data (read from local Realm)</li>
      <li>Add new data (write to local Realm)</li>
      <li>Edit existing data</li>
    </ul>
    <p>When internet comes back, Realm Sync automatically pushes your offline changes to the server and pulls down any changes others made. It's like writing a letter (offline) and mailing it when you get to the post office (online).</p>
    <p><strong>Conflict resolution</strong> is the magic sauce. What if Dad changes the shopping list title to "Groceries" while Mom changes it to "Food" — both offline? Realm has a smart system to merge these changes using <strong>last-writer-wins</strong> or <strong>manual conflict resolution</strong>.</p>
    <p>It's like having a magical notebook — everyone writes in it, and the entries show up in everyone else's notebook automatically, even if some people are in a cave with no signal!</p>
  `,
  'm11-l3': `
    <p><strong>Realm Data Models</strong> are like <strong>blueprints for your toy box</strong> — they define what kinds of toys you can store and how they relate to each other.</p>
    <p>In Realm, you define data models using <strong>classes</strong> in your programming language (Swift, Kotlin, JavaScript, etc.).</p>
    <p>For example, a <strong>Task</strong> model:</p>
    <p><code>class Task {<br>&nbsp;&nbsp;_id: ObjectId;<br>&nbsp;&nbsp;name: string;<br>&nbsp;&nbsp;isComplete: boolean;<br>&nbsp;&nbsp;assignee: string; // references User<br>}</code></p>
    <p><strong>Relationships</strong> in Realm are like <strong>tags on items</strong> that say "This toy belongs to Alice's collection." You can have:</p>
    <ul>
      <li><strong>To-one</strong> — "This Task has one Assignee" (like "this book belongs to one person")</li>
      <li><strong>To-many</strong> — "This User has many Tasks" (like "this person owns many books")</li>
      <li><strong>Inverse</strong> — "Automatically keep track of which User a Task is assigned to" (like a library keeping a reverse catalog)</li>
    </ul>
    <p><strong>Flexible Sync</strong> allows you to subscribe to specific data. Instead of syncing EVERYTHING, you say "Only sync my tasks" or "Only sync tasks where assignee is me." This saves bandwidth and respects privacy.</p>
    <p>Think of it like Netflix: instead of downloading every movie on the platform (full sync), you only download the ones in your watchlist (flexible sync)!</p>
  `,
};

/* Expose globally for script-tag usage */
window.eli5MongoData = eli5MongoData;
