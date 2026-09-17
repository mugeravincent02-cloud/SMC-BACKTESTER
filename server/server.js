// const express = require("express"); //Import Express
// const app = express(); //Create an Express app instance
// const PORT = 5000; //Define the port number

// //Define a simple route handler for GET requests to the root URL
// app.get("/", (req, res) => {
//   res.send("Server running on Port 5000!");
// });

// //Start the server and listen on the specified port
// app.listen(PORT, () => {
//   console.log(`Server is running on http://localhost:${PORT}`);
// });

const path = require("node:path");
require("dotenv").config({ path: path.join(__dirname, ".env") });
const app = require("./app");
const PORT = Number(process.env.PORT || 5000);

if (!Number.isInteger(PORT) || PORT < 1 || PORT > 65535) {
  throw new Error("PORT must be an integer between 1 and 65535.");
}

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
