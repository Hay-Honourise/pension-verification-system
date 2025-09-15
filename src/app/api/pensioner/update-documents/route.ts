import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { verifyToken } from '@/lib/auth';
import fs from 'fs';
import path from 'path';

export const runtime = 'nodejs';

const ensureDir = (dirPath: string) => {
  if (!fs.existsSync(dirPath)) fs.mkdirSync(dirPath, { recursive: true });
};

const saveFile = async (file: File, destDir: string, baseName: string) => {
  const arrayBuffer = await file.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);
  const ext = path.extname(file.name) || '';
  const safeExt = ['.pdf', '.png', '.jpg', '.jpeg'].includes(ext.toLowerCase()) ? ext.toLowerCase() : '';
  if (!safeExt) throw new Error('Invalid file type');
  const fileName = `${baseName}${safeExt}`;
  const outPath = path.join(destDir, fileName);
  await fs.promises.writeFile(outPath, buffer);
  return outPath;
};

export async function PUT(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    const bearer = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : null;
    const tokenPayload = bearer ? verifyToken(bearer) : null;

    const form = await request.formData();
    const id = form.get('id') as string;

    if (!id) return NextResponse.json({ message: 'Missing pensioner id' }, { status: 400 });
    if (tokenPayload && tokenPayload.id && Number(tokenPayload.id) !== Number(id)) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const allowed = ['application/pdf', 'image/png', 'image/jpeg'];
    const maybeFiles = {
      idCard: form.get('idCard') as File | null,
      birthCert: form.get('birthCert') as File | null,
      appointment: form.get('appointment') as File | null,
      retirement: form.get('retirement') as File | null,
    };

    const publicDir = path.join(process.cwd(), 'public');
    const destDir = path.join(publicDir, 'uploads', 'pensioners', id);
    ensureDir(destDir);

    const updates: Record<string, string> = {};

    const entries = Object.entries(maybeFiles) as [keyof typeof maybeFiles, File | null][];
    for (const [key, file] of entries) {
      if (file && allowed.includes(file.type)) {
        const savedPath = await saveFile(file, destDir, `${key}-${id}-${Date.now()}`);
        const publicPath = savedPath.replace(publicDir, '');
        // store as URL path
        updates[key] = publicPath.replace(/\\/g, '/');
      }
    }

    // Persist document paths directly on Pensioner if fields exist; otherwise, store as Document entries
    let documents: any = {};
    if (Object.keys(updates).length > 0) {
      try {
        const updated = await prisma.pensioner.update({
          where: { id: Number(id) },
          data: {
            // @ts-ignore schema may include these optional fields
            idCard: updates.idCard,
            // @ts-ignore
            birthCert: updates.birthCert,
            // @ts-ignore
            appointment: updates.appointment,
            // @ts-ignore
            retirement: updates.retirement,
          },
          select: { id: true, /* @ts-ignore */ idCard: true, /* @ts-ignore */ birthCert: true, /* @ts-ignore */ appointment: true, /* @ts-ignore */ retirement: true },
        });
        documents = {
          // @ts-ignore
          idCard: updated.idCard || null,
          // @ts-ignore
          birthCert: updated.birthCert || null,
          // @ts-ignore
          appointment: updated.appointment || null,
          // @ts-ignore
          retirement: updated.retirement || null,
        };
      } catch {
        // Fallback: create Document rows if direct fields are not present
        const ops: Promise<any>[] = [];
        for (const [key, filePath] of Object.entries(updates)) {
          ops.push(
            prisma.document.create({
              data: {
                pensionerId: Number(id),
                documentType: key,
                fileName: path.basename(filePath),
                filePath,
                status: 'pending',
              },
            })
          );
        }
        await Promise.all(ops);
        documents = updates;
      }
    }

    return NextResponse.json({ message: 'Documents updated', documents }, { status: 200 });
  } catch (err: any) {
    console.error('[update-documents] error', err);
    return NextResponse.json({ message: 'Failed to update documents' }, { status: 500 });
  }
}


