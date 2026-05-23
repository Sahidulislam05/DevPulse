export const isValidEmail = (email: string): boolean => {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
};

export const isValidRole = (role: string): boolean => {
  return ["contributor", "maintainer"].includes(role);
};

export const isValidType = (type: string): boolean => {
  return ["bug", "feature_request"].includes(type);
};

export const isValidStatus = (status: string): boolean => {
  return ["open", "in_progress", "resolved"].includes(status);
};
