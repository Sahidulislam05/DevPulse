import express, {
  type Application,
  type Request,
  type Response,
} from "express";
import cors from "cors";
import authRoutes from "./modules/auth/auth.routes";
import issueRoutes from "./modules/issues/issues.routes";

const app: Application = express();

app.use(cors());
app.use(express.json());

app.get("/", (req: Request, res: Response) => {
  res.status(200).json({
    message: "DevPulse Server is running",
    author: "Sahidul Islam",
  });
});

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/issues", issueRoutes);

export default app;
