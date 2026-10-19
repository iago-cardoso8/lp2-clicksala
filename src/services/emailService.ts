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

function emailLayout(title: string, content: string) {
  return `<!doctype html>
<html lang="pt-br"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="margin:0;padding:24px;background:#f1f5f4;font-family:Arial,Helvetica,sans-serif;color:#20312d;">
  <table role="presentation" style="width:100%;max-width:600px;margin:0 auto;border-collapse:collapse;background:#ffffff;border:1px solid #dce6e2;">
    <tr><td style="padding:24px 32px;background:#155e52;color:#ffffff;font-size:20px;font-weight:700;">ClickSala</td></tr>
    <tr><td style="padding:32px;">
      <h1 style="margin:0 0 20px;font-size:24px;line-height:1.3;color:#155e52;">${title}</h1>
      ${content}
    </td></tr>
    <tr><td style="padding:18px 32px;border-top:1px solid #e5ece9;color:#63736e;font-size:12px;">Mensagem automática do sistema ClickSala. Não responda a este e-mail.</td></tr>
  </table>
</body></html>`;
}

function paragraph(text: string) {
  return `<p style="margin:0 0 16px;font-size:15px;line-height:1.65;color:#344640;">${text}</p>`;
}

async function sendEmail(to: string, subject: string, text: string, html: string) {
  const transporter = await getTransporter();
  const emailConfig = getEmailConfig();
  const info = await transporter.sendMail({ from: emailConfig.from, to, subject, text, html });
  const previewUrl = nodemailer.getTestMessageUrl(info);
  if (previewUrl) console.log(`Prévia do e-mail: ${previewUrl}`);
  return { messageId: info.messageId, previewUrl };
}

export async function sendWelcomeEmail(to: string, nome: string) {
  const safeName = escapeHtml(nome);
  return sendEmail(
    to,
    'Bem-vindo ao ClickSala',
    `Olá, ${nome}! Seu cadastro no ClickSala foi realizado com sucesso. Agora você pode consultar as salas e enviar suas solicitações pelo sistema.`,
    emailLayout('Bem-vindo ao ClickSala', `${paragraph(`Olá, <strong>${safeName}</strong>!`)}${paragraph('Seu cadastro foi realizado com sucesso. Agora você pode consultar as salas e enviar suas solicitações pelo sistema.')}`)
  );
}

export async function sendRequestReceivedEmail(to: string, nome: string) {
  const safeName = escapeHtml(nome);
  return sendEmail(
    to,
    'Recebemos sua solicitação de sala',
    `Olá, ${nome}! Sua solicitação foi recebida e será analisada o mais breve possível. Você poderá acompanhar o status pelo ClickSala.`,
    emailLayout('Solicitação recebida', `${paragraph(`Olá, <strong>${safeName}</strong>!`)}${paragraph('Sua solicitação foi recebida e será analisada o mais breve possível.')}${paragraph('Você pode acompanhar o andamento na área <strong>Minhas Salas</strong> do ClickSala.')}`)
  );
}

export async function sendRequestDecisionEmail(to: string, nome: string, sala: string, data: string, hora: string, approved: boolean) {
  const safeName = escapeHtml(nome);
  const safeSala = escapeHtml(sala);
  const safeData = escapeHtml(data);
  const safeHora = escapeHtml(hora);
  const subject = approved ? 'Sua solicitação de sala foi confirmada' : 'Atualização sobre sua solicitação de sala';
  const text = approved
    ? `Olá, ${nome}! Sua solicitação foi confirmada. Você poderá usar a sala ${sala} no dia ${data}, no horário ${hora}. Lembre-se de chegar no horário. Recomendações: evite consumir alimentos em laboratórios, confira se não esqueceu nenhum item e, ao sair, deixe os equipamentos desligados e nos devidos locais.`
    : `Olá, ${nome}! Sua solicitação da sala ${sala}, no dia ${data}, no horário ${hora}, foi recusada. Não fique triste: você pode solicitar outra sala em outro horário pelo ClickSala.`;
  const details = `${paragraph(`<strong>Sala:</strong> ${safeSala}<br><strong>Data:</strong> ${safeData}<br><strong>Horário:</strong> ${safeHora}`)}`;
  const content = approved
    ? `${paragraph(`Olá, <strong>${safeName}</strong>! Sua solicitação foi confirmada.`)}${details}${paragraph('<strong>Lembre-se de chegar no horário.</strong>')}${paragraph('<strong>Recomendações para o uso da sala</strong><br>Evite consumir alimentos em laboratórios, confira se não esqueceu nenhum item e, ao sair, deixe os equipamentos desligados e nos seus devidos locais.')}`
    : `${paragraph(`Olá, <strong>${safeName}</strong>! Sua solicitação abaixo foi recusada.`)}${details}${paragraph('Não fique triste! Você pode solicitar outra sala em outro horário pelo ClickSala.')}`;

  return sendEmail(to, subject, text, emailLayout(approved ? 'Solicitação confirmada' : 'Solicitação recusada', content));
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