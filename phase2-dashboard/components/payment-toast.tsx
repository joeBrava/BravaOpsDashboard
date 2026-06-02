export function PaymentToast({ message }: { message: string }) {
  return (
    <div className="mt-[18px] flex items-center gap-[10px] rounded-[13px] border border-[#e2ea9e] bg-[#f1f5ce] px-4 py-3 text-[0.84rem] font-medium text-[#5c6a00]">
      {message}
    </div>
  );
}
