// FILE: src/lib/services/test-resend.js
const { Resend } = require('resend');
require('dotenv').config({ path: '.env.local' });

const apiKey = process.env.RESEND_API_KEY || process.env.NEXT_RESEND_API_KEY;
const fromEmail = process.env.RESEND_FROM_EMAIL || process.env.NEXT_RESEND_FROM_EMAIL || 'onboarding@resend.dev';

const resend = new Resend(apiKey);

async function test() {
  console.log('Testing Resend with API Key:', apiKey?.slice(0, 10) + '...');
  console.log('From Email:', fromEmail);
  
  try {
    const { data, error } = await resend.emails.send({
      from: fromEmail,
      to: 'delivered@resend.dev', // Resend's test recipient
      subject: 'Novara Test',
      html: '<p>Test successful!</p>',
    });

    if (error) {
      console.error('Resend Error:', error);
    } else {
      console.log('Success! Email ID:', data.id);
    }
  } catch (err) {
    console.error('Exception:', err);
  }
}

test();
