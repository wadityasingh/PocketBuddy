import emailjs from '@emailjs/browser';

/**
 * PocketBuddy EmailJS Configuration
 * Verified from user dashboard:
 * Service ID: service_lwtnlfj
 * Template ID: template_bdkyd5o (Contact Us template)
 * Public Key: 3_T_VU-UbX05S1yd2
 */
export const DEFAULT_EMAILJS_CONFIG = {
  SERVICE_ID: 'service_lwtnlfj',
  TEMPLATE_ID: 'template_bdkyd5o',
  PUBLIC_KEY: '3_T_VU-UbX05S1yd2',
} as const;

export function getActiveEmailJsConfig(): {
  serviceId: string;
  templateId: string;
  publicKey: string;
} {
  try {
    const savedTemplate = typeof window !== 'undefined' ? localStorage.getItem('smm_emailjs_template_id') : null;
    const savedService = typeof window !== 'undefined' ? localStorage.getItem('smm_emailjs_service_id') : null;
    const savedKey = typeof window !== 'undefined' ? localStorage.getItem('smm_emailjs_public_key') : null;

    return {
      serviceId: savedService?.trim() || DEFAULT_EMAILJS_CONFIG.SERVICE_ID,
      templateId: savedTemplate?.trim() || DEFAULT_EMAILJS_CONFIG.TEMPLATE_ID,
      publicKey: savedKey?.trim() || DEFAULT_EMAILJS_CONFIG.PUBLIC_KEY,
    };
  } catch {
    return {
      serviceId: DEFAULT_EMAILJS_CONFIG.SERVICE_ID,
      templateId: DEFAULT_EMAILJS_CONFIG.TEMPLATE_ID,
      publicKey: DEFAULT_EMAILJS_CONFIG.PUBLIC_KEY,
    };
  }
}

export function saveEmailJsConfig(config: { serviceId?: string; templateId?: string; publicKey?: string }): void {
  try {
    if (typeof window !== 'undefined') {
      if (config.serviceId) localStorage.setItem('smm_emailjs_service_id', config.serviceId.trim());
      if (config.templateId) localStorage.setItem('smm_emailjs_template_id', config.templateId.trim());
      if (config.publicKey) localStorage.setItem('smm_emailjs_public_key', config.publicKey.trim());
    }
  } catch (e) {
    console.warn('Could not save EmailJS config to localStorage:', e);
  }
}

export interface SendEmailReportOptions {
  toEmail: string;
  toName?: string;
  subject: string;
  reportType: 'Personal Expense Report' | 'Room Shared Expense Report';
  dateRange: string;
  filename: string;
  pdfDataUri: string; // Base64 data URI format: data:application/pdf;base64,...
  customTemplateId?: string;
  customServiceId?: string;
  customPublicKey?: string;
}

export interface SendEmailResult {
  success: boolean;
  message: string;
  error?: string;
}

/**
 * Validate standard email format
 */
export function isValidEmail(email: string): boolean {
  if (!email || typeof email !== 'string') return false;
  const regex = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)+$/;
  return regex.test(email.trim());
}

/**
 * Send PDF Expense Report via EmailJS with real PDF attachment
 */
export async function sendEmailExpenseReport(options: SendEmailReportOptions): Promise<SendEmailResult> {
  const cleanEmail = options.toEmail?.trim();

  if (!cleanEmail || !isValidEmail(cleanEmail)) {
    return {
      success: false,
      message: 'Please provide a valid recipient email address.',
      error: 'INVALID_EMAIL',
    };
  }

  if (!options.pdfDataUri || !options.pdfDataUri.startsWith('data:application/pdf')) {
    return {
      success: false,
      message: 'Invalid PDF data attachment. PDF generation may have failed.',
      error: 'INVALID_ATTACHMENT',
    };
  }

  const cleanName = (options.toName || cleanEmail.split('@')[0] || 'Student').trim();
  const cfg = getActiveEmailJsConfig();

  const serviceId = options.customServiceId?.trim() || cfg.serviceId;
  const templateId = options.customTemplateId?.trim() || cfg.templateId;
  const publicKey = options.customPublicKey?.trim() || cfg.publicKey;

  // Comprehensive template parameters matching EmailJS "Contact Us" template
  // and variable attachment parameters
  const bodyMessage = `Hello ${cleanName},\n\nPlease find attached your official PocketBuddy ${options.reportType}.\n\n• Statement Period: ${options.dateRange}\n• Document: ${options.filename}\n\nGenerated securely from PocketBuddy — Student Smart Money Manager.`;

  const templateParams: Record<string, any> = {
    // Primary recipient
    to_email: cleanEmail,
    email: cleanEmail,
    reply_to: cleanEmail,

    // Primary name
    to_name: cleanName,
    from_name: 'PocketBuddy',

    // Subject & Message
    subject: options.subject,
    message: bodyMessage,

    // Specific report fields
    report_type: options.reportType,
    date_range: options.dateRange,
    filename: options.filename,

    // Single attachment parameter (strictly avoids duplicating Base64 to stay well under EmailJS 50Kb limit)
    pdf_attachment: options.pdfDataUri,
  };

  const payloadJson = JSON.stringify(templateParams);
  const payloadSizeKb = (payloadJson.length / 1024).toFixed(1);
  console.log(`[EmailJS] Dispatching payload size: ${payloadSizeKb} KB (${payloadJson.length} bytes)`);

  if (payloadJson.length > 50000) {
    return {
      success: false,
      message: `PDF statement payload (${payloadSizeKb} KB) exceeds the EmailJS free tier limit (50 KB). Please select a narrower date range (such as This Month or Last 30 Days) to email, or use Download PDF.`,
      error: 'PAYLOAD_TOO_LARGE',
    };
  }

  try {
    const response = await emailjs.send(
      serviceId,
      templateId,
      templateParams,
      publicKey
    );

    if (response.status === 200) {
      return {
        success: true,
        message: `Expense report successfully sent to ${cleanEmail}.`,
      };
    } else {
      return {
        success: false,
        message: `Email service responded with status ${response.status}: ${response.text || 'Unknown response'}`,
        error: response.text,
      };
    }
  } catch (err: any) {
    console.error('EmailJS Send Error:', err);
    const errMsg = err?.text || err?.message || 'Failed to send email. Please check your network and EmailJS configuration.';
    return {
      success: false,
      message: `Failed to send email: ${errMsg}`,
      error: String(errMsg),
    };
  }
}
