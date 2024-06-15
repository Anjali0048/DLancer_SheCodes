import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import authRoutes from "./routes/AuthRoutes.js";
import cookieParser from "cookie-parser";
import { gigRoutes } from "./routes/GigRoutes.js";
import { orderRoutes } from "./routes/OrderRoutes.js";
import { messageRoutes } from "./routes/MessageRoutes.js";
import { dashboardRoutes } from "./routes/DashboardRoutes.js";
import path from 'path'

// For Backend
import fs from 'fs';
import bodyParser from "body-parser";

dotenv.config();

const app = express();
const port = process.env.PORT;

app.use(
  cors({
    origin: [process.env.ORIGIN],
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE"],
    credentials: true,
  })
);

app.use(bodyParser.json());
app.use(cookieParser());
app.use(express.json());

const __dirname = path.resolve();

// Endpoint to append data to a file
app.post('/append', (req, res) => {
  console.log(req.body);

  if (!req.body || !req.body.id || !req.body.escrowContract) {
    return res.status(400).send('Both id and escrowContract are required');
  }

  const { id, escrowContract } = req.body;

  // Read existing data
  let data = [];
  const filePath = path.join(__dirname, 'EscrowContracts.json');
  if (fs.existsSync(filePath)) {
    const fileContent = fs.readFileSync(filePath);
    data = JSON.parse(fileContent);
  }

  // Append new data
  data.push({ id, escrowContract });

  // Write updated data to file
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2));

  res.send('Data appended successfully');
});

// Endpoint to retrieve data by id
// Endpoint to retrieve data by id
app.get('/contract/:id', (req, res) => {
  const id = req.params.id;

  // Read existing data
  const filePath = path.join(__dirname, 'EscrowContracts.json');
  if (fs.existsSync(filePath)) { 
    const fileContent = fs.readFileSync(filePath); 
    const data = JSON.parse(fileContent);

    // Find contract by id
    const contract = data.map(entry => entry.escrowContract);
    // const contract = data.find(entry => entry.id === id);
    console.log(contract);
    
    if (contract) {
      return res.json(contract);
    }
  }

  res.status(404).send('Contract not found');
});

app.use("/uploads", express.static("uploads"));
app.use("/uploads/profiles", express.static("uploads/profiles"));

app.use("/api/auth", authRoutes);
app.use("/api/gigs", gigRoutes);
app.use("/api/orders", orderRoutes);
app.use("/api/messages", messageRoutes);
app.use("/api/dashboard", dashboardRoutes);

app.listen(port, () => {
  console.log(`[server]: Server is running at http://localhost:${port}`);
});
