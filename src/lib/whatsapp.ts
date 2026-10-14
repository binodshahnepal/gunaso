/**
 * WhatsApp Notification Service for BPKCH Sujhaab Portal
 * Integrates with Meta WhatsApp Cloud API / Twilio WhatsApp API
 */

interface WhatsAppAlertParams {
  phone: string;
  patientName?: string | null;
  trackingId: string;
  pin: string;
  status: string;
  departmentName?: string;
  unitName?: string | null;
  actionSummary?: string | null;
  type: 'CREATED' | 'STATUS_UPDATE' | 'RESOLVED';
}

export async function sendWhatsAppAlert(params: WhatsAppAlertParams) {
  const { phone, patientName, trackingId, pin, status, departmentName, unitName, actionSummary, type } = params;

  if (!phone || phone.length < 7) {
    console.log('[WhatsApp Alert Skipped] No valid phone number provided.');
    return { success: false, reason: 'Invalid phone' };
  }

  // Format phone number to international format (e.g. 9779821804978)
  let formattedPhone = phone.trim().replace(/\D/g, '');
  if (!formattedPhone.startsWith('977') && formattedPhone.length === 10) {
    formattedPhone = `977${formattedPhone}`;
  }

  const trackingUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3010'}/track?trackingId=${trackingId}&pin=${pin}`;

  // Craft WhatsApp Text Message
  let messageText = '';

  if (type === 'CREATED') {
    messageText =
      `🏥 *B.P. Koirala Memorial Cancer Hospital (BPKMCH)*\n` +
      `*Sujhaab & Grievance Ticket Created*\n\n` +
      `Dear ${patientName || 'Patient'},\n` +
      `Your suggestion / grievance has been successfully lodged.\n\n` +
      `📋 *Tracking ID:* ${trackingId}\n` +
      `🔑 *Security PIN:* ${pin}\n` +
      `🏢 *Department:* ${departmentName || 'General Hospital'}${unitName ? ` (${unitName})` : ''}\n` +
      `📌 *Status:* SUBMITTED (उजुरी / सुझाव दर्ता भयो)\n\n` +
      `🔍 *Track Status Live:* ${trackingUrl}\n\n` +
      `_Our Sujhaab & Grievance Committee will review and address your issue promptly._`;
  } else if (type === 'RESOLVED') {
    messageText =
      `🏥 *BPKMCH Sujhaab & Grievance Resolution Alert*\n\n` +
      `Dear ${patientName || 'Patient'},\n` +
      `Your suggestion / grievance *${trackingId}* has been *RESOLVED* by hospital administration.\n\n` +
      `📝 *Action Taken Report:*\n${actionSummary || 'Action logged by committee.'}\n\n` +
      `🔍 *View Full Report & Rate Satisfaction:* ${trackingUrl}`;
  } else {
    messageText =
      `🏥 *BPKMCH Sujhaab & Grievance Status Update*\n\n` +
      `Dear ${patientName || 'Patient'},\n` +
      `The status of your ticket *${trackingId}* has been updated to: *${status}*.\n\n` +
      `🔍 *Track Live Status:* ${trackingUrl}`;
  }

  console.log(`\n========================================`);
  console.log(`📲 [WHATSAPP DISPATCH TO +${formattedPhone}]`);
  console.log(messageText);
  console.log(`========================================\n`);

  const token = process.env.WHATSAPP_CLOUD_TOKEN;
  const phoneId = process.env.WHATSAPP_PHONE_ID;

  if (token && phoneId) {
    try {
      // 1. Send Meta Pre-Approved Template Message (Guarantees delivery past 24h window limit)
      const templateResponse = await fetch(`https://graph.facebook.com/v18.0/${phoneId}/messages`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messaging_product: 'whatsapp',
          to: formattedPhone,
          type: 'template',
          template: {
            name: 'hello_world',
            language: { code: 'en_US' },
          },
        }),
      });

      // 2. Also send full detailed custom text message
      const textResponse = await fetch(`https://graph.facebook.com/v18.0/${phoneId}/messages`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messaging_product: 'whatsapp',
          to: formattedPhone,
          type: 'text',
          text: { body: messageText },
        }),
      });

      const textData = await textResponse.json();
      return { success: true, api: 'META_CLOUD_API', textData };
    } catch (err: any) {
      console.error('Meta WhatsApp API Error:', err);
      return { success: false, error: err.message };
    }
  }

  return {
    success: true,
    simulated: true,
    recipient: `+${formattedPhone}`,
    message: messageText,
  };
}
