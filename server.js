require("dotenv").config();
const express = require("express");
const path = require("path");
const cors = require("cors");
const { generateMsg } = require("./llm");

const app = express();

app.use(express.json());
app.use(cors()); 
// Serve frontend
app.use(express.static(path.join(__dirname, "frontend")));


app.post("/chat", async (req, res) => {
    const {text,threadId}=req.body
    if(!text || !threadId){
         res.status(400).json({ message: "All fields are required" });
         return;
    }
  const result = await generateMsg(text,threadId);
  res.json({ message: result });
});

// When someone visits "/"
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "frontend", "index.html"));
});

app.listen(process.env.PORT, () => {
  console.log("your server is running at port http://localhost:3000");
});
