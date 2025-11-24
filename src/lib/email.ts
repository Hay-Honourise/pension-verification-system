import nodemailer from "nodemailer";

// Validate email configuration
const validateEmailConfig = () => {
  const missing = [];
  if (!process.env.EMAIL_HOST) missing.push('EMAIL_HOST');
  if (!process.env.EMAIL_PORT) missing.push('EMAIL_PORT');
  if (!process.env.EMAIL_USER) missing.push('EMAIL_USER');
  if (!process.env.EMAIL_PASS) missing.push('EMAIL_PASS');
  
  if (missing.length > 0) {
    console.warn(`⚠️ Missing email configuration in .env.local: ${missing.join(', ')}`);
    return false;
  }
  return true;
};

// Export the mailer transporter for Brevo SMTP
export const mailer = nodemailer.createTransport({
  host: process.env.EMAIL_HOST,
  port: Number(process.env.EMAIL_PORT) || 587,
  secure: false, // true for 465, false for other ports
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
  // Add connection timeout
  connectionTimeout: 10000, // 10 seconds
  greetingTimeout: 5000, // 5 seconds
  socketTimeout: 10000, // 10 seconds
  // Debug mode in development
  debug: process.env.NODE_ENV === 'development',
  logger: process.env.NODE_ENV === 'development',
});

// Verify connection on startup (only log, don't throw)
if (validateEmailConfig()) {
  mailer.verify((error, success) => {
    if (error) {
      console.error('❌ Email configuration verification failed:', error.message);
      
      // Check for authentication errors
      const errorCode = (error as any)?.code;
      const hasAuthError = error.message?.includes('535') || 
                          error.message?.includes('Authentication failed') || 
                          errorCode === 'EAUTH';
      
      if (hasAuthError) {
        console.error('');
        console.error('════════════════════════════════════════════════════════════════');
        console.error('🔴 AUTHENTICATION ERROR - EMAIL_PASS IS INCORRECT!');
        console.error('════════════════════════════════════════════════════════════════');
        console.error('');
        console.error('📧 CURRENT CONFIGURATION:');
        console.error(`   EMAIL_HOST: ${process.env.EMAIL_HOST || '❌ Missing'}`);
        console.error(`   EMAIL_PORT: ${process.env.EMAIL_PORT || '❌ Missing'}`);
        console.error(`   EMAIL_USER: ${process.env.EMAIL_USER || '❌ Missing'}`);
        console.error(`   EMAIL_PASS: ${process.env.EMAIL_PASS ? '✅ Set (' + process.env.EMAIL_PASS.substring(0, 10) + '...)' : '❌ Missing'}`);
        console.error('');
        console.error('🔧 HOW TO FIX:');
        console.error('   1. Go to https://www.brevo.com/ and login');
        console.error('   2. Navigate to: Settings → SMTP & API → SMTP tab');
        console.error('   3. Find your "SMTP Key" (NOT your login password!)');
        console.error('   4. Copy the SMTP Key (looks like "xsmtp-..." or long random string)');
        console.error('   5. Open your .env.local file');
        console.error('   6. Update EMAIL_PASS with the SMTP key:');
        console.error('      EMAIL_PASS=xsmtp-your-actual-smtp-key-here');
        console.error('   7. Save .env.local and RESTART your dev server');
        console.error('');
        console.error('⚠️  IMPORTANT:');
        console.error('   • EMAIL_PASS must be your Brevo SMTP Key (from SMTP tab)');
        console.error('   • NOT your Gmail password');
        console.error('   • NOT your Brevo login password');
        console.error('   • Must match your verified Brevo email');
        console.error('');
        console.error('════════════════════════════════════════════════════════════════');
        console.error('');
      } else {
        console.error('📧 Please check your EMAIL_HOST, EMAIL_PORT, EMAIL_USER, and EMAIL_PASS in .env.local');
      }
    } else {
      console.log('✅ Email configuration verified successfully!');
      console.log('📧 SMTP server:', process.env.EMAIL_HOST, 'Port:', process.env.EMAIL_PORT);
      console.log('📧 Using email:', process.env.EMAIL_USER);
    }
  });
} else {
  console.warn('⚠️ Email configuration incomplete. Email notifications will not work.');
  console.warn('📧 Please add EMAIL_HOST, EMAIL_PORT, EMAIL_USER, and EMAIL_PASS to .env.local');
}

// Helper function for sending emails (optional, for convenience)
export const sendEmail = async ({
  to,
  subject,
  html,
}: {
  to: string;
  subject: string;
  html: string;
}) => {
  try {
    const info = await mailer.sendMail({
      from: process.env.EMAIL_FROM || `"Pension Verification System" <${process.env.EMAIL_USER}>`,
      to,
      subject,
      html,
    });

    console.log("Email sent:", info.messageId);
    return true;
  } catch (err) {
    console.error("Email sending failed:", err);
    return false;
  }
};
