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

  socket.on("call_user", ({ callerId, receiverId, signalData }) => {
    const receiverSocket = users[String(receiverId)];

    if (receiverSocket) {
      if (signalData.type === "offer") {
        io.to(receiverSocket).emit("incoming_call", {
          callerId,
          signalData,
          callerName: callerId,
        });
      } else if (signalData.type === "candidate") {
        io.to(receiverSocket).emit("ice_candidate", {
          candidate: signalData.candidate,
          from: callerId,
        });
      }
    }
  });

  socket.on("answer_call", ({ callerId, receiverId, signalData }) => {
    const callerSocket = users[String(callerId)];

    if (callerSocket) {
      if (signalData.type === "answer") {
        io.to(callerSocket).emit("call_accepted", {
          signalData,
          receiverId,
        });
      } else if (signalData.type === "candidate") {
        io.to(callerSocket).emit("ice_candidate", {
          candidate: signalData.candidate,
          from: receiverId,
        });
      }
    }
  });

  socket.on("end_call", ({ receiverId }) => {
    const receiverSocket = users[String(receiverId)];
    if (receiverSocket) {
      io.to(receiverSocket).emit("call_ended");
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

