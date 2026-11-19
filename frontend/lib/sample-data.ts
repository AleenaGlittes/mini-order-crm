
export type Order = {
  id: string;
  customer: string;
  email: string;
  date: string;
  amount: number;
  currency: string;
  paymentStatus: "Paid" | "Pending" | "Refunded";
  fulfillmentStatus: "Fulfilled" | "Unfulfilled" | "Partially Fulfilled";
  items: number;
};

export const orders: Order[] = [
  {
    id: "#1001",
    customer: "Olivia Martin",
    email: "olivia@example.com",
    date: "2026-11-19",
    amount: 2499,
    currency: "INR",
    paymentStatus: "Paid",
    fulfillmentStatus: "Fulfilled",
    items: 2,
  },
  {
    id: "#1002",
    customer: "Jackson Lee",
    email: "jackson@example.com",
    date: "2026-11-18",
    amount: 1599,
    currency: "INR",
    paymentStatus: "Pending",
    fulfillmentStatus: "Unfulfilled",
    items: 1,
  },
  {
    id: "#1003",
    customer: "Isabella Nguyen",
    email: "isabella@example.com",
    date: "2026-11-18",
    amount: 4299,
    currency: "INR",
    paymentStatus: "Paid",
    fulfillmentStatus: "Fulfilled",
    items: 3,
  },
  {
    id: "#1004",
    customer: "William Kim",
    email: "william@example.com",
    date: "2026-11-17",
    amount: 899,
    currency: "INR",
    paymentStatus: "Refunded",
    fulfillmentStatus: "Unfulfilled",
    items: 1,
  },
  {
    id: "#1005",
    customer: "Sofia Davis",
    email: "sofia@example.com",
    date: "2026-11-16",
    amount: 3299,
    currency: "INR",
    paymentStatus: "Paid",
    fulfillmentStatus: "Partially Fulfilled",
    items: 2,
  },
  {
    id: "#1006",
    customer: "Noah Wilson",
    email: "noah@example.com",
    date: "2026-11-15",
    amount: 1899,
    currency: "INR",
    paymentStatus: "Paid",
    fulfillmentStatus: "Fulfilled",
    items: 2,
  },
  {
    id: "#1007",
    customer: "Emma Brown",
    email: "emma@example.com",
    date: "2026-11-14",
    amount: 5499,
    currency: "INR",
    paymentStatus: "Pending",
    fulfillmentStatus: "Unfulfilled",
    items: 4,
  },
  {
    id: "#1008",
    customer: "James Taylor",
    email: "james@example.com",
    date: "2026-11-13",
    amount: 1299,
    currency: "INR",
    paymentStatus: "Paid",
    fulfillmentStatus: "Fulfilled",
    items: 1,
  },
];

export const dashboardStats = [
  {
    title: "Total Orders",
    value: "1,284",
    change: "+12.5%",
    description: "Compared to last month",
  },
  {
    title: "Total Revenue",
    value: "₹8,42,500",
    change: "+18.2%",
    description: "Compared to last month",
  },
  {
    title: "Pending Orders",
    value: "48",
    change: "-4.3%",
    description: "Compared to last month",
  },
  {
    title: "Fulfilled Orders",
    value: "1,092",
    change: "+8.4%",
    description: "Compared to last month",
  },
];

export const revenueData = [
  { month: "Jun", revenue: 32000 },
  { month: "Jul", revenue: 45000 },
  { month: "Aug", revenue: 38000 },
  { month: "Sep", revenue: 55000 },
  { month: "Oct", revenue: 48000 },
  { month: "Nov", revenue: 72000 },
];
