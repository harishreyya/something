const { Server } = require("socket.io");

const PORT = process.env.PORT || 3001;

const io = new Server(PORT, {
  cors: {
    origin: "*",
  },
});

console.log(` Socket server running on port ${PORT}`);

let users = {};
let onlineUsers = new Set();

io.on("connection", (socket) => {
  console.log(" User connected:", socket.id);

  socket.on("join", (userId) => {
   users[String(userId)] = socket.id;
onlineUsers.add(String(userId));
    console.log(" Joined:", userId);

    io.emit("online_users", Array.from(onlineUsers));

    socket.emit("online_users", Array.from(onlineUsers));
  });

  socket.on("send_message", ({ senderId, receiverId, text }) => {
    console.log(" Message:", text);

const receiverSocket = users[String(receiverId)];

    if (receiverSocket) {
      io.to(receiverSocket).emit("receive_message", {
        senderId,
        text,
        seen: false,
      });
    }
  });

  socket.on("mark_seen", ({ senderId }) => {
    const senderSocket = users[String(senderId)];

    if (senderSocket) {
      io.to(senderSocket).emit("message_seen");
    }
  });

 socket.on("disconnect", () => {
    for (let userId in users) {
      if (users[userId] === socket.id) {
        delete users[userId];
        onlineUsers.delete(userId);
      }
    }

    io.emit("online_users", Array.from(onlineUsers));
  });
});

