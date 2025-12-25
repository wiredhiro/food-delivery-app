import nodemailer from 'nodemailer';

// メール送信の共通関数
export async function sendEmail({
  to,
  subject,
  html,
}: {
  to: string;
  subject: string;
  html: string;
}) {
  try {
    // 開発環境ではコンソールにログ出力のみ
    if (process.env.NODE_ENV === 'development' || !process.env.SMTP_USER || process.env.SMTP_USER === 'your-email@gmail.com') {
      console.log('📧 [Email] Would send email:');
      console.log('To:', to);
      console.log('Subject:', subject);
      console.log('HTML:', html.substring(0, 200) + '...');
      return { success: true, message: 'Email logged (dev mode)' };
    }

    // 本番環境の場合のみトランスポーターを作成
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: parseInt(process.env.SMTP_PORT || '587'),
      secure: false, // TLS
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });

    const info = await transporter.sendMail({
      from: process.env.SMTP_FROM,
      to,
      subject,
      html,
    });

    console.log('✅ Email sent:', info.messageId);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('❌ Email error:', error);
    return { success: false, error: String(error) };
  }
}

// 注文確認メールのHTML生成
export function generateOrderConfirmationEmail({
  orderNumber,
  userName,
  totalAmount,
  items,
  deliveryAddress,
}: {
  orderNumber: number;
  userName: string;
  totalAmount: number;
  items: Array<{ name: string; quantity: number; price: number }>;
  deliveryAddress: string;
}) {
  const itemsHtml = items
    .map(
      (item) => `
    <tr>
      <td style="padding: 10px; border-bottom: 1px solid #eee;">${item.name}</td>
      <td style="padding: 10px; border-bottom: 1px solid #eee; text-align: center;">${item.quantity}</td>
      <td style="padding: 10px; border-bottom: 1px solid #eee; text-align: right;">¥${item.price.toLocaleString()}</td>
      <td style="padding: 10px; border-bottom: 1px solid #eee; text-align: right;">¥${(item.quantity * item.price).toLocaleString()}</td>
    </tr>
  `
    )
    .join('');

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>ご注文ありがとうございます</title>
</head>
<body style="font-family: 'Hiragino Sans', 'Yu Gothic', sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
    <h1 style="color: white; margin: 0;">ご注文ありがとうございます</h1>
  </div>

  <div style="background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px;">
    <p style="font-size: 16px; margin-bottom: 20px;">
      ${userName} 様
    </p>

    <p>この度は、食事宅配サービスをご利用いただき誠にありがとうございます。</p>
    <p>ご注文を承りました。以下の内容をご確認ください。</p>

    <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0;">
      <h2 style="color: #667eea; border-bottom: 2px solid #667eea; padding-bottom: 10px;">注文詳細</h2>
      <p><strong>注文番号:</strong> #${orderNumber}</p>

      <h3 style="margin-top: 20px;">ご注文商品</h3>
      <table style="width: 100%; border-collapse: collapse; margin: 10px 0;">
        <thead>
          <tr style="background: #f5f5f5;">
            <th style="padding: 10px; text-align: left;">商品名</th>
            <th style="padding: 10px; text-align: center;">数量</th>
            <th style="padding: 10px; text-align: right;">単価</th>
            <th style="padding: 10px; text-align: right;">小計</th>
          </tr>
        </thead>
        <tbody>
          ${itemsHtml}
        </tbody>
      </table>

      <div style="text-align: right; margin-top: 20px; padding-top: 20px; border-top: 2px solid #667eea;">
        <p style="font-size: 20px; font-weight: bold; color: #667eea; margin: 0;">
          合計金額: ¥${totalAmount.toLocaleString()}
        </p>
      </div>

      <h3 style="margin-top: 30px;">お届け先</h3>
      <p style="background: #f9f9f9; padding: 15px; border-radius: 5px; white-space: pre-line;">${deliveryAddress}</p>
    </div>

    <div style="background: #fff3cd; border-left: 4px solid #ffc107; padding: 15px; margin: 20px 0; border-radius: 5px;">
      <p style="margin: 0; color: #856404;">
        <strong>📦 配送状況について</strong><br>
        配送の準備が完了次第、別途メールにてお知らせいたします。<br>
        マイページの注文履歴からも配送状況をご確認いただけます。
      </p>
    </div>

    <p style="margin-top: 30px; text-align: center;">
      <a href="${process.env.NEXT_PUBLIC_APP_URL}/orders/${orderNumber}"
         style="display: inline-block; background: #667eea; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; font-weight: bold;">
        注文詳細を確認
      </a>
    </p>

    <hr style="border: none; border-top: 1px solid #ddd; margin: 30px 0;">

    <p style="font-size: 12px; color: #666; text-align: center;">
      このメールは送信専用です。<br>
      お問い合わせは<a href="${process.env.NEXT_PUBLIC_APP_URL}" style="color: #667eea;">公式サイト</a>からお願いいたします。
    </p>
  </div>
</body>
</html>
  `;
}

// 配送通知メールのHTML生成
export function generateShippingNotificationEmail({
  orderNumber,
  userName,
  status,
  statusDescription,
  trackingNumber,
  carrier,
  estimatedDelivery,
}: {
  orderNumber: number;
  userName: string;
  status: string;
  statusDescription?: string;
  trackingNumber?: string;
  carrier?: string;
  estimatedDelivery?: string;
}) {
  const statusMessages: Record<string, { icon: string; title: string; color: string }> = {
    confirmed: { icon: '✅', title: 'ご注文を確認しました', color: '#2196F3' },
    preparing: { icon: '👨‍🍳', title: '商品を準備中です', color: '#9C27B0' },
    ready_for_shipping: { icon: '📦', title: '発送準備が完了しました', color: '#FF9800' },
    shipped: { icon: '🚚', title: '商品を発送しました', color: '#4CAF50' },
    in_transit: { icon: '🚛', title: '配送中です', color: '#00BCD4' },
    out_for_delivery: { icon: '🏃', title: 'お届け中です', color: '#FFC107' },
    delivered: { icon: '🎉', title: 'お届け完了しました', color: '#4CAF50' },
  };

  const statusInfo = statusMessages[status] || { icon: '📋', title: 'ステータスが更新されました', color: '#607D8B' };

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>配送状況のお知らせ</title>
</head>
<body style="font-family: 'Hiragino Sans', 'Yu Gothic', sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background: ${statusInfo.color}; padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
    <h1 style="color: white; margin: 0; font-size: 28px;">
      ${statusInfo.icon} ${statusInfo.title}
    </h1>
  </div>

  <div style="background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px;">
    <p style="font-size: 16px; margin-bottom: 20px;">
      ${userName} 様
    </p>

    <p>ご注文 #${orderNumber} の配送状況が更新されました。</p>

    <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0;">
      ${statusDescription ? `<p style="font-size: 16px; color: #666; margin-bottom: 20px;">${statusDescription}</p>` : ''}

      ${carrier ? `<p><strong>配送業者:</strong> ${carrier}</p>` : ''}
      ${trackingNumber ? `<p><strong>追跡番号:</strong> <code style="background: #f5f5f5; padding: 5px 10px; border-radius: 3px;">${trackingNumber}</code></p>` : ''}
      ${estimatedDelivery ? `<p><strong>配達予定日:</strong> ${new Date(estimatedDelivery).toLocaleDateString('ja-JP', { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</p>` : ''}
    </div>

    <p style="margin-top: 30px; text-align: center;">
      <a href="${process.env.NEXT_PUBLIC_APP_URL}/orders/${orderNumber}"
         style="display: inline-block; background: ${statusInfo.color}; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; font-weight: bold;">
        配送状況を確認
      </a>
    </p>

    <hr style="border: none; border-top: 1px solid #ddd; margin: 30px 0;">

    <p style="font-size: 12px; color: #666; text-align: center;">
      このメールは送信専用です。<br>
      お問い合わせは<a href="${process.env.NEXT_PUBLIC_APP_URL}" style="color: ${statusInfo.color};">公式サイト</a>からお願いいたします。
    </p>
  </div>
</body>
</html>
  `;
}
