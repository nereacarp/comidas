interface MailMessage {
  to: string;
  subject: string;
  text: string;
  html: string;
}

export function appPublicUrl(): string {
  return (process.env.APP_URL?.trim() || 'http://localhost:5175').replace(/\/$/, '');
}

export async function sendMail(message: MailMessage): Promise<void> {
  const apiKey = process.env.RESEND_API_KEY?.trim();
  const from = process.env.MAIL_FROM?.trim();

  if (!apiKey || !from) {
    if (process.env.NODE_ENV === 'production') {
      throw new Error('El servicio de correo no está configurado');
    }
    console.info(`[correo de desarrollo] ${message.to} | ${message.subject}\n${message.text}`);
    return;
  }

  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ from, to: [message.to], subject: message.subject, text: message.text, html: message.html }),
    signal: AbortSignal.timeout(10_000),
  });

  if (!response.ok) {
    throw new Error(`El proveedor de correo respondió con ${response.status}`);
  }
}
