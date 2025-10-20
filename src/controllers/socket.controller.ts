import { Server, Socket } from "socket.io";
import http from "http";

interface Connections{
    [key: string]: string[];
}

interface TimeOnline {
    [key: string]: Date;
}

let connections: Connections = {};
let timeOnline: TimeOnline = {};

export const connectToSocket = (server: http.Server): Server => {
    console.log("SOMETHING CONNECTED");
    const io = new Server(server,{
        cors: {
            origin: "*",
            methods: ['GET','POST'],
            allowedHeaders: ['*'],
            credentials: true,
        },
    });

    io.on("connection", (socket: Socket) => {
        console.log("A user has connected!");

        socket.on("join-call", (path: string) => {
            if(connections[path] === undefined){
                connections[path] = [];
            }
            
            // 1:1 calls
            if(connections[path].length >= 2){
                socket.emit("room-full", "Cannot join: this meeting already has 2 participants");
                return;
            }

            connections[path].push(socket.id);
            timeOnline[socket.id] = new Date();

            // Notify all users in the room about the new user
            for (const id of connections[path]){
                io.to(id).emit("user-joined", socket.id, connections[path]);
            }
        });

        socket.on("signal", (toId: string, message: any) => {
            io.to(toId).emit("signal", socket.id, message);
        });

        socket.on("disconnect", () => {
            let key: string | undefined;
            for (const [k,v] of Object.entries(connections)){
                if(v.includes(socket.id)){
                    key = k;
                    // Notify other user
                    v.forEach((id) => {
                        if(id !== socket.id){
                            io.to(id).emit("user-left", socket.id);
                        }
                    });

                    // Remove the user
                    const idx = connections[key].indexOf(socket.id);
                    connections[key].splice(idx, 1);

                    // If room is empty, delete it
                    if(connections[key].length === 0){
                        delete connections[key];
                    }
                    break;
                }
            }
            delete timeOnline[socket.id];
        });
    });
    return io;
}