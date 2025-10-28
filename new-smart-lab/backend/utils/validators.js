const isValidEmail = (email) => {
  return /^\S+@\S+\.\S+$/.test(email);
};

module.exports = { isValidEmail };
