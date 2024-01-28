'use server';

import { sql } from '@vercel/postgres';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { z } from 'zod';

const FormSchema = z.object({
  id: z.string(),
  customerId: z.string(),
  amount: z.coerce.number(),
  status: z.enum(['pending', 'paid']),
  date: z.date(),
});

const CreateActionSchema = FormSchema.omit({ id: true, date: true });

export async function createInvoice(formData: FormData) {
  // Easiest way but not IntelliSense
  // const rawFormData = Object.fromEntries(formData.entries());

  // IntelliSense
  const { customerId, amount, status } = CreateActionSchema.parse({
    customerId: formData.get('customerId'),
    amount: formData.get('amount'),
    status: formData.get('status'),
  });

  const amountInCents = amount * 100;
  const date = new Date().toISOString().split('T')[0];

  await sql`
  INSERT INTO invoices (customer_id, amount, status, date) 
  VALUES (${customerId}, ${amountInCents}, ${status}, ${date})
  `;

  const redirectPath = '/dashboard/invoices';

  revalidatePath(redirectPath);
  redirect(redirectPath);
}

const UpdateInvoiceSchema = FormSchema.omit({ id: true, date: true });

export async function UpdateInvoice(id: string, formData: FormData) {
  const { customerId, amount, status } = UpdateInvoiceSchema.parse({
    customerId: formData.get('customerId'),
    amount: formData.get('amount'),
    status: formData.get('status'),
  });

  const amountInCents = amount * 100;

  await sql`
  UPDATE invoices 
  SET customer_id = ${customerId}, amount = ${amountInCents}, status = ${status}
  WHERE id = ${id}
  `;

  const redirectPath = '/dashboard/invoices';

  revalidatePath(redirectPath);
  redirect(redirectPath);
}

export async function deleteInvoice(id: string) {
  await sql`
  DELETE FROM invoice WHERE id = ${id}
  `;
  revalidatePath('/dashboard/invoices');
}
