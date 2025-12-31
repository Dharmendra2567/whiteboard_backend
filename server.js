require("dotenv").config();
const express = require("express");
const { createServer } = require("http");
const { Server } = require("socket.io");
const connectDB = require("./config/db");
const roomRoutes = require("./routes/room.routes");
const morgan = require("morgan");
const cors = require("cors");
const app = express();
const port = process.env.PORT || 5000;
const httpServer = createServer(app);
const registerPenTabletHandlers = require("./penTablet.socket");

//middleware
app.use(morgan("dev"));


// app.use(cors({
//   origin: "*",
//   methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
//   allowedHeaders: ["Content-Type", "Authorization"],
// }));

app.use(cors({
  origin: [
    "http://localhost:5173",
    "https://whiteboard-frontend-plum.vercel.app/"
  ],
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
}));

connectDB();

//body parser
app.use(express.json());

//Use Routes
app.use("/api/room", roomRoutes);

const io = new Server(httpServer, {
  cors: { origin: "*" },
});

const boardState = new Map();
const roomPresence = new Map();
const roomAccess = {};

io.on("connection", (socket) => {
  try {

    // student request-access to tutor
    socket.on("request-access", ({ roomId, studentId }) => {
      socket.to(roomId).emit("request-access", { studentId });
    });

    // tutor granted access to student
    socket.on("access-response", ({ studentId, status }) => {
      if (socket.role !== "tutor") return;
      roomAccess[roomId][studentId] = status === "approved";

      io.to(studentId).emit("access-response", { status });
    });

    const { roomId, role } = socket.handshake.query;

    // ---- Tutor single-session check ----
    if (role === "tutor") {
      const presence = roomPresence.get(roomId);
      // send tutor status when student join
      socket.emit("tutor-status", {
        online: !!presence?.tutorOnline,
      });

      if (presence?.tutorOnline) {
        // Tutor already connected
        socket.emit("join-error", {
          message: "Tutor already active in this room",
        });

        socket.to(roomId).emit("tutor-status", {
          online: true,
        });

        socket.disconnect(true);
        return;
      }

      // mark tutor as online
      roomPresence.set(roomId, {
        tutorOnline: true,
        tutorSocketId: socket.id,
      });
    }

    socket.join(roomId);
    socket.role = role;
    socket.roomId = roomId;
    if (!roomAccess[roomId]) {
      roomAccess[roomId] = {};
    }

    console.log(`[JOIN] ${role} joined room ${roomId}`);
    // ---- Presence ----
    if (socket.role === "tutor") {
      roomPresence.set(socket.roomId, {
        tutorOnline: true,
        lastSeen: Date.now(),
      });

      socket.to(socket.roomId).emit("tutor-status", {
        online: true,
      });
    }

    // LOG MAP STATE ON JOIN
    console.log(
      `[MAP CHECK ON JOIN] room=${socket.roomId}, hasState=${boardState.has(socket.roomId)}`
    );

    const state = boardState.get(socket.roomId);
    if (state) {
      socket.emit("whiteboard-sync", state);
    }

    //send stroke data on join
    // const stroke = boardState.get(socket.roomId);
    // if (stroke && stroke.length > 0) {
    //   socket.emit("whiteboard-init", stroke);
    // }


    socket.on("whiteboard-update", (payload) => {
      console.log(
        `[WHITEBOARD UPDATE RECEIVED] from ${socket.role} in room ${socket.roomId}`
      );

      // if (socket.role !== "tutor" || (socket.role === "student" && !roomAccess[socket.roomId]?.[socket.id])) return;

      const isTutor = socket.role === "tutor";
      const isAuthorizedStudent =
        socket.role === "student" &&
        roomAccess[socket.roomId]?.[socket.id];

      if (!isTutor && !isAuthorizedStudent) return;

      console.log("student data is about to set in boardState map");
      boardState.set(socket.roomId, payload);
      console.log("student data has been set in boardState map");

      console.log(
        `[MAP UPDATED] room=${socket.roomId}, size=${boardState.size}`
      );

      socket.to(socket.roomId).emit("whiteboard-sync", payload);
    });

    //getting pentab stroke data
    // socket.on("whiteboard-update", ({ roomId, stroke }) => {
    //   if (socket.role !== "tutor") return;
    //   if (!roomId || !stroke) return;

    //   if (!boardState.has(roomId)) {
    //     boardState.set(roomId, []);
    //   }

    //   boardState.get(roomId).push(stroke);

    //   console.log(
    //     `[MAP UPDATED] room=${socket.roomId}, size=${boardState.size}`
    //   );

    //   socket.to(roomId).emit("whiteboard-sync", stroke);
    // });


    //send tutor-status on disconnect
    socket.on("disconnect", () => {
      if (socket.role === "tutor") {
        roomPresence.set(socket.roomId, {
          tutorOnline: false,
          lastSeen: Date.now(),
        });

        if (roomAccess[socket.roomId]) {
          delete roomAccess[roomId][socket.id];
        }

        socket.to(socket.roomId).emit("tutor-status", {
          online: false,
        });
      }
    });

  } catch (err) {
    console.error("Socket error:", err.message);
    socket.disconnect();
  }
});



httpServer.listen(port, "0.0.0.0", () => {
  console.log(`Server running on port ${port}`);
});
