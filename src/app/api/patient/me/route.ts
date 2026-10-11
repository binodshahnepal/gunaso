import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export async function GET() {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('patient_token')?.value;

    if (!token) {
      return NextResponse.json({ success: false, patient: null });
    }

    const patientData = JSON.parse(token);
    return NextResponse.json({ success: true, patient: patientData });
  } catch (error) {
    return NextResponse.json({ success: false, patient: null });
  }
}
