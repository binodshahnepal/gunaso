# Meta WhatsApp Cloud API Setup Guide
## B.P. Koirala Memorial Cancer Hospital (BPKCH) Gunaso Portal

This guide provides step-by-step instructions to obtain `WHATSAPP_CLOUD_TOKEN` and `WHATSAPP_PHONE_ID` from Meta (Facebook) for automated WhatsApp grievance alerts.

---

## Step 1: Create a Meta Developer Account
1. Open [Meta for Developers](https://developers.facebook.com/).
2. Log in with a Facebook account.
3. Click **My Apps** in the top navigation bar.

---

## Step 2: Create a Meta App
1. Click **Create App**.
2. Select **Business** as the app type and click **Next**.
3. Set App Name: `BPKCH Gunaso Portal`
4. Enter contact email and click **Create App**.

---

## Step 3: Add WhatsApp Product
1. On the App Dashboard, scroll down to the **Add products to your app** section.
2. Locate **WhatsApp** and click **Set up**.
3. Select your Meta Business Account (or accept default).

---

## Step 4: Get Temporary Token & Phone Number ID (For Immediate Testing)
1. On the left menu, click **WhatsApp** ➔ **API Setup**.
2. Under **Step 1: Select phone numbers and send messages**:
   - **Temporary Access Token**: Copy this value -> This is `WHATSAPP_CLOUD_TOKEN` (Valid for 24h).
   - **Phone Number ID**: Copy the 15-digit ID (e.g., `105928471928374`) -> This is `WHATSAPP_PHONE_ID`.
3. In the **To** dropdown, select **Manage Phone Number List** and add your own mobile number (e.g., `9841234567`) to receive test WhatsApp messages.
4. Click **Send message** to test.

---

## Step 5: Get Permanent Token (For Official Production Use)
*(Temporary tokens expire in 24 hours. Follow these steps for a permanent token that never expires):*

1. Open [Meta Business Settings](https://business.facebook.com/settings).
2. Go to **Users** ➔ **System Users** on the left sidebar.
3. Click **Add**, name the System User `Gunaso Bot System User`, and select role **Admin**.
4. Click **Add Assets**:
   - Select **Apps** ➔ choose `BPKCH Gunaso Portal`.
   - Enable **Full Control** and save.
5. Click **Generate New Token**:
   - Select App: `BPKCH Gunaso Portal`
   - Token Expiration: **Never**
   - Check Permissions: `whatsapp_business_messaging` and `whatsapp_business_management`.
6. Click **Generate Token** and copy the permanent string.

---

## Step 6: Add Official Hospital WhatsApp Number
1. In Meta Developer Dashboard ➔ **WhatsApp** ➔ **API Setup**.
2. Scroll to **Step 5: Add a Phone Number** and click **Add Phone Number**.
3. Enter Display Name: `BPKCH Grievance Cell`
4. Enter the hospital landline or mobile SIM number dedicated to WhatsApp.
5. Verify via SMS / Phone Call OTP.
6. Once verified, Meta will provide the **Production Phone Number ID**.

---

## Step 7: Update `.env` File
Add these keys to `E:\Ibrahim Sir\gunaso\.env`:

```env
# Meta WhatsApp Cloud API Configuration
WHATSAPP_CLOUD_TOKEN="your_permanent_system_user_token_here"
WHATSAPP_PHONE_ID="your_15_digit_phone_number_id_here"
NEXT_PUBLIC_APP_URL="http://localhost:3010"
```

Restart the server after updating `.env`.
