const { WebSocketServer } = require("ws");
const http = require("http");
const express = require("express");
const uuidv4 = require("uuid").v4;
const app = express();
const server = http.createServer(app);
const wss = new WebSocketServer({ server });
const url = require("url");

// const clients = {};

const connections = [];

let messagess = {};

const rooms = new Map();
const clients = new Map();

const broadcasts = (msg) => {
  const Bmsg = Buffer.from(msg);

  omsg = Bmsg.toString("utf-8");

  Rmsg = JSON.parse(omsg);

  //  console.log(Rmsg)
  let userId = "";

  if (Rmsg.length > 0) {
    userId = Rmsg[0].user._id;
    //    console.log(userId);
  }

  Object.keys(connections).forEach((userName) => {
    const connection = connections[userName];

    console.log(userName);

    if (userName !== userId) {
      connection.send(omsg);

      console.log("message sent");
    }
  });
};

const login = (msg, user, ws) => {
  // Validate user ID (optional for security)
  let userId = "";
  console.log("message is", msg);

  userId = msg.username;

  // Prepare login notification message

  const loginMessage = {
    type: "loggedIn", // Identify message type for differentiation
    userId,
  };

  console.log("userid is", userId);

  const jsonData = JSON.stringify(loginMessage);

  // const connection =connections[userId]

  // Object.keys(connections).forEach(id => {
  //   const connection = connections[23];

  //   const connn= ws[id]

  //   connections.send(jsonData);

  // });

  connections.map((users) => {
    if (users.id !== userId) {
      users.send(jsonData);

      console.log(`Login notification sent to user: ${userId}`);
    }
  });
};

// const senndOffer = (msg) => {
//   console.log("userto call",msg.name)

// userToCall =msg.name

// mainMessage ={
//         type: "offer",
//         offer: msg.offer,
//         caller: msg.caller
//       }

//  connections.map((users) => {
//     if (users.id == userToCall) {
//       users.send(JSON.stringify(mainMessage));

//       console.log(`offer sent to user: ${userToCall}`);
//     }
//   });
// };


let isFirstOfferSent = false;
const senndOffer = (msg) => {
  
  console.log("User to call:", msg.name);

  userToCall = msg.name;

  mainMessage = {
    type: "offer",
    offer: msg.offer,
    caller: msg.caller
  };

  connections.map((users) => {
    if (users.id == userToCall) {
      if (isFirstOfferSent) {
        // Send the second offer
        users.send(JSON.stringify(mainMessage));
        console.log(`Second offer sent to user: ${userToCall}`);
      } else {
        // Handle the first offer differently if needed
        console.log("First offer sent to user: ", userToCall);
        isFirstOfferSent = true;
      }
    }
  });
};

const Answer =(msg)=>{
  console.log("to call",msg.name)

  const ToAns = msg.name


  const message={ 
    type: "answer", 
    answer: msg.answer 
  }

  
  connections.map((users) => {
    if (users.id == ToAns) {
      users.send(JSON.stringify(message));

      console.log(`annser sent to user: ${ToAns}`);
    }
  });
}

const icecandidate = (msg)=>{

  const message={
    type: "candidate",
    candidate: msg.candidate,
    from: msg.name,
  }  
      
    
  connections.map((users) => {
    if (users.id == msg.name) {
      users.send(JSON.stringify(message));

      console.log(`candiate sent to user: ${msg.name}`);
    }
  });

  console.log("candiates=======>",msg.name)
}

wss.on("connection", (ws, request) => {
  const { userName } = url.parse(request.url, true).query;

  const uuid = uuidv4();

  console.log(userName);
  ws.id = userName;

  connections.push(ws);

  ws.on("message", (message) => {
    const data = JSON.parse(message);
    console.log("Received message:", data);

    // ws.send(JSON.stringify(data))

    switch (data.type) {
      case "login":
        let mesg = { type: "user_joined", username: data.name };

        login(mesg, ws.id, ws);

        break;

      case "offer":
        senndOffer(data);
        

        break;

      case "answer":
        Answer(data);
        
        break;

        
      case "candidate":

       icecandidate(data)
        // const candidateClient = clients[ws.remoteAddress];
        // broadcast({
        //   type: "candidate",
        //   candidate: data.candidate,
        //   from: candidateClient.username,
        // });
        break;
      case "leave":
        delete clients[ws.remoteAddress];
        broadcast({ type: "user_left", username: data.name });
        break;
      default:
        console.log("Unknown message type:", data.type);
        break;
    }
  });

  ws.on("close", () => {
    console.log("Client disconnected");
    const disconnectedClient = clients[ws.remoteAddress];
    if (disconnectedClient) {
      delete clients[ws.remoteAddress];
      broadcast({ type: "user_left", username: disconnectedClient.username });
    }
  });
});

const broadcast = (message) => {
  wss.clients.forEach((client) => {
    if (client.readyState === WebSocketServer.OPEN) {
      wss.send(JSON.stringify(message));
    }
  });
};

server.listen(3000, () => {
  console.log("Server listening on port 3000");
});
