'use client';
import { SupportChat } from '@/components/support/SupportChat';
export function AdminSupportView({ notify }: { notify?: (msg: string) => void }) { return <SupportChat admin />; }
