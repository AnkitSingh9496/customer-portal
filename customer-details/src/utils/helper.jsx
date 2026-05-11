//customer-details\src\utils\helper.jsx
export const formatDate = (date) => {
  return new Date(date).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
};

export const getStatus = (registeredDate) => {
  const registeredYear = new Date(registeredDate).getFullYear();
  const currentYear = new Date().getFullYear();
  const yearDifference = currentYear - registeredYear;
  return yearDifference <= 10 ? "Active" : "Inactive";
};
