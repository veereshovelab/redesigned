import { createClient } from '@supabase/supabase-js';
import crypto from 'crypto';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Manual Env Loader as a fallback for Vercel CLI local env binding issues
function findEnvFile(filename) {
  let dir = process.cwd();
  while (true) {
    const fullPath = path.join(dir, filename);
    if (fs.existsSync(fullPath)) return fullPath;
    const parent = path.dirname(dir);
    if (parent === dir) break;
    dir = parent;
  }
  try {
    const __filename = fileURLToPath(import.meta.url);
    let currentDir = path.dirname(__filename);
    while (true) {
      const fullPath = path.join(currentDir, filename);
      if (fs.existsSync(fullPath)) return fullPath;
      const parent = path.dirname(currentDir);
      if (parent === currentDir) break;
      currentDir = parent;
    }
  } catch (err) {
    console.debug('Could not resolve env file relative to import.meta.url:', err);
  }
  return null;
}

function loadEnv() {
  ['.env', '.env.local'].forEach(file => {
    try {
      const envPath = findEnvFile(file);
      if (envPath) {
        const content = fs.readFileSync(envPath, 'utf-8');
        content.split('\n').forEach(line => {
          const trimmed = line.trim();
          if (!trimmed || trimmed.startsWith('#')) return;
          const parts = trimmed.split('=');
          if (parts.length >= 2) {
            const key = parts[0].trim();
            let val = parts.slice(1).join('=').trim();
            if ((val.startsWith('"') && val.endsWith('"')) ||
                (val.startsWith("'") && val.endsWith("'"))) {
              val = val.slice(1, -1);
            }
            process.env[key] = val;
          }
        });
      }
    } catch (err) {
      console.error(`Error loading env file ${file}:`, err);
    }
  });
}

loadEnv();

let supabaseAdmin;
function getSupabaseAdmin() {
  if (!supabaseAdmin) {
    const supabaseUrl = process.env.VITE_SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error('Missing Supabase admin credentials in serverless environment.');
    }
    supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);
  }
  return supabaseAdmin;
}

/**
 * Verify Razorpay webhook HMAC-SHA256 signature.
 * @param {string} rawBody  Raw request body string
 * @param {string} signature X-Razorpay-Signature header value
 * @param {string} secret   WEBHOOK_SECRET env variable
 */
function verifyRazorpaySignature(rawBody, signature, secret) {
  const expectedSig = crypto
    .createHmac('sha256', secret)
    .update(rawBody)
    .digest('hex');
  return crypto.timingSafeEqual(
    Buffer.from(expectedSig, 'hex'),
    Buffer.from(signature, 'hex')
  );
}

/**
 * Serverless Payment Webhook Handler
 * POST /api/webhook
 *
 * Supported providers:
 *  - Razorpay  (X-Razorpay-Signature header + payment.captured event)
 *  - Cashfree  (x-webhook-signature header + PAYMENT_SUCCESS event)
 *  - Manual UTR verification fallback (internal admin usage)
 */
export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, X-Razorpay-Signature, x-webhook-signature');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed. Webhook endpoint only accepts POST.' });
  }

  const webhookSecret = process.env.WEBHOOK_SECRET;
  const razorpaySignature = req.headers['x-razorpay-signature'];
  const cashfreeSignature = req.headers['x-webhook-signature'];

  // ─── HMAC Signature Verification ───────────────────────────────────────────
  if (webhookSecret && (razorpaySignature || cashfreeSignature)) {
    const rawBody = JSON.stringify(req.body);
    const sig = razorpaySignature || cashfreeSignature;

    let signatureValid;
    try {
      signatureValid = verifyRazorpaySignature(rawBody, sig, webhookSecret);
    } catch {
      return res.status(400).json({ error: 'Webhook signature verification failed.' });
    }

    if (!signatureValid) {
      console.warn('[Webhook] Invalid signature received — possible spoofed request.');
      return res.status(401).json({ error: 'Invalid webhook signature.' });
    }
  }

  const payload = req.body;
  if (!payload || typeof payload !== 'object') {
    return res.status(400).json({ error: 'Invalid or empty webhook payload.' });
  }

  // ─── Determine Event Type ───────────────────────────────────────────────────
  // Razorpay sends: { event: 'payment.captured', payload: { payment: { entity: {...} } } }
  // Cashfree sends: { type: 'PAYMENT_SUCCESS', data: { payment: {...} } }
  const eventType = payload.event || payload.type || '';

  let utrId;
  let amountPaise;
  let projectId;
  let providerPaymentId;


  if (eventType === 'payment.captured') {
    // Razorpay payment.captured
    const entity = payload?.payload?.payment?.entity || {};
    utrId = entity.acquirer_data?.upi_transaction_id
      || entity.description
      || entity.id
      || null;
    amountPaise = entity.amount; // amount in paise
    providerPaymentId = entity.id;
    projectId = entity.notes?.project_id || entity.notes?.campaign || null;
  } else if (eventType === 'PAYMENT_SUCCESS' || eventType === 'PAYMENT_CAPTURED') {
    // Cashfree PAYMENT_SUCCESS
    const payment = payload?.data?.payment || {};
    utrId = payment.cf_utr || payment.bank_reference || payment.cf_payment_id || null;
    amountPaise = Math.round((payment.payment_amount || 0) * 100);
    providerPaymentId = payment.cf_payment_id;
    projectId = payload?.data?.order?.order_tags?.project_id || null;
  } else if (payload.utr_id && payload.project_id) {
    // Internal admin manual verification fallback
    utrId = payload.utr_id;
    amountPaise = Math.round((payload.amount || 0) * 100);
    projectId = payload.project_id;
  } else {
    // Unknown event — acknowledge without processing
    console.log(`[Webhook] Unhandled event type: "${eventType}". Acknowledging.`);
    return res.status(200).json({ received: true, processed: false, reason: 'Unhandled event type' });
  }

  if (!utrId) {
    console.warn('[Webhook] Payment confirmed but UTR ID could not be extracted from payload.', payload);
    return res.status(200).json({ received: true, processed: false, reason: 'UTR ID not present in payload' });
  }

  // ─── Update Donation Status in Supabase ────────────────────────────────────
  try {
    const db = getSupabaseAdmin();
    const amountUSD = amountPaise ? Math.round(amountPaise / 85) : null; // paise → INR → USD approx

    // Find the matching pending donation by UTR ID
    const { data: existing, error: findErr } = await db
      .from('donations')
      .select('*')
      .eq('utr_id', utrId)
      .maybeSingle();

    if (findErr) {
      console.error('[Webhook] Supabase lookup error:', findErr);
    }

    if (existing && existing.status !== 'successful') {
      // Update donation status → successful
      const { error: updateErr } = await db
        .from('donations')
        .update({
          status: 'successful',
          provider_payment_id: providerPaymentId || null,
          verified_at: new Date().toISOString()
        })
        .eq('utr_id', utrId);

      if (updateErr) throw updateErr;

      // Raise campaign raised_amount and backer_count
      const resolvedProjectId = projectId || existing.project_id;
      if (resolvedProjectId) {
        const { data: project } = await db
          .from('projects')
          .select('raised_amount, backer_count')
          .eq('id', resolvedProjectId)
          .maybeSingle();

        if (project) {
          const pledgeAmtUSD = amountUSD || Number(existing.amount) || 0;
          await db.from('projects').update({
            raised_amount: Number(project.raised_amount) + pledgeAmtUSD,
            backer_count: Number(project.backer_count) + 1
          }).eq('id', resolvedProjectId);
        }
      }

      console.log(`[Webhook] Donation UTR ${utrId} marked successful. Project: ${projectId || existing?.project_id}`);
      return res.status(200).json({
        received: true,
        processed: true,
        utr_id: utrId,
        status: 'successful',
        message: 'Donation escrow updated to successful'
      });
    }

    if (existing && existing.status === 'successful') {
      // Already verified — idempotent response
      return res.status(200).json({
        received: true,
        processed: false,
        utr_id: utrId,
        reason: 'Donation already marked successful (idempotent)'
      });
    }

    // UTR not found in DB — log and create new record if projectId available
    if (!existing && projectId) {
      const { error: insertErr } = await db.from('donations').insert([{
        project_id: projectId,
        utr_id: utrId,
        amount: amountUSD || 0,
        status: 'successful',
        username: 'Webhook Verified Funder',
        provider_payment_id: providerPaymentId || null,
        verified_at: new Date().toISOString()
      }]);

      if (!insertErr) {
        console.log(`[Webhook] New donation record created for UTR ${utrId} (project: ${projectId})`);
        return res.status(200).json({
          received: true,
          processed: true,
          utr_id: utrId,
          message: 'New donation record created from webhook'
        });
      }
    }

    console.warn(`[Webhook] UTR ${utrId} not found in donations table and no project_id to create record.`);
    return res.status(200).json({
      received: true,
      processed: false,
      utr_id: utrId,
      reason: 'UTR not matched to any existing or creatable donation record'
    });
  } catch (err) {
    console.error('[Webhook] Error processing payment confirmation:', err);
    // Always return 200 to prevent payment gateway retry storms
    return res.status(200).json({
      received: true,
      processed: false,
      error: 'Internal error during processing — will retry on next event'
    });
  }
}
