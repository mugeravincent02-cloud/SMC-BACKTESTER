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

require("dotenv").config();
const app = require("./app");
const PORT = process.env.PORT;

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
