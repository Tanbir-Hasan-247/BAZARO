import {
  FiCheck,
  FiCheckCircle,
  FiCreditCard,
  FiHome,
  FiPackage,
  FiShoppingBag,
  FiTruck,
  FiXCircle,
} from "react-icons/fi";

const TIMELINE_STEPS = [
  { key: "placed", label: "Order Placed", caption: "Reservation recorded", icon: FiShoppingBag },
  { key: "paid", label: "Settled", caption: "Payment authenticated", icon: FiCreditCard },
  { key: "packed", label: "Atelier Packed", caption: "Inspect & sealed", icon: FiPackage },
  { key: "shipped", label: "Dispatched", caption: "Courier en route", icon: FiTruck },
  { key: "delivered", label: "Delivered", caption: "Handed to patron", icon: FiHome },
];

function computeActiveStep(order) {
  const status = order?.status || "Not Paid";
  const paymentStatus = order?.payment_status || "Pending";

  if (status === "Delivered") return 4;
  if (status === "Shipped") return 3;
  if (status === "Ready To Ship" || status === "Processing") return 2;
  if (paymentStatus === "Paid") return 1;
  return 0;
}

const OrderTimelineStepper = ({ order, compact = false }) => {
  if (!order) return null;

  if (order.status === "Canceled") {
    return (
      <div className="rounded-2xl border border-red-200 bg-red-50/80 px-4 py-3 flex items-center gap-3 text-xs text-red-800">
        <FiXCircle className="w-4 h-4 shrink-0 text-red-700" />
        <div>
          <p className="font-semibold uppercase tracking-[0.14em] text-[10px]">
            Order Canceled
          </p>
          <p className="text-[11px] text-red-700/90 mt-0.5">
            This reservation was canceled and inventory restored
            {order.payment_status === "Refunded" ? " (Refunded)" : ""}.
          </p>
        </div>
      </div>
    );
  }

  const currentStep = computeActiveStep(order);

  return (
    <div className={compact ? "pt-2" : "py-2"}>
      <ol
        aria-label="Order fulfillment timeline"
        className="grid grid-cols-1 sm:grid-cols-5 gap-3 sm:gap-2"
      >
        {TIMELINE_STEPS.map((step, idx) => {
          const Icon = step.icon;
          const isCompleted = idx <= currentStep;
          const isCurrent = idx === currentStep;

          return (
            <li key={step.key} className="relative flex sm:flex-col items-center sm:items-start gap-3 sm:gap-2">
              <div className="flex items-center gap-2 w-auto sm:w-full">
                <span
                  className={`w-8 h-8 rounded-full flex items-center justify-center border shrink-0 transition-colors ${
                    isCurrent
                      ? "bg-[#1A1512] text-[#E5C77A] border-[#C59B4B] ring-2 ring-[#C59B4B]/25"
                      : isCompleted
                        ? "bg-[#C59B4B] text-[#14100D] border-[#C59B4B]"
                        : "bg-[#FAF5EB] text-[#9A8C78] border-[#C59B4B]/25"
                  }`}
                >
                  {idx < currentStep ? (
                    <FiCheck className="w-3.5 h-3.5" />
                  ) : (
                    <Icon className="w-3.5 h-3.5" />
                  )}
                </span>

                {idx < TIMELINE_STEPS.length - 1 && (
                  <span
                    aria-hidden="true"
                    className={`hidden sm:block h-[2px] flex-1 rounded-full ${
                      idx < currentStep ? "bg-[#C59B4B]" : "bg-[#C59B4B]/20"
                    }`}
                  />
                )}
              </div>

              <div className="min-w-0">
                <p
                  className={`text-[11px] font-semibold uppercase tracking-[0.14em] ${
                    isCompleted ? "text-[#1F1916]" : "text-[#8C7D6B]"
                  }`}
                >
                  {step.label}
                </p>
                {!compact && (
                  <p className="text-[11px] text-[#6E5F50] mt-0.5">{step.caption}</p>
                )}
              </div>
            </li>
          );
        })}
      </ol>

      {!compact && (
        <div className="mt-4 pt-3 border-t border-[#C59B4B]/18 flex flex-wrap items-center justify-between gap-2 text-[11px] text-[#6E5F50]">
          <span className="inline-flex items-center gap-1.5">
            <FiCheckCircle className="text-[#8E6A28]" />
            Current milestone:{" "}
            <strong className="text-[#1F1916]">{TIMELINE_STEPS[currentStep].label}</strong>
          </span>
          {order.updated_at && (
            <span className="bazaro-tabular">
              Last updated: {new Date(order.updated_at).toLocaleString()}
            </span>
          )}
        </div>
      )}
    </div>
  );
};

export default OrderTimelineStepper;
