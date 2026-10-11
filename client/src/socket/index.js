import { io } from 'socket.io-client'

let socket = null

export const getSocket = () => {
  if (!socket)
    socket = io(import.meta.env.VITE_SOCKET_URL || '', {
      withCredentials: true,
      autoConnect: false,
      reconnectionAttempts: 5,
    })
  return socket
}
export const connectSocket = () => {
  const s = getSocket()
  if (!s.connected) s.connect()
  return s
}
export const disconnectSocket = () => {
  socket?.connected && socket.disconnect()
}
export const joinRoom = (id) => getSocket().emit('issue:join', id)
export const leaveRoom = (id) => getSocket().emit('issue:leave', id)
