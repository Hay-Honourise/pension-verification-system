# Fix Brevo Email Authentication Error (535)

## Error: `535 5.7.8 Authentication failed`

This means your **EMAIL_PASS** is incorrect. The SMTP password is NOT your Brevo login password!

---

## ✅ Step-by-Step Fix

### Step 1: Login to Brevo Dashboard
1. Go to https://www.brevo.com/
2. Login with your account (`seunmathais08@gmail.com`)

### Step 2: Verify Your Email (if not done)
1. Check your email inbox for verification email from Brevo
2. Click the verification link
3. Or go to **Settings → Senders & IP → Senders**
4. Click "Verify" next to your email address

### Step 3: Get Your SMTP Key (IMPORTANT!)
1. In Brevo Dashboard, go to **Settings** (gear icon in left sidebar)
2. Click **SMTP & API** 
3. Click the **SMTP** tab
4. You'll see:
   - **SMTP Server**: `smtp-relay.sendinblue.com`
   - **Port**: `587`
   - **Username**: Your verified email (`seunmathais08@gmail.com`)
   - **SMTP Key**: This is what you need! (Click "Show" or "Generate")

### Step 4: Copy the SMTP Key
- The SMTP key looks like: `xsmtp-something-long-random-string`
- Or a long alphanumeric string
- **This is NOT your login password!**

### Step 5: Update .env.local
Update your `.env.local` file:

```env
EMAIL_HOST=smtp-relay.sendinblue.com
EMAIL_PORT=587
EMAIL_USER=seunmathais08@gmail.com
EMAIL_PASS=xsmtp-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx  # ← Your SMTP key here!
EMAIL_FROM="Pension Verification System <seunmathais08@gmail.com>"
```

**Important:**
- `EMAIL_PASS` must be the **SMTP key** from Brevo dashboard
- NOT your Gmail password
- NOT your Brevo login password
- It should look like `xsmtp-...` or a long random string

### Step 6: Restart Your Dev Server
```bash
# Stop your server (Ctrl+C)
# Then restart:
npm run dev
```

### Step 7: Test the Configuration
Visit: `http://localhost:3000/api/test-email?to=your-test-email@example.com`

---

## 🔍 How to Verify Your Setup

1. **Check if email is verified:**
   - Brevo Dashboard → Settings → Senders & IP → Senders
   - Your email should show "✅ Verified"

2. **Check SMTP settings:**
   - Brevo Dashboard → Settings → SMTP & API → SMTP
   - Make sure you're copying the "SMTP Key" (not login password)

3. **Test with the test endpoint:**
   - Visit: `http://localhost:3000/api/test-email`
   - Check the response for any errors

---

## ⚠️ Common Mistakes

❌ **Using Gmail password** → Use Brevo SMTP key instead  
❌ **Using Brevo login password** → Use SMTP key from SMTP tab  
❌ **Email not verified** → Verify email in Brevo first  
❌ **Wrong username** → Must match verified email exactly  
❌ **Extra spaces in .env.local** → Remove any spaces around `=`

---

## 📧 Still Having Issues?

1. **Double-check your .env.local:**
   ```env
   EMAIL_HOST=smtp-relay.sendinblue.com
   EMAIL_PORT=587
   EMAIL_USER=seunmathais08@gmail.com
   EMAIL_PASS=your-actual-smtp-key-from-brevo  # No quotes, no spaces
   EMAIL_FROM="Pension Verification System <seunmathais08@gmail.com>"
   ```

2. **Regenerate SMTP key:**
   - Brevo Dashboard → SMTP & API → SMTP
   - Click "Generate" to create a new key
   - Copy the new key to `.env.local`

3. **Check Brevo account status:**
   - Make sure your account is active
   - Check if you've reached any sending limits
   - Free tier has daily sending limits

4. **Check server logs:**
   - Look for detailed error messages in your server console
   - The error will tell you exactly what's wrong

---

## ✅ Success Indicators

When working correctly, you'll see in your server logs:
- `✅ Email configuration verified successfully!`
- `✅ Email sent successfully!`
- `Message ID: <...>`

When you test registration, you should receive the email in the pensioner's inbox!

