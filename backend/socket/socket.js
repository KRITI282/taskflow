let ioInstance;
export const setIO = (io) => { ioInstance = io; };
export const notifyUser = (userId, notification) => {
  if (ioInstance && userId) ioInstance.to(`user:${userId}`).emit("notification", notification);
};
