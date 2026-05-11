//customer-details-backend\server.js
import express from "express";
import cors from "cors";
import userRoutes from "./routes/users.js";
``
const app = express();

app.use(cors());
app.use(express.json());
app.use("/api/users", userRoutes);

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
