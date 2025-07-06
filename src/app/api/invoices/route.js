import { NextResponse } from 'next/server';
import { auth } from "@/app/auth"; // Import the auth helper for v5

export async function POST(req) {
  const session = await auth(); // Use the auth() helper to get the session in v5
  if (!session) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  try {
    const token = session.laravelApiToken;
    const invoiceData = await req.json();

    // Basic validation
    if (!invoiceData.partner_id || !invoiceData.net_amount || !invoiceData.total || !invoiceData.brand_name || !invoiceData.start_date || !invoiceData.end_date) {
      return NextResponse.json({ message: "Missing required fields" }, { status: 400 });
    }

    // TODO: Implement invoice creation logic here
    // This is a placeholder - replace with your actual database or API call
    

    return NextResponse.json({ message: "Invoice created successfully", data: invoiceData }, { status: 201 });

  } catch (error) {
    console.error("Error creating invoice:", error);
    return NextResponse.json({ message: "Error creating invoice" }, { status: 500 });
  }
}

export async function GET(request) {
  try {
    const token = request.headers.get('Authorization')?.split(' ')[1];

    if (!token) {
      return NextResponse.json({ error: 'No token provided' }, { status: 401 });
    }

    // TODO: Implement invoice fetching logic here
    // This is a placeholder - replace with your actual database or API call
    const invoicesData = [{id: 1, is_paid: true, net_amount: 100, total: 120, brand_name: "Test Brand", start_date: "2024-01-01", end_date: "2024-01-31"}];
    return NextResponse.json(invoicesData);
  } catch (error) {
    console.error('Error fetching invoices from API:', error);
    return NextResponse.json({ error: 'Failed to fetch invoices' }, { status: 500 });
  }
}
