"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { QRCodeSVG } from "qrcode.react";
import { Check, Copy, QrCode } from "lucide-react";
import { track } from "@/lib/analytics";

export default function InviteCard({ roomCode }: { roomCode: string }) {
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const [inviteUrl, setInviteUrl] = useState("");

  useEffect(() => {
    setInviteUrl(`${window.location.origin}/?room=${roomCode}`);
  }, [roomCode]);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(inviteUrl || roomCode);
      track("invite_copy", { room_code: roomCode }); // 바이럴: 초대 링크 복사
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1500);
    } catch {
      /* clipboard 미지원 무시 */
    }
  };

  return (
    <div className="rounded-2xl border border-white/10 bg-booze-card/60 p-3">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-[11px] text-white/40">초대 코드</p>
          <p className="tabular text-xl font-black tracking-[0.2em] text-booze-neon">
            {roomCode}
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={copy}
            className="flex items-center gap-1 rounded-xl border border-white/15 px-3 py-2 text-xs font-semibold text-white/70 transition hover:bg-white/5"
          >
            {copied ? (
              <>
                <Check size={13} /> 복사됨
              </>
            ) : (
              <>
                <Copy size={13} /> 링크
              </>
            )}
          </button>
          <button
            onClick={() => {
              if (!open) track("invite_qr_open", { room_code: roomCode });
              setOpen((v) => !v);
            }}
            className="flex items-center gap-1 rounded-xl border border-white/15 px-3 py-2 text-xs font-semibold text-white/70 transition hover:bg-white/5"
          >
            <QrCode size={13} /> QR
          </button>
        </div>
      </div>

      <AnimatePresence>
        {open && inviteUrl && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <div className="mt-3 flex flex-col items-center gap-2 border-t border-white/10 pt-3">
              <div className="rounded-xl bg-white p-3">
                <QRCodeSVG value={inviteUrl} size={140} />
              </div>
              <p className="text-[11px] text-white/40">
                친구에게 QR을 보여주면 바로 입장
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
