export function printReceipt(html) {
  if (typeof window === "undefined") return;
  const area = document.getElementById("printArea");
  if (!area) return;
  area.innerHTML = html;
  window.print();
}

function esc(s) {
  return String(s == null ? "" : s).replace(
    /[&<>"']/g,
    (c) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[
        c
      ],
  );
}

export function buildBillReceiptHTML({ settings, order, totals }) {
  const dateStr = new Date(order.paidAt || Date.now()).toLocaleString(
    undefined,
    {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    },
  );

  const deliveryLine =
    totals.delivery > 0
      ? `<div class="rc-row"><span>Delivery</span><span>Rs ${totals.delivery.toLocaleString()}</span></div>`
      : "";

  return `<div class="receipt-paper">
    <div class="rc-center">
      <h2>${esc(settings?.restaurantName || "My Restaurant")}</h2>
      ${settings?.tagline ? esc(settings.tagline) + "<br>" : ""}
      ${settings?.address ? esc(settings.address) + "<br>" : ""}
      ${settings?.phone ? esc(settings.phone) : ""}
    </div>
    <hr>
    <div class="rc-row"><span>Bill #:</span><span>${esc(order.billNumber || "—")}</span></div>
    <div class="rc-row"><span>Table:</span><span>${esc(order.tableName || order.type)}</span></div>
    <div class="rc-row"><span>Date:</span><span>${dateStr}</span></div>
    <hr>
    ${order.items
      .map(
        (it) =>
          `<div class="rc-row"><span>${it.qty} x ${esc(it.name)}</span><span>Rs ${(it.price * it.qty).toLocaleString()}</span></div>`,
      )
      .join("")}
    <hr>
    <div class="rc-row"><span>Subtotal</span><span>Rs ${totals.subtotal.toLocaleString()}</span></div>
    <div class="rc-row"><span>Discount</span><span>-Rs ${totals.discount.toLocaleString()}</span></div>
    <div class="rc-row"><span>Tax</span><span>Rs ${totals.tax.toLocaleString()}</span></div>
    <div class="rc-row"><span>Service</span><span>Rs ${totals.service.toLocaleString()}</span></div>
    ${deliveryLine}
    <hr>
    <div class="rc-row" style="font-weight:700;"><span>GRAND TOTAL</span><span>Rs ${totals.total.toLocaleString()}</span></div>
    ${order.payment?.method ? `<div class="rc-row"><span>Payment</span><span>${esc(order.payment.method)}</span></div>` : ""}
    <hr>
    <div class="rc-center">${esc(settings?.footerNote || "Thank you for dining with us!")}</div>
  </div>`;
}

export function buildKotReceiptHTML({ settings, order }) {
  return `<div class="receipt-paper">
    <div class="rc-center">
      <h2>KITCHEN ORDER TICKET</h2>
      ${esc(settings?.restaurantName || "")}
    </div>
    <hr>
    <div class="rc-row"><span>Table/Order:</span><span>${esc(order.tableName || order.type)}</span></div>
    <div class="rc-row"><span>Type:</span><span>${esc(order.type)}</span></div>
    <hr>
    ${order.items.map((it) => `<div class="rc-row"><span>${it.qty} x ${esc(it.name)}</span></div>`).join("")}
    <hr>
    <div class="rc-center">Prepared by kitchen — ${esc(settings?.restaurantName || "My Restaurant")}</div>
  </div>`;
}
