// 简单测试ZK连接
const net = require('net');

const socket = new net.Socket();
socket.setTimeout(5000);

console.log('Testing connection to 172.16.120.82:2181...');

socket.connect(2181, '172.16.120.82', () => {
  console.log('TCP connection established!');
  socket.destroy();
});

socket.on('timeout', () => {
  console.log('Connection timeout');
  socket.destroy();
});

socket.on('error', (err) => {
  console.log('Connection error:', err.message);
});
