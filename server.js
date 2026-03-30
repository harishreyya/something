const { Server } = require("socket.io");

const PORT = process.env.PORT || 3001;

const io = new Server(3001, {
  cors: {
    origin: "*",
  },
});

console.log(`🚀 Socket server running on port ${PORT}`);

let users = {};

io.on("connection", (socket) => {
  console.log("✅ User connected:", socket.id);

  socket.on("join", (userId) => {
    users[userId] = socket.id;
    console.log("👤 Joined:", userId);
  });

  socket.on("send_message", ({ senderId, receiverId, text }) => {
    console.log("📨 Message:", text);

    const receiverSocket = users[receiverId];

    if (receiverSocket) {
      io.to(receiverSocket).emit("receive_message", {
        senderId,
        text,
      });
    }
  });

  socket.on("disconnect", () => {
    console.log("❌ User disconnected:", socket.id);
  });
});