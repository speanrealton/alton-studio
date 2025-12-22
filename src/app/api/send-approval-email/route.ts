// src/app/api/send-approval-email/route.ts
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    console.log('📧 API Route: Email request received');
    
    const body = await request.json();
    const { email, displayName, status, reviewNotes } = body;

    console.log('📧 API Route: Parsed data:', { email, displayName, status });

    // Validation
    if (!email || !displayName || !status) {
      console.error('❌ API Route: Missing required fields');
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Check Brevo API key
    if (!process.env.BREVO_API_KEY) {
      console.error('❌ API Route: Missing Brevo API key');
      return NextResponse.json(
        { error: 'Email service not configured. Add BREVO_API_KEY to .env' },
        { status: 500 }
      );
    }

    console.log('✅ API Route: Brevo API key found');

    // Choose email content based on status
    let subject = '';
    let htmlContent = '';
    let actionUrl = '';

    if (status === 'approved') {
      subject = '🎉 Congratulations! You\'re now an Alton Stock Contributor';
      actionUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/contributor/dashboard`;
      
      htmlContent = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Welcome to Alton Stock!</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f9fafb;">
  <div style="max-width: 600px; margin: 0 auto; padding: 40px 20px;">
    <div style="text-align: center; margin-bottom: 40px;">
      <h1 style="color: #7c3aed; font-size: 32px; margin: 0;">Alton Stock</h1>
    </div>

    <div style="background: white; border-radius: 16px; padding: 40px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
      <div style="text-align: center; margin-bottom: 30px;">
        <div style="display: inline-block; background: #f3e8ff; border-radius: 50%; padding: 20px;">
          <span style="font-size: 48px;">🎉</span>
        </div>
      </div>

      <h2 style="color: #111827; font-size: 24px; margin: 0 0 16px 0;">Hey ${displayName}!</h2>
      
      <p style="color: #374151; font-size: 16px; line-height: 1.6; margin: 0 0 24px 0;">
        Great news! Your application to become an <strong>Alton Stock Contributor</strong> has been <span style="color: #10b981; font-weight: bold;">APPROVED</span>!
      </p>

      <p style="color: #374151; font-size: 16px; line-height: 1.6; margin: 0 0 32px 0;">
        You can now start uploading your designs and sharing your creativity with our community.
      </p>

      <div style="background: #f9fafb; border-left: 4px solid #7c3aed; padding: 20px; margin-bottom: 32px; border-radius: 8px;">
        <h3 style="color: #7c3aed; font-size: 18px; margin: 0 0 16px 0;">🚀 NEXT STEPS:</h3>
        <ul style="color: #374151; font-size: 15px; line-height: 1.8; margin: 0; padding-left: 20px;">
          <li>Access your contributor dashboard</li>
          <li>Upload your first designs (150-200 recommended)</li>
          <li>Read our contributor guidelines</li>
          <li>Start earning from downloads</li>
        </ul>
      </div>

      <div style="text-align: center; margin-bottom: 32px;">
        <a href="${actionUrl}" style="display: inline-block; background: #7c3aed; color: white; text-decoration: none; padding: 16px 32px; border-radius: 8px; font-weight: 600; font-size: 16px;">
          Get Started Now →
        </a>
      </div>

      <p style="color: #6b7280; font-size: 14px; line-height: 1.6; margin: 0; text-align: center;">
        Need help? Contact our support team anytime.
      </p>
    </div>

    <div style="text-align: center; margin-top: 32px; color: #9ca3af; font-size: 12px;">
      <p style="margin: 0 0 8px 0;">Welcome aboard! 🚀</p>
      <p style="margin: 0;">The Alton Stock Team</p>
      <p style="margin: 16px 0 0 0;">© ${new Date().getFullYear()} Alton Stock. All rights reserved.</p>
    </div>
  </div>
</body>
</html>
      `;
    } else if (status === 'rejected') {
      subject = 'Update on Your Alton Stock Application';
      actionUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/contributor/apply`;
      
      htmlContent = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Application Update</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f9fafb;">
  <div style="max-width: 600px; margin: 0 auto; padding: 40px 20px;">
    <div style="text-align: center; margin-bottom: 40px;">
      <h1 style="color: #7c3aed; font-size: 32px; margin: 0;">Alton Stock</h1>
    </div>

    <div style="background: white; border-radius: 16px; padding: 40px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
      <h2 style="color: #111827; font-size: 24px; margin: 0 0 16px 0;">Hi ${displayName},</h2>
      
      <p style="color: #374151; font-size: 16px; line-height: 1.6; margin: 0 0 24px 0;">
        Thank you for your interest in becoming an Alton Stock contributor.
      </p>

      <p style="color: #374151; font-size: 16px; line-height: 1.6; margin: 0 0 24px 0;">
        After careful review, we're unable to approve your application at this time. However, we encourage you to apply again in the future as you continue to develop your portfolio.
      </p>

      ${reviewNotes ? `
      <div style="background: #fef3c7; border-left: 4px solid #f59e0b; padding: 20px; margin-bottom: 32px; border-radius: 8px;">
        <h3 style="color: #92400e; font-size: 16px; margin: 0 0 12px 0;">REVIEWER NOTES:</h3>
        <p style="color: #78350f; font-size: 15px; line-height: 1.6; margin: 0; white-space: pre-wrap;">${reviewNotes}</p>
      </div>
      ` : ''}

      <div style="background: #f9fafb; border-left: 4px solid #7c3aed; padding: 20px; margin-bottom: 32px; border-radius: 8px;">
        <h3 style="color: #7c3aed; font-size: 18px; margin: 0 0 16px 0;">WHAT YOU CAN DO:</h3>
        <ul style="color: #374151; font-size: 15px; line-height: 1.8; margin: 0; padding-left: 20px;">
          <li>Review our contributor guidelines</li>
          <li>Build your portfolio with more diverse work</li>
          <li>Reapply after 30 days</li>
        </ul>
      </div>

      <div style="text-align: center; margin-bottom: 32px;">
        <a href="${actionUrl}" style="display: inline-block; background: #7c3aed; color: white; text-decoration: none; padding: 16px 32px; border-radius: 8px; font-weight: 600; font-size: 16px;">
          Apply Again →
        </a>
      </div>

      <p style="color: #6b7280; font-size: 14px; line-height: 1.6; margin: 0; text-align: center;">
        Questions? Contact us through our support page.
      </p>
    </div>

    <div style="text-align: center; margin-top: 32px; color: #9ca3af; font-size: 12px;">
      <p style="margin: 0 0 8px 0;">Best regards,</p>
      <p style="margin: 0;">The Alton Stock Team</p>
      <p style="margin: 16px 0 0 0;">© ${new Date().getFullYear()} Alton Stock. All rights reserved.</p>
    </div>
  </div>
</body>
</html>
      `;
    }

    console.log('📧 API Route: Sending via Brevo to:', email);
    console.log('📧 API Route: From:', 'kadrixdeno2004@gmail.com');

    // Send email using Brevo API
    const brevoResponse = await fetch('https://api.brevo.com/v3/smtp/email', {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'api-key': process.env.BREVO_API_KEY!
      },
      body: JSON.stringify({
        sender: {
          name: 'Alton Stock',
          email: 'kadrixdeno2004@gmail.com' // MUST be verified in Brevo!
        },
        to: [
          {
            email: email,
            name: displayName
          }
        ],
        subject: subject,
        htmlContent: htmlContent
      })
    });

    const brevoData = await brevoResponse.json();

    console.log('📧 Brevo Response Status:', brevoResponse.status);
    console.log('📧 Brevo Response Data:', JSON.stringify(brevoData, null, 2));

    if (!brevoResponse.ok) {
      console.error('❌ Brevo API Error:', brevoData);
      
      // Return detailed error message
      return NextResponse.json(
        { 
          error: `Brevo API Error: ${brevoData.message || 'Unknown error'}`,
          details: brevoData,
          status: brevoResponse.status
        },
        { status: 500 }
      );
    }

    console.log('✅ API Route: Email sent successfully!', brevoData);

    return NextResponse.json({ 
      success: true, 
      message: 'Email sent successfully',
      messageId: brevoData.messageId
    });

  } catch (error: any) {
    console.error('❌ API Route: Unexpected error:', error);
    return NextResponse.json(
      { 
        error: error.message || 'Failed to send email',
        details: error.toString()
      },
      { status: 500 }
    );
  }
}