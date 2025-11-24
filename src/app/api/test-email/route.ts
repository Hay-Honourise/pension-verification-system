import { NextRequest, NextResponse } from 'next/server';
import { mailer } from '@/lib/email';

/**
 * Test endpoint to verify email configuration
 * GET /api/test-email?to=test@example.com
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const to = searchParams.get('to') || process.env.EMAIL_USER || 'test@example.com';

    // Check if email config is set
    const config = {
      EMAIL_HOST: process.env.EMAIL_HOST ? '✅ Set' : '❌ Missing',
      EMAIL_PORT: process.env.EMAIL_PORT ? `✅ ${process.env.EMAIL_PORT}` : '❌ Missing',
      EMAIL_USER: process.env.EMAIL_USER ? '✅ Set' : '❌ Missing',
      EMAIL_PASS: process.env.EMAIL_PASS ? '✅ Set (hidden)' : '❌ Missing',
      EMAIL_FROM: process.env.EMAIL_FROM || 'Not set (will use EMAIL_USER)',
    };

    // Try to verify connection
    let verificationResult = 'Not attempted';
    try {
      await mailer.verify();
      verificationResult = '✅ Connection verified successfully';
    } catch (verifyError: any) {
      verificationResult = `❌ Verification failed: ${verifyError.message}`;
    }

    // Try to send test email
    let sendResult = 'Not attempted';
    let emailInfo = null;
    try {
      emailInfo = await mailer.sendMail({
        from: process.env.EMAIL_FROM || `"Pension Verification System" <${process.env.EMAIL_USER}>`,
        to,
        subject: 'Test Email - Pension Verification System',
        html: `
          <div style="font-family: Arial, sans-serif; padding: 20px;">
            <h2>Test Email</h2>
            <p>This is a test email from the Pension Verification System.</p>
            <p>If you received this email, your email configuration is working correctly!</p>
            <p><strong>Sent at:</strong> ${new Date().toISOString()}</p>
          </div>
        `,
      });
      sendResult = `✅ Email sent successfully! Message ID: ${emailInfo.messageId}`;
    } catch (sendError: any) {
      sendResult = `❌ Failed to send email: ${sendError.message}`;
      if (sendError.code) {
        sendResult += ` (Code: ${sendError.code})`;
      }
      if (sendError.responseCode) {
        sendResult += ` (Response Code: ${sendError.responseCode})`;
      }
    }

    return NextResponse.json({
      success: sendResult.includes('✅'),
      config,
      verification: verificationResult,
      testEmail: {
        to,
        result: sendResult,
        messageId: emailInfo?.messageId || null,
        accepted: emailInfo?.accepted || null,
        rejected: emailInfo?.rejected || null,
      },
      recommendations: !process.env.EMAIL_HOST || !process.env.EMAIL_USER || !process.env.EMAIL_PASS
        ? [
            'Add EMAIL_HOST, EMAIL_PORT, EMAIL_USER, and EMAIL_PASS to .env.local',
            'For Brevo: EMAIL_HOST=smtp-relay.sendinblue.com, EMAIL_PORT=587',
            'Make sure EMAIL_USER is your verified Brevo email',
            'Make sure EMAIL_PASS is your Brevo SMTP key (not your login password)',
          ]
        : sendResult.includes('❌')
        ? [
            'Check your Brevo SMTP credentials in .env.local',
            'Verify your sender email is verified in Brevo dashboard',
            'Make sure you\'re using the SMTP key (not your Brevo login password)',
            'Check Brevo dashboard for any account restrictions or limits',
          ]
        : ['Email configuration looks good! ✅'],
    });
  } catch (error: any) {
    console.error('Test email error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Unknown error',
        stack: process.env.NODE_ENV === 'development' ? error.stack : undefined,
      },
      { status: 500 }
    );
  }
}

