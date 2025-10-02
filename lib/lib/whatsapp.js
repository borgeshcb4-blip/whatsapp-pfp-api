import makeWASocket, { DisconnectReason, useMultiFileAuthState } from '@whiskeysockets/baileys';
import pino from 'pino';
import qrcode from 'qrcode-terminal';
import { createStorageAdapter } from './storage-adapter.js';

let sock;
let qrCode = null;
const logger = pino({ level: 'silent' });

export const getWASocket = async () => {
  if (sock) return sock;
  const storage = createStorageAdapter();
  const { state, saveCreds } = await useMultiFileAuthState(storage);
  
  sock = makeWASocket({ auth: state, printQRInTerminal: true, logger });
  
  sock.ev.on('connection.update', (update) => {
    const { connection, lastDisconnect, qr } = update;
    if (qr) {
      qrCode = qr;
      console.log('QR Code recebido, escaneie com seu celular!');
      qrcode.generate(qr, { small: true });
    }
    if (connection === 'close') {
      const shouldReconnect = (lastDisconnect.error)?.output?.statusCode !== DisconnectReason.loggedOut;
      if (shouldReconnect) getWASocket();
    } else if (connection === 'open') {
      qrCode = null;
      console.log('Conexão com o WhatsApp estabelecida!');
    }
  });

  sock.ev.on('creds.update', saveCreds);
  return sock;
};

export const getQRCode = () => qrCode;
