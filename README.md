
# 🧠 Real-Time Collaborative Whiteboard Backend

**Node.js + Express + Socket.IO + MongoDB + JWT**

This backend enables:

* Tutor creates a room
* Tutor generates shareable links (JWT-based)
* Students join the same room using the link
* Tutor’s whiteboard updates sync to all students
* Board state persists across refresh / rejoin (in-memory)

---

## 📦 Tech Stack

* Node.js
* Express
* Socket.IO
* MongoDB (Mongoose)
* JWT (Authentication via URL token)
* In-memory cache (`Map`) for board state
* Morgan (logging)
* dotenv

---

## 📁 Project Structure

```txt
.
├── server.js
├── .env
├── config/
│   └── db.js
├── routes/
│   └── room.routes.js
├── controllers/
│   └── room.controller.js
├── models/
│   └── Room.js
├── utils/
│   └── generateToken.js
└── README.md
```

---

## 🔐 Environment Variables

Create a `.env` file in the root:

```env
PORT=5000
MONGO_URI=your_mongodb_srv_url
JWT_SECRET=your_super_secret_key
```

---

## 🚀 Setup Instructions

### 1️⃣ Install dependencies

```bash
npm install
```

### 2️⃣ Start the server

```bash
node server.js
```

Expected output:

```txt
MongoDB connected
Server running on port 5000
```

---

## 🧩 Core Concepts (Important)

* **Tutor** creates the room
* **Tutor & Students** join using JWT token in URL
* **Socket.IO** handles real-time sync
* **boardState (Map)** stores latest whiteboard state per room
* **Students cannot write**, only receive updates

---

# 🔌 REST API DOCUMENTATION

---

## 1️⃣ Generate Tutor Link (Creates Room)

### Endpoint

```
POST /api/room/generate-tutor-link
```

### Headers

```
Content-Type: application/json
```

### Body

```json
{
  "tutorName": "John Tutor",
  "tutorId": "tutor_123",
  "permissions": {
    "canDraw": true,
    "canChat": true
  }
}
```

### Response

```json
{
  "url": "http://localhost:5000/room/<JWT_TOKEN>",
  "roomId": "uuid-room-id"
}
```

✅ This:

* Creates a room
* Stores tutor info in MongoDB
* Generates tutor JWT link

---

## 2️⃣ Generate Student Link (Same Room)

### Endpoint

```
POST /api/room/generate-student-link
```

### Body

```json
{
  "tutorId": "tutor_123"
}
```

### Response

```json
{
  "url": "http://localhost:5000/room/<JWT_TOKEN>"
}
```

✅ This:

* Finds tutor’s room
* Generates student JWT link
* No DB write needed

---

## 🔑 JWT Payload Structure

### Tutor Token

```json
{
  "roomId": "uuid",
  "role": "tutor",
  "tutorId": "tutor_123",
  "name": "John Tutor",
  "permissions": {
    "canDraw": true,
    "canChat": true
  }
}
```

### Student Token

```json
{
  "roomId": "uuid",
  "role": "student",
  "tutorId": "tutor_123",
  "permissions": {
    "canDraw": true,
    "canChat": true
  }
}
```

---

# 🔌 SOCKET.IO TESTING (NO FRONTEND)

We use **`wscat`** to simulate Socket.IO clients.

---

## 🛠 Install wscat

```bash
npm install -g wscat
```

---

## 3️⃣ Tutor Joins Room (Socket)

```bash
wscat -c "ws://localhost:5000/socket.io/?token=TUTOR_TOKEN&EIO=4&transport=websocket"
```

After connect:

```
40
```

When server sends:

```
< 2
```

Reply:

```
3
```

---

## 4️⃣ Student Joins Room (Socket)

Open **another terminal**:

```bash
wscat -c "ws://localhost:5000/socket.io/?token=STUDENT_TOKEN&EIO=4&transport=websocket"
```

Then:

```
40
```

And respond to ping:

```
3
```

---

# 🧪 WHITEBOARD SYNC TESTING (Simulating Excalidraw)

> ⚠️ Socket.IO frames **MUST be sent in ONE LINE**

---

## 5️⃣ Tutor Sends Whiteboard Update

Paste this **exactly as one line** in tutor terminal:

```txt
42["whiteboard-update",{"elements":[{"id":"rect1","type":"rectangle","x":100,"y":100,"width":200,"height":100,"angle":0,"strokeColor":"#000000","backgroundColor":"#ffec99"}],"appState":{"viewBackgroundColor":"#ffffff","zoom":1}}]
```

If you see:

```
< 2
```

Reply:

```
3
```

---

## 6️⃣ Student Receives Update

Student terminal should show:

```txt
< 42["whiteboard-sync",{"elements":[{"id":"rect1","type":"rectangle","x":100,"y":100,"width":200,"height":100,"angle":0,"strokeColor":"#000000","backgroundColor":"#ffec99"}],"appState":{"viewBackgroundColor":"#ffffff","zoom":1}}]
```

✅ Confirms real-time broadcast works.

---

# 🔄 REFRESH / LATE JOIN BEHAVIOR

✔ Tutor refresh → board restored
✔ Student refresh → board restored
✔ Student joins late → gets latest board

This works because:

* Latest board is stored in `Map`
* Sent immediately on socket join

---

# 🧠 Important Notes (Read This)

### Why tutor disconnects sometimes in wscat?

* wscat does **not auto-reply to ping**
* Missing `3` → disconnect
* Frontend will NOT have this issue

---

### Why Redis is NOT used yet?

* Single server
* In-memory Map is sufficient
* Redis recommended when:

  * Multiple backend instances
  * Horizontal scaling
  * Crash recovery

---

# 🏗️ Current Architecture

```txt
Tutor Draw
   ↓
Socket Event
   ↓
Store in Map (roomId → boardState)
   ↓
Broadcast to Students
   ↓
Restore on Refresh / Rejoin
```

---

# 🚀 Future Improvements (Optional)

* Redis as board cache
* MongoDB board snapshots
* Undo / redo
* Tutor-only locking
* Room expiration
* Multiple rooms per tutor

---

## ✅ Status

✔ Backend complete
✔ APIs tested
✔ Socket flow verified
✔ Excalidraw-compatible
✔ Frontend-ready

---