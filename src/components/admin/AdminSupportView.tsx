'use client';
import { SupportChat } from '@/components/support/SupportChat';
export function AdminSupportView({ previewOwner }: { previewOwner?: string; notify?: (msg: string) => void }) { return <SupportChat admin previewOwner={previewOwner} />; }
