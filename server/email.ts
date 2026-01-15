import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

// Генерация 6-значного кода
export function generateVerificationCode(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

// Отправка кода верификации
export async function sendVerificationCode(email: string, code: string): Promise<boolean> {
  try {
    const { error } = await resend.emails.send({
      from: 'ЭПС <noreply@eps.su>',
      to: email,
      subject: 'Код подтверждения регистрации - ЭПС',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
        </head>
        <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; margin: 0; padding: 0; background-color: #f4f4f5;">
          <div style="max-width: 600px; margin: 0 auto; padding: 40px 20px;">
            <div style="background: white; border-radius: 12px; padding: 40px; box-shadow: 0 2px 8px rgba(0,0,0,0.05);">
              <!-- Logo -->
              <div style="text-align: center; margin-bottom: 32px;">
                <h1 style="color: #dc2626; font-size: 32px; margin: 0;">ЭПС</h1>
                <p style="color: #71717a; font-size: 14px; margin: 8px 0 0;">Электропневмосервис</p>
              </div>

              <!-- Content -->
              <h2 style="color: #18181b; font-size: 24px; text-align: center; margin: 0 0 16px;">
                Подтверждение email
              </h2>
              <p style="color: #52525b; font-size: 16px; text-align: center; margin: 0 0 32px;">
                Используйте код ниже для завершения регистрации
              </p>

              <!-- Code -->
              <div style="background: linear-gradient(135deg, #dc2626 0%, #f97316 100%); border-radius: 12px; padding: 24px; text-align: center; margin-bottom: 32px;">
                <span style="font-size: 40px; font-weight: bold; letter-spacing: 8px; color: white;">
                  ${code}
                </span>
              </div>

              <p style="color: #71717a; font-size: 14px; text-align: center; margin: 0 0 8px;">
                Код действителен 15 минут
              </p>
              <p style="color: #a1a1aa; font-size: 12px; text-align: center; margin: 0;">
                Если вы не регистрировались на нашем сайте, проигнорируйте это письмо
              </p>
            </div>

            <!-- Footer -->
            <div style="text-align: center; margin-top: 24px;">
              <p style="color: #a1a1aa; font-size: 12px; margin: 0;">
                © ${new Date().getFullYear()} ЭПС. Все права защищены.
              </p>
            </div>
          </div>
        </body>
        </html>
      `,
    });

    if (error) {
      console.error('Email send error:', error);
      return false;
    }

    return true;
  } catch (err) {
    console.error('Email service error:', err);
    return false;
  }
}

// Отправка письма для сброса пароля (можно использовать в будущем)
export async function sendPasswordResetEmail(email: string, resetLink: string): Promise<boolean> {
  try {
    const { error } = await resend.emails.send({
      from: 'ЭПС <noreply@eps.su>',
      to: email,
      subject: 'Сброс пароля - ЭПС',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
        </head>
        <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; margin: 0; padding: 0; background-color: #f4f4f5;">
          <div style="max-width: 600px; margin: 0 auto; padding: 40px 20px;">
            <div style="background: white; border-radius: 12px; padding: 40px; box-shadow: 0 2px 8px rgba(0,0,0,0.05);">
              <div style="text-align: center; margin-bottom: 32px;">
                <h1 style="color: #dc2626; font-size: 32px; margin: 0;">ЭПС</h1>
              </div>

              <h2 style="color: #18181b; font-size: 24px; text-align: center; margin: 0 0 16px;">
                Сброс пароля
              </h2>
              <p style="color: #52525b; font-size: 16px; text-align: center; margin: 0 0 32px;">
                Нажмите кнопку ниже для сброса пароля
              </p>

              <div style="text-align: center; margin-bottom: 32px;">
                <a href="${resetLink}" style="display: inline-block; background: linear-gradient(135deg, #dc2626 0%, #f97316 100%); color: white; text-decoration: none; padding: 16px 32px; border-radius: 8px; font-weight: 600; font-size: 16px;">
                  Сбросить пароль
                </a>
              </div>

              <p style="color: #71717a; font-size: 14px; text-align: center; margin: 0 0 8px;">
                Ссылка действительна 1 час
              </p>
              <p style="color: #a1a1aa; font-size: 12px; text-align: center; margin: 0;">
                Если вы не запрашивали сброс пароля, проигнорируйте это письмо
              </p>
            </div>
          </div>
        </body>
        </html>
      `,
    });

    if (error) {
      console.error('Password reset email error:', error);
      return false;
    }

    return true;
  } catch (err) {
    console.error('Email service error:', err);
    return false;
  }
}
