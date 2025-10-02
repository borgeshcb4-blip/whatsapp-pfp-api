import { getQRCode } from '../lib/whatsapp.js';
import qrcode from 'qrcode';

export default async function handler(req, res) {
  const qr = getQRCode();
  if (qr) {
    const qrImage = await qrcode.toDataURL(qr);
    res.setHeader('Content-Type', 'text/html');
    res.send(`
      <html>
        <body style="background-color: #111; color: #fff; text-align: center; font-family: sans-serif;">
          <h1>Escaneie o QR Code com seu WhatsApp</h1>
          <img src="${qrImage}" alt="QR Code" style="max-width: 90%;"/>
        </body>
      </html>
    `);
  } else {
    res.status(200).json({ message: 'Conectado! Não há QR Code para exibir.' });
  }
}
