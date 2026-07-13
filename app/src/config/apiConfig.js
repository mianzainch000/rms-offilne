export const apiConfig = {
  baseUrl: process.env.NEXT_PUBLIC_BASE_URL,

  signup: "signup",
  login: "login",
  forgotPassword: "forgotPassword",
  resetPassword: "resetPassword",

  getTables: "getTables",
  addTable: "addTable",
  updateTable: "updateTable",
  deleteTable: "deleteTable",

  getMenuItems: "getMenuItems",
  addMenuItem: "addMenuItem",
  updateMenuItem: "updateMenuItem",
  deleteMenuItem: "deleteMenuItem",

  getOrders: "getOrders",
  createOrder: "createOrder",
  updateOrder: "updateOrder",
  sendToKitchen: "sendToKitchen",
  payOrder: "payOrder",
  cancelOrder: "cancelOrder",

  getCurrentShift: "getCurrentShift",
  getShifts: "getShifts",
  openShift: "openShift",
  closeShift: "closeShift",

  allUsers: "allUsers",
  addUser: "addUser",
  updateUser: "updateUser",
  deleteUser: "deleteUser",

  getExpenses: "getExpenses",
  addExpense: "addExpense",
  updateExpense: "updateExpense",
  deleteExpense: "deleteExpense",

  getExpenseCategories: "getExpenseCategories",
  addExpenseCategory: "addExpenseCategory",
  updateExpenseCategory: "updateExpenseCategory",
  deleteExpenseCategory: "deleteExpenseCategory",
};
