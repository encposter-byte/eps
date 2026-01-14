import { Resend } from 'resend';

// Инициализируем Resend с API-ключом (используем заглушку если ключ не установлен)
const resend = process.env.RESEND_API_KEY
  ? new Resend(process.env.RESEND_API_KEY)
  : null;

// Удостоверяемся, что API-ключ предоставлен
if (!process.env.RESEND_API_KEY) {
  console.warn('⚠️ RESEND_API_KEY is not set. Emails will not be sent.');
}

export interface EmailOptions {
  to: string;
  subject: string;
  text?: string;
  html?: string;
}

/**
 * Отправляет электронную почту через Resend
 * @param options Параметры письма
 * @returns Promise с результатом отправки
 */
export async function sendEmail(options: EmailOptions): Promise<boolean> {
  try {
    // Проверка наличия API-ключа и клиента
    if (!process.env.RESEND_API_KEY || !resend) {
      console.warn('Resend API key not set. Email would not be sent.');
      console.log('Would send email with options:', options);
      return false;
    }

    // Получаем авторизованный email для тестирования из переменной окружения
    const authorizedTestEmail = "encposter@gmail.com"; // Ваш email, который зарегистрирован в Resend

    // В тестовом режиме Resend позволяет отправлять только на email, зарегистрированный в аккаунте
    // Для других получателей нужно верифицировать домен
    console.log(`Email would be sent to ${options.to}, but in test mode sending to ${authorizedTestEmail} instead`);

    // Отправляем электронное письмо
    const { data, error } = await resend!.emails.send({
      from: 'onboarding@resend.dev', // Используем тестовый домен Resend для разработки
      to: authorizedTestEmail, // Всегда отправляем на наш собственный email в тестовом режиме
      subject: options.subject,
      text: `ТЕСТОВОЕ ПИСЬМО - должно было быть отправлено на адрес ${options.to}\n\n${options.text || ''}`,
      html: `<p><strong>ТЕСТОВОЕ ПИСЬМО - должно было быть отправлено на адрес ${options.to}</strong></p>${options.html || ''}`
    });

    if (error) {
      console.error('Resend error:', error);
      return false;
    }

    console.log('Email sent with Resend ID:', data?.id);
    return true;
  } catch (error) {
    console.error('Error sending email with Resend:', error);
    return false;
  }
}

/**
 * Отправляет письмо для восстановления пароля
 * @param email Email получателя
 * @param token Токен для восстановления
 * @param resetUrl URL для восстановления
 */
export async function sendPasswordResetEmail(email: string, token: string, resetUrl: string): Promise<boolean> {
  const subject = 'Восстановление пароля на сайте ЭПС Инструменты';
  
  const text = `
    Здравствуйте!
    
    Вы запросили восстановление пароля на сайте ЭПС Инструменты.
    
    Для сброса пароля перейдите по ссылке:
    ${resetUrl}
    
    Если вы не запрашивали восстановление пароля, просто проигнорируйте это письмо.
    
    С уважением,
    Команда ЭПС Инструменты
  `;
  
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #f27821;">Восстановление пароля</h2>
      <p>Здравствуйте!</p>
      <p>Вы запросили восстановление пароля на сайте ЭПС Инструменты.</p>
      <p>Для сброса пароля нажмите на кнопку ниже:</p>
      <p style="text-align: center; margin: 25px 0;">
        <a href="${resetUrl}" style="background-color: #f27821; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; font-weight: bold;">Сбросить пароль</a>
      </p>
      <p>Или перейдите по ссылке: <a href="${resetUrl}">${resetUrl}</a></p>
      <p>Если вы не запрашивали восстановление пароля, просто проигнорируйте это письмо.</p>
      <p>С уважением,<br>Команда ЭПС Инструменты</p>
    </div>
  `;
  
  return await sendEmail({
    to: email,
    subject,
    text,
    html
  });
}