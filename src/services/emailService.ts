import nodemailer, { Transporter } from 'nodemailer';
import { getEmailConfig } from '../config/email.js';

let transporterPromise: Promise<Transporter> | undefined;

async function createTransporter(): Promise<Transporter> {
  const emailConfig = getEmailConfig();

  if (emailConfig.host) {
    return nodemailer.createTransport({
      host: emailConfig.host,
      port: emailConfig.port,
      secure: emailConfig.secure,
      auth: emailConfig.user && emailConfig.password
        ? { user: emailConfig.user, pass: emailConfig.password }
        : undefined,
    });
  }

  const testAccount = await nodemailer.createTestAccount();
  return nodemailer.createTransport({
    host: 'smtp.ethereal.email',
    port: 587,
    secure: false,
    auth: { user: testAccount.user, pass: testAccount.pass },
  });
}

function getTransporter() {
  transporterPromise ??= createTransporter();
  return transporterPromise;
}

export async function sendWelcomeEmail(to: string, nome: string) {
  const transporter = await getTransporter();
  const emailConfig = getEmailConfig();
  const safeName = escapeHtml(nome);
  const info = await transporter.sendMail({
    from: emailConfig.from,
    to,
    subject: 'Bem-vindo ao ClickSala',
    text: `Olá, ${nome}! Seu cadastro no ClickSala foi realizado com sucesso.`,
    html: `<p>Olá, <strong>${safeName}</strong>!</p><p>Seu cadastro no ClickSala foi realizado com sucesso.</p>`,
  });

  const previewUrl = nodemailer.getTestMessageUrl(info);
  if (previewUrl) {
    console.log(`📧 Prévia do e-mail: ${previewUrl}`);
  }

  return { messageId: info.messageId, previewUrl };
}

function escapeHtml(value: string) {
  return value.replace(/[&<>'"]/g, (character) => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    "'": '&#39;',
    '"': '&quot;',
  })[character] || character);
}