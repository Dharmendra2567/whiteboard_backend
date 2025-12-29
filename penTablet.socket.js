// sockets/penTablet.socket.js

const penStateMap = new Map(); 
// roomId => [ { x, y, pressure, ts } ]

module.exports = function registerPenTabletHandlers(io, socket) {
  /**
   * Tutor sends pen stroke data
   */
  socket.on("pen-stroke", ({ roomId, stroke }) => {
    if (!roomId || !stroke) return;

    if (!penStateMap.has(roomId)) {
      penStateMap.set(roomId, []);
    }

    const state =penStateMap.get(roomId).push(stroke);

    // forward to all students in room (except sender)
    
    socket.to(roomId).emit("pen-stroke", stroke);
  });
  

  /**
   * Sync strokes when student joins
   */
  socket.on("pen-sync-request", ({ roomId }) => {
    if (!roomId) return;

    const strokes = penStateMap.get(roomId) || [];
    socket.emit("pen-sync", strokes);
  });

  /**
   * Optional cleanup
   */
  socket.on("disconnect", () => {
    // keep data (whiteboard behavior)
  });
};
